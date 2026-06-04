"use client"

import type { ReactNode } from "react"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Markdown } from "@/app/components/ui/markdown"
import { cn } from "@/app/lib/utils"

interface ModuleShellProps {
    icon: IconSvgElement
    title: string
    subtitle?: string
    children: ReactNode
    /** Optional preset copy footer (markdown) */
    footerMarkdown?: string
    className?: string
}

export function ModuleShell({ icon: Icon, title, subtitle, children, footerMarkdown, className }: ModuleShellProps) {
    return (
        <GlassCard
            className={cn(
                "overflow-hidden border-brand-gold/15 bg-linear-to-br from-white/60 to-brand-gold/[0.04] dark:from-white/[0.06] dark:to-brand-gold/[0.03]",
                className
            )}
        >
            <div className="border-b border-brand-deep/5 px-4 py-3 dark:border-white/10 md:px-5 md:py-4">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-gold">
                        <HugeiconsIcon icon={Icon} className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                        {subtitle ? (
                            <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
                        ) : null}
                    </div>
                </div>
            </div>
            <div className="px-4 py-4 md:px-5 md:py-5">{children}</div>
            {footerMarkdown?.trim() ? (
                <div className="border-t border-brand-deep/5 px-4 py-3 text-xs leading-relaxed text-muted-foreground dark:border-white/10 md:px-5">
                    <Markdown content={footerMarkdown} />
                </div>
            ) : null}
        </GlassCard>
    )
}
