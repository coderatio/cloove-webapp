"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/app/lib/utils"

interface SwitchProps {
    checked?: boolean
    defaultChecked?: boolean
    onCheckedChange?: (checked: boolean) => void
    disabled?: boolean
    className?: string
}

export function Switch({ checked, defaultChecked, onCheckedChange, disabled, className }: SwitchProps) {
    const [isOn, setIsOn] = React.useState(checked ?? defaultChecked ?? false)

    React.useEffect(() => {
        if (checked !== undefined) {
            setIsOn(checked)
        }
    }, [checked])

    const toggle = () => {
        if (disabled) return
        const newState = !isOn
        if (checked === undefined) {
            setIsOn(newState)
        }
        onCheckedChange?.(newState)
    }

    return (
        <div
            onClick={toggle}
            className={cn(
                "relative h-7 w-12 cursor-pointer rounded-full border border-slate-300 bg-slate-200 p-1 transition-colors dark:border-slate-700 dark:bg-slate-800",
                isOn && "border-brand-gold bg-brand-gold dark:border-brand-gold dark:bg-brand-gold",
                disabled && "opacity-50 cursor-not-allowed",
                className
            )}
        >
            <motion.div
                initial={false}
                animate={{ x: isOn ? 20 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={cn(
                    "h-5 w-5 rounded-full bg-white shadow-sm"
                )}
            />
        </div>
    )
}
