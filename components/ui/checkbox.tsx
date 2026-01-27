"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

const Checkbox = React.forwardRef<HTMLDivElement, CheckboxProps>(
  ({ checked, onCheckedChange, disabled, className }, ref) => {
    return (
      <div
        ref={ref}
        role="checkbox"
        aria-checked={checked}
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && onCheckedChange?.(!checked)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === " " || e.key === "Enter")) {
            e.preventDefault();
            onCheckedChange?.(!checked);
          }
        }}
        className={cn(
          "h-6 w-6 rounded-xl border border-white/10 bg-black/20 flex items-center justify-center transition-all cursor-pointer hover:bg-white/5",
          checked && "bg-indigo-600 border-indigo-500",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        {checked && <Check className="h-4 w-4 text-white" />}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
