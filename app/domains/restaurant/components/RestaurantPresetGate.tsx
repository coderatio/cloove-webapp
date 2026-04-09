"use client"

import * as React from "react"
import Link from "next/link"
import { ChefHat } from "lucide-react"
import { PageTransition } from "@/app/components/layout/page-transition"
import { Button } from "@/app/components/ui/button"
import { GlassCard } from "@/app/components/ui/glass-card"
import { useLayoutPresetId } from "@/app/domains/workspace/hooks/usePresetPageCopy"

type RestaurantPresetGateProps = {
  children: React.ReactNode
  featureLabel?: string
}

export function RestaurantPresetGate({
  children,
  featureLabel = "Restaurant features",
}: RestaurantPresetGateProps) {
  const preset = useLayoutPresetId()

  if (preset !== "restaurant") {
    return (
      <PageTransition>
        <div className="max-w-5xl mx-auto space-y-6 pb-24">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] font-black text-brand-accent/40 dark:text-brand-cream/40 mb-1.5">
              Restaurant
            </p>
            <h1 className="text-3xl md:text-4xl font-serif tracking-tight text-brand-deep dark:text-brand-cream">
              {featureLabel}
            </h1>
            <p className="text-sm text-brand-accent/60 dark:text-brand-cream/60 mt-1.5 max-w-xl">
              {featureLabel} are available when your workspace uses the Restaurant layout.
            </p>
          </div>

          <GlassCard className="overflow-hidden border-brand-gold/15 bg-linear-to-br from-white/60 to-brand-gold/[0.04] dark:from-white/[0.06] dark:to-brand-gold/[0.03]">
            <div className="border-b border-brand-deep/5 px-4 py-4 dark:border-white/10 md:px-6 md:py-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-gold">
                  <ChefHat className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-serif text-lg text-brand-deep dark:text-brand-cream">
                    Switch to Restaurant
                  </h2>
                  <p className="mt-1 text-sm text-brand-deep/65 dark:text-brand-cream/65 max-w-xl">
                    Enable the Restaurant layout to unlock live boards, tables, and kitchen workflows for service
                    teams.
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
                and choose <strong>Restaurant</strong>.
              </p>
              <Button asChild className="rounded-full transition-all duration-300">
                <Link href="/settings?tab=workspace">Open workspace settings</Link>
              </Button>
            </div>
          </GlassCard>
        </div>
      </PageTransition>
    )
  }

  return <>{children}</>
}
