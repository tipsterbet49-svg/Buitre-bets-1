import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/fetch-picks-DPVNDE2R.js
var fetchPicks_createServerFn_handler = createServerRpc({
	id: "56a3bfcf5d24fac95689953d10b9ba0a0588e55c9f3efdf0a312153bda121b4e",
	name: "fetchPicks",
	filename: "src/lib/fetch-picks.ts"
}, (opts) => fetchPicks.__executeServer(opts));
var fetchPicks = createServerFn({ method: "GET" }).handler(fetchPicks_createServerFn_handler, async () => {
	const { loadPicksFromBsd } = await import("./client.server-B5Z7u1Me.mjs");
	return loadPicksFromBsd();
});
//#endregion
export { fetchPicks_createServerFn_handler };
