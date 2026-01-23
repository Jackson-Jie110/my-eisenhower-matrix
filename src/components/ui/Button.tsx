import React from "react";

import { cn } from "../../lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const baseClasses =
  "rounded-xl font-semibold transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue focus-visible:ring-offset-0";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-[0_0_18px_rgba(96,165,250,0.45)] hover:shadow-[0_0_24px_rgba(96,165,250,0.65)] hover:brightness-110",
  secondary:
    "bg-glass-100 text-slate-100 border border-glass-border backdrop-blur-md hover:bg-glass-200",
  outline:
    "border border-glass-border text-slate-100 bg-transparent backdrop-blur-md hover:bg-white/10",
  ghost: "bg-transparent text-slate-200 hover:bg-white/10",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-5 text-base",
  lg: "h-14 px-6 text-lg",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type, ...props }, ref) => (
    <button
      ref={ref}
      type={type ?? "button"}
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    />
  )
);

Button.displayName = "Button";

export { Button };
