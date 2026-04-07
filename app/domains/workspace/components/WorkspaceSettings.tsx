"use client"

import { useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { Check, LayoutTemplate, Lock } from "lucide-react"
import { cn } from "@/app/lib/utils"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Switch } from "@/app/components/ui/switch"
import { useBusiness } from "@/app/components/BusinessProvider"
import {
    useSettings,
    useUpdateBusinessSettings,
} from "@/app/domains/business/hooks/useBusinessSettings"
import { useCurrentSubscription } from "@/app/domains/business/hooks/useBilling"
import {
    LAYOUT_PRESET_LIST,
    type LayoutPresetId,
} from "@/app/domains/workspace/nav/layout-presets"
import { PresetModuleRecommendations } from "@/app/domains/workspace/components/PresetModuleRecommendations"
import { Button } from "@/app/components/ui/button"
import { usePermission } from "@/app/hooks/usePermission"

type PlanFeatureToggleKey =
    | "hasExpenses"
    | "hasDebts"
    | "hasAdvancedAnalytics"
    | "hasApiAccess"
    | "canHaveCustomDomain"

type ModuleToggleKey =
    | "module_vendors"
    | "module_referrals"
    | "module_storefront"
    | "module_staff"
    | "module_expenses"
    | "module_debts"

const PLAN_FEATURE_ROWS: {
    key: PlanFeatureToggleKey
    title: string
    description: string
    group: string
}[] = [
        {
            key: "hasExpenses",
            title: "Expenses",
            description: "Record and track business expenses.",
            group: "Money",
        },
        {
            key: "hasDebts",
            title: "Debts & credit",
            description: "Customer credit and debt tracking.",
            group: "Money",
        },
        {
            key: "hasAdvancedAnalytics",
            title: "Advanced analytics",
            description: "Deeper reporting and insights.",
            group: "Insights",
        },
        {
            key: "hasApiAccess",
            title: "API access",
            description: "Programmatic access and integrations.",
            group: "Platform",
        },
        {
            key: "canHaveCustomDomain",
            title: "Custom domain",
            description: "Use your own domain on the storefront.",
            group: "Platform",
        },
    ]

const MODULE_ROWS: {
    key: ModuleToggleKey
    title: string
    description: string
    group: string
}[] = [
        {
            key: "module_expenses",
            title: "Expenses in navigation",
            description: "Show Expenses in the sidebar when your plan allows it.",
            group: "Navigation",
        },
        {
            key: "module_debts",
            title: "Debts in navigation",
            description: "Show Debts in the sidebar when your plan allows it.",
            group: "Navigation",
        },
        {
            key: "module_vendors",
            title: "Vendors",
            description: "Supplier and vendor management.",
            group: "Navigation",
        },
        {
            key: "module_storefront",
            title: "Storefront",
            description: "Online storefront and pages.",
            group: "Navigation",
        },
        {
            key: "module_staff",
            title: "Staff",
            description: "Team and permissions (also depends on your plan).",
            group: "Navigation",
        },
        {
            key: "module_referrals",
            title: "Refer & earn",
            description: "Referral program entry in the sidebar.",
            group: "Navigation",
        },
    ]

function parseFeatureFlags(raw: unknown): Record<string, boolean> {
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
        return raw as Record<string, boolean>
    }
    return {}
}

export function WorkspaceSettings() {
    const { data: settings, isLoading: settingsLoading } = useSettings()
    const { features, refreshBusinesses } = useBusiness()
    const { canUseStaffFeature } = usePermission()
    const updateSettings = useUpdateBusinessSettings()
    const { data: subData } = useCurrentSubscription()

    const benefits = useMemo(
        () => (subData?.currentPlan?.benefits || {}) as Record<string, boolean | number>,
        [subData?.currentPlan?.benefits]
    )

    const planAllows = useCallback(
        (key: PlanFeatureToggleKey) => {
            const v = benefits[key]
            if (typeof v === "boolean") return v
            if (typeof v === "number") return v > 0
            return false
        },
        [benefits]
    )

    const featureFlags = useMemo(
        () => parseFeatureFlags(settings?.business?.configs?.feature_flags),
        [settings?.business?.configs?.feature_flags]
    )

    const mergedFlags = featureFlags

    const currentPreset = (settings?.business?.configs?.ui_layout_preset as LayoutPresetId) || "default"

    const [pendingPreset, setPendingPreset] = useState<LayoutPresetId | null>(null)

    const effectiveOn = (key: string): boolean => {
        const v = features?.[key]
        return v === true
    }

    const setFeatureFlag = (key: string, value: boolean) => {
        const next = { ...mergedFlags, [key]: value }
        updateSettings.mutate(
            { feature_flags: next },
            {
                onSuccess: () => {
                    void refreshBusinesses()
                },
            }
        )
    }

    const setPlanFeatureOverride = (key: PlanFeatureToggleKey, value: boolean) => {
        if (!planAllows(key)) return
        setFeatureFlag(key, value)
    }

    const setModuleToggle = (key: ModuleToggleKey, value: boolean) => {
        setFeatureFlag(key, value)
    }

    const applyPreset = (id: LayoutPresetId) => {
        setPendingPreset(id)
        updateSettings.mutate(
            { ui_layout_preset: id },
            {
                onSuccess: () => {
                    setPendingPreset(null)
                    void refreshBusinesses()
                },
                onError: () => setPendingPreset(null),
            }
        )
    }

    const groupedPlan = useMemo(() => {
        const m = new Map<string, (typeof PLAN_FEATURE_ROWS)[number][]>()
        for (const row of PLAN_FEATURE_ROWS) {
            const g = row.group
            if (!m.has(g)) m.set(g, [])
            m.get(g)!.push(row)
        }
        return Array.from(m.entries())
    }, [])

    const groupedModule = useMemo(() => {
        const m = new Map<string, (typeof MODULE_ROWS)[number][]>()
        for (const row of MODULE_ROWS) {
            const g = row.group
            if (!m.has(g)) m.set(g, [])
            m.get(g)!.push(row)
        }
        return Array.from(m.entries())
    }, [])

    if (settingsLoading) {
        return (
            <div className="text-sm text-brand-deep/60 dark:text-brand-cream/60">Loading workspace…</div>
        )
    }

    return (
        <div className="space-y-10">
            <section className="space-y-4">
                <div className="flex items-start gap-3">
                    <LayoutTemplate className="h-6 w-6 text-brand-gold shrink-0 mt-0.5" />
                    <div>
                        <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream">
                            Business layout
                        </h2>
                        <p className="text-sm text-brand-deep/65 dark:text-brand-cream/65 mt-1">
                            Choose a navigation style tuned for your industry. You can change this anytime.
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 bg-brand-deep/5 dark:bg-white/5 rounded-3xl p-4">
                    {LAYOUT_PRESET_LIST.map((preset) => {
                        const selected = currentPreset === preset.id
                        const busy = updateSettings.isPending && pendingPreset === preset.id
                        return (
                            <button
                                key={preset.id}
                                type="button"
                                disabled={updateSettings.isPending}
                                onClick={() => {
                                    if (preset.id === currentPreset) return
                                    applyPreset(preset.id)
                                }}
                                className={cn(
                                    "text-left rounded-3xl cursor-pointer border p-4 transition-all",
                                    selected
                                        ? "border-brand-gold bg-brand-gold/10 dark:bg-brand-gold/5"
                                        : "border-brand-deep/10 dark:border-white/10 hover:border-brand-gold/40 bg-white/50 dark:bg-white/5"
                                )}
                            >
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <span className="font-semibold text-brand-deep dark:text-brand-cream">
                                        {preset.title}
                                    </span>
                                    {selected && (
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-gold text-brand-deep">
                                            <Check className="h-3.5 w-3.5" />
                                        </span>
                                    )}
                                    {busy && (
                                        <span className="text-xs text-brand-deep/50">Saving…</span>
                                    )}
                                </div>
                                <p className="text-sm text-brand-deep/65 dark:text-brand-cream/65">
                                    {preset.description}
                                </p>
                            </button>
                        )
                    })}
                </div>
            </section>

            <PresetModuleRecommendations
                currentPreset={currentPreset}
                mergedFlags={mergedFlags}
                planAllowsExpenses={planAllows("hasExpenses")}
                planAllowsDebts={planAllows("hasDebts")}
                canUseStaff={canUseStaffFeature()}
                updatePending={updateSettings.isPending}
                onToggle={setModuleToggle}
            />

            {currentPreset === "school" ? (
                <section className="space-y-3">
                    <GlassCard className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all duration-300">
                        <div>
                            <h3 className="font-serif text-base font-medium text-brand-deep dark:text-brand-cream tracking-tight">
                                Years & terms
                            </h3>
                            <p className="text-sm text-brand-deep/65 dark:text-brand-cream/65 mt-1 max-w-xl">
                                Add academic sessions and terms, set the default fee period, and keep fee collections
                                aligned with your school calendar.
                            </p>
                        </div>
                        <Button asChild variant="secondary" className="rounded-full shrink-0">
                            <Link href="/school/calendar">Open school calendar</Link>
                        </Button>
                    </GlassCard>
                </section>
            ) : null}

            <section className="space-y-4">
                <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream pl-1">
                    Plan features
                </h2>
                <p className="text-sm text-brand-deep/65 dark:text-brand-cream/65 pl-1 max-w-2xl">
                    Turn modules on or off for your team. Items that are not included in your subscription stay
                    locked until you upgrade.
                </p>

                {groupedPlan.map(([group, rows]) => (
                    <div key={group} className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-deep/45 dark:text-brand-cream/45 px-1">
                            {group}
                        </h3>
                        <GlassCard className="divide-y divide-brand-deep/5 dark:divide-white/5">
                            {rows.map((row) => {
                                const allowed = planAllows(row.key)
                                const on = allowed && effectiveOn(row.key)
                                return (
                                    <div
                                        key={row.key}
                                        className="flex items-start justify-between gap-4 p-4 sm:p-5"
                                    >
                                        <div className="min-w-0 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-brand-deep dark:text-brand-cream">
                                                    {row.title}
                                                </span>
                                                {!allowed && (
                                                    <Lock className="h-3.5 w-3.5 text-brand-deep/40 dark:text-brand-cream/40" />
                                                )}
                                            </div>
                                            <p className="text-sm text-brand-deep/60 dark:text-brand-cream/60">
                                                {row.description}
                                            </p>
                                            {!allowed && (
                                                <Button variant="link" className="h-auto p-0 text-brand-gold" asChild>
                                                    <Link href="/settings?tab=billing">View plans</Link>
                                                </Button>
                                            )}
                                        </div>
                                        <Switch
                                            checked={on}
                                            disabled={!allowed || updateSettings.isPending}
                                            onCheckedChange={(v) => setPlanFeatureOverride(row.key, v)}
                                            aria-label={row.title}
                                        />
                                    </div>
                                )
                            })}
                        </GlassCard>
                    </div>
                ))}
            </section>

            <section className="space-y-4">
                <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream pl-1">
                    Navigation & visibility
                </h2>
                <p className="text-sm text-brand-deep/65 dark:text-brand-cream/65 pl-1 max-w-2xl">
                    Hide sections you do not need right now. Plan-gated items still require the right subscription.
                </p>

                {groupedModule.map(([group, rows]) => (
                    <div key={group} className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-deep/45 dark:text-brand-cream/45 px-1">
                            {group}
                        </h3>
                        <GlassCard className="divide-y divide-brand-deep/5 dark:divide-white/5">
                            {rows.map((row) => {
                                const on = mergedFlags[row.key] !== false

                                const planBlocked =
                                    (row.key === "module_expenses" && !planAllows("hasExpenses")) ||
                                    (row.key === "module_debts" && !planAllows("hasDebts")) ||
                                    (row.key === "module_staff" && !canUseStaffFeature())

                                return (
                                    <div
                                        key={row.key}
                                        className="flex items-start justify-between gap-4 p-4 sm:p-5"
                                    >
                                        <div className="min-w-0 space-y-1">
                                            <span className="font-medium text-brand-deep dark:text-brand-cream">
                                                {row.title}
                                            </span>
                                            <p className="text-sm text-brand-deep/60 dark:text-brand-cream/60">
                                                {row.description}
                                            </p>
                                            {planBlocked && (
                                                <p className="text-xs text-amber-600 dark:text-amber-400/90">
                                                    Requires the related plan feature above.
                                                </p>
                                            )}
                                        </div>
                                        <Switch
                                            checked={on}
                                            disabled={planBlocked || updateSettings.isPending}
                                            onCheckedChange={(v) => setModuleToggle(row.key, v)}
                                            aria-label={row.title}
                                        />
                                    </div>
                                )
                            })}
                        </GlassCard>
                    </div>
                ))}
            </section>
        </div>
    )
}
