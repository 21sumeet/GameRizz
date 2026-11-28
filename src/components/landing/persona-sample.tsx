import { SectionHeading } from "./section-heading";

export function PersonaSample() {
  return (
    <section className="border-y border-border">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-start">
        <SectionHeading index="04" label="Tone" title="Short, casual, no lecture.">
          It answers like a friend who happens to know the spec sheets. No walls
          of text, no made-up FPS counters, no &ldquo;as an AI&rdquo;.
        </SectionHeading>

        <div className="space-y-3">
          <p className="ml-auto max-w-[85%] rounded-theme rounded-br-sm bg-primary px-4 py-3 text-sm leading-relaxed text-primary-foreground">
            yo will cyberpunk run on my i5 12400 + rtx 3050 with 16gb ram?
          </p>
          <p className="max-w-[85%] rounded-theme rounded-bl-sm border border-border border-l-4 border-l-warning bg-surface px-4 py-3 text-sm leading-relaxed text-foreground">
            yeah you&apos;re good for it — 16gb ram and that cpu clear the
            minimum easy, and the 3050 is above the listed GTX 1060. you just
            won&apos;t hit the recommended bar, so expect it to run, not maxed.
          </p>
        </div>
      </div>
    </section>
  );
}