"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { AlertCircleIcon as AlertCircle } from "@hugeicons/core-free-icons"
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
                <div key={`${item.label}-${index}`}>
                    <Link href={item.href} className="block h-full">
                        <GlassCard className={cn(
                            "h-full rounded-3xl p-4 md:p-5",
                            item.type === 'urgent' && "border-red-200 dark:border-red-900/40",
                            item.type === 'warning' && "border-amber-200 dark:border-amber-900/40",
                            item.type === 'info' && "border-border",
                            className
                        )} hoverEffect>
                            <div className="flex items-start justify-between mb-3">
                                <span className={cn(
                                    "rounded-xl border p-2",
                                    item.type === 'urgent' && "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300",
                                    item.type === 'warning' && "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300",
                                    item.type === 'info' && "border-border bg-muted text-foreground"
                                )}>
                                    {item.icon || <HugeiconsIcon icon={AlertCircle} className="w-4 h-4" />}
                                </span>
                                <span className="text-2xl font-semibold tracking-tight text-foreground">
                                    {item.count}
                                </span>
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">
                                {item.label}
                            </p>
                        </GlassCard>
                    </Link>
                </div>
            ))}
        </div>
    )
}
