export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

// A previous message in the conversation.
export interface ChatHistory {
  role: ChatRole;
  content: string;
}

/** Wire format for POST /api/chat. */
export interface ChatRequest {
  message: string;
  //use for history of users msg , kept option so API work without it too
  history? : ChatHistory[];
}

export interface ChatResponse {
  reply: string;
}