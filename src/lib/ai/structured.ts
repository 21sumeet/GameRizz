import { chatComplete } from "@/lib/ai/client";
import type { GameSpecBlock, GameRequirements } from "@/types/game";

/**
 * 1. work out which game a message is about, so we can search Steam
 * 2. turn Steam's messy requirement text into four clean values
 *
 * Both validate the reply before anyone trusts it. A bad reply means "we could
 * not read it", never a guessed number.
 */

const NAME_PROMPT = `You name the video game a message is about.
Reply with the game's official title only. No quotes, no punctuation, no explanation.
If the message does not name a specific game, reply exactly: NONE`;

const SPECS_PROMPT = `You convert PC system requirements into JSON.
Reply with JSON only. No explanation, no markdown, no code fences.
Shape:
{"minimum":{"cpu":"","gpu":"","ramGB":0,"storageGB":0},"recommended":{"cpu":"","gpu":"","ramGB":0,"storageGB":0}}
Set "recommended" to null when no recommended text is given.
ramGB and storageGB must be plain numbers of gigabytes: 16, not "16 GB".
If storage is given in MB, convert it to GB (512 MB is 0.5).
Leave CPU or GPU as "" when the text does not name one. Never guess a part.`;

/** What the user is asking about, or null when no game is named. */
export async function extractGameName(message: string): Promise<string | null> {
  const raw = await chatComplete([
    { role: "system", content: NAME_PROMPT },
    { role: "user", content: message },
  ]);

  const name = raw
    .replace(/[\r\n]+/g, " ")
    .replace(/^["'`]+|["'`.]+$/g, "")
    .trim();

  if (name.length === 0 || name.length > 80) return null;
  if (name.toUpperCase() === "NONE") return null;
  return name;
}

/** Steam settings, cleaned up. Returns null when the text could not be read. */
export async function extractSpecs(
  minimumText: string,
  recommendedText: string | null,
): Promise<GameRequirements | null> {
  const raw = await chatComplete([
    { role: "system", content: SPECS_PROMPT },
    {
      role: "user",
      content: `MINIMUM:\n${minimumText}\n\nRECOMMENDED:\n${recommendedText ?? "NONE"}`,
    },
  ]);

  const parsed = readJsonObject(raw);
  if (!parsed) return null;

  const minimum = toSpecBlock(parsed.minimum);
  if (!minimum) return null;

  const recommended = parsed.recommended ? toSpecBlock(parsed.recommended) : null;
  return { minimum, recommended };
}

/** Models like to wrap JSON in prose or fences. Find the object inside. */
function readJsonObject(raw: string): Record<string, unknown> | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end <= start) return null;

  try {
    const value: unknown = JSON.parse(raw.slice(start, end + 1));
    if (typeof value !== "object" || value === null) return null;
    return value as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Nothing is trusted until it is checked here. CPU and GPU are what the
 * comparison is built on, so a block without them is not usable.
 */
function toSpecBlock(value: unknown): GameSpecBlock | null {
  if (typeof value !== "object" || value === null) return null;

  const block = value as Record<string, unknown>;
  const cpu = typeof block.cpu === "string" ? block.cpu.trim() : "";
  const gpu = typeof block.gpu === "string" ? block.gpu.trim() : "";
  const ramGB = Number(block.ramGB);
  const storageGB = Number(block.storageGB);

  if (cpu.length === 0 || gpu.length === 0) return null;
  if (!Number.isFinite(ramGB) || ramGB <= 0) return null;
  if (!Number.isFinite(storageGB) || storageGB <= 0) return null;

  return { cpu, gpu, ramGB, storageGB };
}