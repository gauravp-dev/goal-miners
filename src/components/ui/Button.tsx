"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold shadow-[0_0_30px_-10px_rgba(34,197,94,0.7)]",
  secondary:
    "bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700",
  ghost:
    "bg-transparent hover:bg-zinc-800/60 text-zinc-200",
  danger:
    "bg-red-600 hover:bg-red-500 text-white",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm rounded-md",
  md: "h-11 px-5 text-base rounded-lg",
  lg: "h-14 px-8 text-lg rounded-xl",
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ className, variant = "primary", size = "md", ...rest }, ref) {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 transition-all",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-inherit",
          "active:scale-[0.98]",
          variants[variant],
          sizes[size],
          className,
        )}
        {...rest}
      />
    );
  },
);
