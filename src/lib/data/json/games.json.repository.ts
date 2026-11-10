import catalog from "@/data/games.json";
import type { Game } from "@/types/game";
import { compact, normalizeText, tokenize } from "@/lib/utils/text";

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
  "gta5": "grand-theft-auto-v",
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
  
  // BioShock (2007)
  "bioshock 1": "bioshock",
  "bioshock original": "bioshock",

  // Fallout New Vegas
  "fallout nv": "fallout-new-vegas",
  "fnv": "fallout-new-vegas",
  "new vegas": "fallout-new-vegas",

  // Fallout 3
  "fo3": "fallout-3",

  // Left 4 Dead 2
  "l4d2": "left-4-dead-2",
  "left4dead2": "left-4-dead-2",

  // Call of Duty Modern Warfare 2 (2009)
  "cod mw2": "call-of-duty-modern-warfare-2-2009",
  "mw2 2009": "call-of-duty-modern-warfare-2-2009",
  "modern warfare 2 2009": "call-of-duty-modern-warfare-2-2009"
};

/** "Hades II" must not bind to "Hades" — the catalog only has the first game. */
const SEQUEL_TOKENS = new Set([
  "ii", "iii", "iv",
  "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12",
  "remake", "remastered", "definitive",
]);

interface SearchTerm {
  phrase: string;
  game: Game;
}

const byName = new Map<string, Game>();
const searchTerms: SearchTerm[] = [];

/** The same terms with spaces removed, so "gta 5" and "gta5" collide. */
const compactByName = new Map<string, Game>();

function register(phrase: string, game: Game) {
  const normalized = normalizeText(phrase);
  if (normalized.length === 0) return;

  if (!byName.has(normalized)) byName.set(normalized, game);

  const squashed = compact(phrase);
  if(squashed.length >0 && !compactByName.has(squashed)){
    compactByName.set(squashed, game);
  }
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

function nextWordIsSequel(haystack: string, from: number): boolean {
  const rest = haystack.slice(from).trimStart();
  return SEQUEL_TOKENS.has(rest.split(" ")[0] ?? "");
}

//Finds a game by gluing the user's words together, so "gta 5", "gta5" and "gtav" all match. 
const MAX_JOINED_WORDS = 4;
function findByCompactWords(text: string): Game | null {
  const words = tokenize(text);

  for (let size = MAX_JOINED_WORDS; size >= 1; size -= 1) {
    for (let start = 0; start + size <= words.length; start += 1) {
      const joined = words.slice(start, start + size).join("");
      const game = compactByName.get(joined);
      if (!game) continue;
      if (SEQUEL_TOKENS.has(words[start + size] ?? "")) continue;

      return game;
    }
  }

  return null;
}

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
      if (nextWordIsSequel(haystack, at + term.phrase.length + 2)) continue;

      return term.game;
    }

    return findByCompactWords(text);
  },

   /**
   * Every game whose name/id/alias appears as whole words in `text`.
   * Same rules as findFirstInText, but collects all matches instead of
   * stopping at the first — so a query naming two games excludes both.
   */
  findAllInText(text: string): Game[] {
    const haystack = ` ${normalizeText(text)} `;
    const found = new Map<string, Game>();

    for (const term of searchTerms) {
      const at = haystack.indexOf(` ${term.phrase} `);
      if (at === -1) continue;
      if (nextWordIsSequel(haystack, at + term.phrase.length + 2)) continue;

      // A game can match via name and id — keep the first, skip repeats.
      if (!found.has(term.game.id)) found.set(term.game.id, term.game);
    }

    // Mirror of findByCompactWords without the early return, so "gta5" and
    // "portal2" are caught too. Kept inline to leave findFirstInText alone.
    const words = tokenize(text);
    for (let size = MAX_JOINED_WORDS; size >= 1; size -= 1) {
      for (let start = 0; start + size <= words.length; start += 1) {
        const joined = words.slice(start, start + size).join("");
        const game = compactByName.get(joined);
        if (!game) continue;
        if (SEQUEL_TOKENS.has(words[start + size] ?? "")) continue;

        if (!found.has(game.id)) found.set(game.id, game);
      }
    }

    return [...found.values()];
  },
};