import type { PickItem } from "@/lib/pick-types";

function formSwing(form?: string) {
  if (!form) return 0;
  const last = form.replace(/[^WDLwdl]/g, "").slice(-5).toUpperCase();
  let n = 0;
  for (const c of last) {
    if (c === "W") n += 1;
    if (c === "L") n -= 1;
  }
  return n;
}

function parseScore(s?: string) {
  const m = s?.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (!m) return null;
  return { h: Number(m[1]), a: Number(m[2]) };
}

function scoreFitsPick(p: PickItem) {
  const sc = parseScore(p.scoreline);
  if (!sc) return false;
  const t = sc.h + sc.a;
  const both = sc.h > 0 && sc.a > 0;
  const m = p.market.toLowerCase();
  if (m.includes("btts no") && both) return false;
  if (m.includes("ambos marcan") && !both) return false;
  if (m.includes("menos de 0.5") && t > 0) return false;
  if (m.includes("menos de 1.5") && t >= 2) return false;
  if (m.includes("menos de 2.5") && t >= 3) return false;
  if (m.includes("menos de 3.5") && t >= 4) return false;
  if (m.includes("más de 2.5") && t < 3) return false;
  if (m.includes("más de 1.5") && t < 2) return false;
  if (m.startsWith("gana") && m.includes(p.home.toLowerCase()) && sc.h <= sc.a) return false;
  if (m.startsWith("gana") && m.includes(p.away.toLowerCase()) && sc.a <= sc.h) return false;
  if (m === "empate" && sc.h !== sc.a) return false;
  return true;
}

function n1(n: number) {
  return n.toFixed(1).replace(/\.0$/, "");
}

function marketHook(p: PickItem): string {
  const m = p.market.toLowerCase();
  if (m.includes("menos de") && m.includes("córner")) return "Pocos córners: juego por el medio.";
  if (m.includes("más de") && m.includes("córner")) {
    if (m.includes("8.5") || m.includes("9.5")) return "Hay córners, línea accesible.";
    return "Hay córners: presionan por las puntas.";
  }
  if (m.includes("tarjeta")) return "Partido para faltas y amarillas.";
  if (m.includes("menos de 0.5")) return "Pinta 0-0.";
  if (m.includes("menos de 1.5")) return "Como mucho un gol.";
  if (m.includes("menos de 2.5")) return "Partido trabado, para pocos goles.";
  if (m.includes("menos de 3.5")) return "Hay gol, pero no se va de score.";
  if (m.includes("más de 3.5")) return "Partido abierto, varios goles.";
  if (m.includes("más de 2.5")) return "Tiene para más de dos goles.";
  if (m.includes("más de 1.5")) return "Al menos un par de goles.";
  if (m.includes("btts no") || m === "btts no") return "Uno se queda en blanco.";
  if (m.includes("ambos marcan")) return "Los dos llegan al arco.";
  if (m.startsWith("1x")) return `${p.home} no pierde.`;
  if (m.startsWith("x2")) return `${p.away} no pierde.`;
  if (m.startsWith("dnb")) return "Sin empate: se juega al ganador.";
  if (m.includes("hándicap") || m.includes("handicap")) return "Hay que darle metros a un lado.";
  if (m === "empate") return "Muy parejo: pinta empate.";
  if (m.startsWith("gana")) return `${p.market}.`;
  return p.market;
}

function dataBit(p: PickItem): string | null {
  const m = p.market.toLowerCase();
  const media = p.xgHome + p.xgAway;

  if (m.includes("córner") && p.cornersAvgHome != null && p.cornersAvgAway != null) {
    return `${p.home} promedia ${n1(p.cornersAvgHome)} córners, ${p.away} ${n1(p.cornersAvgAway)}.`;
  }
  if (m.includes("tarjeta") && p.referee) {
    return `Árbitro ${p.referee.name}: ${n1(p.referee.avgYellow)} amarillas por partido.`;
  }
  if (m.includes("ambos marcan") || m.includes("btts no")) {
    if (scoreFitsPick(p) && p.scoreline) return `El más probable es ${p.scoreline}.`;
    return `Media ${n1(media)} goles.`;
  }
  if (m.includes("menos de") || m.includes("más de")) {
    const score = scoreFitsPick(p) && p.scoreline ? ` Pinta ${p.scoreline}.` : "";
    return `Media ${n1(media)} goles.${score}`;
  }
  if (m.includes("hándicap") || m.startsWith("gana") || m.startsWith("1x") || m.startsWith("x2") || m.startsWith("dnb") || m === "empate") {
    const fh = formSwing(p.formHome);
    const fa = formSwing(p.formAway);
    if (fh >= 2 && fh > fa + 1) return `${p.home} viene mejor de forma.`;
    if (fa >= 2 && fa > fh + 1) return `${p.away} viene mejor de forma.`;
    if (p.tableHome && p.tableAway) {
      if (p.tableHome.pos + 5 <= p.tableAway.pos) return `${p.home} ${p.tableHome.pos}º, ${p.away} ${p.tableAway.pos}º.`;
      if (p.tableAway.pos + 5 <= p.tableHome.pos) return `${p.away} ${p.tableAway.pos}º, ${p.home} ${p.tableHome.pos}º.`;
    }
    if (scoreFitsPick(p) && p.scoreline) return `Pinta ${p.scoreline}.`;
    return `Media ${n1(media)} goles.`;
  }
  if (p.derby) return "Es un clásico, suele cerrarse.";
  if (scoreFitsPick(p) && p.scoreline) return `Pinta ${p.scoreline}.`;
  return `Media ${n1(media)} goles.`;
}

/** Hook + un datito. Mismo tono en todos los picks. */
export function plainWhy(p: PickItem): string {
  const extra = dataBit(p);
  const hook = marketHook(p);
  if (!extra || extra === hook) return hook;
  return `${hook} ${extra}`;
}

export function confWord(conf: number) {
  if (conf >= 78) return "Fuerte";
  if (conf >= 72) return "Clara";
  return "Jugada";
}
