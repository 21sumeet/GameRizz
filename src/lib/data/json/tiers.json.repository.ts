import cpuTiers from "@/data/cpu-tiers.json";
import gpuTiers from "@/data/gpu-tiers.json";
import type { ChipTierTable, TieredField } from "@/types/tier";
import { normalizeText } from "@/lib/utils/text";

interface TierIndex {
  tierOfKey: Map<string, number>;
  /**
   * Keys sorted longest-first, so "gtx 1050 ti" is tested before "gtx 1050"
   * and wins. Same trick games.json.repository.ts uses for game names.
   */
  keys: string[];
}

// function buildIndex(raw: ChipTierTable): TierIndex {
//   const tierOfKey = new Map<string, number>();

//   for (const [name, tier] of Object.entries(raw)) {
//     // Keys starting with "_" are notes for humans, not chips.
//     if (name.startsWith("_")) continue;
//     if (typeof tier !== "number") continue;
//     tierOfKey.set(normalizeText(name), tier);
//   }

//   const keys = [...tierOfKey.keys()].sort((a, b) => b.length - a.length);
//   return { tierOfKey, keys };
// }
const VENDOR_PREFIXES = ["intel", "amd", "nvidia", "ati", "geforce", "radeon"];

/**
 * Shorter forms of a key that mean the same chip, so a user who drops the
 * vendor word still resolves. The catalog writes "Intel Core i7-6700" but
 * people type "i7-6700"; it writes "NVIDIA GeForce 9800 GT" but people type
 * "9800 GT".
 *
 * "core 2 duo e8400" is left alone on purpose: stripping "core " there would
 * leave "2 duo e8400", which matches nothing.
 */
function shorterFormsOf(normalizedKey: string): string[] {
  const forms: string[] = [];
  let current = normalizedKey;

  for (;;) {
    let next: string | null = null;

    if (current.startsWith("core i")) {
      next = current.slice("core ".length);
    } else {
      const prefix = VENDOR_PREFIXES.find((p) => current.startsWith(`${p} `));
      if (prefix) next = current.slice(prefix.length + 1);
    }

    // Below 5 chars ("450", "r5") a form would match far too much.
    if (next === null || next.length < 5) break;
    forms.push(next);
    current = next;
  }

  return forms;
}

function buildIndex(raw: ChipTierTable): TierIndex {
  const tierOfKey = new Map<string, number>();

  const register = (name: string, tier: number) => {
    const key = normalizeText(name);
    if (key.length === 0) return;
    // A real key always wins over a derived form.
    if (!tierOfKey.has(key)) tierOfKey.set(key, tier);
  };

  for (const [name, tier] of Object.entries(raw)) {
    // Keys starting with "_" are notes for humans, not chips.
    if (name.startsWith("_")) continue;
    if (typeof tier !== "number") continue;

    const key = normalizeText(name);
    register(name, tier);
    for (const form of shorterFormsOf(key)) register(form, tier);
  }

  const keys = [...tierOfKey.keys()].sort((a, b) => b.length - a.length);
  return { tierOfKey, keys };
}

const indexes: Record<TieredField, TierIndex> = {
  cpu: buildIndex(cpuTiers as unknown as ChipTierTable),
  gpu: buildIndex(gpuTiers as unknown as ChipTierTable),
};

/**
 * Rank of a single chip name, or null when the text names no chip we know.
 * Phrase containment means "RTX 3050 8GB" and "NVIDIA RTX 3050" both resolve
 * to "rtx 3050" without any suffix-stripping code.
 */
function rankOf(index: TierIndex, chipName: string): number | null {
  const haystack = ` ${normalizeText(chipName)} `;

  for (const key of index.keys) {
    if (!haystack.includes(` ${key} `)) continue;
    const tier = index.tierOfKey.get(key);
    if (tier !== undefined) return tier;
  }

  return null;
}

/**
 * Rank of a full catalog requirement string, e.g.
 * "NVIDIA GeForce GTX 1060 6GB / AMD Radeon RX 580 8GB".
 *
 * The catalog means "either of these is enough", so the bar is the WEAKEST
 * chip it names. Parts we cannot rank are skipped; if none can be ranked the
 * whole requirement is unrankable and the caller falls back to text matching.
 */
function rankOfRequirement(index: TierIndex, requirement: string): number | null {
  const ranks = requirement
    .split(" / ")
    .map((part) => rankOf(index, part))
    .filter((tier): tier is number => tier !== null);

  return ranks.length === 0 ? null : Math.min(...ranks);
}

export const jsonTiersRepository = {
  /** Rank of the chip the user typed. */
  tierOf(field: TieredField, chipName: string): number | null {
    return rankOf(indexes[field], chipName);
  },

  /** Rank of the bar the catalog sets for this field. */
  requiredTierOf(field: TieredField, requirement: string): number | null {
    return rankOfRequirement(indexes[field], requirement);
  },
};