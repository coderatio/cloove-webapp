"use client"

import * as React from "react"
import { storage, STORAGE_KEYS } from "@/app/lib/storage"

const DEFAULT_INTERVAL = "5"

export type RefreshIntervalValue = "0" | "5" | "10" | "30" | "60"

export function useRestaurantRefreshInterval() {
  const [value, setValue] = React.useState<RefreshIntervalValue>(DEFAULT_INTERVAL)

  React.useEffect(() => {
    if (typeof window === "undefined") return
    const stored = storage.get(STORAGE_KEYS.RESTAURANT_REFRESH_INTERVAL) as RefreshIntervalValue | null
    if (stored) setValue(stored)
  }, [])

  const update = React.useCallback((next: RefreshIntervalValue) => {
    setValue(next)
    if (typeof window !== "undefined") {
      storage.set(STORAGE_KEYS.RESTAURANT_REFRESH_INTERVAL, next)
      window.dispatchEvent(new CustomEvent("restaurant-refresh-interval", { detail: next }))
    }
  }, [])

  React.useEffect(() => {
    if (typeof window === "undefined") return
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail as RefreshIntervalValue | undefined
      if (detail && detail !== value) setValue(detail)
    }
    window.addEventListener("restaurant-refresh-interval", handler as EventListener)
    return () => window.removeEventListener("restaurant-refresh-interval", handler as EventListener)
  }, [value])

  const intervalMs =
    value === "0" ? false : Number(value) * 1000

  return {
    value,
    setValue: update,
    intervalMs,
  }
}
