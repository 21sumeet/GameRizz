/**
 * Phase 0 placeholder "brain".
 *
 * There is no LLM call here yet on purpose: the layered architecture says the
 * chat feature owns this orchestration, so the UI already talks to a service
 * instead of inventing replies inline. In Phase 2 this function becomes the
 * real Gemini streaming loop that calls the checker tools.
 */
const PLACEHOLDER_REPLIES = [
  "lowkey I'm still warming up 🔧 — real brain lands in Phase 2. Drop a game name plus your CPU, GPU and RAM and I'll be ready to cook.",
  "no cap, my AI backend isn't wired yet. For now tell me the game + your specs so we're set up for the real check.",
  "bestie I'm running on vibes only right now 😅. Phase 2 gives me actual specs data — then it's easy W or you're cooked for real.",
];

export async function getReply(userText: string): Promise<string> {
  // Small artificial delay so the streaming/typing UI is exercised for real.
  await new Promise((resolve) => setTimeout(resolve, 600));

  const reply =
    PLACEHOLDER_REPLIES[userText.trim().length % PLACEHOLDER_REPLIES.length];

  return reply;
}
