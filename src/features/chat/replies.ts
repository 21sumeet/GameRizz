import type { SpecField } from "@/features/checker/compare";

const FIELD_NAMES: Record<SpecField, string> = {
  cpu: "CPU",
  gpu: "GPU",
  ramGB: "RAM",
  storageGB: "storage",
};

/** Door 2: the user named a part we cannot pin down. Ask, never guess. */
export function askForSpecs(fields: SpecField[]): string {
  const what = fields.map((field) => FIELD_NAMES[field]).join(" and ");
  return `I can't pin down your ${what} from that, so I won't guess. Give me the exact model — something like "i5-12400" or "RTX 3060" — and I'll check it against our list.`;
}

/** Door 3: the game is not in our catalog. Never let the AI invent its specs. */
export function noGameReply(): string {
  return "I don't have that game in my mind yet, so I can't check it properly — and I'd rather say that than make something up. Send me the exact title and I'll tell you if it's in there.";
}

/**
 * Door 3 with a Steam attempt behind it: the game is on Steam, but its
 * requirements were missing or garbled. Say so; never guess a number.
 */
export function specsUnavailableReply(): string {
  return "I found that game on Steam, but its system requirements weren't readable there, so I can't check it properly — and I'd rather say that than make something up.";
}