"use client"

import * as React from "react"
import { Input } from "./input"
import { formatNumberWithCommas, parseCurrencyToNumber } from "@/app/lib/formatters"
import { cn } from "@/app/lib/utils"

interface MoneyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'size'> {
    value: number | string;
    onChange: (value: number) => void;
    currencySymbol?: string
    hideSymbol?: boolean
    size?: 'default' | 'sm'
    variant?: 'default' | 'headless'
    align?: 'left' | 'center' | 'right'
}

export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
    ({ value, onChange, currencySymbol = '₦', hideSymbol = false, size = 'default', variant = 'default', align = 'left', className, ...props }, ref) => {
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

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            const allowed = new Set([
                'Backspace', 'Delete', 'Tab', 'Enter',
                'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                'Home', 'End',
            ])
            if (
                allowed.has(e.key) ||
                (e.key === '.' && !e.currentTarget.value.includes('.')) ||
                ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) ||
                /^\d$/.test(e.key)
            ) return
            e.preventDefault()
        }

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
                    inputMode="decimal"
                    value={displayValue}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    className={cn("font-medium tabular-nums", className)}
                />
            )
        }

        if (variant === 'headless') {
            const len = displayValue.length || 1
            const fontSize =
                len <= 6  ? '4.5rem'  :
                len <= 8  ? '3.75rem' :
                len <= 10 ? '3rem'    :
                len <= 12 ? '2.25rem' : '1.875rem'

            return (
                <div
                    className={cn(
                        "group flex items-center transition-all",
                        align === 'center' ? "justify-center" : align === 'right' ? "justify-end" : "justify-start",
                        className
                    )}
                    style={{ fontSize }}
                >
                    <span className="text-brand-accent/60 dark:text-brand-cream/60 font-serif tracking-tight transition-colors group-focus-within:text-brand-deep dark:group-focus-within:text-brand-gold mr-3" aria-hidden>
                        {currencySymbol}
                    </span>
                    <input
                        {...props}
                        ref={ref}
                        type="text"
                        inputMode="decimal"
                        value={displayValue}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        className="bg-transparent border-0 outline-none focus:ring-0 p-0 font-serif tabular-nums text-inherit placeholder:text-brand-accent/20 dark:placeholder:text-white/20"
                        style={{
                            width: displayValue ? `${displayValue.length}ch` : '4ch',
                            minWidth: '1ch',
                            fontSize: 'inherit',
                            transition: 'font-size 150ms ease',
                        }}
                    />
                </div>
            )
        }

        const isSmall = size === 'sm'

        return (
            <div className={cn(
                "group flex items-center rounded-2xl border border-brand-deep/10 dark:border-white/10 bg-white/50 dark:bg-white/5 focus-within:ring-2 focus-within:ring-brand-green/20 focus-within:border-brand-green/30 transition-all overflow-hidden",
                isSmall ? "h-10" : "h-14",
                props.disabled && "opacity-50",
                className
            )}>
                <div className={cn(
                    "flex items-center justify-center shrink-0 border-r border-brand-deep/10 dark:border-white/10 bg-brand-deep/2 dark:bg-white/2 self-stretch",
                    isSmall ? "min-w-10 px-3" : "min-w-14 px-4"
                )}>
                    <span className="text-brand-accent/50 dark:text-brand-cream/50 font-semibold text-sm tracking-tight transition-colors group-focus-within:text-brand-deep dark:group-focus-within:text-brand-gold" aria-hidden>
                        {currencySymbol}
                    </span>
                </div>
                <Input
                    {...props}
                    ref={ref}
                    type="text"
                    inputMode="decimal"
                    value={displayValue}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    className={cn(
                        "flex-1 border-0 rounded-none bg-transparent! focus-visible:ring-0 font-medium tabular-nums placeholder:text-brand-accent/40 dark:placeholder:text-white/30 h-full",
                        isSmall ? "pl-2 pr-3 text-sm" : "pl-3 pr-4 text-base"
                    )}
                />
            </div>
        )
    }
)

MoneyInput.displayName = "MoneyInput"
