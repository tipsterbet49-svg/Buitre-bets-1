import { createServerFn } from "@tanstack/react-start";
import type { PickItem } from "@/lib/pick-types";

export type PicksPayload = {
  picks: PickItem[];
  source: "bsd" | "fallback";
  generatedAt: string;
  error?: string;
};

export const fetchPicks = createServerFn({ method: "GET" }).handler(async () => {
  const { loadPicksFromBsd } = await import("@/lib/bsd/client.server");
  return loadPicksFromBsd();
});
