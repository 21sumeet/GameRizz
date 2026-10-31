import type { InputHTMLAttributes } from "react";

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-theme border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none ${className}`}
      {...props}
    />
  );
}
