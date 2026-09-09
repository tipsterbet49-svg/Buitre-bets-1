import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PickCard } from "@/components/pick-card";
import { Assistant } from "@/components/assistant";
import { PICKS, type PickItem } from "@/data/picks";

export const Route = createFileRoute("/")({ component: Home });

type DayF = "hoy" | "manana" | "all";
type LeagueF = "all" | PickItem["leagueKey"];

function artDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  });
}
function todayArt() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  });
}
function tomorrowArt() {
  const [y, m, d] = todayArt().split("-").map(Number);
  const next = new Date(y, m - 1, d + 1);
  const mm = String(next.getMonth() + 1).padStart(2, "0");
  const dd = String(next.getDate()).padStart(2, "0");
  return `${next.getFullYear()}-${mm}-${dd}`;
}

function Home() {
  const [day, setDay] = useState<DayF>("hoy");
  const [league, setLeague] = useState<LeagueF>("all");

  const filtered = useMemo(() => {
    const t = todayArt();
    const tm = tomorrowArt();
    return PICKS.filter((p) => {
      const d = artDay(p.kickoff);
      if (day === "hoy" && d !== t) return false;
      if (day === "manana" && d !== tm) return false;
      if (league !== "all" && p.leagueKey !== league) return false;
      return true;
    }).sort((a, b) => b.conf - a.conf);
  }, [day, league]);

  const hoyN = PICKS.filter((p) => artDay(p.kickoff) === todayArt()).length;

  return (
    <div className="min-h-screen bg-bg pb-24 text-fg">
      <header className="sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <a href="/" className="flex items-center gap-2 font-black">
            <img src="/logo-canal.jpeg" alt="" className="size-9 rounded-full border border-primary/40 object-cover" />
            Predicciones <span className="text-primary">Pro</span>
          </a>
          <a
            href="https://t.me/"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-tg px-3 py-2 text-xs font-extrabold text-white"
          >
            Telegram
          </a>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-[1.2fr_0.8fr] md:items-center">
        <div>
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          En línea · cuotas ≥ 1.50
        </p>
        <h1 className="max-w-3xl text-3xl font-black leading-tight tracking-tight md:text-4xl">
          Picks cruzados con <span className="text-primary">Forebet, FootyStats y AdamChoi</span>
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
          No se publica el Over 2.5 por default ni el favorito a 1.10. Cada pick tiene
          probabilidad de modelo, implícita del libro, EV, y qué mercado se descartó.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <div className="rounded-lg border border-border bg-card px-4 py-3">
            <p className="text-xl font-black text-primary">{hoyN}</p>
            <p className="text-[10px] font-bold tracking-wide text-muted">PICKS HOY</p>
          </div>
          <div className="rounded-lg border border-border bg-card px-4 py-3">
            <p className="text-xl font-black text-primary">{PICKS.length}</p>
            <p className="text-[10px] font-bold tracking-wide text-muted">TOTAL</p>
          </div>
          <div className="rounded-lg border border-border bg-card px-4 py-3">
            <p className="text-xl font-black text-primary">1.50+</p>
            <p className="text-[10px] font-bold tracking-wide text-muted">CUOTA MÍN.</p>
          </div>
        </div>
        </div>
        <div className="relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-lg border-2 border-primary/40 bg-surface">
          <img src="/logo-canal.jpeg" alt="" className="relative z-10 mx-auto mt-[12%] h-[70%] w-[70%] object-contain" />
          <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between bg-black/70 px-3 py-2 text-[11px] font-bold text-muted">
            <span>Modelo en vivo</span>
            <span>Predicciones Pro</span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-4 rounded-lg border border-border bg-card p-4 text-sm leading-relaxed text-muted">
          <p className="font-bold text-fg">Cómo se arma cada pick</p>
          <p className="mt-1">
            Forebet aporta 1X2, media de goles y BTTS. FootyStats aporta cuotas y H2H. Las
            rachas se leen como tendencias tipo AdamChoi. Si el 1 está a 1.20, se busca el
            mercado ≥ 1.50 que el modelo sí justifique.
          </p>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {(
            [
              ["hoy", "Hoy"],
              ["manana", "Mañana"],
              ["all", "Todos"],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              type="button"
              onClick={() => setDay(k)}
              className={
                day === k
                  ? "min-h-11 rounded-full bg-primary px-4 text-sm font-extrabold text-primary-fg"
                  : "min-h-11 rounded-full border border-border px-4 text-sm font-bold text-muted"
              }
            >
              {l}
            </button>
          ))}
        </div>
        <div className="mb-6 flex flex-wrap gap-2">
          {(
            [
              ["all", "Todas"],
              ["ucl", "UCL"],
              ["lib", "Libertadores"],
              ["bra", "Brasil/Suda"],
              ["por", "Portugal"],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              type="button"
              onClick={() => setLeague(k)}
              className={
                league === k
                  ? "min-h-11 rounded-full bg-primary px-3 text-xs font-extrabold text-primary-fg"
                  : "min-h-11 rounded-full border border-border px-3 text-xs font-bold text-muted"
              }
            >
              {l}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="py-16 text-center text-muted">No hay picks ≥ 1.50 para este filtro.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((p) => (
              <PickCard key={p.id} p={p} />
            ))}
          </div>
        )}

        <p className="mt-10 rounded-lg border border-danger/25 bg-danger/5 p-4 text-xs text-muted">
          <strong className="text-danger">Aviso:</strong> Educativo. Fuentes públicas (Forebet,
          FootyStats, tendencias). Cuotas de consenso. No es consejo financiero. +18.
        </p>
      </div>

      <footer className="mt-10 border-t border-border py-6 text-center text-xs text-muted">
        Predicciones Pro · sin stakes · cuota mínima 1.50
      </footer>

      <Assistant />
    </div>
  );
}
