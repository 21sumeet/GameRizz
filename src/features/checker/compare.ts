import type { Game, GameSpecBlock } from "@/types/game";
import type { UserPcSpecs } from "@/types/pc";
import type { TieredField } from "@/types/tier";
import { getTiersRepository } from "@/lib/data/tiers.repository";
import { normalizeText, tokenize } from "@/lib/utils/text";

export type SpecField = "cpu" | "gpu" | "ramGB" | "storageGB";

/**
 * "above" and "below" only ever come from the tier tables.
 * "mismatch" still means exactly what it did before: we could not rank the
 * chip, and the wording is not one we list.
 */
export type SpecStatus = "match" | "above" | "below" | "mismatch" | "unknown";

export interface SpecCheck {
  field: SpecField;
  label: string;
  /** What the user gave us, formatted for display. */
  userValue: string;
  /** What the catalog asks for, formatted for display. */
  requiredValue: string;
  status: SpecStatus;
  /** Rank of the user's chip, present only when both sides were rankable. */
  userTier?: number;
  /** Rank of the catalog's bar, present only when both sides were rankable. */
  requiredTier?: number;
}

export interface CompareResult {
  game: Game;
  /** Checks against `requirements.minimum`. */
  minimum: SpecCheck[];
  /** Checks against `requirements.recommended`; empty when the game has none. */
  recommended: SpecCheck[];
  /** How many fields the user actually told us about. */
  comparedCount: number;
  /** True when every spec the user gave is at or above the listed minimum. */
  meetsMinimum: boolean;
  /** True only when the game has a recommended block and every given spec is at or above it. */
  meetsRecommended: boolean;
  /** True when at least one given spec ranks below the listed minimum. */
  isBelowMinimum: boolean;
}

const LABELS: Record<SpecField, string> = {
  cpu: "CPU",
  gpu: "GPU",
  ramGB: "RAM",
  storageGB: "Storage",
};

const NUMERIC_FIELDS: SpecField[] = ["ramGB", "storageGB"];
const TEXT_FIELDS: SpecField[] = ["cpu", "gpu"];

/**
 * Catalog strings join vendor alternatives with " / ", e.g.
 * "Intel Core i7-6700 / AMD Ryzen 5 1600". The inner slashes in
 * "8600/9600GT" have no spaces around them, so splitting on " / " is safe.
 */
function alternatives(value: string): string[][] {
  return value
    .split(" / ")
    .map((part) => tokenize(part))
    .filter((tokens) => tokens.length > 0);
}

function containsRun(haystack: string[], needle: string[]): boolean {
  if (needle.length === 0 || needle.length > haystack.length) return false;

  for (let start = 0; start <= haystack.length - needle.length; start += 1) {
    let ok = true;
    for (let offset = 0; offset < needle.length; offset += 1) {
      if (haystack[start + offset] !== needle[offset]) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }

  return false;
}

/**
 * Word-level match of the user's CPU/GPU text against one of the catalog
 * alternatives. Deliberately not a benchmark comparison — "RTX 3050" vs
 * "GTX 1060" cannot be ranked by string, so we only report whether the user's
 * wording is one we actually list.
 */
function matchesText(userText: string, requiredText: string): boolean {
  const userTokens = tokenize(userText);
  // A single generic token ("rtx", "core") would match far too much.
  if (userTokens.length < 2) return false;

  return alternatives(requiredText).some((altTokens) =>
    containsRun(altTokens, userTokens),
  );
}

function formatNumber(value: number, unit: string): string {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded}${unit}`;
}

function requiredTextFor(field: SpecField, block: GameSpecBlock): string {
  if (field === "cpu" || field === "gpu") return block[field];
  if (field === "ramGB") return formatNumber(block.ramGB, "GB");
  return formatNumber(block.storageGB, "GB");
}

function checkField(
  field: SpecField,
  specs: UserPcSpecs,
  block: GameSpecBlock,
): SpecCheck {
  const requiredValue = requiredTextFor(field, block);
  const base = { field, label: LABELS[field], requiredValue };

  if (NUMERIC_FIELDS.includes(field)) {
    const userValue = specs[field];
    if (typeof userValue !== "number" || !Number.isFinite(userValue)) {
      return { ...base, userValue: "", status: "unknown" };
    }
    const required = field === "ramGB" ? block.ramGB : block.storageGB;
    return {
      ...base,
      userValue: formatNumber(userValue, "GB"),
      status: userValue >= required ? "match" : "below",
    };
  }

  const userValue = specs[field];
  if (typeof userValue !== "string" || normalizeText(userValue).length === 0) {
    return { ...base, userValue: "", status: "unknown" };
  }

  // TypeScript cannot narrow `field` from the NUMERIC_FIELDS check above
  // (the array is typed SpecField[]), so we state the fact here.
  const tiered = field as TieredField;
  const tiers = getTiersRepository();
  const userTier = tiers.tierOf(tiered, userValue);
  const requiredTier = tiers.requiredTierOf(tiered, requiredValue);

  // Both sides ranked: this is a real comparison, not a text match.
  if (userTier !== null && requiredTier !== null) {
    const status: SpecStatus =
      userTier > requiredTier
        ? "above"
        : userTier < requiredTier
          ? "below"
          : "match";

    return { ...base, userValue, status, userTier, requiredTier };
  }

  // Fall back to today's exact-words matching (decision D2) and keep
  // whichever single tier we did manage to find, for context in the facts.
  return {
    ...base,
    userValue,
    status: matchesText(userValue, requiredValue) ? "match" : "mismatch",
    ...(userTier !== null ? { userTier } : {}),
    ...(requiredTier !== null ? { requiredTier } : {}),
  };
}

function runChecks(specs: UserPcSpecs, block: GameSpecBlock): SpecCheck[] {
  return [...TEXT_FIELDS, ...NUMERIC_FIELDS].map((field) =>
    checkField(field, specs, block),
  );
}

function givenChecks(checks: SpecCheck[]): SpecCheck[] {
  return checks.filter((check) => check.status !== "unknown");
}

/**
 * "match" and "above" both clear the bar.
 * "mismatch" deliberately does not count: we could not rank the chip, so we
 * refuse to claim the user is short. That stays a wording problem, not a
 * hardware problem.
 */
function meetsBar(checks: SpecCheck[]): boolean {
  const given = givenChecks(checks);
  return (
    given.length > 0 &&
    given.every((check) => check.status === "match" || check.status === "above")
  );
}

/** Only true when we positively know a given spec is too weak. */
function hasBelow(checks: SpecCheck[]): boolean {
  return givenChecks(checks).some((check) => check.status === "below");
}

export function countProvidedSpecs(specs: UserPcSpecs): number {
  return ([...TEXT_FIELDS, ...NUMERIC_FIELDS] as SpecField[]).filter((field) => {
    const value = specs[field];
    if (typeof value === "number") return Number.isFinite(value);
    if (typeof value === "string") return normalizeText(value).length > 0;
    return false;
  }).length;
}

/**
 * Compare what the user said against what the catalog lists.
 * Pure function: same inputs always produce the same output.
 */
export function compareRequirements(specs: UserPcSpecs, game: Game): CompareResult {
  const minimum = runChecks(specs, game.requirements.minimum);
  const recommendedBlock = game.requirements.recommended;
  const recommended = recommendedBlock ? runChecks(specs, recommendedBlock) : [];

  return {
    game,
    minimum,
    recommended,
    comparedCount: countProvidedSpecs(specs),
    meetsMinimum: meetsBar(minimum),
    meetsRecommended: recommendedBlock ? meetsBar(recommended) : false,
    isBelowMinimum: hasBelow(minimum),
  };
}

const STATUS_WORDS: Record<SpecStatus, string> = {
  above: "ABOVE",
  below: "BELOW",
  match: "EQUALS",
  mismatch: "does NOT match",
  unknown: "unknown",
};

function describeChecks(checks: SpecCheck[]): string[] {
  return checks.map((check) => {
    if (check.status === "unknown") {
      return `- ${check.label}: user did not say (catalog lists ${check.requiredValue})`;
    }

    if (check.userTier !== undefined && check.requiredTier !== undefined) {
      const rank = `rank ${check.userTier} of 9-ish, bar rank ${check.requiredTier}`;
      return `- ${check.label}: user said ${check.userValue} - ${STATUS_WORDS[check.status]} our listed ${check.requiredValue} (${rank})`;
    }

    return `- ${check.label}: user said ${check.userValue} - ${STATUS_WORDS[check.status]} our listed ${check.requiredValue}`;
  });
}

function describeBlock(title: string, block: GameSpecBlock | null): string[] {
  if (!block) return [`${title}: none listed in our catalog`];
  return [
    `${title}:`,
    `- CPU: ${block.cpu}`,
    `- GPU: ${block.gpu}`,
    `- RAM: ${formatNumber(block.ramGB, "GB")}`,
    `- Storage: ${formatNumber(block.storageGB, "GB")}`,
  ];
}

/**
 * Turn a CompareResult into plain-text facts. The LLM only rewrites this text;
 * it never decides the answer, so the verdict can't be invented.
 */
export function formatVerdict(result: CompareResult): string {
  const { game } = result;

  const lines: string[] = [
    `GAME FOUND IN OUR CATALOG: ${game.name} (${game.releaseYear})`,
    "",
    ...describeBlock("CATALOG MINIMUM REQUIREMENTS", game.requirements.minimum),
    "",
    ...describeBlock(
      "CATALOG RECOMMENDED REQUIREMENTS",
      game.requirements.recommended,
    ),
    "",
    "HOW THE USER'S SPECS LINE UP WITH THE MINIMUM:",
    ...describeChecks(result.minimum),
  ];

  if (result.recommended.length > 0) {
    lines.push(
      "",
      "HOW THE USER'S SPECS LINE UP WITH THE RECOMMENDED:",
      ...describeChecks(result.recommended),
    );
  }

  lines.push("", "VERDICT:");

    if (result.comparedCount === 0) {
    lines.push(
      "- The user did not give any specs, so we cannot compare. Ask for CPU, GPU, RAM and free storage.",
    );
  } else if (result.isBelowMinimum) {
    lines.push(
      "- At least one spec the user gave ranks BELOW our listed minimum.",
      "- Say plainly that their PC is under the listed minimum for this game. Be kind about it, but do not hedge.",
      "- Use only the ABOVE/EQUALS/BELOW marks above. Never invent FPS numbers, settings, or benchmark names.",
    );
  } else if (result.meetsMinimum && result.meetsRecommended) {
    lines.push(
      "- Every spec the user gave is at or above our listed recommended requirements.",
    );
  } else if (result.meetsMinimum) {
    lines.push(
      "- Every spec the user gave clears our listed minimum requirements.",
      "- They do not clear the recommended ones: name the fields marked BELOW in the recommended section above.",
    );
  } else {
    lines.push(
      "- At least one spec the user gave could not be ranked and is not wording we list for this game.",
      "- Say we could not match that spec against our list. Do NOT call their PC too weak.",
    );
  }

  return lines.join("\n");
}