"use client"

import { Lightbulb } from "lucide-react"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Switch } from "@/app/components/ui/switch"
import type { LayoutPresetId } from "@/app/domains/workspace/nav/layout-presets"
import {
    getRecommendedModuleRows,
    getRecommendedModulesForPreset,
} from "@/app/domains/workspace/nav/preset-modules"
import type { ModuleFeatureKey } from "@/app/domains/workspace/nav/nav-definitions"

interface PresetModuleRecommendationsProps {
    currentPreset: LayoutPresetId
    mergedFlags: Record<string, boolean>
    planAllowsExpenses: boolean
    planAllowsDebts: boolean
    canUseStaff: boolean
    updatePending: boolean
    onToggle: (key: ModuleFeatureKey, value: boolean) => void
}

export function PresetModuleRecommendations({
    currentPreset,
    mergedFlags,
    planAllowsExpenses,
    planAllowsDebts,
    canUseStaff,
    updatePending,
    onToggle,
}: PresetModuleRecommendationsProps) {
    const keys = getRecommendedModulesForPreset(currentPreset)
    const rows = getRecommendedModuleRows(keys).filter((row) => {
        if (row.key === "module_expenses" && !planAllowsExpenses) return false
        if (row.key === "module_debts" && !planAllowsDebts) return false
        if (row.key === "module_staff" && !canUseStaff) return false
        return true
    })

    const hiddenRecommended = rows.filter((row) => mergedFlags[row.key] === false)
    if (hiddenRecommended.length === 0) return null

    return (
        <section className="space-y-4">
            <div className="flex items-start gap-3">
                <Lightbulb className="h-6 w-6 text-brand-gold shrink-0 mt-0.5" />
                <div>
                    <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream">
                        Recommended for your layout
                    </h2>
                    <p className="text-sm text-brand-deep/65 dark:text-brand-cream/65 mt-1 max-w-2xl">
                        These modules match your selected industry preset and how many Nigerian and African SMBs
                        run daily—turn them on when you are ready. You can still toggle navigation anytime.
                    </p>
                </div>
            </div>
            <GlassCard className="divide-y divide-brand-deep/5 dark:divide-white/5">
                {hiddenRecommended.map((row) => (
                    <div key={row.key} className="flex items-start justify-between gap-4 p-4 sm:p-5">
                        <div className="min-w-0 space-y-1">
                            <span className="font-medium text-brand-deep dark:text-brand-cream">{row.title}</span>
                            <p className="text-sm text-brand-deep/60 dark:text-brand-cream/60">{row.description}</p>
                        </div>
                        <Switch
                            checked={mergedFlags[row.key] !== false}
                            disabled={updatePending}
                            onCheckedChange={(v) => onToggle(row.key, v)}
                            aria-label={row.title}
                        />
                    </div>
                ))}
            </GlassCard>
        </section>
    )
}
