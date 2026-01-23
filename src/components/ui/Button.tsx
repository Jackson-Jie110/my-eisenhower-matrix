import React from "react";
import { Loader2 } from "lucide-react";

import { cn } from "../../lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const outerBase =
  "group relative inline-flex items-center justify-center rounded-xl p-[2px] transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50";

const innerBase =
  "flex w-full items-center justify-center gap-2 rounded-[10px] text-white transition-all";

const outerVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-br from-blue-500/80 to-transparent hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]",
  danger:
    "bg-gradient-to-br from-red-500/80 to-transparent hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]",
  ghost: "bg-transparent",
  outline: "bg-transparent border border-white/15",
  secondary: "bg-white/10 hover:bg-white/20",
};

const innerVariants: Record<ButtonVariant, string> = {
  primary: "bg-slate-950 group-hover:bg-slate-900",
  danger: "bg-slate-950 group-hover:bg-slate-900",
  ghost: "bg-transparent text-slate-200 group-hover:bg-white/10",
  outline: "bg-transparent text-slate-200 group-hover:bg-white/10",
  secondary: "bg-glass-100 text-slate-100 backdrop-blur-md group-hover:bg-glass-200",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-4 py-2.5 text-base",
  lg: "px-5 py-3 text-lg",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      type,
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type ?? "button"}
        className={cn(outerBase, outerVariants[variant], className)}
        disabled={isDisabled}
        aria-busy={isLoading}
        {...props}
      >
        <span className={cn(innerBase, innerVariants[variant], sizeClasses[size])}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {children}
        </span>
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
