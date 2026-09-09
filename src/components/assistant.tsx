import { useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { askGrok } from "@/lib/ask-grok";
import { PICKS } from "@/data/picks";

function localAnswer(q: string) {
  const t = q.toLowerCase();
  const top = [...PICKS].sort((a, b) => b.conf - a.conf).slice(0, 4);
  if (/hoy|mejor|top|pick/.test(t)) {
    return (
      "Picks con más confianza:\n" +
      top.map((p) => `• ${p.home} vs ${p.away}: ${p.market} @ ${p.odds} (EV +${p.evPct}%)`).join("\n")
    );
  }
  if (/1\.50|cuota|mínim/.test(t)) {
    return "Solo se publican mercados ≥ 1.50. Por eso no ves Bayern @ 1.10, Barça @ 1.08 o Palmeiras @ 1.25.";
  }
  if (/napoli|arsenal|under/.test(t)) {
    return PICKS.find((x) => x.id === "nap-ars")!.analysis;
  }
  if (/liverpool|atl[eé]tico|btts/.test(t)) {
    return PICKS.find((x) => x.id === "liv-atm")!.analysis;
  }
  if (/ev|valor/.test(t)) {
    return "EV compara la probabilidad del modelo con 1/cuota. Si el modelo está por encima, hay valor. No es garantía.";
  }
  return "Preguntame por un partido (Liverpool, Napoli, Sporting…) o por qué no va el 1 corto.";
}

export function Assistant() {
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
      const text = res.ok ? res.text : localAnswer(q);
      setMsgs((m) => [...m, { who: "bot", text }]);
    } catch {
      setMsgs((m) => [...m, { who: "bot", text: localAnswer(q) }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed right-4 bottom-20 z-50 flex size-14 items-center justify-center rounded-full border border-primary/50 bg-card text-primary shadow-lg md:bottom-6"
        aria-label="Asistente IA"
      >
        <MessageCircle className="size-6" />
      </button>

      {open && (
        <div className="fixed right-4 bottom-36 z-50 flex max-h-[70vh] w-[min(360px,calc(100vw-24px))] flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-2xl md:bottom-24">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="flex items-center gap-2 text-sm font-extrabold">
              <MessageCircle className="size-4 text-primary" />
              Asistente
            </span>
            <button type="button" onClick={() => setOpen(false)} className="p-1 text-muted">
              <X className="size-4" />
            </button>
          </div>
          <div className="flex-1 space-y-2 overflow-auto p-3">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={
                  m.who === "bot"
                    ? "max-w-[95%] whitespace-pre-wrap rounded-lg border border-border bg-card px-3 py-2 text-xs leading-relaxed"
                    : "ml-auto max-w-[95%] rounded-lg border border-primary/40 bg-primary/15 px-3 py-2 text-xs"
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
              placeholder="Ej: por qué Under en Napoli"
              className="min-h-11 flex-1 rounded-md border border-border bg-card px-3 text-sm outline-none"
            />
            <button
              type="submit"
              disabled={busy}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-md bg-primary text-primary-fg"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
