import { chatComplete } from "@/lib/ai/client";
import { CHECKER_PROMPT, SYSTEM_PROMPT } from "@/features/chat/persona";
import { hasAnySpec, parseQuery } from "@/features/chat/spec-parser";
import { askForSpecs, noGameReply } from "@/features/chat/replies";
import { compareRequirements, formatVerdict } from "@/features/checker/compare";
import type { ChatRequest, ChatResponse } from "@/features/chat/types";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ChatRequest | null;
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (!message) {
    return Response.json({ error: "message is required" }, { status: 400 });
  }

  try {
    const reply = await buildReply(message);
    return Response.json({ reply } satisfies ChatResponse);
  } catch (error) {
    console.error("[api/chat]", error);
    return Response.json(
      { error: "The assistant is unavailable right now." },
      { status: 502 },
    );
  }
}

/**
 * If the message names a game from our catalog, the catalog decides the answer
 * and the model only rewords it. there are 3 ways of handling names as door1 , 2 and 3
 */
/**
 * Three doors:
 * 1. game + every named part is a real row in our tables -> our numbers decide, the model only words it.
 * 2. game found, but a part the user named cannot be placed -> ask, no verdict.
 * 3. no such game -> say so, no verdict.
 */
async function buildReply(message: string): Promise<string> {
  const { game, specs, unresolved } = parseQuery(message);
  const talkingAboutPc = hasAnySpec(specs) || unresolved.length > 0;
  
  // door 3 : no such game -> say so, no verdict.
  if (!game) {
    if (!talkingAboutPc) {
      return chatComplete([
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message },
      ]);
    }
    return noGameReply();
  }


  // Door 2: named but not placeable ("i5" with no number, or a chip not in our
  // table). "mismatch" is exactly that case - checkField only uses it when the
  // chip could not be ranked AND its wording is not one the catalog lists.
  const result = compareRequirements(specs, game);
  const unpinned = [
    ...new Set([
      ...unresolved,
      ...result.minimum
        .filter((check) => check.status === "mismatch")
        .map((check) => check.field),
    ]),
  ];
  if (unpinned.length > 0) return askForSpecs(unpinned);

  if (!game || !hasAnySpec(specs)) {
    return chatComplete([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: message },
    ]);
  }
  
  //door 1
  const verdict = formatVerdict(result);
  return chatComplete([
    { role: "system", content: CHECKER_PROMPT },
    { role: "user", content: `User message:\n${message}\n\nCatalog facts:\n${verdict}` },
  ]);
}