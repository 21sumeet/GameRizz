import type { ChatMessage } from "../types";
import type { VerdictTone } from "@/features/checker/compare";

const roleClasses = {
  user: "self-end bg-primary text-primary-foreground rounded-br-sm",
  assistant: "self-start bg-surface text-foreground border border-border rounded-bl-sm",
} as const;

/** The left border is the colour cue. The label is for screen readers, since
 *  colour alone must never be the only signal. The emoji is decided by the
 *  code-owned tone, so the model can never contradict the verdict with it. */
const toneStyles: Record<VerdictTone, { box: string; label: string; emoji: string }> = {
  yes: { box: "border-l-4 border-l-success", label: "Verdict: your PC meets this game's requirements.", emoji: "✅" },
  caution: { box: "border-l-4 border-l-warning", label: "Verdict: your PC meets the minimum but not the recommended requirements.", emoji: "⚠️" },
  no: { box: "border-l-4 border-l-danger", label: "Verdict: your PC is below the minimum requirements.", emoji: "❌" },
  unknown: { box: "border-l-4 border-l-muted", label: "Verdict: a spec could not be matched against the data.", emoji: "🤔" },
  info: { box: "", label: "No verdict.", emoji: "🎮" },
};

const ALL_EMOJI = [...new Set(Object.values(toneStyles).map((style) => style.emoji))];

/** Drop a trailing emoji so a model-added one doesn't double up with ours. */
function stripTrailingEmoji(text: string): string {
  let out = text.trimEnd();
  for (const emoji of ALL_EMOJI) {
    if (out.endsWith(emoji)) {
      out = out.slice(0, -emoji.length).trimEnd();
      break;
    }
  }
  return out;
}

export function ChatBubble({ message }: { message: ChatMessage }) {
  // Only assistant bubbles carry a verdict colour.
  const tone = message.role === "assistant" ? message.tone : undefined;
  const style = tone ? toneStyles[tone] : undefined;
  const content = style ? stripTrailingEmoji(message.content) : message.content;

  return (
    <div
      className={`max-w-[85%] whitespace-pre-wrap rounded-theme px-4 py-3 text-sm leading-relaxed sm:max-w-[75%] ${roleClasses[message.role]} ${style?.box ?? ""}`}
    >
      {style && <span className="sr-only">{style.label} </span>}
      {content}
      {style && <span aria-hidden="true"> {style.emoji}</span>}
    </div>
  );
}