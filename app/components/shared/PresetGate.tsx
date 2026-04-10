"use client"

import * as React from "react"
import Link from "next/link"
import {
  ChefHat,
  ShoppingCart,
  Pill,
  GraduationCap,
  LayoutDashboard,
} from "lucide-react"
import { PageTransition } from "@/app/components/layout/page-transition"
import { Button } from "@/app/components/ui/button"
import { GlassCard } from "@/app/components/ui/glass-card"
import { useLayoutPresetId } from "@/app/domains/workspace/hooks/usePresetPageCopy"
import { LAYOUT_PRESETS, type LayoutPresetId } from "@/app/domains/workspace/nav/layout-presets"

const PRESET_ICONS: Record<LayoutPresetId, React.ElementType> = {
  default: LayoutDashboard,
  restaurant: ChefHat,
  retail: ShoppingCart,
  pharmacy: Pill,
  school: GraduationCap,
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
  const resolvedIcon = icon ?? <Icon className="h-5 w-5" />
  const resolvedAction = action ?? (
    <Button asChild className="rounded-full transition-all duration-300">
      <Link href="/settings?tab=workspace">Open workspace settings</Link>
    </Button>
  )

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto space-y-6 pb-24">
        {featureLabel && (
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] font-black text-brand-accent/40 dark:text-brand-cream/40 mb-1.5">
              {presetDef.title}
            </p>
            <h1 className="text-3xl md:text-4xl font-serif tracking-tight text-brand-deep dark:text-brand-cream">
              {featureLabel}
            </h1>
            <p className="text-sm text-brand-accent/60 dark:text-brand-cream/60 mt-1.5 max-w-xl">
              {featureLabel} are available when your workspace uses the {presetDef.title} layout.
            </p>
          </div>
        )}

        <GlassCard className="overflow-hidden border-brand-gold/15 bg-linear-to-br from-white/60 to-brand-gold/[0.04] dark:from-white/[0.06] dark:to-brand-gold/[0.03]">
          <div className="border-b border-brand-deep/5 px-4 py-4 dark:border-white/10 md:px-6 md:py-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-gold">
                {resolvedIcon}
              </div>
              <div className="min-w-0">
                <h2 className="font-serif text-lg text-brand-deep dark:text-brand-cream">
                  {resolvedTitle}
                </h2>
                <p className="mt-1 text-sm text-brand-deep/65 dark:text-brand-cream/65 max-w-xl">
                  {resolvedDescription}
                </p>
              </div>
            </div>
          </div>
          <div className="px-4 py-5 md:px-6 md:py-6 space-y-4">
            <p className="text-sm text-brand-deep/80 dark:text-brand-cream/85 leading-relaxed">
              Go to{" "}
              <strong className="font-medium text-brand-deep dark:text-brand-cream">
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
