import * as React from "react";

import { cn } from "../../lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "w-full rounded-md bg-gray-100 px-4 py-3 text-gray-900 outline-none placeholder:text-gray-400 transition-all focus:bg-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-0",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";

export { Input };
