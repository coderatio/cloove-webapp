"use client"

import { motion } from "framer-motion"
import { User, Building2, Check } from "lucide-react"
import { cn } from "@/app/lib/utils"

export type BusinessType = 'INDIVIDUAL' | 'REGISTERED'

interface BusinessTypeSelectorProps {
    value: BusinessType | null
    onChange: (type: BusinessType) => void
}

const options = [
    {
        type: 'INDIVIDUAL' as BusinessType,
        label: 'Individual / Unregistered',
        description: 'A sole trader, freelancer, or informal business.',
        requirements: 'Verification requires a BVN at minimum.',
        Icon: User,
    },
    {
        type: 'REGISTERED' as BusinessType,
        label: 'Registered Business',
        description: 'A formally registered company (LLC, Ltd, etc.).',
        requirements: 'Requires BVN and registration documents (CAC, MERMAT, Status Report).',
        Icon: Building2,
    },
]

export function BusinessTypeSelector({ value, onChange }: BusinessTypeSelectorProps) {
    return (
        <div className="grid grid-cols-1 gap-4 w-full">
            {options.map(({ type, label, description, requirements, Icon }) => {
                const isSelected = value === type
                return (
                    <motion.button
                        key={type}
                        type="button"
                        onClick={() => onChange(type)}
                        whileHover={{ y: -5, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                            "relative text-left rounded-3xl p-6 transition-all duration-500 outline-none cursor-pointer overflow-hidden group border flex items-center gap-6",
                            isSelected
                                ? "border-brand-gold bg-brand-gold/[0.08] shadow-[0_20px_50px_rgba(212,175,55,0.15)] ring-1 ring-brand-gold/30"
                                : "border-brand-deep/5 dark:border-white/5 bg-white/50 dark:bg-white/[0.02] hover:border-brand-gold/30 hover:bg-white/80 dark:hover:bg-white/[0.04]"
                        )}
                    >
                        {/* Interactive Sparkle Effect on Selection */}
                        {isSelected && (
                            <motion.div
                                layoutId="selection-glow"
                                className="absolute inset-0 bg-gradient-to-tr from-brand-gold/10 via-transparent to-transparent opacity-50"
                            />
                        )}

                        <div className={cn(
                            "relative z-10 w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center transition-all duration-500",
                            isSelected
                                ? "bg-brand-gold text-brand-deep shadow-lg shadow-brand-gold/20 rotate-0"
                                : "bg-brand-green/10 text-brand-green dark:text-brand-gold/60 group-hover:bg-brand-gold/20 group-hover:rotate-6"
                        )}>
                            <Icon className="h-8 w-8" />
                        </div>

                        <div className="relative z-10 space-y-1.5">
                            <div className="flex items-center gap-2">
                                <h3 className={cn(
                                    "font-serif text-lg leading-tight transition-colors duration-300",
                                    isSelected ? "text-brand-deep dark:text-brand-cream" : "text-brand-deep/80 dark:text-brand-cream/80"
                                )}>
                                    {label}
                                </h3>
                                {isSelected && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-1.5 h-1.5 rounded-full bg-brand-gold"
                                    />
                                )}
                            </div>

                            <p className="text-xs text-brand-accent/60 dark:text-brand-cream/50 leading-relaxed font-sans max-w-full">
                                {description}
                                <br />
                                {requirements}
                            </p>
                        </div>

                        {/* Hover Border Gradient */}
                        {!isSelected && (
                            <div className="absolute inset-0 border border-transparent group-hover:border-brand-gold/20 rounded-3xl pointer-events-none transition-colors duration-500" />
                        )}
                    </motion.button>
                )
            })}
        </div>
    )
}
