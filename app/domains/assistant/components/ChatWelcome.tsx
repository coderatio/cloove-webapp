"use client"

import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"
import { SuggestionChips } from "./SuggestionChips"
import { welcomeSuggestions } from "../data/mockData"

interface ChatWelcomeProps {
    onSuggestionSelect: (prompt: string) => void
}

export function ChatWelcome({ onSuggestionSelect }: ChatWelcomeProps) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-20">
            {/* Logo + Branding */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="flex flex-col items-center mb-10"
            >
                <div className="h-16 w-16 rounded-2xl bg-linear-to-br from-brand-gold/20 to-brand-gold/5 border border-brand-gold/20 flex items-center justify-center mb-6 shadow-lg shadow-brand-gold/5">
                    <Sparkles className="h-7 w-7 text-brand-gold" />
                </div>
                <h1 className="font-serif text-3xl md:text-4xl font-medium text-brand-deep dark:text-brand-cream text-center mb-3">
                    Cloove Intelligence
                </h1>
                <p className="text-sm text-brand-deep/50 dark:text-brand-cream/50 text-center max-w-md leading-relaxed">
                    Your AI business analyst. Ask about sales, inventory, finances, or let me generate reports tailored to your operations.
                </p>
            </motion.div>

            {/* Suggestion Chips */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="w-full max-w-lg"
            >
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/30 text-center mb-4">
                    Suggested
                </p>
                <SuggestionChips
                    chips={welcomeSuggestions}
                    onSelect={onSuggestionSelect}
                    className="justify-center"
                />
            </motion.div>
        </div>
    )
}
