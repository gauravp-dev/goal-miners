"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-11 px-4 w-full rounded-lg bg-zinc-900 border border-zinc-800",
          "text-zinc-100 placeholder:text-zinc-500",
          "focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30",
          "transition-all",
          className,
        )}
        {...rest}
      />
    );
  },
);
