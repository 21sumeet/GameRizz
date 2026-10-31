import Link from "next/link";

import { APP_NAME } from "@/config/constants";

export function Navbar() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-4">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-foreground"
        >
          {APP_NAME}
          <span className="text-primary">.</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-muted">
          <Link href="/" className="transition hover:text-primary">
            Chat
          </Link>
          <Link href="/recommend" className="transition hover:text-primary">
            Recommend
          </Link>
        </nav>
      </div>
    </header>
  );
}
