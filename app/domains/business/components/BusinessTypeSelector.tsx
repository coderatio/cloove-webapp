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
        description: 'A sole trader, freelancer, or informal business. Verification requires a BVN at minimum.',
        Icon: User,
    },
    {
        type: 'REGISTERED' as BusinessType,
        label: 'Registered Business',
        description: 'A formally registered company (LLC, Ltd, etc.). Requires BVN and registration documents (CAC, MERMAT, Status Report).',
        Icon: Building2,
    },
]

export function BusinessTypeSelector({ value, onChange }: BusinessTypeSelectorProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl mx-auto">
            {options.map(({ type, label, description, Icon }) => {
                const isSelected = value === type
                return (
                    <motion.button
                        key={type}
                        type="button"
                        onClick={() => onChange(type)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                            "relative text-left rounded-2xl border-2 p-6 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50 cursor-pointer",
                            isSelected
                                ? "border-brand-gold bg-brand-gold/10 shadow-lg shadow-brand-gold/10"
                                : "border-brand-deep/10 dark:border-white/10 bg-white dark:bg-white/5 hover:border-brand-gold/40"
                        )}
                    >
                        {isSelected && (
                            <motion.span
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="absolute top-4 right-4 w-5 h-5 rounded-full bg-brand-gold flex items-center justify-center"
                            >
                                <Check className="h-3 w-3 text-brand-deep" strokeWidth={3} />
                            </motion.span>
                        )}
                        <Icon className={cn(
                            "h-8 w-8 mb-3",
                            isSelected ? "text-brand-gold" : "text-brand-deep/40 dark:text-brand-cream/40"
                        )} />
                        <p className={cn(
                            "font-semibold text-sm mb-1",
                            isSelected ? "text-brand-deep dark:text-brand-cream" : "text-brand-deep/70 dark:text-brand-cream/70"
                        )}>
                            {label}
                        </p>
                        <p className="text-xs text-brand-accent/60 dark:text-brand-cream/50 leading-relaxed">
                            {description}
                        </p>
                    </motion.button>
                )
            })}
        </div>
    )
}
