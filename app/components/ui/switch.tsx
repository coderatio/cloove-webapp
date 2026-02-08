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
                "w-12 h-7 bg-brand-deep/10 dark:bg-white/10 rounded-full p-1 cursor-pointer transition-colors relative",
                isOn && "bg-brand-green dark:bg-brand-gold",
                disabled && "opacity-50 cursor-not-allowed",
                className
            )}
        >
            <motion.div
                initial={false}
                animate={{ x: isOn ? 20 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={cn(
                    "w-5 h-5 bg-white rounded-full shadow-sm",
                    isOn && "dark:bg-brand-deep"
                )}
            />
        </div>
    )
}
