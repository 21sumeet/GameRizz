export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

/** Wire format for POST /api/chat. */
export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  reply: string;
}