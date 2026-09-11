import { PickRow } from "@/components/pick-row";
import { dayBucket } from "@/lib/art-time";
import type { PickItem } from "@/lib/pick-types";

export function FeaturedPick({ p }: { p: PickItem }) {
  return (
    <section id="destacado" className="scroll-mt-20">
      <p className="text-xs font-semibold tracking-wide text-primary">Destacado</p>
      <div className="mt-3 max-w-lg">
        <PickRow p={p} featured />
      </div>
    </section>
  );
}

function byConf(a: PickItem, b: PickItem) {
  return b.conf - a.conf || new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime();
}

/** Hoy primero. Si no hay nada hoy, mañana. Nunca un sábado si hoy hay partido. */
export function pickFeatured(picks: PickItem[]) {
  const open = (xs: PickItem[]) => xs.filter((p) => p.status === "notstarted");
  const hoy = open(picks.filter((p) => dayBucket(p.kickoff) === "hoy"));
  const manana = open(picks.filter((p) => dayBucket(p.kickoff) === "manana"));
  const rest = open(picks);
  const pool = hoy.length ? hoy : manana.length ? manana : rest.length ? rest : picks;
  if (!pool.length) return null;
  return [...pool].sort(byConf)[0];
}
