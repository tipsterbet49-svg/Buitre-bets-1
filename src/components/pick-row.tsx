import { useState } from "react";
import { ChevronDown, ShieldAlert, TrendingUp } from "lucide-react";
import { Crest } from "@/components/crest";
import type { PickItem } from "@/lib/pick-types";
import { dayBucket } from "@/lib/art-time";

function confLabel(conf: number) {
  if (conf >= 78) return "Máxima";
  if (conf >= 72) return "Alta";
  return "Media";
}

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

export function PickRow({ p, featured = false }: { p: PickItem; featured?: boolean }) {
  const [open, setOpen] = useState(false);
  const live = statusLabel(p.status);
  const max = p.conf >= 78;
  const hasScore = p.homeScore != null && p.awayScore != null;
  const share =
    "https://t.me/share/url?url=" +
    encodeURIComponent("https://predicciones.pro") +
    "&text=" +
    encodeURIComponent(
      `Predicciones Pro · ${p.league}\n${p.home} vs ${p.away}\n${p.market} @ ${p.odds.toFixed(2)}\nEV ${p.evPct > 0 ? "+" : ""}${p.evPct}%`,
    );

  return (
    <article
      className={`break-inside-avoid rounded-xl bg-card p-4 transition-[box-shadow,transform] duration-150 hover:-translate-y-0.5 ${
        max ? "shadow-[var(--shadow-max)]" : "shadow-[var(--shadow-border)]"
      } hover:shadow-[var(--shadow-border-hover)]`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left"
        aria-expanded={open}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs font-semibold tracking-wide text-muted uppercase">
            {p.league} · {clockLine(p.kickoff)}
          </p>
          <span className="flex shrink-0 items-center gap-2">
            {max && (
              <span className="rounded-md bg-accent px-1.5 py-0.5 text-xs font-black tracking-wide text-primary-fg uppercase">
                Máx
              </span>
            )}
            {live && (
              <span className="text-xs font-bold uppercase tracking-wide text-danger">
                {live}
                {p.minute ? ` ${p.minute}'` : ""}
              </span>
            )}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="flex min-w-0 flex-col items-center gap-1.5">
            <Crest name={p.home} src={p.homeCrest} size={featured ? "lg" : "md"} />
            <p className="w-full truncate text-center text-xs font-bold">{p.home}</p>
          </div>
          <div className="flex flex-col items-center gap-1 px-1">
            {hasScore ? (
              <p className={`text-xl font-black tabular-nums ${live ? "text-danger" : ""}`}>
                {p.homeScore}–{p.awayScore}
              </p>
            ) : (
              <span className="rounded-md bg-bg px-2 py-0.5 text-xs font-extrabold tracking-widest text-muted">
                VS
              </span>
            )}
          </div>
          <div className="flex min-w-0 flex-col items-center gap-1.5">
            <Crest name={p.away} src={p.awayCrest} size={featured ? "lg" : "md"} />
            <p className="w-full truncate text-center text-xs font-bold">{p.away}</p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3 rounded-xl bg-accent/10 px-3 py-2.5 shadow-[var(--shadow-rec)]">
          <span className="min-w-0 flex-1 truncate font-bold text-accent">{p.market}</span>
          <span className="shrink-0 text-right">
            <span className="block text-xs font-semibold tracking-widest text-muted uppercase">
              cuota
            </span>
            <span className="block text-lg font-black leading-none tabular-nums">
              {p.odds.toFixed(2)}
            </span>
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted">
          <span>
            {confLabel(p.conf)}
            {p.evPct !== 0 && (
              <span className={p.evPct > 0 ? "ml-2 font-semibold text-primary" : "ml-2"}>
                EV {p.evPct > 0 ? "+" : ""}
                {p.evPct}%
              </span>
            )}
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-primary">
            {open ? "Ocultar" : "Ver análisis"}
            <ChevronDown className={`size-4 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
          </span>
        </div>
      </button>

      {open && (
        <div className="mt-3 space-y-3 border-t border-border pt-3">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg bg-bg py-2">
              <p className="text-muted">Modelo</p>
              <p className="font-semibold tabular-nums text-primary">{p.modelPct}%</p>
            </div>
            <div className="rounded-lg bg-bg py-2">
              <p className="text-muted">Implícita</p>
              <p className="font-semibold tabular-nums">{p.impliedPct}%</p>
            </div>
            <div className="rounded-lg bg-bg py-2">
              <p className="text-muted">Confianza</p>
              <p className="font-semibold tabular-nums">{p.conf}</p>
            </div>
          </div>
          <div>
            <div className="mb-1 flex justify-between text-xs text-muted">
              <span>1 {Math.round(p.pH * 100)}%</span>
              <span>X {Math.round(p.pD * 100)}%</span>
              <span>2 {Math.round(p.pA * 100)}%</span>
            </div>
            <div className="flex h-1.5 overflow-hidden rounded-full bg-bg">
              <i className="block bg-primary" style={{ width: `${p.pH * 100}%` }} />
              <i className="block bg-muted" style={{ width: `${p.pD * 100}%` }} />
              <i className="block bg-fg/40" style={{ width: `${p.pA * 100}%` }} />
            </div>
          </div>
          <ul className="space-y-1 text-xs text-pretty text-muted">
            {p.bullets.slice(0, 3).map((b) => (
              <li key={b} className="flex gap-2">
                <TrendingUp className="mt-0.5 size-3.5 shrink-0 text-primary" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm leading-relaxed text-pretty text-muted">{p.analysis}</p>
          <p className="flex gap-2 rounded-xl bg-danger/5 p-3 text-xs text-muted">
            <ShieldAlert className="mt-0.5 size-3.5 shrink-0 text-danger" />
            {p.rejected}
          </p>
          <a
            href={share}
            target="_blank"
            rel="noreferrer"
            className="block rounded-xl bg-tg/10 py-2.5 text-center text-xs font-semibold text-tg"
          >
            Compartir en Telegram
          </a>
        </div>
      )}
    </article>
  );
}
