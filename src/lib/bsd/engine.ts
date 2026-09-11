import type { H2HSummary, LeagueKey, MarketKey, MarketLine, OddsMove, PickItem, TableSnap } from "@/lib/pick-types";
import { MIN_ODDS } from "@/lib/pick-types";
import type { OddsBook } from "@/lib/bsd/odds-book";
import {
  ahEv,
  ahModelP,
  pHomeOver,
  pWinToNilHome,
  scoreMatrix,
  topScores,
} from "@/lib/bsd/poisson";

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
    draw_no_bet?: { prob_home: number };
    corners?: {
      prob_over_85: number;
      prob_over_95: number;
      prob_over_105: number;
    };
  };
  model: { confidence: number; version: string };
};

export type BsdH2H = {
  total_matches?: number;
  avg_total_goals?: number;
  home_wins?: number;
  draws?: number;
  away_wins?: number;
  recent_matches?: Array<{
    date?: string;
    home?: string;
    away?: string;
    score?: string;
    home_score?: number;
    away_score?: number;
  }>;
};

export type EventExtra = {
  h2h?: BsdH2H | null;
  homeScore: number | null;
  awayScore: number | null;
  homeScoreHt?: number | null;
  awayScoreHt?: number | null;
  minute: number | null;
  weather?: {
    description?: string | null;
    temperature_c?: number | null;
    wind_speed?: number | null;
  } | null;
  derby?: boolean;
  roundLabel?: string | null;
  neutral?: boolean;
  formHome?: string;
  formAway?: string;
  tableHome?: TableSnap;
  tableAway?: TableSnap;
  refereeId?: number | null;
  homeTeamId?: number;
  awayTeamId?: number;
  referee?: { name: string; avgYellow: number; avgRed: number };
  cornersAvgHome?: number;
  cornersAvgAway?: number;
  cardsAvgHome?: number;
  cardsAvgAway?: number;
};

type Cand = MarketLine & { p: number; ev: number; score: number; bookKey: string };

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

function fmtHandicap(n: number) {
  const v = Math.round(n * 100) / 100;
  return v > 0 ? `+${v}` : `${v}`;
}

function parseML(s?: string) {
  const m = s?.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (!m) return null;
  return { h: Number(m[1]), a: Number(m[2]) };
}

export function isPlayableStatus(status: string) {
  return LIVE.has(status);
}

function weatherLabel(raw?: string | null, wind?: number | null) {
  if (raw) {
    const k = raw.toLowerCase().trim();
    if (k && k !== "unknown" && k !== "null" && k !== "none" && k !== "n/a") {
      if (k.includes("rain") || k.includes("shower")) return "Lluvia";
      if (k.includes("storm") || k.includes("thunder")) return "Tormenta";
      if (k.includes("cloud")) return "Nublado";
      if (k.includes("clear") || k.includes("sunny") || k.includes("fair")) return "Despejado";
      if (k.includes("fog") || k.includes("mist")) return "Niebla";
      if (k.includes("snow")) return "Nieve";
      if (k.includes("wind")) return "Viento";
      return raw;
    }
  }
  if (wind != null && wind >= 28) return "Viento";
  return null;
}

function formPts(form?: string) {
  if (!form) return 0;
  let s = 0;
  let n = 0;
  for (const c of form.replace(/[^WDLwdl]/g, "").slice(-5).toUpperCase()) {
    n += 1;
    if (c === "W") s += 1;
    if (c === "L") s -= 1;
  }
  return n ? s / n : 0;
}

function lazyPen(market: string, marketKey: MarketKey, xg: number, favBlocked: boolean) {
  if (marketKey === "ah") return 0.1;
  if (market === "Más de 0.5" || market === "Menos de 0.5") return 0.28;
  if (market === "Más de 1.5") return 0.12;
  if (market === "Menos de 1.5") return xg <= 1.8 ? 0.02 : 0.1;
  if (market === "Menos de 3.5") return xg <= 2.3 ? 0.02 : 0.1;
  if (market === "Más de 3.5") return xg >= 3.3 ? 0.02 : 0.1;
  if (market === "Más de 2.5") return 0.07;
  if (marketKey === "dc") return favBlocked ? 0 : 0.06;
  if (marketKey === "dnb") return favBlocked ? 0.01 : 0.04;
  return 0;
}

function contextAdj(
  bookKey: string,
  extra: EventExtra | null | undefined,
  xg: number,
) {
  let a = 0;
  const fh = formPts(extra?.formHome);
  const fa = formPts(extra?.formAway);
  const th = extra?.tableHome?.pos;
  const ta = extra?.tableAway?.pos;
  if (bookKey === "1x2:HOME") {
    a += fh * 0.05 - fa * 0.03;
    if (th != null && ta != null && th + 4 <= ta) a += 0.03;
  }
  if (bookKey === "1x2:AWAY") {
    a += fa * 0.05 - fh * 0.03;
    if (ta != null && th != null && ta + 4 <= th) a += 0.03;
  }
  if (bookKey.includes("under") && xg <= 2.15) a += 0.03;
  if (bookKey.includes("over_under_25:over") && xg >= 2.85) a += 0.03;
  if (extra?.derby && bookKey.includes("under")) a += 0.02;
  const expC =
    extra?.cornersAvgHome != null && extra?.cornersAvgAway != null
      ? extra.cornersAvgHome + extra.cornersAvgAway
      : null;
  if (expC != null && bookKey.startsWith("total_corners:")) {
    const line = Number(bookKey.split(":")[2]);
    const over = bookKey.includes(":over:");
    if (Number.isFinite(line)) {
      if (over && expC > line + 0.5) a += 0.06;
      if (over && expC < line - 0.5) a -= 0.05;
      if (!over && expC < line - 0.5) a += 0.06;
      if (!over && expC > line + 0.5) a -= 0.05;
    }
  }
  return a;
}

function rankKey(c: Cand) {
  if (c.marketKey === "1x2") return 0;
  if (c.marketKey === "btts") return 1;
  if (c.market === "Menos de 2.5" || c.market === "Más de 2.5") return 2;
  if (c.marketKey === "corners") return 2;
  if (c.marketKey === "cards") return 2;
  if (c.marketKey === "dnb") return 3;
  if (c.marketKey === "dc") return 4;
  return 5;
}

function thesisOf(c: Cand) {
  if (c.marketKey === "corners") return c.market.startsWith("Más") ? "corners-over" : "corners-under";
  if (c.marketKey === "ou") return c.market.startsWith("Más") ? "ou-over" : "ou-under";
  if (c.marketKey === "btts") return c.market.includes("No") ? "btts-no" : "btts-yes";
  if (c.marketKey === "ah") return `ah:${c.bookKey.split(":")[1] ?? ""}`;
  return `${c.marketKey}:${c.market}`;
}

/** Same idea, easier line. Over 10.5 @ 2.20 → Over 8.5/9.5 if the model still holds. */
function saferSame(best: Cand, all: Cand[]): Cand {
  const t = thesisOf(best);
  if (!t.startsWith("corners-") && !t.startsWith("ou-") && !t.startsWith("ah:")) return best;
  const same = all.filter((c) => thesisOf(c) === t && c.odds >= MIN_ODDS);
  if (same.length < 2) return best;
  const hittable = same.filter((c) => c.p >= 0.55);
  const pool = hittable.length ? hittable : same;
  pool.sort((a, b) => b.p - a.p || a.odds - b.odds);
  const pick = pool[0];
  if (!pick) return best;
  if (pick.p + 0.04 < best.p) return best;
  return pick;
}

function pushCand(
  list: Cand[],
  market: string,
  marketKey: MarketKey,
  p: number,
  od: number | null | undefined,
  pen: number,
  bookKey: string,
  extra?: EventExtra | null,
  xg = 2.4,
) {
  if (od == null || od < MIN_ODDS) return;
  if (p < 0.38) return;
  const ev = evOf(p, od);
  list.push({
    market,
    marketKey,
    p,
    odds: Math.round(od * 100) / 100,
    ev,
    modelPct: pct(p),
    impliedPct: pct(1 / od),
    evPct: Math.round(ev * 1000) / 10,
    score: ev - pen + (p - 0.45) * 0.12 + contextAdj(bookKey, extra, xg),
    bookKey,
  });
}

function summarizeH2H(h2h?: BsdH2H | null): H2HSummary | undefined {
  if (!h2h || (h2h.total_matches ?? 0) < 3) return undefined;
  const recent = (h2h.recent_matches ?? []).slice(0, 5).map((m) => ({
    date: m.date ?? "",
    home: shortTeam(m.home ?? ""),
    away: shortTeam(m.away ?? ""),
    score: m.score ?? `${m.home_score ?? "?"}-${m.away_score ?? "?"}`,
  }));
  return {
    total: h2h.total_matches ?? 0,
    homeWins: h2h.home_wins ?? 0,
    draws: h2h.draws ?? 0,
    awayWins: h2h.away_wins ?? 0,
    avgGoals: Number(h2h.avg_total_goals ?? 0),
    recent,
  };
}

function tableLine(name: string, t?: TableSnap, form?: string) {
  if (!t) return null;
  const zone = t.zone ? ` · ${t.zone}` : t.group ? ` · ${t.group}` : "";
  const formBit = form ? ` ${form}` : "";
  return `${name} ${t.pos}º ${t.pts} pts${zone}${formBit}`;
}

function moveLabel(m?: OddsMove) {
  if (!m) return null;
  if (Math.round(m.opening * 100) === Math.round(m.current * 100)) return null;
  const dir = m.movement === "SHORTENING" ? "Acorta" : m.movement === "DRIFTING" ? "Deriva" : "Move";
  const books = m.books ? ` · ${m.books} casas` : "";
  return `Cuota ${dir}: ${m.opening.toFixed(2)} → ${m.current.toFixed(2)}${books}`;
}

export function buildPick(
  pred: BsdPrediction,
  odds: OddsBook | null,
  extra?: EventExtra | null,
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
  const cells = scoreMatrix(xgH, xgA);
  const scores = topScores(cells, 5);
  const dnbHome = pH + pA > 0 ? pH / (pH + pA) : pH;

  const cands: Cand[] = [];
  const homeShort = odds.home_win != null && odds.home_win < MIN_ODDS;
  const awayShort = odds.away_win != null && odds.away_win < MIN_ODDS;
  const add = (
    market: string,
    key: MarketKey,
    p: number,
    od: number | null | undefined,
    bookKey: string,
    favBlocked = false,
    extraPen = 0,
  ) => {
    pushCand(
      cands,
      market,
      key,
      p,
      od,
      lazyPen(market, key, xg, favBlocked) + extraPen,
      bookKey,
      extra,
      xg,
    );
  };

  add(`Gana ${home}`, "1x2", pH, odds.home_win, "1x2:HOME");
  add("Empate", "1x2", pD, odds.draw, "1x2:DRAW");
  add(`Gana ${away}`, "1x2", pA, odds.away_win, "1x2:AWAY");
  add(`1X ${home} o empate`, "dc", pH + pD, odds.dc1x, "double_chance:1X", homeShort);
  add(`X2 empate o ${away}`, "dc", pD + pA, odds.dcx2, "double_chance:X2", awayShort);
  add(`DNB ${home}`, "dnb", dnbHome, odds.dnbHome, "draw_no_bet:HOME", homeShort);
  add(`DNB ${away}`, "dnb", 1 - dnbHome, odds.dnbAway, "draw_no_bet:AWAY", awayShort);
  const ml = parseML(m.score.most_likely);
  const bothLikely = !!ml && ml.h > 0 && ml.a > 0;
  const oneBlank = !!ml && (ml.h === 0 || ml.a === 0);
  add("Ambos marcan", "btts", btts, odds.btts_yes, "btts:yes", false, oneBlank ? 0.06 : 0);
  add("BTTS No", "btts", 1 - btts, odds.btts_no, "btts:no", false, bothLikely ? 0.06 : 0);
  add("Más de 1.5", "ou", ou.prob_over_15 / 100, odds.over_15_goals, "over_under_15:over");
  add("Menos de 1.5", "ou", 1 - ou.prob_over_15 / 100, odds.under_15_goals, "over_under_15:under");
  add("Más de 2.5", "ou", ou.prob_over_25 / 100, odds.over_25_goals, "over_under_25:over");
  add("Menos de 2.5", "ou", 1 - ou.prob_over_25 / 100, odds.under_25_goals, "over_under_25:under");
  add("Más de 3.5", "ou", ou.prob_over_35 / 100, odds.over_35_goals, "over_under_35:over");
  add("Menos de 3.5", "ou", 1 - ou.prob_over_35 / 100, odds.under_35_goals, "over_under_35:under");

  const cornerModel: Array<{ line: number; overPct: number }> = [];
  if (m.corners) {
    const cmap: Array<[number, number]> = [
      [8.5, m.corners.prob_over_85 / 100],
      [9.5, m.corners.prob_over_95 / 100],
      [10.5, m.corners.prob_over_105 / 100],
    ];
    for (const [line, overP] of cmap) {
      cornerModel.push({ line, overPct: pct(overP) });
      const book = odds.corners[String(line)];
      add(`Más de ${line} córners`, "corners", overP, book?.over, `total_corners:over:${line}`);
      add(`Menos de ${line} córners`, "corners", 1 - overP, book?.under, `total_corners:under:${line}`);
    }
  }

  const ahSeen = new Set<string>();
  for (const row of odds.ah) {
    const key = `${row.side}:${row.line}`;
    if (ahSeen.has(key)) continue;
    ahSeen.add(key);
    const betHome = row.side === "HOME";
    const p = ahModelP(cells, row.line, betHome);
    const ev = ahEv(cells, row.line, betHome, row.odds);
    if (row.odds < MIN_ODDS || p < 0.42) continue;
    if (Math.abs(row.line) < 0.5) continue;
    const label = betHome
      ? `Hándicap ${home} ${fmtHandicap(row.line)}`
      : `Hándicap ${away} ${fmtHandicap(-row.line)}`;
    const pen = lazyPen(label, "ah", xg, false);
    cands.push({
      market: label,
      marketKey: "ah",
      p,
      odds: Math.round(row.odds * 100) / 100,
      ev,
      modelPct: pct(p),
      impliedPct: pct(1 / row.odds),
      evPct: Math.round(ev * 1000) / 10,
      score: ev - pen + (p - 0.45) * 0.12 + contextAdj(`asian_handicap:${row.side}:${row.line}`, extra, xg),
      bookKey: `asian_handicap:${row.side}:${row.line}`,
    });
  }

  if (!cands.length) return null;
  cands.sort((a, b) => b.score - a.score || rankKey(a) - rankKey(b) || b.p - a.p);
  const best = saferSame(cands[0] as Cand, cands);
  const alts: MarketLine[] = [];

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

  const h2h = summarizeH2H(extra?.h2h);
  const wtn = pWinToNilHome(cells);
  const homeO15 = pHomeOver(cells, 1.5);
  const oddsMove = odds.moves[best.bookKey];
  const openImpliedPct = oddsMove ? pct(1 / oddsMove.opening) : undefined;

  const bullets: string[] = [
    `Modelo BSD ${pred.model.version}: ${home} ${pct(pH)}% · Empate ${pct(pD)}% · ${away} ${pct(pA)}%`,
  ];
  const homeTbl = tableLine(home, extra?.tableHome, extra?.formHome);
  const awayTbl = tableLine(away, extra?.tableAway, extra?.formAway);
  if (homeTbl && awayTbl) bullets.push(`${homeTbl} · ${awayTbl}`);
  bullets.push(
    `xG ${xgH.toFixed(2)} – ${xgA.toFixed(2)} (media ${xg.toFixed(2)}) · BSD ${m.score.most_likely} · Poisson ${scores[0].h}-${scores[0].a}`,
  );
  bullets.push(
    `BTTS ${pct(btts)}% · O2.5 ${pct(ou.prob_over_25 / 100)}% · O3.5 ${pct(ou.prob_over_35 / 100)}% · ${home} ≥2 goles ${pct(homeO15)}%`,
  );
  const moveTxt = moveLabel(oddsMove);
  if (moveTxt) bullets.push(moveTxt);
  if (cornerModel.length) {
    bullets.push(
      `Córners modelo: O8.5 ${cornerModel[0].overPct}% · O9.5 ${cornerModel[1].overPct}% · O10.5 ${cornerModel[2].overPct}%`,
    );
  }
  if (h2h) {
    bullets.push(
      `H2H ${h2h.total} pj · ${h2h.homeWins}-${h2h.draws}-${h2h.awayWins} · media ${h2h.avgGoals.toFixed(2)} goles`,
    );
  }
  if (wtn >= 0.28) bullets.push(`Local gana y no recibe: ${pct(wtn)}% (Poisson xG)`);

  const wind = extra?.weather?.wind_speed ?? null;
  const wLabel = weatherLabel(extra?.weather?.description, wind);
  const weather =
    wLabel || extra?.weather?.temperature_c != null
      ? { label: wLabel ?? "Clima", tempC: extra?.weather?.temperature_c ?? null, wind: wind ?? undefined }
      : undefined;

  const analysis = buildAnalysis(best, home, away, {
    pH,
    pD,
    pA,
    xg,
    xgH,
    xgA,
    scoreline: m.score.most_likely,
    alts,
    h2h,
    derby: extra?.derby,
    weather: weather?.label,
    formHome: extra?.formHome,
    formAway: extra?.formAway,
    tableHome: extra?.tableHome,
    tableAway: extra?.tableAway,
    oddsMove,
  });
  const rejected = rejectedBits.length
    ? `Se descarta ${rejectedBits.slice(0, 3).join(" · ")} (regla cuota mínima 1.40).`
    : "Sin favorito corto: el mercado publicado ya cumple 1.40.";

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
    odds: best.odds,
    impliedPct: best.impliedPct,
    modelPct: best.modelPct,
    evPct: best.evPct,
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
    alts,
    ou: {
      o15: pct(ou.prob_over_15 / 100),
      o25: pct(ou.prob_over_25 / 100),
      o35: pct(ou.prob_over_35 / 100),
    },
    bttsPct: pct(btts),
    scores,
    cornersModel: cornerModel,
    h2h,
    weather,
    derby: extra?.derby || undefined,
    roundLabel: extra?.roundLabel || undefined,
    neutral: extra?.neutral || undefined,
    formHome: extra?.formHome,
    formAway: extra?.formAway,
    tableHome: extra?.tableHome,
    tableAway: extra?.tableAway,
    referee: extra?.referee,
    cornersAvgHome: extra?.cornersAvgHome,
    cornersAvgAway: extra?.cornersAvgAway,
    cardsAvgHome: extra?.cardsAvgHome,
    cardsAvgAway: extra?.cardsAvgAway,
    oddsMove,
    oneXtwoMove: odds.oneXtwo,
    books: odds.books || undefined,
    openImpliedPct,
  };
}

function buildAnalysis(
  best: Cand,
  home: string,
  away: string,
  ctx: {
    pH: number;
    pD: number;
    pA: number;
    xg: number;
    xgH: number;
    xgA: number;
    scoreline: string;
    alts: MarketLine[];
    h2h?: H2HSummary;
    derby?: boolean;
    weather?: string;
    formHome?: string;
    formAway?: string;
    tableHome?: TableSnap;
    tableAway?: TableSnap;
    oddsMove?: OddsMove;
  },
) {
  const gap = best.p - 1 / best.odds;
  const value =
    gap > 0.03
      ? "El modelo está por encima de la implícita: hay valor."
      : gap > 0
        ? "Edge chico, pero del lado correcto del precio."
        : "El libro está un poco más agresivo que el modelo; se publica porque es el mercado ≥ 1.40 más limpio.";
  const attack =
    ctx.xgH - ctx.xgA >= 0.35
      ? `${home} llega con más xG (${ctx.xgH.toFixed(2)} vs ${ctx.xgA.toFixed(2)}).`
      : ctx.xgA - ctx.xgH >= 0.35
        ? `${away} llega con más xG (${ctx.xgA.toFixed(2)} vs ${ctx.xgH.toFixed(2)}).`
        : `xG parejo (${ctx.xgH.toFixed(2)}–${ctx.xgA.toFixed(2)}).`;
  const h2hTxt = ctx.h2h
    ? ` H2H ${ctx.h2h.total} pj ${ctx.h2h.homeWins}-${ctx.h2h.draws}-${ctx.h2h.awayWins}, media ${ctx.h2h.avgGoals.toFixed(2)}.`
    : "";
  const tableTxt =
    ctx.tableHome && ctx.tableAway
      ? ` Tabla ${home} ${ctx.tableHome.pos}º/${ctx.tableHome.pts}pts vs ${away} ${ctx.tableAway.pos}º/${ctx.tableAway.pts}pts.`
      : "";
  const formTxt =
    ctx.formHome && ctx.formAway ? ` Forma ${ctx.formHome}–${ctx.formAway}.` : "";
  const extra = [ctx.derby ? "Clásico local." : "", ctx.weather ? `Clima: ${ctx.weather}.` : ""]
    .filter(Boolean)
    .join(" ");
  const altTxt = ctx.alts[0]
    ? ` Alternativa: ${ctx.alts[0].market} @ ${ctx.alts[0].odds.toFixed(2)}.`
    : "";
  return `${best.market} @ ${best.odds.toFixed(2)} · 1X2 ${pct(ctx.pH)}-${pct(ctx.pD)}-${pct(ctx.pA)} · marcador tipo ${ctx.scoreline}. ${attack} ${value}${tableTxt}${formTxt}${h2hTxt}${extra ? ` ${extra}` : ""}${altTxt}`;
}
