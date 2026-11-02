import type { Game } from "@/types/game";
import { jsonGamesRepository } from "@/lib/data/json/games.json.repository";

/**
 * The only way the app is allowed to reach catalog data.
 * Swap the implementation here when the catalog moves out of JSON.
 */
export interface GamesRepository {
  getAll(): Game[];
  findByName(name: string): Game | null;
  findFirstInText(text: string): Game | null;
}

export function getGamesRepository(): GamesRepository {
  return jsonGamesRepository;
}