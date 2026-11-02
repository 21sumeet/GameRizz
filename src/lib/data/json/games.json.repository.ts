import catalog from "@/data/games.json";
import type { Game } from "@/types/game";
import { normalizeText } from "@/lib/utils/text";

const games = catalog as unknown as Game[];

/**
 * Extra phrasings people actually type. Keys are user wording, values are
 * catalog ids. Normalization runs at index-build time, so write keys plainly.
 */
const ALIASES: Record<string, string> = {
  cyberpunk: "cyberpunk-2077",
  cp2077: "cyberpunk-2077",
  "red dead 2": "red-dead-redemption-2",
  rdr2: "red-dead-redemption-2",
  "rdr 2": "red-dead-redemption-2",
  gta: "grand-theft-auto-v",
  "gta 5": "grand-theft-auto-v",
  "gta v": "grand-theft-auto-v",
  bg3: "baldurs-gate-3",
  "baldurs gate": "baldurs-gate-3",
  skyrim: "skyrim-special-edition",
  civ: "civilization-vi",
  "civ 6": "civilization-vi",
  "civ vi": "civilization-vi",
  "civilization 6": "civilization-vi",
  "civilization vi": "civilization-vi",
  re4: "resident-evil-4-remake",
  "resident evil 4 remake": "resident-evil-4-remake",
  mhw: "monster-hunter-world",
  minecraft: "minecraft-java-edition",
  cs2: "counter-strike-2",
  "cs 2": "counter-strike-2",
  csgo: "counter-strike-2",
  "cs go": "counter-strike-2",
  dota: "dota-2",
  dota2: "dota-2",
  apex: "apex-legends",
  "dark souls 3": "dark-souls-iii",
  sekiro: "sekiro-shadows-die-twice",
  wukong: "black-myth-wukong",
  "black myth": "black-myth-wukong",
  stardew: "stardew-valley",
  "forza 5": "forza-horizon-5",
  fh5: "forza-horizon-5",
  hogwarts: "hogwarts-legacy",
  portal2: "portal-2",
};

/** "Hades II" must not bind to "Hades" — the catalog only has the first game. */
const SEQUEL_TOKENS = new Set([
  "ii",
  "iii",
  "iv",
  "2",
  "3",
  "4",
  "5",
  "remake",
  "remastered",
  "definitive",
]);

interface SearchTerm {
  phrase: string;
  game: Game;
}

const byName = new Map<string, Game>();
const searchTerms: SearchTerm[] = [];

function register(phrase: string, game: Game) {
  const normalized = normalizeText(phrase);
  if (normalized.length === 0) return;

  if (!byName.has(normalized)) byName.set(normalized, game);
  searchTerms.push({ phrase: normalized, game });
}

for (const game of games) {
  register(game.name, game);
  register(game.id, game);
}

for (const [alias, id] of Object.entries(ALIASES)) {
  const game = games.find((entry) => entry.id === id);
  if (game) register(alias, game);
}

// Longest phrase first, so "baldur s gate 3" wins before "gate".
searchTerms.sort((a, b) => b.phrase.length - a.phrase.length);

export const jsonGamesRepository = {
  getAll(): Game[] {
    return games;
  },

  findByName(name: string): Game | null {
    return byName.get(normalizeText(name)) ?? null;
  },

  /** First game whose name/id/alias appears as whole words in `text`. */
  findFirstInText(text: string): Game | null {
    const haystack = ` ${normalizeText(text)} `;

    for (const term of searchTerms) {
      const at = haystack.indexOf(` ${term.phrase} `);
      if (at === -1) continue;

      const rest = haystack.slice(at + term.phrase.length + 2).trimStart();
      const nextWord = rest.split(" ")[0] ?? "";
      if (SEQUEL_TOKENS.has(nextWord)) continue;

      return term.game;
    }

    return null;
  },
};