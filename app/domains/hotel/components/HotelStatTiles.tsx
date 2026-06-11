"use client";

import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { GlassCard } from "@/app/components/ui/glass-card";
import { cn } from "@/app/lib/utils";
import type { DotBadgeTone } from "@/app/components/ui/dot-badge";
import { TONE_SURFACE } from "../constants";

export interface HotelStat {
  label: string;
  value: number | string;
  helper?: string;
  icon: IconSvgElement;
  tone?: DotBadgeTone;
}

/**
 * Overview metric tiles. Scrolls horizontally on mobile, settles into a
 * four-up grid on desktop - the same surface treatment as the restaurant live
 * board so the hotel front desk reads as part of the same system.
 */
export function HotelStatTiles({ stats }: { stats: HotelStat[] }) {
  return (
    <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1 lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0">
      {stats.map((stat) => {
        const surface = TONE_SURFACE[stat.tone ?? "neutral"];
        return (
          <GlassCard
            key={stat.label}
            className="min-w-[210px] shrink-0 rounded-[1.6rem] p-1 lg:min-w-0"
          >
            <div className="rounded-[1.2rem] bg-white/80 p-4 dark:bg-transparent">
              <div
                className={cn(
                  "mb-3 flex h-9 w-9 items-center justify-center rounded-xl",
                  surface.bg,
                  surface.accent,
                )}
              >
                <HugeiconsIcon icon={stat.icon} className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold tracking-tight text-brand-deep dark:text-brand-cream">
                {stat.value}
              </p>
              <p className="text-sm font-medium text-brand-deep/80 dark:text-brand-cream/80">
                {stat.label}
              </p>
              {stat.helper && (
                <p className="mt-0.5 text-xs text-brand-accent/50 dark:text-brand-cream/40">
                  {stat.helper}
                </p>
              )}
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}
