import type { PickItem } from "@/lib/pick-types";
import { LAST_BOARD } from "@/data/last-board";

export type { PickItem } from "@/lib/pick-types";
export { MIN_ODDS } from "@/lib/pick-types";

/** Fallback board if BSD is down or rate-limited. */
export const PICKS: PickItem[] = LAST_BOARD;
