"use client"

import * as React from "react"
import { Input } from "./input"
import { formatNumberWithCommas, parseCurrencyToNumber } from "@/app/lib/formatters"
import { cn } from "@/app/lib/utils"

interface MoneyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    value: number | string;
    onChange: (value: number) => void;
    currencySymbol?: string;
}

export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
    ({ value, onChange, currencySymbol = "₦", className, ...props }, ref) => {
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

        return (
            <div className="relative group">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-accent/40 dark:text-brand-cream/40 font-medium transition-colors group-focus-within:text-brand-gold">
                    {currencySymbol}
                </span>
                <Input
                    {...props}
                    ref={ref}
                    type="text"
                    value={displayValue}
                    onChange={handleChange}
                    className={cn("pl-11 pr-6 py-4 h-14 rounded-2xl", className)}
                />
            </div>
        )
    }
)

MoneyInput.displayName = "MoneyInput"
