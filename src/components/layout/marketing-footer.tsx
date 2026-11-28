import Link from "next/link";

import { APP_NAME } from "@/config/constants";

const COLUMNS = [
  {
    title: "App",
    links: [
      { href: "/", label: "Chat" },
      { href: "/recommend", label: "Recommend" },
    ],
  },
  {
    title: "This page",
    links: [
      { href: "#how-it-works", label: "How it works" },
      { href: "#catalog", label: "Catalog" },
    ],
  },
] as const;

export function MarketingFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 md:flex-row md:justify-between">
        <div className="max-w-xs">
          <p className="text-base font-bold tracking-tight text-foreground">
            {APP_NAME}
            <span className="text-primary">.</span>
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Verdicts come from the catalog and our tier tables. Never from the
            model&apos;s imagination.
          </p>
        </div>

        <div className="flex gap-16">
          {COLUMNS.map(({ title, links }) => (
            <div key={title}>
              <p className="font-mono text-[11px] tracking-[0.2em] text-muted uppercase">
                {title}
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                {links.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-foreground/80 transition hover:text-primary"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-4 font-mono text-[11px] tracking-[0.18em] text-muted uppercase sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>{APP_NAME} — pc gaming assistant</span>
          <span>Model talks. Code decides.</span>
        </div>
      </div>
    </footer>
  );
}