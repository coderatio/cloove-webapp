"use client"

import { GlassCard } from "@/app/components/ui/glass-card"
import { useLayoutPresetId, usePresetPageCopy } from "@/app/domains/workspace/hooks/usePresetPageCopy"
import { usePermission } from "@/app/hooks/usePermission"
import { QuickLinkRow } from "./QuickLinkRow"
import { ScanBarcode, ShoppingBag, Package, Pill, Users, GraduationCap, UtensilsCrossed, Banknote, CalendarRange } from "lucide-react"

/**
 * Secondary preset module on the orders workspace: fast paths without replacing the main table.
 */
export function PresetOrdersQuickStrip() {
  const presetId = useLayoutPresetId()
  const pageCopy = usePresetPageCopy()
  const { can } = usePermission()
  const oui = pageCopy.ordersUi

  if (presetId === "default") return null

  const common = { show: can("VIEW_SALES") }

  const items =
    presetId === "retail"
      ? [
        { href: "/orders/sale", label: oui.recordSale, icon: ScanBarcode, ...common },
        { href: "/inventory", label: pageCopy.inventory.title, icon: Package, show: can("VIEW_PRODUCTS") },
        { href: "/finance", label: pageCopy.finance.title, icon: Banknote, show: can("VIEW_FINANCIALS") },
      ]
      : presetId === "pharmacy"
        ? [
          { href: "/orders/sale", label: oui.recordSale, icon: Pill, ...common },
          { href: "/inventory", label: pageCopy.inventory.title, icon: Package, show: can("VIEW_PRODUCTS") },
          { href: "/customers", label: pageCopy.customers.title, icon: Users, ...common },
        ]
        : presetId === "school"
          ? [
            { href: "/customers", label: pageCopy.customers.title, icon: GraduationCap, ...common },
            { href: "/school/calendar", label: "Years & terms", icon: CalendarRange, ...common },
            { href: "/inventory", label: pageCopy.inventory.title, icon: Package, show: can("VIEW_PRODUCTS") },
          ]
          : presetId === "restaurant"
            ? [
              { href: "/orders/sale", label: oui.recordSale, icon: UtensilsCrossed, ...common },
              { href: "/customers", label: pageCopy.customers.title, icon: Users, ...common },
              { href: "/inventory", label: pageCopy.inventory.title, icon: Package, show: can("VIEW_PRODUCTS") },
            ]
            : []

  if (items.length === 0) return null

  return (
    <GlassCard className="border-brand-gold/15 bg-white/40 p-4 dark:bg-white/4 rounded-3xl before:rounded-3xl">
      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-brand-deep/45 dark:text-brand-cream/45">
        Preset shortcuts
      </p>
      <QuickLinkRow items={items} className="grid-cols-1! sm:grid-cols-3!" />
    </GlassCard>
  )
}
