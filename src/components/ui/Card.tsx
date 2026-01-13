import React from "react";

import { cn } from "../../lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-white p-4 rounded-lg border-2 border-transparent transition-all duration-200",
        className
      )}
      {...props}
    />
  )
);

Card.displayName = "Card";

export { Card };
