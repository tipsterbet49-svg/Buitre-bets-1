import { createServerFn } from "@tanstack/react-start";

export const askGrok = createServerFn({ method: "POST" })
  .validator((input: { question: string }) => input)
  .handler(async ({ data }) => {
    const q = data.question.trim().slice(0, 400);
    if (!q) return { ok: false as const, error: "Pregunta vacía" };

    const { loadPicksFromBsd } = await import("@/lib/bsd/client.server");
    const { picks } = await loadPicksFromBsd();
    const context = picks
      .map((p) => {
        const alts = (p.alts ?? [])
          .slice(0, 5)
          .map((a) => `${a.market} @ ${a.odds} (EV ${a.evPct}%)`)
          .join("; ");
        const form = p.formHome || p.formAway ? ` | forma ${p.formHome ?? "—"} / ${p.formAway ?? "—"}` : "";
        const tabla =
          p.tableHome && p.tableAway
            ? ` | tabla ${p.home} ${p.tableHome.pos}º ${p.tableHome.pts}pts vs ${p.away} ${p.tableAway.pos}º ${p.tableAway.pts}pts`
            : "";
        const move = p.oddsMove
          ? ` | cuota ${p.oddsMove.opening}→${p.oddsMove.current} ${p.oddsMove.movement || ""} (${p.oddsMove.books} casas)`
          : "";
        const pin =
          p.pinnacleOdds != null
            ? ` | BetWinner ${p.pinnacleOdds} EV ${p.pinnacleEvPct}%`
            : p.pinnacle
              ? ` | BetWinner 1X2 ${p.pinnacle.home ?? "—"}/${p.pinnacle.draw ?? "—"}/${p.pinnacle.away ?? "—"}`
              : "";
        return (
          `${p.home} vs ${p.away} (${p.league}) | principal: ${p.market} @ ${p.odds} | conf ${p.conf}% | EV ${p.evPct}%` +
          (alts ? ` | alts: ${alts}` : "") +
          ` | 1X2 ${Math.round(p.pH * 100)}-${Math.round(p.pD * 100)}-${Math.round(p.pA * 100)}` +
          ` | xG ${p.xgHome.toFixed(2)}-${p.xgAway.toFixed(2)}${form}${tabla}${move}${pin} | ${p.analysis}`
        );
      })
      .join("\n");

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
        max_tokens: 520,
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content:
              "Sos el asistente de Predicciones Pro. Hablá en español rioplatense, claro y directo. " +
              "Usá estos picks (cuota mínima 1.40, modelo BSD). Un mercado principal por partido (1X2, BTTS, goles, córners, AH). " +
              "Tenés forma reciente, posición de tabla, xG de temporada, movimiento de cuota (abrió→ahora) y, si está, la cuota BetWinner. " +
              "No indiques montos a apostar. Si te piden un favorito a cuota < 1.40, explicá por qué no se publica. " +
              "No promociones Over 2.5 por default. Podés hablar de xG, H2H, forma y el mapa de marcadores si está en el contexto.\n\n" +
              context,
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
