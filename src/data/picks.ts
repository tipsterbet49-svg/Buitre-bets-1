import type { PickItem } from "@/lib/pick-types";

export type { PickItem } from "@/lib/pick-types";
export { MIN_ODDS } from "@/lib/pick-types";

const implied = (odds: number) => Math.round((1 / odds) * 1000) / 10;
const ev = (p: number, odds: number) =>
  Math.round((p * (odds - 1) - (1 - p)) * 1000) / 10;

/** Fallback curated board if BSD is down. */
export const PICKS: PickItem[] = [
  {
    id: "liv-atm",
    eventId: 0,
    league: "Champions",
    leagueKey: "ucl",
    kickoff: "2026-09-09T19:00:00.000Z",
    status: "finished",
    home: "Liverpool",
    away: "Atlético Madrid",
    homeCrest: "https://media.api-sports.io/football/teams/40.png",
    awayCrest: "https://media.api-sports.io/football/teams/530.png",
    market: "Ambos marcan",
    marketKey: "btts",
    odds: 1.58,
    impliedPct: implied(1.58),
    modelPct: 73,
    evPct: ev(0.73, 1.58),
    conf: 78,
    pH: 0.36,
    pD: 0.29,
    pA: 0.35,
    xgHome: 1.6,
    xgAway: 1.2,
    scoreline: "2-1",
    sources: ["BSD"],
    bullets: ["Fallback estático — reconectá BSD para el tablero en vivo"],
    analysis:
      "El 1 de Liverpool no es value. El mercado ≥ 1.50 es BTTS.",
    rejected: "Se descarta Liverpool gana @ 1.69.",
  },
];
