import { i as hydrateCrests, n as crestUrl, t as artToday } from "./crests-3Ve7QrE9.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/client.server-B5Z7u1Me.js
var implied = (odds) => Math.round(1 / odds * 1e3) / 10;
var ev = (p, odds) => Math.round((p * (odds - 1) - (1 - p)) * 1e3) / 10;
/** Fallback curated board if BSD is down. */
var PICKS = [{
	id: "liv-atm",
	eventId: 0,
	league: "Champions",
	leagueKey: "ucl",
	kickoff: "2026-09-09T19:00:00.000Z",
	status: "finished",
	home: "Liverpool",
	away: "Atlético Madrid",
	homeCrest: "https://media.api-sports.io/football/teams/40.png",
	awayCrest: "https://media.api-sports.io/football/teams/530.png",
	market: "Ambos marcan",
	marketKey: "btts",
	odds: 1.58,
	impliedPct: implied(1.58),
	modelPct: 73,
	evPct: ev(.73, 1.58),
	conf: 78,
	pH: .36,
	pD: .29,
	pA: .35,
	xgHome: 1.6,
	xgAway: 1.2,
	scoreline: "2-1",
	sources: ["BSD"],
	bullets: ["Fallback estático — reconectá BSD para el tablero en vivo"],
	analysis: "El 1 de Liverpool no es value. El mercado ≥ 1.50 es BTTS.",
	rejected: "Se descarta Liverpool gana @ 1.69."
}];
var ALLOWED_LEAGUES = {
	1: {
		name: "Premier League",
		key: "eng"
	},
	2: {
		name: "Liga Portugal",
		key: "por"
	},
	3: {
		name: "La Liga",
		key: "esp"
	},
	4: {
		name: "Serie A",
		key: "ita"
	},
	5: {
		name: "Bundesliga",
		key: "ger"
	},
	6: {
		name: "Ligue 1",
		key: "fra"
	},
	7: {
		name: "Champions",
		key: "ucl"
	},
	8: {
		name: "Europa League",
		key: "europa"
	},
	9: {
		name: "Brasileirão",
		key: "bra"
	},
	32: {
		name: "Libertadores",
		key: "lib"
	},
	33: {
		name: "Sudamericana",
		key: "suda"
	},
	85: {
		name: "Liga Profesional",
		key: "arg"
	}
};
var LIVE = /* @__PURE__ */ new Set([
	"notstarted",
	"1st_half",
	"2nd_half",
	"halftime",
	"ht",
	"inprogress",
	"extra_time",
	"penalties"
]);
function pct(n) {
	return Math.round(n * 1e3) / 10;
}
function evOf(p, odds) {
	return p * odds - 1;
}
function confOf(model, ev) {
	const base = model * 100;
	return Math.max(52, Math.min(92, Math.round(base + (ev > .04 ? 6 : ev > 0 ? 3 : 0))));
}
function shortTeam(name) {
	return name.replace(/FC |CF |SSC |SK |1\. FC /g, "").trim();
}
function isPlayableStatus(status) {
	return LIVE.has(status);
}
function buildPick(pred, odds, h2h) {
	const league = ALLOWED_LEAGUES[pred.event.league_id];
	if (!league) return null;
	if (!odds) return null;
	if (!isPlayableStatus(pred.event.status)) return null;
	const e = pred.event;
	const m = pred.markets;
	const pH = m.match_result.prob_home / 100;
	const pD = m.match_result.prob_draw / 100;
	const pA = m.match_result.prob_away / 100;
	const btts = m.btts.prob_yes / 100;
	const ou = m.over_under;
	const xgH = m.expected_goals.home;
	const xgA = m.expected_goals.away;
	const xg = xgH + xgA;
	const home = shortTeam(e.home_team);
	const away = shortTeam(e.away_team);
	const raw = [
		[
			`Gana ${home}`,
			"1x2",
			pH,
			odds.home_win,
			0
		],
		[
			"Empate",
			"1x2",
			pD,
			odds.draw,
			0
		],
		[
			`Gana ${away}`,
			"1x2",
			pA,
			odds.away_win,
			0
		],
		[
			"Ambos marcan",
			"btts",
			btts,
			odds.btts_yes,
			0
		],
		[
			"BTTS No",
			"btts",
			1 - btts,
			odds.btts_no,
			0
		],
		[
			"Más de 1.5",
			"ou",
			ou.prob_over_15 / 100,
			odds.over_15_goals,
			.01
		],
		[
			"Menos de 1.5",
			"ou",
			1 - ou.prob_over_15 / 100,
			odds.under_15_goals,
			0
		],
		[
			"Más de 2.5",
			"ou",
			ou.prob_over_25 / 100,
			odds.over_25_goals,
			.05
		],
		[
			"Menos de 2.5",
			"ou",
			1 - ou.prob_over_25 / 100,
			odds.under_25_goals,
			0
		],
		[
			"Más de 3.5",
			"ou",
			ou.prob_over_35 / 100,
			odds.over_35_goals,
			xg < 3.1 ? .08 : 0
		],
		[
			"Menos de 3.5",
			"ou",
			1 - ou.prob_over_35 / 100,
			odds.under_35_goals,
			0
		]
	];
	const cands = [];
	for (const [market, marketKey, p, od, pen] of raw) {
		if (od == null || od < 1.5) continue;
		if (p < .38) continue;
		const ev = evOf(p, od);
		cands.push({
			market,
			marketKey,
			p,
			odds: od,
			ev,
			score: ev - pen + (p - .45) * .15
		});
	}
	if (!cands.length) return null;
	cands.sort((a, b) => b.score - a.score);
	const best = cands[0];
	const rejectedBits = [];
	if (odds.home_win != null && odds.home_win < 1.5) rejectedBits.push(`${home} @ ${odds.home_win.toFixed(2)}`);
	if (odds.away_win != null && odds.away_win < 1.5) rejectedBits.push(`${away} @ ${odds.away_win.toFixed(2)}`);
	if (odds.over_25_goals != null && odds.over_25_goals < 1.5) rejectedBits.push(`Over 2.5 @ ${odds.over_25_goals.toFixed(2)}`);
	if (best.market !== "Más de 2.5" && (odds.over_25_goals ?? 99) >= 1.5) rejectedBits.push("Over 2.5 no se publica por default");
	const bullets = [
		`Modelo BSD ${pred.model.version}: ${home} ${pct(pH)}% · Empate ${pct(pD)}% · ${away} ${pct(pA)}%`,
		`xG ${xgH.toFixed(2)} – ${xgA.toFixed(2)} (media ${xg.toFixed(2)}) · marcador más probable ${m.score.most_likely}`,
		`BTTS ${pct(btts)}% · Over 2.5 ${pct(ou.prob_over_25 / 100)}% · Over 3.5 ${pct(ou.prob_over_35 / 100)}%`
	];
	if (h2h && (h2h.total_matches ?? 0) >= 3) bullets.push(`H2H ${h2h.total_matches} pj · media ${Number(h2h.avg_total_goals ?? 0).toFixed(2)} goles · ${h2h.home_wins}-${h2h.draws}-${h2h.away_wins}`);
	const implied = 1 / best.odds;
	const analysis = buildAnalysis(best, home, away, {
		pH,
		pD,
		pA,
		xg,
		scoreline: m.score.most_likely
	});
	const rejected = rejectedBits.length ? `Se descarta ${rejectedBits.slice(0, 3).join(" · ")} (regla cuota mínima 1.50).` : "Sin favorito corto: el mercado publicado ya cumple 1.50.";
	return {
		id: `bsd-${e.id}`,
		eventId: e.id,
		league: league.name,
		leagueKey: league.key,
		kickoff: e.event_date,
		status: e.status,
		home,
		away,
		market: best.market,
		marketKey: best.marketKey,
		odds: Math.round(best.odds * 100) / 100,
		impliedPct: pct(implied),
		modelPct: pct(best.p),
		evPct: Math.round(best.ev * 1e3) / 10,
		conf: confOf(pred.model.confidence, best.ev),
		pH,
		pD,
		pA,
		xgHome: xgH,
		xgAway: xgA,
		scoreline: m.score.most_likely,
		sources: ["BSD"],
		bullets,
		analysis,
		rejected
	};
}
function buildAnalysis(best, home, away, ctx) {
	const gap = best.p - 1 / best.odds;
	const value = gap > .03 ? "El modelo está por encima de la implícita: hay valor." : gap > 0 ? "Edge chico, pero del lado correcto del precio." : "El libro está un poco más agresivo que el modelo; se publica porque es el mercado ≥ 1.50 más limpio, no porque sea un 1.10.";
	if (best.market.startsWith("Gana")) return `${best.market} @ ${best.odds.toFixed(2)}. 1X2 del modelo ${pct(ctx.pH)}-${pct(ctx.pD)}-${pct(ctx.pA)}. Marcador tipo ${ctx.scoreline}. ${value} No se toca el favorito si está bajo 1.50.`;
	if (best.market.startsWith("Ambos") || best.market === "BTTS No") return `${best.market} @ ${best.odds.toFixed(2)} con ${pct(best.p)}% del modelo (xG ${ctx.xg.toFixed(2)}, ${ctx.scoreline}). ${value}`;
	if (best.market.startsWith("Más") || best.market.startsWith("Menos")) return `${best.market} @ ${best.odds.toFixed(2)}. Media de goles ${ctx.xg.toFixed(2)} y ${ctx.scoreline} como línea base. ${value} Over 2.5 no entra automático.`;
	return `${home} vs ${away}: ${best.market} @ ${best.odds.toFixed(2)}. ${value}`;
}
var BASE = "https://sports.bzzoiro.com/api/v2";
var TOKEN = process.env.BSD_API_TOKEN ?? "0f5fef6dd4e24408e6a468ea76656d13300ad804";
var cache = null;
var TTL_MS = 48e4;
function addDays(ymd, n) {
	const [y, m, d] = ymd.split("-").map(Number);
	return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
async function bsd(path) {
	const res = await fetch(`${BASE}${path}`, {
		headers: { Authorization: `Token ${TOKEN}` },
		signal: AbortSignal.timeout(15e3)
	});
	if (!res.ok) throw new Error(`BSD ${res.status} ${path}`);
	return await res.json();
}
async function allPredictions(from, to) {
	const out = [];
	let offset = 0;
	for (let i = 0; i < 4; i++) {
		const page = await bsd(`/predictions/?date_from=${from}&date_to=${to}&limit=100&offset=${offset}`);
		out.push(...page.results);
		if (!page.next) break;
		offset += 100;
	}
	return out;
}
async function eventsByWindow(from, to) {
	const page = await bsd(`/events/?date_from=${from}&date_to=${to}&limit=200`);
	const map = /* @__PURE__ */ new Map();
	for (const ev of page.results) map.set(ev.id, {
		h2h: ev.head_to_head,
		homeScore: ev.home_score ?? null,
		awayScore: ev.away_score ?? null,
		minute: ev.current_minute ?? null
	});
	return map;
}
async function oddsFor(eventId) {
	try {
		return (await bsd(`/events/${eventId}/odds/`)).odds ?? null;
	} catch {
		return null;
	}
}
async function pool(items, n, fn) {
	const out = new Array(items.length);
	let i = 0;
	async function worker() {
		while (i < items.length) {
			const idx = i++;
			out[idx] = await fn(items[idx]);
		}
	}
	await Promise.all(Array.from({ length: Math.min(n, items.length) }, worker));
	return out;
}
function asFallback() {
	return PICKS;
}
async function loadPicksFromBsd() {
	if (cache && Date.now() - cache.at < TTL_MS) return {
		picks: cache.picks,
		source: cache.source,
		generatedAt: new Date(cache.at).toISOString(),
		error: cache.error
	};
	const from = artToday();
	const to = addDays(from, 3);
	try {
		const [preds, extras] = await Promise.all([allPredictions(from, to), eventsByWindow(from, to).catch(() => /* @__PURE__ */ new Map())]);
		const filtered = preds.filter((p) => ALLOWED_LEAGUES[p.event.league_id]);
		await hydrateCrests(filtered.flatMap((p) => [p.event.home_team, p.event.away_team]));
		const oddsList = await pool(filtered, 8, (p) => oddsFor(p.event.id));
		const picks = [];
		filtered.forEach((pred, i) => {
			const extra = extras.get(pred.event.id);
			const built = buildPick(pred, oddsList[i], extra?.h2h);
			if (!built) return;
			built.homeCrest = crestUrl(pred.event.home_team) ?? crestUrl(built.home);
			built.awayCrest = crestUrl(pred.event.away_team) ?? crestUrl(built.away);
			built.homeScore = extra?.homeScore ?? null;
			built.awayScore = extra?.awayScore ?? null;
			built.minute = extra?.minute ?? null;
			picks.push(built);
		});
		picks.sort((a, b) => {
			const t = new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime();
			if (t !== 0) return t;
			return b.evPct - a.evPct;
		});
		const source = picks.length ? "bsd" : "fallback";
		const finalPicks = picks.length ? picks : asFallback();
		cache = {
			at: Date.now(),
			picks: finalPicks,
			source
		};
		return {
			picks: finalPicks,
			source,
			generatedAt: new Date(cache.at).toISOString()
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : "BSD offline";
		const fallback = asFallback();
		cache = {
			at: Date.now(),
			picks: fallback,
			source: "fallback",
			error: message
		};
		return {
			picks: fallback,
			source: "fallback",
			generatedAt: new Date(cache.at).toISOString(),
			error: message
		};
	}
}
//#endregion
export { loadPicksFromBsd };
