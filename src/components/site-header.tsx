import { useState } from "react";
import { Menu, X } from "lucide-react";

const NAV = [
  { href: "#picks", label: "Picks" },
  { href: "#destacado", label: "Destacado" },
  { href: "#tablero", label: "Tablero" },
  { href: "#como", label: "Cómo se arma" },
] as const;

export function SiteHeader({ source }: { source: "bsd" | "fallback" }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="nav-glow sticky top-0 z-40 bg-nav shadow-[var(--shadow-nav)]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <a href="/" className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary/35 bg-surface">
            <img src="/logo-canal.jpeg" alt="" className="size-full object-cover" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-base font-black tracking-tight">
              Predicciones<span className="text-primary"> Pro</span>
            </span>
            <span className="hidden text-xs font-semibold tracking-widest text-primary/60 uppercase sm:block">
              {source === "bsd" ? "Modelo BSD en vivo" : "Tablero local"}
            </span>
          </span>
        </a>

        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors duration-150 hover:bg-primary/10 hover:text-fg"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="https://t.me/"
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-fg"
          >
            Telegram
          </a>
          <button
            type="button"
            className="flex size-11 items-center justify-center rounded-xl text-fg lg:hidden"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border bg-nav px-4 py-3 lg:hidden">
          <ul className="flex flex-col">
            {NAV.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center text-sm font-medium"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
