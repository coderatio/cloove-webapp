"use client"

import * as React from "react"
import { cn } from "@/app/lib/utils"

interface CurrencyTextProps {
    value: string
    className?: string
    symbolClassName?: string
}

export function CurrencyText({ value, className, symbolClassName }: CurrencyTextProps) {
    const parts = React.useMemo(() => {
        const prefixWithDigit = value.match(/^([^0-9]*)([0-9].*)$/)
        if (prefixWithDigit) {
            const [, symbol, rest] = prefixWithDigit
            return { symbol, rest, suffix: '' }
        }
        const prefixAny = value.match(/^([^0-9]+)(.*)$/)
        if (prefixAny) {
            const [, symbol, rest] = prefixAny
            return { symbol, rest, suffix: '' }
        }
        const suffix = value.match(/^([0-9].*?)([^0-9]*)$/)
        if (suffix) {
            const [, rest, symbol] = suffix
            return { symbol, rest, suffix: symbol }
        }
        return { symbol: '', rest: value, suffix: '' }
    }, [value])

    return (
        <span className={cn("inline-flex items-baseline gap-0.5", className)}>
            {parts.symbol && !parts.suffix ? (
                <span className={cn("font-sans", symbolClassName)}>{parts.symbol}</span>
            ) : null}
            <span>{parts.rest}</span>
            {parts.suffix ? (
                <span className={cn("font-sans", symbolClassName)}>{parts.suffix}</span>
            ) : null}
        </span>
    )
}
