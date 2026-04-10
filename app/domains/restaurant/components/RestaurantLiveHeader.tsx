"use client"

import { useRestaurantRefreshInterval } from "@/app/domains/restaurant/hooks/useRestaurantRefreshInterval"

function formatRefresh(value: string) {
  if (value === "0") return "auto-refresh off"
  return `updated every ${value} seconds`
}

export function RestaurantLiveHeader() {
  const { value } = useRestaurantRefreshInterval()

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.25em] font-black text-brand-accent/40 dark:text-brand-cream/40 mb-1.5">
        Restaurant
      </p>
      <h1 className="text-3xl md:text-4xl font-serif tracking-tight text-brand-deep dark:text-brand-cream">
        Live Board
      </h1>
      <p className="text-sm text-brand-accent/60 dark:text-brand-cream/60 mt-1.5 max-w-md">
        All table sessions, floor activity, and kitchen ticket flow — {formatRefresh(value)}.
      </p>
    </div>
  )
}
