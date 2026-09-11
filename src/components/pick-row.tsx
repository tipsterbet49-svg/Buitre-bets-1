import { Crest } from "@/components/crest";
import type { PickItem } from "@/lib/pick-types";
import { dayBucket } from "@/lib/art-time";
import { confWord, plainWhy } from "@/lib/plain-why";

function statusLabel(status: string) {
  if (!status || status === "notstarted") return null;
  if (status === "finished") return "Final";
  return "En vivo";
}

function clockLine(iso: string) {
  const day = dayBucket(iso);
  const when = day === "hoy" ? "Hoy" : day === "manana" ? "Mañana" : "";
  const clock = new Date(iso).toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
  return when ? `${when} · ${clock}` : clock;
}

function FormDots({ form }: { form?: string }) {
  if (!form) return null;
  const letters = form.replace(/[^WDLwdl]/g, "").slice(-5).toUpperCase().split("");
  if (!letters.length) return null;
  return (
    <span className="flex items-center justify-center gap-0.5" aria-label={`Forma ${letters.join(" ")}`}>
      {letters.map((l, i) => (
        <i
          key={`${l}-${i}`}
          className={
            l === "W"
              ? "size-2 rounded-full bg-primary"
              : l === "D"
                ? "size-2 rounded-full bg-muted"
                : "size-2 rounded-full bg-danger"
          }
        />
      ))}
    </span>
  );
}

function TeamHead({
  name,
  crest,
  form,
  featured,
}: {
  name: string;
  crest?: string;
  form?: string;
  featured: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5">
      <Crest name={name} src={crest} size={featured ? "lg" : "md"} />
      <FormDots form={form} />
      <p className="w-full truncate text-center text-sm font-semibold">{name}</p>
    </div>
  );
}

export function PickRow({ p, featured = false }: { p: PickItem; featured?: boolean }) {
  const live = statusLabel(p.status);
  const max = p.conf >= 78;
  const hasScore = p.homeScore != null && p.awayScore != null;
  const why = plainWhy(p);

  return (
    <article
      className={`break-inside-avoid rounded-xl bg-card p-4 transition-[box-shadow,transform] duration-150 hover:-translate-y-0.5 ${
        max ? "shadow-[var(--shadow-max)]" : "shadow-[var(--shadow-border)]"
      } hover:shadow-[var(--shadow-border-hover)]`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs font-medium tracking-wide text-muted">
          {p.league} · {clockLine(p.kickoff)}
          {p.derby ? " · Clásico" : ""}
        </p>
        <span className="flex shrink-0 items-center gap-2">
          {max && (
            <span className="rounded-md bg-accent px-1.5 py-0.5 text-xs font-bold text-primary-fg">
              Fuerte
            </span>
          )}
          {live && (
            <span className="text-xs font-bold text-danger">
              {live}
              {p.minute ? ` ${p.minute}'` : ""}
            </span>
          )}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <TeamHead name={p.home} crest={p.homeCrest} form={p.formHome} featured={featured} />
        <div className="flex flex-col items-center px-1">
          {hasScore ? (
            <p className={`text-xl font-black tabular-nums ${live ? "text-danger" : ""}`}>
              {p.homeScore}–{p.awayScore}
            </p>
          ) : (
            <span className="text-xs font-bold tracking-widest text-muted">VS</span>
          )}
        </div>
        <TeamHead name={p.away} crest={p.awayCrest} form={p.formAway} featured={featured} />
      </div>

      <div className="mt-3 flex items-center gap-3 rounded-xl bg-accent/10 px-3 py-2.5 shadow-[var(--shadow-rec)]">
        <span className="min-w-0 flex-1 truncate font-bold text-accent">{p.market}</span>
        <span className="shrink-0 text-right">
          <span className="block text-xs font-medium text-muted">BetWinner</span>
          <span className="block text-lg font-black leading-none tabular-nums">{p.odds.toFixed(2)}</span>
        </span>
      </div>

      <p className="mt-2.5 text-sm leading-relaxed text-pretty text-muted">{why}</p>
      <p className="mt-2 text-xs font-medium text-muted">{confWord(p.conf)}</p>
    </article>
  );
}
