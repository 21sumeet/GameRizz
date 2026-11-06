import type { Game } from "@/types/game";

/**
 * The text blob a game is embedded from (PROJECT.md §7: name, genres, tags, description).
 *
 * Deliberately excludes developer/publisher/releaseYear: they add little semantic
 * signal for "what should I play next", and every field here costs tokens.
 * Change this function and every stored hash changes → the next run re-embeds all.
 */
export function buildGameText(game: Game): string {
  return [
    `Title: ${game.name}`,
    `Genres: ${game.genres.join(", ")}`,
    `Tags: ${game.tags.join(", ")}`,
    `About: ${game.description}`,
  ].join("\n");
}