import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-theme border border-border bg-surface ${className}`}
      {...props}
    />
  );
}
