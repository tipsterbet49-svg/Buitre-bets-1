import type { ScoreCell } from "@/lib/pick-types";

export function poissonP(lambda: number, k: number) {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  let p = Math.exp(-lambda);
  for (let i = 1; i <= k; i++) p *= lambda / i;
  return p;
}

export function scoreMatrix(xgH: number, xgA: number, max = 7): ScoreCell[] {
  const cells: ScoreCell[] = [];
  for (let h = 0; h <= max; h++) {
    const ph = poissonP(xgH, h);
    for (let a = 0; a <= max; a++) {
      cells.push({ h, a, p: ph * poissonP(xgA, a) });
    }
  }
  return cells;
}

export function topScores(cells: ScoreCell[], n = 5) {
  return [...cells].sort((a, b) => b.p - a.p).slice(0, n);
}

export function pTotalOver(cells: ScoreCell[], line: number) {
  let p = 0;
  for (const c of cells) if (c.h + c.a > line) p += c.p;
  return p;
}

export function pHomeOver(cells: ScoreCell[], line: number) {
  let p = 0;
  for (const c of cells) if (c.h > line) p += c.p;
  return p;
}

export function pAwayOver(cells: ScoreCell[], line: number) {
  let p = 0;
  for (const c of cells) if (c.a > line) p += c.p;
  return p;
}

export function pWinToNilHome(cells: ScoreCell[]) {
  let p = 0;
  for (const c of cells) if (c.h > c.a && c.a === 0) p += c.p;
  return p;
}

function splitQuarter(line: number): number[] {
  const q = Math.round(line * 4) / 4;
  const four = Math.round(Math.abs(q) * 4);
  if (four % 2 === 1) return [q - 0.25, q + 0.25];
  return [q];
}

/** `homeLine` is the handicap on the home team (BSD convention). */
export function ahWinPushLose(
  cells: ScoreCell[],
  homeLine: number,
  betHome: boolean,
): { win: number; push: number; lose: number } {
  const lines = splitQuarter(homeLine);
  const w = 1 / lines.length;
  let win = 0;
  let push = 0;
  let lose = 0;
  for (const c of cells) {
    const margin = c.h - c.a;
    for (const L of lines) {
      const adj = betHome ? margin + L : -(margin + L);
      if (adj > 0) win += c.p * w;
      else if (adj < 0) lose += c.p * w;
      else push += c.p * w;
    }
  }
  return { win, push, lose };
}

export function ahModelP(cells: ScoreCell[], homeLine: number, betHome: boolean) {
  const { win, push } = ahWinPushLose(cells, homeLine, betHome);
  return win + 0.5 * push;
}

export function ahEv(cells: ScoreCell[], homeLine: number, betHome: boolean, odds: number) {
  const { win, lose } = ahWinPushLose(cells, homeLine, betHome);
  return win * (odds - 1) - lose;
}
