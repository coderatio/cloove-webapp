"use client"

import { motion } from "framer-motion"
import { AlertCircle } from "lucide-react"
import Link from "next/link"
import { cn } from "@/app/lib/utils"
import { GlassCard } from "../ui/glass-card"

interface ActionItem {
    label: string
    count: number
    type: 'urgent' | 'warning' | 'info'
    href: string
    icon?: React.ReactNode
}

interface ActionRowProps {
    items: ActionItem[]
    className?: string
}

export function ActionRow({ items, className }: ActionRowProps) {
    return (
        <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
            {items.map((item, index) => (
                <motion.div
                    key={item.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + (index * 0.1) }}
                >
                    <Link href={item.href} className="block h-full">
                        <GlassCard className={cn(
                            "rounded-[32px] p-4 md:p-5 h-full transition-all group",
                            item.type === 'urgent' && "border-danger/20 hover:border-danger/40 dark:bg-red-500/5",
                            item.type === 'warning' && "border-warning/20 hover:border-warning/40 dark:bg-amber-500/5",
                            item.type === 'info' && "border-brand-border/50 hover:border-brand-green/30",
                            className
                        )} hoverEffect>
                            <div className="flex items-start justify-between mb-3">
                                <span className={cn(
                                    "p-2 rounded-xl",
                                    item.type === 'urgent' && "bg-danger/10 text-danger dark:bg-danger/20 dark:text-red-400",
                                    item.type === 'warning' && "bg-warning/10 text-warning dark:bg-warning/20 dark:text-amber-400",
                                    item.type === 'info' && "bg-brand-green/10 text-brand-green dark:bg-brand-green/20 dark:text-brand-cream"
                                )}>
                                    {item.icon || <AlertCircle className="w-4 h-4" />}
                                </span>
                                <span className="font-serif text-2xl font-medium text-brand-deep dark:text-brand-cream">
                                    {item.count}
                                </span>
                            </div>
                            <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground dark:text-brand-cream/70 dark:group-hover:text-brand-cream transition-colors">
                                {item.label}
                            </p>
                        </GlassCard>
                    </Link>
                </motion.div>
            ))}
        </div>
    )
}
