import type { Game, GameSpecBlock } from "@/types/game";
import type { UserPcSpecs } from "@/types/pc";
import { normalizeText, tokenize } from "@/lib/utils/text";

export type SpecField = "cpu" | "gpu" | "ramGB" | "storageGB";

export type SpecStatus = "match" | "mismatch" | "unknown";

export interface SpecCheck {
  field: SpecField;
  label: string;
  /** What the user gave us, formatted for display. */
  userValue: string;
  /** What the catalog asks for, formatted for display. */
  requiredValue: string;
  status: SpecStatus;
}

export interface CompareResult {
  game: Game;
  /** Checks against `requirements.minimum`. */
  minimum: SpecCheck[];
  /** Checks against `requirements.recommended`; empty when the game has none. */
  recommended: SpecCheck[];
  /** How many fields the user actually told us about. */
  comparedCount: number;
  /** True when every spec the user gave matched the minimum block. */
  matchesMinimum: boolean;
  /** True only when the game has a recommended block and every given spec matched it. */
  matchesRecommended: boolean;
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
      status: userValue >= required ? "match" : "mismatch",
    };
  }

  const userValue = specs[field];
  if (typeof userValue !== "string" || normalizeText(userValue).length === 0) {
    return { ...base, userValue: "", status: "unknown" };
  }

  return {
    ...base,
    userValue,
    status: matchesText(userValue, requiredValue) ? "match" : "mismatch",
  };
}

function runChecks(specs: UserPcSpecs, block: GameSpecBlock): SpecCheck[] {
  return [...TEXT_FIELDS, ...NUMERIC_FIELDS].map((field) =>
    checkField(field, specs, block),
  );
}

function allGivenMatch(checks: SpecCheck[]): boolean {
  const given = checks.filter((check) => check.status !== "unknown");
  return given.length > 0 && given.every((check) => check.status === "match");
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
    matchesMinimum: allGivenMatch(minimum),
    matchesRecommended: recommendedBlock ? allGivenMatch(recommended) : false,
  };
}

function describeChecks(checks: SpecCheck[]): string[] {
  return checks.map((check) => {
    if (check.status === "unknown") {
      return `- ${check.label}: user did not say (catalog lists ${check.requiredValue})`;
    }
    const verdict = check.status === "match" ? "matches" : "does NOT match";
    return `- ${check.label}: user said ${check.userValue} - ${verdict} our listed ${check.requiredValue}`;
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
  } else if (result.matchesMinimum && result.matchesRecommended) {
    lines.push(
      "- Every spec the user gave matches our listed recommended requirements.",
    );
  } else if (result.matchesMinimum) {
    lines.push(
      "- Every spec the user gave matches our listed minimum requirements.",
    );
  } else {
    lines.push(
      "- At least one spec the user gave does not match what we have listed for this game.",
      "- Important: this means their wording is not in our catalog list, NOT that their PC is too weak. Never say the PC is too weak.",
    );
  }

  return lines.join("\n");
}