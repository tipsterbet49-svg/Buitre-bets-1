import { useMemo, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import { Assistant } from "@/components/assistant";
import { Crest } from "@/components/crest";
import { FeaturedPick, pickFeatured } from "@/components/featured-pick";
import { PickRow } from "@/components/pick-row";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { dayBucket, isWeekend } from "@/lib/art-time";
import { fetchPicks } from "@/lib/fetch-picks";
import type { LeagueKey, MarketKey, PickItem } from "@/lib/pick-types";

export const Route = createFileRoute("/")({
  loader: () => fetchPicks(),
  pendingComponent: BoardSkeleton,
  component: Home,
});

type DayF = "hoy" | "manana" | "finde" | "all";
type ConfF = "all" | "max" | "alta" | "media";
type StateF = "all" | "live" | "pending";

const LEAGUES: Array<[LeagueKey | "all", string]> = [
  ["all", "Todas"],
  ["ucl", "Champions"],
  ["lib", "Libertadores"],
  ["suda", "Sudamericana"],
  ["arg", "Argentina"],
  ["bra", "Brasil"],
  ["eng", "Premier"],
  ["esp", "La Liga"],
  ["ita", "Serie A"],
  ["ger", "Bundesliga"],
  ["fra", "Ligue 1"],
  ["por", "Portugal"],
  ["europa", "Europa"],
];

const MARKETS: Array<[MarketKey | "all", string]> = [
  ["all", "Todos"],
  ["1x2", "1X2"],
  ["dc", "Doble op."],
  ["dnb", "DNB"],
  ["btts", "BTTS"],
  ["ou", "Goles"],
  ["ah", "Hándicap"],
  ["corners", "Córners"],
  ["cards", "Tarjetas"],
];

function pickPhase(status: string): "live" | "pending" | "done" {
  if (status === "finished") return "done";
  if (!status || status === "notstarted") return "pending";
  return "live";
}

function hasMarket(p: PickItem, key: MarketKey) {
  if (p.marketKey === key) return true;
  return (p.alts ?? []).some((a) => a.marketKey === key);
}

function BoardSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-3 px-4 py-16">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-card" />
      <div className="h-24 animate-pulse rounded-2xl bg-card" />
      <div className="h-24 animate-pulse rounded-2xl bg-card" />
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "min-h-11 shrink-0 rounded-full bg-primary px-4 text-sm font-bold text-primary-fg"
          : "min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold text-muted shadow-[var(--shadow-border)]"
      }
    >
      {children}
    </button>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <label className="flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-primary/35 bg-surface px-3">
      <span className="text-xs font-semibold text-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-11 bg-transparent text-sm font-bold outline-none"
      >
        {options.map(([k, l]) => (
          <option key={k} value={k}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

function Home() {
  const payload = Route.useLoaderData();
  const picks = payload.picks as PickItem[];
  const hoyN = picks.filter((p) => dayBucket(p.kickoff) === "hoy").length;
  const manN = picks.filter((p) => dayBucket(p.kickoff) === "manana").length;
  const [day, setDay] = useState<DayF>(hoyN > 0 ? "hoy" : manN > 0 ? "manana" : "all");
  const [league, setLeague] = useState<LeagueKey | "all">("all");
  const [market, setMarket] = useState<MarketKey | "all">("all");
  const [conf, setConf] = useState<ConfF>("all");
  const [state, setState] = useState<StateF>("all");
  const [evOnly, setEvOnly] = useState(false);

  const filtered = useMemo(() => {
    return picks.filter((p) => {
      const b = dayBucket(p.kickoff);
      if (day === "hoy" && b !== "hoy") return false;
      if (day === "manana" && b !== "manana") return false;
      if (day === "finde" && !isWeekend(p.kickoff)) return false;
      if (league !== "all" && p.leagueKey !== league) return false;
      if (market !== "all" && !hasMarket(p, market)) return false;
      if (conf === "max" && p.conf < 78) return false;
      if (conf === "alta" && (p.conf < 72 || p.conf >= 78)) return false;
      if (conf === "media" && p.conf >= 72) return false;
      if (state === "live" && pickPhase(p.status) !== "live") return false;
      if (state === "pending" && pickPhase(p.status) !== "pending") return false;
      if (evOnly && p.evPct <= 0) return false;
      return true;
    });
  }, [picks, day, league, market, conf, state, evOnly]);

  const liveN = picks.filter((p) => pickPhase(p.status) === "live").length;
  const marketsN = picks.reduce((n, p) => n + 1 + (p.alts?.length ?? 0), 0);
  const featured = pickFeatured(picks);
  const live = payload.source === "bsd" && !payload.error;
  const grid = featured ? filtered.filter((p) => p.id !== featured.id) : filtered;

  return (
    <div className="min-h-screen bg-bg pb-28 text-fg antialiased">
      <SiteHeader source={payload.source} />

      <section className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 pt-8 pb-8 md:flex-row md:items-center md:justify-between">
        <div className="order-2 w-full min-w-0 flex-1 md:order-1">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wide text-muted">
            <span className={live ? "live-dot" : "size-2 rounded-full bg-muted"} />
            {live ? "En línea · modelo BSD" : "Tablero en caché · se actualiza a las 21:00"}
          </p>
          <h1 className="max-w-xl text-4xl font-black tracking-tight md:text-5xl">
            Predicciones<span className="text-primary"> Pro</span>
          </h1>
          <p className="mt-2 text-base font-medium text-muted">
            Pronósticos de fútbol. Un pick por partido ≥ 1.40.
          </p>

          <div className="mt-6 flex max-w-lg overflow-hidden rounded-xl bg-card shadow-[var(--shadow-border)]">
            <Stat n={hoyN} label="Picks hoy" />
            <Stat n={liveN} label="En vivo" />
            <Stat n={marketsN} label="Mercados" last />
          </div>

          <a
            href="#picks"
            className="mt-6 inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-bold text-primary-fg"
          >
            Ver picks del día
          </a>
        </div>

        <div className="order-1 size-52 shrink-0 overflow-hidden rounded-3xl shadow-[var(--shadow-mascot)] md:order-2 md:size-60">
          <img
            src="/logo-canal.jpeg"
            alt="Mascota Predicciones Pro"
            className="size-full object-cover object-top"
          />
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-10 px-4">
        {featured && <FeaturedPick p={featured} />}

        <section id="picks" className="scroll-mt-20">
          <h2 className="text-2xl font-semibold tracking-tight">Picks</h2>
          <p className="mt-1 text-sm text-muted">Los de hoy primero. Mañana, los de mañana.</p>

          <div className="mt-5 flex flex-wrap gap-2">
            {(
              [
                ["hoy", "Hoy"],
                ["manana", "Mañana"],
                ["finde", "Finde"],
                ["all", "Todos"],
              ] as const
            ).map(([k, l]) => (
              <Chip key={k} active={day === k} onClick={() => setDay(k)}>
                {l}
              </Chip>
            ))}
            <Chip active={state === "live"} onClick={() => setState(state === "live" ? "all" : "live")}>
              En vivo
            </Chip>
            <Chip active={evOnly} onClick={() => setEvOnly((v) => !v)}>
              Solo EV+
            </Chip>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <FilterSelect
              label="Liga"
              value={league}
              onChange={(v) => setLeague(v as LeagueKey | "all")}
              options={LEAGUES}
            />
            <FilterSelect
              label="Mercado"
              value={market}
              onChange={(v) => setMarket(v as MarketKey | "all")}
              options={MARKETS}
            />
            <FilterSelect
              label="Confianza"
              value={conf}
              onChange={(v) => setConf(v as ConfF)}
              options={[
                ["all", "Todas"],
                ["max", "Máxima"],
                ["alta", "Alta"],
                ["media", "Media"],
              ]}
            />
          </div>

          {payload.error && (
            <p className="mt-4 rounded-xl bg-card px-3 py-2 text-xs text-muted shadow-[var(--shadow-border)]">
              {payload.error} Mostrando el último tablero armado.
            </p>
          )}

          {grid.length === 0 && !(featured && day === "hoy") ? (
            <p className="py-16 text-center text-muted">
              No hay picks ≥ 1.40 para este filtro. Probá Todos o apagá Solo EV+.
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {grid.map((p) => (
                <PickRow key={p.id} p={p} />
              ))}
            </div>
          )}

          <p className="mt-6 flex items-start gap-2 text-xs text-muted">
            <RefreshCw className="mt-0.5 size-3.5 shrink-0" />
            BSD · {new Date(payload.generatedAt).toLocaleTimeString("es-AR")} · min 1.40 · {marketsN}{" "}
            mercados
          </p>
        </section>

        <BoardSection picks={picks} />

        <section id="como" className="scroll-mt-20">
          <h2 className="text-2xl font-semibold tracking-tight">Cómo se arma</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Step n="01" title="Qué mira">
              Modelo BSD (1X2, xG, BTTS, goles, córners), cuota BetWinner, forma, tabla, córners
              recientes y el árbitro (amarillas por partido).
            </Step>
            <Step n="02" title="El pick">
              Uno solo, con línea accesible: si el modelo va a Over 10.5 córners, publicamos 8.5 o
              9.5 para acertar más.
            </Step>
            <Step n="03" title="Sin favoritos cortos">
              Piso 1.40. Nada a 1.10. Over 2.5 no entra automático.
            </Step>
          </div>
          <p className="mt-5 text-xs text-muted">+18 · Educativo. No es consejo financiero.</p>
        </section>
      </div>

      <SiteFooter />
      <Assistant picks={picks} />
    </div>
  );
}

function BoardSection({ picks }: { picks: PickItem[] }) {
  const live = picks.filter((p) => pickPhase(p.status) === "live").length;
  const pending = picks.filter((p) => pickPhase(p.status) === "pending").length;
  const done = picks.filter((p) => pickPhase(p.status) === "done").length;

  return (
    <section id="tablero" className="scroll-mt-20">
      <h2 className="text-2xl font-semibold tracking-tight">Tablero</h2>
      <div className="mt-4 flex max-w-lg overflow-hidden rounded-xl bg-card shadow-[var(--shadow-border)]">
        <Stat n={pending} label="Por jugar" />
        <Stat n={live} label="En vivo" />
        <Stat n={done} label="Final" last />
      </div>

      <ul className="mt-5 overflow-hidden rounded-xl bg-card shadow-[var(--shadow-border)]">
        {picks.slice(0, 12).map((p) => {
          const phase = pickPhase(p.status);
          const label = phase === "live" ? "En vivo" : phase === "done" ? "Final" : "Por jugar";
          const hasScore = p.homeScore != null && p.awayScore != null;
          return (
            <li
              key={p.id}
              className="flex items-center gap-3 border-t border-border px-3 py-2.5 first:border-t-0"
            >
              <div className="flex shrink-0 items-center gap-1">
                <Crest name={p.home} src={p.homeCrest} size="sm" />
                <Crest name={p.away} src={p.awayCrest} size="sm" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {p.home}
                  {hasScore ? (
                    <span className="mx-1.5 tabular-nums text-muted">
                      {p.homeScore}–{p.awayScore}
                    </span>
                  ) : (
                    <span className="mx-1.5 text-muted">vs</span>
                  )}
                  {p.away}
                </p>
                <p className="truncate text-xs text-accent">
                  {p.market} · {p.odds.toFixed(2)}
                  {p.alts?.length ? ` · +${p.alts.length}` : ""}
                </p>
              </div>
              <p
                className={
                  phase === "live"
                    ? "shrink-0 text-xs font-semibold text-danger"
                    : "shrink-0 text-xs font-semibold text-muted"
                }
              >
                {label}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Stat({ n, label, last }: { n: number | string; label: string; last?: boolean }) {
  return (
    <div className={`flex-1 px-3 py-4 text-center ${last ? "" : "border-r border-border"}`}>
      <p className="text-xl font-extrabold tracking-tight tabular-nums">{n}</p>
      <p className="mt-1 text-xs font-medium text-muted">{label}</p>
    </div>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl bg-card p-4 shadow-[var(--shadow-border)]">
      <p className="font-mono text-xs text-primary">{n}</p>
      <p className="mt-2 font-semibold">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted">{children}</p>
    </div>
  );
}
