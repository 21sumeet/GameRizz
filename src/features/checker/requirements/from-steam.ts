import { extractGameName, extractSpecs } from "@/lib/ai/structured";
import { getAppDetails, searchApp } from "@/lib/steam/client";
import type { CheckableGame } from "@/types/game";

/**
 * What came back from the Steam attempt.
 * "game-not-on-steam" - the message names a game, but Steam does not have it.
 * "no-game"           - the message names no game at all, just specs or chatter.
 * "unknown"           - Steam or the model failed, so we could not tell.
 */
export type SteamLookup =
  | { status: "found"; game: CheckableGame }
  | { status: "no-specs" }
  | { status: "game-not-on-steam" }
  | { status: "no-game" }
  | { status: "unknown" };

/**
 * Last resort when a game is not in our catalog: ask Steam's free store API.
 *
 * Never throws. If Steam is down, rate-limiting us, or the model returns
 * something we cannot validate, this reports "miss" and the caller falls back
 * to the normal "I don't have that game" reply.
 */

async function readSpecs(minimumText: string, recommendedText: string | null) {
  try {
    return await extractSpecs(minimumText, recommendedText);
  } catch (error) {
    console.warn("[steam] could not read specs", error);
    return null;
  }
}
export async function findGameOnSteam(userMessage: string): Promise<SteamLookup> {
  try {
        const name = await extractGameName(userMessage);
    if (!name) return { status: "no-game" };

    const hit = await searchApp(name);
    if (!hit) return { status: "game-not-on-steam" };

    const details = await getAppDetails(hit.id);
    if (!details) return { status: "no-specs" };

    const requirements = await readSpecs(
      details.minimumText,
      details.recommendedText,
    );
    if (!requirements) return { status: "no-specs" };

    // Steam has no rating, tags or tier data, and we will not invent any.
    // The checker only needs these three fields.
    return {
      status: "found",
      game: {
        name: details.name || hit.name,
        releaseYear: details.releaseYear,
        requirements,
      },
    };
    } catch (error) {
    console.warn("[steam] lookup failed", error);
    // We never found out whether a game was named, so let the caller
    // keep its old behaviour rather than guess.
    return { status: "unknown" };
  }
}