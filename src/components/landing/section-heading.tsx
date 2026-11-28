import type { ReactNode } from "react";

export function SectionHeading({
  index,
  label,
  title,
  children,
}: {
  index: string;
  label: string;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="border-b border-border pb-6">
      <p className="font-mono text-xs tracking-[0.22em] text-muted uppercase">
        <span className="text-primary">{index}</span>
        <span className="px-2 text-border">/</span>
        {label}
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h2>
      {children ? (
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
          {children}
        </p>
      ) : null}
    </div>
  );
}