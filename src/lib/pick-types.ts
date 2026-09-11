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

export type MarketKey = "1x2" | "btts" | "ou" | "dc" | "dnb" | "ah" | "corners" | "cards";

export type MarketLine = {
  market: string;
  marketKey: MarketKey;
  odds: number;
  modelPct: number;
  impliedPct: number;
  evPct: number;
};

export type ScoreCell = { h: number; a: number; p: number };

export type H2HRecent = { date: string; home: string; away: string; score: string };

export type H2HSummary = {
  total: number;
  homeWins: number;
  draws: number;
  awayWins: number;
  avgGoals: number;
  recent: H2HRecent[];
};

export type TableSnap = {
  pos: number;
  played: number;
  pts: number;
  gf: number;
  ga: number;
  gd: number;
  xgf?: number;
  xga?: number;
  zone?: string;
  group?: string;
};

export type OddsMove = {
  opening: number;
  previous?: number;
  current: number;
  movement: "DRIFTING" | "SHORTENING" | "";
  books: number;
};

export type PinnacleTriple = {
  home: number | null;
  draw: number | null;
  away: number | null;
};

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
  homeScoreHt?: number | null;
  awayScoreHt?: number | null;
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
  alts: MarketLine[];
  ou: { o15: number; o25: number; o35: number };
  bttsPct: number;
  scores: ScoreCell[];
  cornersModel: Array<{ line: number; overPct: number }>;
  h2h?: H2HSummary;
  weather?: { label: string; tempC: number | null; wind?: number | null };
  derby?: boolean;
  roundLabel?: string;
  neutral?: boolean;
  formHome?: string;
  formAway?: string;
  tableHome?: TableSnap;
  tableAway?: TableSnap;
  oddsMove?: OddsMove;
  oneXtwoMove?: { home?: OddsMove; draw?: OddsMove; away?: OddsMove };
  books?: number;
  openImpliedPct?: number;
  pinnacle?: PinnacleTriple;
  pinnacleOdds?: number;
  pinnacleEvPct?: number;
  referee?: { name: string; avgYellow: number; avgRed: number };
  cornersAvgHome?: number;
  cornersAvgAway?: number;
  cardsAvgHome?: number;
  cardsAvgAway?: number;
};

export const MIN_ODDS = 1.4;
