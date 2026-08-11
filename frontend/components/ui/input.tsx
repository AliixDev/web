// frontend/components/ui/input.tsx

import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full border border-neutral-200 bg-background px-3.5 py-2 text-[13px] text-foreground shadow-none transition-colors duration-200 placeholder:text-neutral-400 hover:border-neutral-300 focus:border-foreground focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
