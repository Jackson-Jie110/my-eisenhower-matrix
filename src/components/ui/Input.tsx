import React from "react";

import { cn } from "../../lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "w-full rounded-xl border border-glass-border bg-black/20 px-4 py-3 text-slate-100 outline-none placeholder:text-slate-400 transition-all backdrop-blur-md focus:border-transparent focus:ring-2 focus:ring-neon-blue focus:ring-offset-0",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";

export { Input };
