import { createServerFn } from "@tanstack/react-start";
import { PICKS } from "@/data/picks";

const CONTEXT = PICKS.map(
  (p) =>
    `${p.home} vs ${p.away} (${p.league}) | pick: ${p.market} @ ${p.odds} | conf ${p.conf}% | EV ${p.evPct}% | ${p.analysis}`,
).join("\n");

export const askGrok = createServerFn({ method: "POST" })
  .validator((input: { question: string }) => input)
  .handler(async ({ data }) => {
    const q = data.question.trim().slice(0, 400);
    if (!q) return { ok: false as const, error: "Pregunta vacía" };

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "offline" };
    }

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 420,
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content:
              "Sos el asistente de Predicciones Pro. Hablá en español rioplatense, claro y directo. " +
              "Solo usá estos picks (cuota mínima 1.50). No indiques montos a apostar. " +
              "Si te piden un favorito a cuota < 1.50, explicá por qué no se publica. " +
              "Fuentes: Forebet (probs/media/CS), FootyStats (cuotas/H2H), tendencias tipo AdamChoi.\n\n" +
              CONTEXT,
          },
          { role: "user", content: q },
        ],
      }),
    });

    if (!res.ok) {
      return { ok: false as const, error: `xAI ${res.status}` };
    }
    const body = (await res.json()) as {
      choices: { message: { content: string } }[];
    };
    return { ok: true as const, text: body.choices[0]?.message.content ?? "" };
  });
