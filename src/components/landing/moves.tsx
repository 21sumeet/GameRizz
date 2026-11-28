import Link from "next/link";

import { SectionHeading } from "./section-heading";

const SAMPLE_RIG = "i5-12400 · RTX 3050 · 16 GB";

const VERDICTS = [
  {
    game: "Elden Ring",
    line: "Clears minimum and recommended",
    tone: "text-success",
    label: "yes",
  },
  {
    game: "Cyberpunk 2077",
    line: "Minimum met · GPU under recommended",
    tone: "text-warning",
    label: "caution",
  },
  {
    game: "Red Dead Redemption 2",
    line: "120 GB free · needs 150 GB",
    tone: "text-danger",
    label: "no",
  },
] as const;

const RECOMMENDATIONS = [
  {
    game: "Sekiro: Shadows Die Twice",
    meta: "Action · Soulslike",
    why: "Same Action and Difficult energy as Hollow Knight.",
  },
  {
    game: "Hades",
    meta: "Roguelike · Action · Hack and Slash",
    why: "Same Action and Singleplayer energy as Hollow Knight.",
  },
] as const;

export function Moves() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
      <SectionHeading index="01" label="Two moves" title="Ask a question, or get a shortlist.">
        Both surfaces read the same catalog. You never get a spec table you
        cannot trace back to a source.
      </SectionHeading>

      <div className="mt-10 grid gap-px overflow-hidden rounded-theme border border-border bg-border lg:grid-cols-5">
        <div id="checker" className="bg-surface p-6 lg:col-span-3 sm:p-8">
          <p className="font-mono text-[11px] tracking-[0.2em] text-muted uppercase">
            The checker
          </p>
          <h3 className="mt-3 text-xl font-semibold tracking-tight text-foreground">
            &ldquo;Will Cyberpunk run on my PC?&rdquo;
          </h3>
          <p className="mt-2 text-sm text-muted">{SAMPLE_RIG}</p>

          <ul className="mt-6 divide-y divide-border border-t border-border">
            {VERDICTS.map(({ game, line, tone, label }) => (
              <li
                key={game}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-4"
              >
                <span className="text-sm font-semibold text-foreground">
                  {game}
                </span>
                <span className="flex items-baseline gap-3">
                  <span className="text-xs text-muted">{line}</span>
                  <span
                    className={`font-mono text-[10px] tracking-[0.16em] uppercase ${tone}`}
                  >
                    {label}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          <Link
            href="/"
            className="mt-6 inline-block text-xs text-primary transition hover:brightness-110"
          >
            Run it on your own specs →
          </Link>
        </div>

        <div id="recommender" className="bg-surface p-6 lg:col-span-2 sm:p-8">
          <p className="font-mono text-[11px] tracking-[0.2em] text-muted uppercase">
            The recommender
          </p>
          <h3 className="mt-3 text-xl font-semibold tracking-tight text-foreground">
            &ldquo;I loved Hollow Knight&rdquo;
          </h3>

          <ul className="mt-6 space-y-4">
            {RECOMMENDATIONS.map(({ game, meta, why }) => (
              <li key={game} className="border-t border-border pt-4">
                <p className="text-sm font-semibold text-foreground">{game}</p>
                <p className="mt-1 text-[11px] text-muted">{meta}</p>
                <p className="mt-2 text-xs text-primary">{why}</p>
              </li>
            ))}
          </ul>

          <Link
            href="/recommend"
            className="mt-6 inline-block text-xs text-primary transition hover:brightness-110"
          >
            Describe your taste →
          </Link>
        </div>
      </div>
    </section>
  );
}