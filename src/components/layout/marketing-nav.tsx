import Link from "next/link";

import { buttonClassNames } from "@/components/ui/button";
import { APP_NAME } from "@/config/constants";

const SECTION_LINKS = [
  { href: "#checker", label: "Checker" },
  { href: "#recommender", label: "Recommender" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#catalog", label: "Catalog" },
] as const;

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-4 py-4 sm:px-6">
        <Link
          href="/landing"
          className="text-lg font-bold tracking-tight text-foreground"
        >
          {APP_NAME}
          <span className="text-primary">.</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-muted md:flex">
          {SECTION_LINKS.map(({ href, label }) => (
            <a key={href} href={href} className="transition hover:text-primary">
              {label}
            </a>
          ))}
        </nav>

        <Link
          href="/"
          className={buttonClassNames("secondary", "px-3 py-1.5 text-xs")}
        >
          Open chat
        </Link>
      </div>
    </header>
  );
}