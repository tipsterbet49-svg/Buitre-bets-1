import { ShieldAlert, TrendingUp } from "lucide-react";
import type { PickItem } from "@/lib/pick-types";
import { dayBucket } from "@/lib/art-time";

function stars(conf: number) {
  const n = conf >= 78 ? 5 : conf >= 72 ? 4 : conf >= 66 ? 3 : 2;
  return Array.from({ length: 5 }, (_, i) => (
    <span key={i} className={i < n ? "text-primary" : "text-border"}>
      ★
    </span>
  ));
}

function confLabel(conf: number) {
  if (conf >= 78) return "Máxima";
  if (conf >= 72) return "Alta";
  return "Media-Alta";
}

function dayLabel(iso: string) {
  const b = dayBucket(iso);
  if (b === "hoy") return "Hoy";
  if (b === "manana") return "Mañana";
  return "Próximo";
}

function clock(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadge(status: string) {
  if (!status || status === "notstarted") return null;
  if (status === "finished") return "Final";
  return "En vivo";
}

export function PickCard({ p }: { p: PickItem }) {
  const live = statusBadge(p.status);
  const evPositive = p.evPct > 0;
  const share =
    "https://t.me/share/url?url=" +
    encodeURIComponent("https://predicciones.pro") +
    "&text=" +
    encodeURIComponent(
      `Predicciones Pro\n${p.league} · ${p.home} vs ${p.away}\n${p.market} @ ${p.odds.toFixed(2)}\nEV ${evPositive ? "+" : ""}${p.evPct}%\n${p.analysis.slice(0, 240)}`,
    );

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 transition-[border-color] duration-150 hover:border-primary/50">
      <div className="flex items-center justify-between gap-2">
        <span className="max-w-[55%] truncate rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-xs font-extrabold tracking-wide text-accent">
          {p.league}
        </span>
        <span className="flex items-center gap-2 text-xs font-semibold text-muted">
          {live && (
            <span className="rounded-full bg-danger/15 px-2 py-0.5 text-xs font-extrabold uppercase tracking-wide text-danger">
              {live}
            </span>
          )}
          {dayLabel(p.kickoff)} · {clock(p.kickoff)}
        </span>
      </div>

      <div className="flex items-center justify-between rounded-lg bg-bg/40 px-3 py-2">
        <span className="text-xs font-bold uppercase tracking-wide text-muted">Confianza</span>
        <span className="tracking-wider">{stars(p.conf)}</span>
        <span className="rounded bg-primary/15 px-2 py-0.5 text-xs font-extrabold text-primary">
          {confLabel(p.conf)}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <p className="text-center text-sm font-extrabold leading-tight">{p.home}</p>
        <span className="flex size-8 items-center justify-center rounded-full bg-bg text-xs font-black text-muted">
          VS
        </span>
        <p className="text-center text-sm font-extrabold leading-tight">{p.away}</p>
      </div>

      <div>
        <div className="mb-1 flex justify-between text-xs text-muted">
          <span>Local {Math.round(p.pH * 100)}%</span>
          <span>Empate {Math.round(p.pD * 100)}%</span>
          <span>Visitante {Math.round(p.pA * 100)}%</span>
        </div>
        <div className="flex h-1.5 overflow-hidden rounded-full bg-bg">
          <i className="block bg-primary" style={{ width: `${p.pH * 100}%` }} />
          <i className="block bg-muted" style={{ width: `${p.pD * 100}%` }} />
          <i className="block bg-tg" style={{ width: `${p.pA * 100}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Pick (cuota ≥ 1.50)</p>
          <p className="text-sm font-extrabold">{p.market}</p>
        </div>
        <div className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xl font-black text-primary">
          {p.odds.toFixed(2)}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-md bg-bg/50 py-1.5">
          <p className="text-xs text-muted">Modelo</p>
          <p className="font-extrabold text-primary">{p.modelPct}%</p>
        </div>
        <div className="rounded-md bg-bg/50 py-1.5">
          <p className="text-xs text-muted">Implícita</p>
          <p className="font-extrabold">{p.impliedPct}%</p>
        </div>
        <div className="rounded-md bg-bg/50 py-1.5">
          <p className="text-xs text-muted">EV</p>
          <p
            className={
              evPositive
                ? "font-extrabold text-primary"
                : p.evPct < 0
                  ? "font-extrabold text-danger"
                  : "font-extrabold"
            }
          >
            {evPositive ? "+" : ""}
            {p.evPct}%
          </p>
        </div>
      </div>

      <ul className="space-y-1 text-xs text-muted">
        {p.bullets.map((b) => (
          <li key={b} className="flex gap-2">
            <TrendingUp className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <p className="text-sm leading-relaxed text-muted">
        <span className="font-bold text-fg">Por qué este pick: </span>
        {p.analysis}
      </p>

      <p className="flex gap-2 rounded-md border border-danger/20 bg-danger/5 p-2 text-xs text-muted">
        <ShieldAlert className="mt-0.5 size-3.5 shrink-0 text-danger" />
        {p.rejected}
      </p>

      <div className="flex flex-wrap gap-1">
        {p.sources.map((s) => (
          <span key={s} className="rounded border border-border px-1.5 py-0.5 text-xs font-bold text-muted">
            {s}
          </span>
        ))}
        <span className="rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-xs font-bold text-primary">
          min 1.50
        </span>
      </div>

      <a
        href={share}
        target="_blank"
        rel="noreferrer"
        className="rounded-lg border border-tg/40 bg-tg/10 py-2 text-center text-xs font-bold text-tg"
      >
        Compartir en Telegram
      </a>
    </article>
  );
}
