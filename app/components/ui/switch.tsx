"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/app/lib/utils"

interface SwitchProps {
    id?: string
    checked?: boolean
    defaultChecked?: boolean
    onCheckedChange?: (checked: boolean) => void
    disabled?: boolean
    className?: string
}

export function Switch({ id, checked, defaultChecked, onCheckedChange, disabled, className }: SwitchProps) {
    const [isOn, setIsOn] = React.useState(checked ?? defaultChecked ?? false)

    React.useEffect(() => {
        if (checked !== undefined) {
            setIsOn(checked)
        }
    }, [checked])

    const toggle = React.useCallback(() => {
        if (disabled) return
        const newState = !isOn
        setIsOn(newState)
        onCheckedChange?.(newState)
    }, [disabled, isOn, onCheckedChange])

    const handleKeyDown = React.useCallback(
        (e: React.KeyboardEvent) => {
            if (disabled) return
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                toggle()
            }
        },
        [disabled, toggle]
    )

    return (
        <div
            id={id}
            role="switch"
            aria-checked={isOn}
            tabIndex={disabled ? -1 : 0}
            onClick={toggle}
            onKeyDown={handleKeyDown}
            className={cn(
                "relative h-7 w-12 shrink-0 cursor-pointer rounded-full border border-brand-deep/10 bg-brand-deep/8 p-0.5 transition-colors shadow-inner shadow-brand-deep/[0.025] dark:border-white/12 dark:bg-white/10 dark:shadow-black/20",
                isOn && "border-brand-gold bg-brand-gold-700 shadow-none dark:border-brand-gold dark:bg-brand-gold-700",
                disabled && "opacity-50 cursor-not-allowed",
                className
            )}
        >
            <motion.div
                initial={false}
                animate={{ x: isOn ? 22 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={cn(
                    "h-5 w-5 rounded-full bg-white shadow-sm ring-1 ring-black/[0.03] pointer-events-none dark:bg-white dark:ring-white/10"
                )}
            />
        </div>
    )
}
