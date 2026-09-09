import { useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { askGrok } from "@/lib/ask-grok";
import type { PickItem } from "@/lib/pick-types";

function localAnswer(q: string, picks: PickItem[]) {
  const t = q.toLowerCase();
  const top = [...picks].sort((a, b) => b.conf - a.conf).slice(0, 4);
  if (/hoy|mejor|top|pick/.test(t)) {
    return (
      "Picks con más confianza:\n" +
      top
        .map(
          (p) =>
            `• ${p.home} vs ${p.away}: ${p.market} @ ${p.odds} (EV ${p.evPct > 0 ? "+" : ""}${p.evPct}%)`,
        )
        .join("\n")
    );
  }
  if (/1\.50|cuota|mínim/.test(t)) {
    return "Solo se publican mercados ≥ 1.50. Por eso no ves Bayern @ 1.10 o Palmeiras @ 1.25.";
  }
  for (const p of picks) {
    if (t.includes(p.home.toLowerCase().slice(0, 5)) || t.includes(p.away.toLowerCase().slice(0, 5))) {
      return `${p.home} vs ${p.away}: ${p.market} @ ${p.odds}. ${p.analysis}`;
    }
  }
  if (/ev|valor/.test(t)) {
    return "EV compara la probabilidad del modelo BSD con 1/cuota. Si el modelo está por encima, hay valor. No es garantía.";
  }
  return "Preguntame por un partido o por qué no va el 1 corto.";
}

export function Assistant({ picks }: { picks: PickItem[] }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<{ who: "bot" | "user"; text: string }[]>([
    {
      who: "bot",
      text: "Asistente de picks. Preguntame por un partido o por qué se descartó un favorito corto.",
    },
  ]);

  async function send() {
    const q = input.trim();
    if (!q || busy) return;
    setInput("");
    setMsgs((m) => [...m, { who: "user", text: q }]);
    setBusy(true);
    try {
      const res = await askGrok({ data: { question: q } });
      const text = res.ok ? res.text : localAnswer(q, picks);
      setMsgs((m) => [...m, { who: "bot", text }]);
    } catch {
      setMsgs((m) => [...m, { who: "bot", text: localAnswer(q, picks) }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed right-4 bottom-20 z-50 flex size-14 items-center justify-center rounded-full border-2 border-primary/50 bg-card text-primary md:bottom-6"
        aria-label={open ? "Cerrar asistente" : "Asistente IA"}
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>

      {open && (
        <div className="fixed right-4 bottom-36 z-50 flex max-h-[70vh] w-[min(360px,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl border border-border bg-surface md:bottom-24">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="flex items-center gap-2 text-sm font-extrabold">
              <MessageCircle className="size-4 text-primary" />
              Asistente
            </span>
            <button type="button" onClick={() => setOpen(false)} className="p-2 text-muted">
              <X className="size-4" />
            </button>
          </div>
          <div className="flex-1 space-y-2 overflow-auto p-3">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={
                  m.who === "bot"
                    ? "max-w-[95%] whitespace-pre-wrap rounded-xl border border-border bg-card px-3 py-2 text-xs leading-relaxed"
                    : "ml-auto max-w-[95%] rounded-xl bg-primary/15 px-3 py-2 text-xs"
                }
              >
                {m.text}
              </div>
            ))}
            {busy && <p className="text-xs text-muted">Pensando…</p>}
          </div>
          <form
            className="flex gap-2 border-t border-border p-2"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ej: PSV, Bayern, Estudiantes"
              className="min-h-11 flex-1 rounded-xl border border-border bg-card px-3 text-sm outline-none"
            />
            <button
              type="submit"
              disabled={busy}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-primary text-primary-fg"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
