"use client"

import Link from "next/link"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Button } from "@/app/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { ZapIcon as Zap, CrownIcon as Crown, ArrowRight01Icon as ArrowRight } from "@hugeicons/core-free-icons"

interface UpgradePromptProps {
    title?: string
    description?: string
    icon?: 'limit' | 'plan'
}

export function UpgradePrompt({
    title = "Upgrade your plan",
    description = "You've reached the limit for this feature on your current plan. Upgrade to a higher plan to unlock more.",
    icon = 'plan'
}: UpgradePromptProps) {
    return (
        <GlassCard className="p-8 text-center max-w-md mx-auto my-8 border-dashed border-2 border-primary/20">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                {icon === 'plan' ? (
                    <HugeiconsIcon icon={Crown} className="w-8 h-8 text-primary" />
                ) : (
                    <HugeiconsIcon icon={Zap} className="w-8 h-8 text-primary" />
                )}
            </div>

            <h3 className="text-xl font-bold text-primary mb-3">{title}</h3>
            <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
                {description}
            </p>

            <div className="flex flex-col gap-3">
                <Button asChild className="w-full py-6 text-base font-semibold shadow-lg shadow-primary/20 group">
                    <Link href="/settings/billing">
                        Upgrade Now
                        <HugeiconsIcon icon={ArrowRight} className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                </Button>

                <Button variant="ghost" asChild className="text-xs text-muted-foreground">
                    <Link href="/settings/billing">View Plans & Pricing</Link>
                </Button>
            </div>
        </GlassCard>
    )
}
