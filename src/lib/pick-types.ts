export type LeagueKey =
  | "ucl"
  | "europa"
  | "lib"
  | "suda"
  | "bra"
  | "arg"
  | "eng"
  | "esp"
  | "ita"
  | "ger"
  | "fra"
  | "por"
  | "other";

export type MarketKey = "1x2" | "btts" | "ou";

export type PickItem = {
  id: string;
  eventId: number;
  league: string;
  leagueKey: LeagueKey;
  kickoff: string;
  status: string;
  home: string;
  away: string;
  homeCrest?: string;
  awayCrest?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  minute?: number | null;
  market: string;
  marketKey: MarketKey;
  odds: number;
  impliedPct: number;
  modelPct: number;
  evPct: number;
  conf: number;
  pH: number;
  pD: number;
  pA: number;
  xgHome: number;
  xgAway: number;
  scoreline: string;
  sources: string[];
  bullets: string[];
  analysis: string;
  rejected: string;
};

export const MIN_ODDS = 1.5;
