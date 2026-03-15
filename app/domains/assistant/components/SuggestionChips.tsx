"use client"

import { motion } from "framer-motion"
import { cn } from "@/app/lib/utils"
import type { SuggestionChip } from "../types"

interface SuggestionChipsProps {
    chips: SuggestionChip[]
    onSelect: (prompt: string) => void
    className?: string
}

export function SuggestionChips({ chips, onSelect, className }: SuggestionChipsProps) {
    return (
        <div className={cn("flex flex-wrap gap-2", className)}>
            {chips.map((chip, index) => (
                <motion.button
                    key={chip.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
                    onClick={() => onSelect(chip.prompt)}
                    className={cn(
                        "inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium",
                        "bg-white/60 dark:bg-white/5 border border-brand-accent/10 dark:border-white/10",
                        "text-brand-deep/80 dark:text-brand-cream/80",
                        "hover:bg-brand-gold/10 hover:border-brand-gold/20 hover:text-brand-gold",
                        "active:scale-[0.97]",
                        "transition-all duration-300 cursor-pointer"
                    )}
                >
                    {chip.icon && <span className="text-base">{chip.icon}</span>}
                    <span>{chip.label}</span>
                </motion.button>
            ))}
        </div>
    )
}
