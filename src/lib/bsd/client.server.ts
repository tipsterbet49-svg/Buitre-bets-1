import { PICKS as FALLBACK } from "@/data/picks";
import type { PickItem } from "@/lib/pick-types";
import {
  ALLOWED_LEAGUES,
  buildPick,
  type BsdH2H,
  type BsdOdds,
  type BsdPrediction,
} from "@/lib/bsd/engine";
import { artToday } from "@/lib/art-time";
import { crestUrl, hydrateCrests } from "@/lib/crests";

const BASE = "https://sports.bzzoiro.com/api/v2";
const TOKEN =
  process.env.BSD_API_TOKEN ?? "0f5fef6dd4e24408e6a468ea76656d13300ad804";

type Cache = { at: number; picks: PickItem[]; source: "bsd" | "fallback"; error?: string };
let cache: Cache | null = null;
const TTL_MS = 8 * 60 * 1000;

function addDays(ymd: string, n: number) {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

async function bsd<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Token ${TOKEN}` },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`BSD ${res.status} ${path}`);
  return (await res.json()) as T;
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
  home_score?: number | null;
  away_score?: number | null;
  current_minute?: number | null;
  head_to_head?: BsdH2H | null;
};

type EventExtra = {
  h2h?: BsdH2H | null;
  homeScore: number | null;
  awayScore: number | null;
  minute: number | null;
};

async function eventsByWindow(from: string, to: string) {
  const page = await bsd<Page<EventRow>>(
    `/events/?date_from=${from}&date_to=${to}&limit=200`,
  );
  const map = new Map<number, EventExtra>();
  for (const ev of page.results) {
    map.set(ev.id, {
      h2h: ev.head_to_head,
      homeScore: ev.home_score ?? null,
      awayScore: ev.away_score ?? null,
      minute: ev.current_minute ?? null,
    });
  }
  return map;
}

async function oddsFor(eventId: number): Promise<BsdOdds | null> {
  try {
    const row = await bsd<{ odds: BsdOdds }>(`/events/${eventId}/odds/`);
    return row.odds ?? null;
  } catch {
    return null;
  }
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

function asFallback(): PickItem[] {
  return FALLBACK;
}

export async function loadPicksFromBsd(): Promise<{
  picks: PickItem[];
  source: "bsd" | "fallback";
  generatedAt: string;
  error?: string;
}> {
  if (cache && Date.now() - cache.at < TTL_MS) {
    return {
      picks: cache.picks,
      source: cache.source,
      generatedAt: new Date(cache.at).toISOString(),
      error: cache.error,
    };
  }

  const from = artToday();
  const to = addDays(from, 3);

  try {
    const [preds, extras] = await Promise.all([
      allPredictions(from, to),
      eventsByWindow(from, to).catch(() => new Map<number, EventExtra>()),
    ]);

    const filtered = preds.filter((p) => ALLOWED_LEAGUES[p.event.league_id]);
    await hydrateCrests(
      filtered.flatMap((p) => [p.event.home_team, p.event.away_team]),
    );
    const oddsList = await pool(filtered, 8, (p) => oddsFor(p.event.id));

    const picks: PickItem[] = [];
    filtered.forEach((pred, i) => {
      const extra = extras.get(pred.event.id);
      const built = buildPick(pred, oddsList[i], extra?.h2h);
      if (!built) return;
      built.homeCrest = crestUrl(pred.event.home_team) ?? crestUrl(built.home);
      built.awayCrest = crestUrl(pred.event.away_team) ?? crestUrl(built.away);
      built.homeScore = extra?.homeScore ?? null;
      built.awayScore = extra?.awayScore ?? null;
      built.minute = extra?.minute ?? null;
      picks.push(built);
    });

    picks.sort((a, b) => {
      const t = new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime();
      if (t !== 0) return t;
      return b.evPct - a.evPct;
    });

    const source = picks.length ? ("bsd" as const) : ("fallback" as const);
    const finalPicks = picks.length ? picks : asFallback();
    cache = { at: Date.now(), picks: finalPicks, source };
    return {
      picks: finalPicks,
      source,
      generatedAt: new Date(cache.at).toISOString(),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "BSD offline";
    const fallback = asFallback();
    cache = { at: Date.now(), picks: fallback, source: "fallback", error: message };
    return {
      picks: fallback,
      source: "fallback",
      generatedAt: new Date(cache.at).toISOString(),
      error: message,
    };
  }
}
