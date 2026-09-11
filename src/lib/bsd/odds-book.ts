import type { OddsMove, PinnacleTriple } from "@/lib/pick-types";

export type SlimOdds = {
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

export type OddsRow = {
  event_id?: number;
  market: string;
  outcome: string;
  line: number | null;
  decimal_odds: number;
  outcome_name?: string;
  previous_decimal_odds?: number | null;
  opening_decimal_odds?: number | null;
  movement?: string | null;
  bookmaker_count?: number | null;
};

export type OddsBook = SlimOdds & {
  dc1x?: number;
  dcx2?: number;
  dc12?: number;
  dnbHome?: number;
  dnbAway?: number;
  over_05?: number;
  under_05?: number;
  corners: Record<string, { over?: number; under?: number }>;
  ah: Array<{ side: "HOME" | "AWAY"; line: number; odds: number }>;
  moves: Record<string, OddsMove>;
  oneXtwo: { home?: OddsMove; draw?: OddsMove; away?: OddsMove };
  books: number;
  pinnacle?: PinnacleTriple;
};

export function emptyBook(): OddsBook {
  return { corners: {}, ah: [], moves: {}, oneXtwo: {}, books: 0 };
}

export function fromSlim(odds: SlimOdds): OddsBook {
  return { ...odds, corners: {}, ah: [], moves: {}, oneXtwo: {}, books: 0 };
}

const SLIM_KEYS = [
  "home_win",
  "draw",
  "away_win",
  "over_15_goals",
  "over_25_goals",
  "over_35_goals",
  "under_15_goals",
  "under_25_goals",
  "under_35_goals",
  "btts_yes",
  "btts_no",
] as const;

/** Fill holes in `base` from `extra` without overwriting consensus prices. */
export function fillBook(base: OddsBook, extra: OddsBook): OddsBook {
  const out: OddsBook = {
    ...base,
    corners: { ...base.corners },
    ah: base.ah.length ? base.ah : extra.ah,
    moves: { ...extra.moves, ...base.moves },
    oneXtwo: {
      home: base.oneXtwo.home ?? extra.oneXtwo.home,
      draw: base.oneXtwo.draw ?? extra.oneXtwo.draw,
      away: base.oneXtwo.away ?? extra.oneXtwo.away,
    },
    books: base.books || extra.books,
    pinnacle: base.pinnacle ?? extra.pinnacle,
  };
  for (const k of SLIM_KEYS) {
    if (out[k] == null && extra[k] != null) out[k] = extra[k];
  }
  if (out.dc1x == null) out.dc1x = extra.dc1x;
  if (out.dcx2 == null) out.dcx2 = extra.dcx2;
  if (out.dc12 == null) out.dc12 = extra.dc12;
  if (out.dnbHome == null) out.dnbHome = extra.dnbHome;
  if (out.dnbAway == null) out.dnbAway = extra.dnbAway;
  if (out.over_05 == null) out.over_05 = extra.over_05;
  if (out.under_05 == null) out.under_05 = extra.under_05;
  for (const [line, v] of Object.entries(extra.corners)) {
    out.corners[line] = { ...v, ...out.corners[line] };
  }
  return out;
}

export function pinTriple(book: OddsBook): PinnacleTriple | null {
  const home = book.home_win ?? null;
  const draw = book.draw ?? null;
  const away = book.away_win ?? null;
  if (home == null && draw == null && away == null) return null;
  return { home, draw, away };
}

export function marketOdd(
  book: OddsBook,
  marketKey: string,
  market: string,
  home: string,
  away: string,
): number | null {
  const more = market.startsWith("Más");
  if (marketKey === "1x2") {
    if (market === "Empate") return book.draw ?? null;
    if (market.includes(home)) return book.home_win ?? null;
    if (market.includes(away)) return book.away_win ?? null;
    return null;
  }
  if (marketKey === "btts") return market.includes("No") ? (book.btts_no ?? null) : (book.btts_yes ?? null);
  if (marketKey === "dc") {
    if (market.startsWith("1X")) return book.dc1x ?? null;
    if (market.startsWith("X2")) return book.dcx2 ?? null;
    return book.dc12 ?? null;
  }
  if (marketKey === "dnb") return market.includes(home) ? (book.dnbHome ?? null) : (book.dnbAway ?? null);
  if (marketKey === "ou") {
    if (market.includes("0.5")) return more ? (book.over_05 ?? null) : (book.under_05 ?? null);
    if (market.includes("1.5")) return more ? (book.over_15_goals ?? null) : (book.under_15_goals ?? null);
    if (market.includes("2.5")) return more ? (book.over_25_goals ?? null) : (book.under_25_goals ?? null);
    if (market.includes("3.5")) return more ? (book.over_35_goals ?? null) : (book.under_35_goals ?? null);
  }
  if (marketKey === "corners") {
    const line = market.match(/(\d+(?:\.\d+)?)/)?.[1];
    if (!line) return null;
    const row = book.corners[line];
    if (!row) return null;
    return more ? (row.over ?? null) : (row.under ?? null);
  }
  return null;
}

export function moveKey(market: string, outcome: string, line?: number | null) {
  return line == null || line === undefined ? `${market}:${outcome}` : `${market}:${outcome}:${line}`;
}

function asMove(r: OddsRow): OddsMove | undefined {
  const current = r.decimal_odds;
  if (current == null || current <= 1) return undefined;
  const opening = r.opening_decimal_odds ?? current;
  const movement =
    r.movement === "DRIFTING" || r.movement === "SHORTENING" ? r.movement : "";
  return {
    opening: Math.round(opening * 1000) / 1000,
    previous: r.previous_decimal_odds ?? undefined,
    current: Math.round(current * 1000) / 1000,
    movement,
    books: r.bookmaker_count ?? 0,
  };
}

export function parseOddsRows(rows: OddsRow[]): OddsBook {
  const b = emptyBook();
  for (const r of rows) {
    const o = r.decimal_odds;
    if (o == null || o <= 1) continue;
    const move = asMove(r);
    if (move) {
      b.moves[moveKey(r.market, r.outcome, r.line)] = move;
      if (move.books > b.books) b.books = move.books;
    }
    switch (r.market) {
      case "1x2":
        if (r.outcome === "HOME") {
          b.home_win = o;
          if (move) b.oneXtwo.home = move;
        } else if (r.outcome === "DRAW") {
          b.draw = o;
          if (move) b.oneXtwo.draw = move;
        } else if (r.outcome === "AWAY") {
          b.away_win = o;
          if (move) b.oneXtwo.away = move;
        }
        break;
      case "double_chance":
        if (r.outcome === "1X") b.dc1x = o;
        else if (r.outcome === "X2") b.dcx2 = o;
        else if (r.outcome === "12") b.dc12 = o;
        break;
      case "draw_no_bet":
        if (r.outcome === "HOME") b.dnbHome = o;
        else if (r.outcome === "AWAY") b.dnbAway = o;
        break;
      case "btts":
        if (r.outcome === "yes") b.btts_yes = o;
        else if (r.outcome === "no") b.btts_no = o;
        break;
      case "over_under_05":
        if (r.outcome === "over") b.over_05 = o;
        else b.under_05 = o;
        break;
      case "over_under_15":
        if (r.outcome === "over") b.over_15_goals = o;
        else b.under_15_goals = o;
        break;
      case "over_under_25":
        if (r.outcome === "over") b.over_25_goals = o;
        else b.under_25_goals = o;
        break;
      case "over_under_35":
        if (r.outcome === "over") b.over_35_goals = o;
        else b.under_35_goals = o;
        break;
      case "total_corners":
        if (r.line == null) break;
        {
          const k = String(r.line);
          b.corners[k] ??= {};
          if (r.outcome === "over") b.corners[k].over = o;
          else b.corners[k].under = o;
        }
        break;
      case "asian_handicap":
        if (r.line == null || Math.abs(r.line) > 1.5) break;
        b.ah.push({
          side: r.outcome === "AWAY" ? "AWAY" : "HOME",
          line: r.line,
          odds: o,
        });
        break;
      default:
        break;
    }
  }
  return b;
}

export function parseOddsByEvent(rows: OddsRow[]): Map<number, OddsBook> {
  const grouped = new Map<number, OddsRow[]>();
  for (const r of rows) {
    if (r.event_id == null) continue;
    const list = grouped.get(r.event_id);
    if (list) list.push(r);
    else grouped.set(r.event_id, [r]);
  }
  const out = new Map<number, OddsBook>();
  for (const [id, list] of grouped) out.set(id, parseOddsRows(list));
  return out;
}
