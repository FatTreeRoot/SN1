import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "quiet" | "destructive";
type Size = "default" | "large";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-on-accent hover:bg-accent-strong border border-transparent",
  quiet: "bg-surface text-ink border border-line hover:border-line-strong",
  // Red is reserved: destructive confirmations only, never a general accent
  destructive: "bg-urgent text-on-urgent border border-transparent",
};

const sizes: Record<Size, string> = {
  default: "px-4 py-2 text-body rounded-md",
  // Field size: one-handed, gloved, 48px minimum hit target
  large: "px-6 py-3.5 text-body-lg rounded-lg min-h-12 w-full",
};

export function Button({
  variant = "primary",
  size = "default",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      className={`pressable font-medium disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
