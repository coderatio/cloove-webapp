"use client"

import * as React from "react"
import { cn } from "@/app/lib/utils"

interface CurrencyDisplayProps {
    value: number
    currency?: string
    locale?: string
    className?: string
    symbolClassName?: string
}

export function CurrencyDisplay({
    value,
    currency = "NGN",
    locale = "en-NG",
    className,
    symbolClassName,
}: CurrencyDisplayProps) {
    const parts = React.useMemo(() => {
        return new Intl.NumberFormat(locale, {
            style: "currency",
            currency,
            currencyDisplay: "narrowSymbol",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).formatToParts(value)
    }, [value, currency, locale])

    return (
        <span className={cn("inline-flex items-baseline gap-1", className)}>
            {parts.map((part, index) => {
                if (part.type === "currency") {
                    return (
                        <span
                            key={index}
                            className={cn(
                                "text-[0.6em] font-medium opacity-60 self-center mb-[0.1em] font-sans",
                                symbolClassName
                            )}
                        >
                            {part.value}
                        </span>
                    )
                }
                return (
                    <span key={index}>
                        {part.value}
                    </span>
                )
            })}
        </span>
    )
}
