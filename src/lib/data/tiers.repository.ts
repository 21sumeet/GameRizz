import type { TieredField } from "@/types/tier";
import { jsonTiersRepository } from "@/lib/data/json/tiers.json.repository";

/**
 * The only way the app reaches CPU/GPU rank data.
 * Swap the implementation here when the tables move out of JSON.
 */
export interface TiersRepository {
  tierOf(field: TieredField, chipName: string): number | null;
  requiredTierOf(field: TieredField, requirement: string): number | null;
}

export function getTiersRepository(): TiersRepository {
  return jsonTiersRepository;
}