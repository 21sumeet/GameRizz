import { chatComplete } from "@/lib/ai/client";
import { CHECKER_PROMPT, SYSTEM_PROMPT } from "@/features/chat/persona";
import { hasAnySpec, parseQuery } from "@/features/chat/spec-parser";
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
 * and the model only rewords it. Anything else stays a normal chat message.
 */
async function buildReply(message: string): Promise<string> {
  const { game, specs } = parseQuery(message);

  if (!game || !hasAnySpec(specs)) {
    return chatComplete([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: message },
    ]);
  }

  const verdict = formatVerdict(compareRequirements(specs, game));

  return chatComplete([
    { role: "system", content: CHECKER_PROMPT },
    { role: "user", content: `User message:\n${message}\n\nCatalog facts:\n${verdict}` },
  ]);
}