/**
 * Optional The Odds API overlay (Pinnacle).
 * Reads THE_ODDS_API_KEY from server env only — never sent to the browser.
 */
import type { LeagueKey, PickItem, PinnacleTriple } from "@/lib/pick-types";

const SPORT: Record<LeagueKey, string | null> = {
  eng: "soccer_epl",
  esp: "soccer_spain_la_liga",
  ita: "soccer_italy_serie_a",
  ger: "soccer_germany_bundesliga",
  fra: "soccer_france_ligue_one",
  por: "soccer_portugal_primeira_liga",
  bra: "soccer_brazil_campeonato",
  arg: "soccer_argentina_primera_division",
  ucl: "soccer_uefa_champs_league",
  europa: "soccer_uefa_europa_league",
  lib: "soccer_conmebol_copa_libertadores",
  suda: "soccer_conmebol_copa_sudamericana",
  other: null,
};

export type PinnacleQuote = PinnacleTriple & { sportKey: string };

type Cache = { at: number; byLeague: Map<LeagueKey, EventOdds[]> };
let cache: Cache | null = null;
/** 12h: free tier is 500 credits/month; 1 sport × eu × h2h = 1 credit. */
const TTL_MS = 12 * 60 * 60 * 1000;
let creditsLeft = 500;

type EventOdds = {
  home: string;
  away: string;
  ts: number;
  homeOdd: number | null;
  drawOdd: number | null;
  awayOdd: number | null;
};

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function key() {
  return process.env.THE_ODDS_API_KEY?.trim() || process.env.ODDS_API_KEY?.trim() || "";
}

export function oddsApiEnabled() {
  return Boolean(key());
}

function noteCredits(res: Response) {
  const n = Number(res.headers.get("x-requests-remaining"));
  if (Number.isFinite(n)) creditsLeft = n;
}

async function fetchSport(sport: string): Promise<EventOdds[]> {
  const k = key();
  if (!k || creditsLeft < 2) return [];
  const url =
    `https://api.the-odds-api.com/v4/sports/${sport}/odds/?` +
    new URLSearchParams({
      apiKey: k,
      regions: "eu",
      markets: "h2h",
      oddsFormat: "decimal",
      bookmakers: "pinnacle",
    });
  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
  noteCredits(res);
  if (!res.ok) return [];
  const rows = (await res.json()) as Array<{
    home_team: string;
    away_team: string;
    commence_time: string;
    bookmakers?: Array<{
      key: string;
      markets?: Array<{
        key: string;
        outcomes?: Array<{ name: string; price: number }>;
      }>;
    }>;
  }>;
  const out: EventOdds[] = [];
  for (const ev of rows) {
    const pin = ev.bookmakers?.find((b) => b.key === "pinnacle");
    const h2h = pin?.markets?.find((m) => m.key === "h2h");
    if (!h2h?.outcomes?.length) continue;
    const by = new Map(h2h.outcomes.map((o) => [norm(o.name), o.price]));
    out.push({
      home: ev.home_team,
      away: ev.away_team,
      ts: Date.parse(ev.commence_time),
      homeOdd: by.get(norm(ev.home_team)) ?? null,
      awayOdd: by.get(norm(ev.away_team)) ?? null,
      drawOdd: [...by.entries()].find(([n]) => n === "draw" || n === "empate")?.[1] ?? null,
    });
  }
  return out;
}

export async function loadPinnacleMap(leagues: LeagueKey[]): Promise<Map<LeagueKey, EventOdds[]>> {
  if (!oddsApiEnabled()) return new Map();
  if (cache && Date.now() - cache.at < TTL_MS) return cache.byLeague;
  const unique = [...new Set(leagues)].filter((k) => SPORT[k]);
  const byLeague = new Map<LeagueKey, EventOdds[]>();
  await Promise.all(
    unique.map(async (lk) => {
      const sport = SPORT[lk];
      if (!sport) return;
      try {
        byLeague.set(lk, await fetchSport(sport));
      } catch {
        byLeague.set(lk, []);
      }
    }),
  );
  cache = { at: Date.now(), byLeague };
  return byLeague;
}

export function matchPinnacle(
  map: Map<LeagueKey, EventOdds[]>,
  league: LeagueKey,
  home: string,
  away: string,
  kickoff: string,
): PinnacleQuote | null {
  const list = map.get(league);
  if (!list?.length) return null;
  const nh = norm(home);
  const na = norm(away);
  const ts = Date.parse(kickoff);
  let best: EventOdds | null = null;
  let bestScore = 0;
  for (const ev of list) {
    const eh = norm(ev.home);
    const ea = norm(ev.away);
    let s = 0;
    if (eh === nh || eh.includes(nh) || nh.includes(eh)) s += 2;
    if (ea === na || ea.includes(na) || na.includes(ea)) s += 2;
    if (Math.abs(ev.ts - ts) < 4 * 3600 * 1000) s += 1;
    if (s > bestScore) {
      bestScore = s;
      best = ev;
    }
  }
  if (!best || bestScore < 4) return null;
  return {
    home: best.homeOdd,
    draw: best.drawOdd,
    away: best.awayOdd,
    sportKey: SPORT[league] ?? "",
  };
}

/** Display-only. Does not change the published pick, odds, EV or confidence. */
export function applyPinnacle(pick: PickItem, quote: PinnacleQuote | null) {
  if (!quote) return;
  if (quote.home == null && quote.draw == null && quote.away == null) return;
  pick.pinnacle = { home: quote.home, draw: quote.draw, away: quote.away };
  if (!pick.sources.includes("BetWinner")) pick.sources = [...pick.sources, "BetWinner"];
  if (pick.marketKey !== "1x2") return;
  let odd: number | null = null;
  if (pick.market === "Empate") odd = quote.draw;
  else if (pick.market === `Gana ${pick.home}`) odd = quote.home;
  else if (pick.market === `Gana ${pick.away}`) odd = quote.away;
  if (odd == null || odd <= 1) return;
  pick.pinnacleOdds = Math.round(odd * 100) / 100;
  pick.pinnacleEvPct = Math.round((pick.modelPct / 100) * odd * 1000 - 1000) / 10;
}
