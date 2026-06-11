"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlusSignIcon as Plus,
  MinusSignIcon as Minus,
} from "@hugeicons/core-free-icons";
import { Button } from "@/app/components/ui/button";

/** Compact −/value/+ stepper styled to match the app's input controls. */
export function NumberStepper({
  value,
  min = 0,
  max,
  onChange,
  disabled,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (next: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex h-11 items-center justify-between rounded-2xl border border-brand-deep/8 bg-white/70 px-2 dark:border-white/10 dark:bg-white/5">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-xl"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
      >
        <HugeiconsIcon icon={Minus} className="h-4 w-4" />
      </Button>
      <span className="text-sm font-semibold text-brand-deep dark:text-brand-cream">
        {value}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-xl"
        onClick={() => onChange(max ? Math.min(max, value + 1) : value + 1)}
        disabled={disabled || (max !== undefined && value >= max)}
      >
        <HugeiconsIcon icon={Plus} className="h-4 w-4" />
      </Button>
    </div>
  );
}
