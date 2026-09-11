import type { TableSnap } from "@/lib/pick-types";

export type StandingRow = {
  position: number;
  teamId: number;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
  xgf?: number;
  xga?: number;
  form?: string;
  zone?: string;
  group?: string;
};

type Raw = {
  position?: number;
  team_id?: number;
  team_name?: string;
  played?: number;
  won?: number;
  drawn?: number;
  lost?: number;
  gf?: number;
  ga?: number;
  gd?: number;
  pts?: number;
  xgf?: number;
  xga?: number;
  form?: string;
  zone?: { key?: string; label?: string } | null;
};

function shortZone(label?: string): string | undefined {
  if (!label) return undefined;
  const k = label.toLowerCase();
  if (k.includes("champions")) return "CL";
  if (k.includes("libertadores")) return "Lib";
  if (k.includes("sudamericana")) return "Suda";
  if (k.includes("conference")) return "ECL";
  if (k.includes("europa")) return "EL";
  if (k.includes("relegat") || k.includes("descenso")) return "Descenso";
  if (k.includes("playoff") || k.includes("play-off")) return "Playoff";
  if (k.includes("promotion") || k.includes("ascenso")) return "Ascenso";
  if (k.includes("championship")) return "Championship";
  return label;
}

function shortGroup(name?: string): string | undefined {
  if (!name) return undefined;
  return name.replace(/^Group\s+/i, "").trim() || undefined;
}

function norm(r: Raw, group?: string): StandingRow {
  return {
    position: r.position ?? 0,
    teamId: r.team_id ?? 0,
    teamName: r.team_name ?? "",
    played: r.played ?? 0,
    won: r.won ?? 0,
    drawn: r.drawn ?? 0,
    lost: r.lost ?? 0,
    gf: r.gf ?? 0,
    ga: r.ga ?? 0,
    gd: r.gd ?? 0,
    pts: r.pts ?? 0,
    xgf: r.xgf,
    xga: r.xga,
    form: r.form || undefined,
    zone: shortZone(r.zone?.label),
    group: shortGroup(group),
  };
}

export function flattenStandings(payload: {
  standings?: Raw[];
  groups?: Record<string, Raw[]> | Raw[] | null;
  grouped?: boolean;
}): StandingRow[] {
  const out: StandingRow[] = [];
  if (Array.isArray(payload.standings)) {
    for (const r of payload.standings) out.push(norm(r));
  }
  const groups = payload.groups;
  if (groups && typeof groups === "object" && !Array.isArray(groups)) {
    for (const [name, rows] of Object.entries(groups)) {
      if (!Array.isArray(rows)) continue;
      for (const r of rows) out.push(norm(r, name));
    }
  }
  return out;
}

export function toTableSnap(row: StandingRow): TableSnap {
  return {
    pos: row.position,
    played: row.played,
    pts: row.pts,
    gf: row.gf,
    ga: row.ga,
    gd: row.gd,
    xgf: row.xgf,
    xga: row.xga,
    zone: row.zone,
    group: row.group,
  };
}
