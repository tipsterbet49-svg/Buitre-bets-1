import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ask-grok-By_PPrM9.js
var askGrok_createServerFn_handler = createServerRpc({
	id: "c934df3e526f3570e1a7f17300945b14fae992187bb6e4db2e6e1e69bcb3fd24",
	name: "askGrok",
	filename: "src/lib/ask-grok.ts"
}, (opts) => askGrok.__executeServer(opts));
var askGrok = createServerFn({ method: "POST" }).validator((input) => input).handler(askGrok_createServerFn_handler, async ({ data }) => {
	const q = data.question.trim().slice(0, 400);
	if (!q) return {
		ok: false,
		error: "Pregunta vacía"
	};
	const { loadPicksFromBsd } = await import("./client.server-B5Z7u1Me.mjs");
	const { picks } = await loadPicksFromBsd();
	const context = picks.map((p) => `${p.home} vs ${p.away} (${p.league}) | pick: ${p.market} @ ${p.odds} | conf ${p.conf}% | EV ${p.evPct}% | ${p.analysis}`).join("\n");
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: false,
		error: "offline"
	};
	const res = await fetch("https://api.x.ai/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: "grok-4.5",
			max_tokens: 420,
			temperature: .4,
			messages: [{
				role: "system",
				content: "Sos el asistente de Predicciones Pro. Hablá en español rioplatense, claro y directo. Solo usá estos picks (cuota mínima 1.50, modelo BSD). No indiques montos a apostar. Si te piden un favorito a cuota < 1.50, explicá por qué no se publica. No promociones Over 2.5 por default.\n\n" + context
			}, {
				role: "user",
				content: q
			}]
		})
	});
	if (!res.ok) return {
		ok: false,
		error: `xAI ${res.status}`
	};
	return {
		ok: true,
		text: (await res.json()).choices[0]?.message.content ?? ""
	};
});
//#endregion
export { askGrok_createServerFn_handler };
