export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-nav">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="text-base font-black tracking-tight">
            Predicciones<span className="text-primary"> Pro</span>
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
            Picks con modelo BSD. Cuota mínima 1.50.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted">Secciones</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a href="#picks" className="text-muted hover:text-fg">
                Picks
              </a>
            </li>
            <li>
              <a href="#destacado" className="text-muted hover:text-fg">
                Destacado
              </a>
            </li>
            <li>
              <a href="#tablero" className="text-muted hover:text-fg">
                Tablero
              </a>
            </li>
            <li>
              <a href="#como" className="text-muted hover:text-fg">
                Cómo se arma
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted">Canal</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a href="https://t.me/" target="_blank" rel="noreferrer" className="text-muted hover:text-fg">
                Telegram
              </a>
            </li>
          </ul>
          <p className="mt-6 text-xs leading-relaxed text-muted">
            +18 · Educativo · No es consejo financiero. Jugá responsable.
          </p>
        </div>
      </div>
    </footer>
  );
}
