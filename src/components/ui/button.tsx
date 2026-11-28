import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:brightness-110 active:brightness-95",
  secondary:
    "bg-surface text-foreground border border-border hover:border-primary",
  ghost: "bg-transparent text-muted hover:text-primary",
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-theme px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

/** Shared recipe so links can render as buttons without copying class strings. */
export function buttonClassNames(
  variant: ButtonVariant = "primary",
  className = "",
) {
  return `${baseClasses} ${variantClasses[variant]} ${className}`;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return <button className={buttonClassNames(variant, className)} {...props} />;
}
