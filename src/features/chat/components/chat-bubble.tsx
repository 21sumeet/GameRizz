import type { ChatMessage } from "../types";

const roleClasses = {
  user: "self-end bg-primary text-primary-foreground rounded-br-sm",
  assistant: "self-start bg-surface text-foreground border border-border rounded-bl-sm",
} as const;

export function ChatBubble({ message }: { message: ChatMessage }) {
  return (
    <div
      className={`max-w-[85%] whitespace-pre-wrap rounded-theme px-4 py-3 text-sm leading-relaxed sm:max-w-[75%] ${roleClasses[message.role]}`}
    >
      {message.content}
    </div>
  );
}
