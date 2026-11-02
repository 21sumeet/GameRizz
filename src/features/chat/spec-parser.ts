import type { Game } from "@/types/game";
import type { UserPcSpecs } from "@/types/pc";
import { getGamesRepository } from "@/lib/data/games.repository";

export interface ParsedQuery {
  /** The catalog game the message refers to, or null. */
  game: Game | null;
  specs: UserPcSpecs;
}

interface Span {
  value: string;
  start: number;
  end: number;
}

/** Blank out a matched span so later patterns can't re-match the same text. */
function blank(text: string, span: Span): string {
  const filler = " ".repeat(span.end - span.start);
  return text.slice(0, span.start) + filler + text.slice(span.end);
}

function toNumber(raw: string | undefined): number | null {
  if (!raw) return null;
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : null;
}

function toGigabytes(amount: number, unit: string | undefined): number {
  return (unit ?? "gb").toLowerCase() === "tb" ? amount * 1024 : amount;
}

/** "RTX 3050", "GTX 1060 6GB", "AMD Radeon RX 580". */
const GPU_PATTERN =
  /\b(?:(?:nvidia|amd|intel)\s+)?(?:(?:geforce|radeon)\s+)?(rtx|gtx|rx|arc)\s*([a-z]?\d{3,4})\s*(ti|super|xtx|xt|gre|le)?(?:\s*\d{1,2}\s*gb)?/i;

/** "i5 12400", "Intel Core i7-6700", "Ryzen 5 3600X". */
const CPU_PATTERN =
  /\b(?:(?:amd|intel)\s+)?(?:(?:core|ryzen)\s+)?(i[3579][\s-]?\d{4,5}[a-z]{0,2}|ryzen\s+\d\s+\d{4}[a-z0-9]{0,2})/i;

/** "16GB RAM" or "RAM 16GB". */
const RAM_KEYWORD_PATTERN =
  /\b(\d+(?:\.\d+)?)\s*(gb|tb)\b[^,.;]*?\b(?:ram|memory)\b|\b(?:ram|memory)\b[^,.;]*?\b(\d+(?:\.\d+)?)\s*(gb|tb)\b/i;

/** "500GB SSD", "1TB NVMe". */
const STORAGE_KEYWORD_PATTERN =
  /\b(\d+(?:\.\d+)?)\s*(gb|tb)\b[^,.;]*?\b(?:ssd|hdd|nvme|storage|space|drive)\b|\b(?:ssd|hdd|nvme|storage|space|drive)\b[^,.;]*?\b(\d+(?:\.\d+)?)\s*(gb|tb)\b/i;

const BARE_GB_PATTERN = /\b(\d+(?:\.\d+)?)\s*gb\b/i;

function extractGpu(text: string): Span | null {
  const match = GPU_PATTERN.exec(text);
  if (!match || match.index === undefined) return null;

  const family = match[1].toUpperCase();
  const model = match[2].toUpperCase();
  const suffix = match[3] ? ` ${match[3].toLowerCase()}` : "";

  return {
    value: `${family} ${model}${suffix}`,
    start: match.index,
    end: match.index + match[0].length,
  };
}

function extractCpu(text: string): Span | null {
  const match = CPU_PATTERN.exec(text);
  if (!match || match.index === undefined) return null;

  return {
    value: match[1].replace(/\s+/g, " ").trim(),
    start: match.index,
    end: match.index + match[0].length,
  };
}

function extractRam(text: string): Span | null {
  const keyword = RAM_KEYWORD_PATTERN.exec(text);
  if (keyword && keyword.index !== undefined) {
    const amount = toNumber(keyword[1] ?? keyword[3]);
    if (amount !== null) {
      const gb = toGigabytes(amount, keyword[2] ?? keyword[4]);
      return {
        value: String(gb),
        start: keyword.index,
        end: keyword.index + keyword[0].length,
      };
    }
  }

  // A leftover bare "16GB" can only be RAM once the GPU span is blanked.
  const bare = BARE_GB_PATTERN.exec(text);
  if (!bare || bare.index === undefined) return null;

  const amount = toNumber(bare[1]);
  if (amount === null || amount < 4 || amount > 512) return null;

  return {
    value: String(amount),
    start: bare.index,
    end: bare.index + bare[0].length,
  };
}

function extractStorage(text: string): Span | null {
  const match = STORAGE_KEYWORD_PATTERN.exec(text);
  if (!match || match.index === undefined) return null;

  const amount = toNumber(match[1] ?? match[3]);
  if (amount === null) return null;

  return {
    value: String(toGigabytes(amount, match[2] ?? match[4])),
    start: match.index,
    end: match.index + match[0].length,
  };
}

/**
 * Pull the game reference and whatever PC specs the user mentioned out of a
 * free-text message. Everything is best-effort: missing pieces stay undefined.
 * Order matters — the GPU span is consumed first so its "6GB" is never read
 * as system RAM.
 */
export function parseQuery(message: string): ParsedQuery {
  const game = getGamesRepository().findFirstInText(message);
  const specs: UserPcSpecs = {};

  let work = message;

  const gpu = extractGpu(work);
  if (gpu) {
    specs.gpu = gpu.value;
    work = blank(work, gpu);
  }

  const ram = extractRam(work);
  if (ram) {
    specs.ramGB = Number.parseFloat(ram.value);
    work = blank(work, ram);
  }

  const storage = extractStorage(work);
  if (storage) {
    specs.storageGB = Number.parseFloat(storage.value);
    work = blank(work, storage);
  }

  const cpu = extractCpu(work);
  if (cpu) {
    specs.cpu = cpu.value;
  }

  return { game, specs };
}

/** True when the user actually told us something about their machine. */
export function hasAnySpec(specs: UserPcSpecs): boolean {
  return (
    typeof specs.cpu === "string" ||
    typeof specs.gpu === "string" ||
    typeof specs.ramGB === "number" ||
    typeof specs.storageGB === "number"
  );
}