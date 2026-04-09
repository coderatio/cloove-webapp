"use client"

import * as React from "react"
import { Button } from "@/app/components/ui/button"
import { cn } from "@/app/lib/utils"
import { Minus, Plus } from "lucide-react"

type CapacityStepperProps = {
  value: number
  onChange: (next: number) => void
  disabled?: boolean
  className?: string
}

export function CapacityStepper({
  value,
  onChange,
  disabled,
  className,
}: CapacityStepperProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 bg-white dark:bg-white/5 border border-brand-accent/10 dark:border-white/10 rounded-xl px-1.5 h-10",
        className
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-xl text-brand-accent/50 hover:text-brand-deep dark:hover:text-brand-cream"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={disabled}
      >
        <Minus className="h-3 w-3" />
      </Button>
      <span className="text-sm font-bold w-7 text-center text-brand-deep dark:text-brand-cream tabular-nums">
        {value}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-xl text-brand-accent/50 hover:text-brand-deep dark:hover:text-brand-cream"
        onClick={() => onChange(value + 1)}
        disabled={disabled}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  )
}
