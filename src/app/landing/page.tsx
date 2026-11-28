import type { Metadata } from "next";
import Link from "next/link";

import { CatalogStrip } from "@/components/landing/catalog-strip";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Moves } from "@/components/landing/moves";
import { PersonaSample } from "@/components/landing/persona-sample";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { MarketingNav } from "@/components/layout/marketing-nav";
import { buttonClassNames } from "@/components/ui/button";
import { getGamesRepository } from "@/lib/data/games.repository";

export const metadata: Metadata = {
  title: "GameRizz — can your rig run it?",
  description:
    "Tell GameRizz your CPU, GPU and RAM. It checks the real requirements and tells you where your PC actually stands.",
};

export default function LandingPage() {
  const games = getGamesRepository().getAll();
  const popular = games.filter((game) => game.popular);
  const featured = (popular.length > 0 ? popular : games).slice(0, 18);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <MarketingNav />

      <main className="flex-1">
        <Hero gameCount={games.length} />
        <Moves />
        <HowItWorks />
        <CatalogStrip games={featured} total={games.length} />
        <PersonaSample />

        <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex flex-col gap-6 rounded-theme border border-border bg-surface p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Got your specs handy<span className="text-primary">?</span>
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
                One question is enough. Paste your build or just name the parts
                you remember.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/" className={buttonClassNames("primary")}>
                Open chat
              </Link>
              <Link href="/recommend" className={buttonClassNames("secondary")}>
                Get recommendations
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}