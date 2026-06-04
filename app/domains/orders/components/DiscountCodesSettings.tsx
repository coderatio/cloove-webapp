"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { BadgePercentIcon as BadgePercent } from "@hugeicons/core-free-icons"
import { ManagementHeader } from "@/app/components/shared/ManagementHeader"
import { PageTransition } from "@/app/components/layout/page-transition"
import { GlassCard } from "@/app/components/ui/glass-card"
import { usePermission } from "@/app/hooks/usePermission"
import { DiscountCodesManager } from "./DiscountCodesManager"

export function DiscountCodesSettings() {
    const { can } = usePermission()
    const canManage = can("MANAGE_STORES")

    return (
        <PageTransition>
            <div className="mx-auto max-w-6xl space-y-6 pb-24">
                <ManagementHeader
                    title="Discount Codes"
                    description="Create and manage business-wide codes customers can apply before payment."
                    extraActions={
                        <div className="hidden items-center gap-2 rounded-full border border-brand-deep/10 bg-white/70 px-3 py-2 text-xs font-semibold text-brand-accent/60 dark:border-white/10 dark:bg-white/5 dark:text-white/45 sm:inline-flex">
                            <HugeiconsIcon icon={BadgePercent} className="h-4 w-4 text-brand-gold" />
                            WhatsApp checkout ready
                        </div>
                    }
                />

                {!canManage ? (
                    <GlassCard className="border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-200">
                        You can view discount codes, but you need store management permission to create, edit, or delete them.
                    </GlassCard>
                ) : null}

                <DiscountCodesManager canManage={canManage} />
            </div>
        </PageTransition>
    )
}
