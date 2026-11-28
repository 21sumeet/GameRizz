import Link from "next/link";

import { buttonClassNames } from "@/components/ui/button";

/** Real checker output for Cyberpunk 2077 on an i5-12400 / RTX 3050 / 16GB rig. */
const SAMPLE_ROWS = [
  { label: "CPU", value: "i5-12400", state: "above", tone: "text-success" },
  { label: "GPU", value: "RTX 3050", state: "below", tone: "text-warning" },
  { label: "RAM", value: "16 GB", state: "match", tone: "text-success" },
] as const;

export function Hero({ gameCount }: { gameCount: number }) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div aria-hidden="true" className="grid-lines absolute inset-0" />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-b from-transparent via-background/60 to-background"
      />

      <div className="relative mx-auto grid w-full max-w-6xl gap-14 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-28">
        <div>
          <p className="font-mono text-[11px] tracking-[0.22em] text-muted uppercase">
            {gameCount} games · cpu + gpu tiers · no guesses
          </p>

          <h1 className="mt-6 text-4xl leading-[1.05] font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Can your rig
            <br />
            run it<span className="text-primary">?</span>
          </h1>

          <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
            Tell GameRizz what&apos;s inside your PC. It reads the real
            requirements from the catalog, ranks your parts against our tier
            tables, and tells you where you actually stand.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/" className={buttonClassNames("primary")}>
              Check my PC
            </Link>
            <Link href="/recommend" className={buttonClassNames("secondary")}>
              What should I play?
            </Link>
          </div>

          <dl className="mt-12 flex flex-wrap gap-x-10 gap-y-4 border-t border-border pt-6 text-sm">
            <div>
              <dt className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
                Catalog
              </dt>
              <dd className="mt-1 font-semibold text-foreground">
                {gameCount} games
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
                Ranked
              </dt>
              <dd className="mt-1 font-semibold text-foreground">
                348 CPU + GPU chips
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
                Verdict
              </dt>
              <dd className="mt-1 font-semibold text-foreground">
                Decided in code
              </dd>
            </div>
          </dl>
        </div>

        <figure className="rounded-theme border border-border bg-surface">
          <figcaption className="flex items-center justify-between border-b border-border px-5 py-3">
            <span className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
              Verdict
            </span>
            <span className="font-mono text-[11px] tracking-[0.18em] text-warning uppercase">
              Minimum met
            </span>
          </figcaption>

          <div className="px-5 py-5">
            <p className="text-lg font-semibold text-foreground">
              Cyberpunk 2077
            </p>
            <p className="mt-1 text-xs text-muted">
              Minimum 12 GB RAM · 70 GB storage
            </p>

            <ul className="mt-5 divide-y divide-border border-y border-border">
              {SAMPLE_ROWS.map((row) => (
                <li
                  key={row.label}
                  className="flex items-center justify-between gap-4 py-3 text-sm"
                >
                  <span className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
                    {row.label}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-foreground">{row.value}</span>
                    <span
                      className={`font-mono text-[10px] tracking-[0.16em] uppercase ${row.tone}`}
                    >
                      {row.state}
                    </span>
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-5 text-sm leading-relaxed text-muted">
              Clears the minimum, but the GPU sits under the recommended bar.
              Expect it to run — not maxed out.
            </p>
          </div>
        </figure>
      </div>
    </section>
  );
}