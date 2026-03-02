"use client"

import * as React from "react"
import { Input } from "./input"
import { formatNumberWithCommas, parseCurrencyToNumber } from "@/app/lib/formatters"
import { cn } from "@/app/lib/utils"

interface MoneyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    value: number | string;
    onChange: (value: number) => void;
    currencySymbol?: string;
    hideSymbol?: boolean;
}

export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
    ({ value, onChange, currencySymbol = '₦', hideSymbol = false, className, ...props }, ref) => {
        const [displayValue, setDisplayValue] = React.useState("")

        // Sync display value with incoming numeric value
        React.useEffect(() => {
            if (value === undefined || value === null || value === "") {
                setDisplayValue("")
                return
            }

            const numericValue = typeof value === 'string' ? parseCurrencyToNumber(value) : value
            const formatted = formatNumberWithCommas(numericValue)

            // Only update if it's different to avoid cursor jumps
            if (parseCurrencyToNumber(displayValue) !== numericValue) {
                setDisplayValue(formatted)
            }
        }, [value])

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const rawValue = e.target.value

            // Remove non-numeric characters except for decimal point
            const cleanedValue = rawValue.replace(/[^0-9.]/g, '')

            // Handle multiple decimal points
            const parts = cleanedValue.split('.')
            const sanitizedValue = parts[0] + (parts.length > 1 ? '.' + parts[1] : '')

            // Update local display with commas
            setDisplayValue(formatNumberWithCommas(sanitizedValue))

            // Emit numeric value
            const numericValue = parseFloat(sanitizedValue) || 0
            onChange(numericValue)
        }

        if (hideSymbol) {
            return (
                <Input
                    {...props}
                    ref={ref}
                    type="text"
                    value={displayValue}
                    onChange={handleChange}
                    className={cn("font-medium tabular-nums", className)}
                />
            )
        }

        return (
            <div className={cn("group flex items-stretch rounded-2xl border border-brand-deep/10 dark:border-white/10 bg-white/50 dark:bg-white/5 focus-within:ring-2 focus-within:ring-brand-green/20 focus-within:border-brand-green/30 transition-all overflow-hidden", props.disabled && "opacity-50")}>
                <div className="flex items-center shrink-0 min-w-14 pl-4 pr-2 py-4 border-r border-brand-deep/10 dark:border-white/10 bg-brand-deep/2 dark:bg-white/2">
                    <span className="text-brand-accent/50 dark:text-brand-cream/50 font-semibold text-sm tracking-tight transition-colors group-focus-within:text-brand-deep dark:group-focus-within:text-brand-gold" aria-hidden>
                        {currencySymbol}
                    </span>
                </div>
                <Input
                    {...props}
                    ref={ref}
                    type="text"
                    value={displayValue}
                    onChange={handleChange}
                    className={cn(
                        "flex-1 border-0 rounded-none bg-transparent focus-visible:ring-0 py-4 h-14 pl-3 pr-4 font-medium tabular-nums placeholder:text-brand-accent/40 dark:placeholder:text-white/30",
                        className
                    )}
                />
            </div>
        )
    }
)

MoneyInput.displayName = "MoneyInput"
