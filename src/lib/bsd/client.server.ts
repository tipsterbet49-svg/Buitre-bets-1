import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PICKS as FALLBACK } from "@/data/picks";
import type { PickItem } from "@/lib/pick-types";
import {
  ALLOWED_LEAGUES,
  buildPick,
  isPlayableStatus,
  type BsdH2H,
  type BsdPrediction,
  type EventExtra,
} from "@/lib/bsd/engine";
import { flattenStandings, toTableSnap, type StandingRow } from "@/lib/bsd/standings";
import {
  fillBook,
  fromSlim,
  marketOdd,
  parseOddsRows,
  pinTriple,
  type OddsBook,
  type OddsRow,
  type SlimOdds,
} from "@/lib/bsd/odds-book";
import { applyPinnacle } from "@/lib/odds-api/client.server";
import { artToday } from "@/lib/art-time";
import { crestUrl, hydrateCrests } from "@/lib/crests";

const BASE = "https://sports.bzzoiro.com/api/v2";
const TOKEN = process.env.BSD_API_TOKEN ?? "";
const CACHE_VER = 17;
const DISK = join(process.cwd(), ".cache", "last-picks.json");

type Cache = {
  ver: number;
  at: number;
  picks: PickItem[];
  source: "bsd" | "fallback";
  error?: string;
};
let cache: Cache | null = null;
let lastGood: Cache | null = null;
let cooldownUntil = 0;
const TTL_MS = 15 * 60 * 1000;

class BsdHttpError extends Error {
  status: number;
  retryAfterMs: number;
  constructor(status: number, path: string, retryAfterMs: number, code?: string) {
    super(code === "taster_exhausted" ? quotaMessage(retryAfterMs) : `BSD ${status} ${path}`);
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

function quotaMessage(retryAfterMs: number) {
  const when = new Date(Date.now() + Math.max(retryAfterMs, 60_000));
  const clock = when.toLocaleTimeString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `Cupo diario del feed agotado. Se renueva a las ${clock} (Argentina).`;
}

function addDays(ymd: string, n: number) {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

function parseRetryAfter(res: Response): number {
  const h = res.headers.get("retry-after");
  const n = Number(h);
  if (Number.isFinite(n) && n > 0) return n * 1000;
  const rl = res.headers.get("ratelimit") ?? "";
  const t = /t=(\d+)/.exec(rl);
  if (t) return Number(t[1]) * 1000;
  return 5 * 60 * 1000;
}

async function bsd<T>(path: string): Promise<T> {
  if (Date.now() < cooldownUntil) {
    throw new BsdHttpError(429, path, cooldownUntil - Date.now(), "taster_exhausted");
  }
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Token ${TOKEN}` },
    signal: AbortSignal.timeout(15000),
  });
  if (res.status === 429) {
    const wait = parseRetryAfter(res);
    cooldownUntil = Date.now() + wait;
    let code = "taster_exhausted";
    try {
      const body = (await res.json()) as { code?: string };
      if (body.code) code = body.code;
    } catch {
      /* ignore */
    }
    throw new BsdHttpError(429, path, wait, code);
  }
  if (!res.ok) throw new Error(`BSD ${res.status} ${path}`);
  return (await res.json()) as T;
}

function readDisk(): Cache | null {
  try {
    const raw = JSON.parse(readFileSync(DISK, "utf8")) as {
      at?: number;
      picks?: PickItem[];
      source?: "bsd" | "fallback";
    };
    if (!Array.isArray(raw.picks) || raw.picks.length === 0) return null;
    return {
      ver: CACHE_VER,
      at: raw.at ?? 0,
      picks: raw.picks,
      source: raw.source === "bsd" ? "bsd" : "fallback",
    };
  } catch {
    return null;
  }
}

function writeDisk(row: Cache) {
  try {
    mkdirSync(join(process.cwd(), ".cache"), { recursive: true });
    writeFileSync(
      DISK,
      JSON.stringify({ at: row.at, picks: row.picks, source: row.source }),
    );
  } catch {
    /* disk optional */
  }
}

function asFallback(): PickItem[] {
  return lastGood?.picks?.length ? lastGood.picks : (readDisk()?.picks ?? FALLBACK);
}

function serveStale(error?: string): {
  picks: PickItem[];
  source: "bsd" | "fallback";
  generatedAt: string;
  error?: string;
} {
  const stale = lastGood ?? readDisk();
  const picks = stale?.picks?.length ? stale.picks : FALLBACK;
  const at = stale?.at || Date.now();
  cache = {
    ver: CACHE_VER,
    at: Date.now(),
    picks,
    source: "fallback",
    error,
  };
  return {
    picks,
    source: "fallback",
    generatedAt: new Date(at).toISOString(),
    error,
  };
}

type Page<T> = { count: number; next: string | null; results: T[] };

async function allPredictions(from: string, to: string) {
  const out: BsdPrediction[] = [];
  let offset = 0;
  for (let i = 0; i < 4; i++) {
    const page = await bsd<Page<BsdPrediction>>(
      `/predictions/?date_from=${from}&date_to=${to}&limit=100&offset=${offset}`,
    );
    out.push(...page.results);
    if (!page.next) break;
    offset += 100;
  }
  return out;
}

type EventRow = {
  id: number;
  league_id: number;
  status: string;
  home_team_id?: number;
  away_team_id?: number;
  referee_id?: number | null;
  home_score?: number | null;
  away_score?: number | null;
  home_score_ht?: number | null;
  away_score_ht?: number | null;
  current_minute?: number | null;
  head_to_head?: BsdH2H | null;
  weather?: {
    description?: string | null;
    temperature_c?: number | null;
    wind_speed?: number | null;
  } | null;
  is_local_derby?: boolean;
  is_neutral_ground?: boolean;
  round_label?: string | null;
};

async function eventsByWindow(from: string, to: string) {
  const map = new Map<number, EventExtra>();
  let offset = 0;
  for (let i = 0; i < 3; i++) {
    const page = await bsd<Page<EventRow>>(
      `/events/?date_from=${from}&date_to=${to}&limit=200&offset=${offset}`,
    );
    for (const ev of page.results) {
      map.set(ev.id, {
        h2h: ev.head_to_head,
        homeScore: ev.home_score ?? null,
        awayScore: ev.away_score ?? null,
        homeScoreHt: ev.home_score_ht ?? null,
        awayScoreHt: ev.away_score_ht ?? null,
        minute: ev.current_minute ?? null,
        weather: ev.weather ?? null,
        derby: ev.is_local_derby ?? false,
        roundLabel: ev.round_label ?? null,
        neutral: ev.is_neutral_ground ?? false,
        refereeId: ev.referee_id ?? null,
        homeTeamId: ev.home_team_id,
        awayTeamId: ev.away_team_id,
      });
    }
    if (!page.next) break;
    offset += 200;
  }
  return map;
}

async function standingsByLeagues(leagueIds: number[]) {
  const byTeam = new Map<number, StandingRow>();
  const unique = [...new Set(leagueIds)];
  await Promise.all(
    unique.map(async (id) => {
      try {
        const payload = await bsd<Parameters<typeof flattenStandings>[0]>(
          `/leagues/${id}/standings/`,
        );
        for (const row of flattenStandings(payload)) {
          if (row.teamId) byTeam.set(row.teamId, row);
        }
      } catch {
        /* standings optional */
      }
    }),
  );
  return byTeam;
}

function withTable(extra: EventExtra | undefined, pred: BsdPrediction, byTeam: Map<number, StandingRow>): EventExtra {
  const home = pred.event.home_team_id ? byTeam.get(pred.event.home_team_id) : undefined;
  const away = pred.event.away_team_id ? byTeam.get(pred.event.away_team_id) : undefined;
  return {
    h2h: extra?.h2h,
    homeScore: extra?.homeScore ?? null,
    awayScore: extra?.awayScore ?? null,
    homeScoreHt: extra?.homeScoreHt ?? null,
    awayScoreHt: extra?.awayScoreHt ?? null,
    minute: extra?.minute ?? null,
    weather: extra?.weather ?? null,
    derby: extra?.derby ?? false,
    roundLabel: extra?.roundLabel ?? null,
    neutral: extra?.neutral ?? false,
    formHome: home?.form,
    formAway: away?.form,
    tableHome: home ? toTableSnap(home) : undefined,
    tableAway: away ? toTableSnap(away) : undefined,
    refereeId: extra?.refereeId,
    homeTeamId: extra?.homeTeamId ?? pred.event.home_team_id,
    awayTeamId: extra?.awayTeamId ?? pred.event.away_team_id,
    referee: extra?.referee,
    cornersAvgHome: extra?.cornersAvgHome,
    cornersAvgAway: extra?.cornersAvgAway,
    cardsAvgHome: extra?.cardsAvgHome,
    cardsAvgAway: extra?.cardsAvgAway,
  };
}

type TeamAvg = { corners: number; yellows: number; n: number };
const avgCache = new Map<number, { at: number; v: TeamAvg | null }>();

type RefRow = { name: string; avgYellow: number; avgRed: number };
const refCache = new Map<number, { at: number; v: RefRow | null }>();

async function teamAvg(teamId: number): Promise<TeamAvg | null> {
  const hit = avgCache.get(teamId);
  if (hit && Date.now() - hit.at < 6 * 3600 * 1000) return hit.v;
  try {
    const page = await bsd<Page<EventRow>>(`/events/?team_id=${teamId}&status=finished&limit=5`);
    const rows = page.results ?? [];
    const stats = await pool(rows, 4, async (ev) => {
      try {
        return await bsd<{
          stats?: {
            home?: { corner_kicks?: number; yellow_cards?: number };
            away?: { corner_kicks?: number; yellow_cards?: number };
          };
        }>(`/events/${ev.id}/stats/`);
      } catch {
        return null;
      }
    });
    let c = 0;
    let y = 0;
    let n = 0;
    rows.forEach((ev, i) => {
      const side = ev.home_team_id === teamId ? stats[i]?.stats?.home : stats[i]?.stats?.away;
      if (typeof side?.corner_kicks === "number") {
        c += side.corner_kicks;
        n += 1;
      }
      if (typeof side?.yellow_cards === "number") y += side.yellow_cards;
    });
    const v = n ? { corners: c / n, yellows: n ? y / n : 0, n } : null;
    avgCache.set(teamId, { at: Date.now(), v });
    return v;
  } catch {
    avgCache.set(teamId, { at: Date.now(), v: null });
    return null;
  }
}

async function refereeOf(id: number): Promise<RefRow | null> {
  const hit = refCache.get(id);
  if (hit && Date.now() - hit.at < 12 * 3600 * 1000) return hit.v;
  try {
    const row = await bsd<{
      name?: string;
      avg_yellow_per_match?: number;
      avg_red_per_match?: number;
    }>(`/referees/${id}/`);
    const v =
      row.name && row.avg_yellow_per_match != null
        ? {
            name: row.name,
            avgYellow: row.avg_yellow_per_match,
            avgRed: row.avg_red_per_match ?? 0,
          }
        : null;
    refCache.set(id, { at: Date.now(), v });
    return v;
  } catch {
    refCache.set(id, { at: Date.now(), v: null });
    return null;
  }
}

async function hydrateMatchContext(items: EventExtra[]) {
  const refIds = [...new Set(items.map((e) => e.refereeId).filter((n): n is number => !!n))];
  const teamIds = [
    ...new Set(
      items.flatMap((e) => [e.homeTeamId, e.awayTeamId]).filter((n): n is number => !!n),
    ),
  ];
  const [refs, avgs] = await Promise.all([
    pool(refIds, 6, refereeOf),
    pool(teamIds, 5, teamAvg),
  ]);
  const refMap = new Map(refIds.map((id, i) => [id, refs[i]]));
  const avgMap = new Map(teamIds.map((id, i) => [id, avgs[i]]));
  for (const e of items) {
    if (e.refereeId) e.referee = refMap.get(e.refereeId) ?? undefined;
    const h = e.homeTeamId ? avgMap.get(e.homeTeamId) : null;
    const a = e.awayTeamId ? avgMap.get(e.awayTeamId) : null;
    if (h) {
      e.cornersAvgHome = Math.round(h.corners * 10) / 10;
      e.cardsAvgHome = Math.round(h.yellows * 10) / 10;
    }
    if (a) {
      e.cornersAvgAway = Math.round(a.corners * 10) / 10;
      e.cardsAvgAway = Math.round(a.yellows * 10) / 10;
    }
  }
}

async function oddsFor(eventId: number): Promise<{ book: OddsBook | null; ref: OddsBook | null }> {
  const [slim, refPage] = await Promise.all([
    bsd<{ odds?: SlimOdds }>(`/events/${eventId}/odds/`).catch(() => null),
    bsd<Page<OddsRow>>(`/odds/?event_id=${eventId}&bookmaker_slug=1xbet&limit=120`).catch(
      () => null,
    ),
  ]);
  const ref = refPage?.results?.length ? parseOddsRows(refPage.results) : null;
  if (ref) {
    const triple = pinTriple(ref);
    if (triple) ref.pinnacle = triple;
  }
  const slimBook = slim?.odds ? fromSlim(slim.odds) : null;
  // 1xBet first (BetWinner-like); consensus fills holes.
  const book = ref && slimBook ? fillBook(ref, slimBook) : ref ?? slimBook;
  return { book, ref };
}

async function pool<T, R>(items: T[], n: number, fn: (item: T) => Promise<R>) {
  const out: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, worker));
  return out;
}

export async function loadPicksFromBsd(): Promise<{
  picks: PickItem[];
  source: "bsd" | "fallback";
  generatedAt: string;
  error?: string;
}> {
  if (!lastGood) lastGood = readDisk();

  if (cache && cache.ver === CACHE_VER && Date.now() - cache.at < TTL_MS) {
    return {
      picks: cache.picks,
      source: cache.source,
      generatedAt: new Date(cache.at).toISOString(),
      error: cache.error,
    };
  }

  if (Date.now() < cooldownUntil) {
    return serveStale(quotaMessage(cooldownUntil - Date.now()));
  }

  const from = artToday();
  const to = addDays(from, 3);

  try {
    const [preds, extras] = await Promise.all([
      allPredictions(from, to),
      eventsByWindow(from, to).catch(() => new Map<number, EventExtra>()),
    ]);

    const filtered = preds.filter(
      (p) => ALLOWED_LEAGUES[p.event.league_id] && isPlayableStatus(p.event.status),
    );

    const [byTeam] = await Promise.all([
      standingsByLeagues(filtered.map((p) => p.event.league_id)).catch(
        () => new Map<number, StandingRow>(),
      ),
      hydrateCrests(filtered.flatMap((p) => [p.event.home_team, p.event.away_team])),
    ]);

    const extrasList = filtered.map((p) => extras.get(p.event.id)).filter(Boolean) as EventExtra[];
    await hydrateMatchContext(extrasList).catch(() => undefined);

    const oddsList = await pool(filtered, 5, (p) => oddsFor(p.event.id));

    const picks: PickItem[] = [];
    filtered.forEach((pred, i) => {
      const extra = withTable(extras.get(pred.event.id), pred, byTeam);
      const pack = oddsList[i];
      const built = buildPick(pred, pack.book, extra);
      if (!built) return;
      built.homeCrest = crestUrl(pred.event.home_team) ?? crestUrl(built.home);
      built.awayCrest = crestUrl(pred.event.away_team) ?? crestUrl(built.away);
      built.homeScore = extra.homeScore ?? null;
      built.awayScore = extra.awayScore ?? null;
      built.homeScoreHt = extra.homeScoreHt ?? null;
      built.awayScoreHt = extra.awayScoreHt ?? null;
      built.minute = extra.minute ?? null;
      if (pack.ref) {
        if (pack.ref.pinnacle) applyPinnacle(built, { ...pack.ref.pinnacle, sportKey: "" });
        else if (!built.sources.includes("BetWinner")) built.sources = [...built.sources, "BetWinner"];
        const odd = marketOdd(pack.ref, built.marketKey, built.market, built.home, built.away);
        if (odd != null && odd > 1) {
          built.pinnacleOdds = Math.round(odd * 100) / 100;
          built.pinnacleEvPct = Math.round((built.modelPct / 100) * odd * 1000 - 1000) / 10;
        }
      }
      picks.push(built);
    });

    picks.sort((a, b) => {
      const t = new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime();
      if (t !== 0) return t;
      return b.evPct - a.evPct;
    });

    const source = picks.length ? ("bsd" as const) : ("fallback" as const);
    const finalPicks = picks.length ? picks : asFallback();
    cache = { ver: CACHE_VER, at: Date.now(), picks: finalPicks, source };
    if (picks.length) {
      lastGood = cache;
      writeDisk(cache);
    }
    return {
      picks: finalPicks,
      source,
      generatedAt: new Date(cache.at).toISOString(),
    };
  } catch (err) {
    const message =
      err instanceof BsdHttpError
        ? err.message
        : err instanceof Error
          ? "El feed en vivo no respondió. Mostrando el último tablero."
          : "BSD offline";
    const wait = err instanceof BsdHttpError ? err.retryAfterMs : 3 * 60 * 1000;
    cooldownUntil = Math.max(cooldownUntil, Date.now() + wait);
    return serveStale(message);
  }
}
