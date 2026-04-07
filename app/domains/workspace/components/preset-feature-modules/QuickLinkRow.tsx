"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/app/lib/utils"

export interface QuickLinkItem {
    href: string
    label: string
    icon: LucideIcon
    /** When false, link is not rendered */
    show?: boolean
}

export function QuickLinkRow({ items, className }: { items: QuickLinkItem[]; className?: string }) {
    const visible = items.filter((i) => i.show !== false)
    if (visible.length === 0) return null

    return (
        <ul className={cn("grid gap-2 sm:grid-cols-2 lg:grid-cols-3", className)}>
            {visible.map((item) => (
                <li key={item.href + item.label}>
                    <Link
                        href={item.href}
                        className="group flex items-center justify-between gap-2 rounded-xl border border-brand-deep/8 bg-white/50 px-3 py-2.5 text-sm font-medium text-brand-deep transition-colors hover:border-brand-gold/30 hover:bg-brand-gold/5 dark:border-white/10 dark:bg-white/5 dark:text-brand-cream dark:hover:bg-white/10"
                    >
                        <span className="flex min-w-0 items-center gap-2">
                            <item.icon className="h-4 w-4 shrink-0 text-brand-gold opacity-80" />
                            <span className="truncate">{item.label}</span>
                        </span>
                        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 opacity-40 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>
                </li>
            ))}
        </ul>
    )
}
