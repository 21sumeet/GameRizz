import { groqConfig } from "@/config/env";

export type AiRole = "system" | "user" | "assistant";
export interface AiMessage {
  role: AiRole;
  content: string;
}

interface GroqChatResponse {
  choices?: { message?: { content?: string } }[];
}

/** One non-streaming chat completion. Returns the assistant text. */
export async function chatComplete(messages: AiMessage[]): Promise<string> {
  const { apiKey, model, baseUrl } = groqConfig();

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Groq ${response.status}: ${detail.slice(0, 300)}`);
  }

  const data = (await response.json()) as GroqChatResponse;
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}