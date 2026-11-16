import type { Game } from "@/types/game";
import { tokenize } from "@/lib/utils/text";

/** Show at most two shared traits so the line stays short. */
const MAX_SHARED_TRAITS = 2;
/** Below this, tokens like "i5" or "2" only create noise. */
const MIN_TOKEN_LENGTH = 3;

export interface WhyMatchInput {
  query: string;
  /** Games the user named in the query. Already known — the service uses them to filter. */
  likedGames: Game[];
}

/** Genres first, then tags. Deduped so "Action" in both doesn't show twice. */
function sharedTraits(game: Game, other: Game): string[] {
  const theirs = new Set([...other.genres, ...other.tags]);
  return [...game.genres, ...game.tags].filter((trait) => theirs.has(trait));
}

/** ["A", "B"] -> "A and B" */
function listPhrase(items: string[]): string {
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** "Hades" / "Hades and Celeste" / "the games you named" when it gets long. */
function sourceLabel(games: Game[]): string {
  if (games.length === 1) return games[0].name;
  if (games.length === 2) return `${games[0].name} and ${games[1].name}`;
  return "the games you named";
}

/** True when any word of `trait` is in `tokens`: "Hero Shooter" matches "shooter". */
function traitHitsQuery(trait: string, tokens: Set<string>): boolean {
  return tokenize(trait).some((word) => tokens.has(word));
}

/**
 * One short line explaining the match, or null when there is nothing honest to say.
 * Facts come from the catalog; only the wording is ours.
 */
export function buildWhyMatch(
  game: Game,
  { query, likedGames }: WhyMatchInput,
): string | null {
  if (likedGames.length > 0) {
    const shared = [...new Set(likedGames.flatMap((liked) => sharedTraits(game, liked)))];
    if (shared.length === 0) return null;
    return `Same ${listPhrase(shared.slice(0, MAX_SHARED_TRAITS))} energy as ${sourceLabel(likedGames)}.`;
  }

  const tokens = new Set(
    tokenize(query).filter((word) => word.length >= MIN_TOKEN_LENGTH),
  );
  if (tokens.size === 0) return null;

  const matched = [...game.genres, ...game.tags].filter((trait) =>
    traitHitsQuery(trait, tokens),
  );
  if (matched.length === 0) return null;

  return `Matches ${listPhrase(matched.slice(0, MAX_SHARED_TRAITS))}.`;
}