import { chatComplete } from "@/lib/ai/client";
import { SYSTEM_PROMPT } from "@/features/chat/persona";
import type { ChatRequest, ChatResponse } from "@/features/chat/types";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ChatRequest | null;
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (!message) {
    return Response.json({ error: "message is required" }, { status: 400 });
  }

  try {
    const reply = await chatComplete([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: message },
    ]);
    return Response.json({ reply } satisfies ChatResponse);
  } catch (error) {
    console.error("[api/chat]", error);
    return Response.json(
      { error: "The assistant is unavailable right now." },
      { status: 502 },
    );
  }
}