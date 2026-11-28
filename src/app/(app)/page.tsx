import { ChatWindow } from "@/features/chat/components/chat-window";
import { APP_TAGLINE } from "@/config/constants";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {APP_TAGLINE}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Drop a game + your specs. Verdict first, receipts after.
        </p>
      </div>
      <ChatWindow />
    </div>
  );
}