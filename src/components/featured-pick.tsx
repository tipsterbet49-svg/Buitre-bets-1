import { PickRow } from "@/components/pick-row";
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

export function pickFeatured(picks: PickItem[]) {
  const upcoming = picks.filter((p) => p.status === "notstarted");
  const pool = upcoming.length ? upcoming : picks;
  if (!pool.length) return null;
  return [...pool].sort((a, b) => b.conf - a.conf)[0];
}
