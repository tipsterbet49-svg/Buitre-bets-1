import type { LeagueKey, MarketKey, PickItem } from "@/lib/pick-types";
import { MIN_ODDS } from "@/lib/pick-types";

export const ALLOWED_LEAGUES: Record<number, { name: string; key: LeagueKey }> = {
  1: { name: "Premier League", key: "eng" },
  2: { name: "Liga Portugal", key: "por" },
  3: { name: "La Liga", key: "esp" },
  4: { name: "Serie A", key: "ita" },
  5: { name: "Bundesliga", key: "ger" },
  6: { name: "Ligue 1", key: "fra" },
  7: { name: "Champions", key: "ucl" },
  8: { name: "Europa League", key: "europa" },
  9: { name: "Brasileirão", key: "bra" },
  32: { name: "Libertadores", key: "lib" },
  33: { name: "Sudamericana", key: "suda" },
  85: { name: "Liga Profesional", key: "arg" },
};

const LIVE = new Set([
  "notstarted",
  "1st_half",
  "2nd_half",
  "halftime",
  "ht",
  "inprogress",
  "extra_time",
  "penalties",
]);

export type BsdPrediction = {
  id: number;
  event: {
    id: number;
    event_date: string;
    status: string;
    home_team: string;
    away_team: string;
    home_team_id?: number;
    away_team_id?: number;
    league_id: number;
    league_name: string;
  };
  markets: {
    match_result: {
      prob_home: number;
      prob_draw: number;
      prob_away: number;
      predicted: string;
    };
    expected_goals: { home: number; away: number };
    over_under: {
      prob_over_15: number;
      prob_over_25: number;
      prob_over_35: number;
    };
    btts: { prob_yes: number };
    score: { most_likely: string };
  };
  model: { confidence: number; version: string };
};

export type BsdOdds = {
  home_win?: number | null;
  draw?: number | null;
  away_win?: number | null;
  over_15_goals?: number | null;
  over_25_goals?: number | null;
  over_35_goals?: number | null;
  under_15_goals?: number | null;
  under_25_goals?: number | null;
  under_35_goals?: number | null;
  btts_yes?: number | null;
  btts_no?: number | null;
};

export type BsdH2H = {
  total_matches?: number;
  avg_total_goals?: number;
  home_wins?: number;
  draws?: number;
  away_wins?: number;
};

type Cand = {
  market: string;
  marketKey: MarketKey;
  p: number;
  odds: number;
  ev: number;
  score: number;
};

function pct(n: number) {
  return Math.round(n * 1000) / 10;
}

function evOf(p: number, odds: number) {
  return p * odds - 1;
}

function confOf(model: number, ev: number) {
  const base = model * 100;
  const bump = ev > 0.04 ? 6 : ev > 0 ? 3 : 0;
  return Math.max(52, Math.min(92, Math.round(base + bump)));
}

function shortTeam(name: string) {
  return name.replace(/FC |CF |SSC |SK |1\. FC /g, "").trim();
}

export function isPlayableStatus(status: string) {
  return LIVE.has(status);
}

export function buildPick(
  pred: BsdPrediction,
  odds: BsdOdds | null,
  h2h?: BsdH2H | null,
): PickItem | null {
  const league = ALLOWED_LEAGUES[pred.event.league_id];
  if (!league) return null;
  if (!odds) return null;
  if (!isPlayableStatus(pred.event.status)) return null;

  const e = pred.event;
  const m = pred.markets;
  const pH = m.match_result.prob_home / 100;
  const pD = m.match_result.prob_draw / 100;
  const pA = m.match_result.prob_away / 100;
  const btts = m.btts.prob_yes / 100;
  const ou = m.over_under;
  const xgH = m.expected_goals.home;
  const xgA = m.expected_goals.away;
  const xg = xgH + xgA;
  const home = shortTeam(e.home_team);
  const away = shortTeam(e.away_team);

  const raw: Array<[string, MarketKey, number, number | null | undefined, number]> = [
    [`Gana ${home}`, "1x2", pH, odds.home_win, 0],
    ["Empate", "1x2", pD, odds.draw, 0],
    [`Gana ${away}`, "1x2", pA, odds.away_win, 0],
    ["Ambos marcan", "btts", btts, odds.btts_yes, 0],
    ["BTTS No", "btts", 1 - btts, odds.btts_no, 0],
    ["Más de 1.5", "ou", ou.prob_over_15 / 100, odds.over_15_goals, 0.01],
    ["Menos de 1.5", "ou", 1 - ou.prob_over_15 / 100, odds.under_15_goals, 0],
    ["Más de 2.5", "ou", ou.prob_over_25 / 100, odds.over_25_goals, 0.05],
    ["Menos de 2.5", "ou", 1 - ou.prob_over_25 / 100, odds.under_25_goals, 0],
    ["Más de 3.5", "ou", ou.prob_over_35 / 100, odds.over_35_goals, xg < 3.1 ? 0.08 : 0],
    ["Menos de 3.5", "ou", 1 - ou.prob_over_35 / 100, odds.under_35_goals, 0],
  ];

  const cands: Cand[] = [];
  for (const [market, marketKey, p, od, pen] of raw) {
    if (od == null || od < MIN_ODDS) continue;
    if (p < 0.38) continue;
    const ev = evOf(p, od);
    cands.push({
      market,
      marketKey,
      p,
      odds: od,
      ev,
      score: ev - pen + (p - 0.45) * 0.15,
    });
  }

  if (!cands.length) return null;
  cands.sort((a, b) => b.score - a.score);
  const best = cands[0];

  const rejectedBits: string[] = [];
  if (odds.home_win != null && odds.home_win < MIN_ODDS) {
    rejectedBits.push(`${home} @ ${odds.home_win.toFixed(2)}`);
  }
  if (odds.away_win != null && odds.away_win < MIN_ODDS) {
    rejectedBits.push(`${away} @ ${odds.away_win.toFixed(2)}`);
  }
  if (odds.over_25_goals != null && odds.over_25_goals < MIN_ODDS) {
    rejectedBits.push(`Over 2.5 @ ${odds.over_25_goals.toFixed(2)}`);
  }
  if (best.market !== "Más de 2.5" && (odds.over_25_goals ?? 99) >= MIN_ODDS) {
    rejectedBits.push("Over 2.5 no se publica por default");
  }

  const bullets: string[] = [
    `Modelo BSD ${pred.model.version}: ${home} ${pct(pH)}% · Empate ${pct(pD)}% · ${away} ${pct(pA)}%`,
    `xG ${xgH.toFixed(2)} – ${xgA.toFixed(2)} (media ${xg.toFixed(2)}) · marcador más probable ${m.score.most_likely}`,
    `BTTS ${pct(btts)}% · Over 2.5 ${pct(ou.prob_over_25 / 100)}% · Over 3.5 ${pct(ou.prob_over_35 / 100)}%`,
  ];
  if (h2h && (h2h.total_matches ?? 0) >= 3) {
    bullets.push(
      `H2H ${h2h.total_matches} pj · media ${Number(h2h.avg_total_goals ?? 0).toFixed(2)} goles · ${h2h.home_wins}-${h2h.draws}-${h2h.away_wins}`,
    );
  }

  const implied = 1 / best.odds;
  const analysis = buildAnalysis(best, home, away, { pH, pD, pA, xg, scoreline: m.score.most_likely });
  const rejected = rejectedBits.length
    ? `Se descarta ${rejectedBits.slice(0, 3).join(" · ")} (regla cuota mínima 1.50).`
    : "Sin favorito corto: el mercado publicado ya cumple 1.50.";

  return {
    id: `bsd-${e.id}`,
    eventId: e.id,
    league: league.name,
    leagueKey: league.key,
    kickoff: e.event_date,
    status: e.status,
    home,
    away,
    market: best.market,
    marketKey: best.marketKey,
    odds: Math.round(best.odds * 100) / 100,
    impliedPct: pct(implied),
    modelPct: pct(best.p),
    evPct: Math.round(best.ev * 1000) / 10,
    conf: confOf(pred.model.confidence, best.ev),
    pH,
    pD,
    pA,
    xgHome: xgH,
    xgAway: xgA,
    scoreline: m.score.most_likely,
    sources: ["BSD"],
    bullets,
    analysis,
    rejected,
  };
}

function buildAnalysis(
  best: Cand,
  home: string,
  away: string,
  ctx: { pH: number; pD: number; pA: number; xg: number; scoreline: string },
) {
  const gap = best.p - 1 / best.odds;
  const value =
    gap > 0.03
      ? "El modelo está por encima de la implícita: hay valor."
      : gap > 0
        ? "Edge chico, pero del lado correcto del precio."
        : "El libro está un poco más agresivo que el modelo; se publica porque es el mercado ≥ 1.50 más limpio, no porque sea un 1.10.";
  if (best.market.startsWith("Gana")) {
    return `${best.market} @ ${best.odds.toFixed(2)}. 1X2 del modelo ${pct(ctx.pH)}-${pct(ctx.pD)}-${pct(ctx.pA)}. Marcador tipo ${ctx.scoreline}. ${value} No se toca el favorito si está bajo 1.50.`;
  }
  if (best.market.startsWith("Ambos") || best.market === "BTTS No") {
    return `${best.market} @ ${best.odds.toFixed(2)} con ${pct(best.p)}% del modelo (xG ${ctx.xg.toFixed(2)}, ${ctx.scoreline}). ${value}`;
  }
  if (best.market.startsWith("Más") || best.market.startsWith("Menos")) {
    return `${best.market} @ ${best.odds.toFixed(2)}. Media de goles ${ctx.xg.toFixed(2)} y ${ctx.scoreline} como línea base. ${value} Over 2.5 no entra automático.`;
  }
  return `${home} vs ${away}: ${best.market} @ ${best.odds.toFixed(2)}. ${value}`;
}
