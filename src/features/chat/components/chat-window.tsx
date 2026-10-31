"use client";

import { useEffect, useRef, useState } from "react";

import { ChatBubble } from "./chat-bubble";
import { ChatInput } from "./chat-input";
import { getReply } from "../service";
import type { ChatMessage } from "../types";

const GREETING: ChatMessage = {
  id: "greeting",
  role: "assistant",
  content:
    "yo 👋 I'm GameRizz. Tell me a game and your specs (CPU, GPU, RAM) and I'll tell you if your rig can run it — no cap.",
};

const SUGGESTIONS = [
  "Can I run Cyberpunk 2077? RTX 3050, i5 12400, 16GB RAM",
  "Will Hades II run on a GTX 1050 Ti?",
  "Is 8GB RAM enough for Elden Ring?",
];

export function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view as the conversation grows.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isThinking]);

  async function handleSend(text: string) {
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user", content: text },
    ]);
    setIsThinking(true);

    try {
      const reply = await getReply(text);
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "assistant", content: reply },
      ]);
    } finally {
      setIsThinking(false);
    }
  }

  return (
    <div className="flex w-full flex-1 flex-col gap-6">
      <div
        ref={scrollRef}
        className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1"
      >
        {messages.map((message) => (
          <ChatBubble key={message.id} message={message} />
        ))}
        {isThinking && (
          <div className="self-start rounded-theme border border-border bg-surface px-4 py-3 text-sm text-muted">
            typing…
          </div>
        )}
      </div>

      {messages.length === 1 && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleSend(suggestion)}
              className="rounded-full border border-border px-3 py-1.5 text-xs text-muted transition hover:border-primary hover:text-primary"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <ChatInput onSend={handleSend} disabled={isThinking} />
    </div>
  );
}
