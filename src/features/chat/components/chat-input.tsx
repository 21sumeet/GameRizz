"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { MAX_INPUT_CHARS } from "@/config/constants";

import { Button } from "@/components/ui/button";

export function ChatInput({
  onSend,
  disabled = false,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");

  function submit() {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submit();
  }

  // Enter sends, Shift+Enter makes a new line.
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <textarea
        value={value}
        maxLength={MAX_INPUT_CHARS}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        placeholder="e.g. can I run Elden Ring? i5 10400, 16gb ram, gtx 1650"
        aria-label="Message"
        className="max-h-40 min-h-[2.75rem] flex-1 resize-none rounded-theme border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
      />
      <Button type="submit" disabled={disabled || value.trim().length === 0}>
        {disabled ? "Thinking…" : "Send"}
      </Button>
    </form>
  );
}
