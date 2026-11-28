import { SectionHeading } from "./section-heading";

const STEPS = [
  {
    step: "01",
    lane: "you",
    title: "You describe your PC",
    body: "Whatever you know: CPU, GPU, RAM, free storage. Partial answers are fine.",
  },
  {
    step: "02",
    lane: "model",
    title: "The model reads the question",
    body: "It pulls out the game and the hardware names. Nothing is invented here.",
  },
  {
    step: "03",
    lane: "code",
    title: "Code compares the specs",
    body: "We look the game up in the catalog, then rank your CPU and GPU against our tier tables.",
  },
  {
    step: "04",
    lane: "model",
    title: "The model rewrites the verdict",
    body: "Same facts, friendlier wording. It cannot change the outcome — only how it sounds.",
  },
] as const;

export function HowItWorks() {
  return (
    <section className="border-y border-border">
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <SectionHeading
          index="02"
          label="How it works"
          title="The model talks. The code decides."
        >
          Every verdict is a comparison our code already made. The model gets the
          finished facts and is told not to add anything.
        </SectionHeading>

        <ol className="mt-10 grid gap-px overflow-hidden rounded-theme border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ step, lane, title, body }) => (
            <li key={step} className="flex flex-col gap-3 bg-background p-6">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[11px] tracking-[0.2em] text-muted">
                  {step}
                </span>
                <span
                  className={`font-mono text-[10px] tracking-[0.18em] uppercase ${
                    lane === "code" ? "text-primary" : "text-muted"
                  }`}
                >
                  {lane}
                </span>
              </div>
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="text-xs leading-relaxed text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}