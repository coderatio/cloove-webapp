"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckIcon as Check } from "@hugeicons/core-free-icons"
import { cn } from "@/app/lib/utils"

export interface CheckboxProps
    extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
    checked?: boolean
    onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
    ({ className, checked = false, onCheckedChange, disabled, ...props }, ref) => {
        return (
            <button
                ref={ref}
                type="button"
                role="checkbox"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => onCheckedChange?.(!checked)}
                className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-brand-deep/25 bg-white text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/25 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/25 dark:bg-white/5",
                    checked && "border-brand-green bg-brand-green dark:border-brand-gold dark:bg-brand-gold",
                    className
                )}
                {...props}
            >
                {checked && <HugeiconsIcon icon={Check} className="h-3.5 w-3.5 stroke-[3]" />}
            </button>
        )
    }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
