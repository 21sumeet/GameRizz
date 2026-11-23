import type { ChatMessage } from "../types";
import type { VerdictTone } from "@/features/checker/compare";

const roleClasses = {
  user: "self-end bg-primary text-primary-foreground rounded-br-sm",
  assistant: "self-start bg-surface text-foreground border border-border rounded-bl-sm",
} as const;

/** The left border is the colour cue. The label is for screen readers, since
 *  colour alone must never be the only signal. */
const toneStyles: Record<VerdictTone, { box: string; label: string }> = {
  yes: { box: "border-l-4 border-l-success", label: "Verdict: your PC meets this game's requirements." },
  caution: { box: "border-l-4 border-l-warning", label: "Verdict: your PC meets the minimum but not the recommended requirements." },
  no: { box: "border-l-4 border-l-danger", label: "Verdict: your PC is below the minimum requirements." },
  unknown: { box: "border-l-4 border-l-muted", label: "Verdict: a spec could not be matched against the data." },
  info: { box: "", label: "No verdict." },
};

export function ChatBubble({ message }: { message: ChatMessage }) {
  // Only assistant bubbles carry a verdict colour.
  const tone = message.role === "assistant" ? message.tone : undefined;
  const style = tone ? toneStyles[tone] : undefined;

  return (
    <div
      className={`max-w-[85%] whitespace-pre-wrap rounded-theme px-4 py-3 text-sm leading-relaxed sm:max-w-[75%] ${roleClasses[message.role]} ${style?.box ?? ""}`}
    >
      {style && <span className="sr-only">{style.label} </span>}
      {message.content}
    </div>
  );
}