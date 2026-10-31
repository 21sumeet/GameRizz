import type { ReactNode } from "react";

import { Navbar } from "./navbar";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-6">
        {children}
      </main>
      <footer className="border-t border-border px-4 py-4 text-center text-xs text-muted">
        GameRizz — verdicts come from real data, never guesses.
      </footer>
    </div>
  );
}
