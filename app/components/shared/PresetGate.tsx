"use client"

import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { ChefHatIcon as ChefHat, ShoppingCart01Icon as ShoppingCart, PillIcon as Pill, GraduationCapIcon as GraduationCap, DashboardSquare01Icon as LayoutDashboard, Building02Icon as Building2 } from "@hugeicons/core-free-icons"
import { PageTransition } from "@/app/components/layout/page-transition"
import { Button } from "@/app/components/ui/button"
import { GlassCard } from "@/app/components/ui/glass-card"
import { useLayoutPresetId } from "@/app/domains/workspace/hooks/usePresetPageCopy"
import { LAYOUT_PRESETS, type LayoutPresetId } from "@/app/domains/workspace/nav/layout-presets"

const PRESET_ICONS: Record<LayoutPresetId, IconSvgElement> = {
  default: LayoutDashboard,
  restaurant: ChefHat,
  retail: ShoppingCart,
  pharmacy: Pill,
  school: GraduationCap,
  hotel: Building2,
}

type PresetGateProps = {
  /** The preset required to view the gated content */
  preset: LayoutPresetId
  /** Label for the feature being gated — shown in the page heading */
  featureLabel?: string
  // --- Slots: all optional, fall back to preset-derived defaults ---
  /** Override the icon shown in the card */
  icon?: React.ReactNode
  /** Override the card title */
  title?: string
  /** Override the card description */
  description?: string
  /** Override the entire action area */
  action?: React.ReactNode
  children: React.ReactNode
}

export function PresetGate({
  preset,
  featureLabel,
  icon,
  title,
  description,
  action,
  children,
}: PresetGateProps) {
  const current = useLayoutPresetId()

  if (current === preset) return <>{children}</>

  const presetDef = LAYOUT_PRESETS[preset]
  const Icon = PRESET_ICONS[preset]

  const resolvedTitle = title ?? `Switch to ${presetDef.title}`
  const resolvedDescription =
    description ??
    `Enable the ${presetDef.title} layout to access ${featureLabel ?? "this feature"}.`
  const resolvedIcon = icon ?? <HugeiconsIcon icon={Icon} className="h-5 w-5" />
  const resolvedAction = action ?? (
    <Button asChild className="rounded-full transition-all duration-300">
      <Link href="/settings?tab=workspace">Open workspace settings</Link>
    </Button>
  )

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto space-y-6 pb-24">
        {featureLabel && (
          <div>
            <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">
              {presetDef.title}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              {featureLabel}
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
              {featureLabel} are available when your workspace uses the {presetDef.title} layout.
            </p>
          </div>
        )}

        <GlassCard className="overflow-hidden border-brand-gold/15 bg-linear-to-br from-white/60 to-brand-gold/[0.04] dark:from-white/[0.06] dark:to-brand-gold/[0.03]">
          <div className="border-b border-border px-4 py-4 md:px-6 md:py-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-gold">
                {resolvedIcon}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-foreground">
                  {resolvedTitle}
                </h2>
                <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                  {resolvedDescription}
                </p>
              </div>
            </div>
          </div>
          <div className="px-4 py-5 md:px-6 md:py-6 space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Go to{" "}
              <strong className="font-medium text-foreground">
                Settings → Workspace
              </strong>{" "}
              and choose <strong>{presetDef.title}</strong>.
            </p>
            {resolvedAction}
          </div>
        </GlassCard>
      </div>
    </PageTransition>
  )
}
