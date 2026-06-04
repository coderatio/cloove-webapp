"use client"

import { Restaurant01Icon as UtensilsCrossed, ShoppingBag01Icon as ShoppingBag, UserMultiple02Icon as Users, PackageIcon as Package, Activity03Icon as Activity, ChefHatIcon as ChefHat, LayoutGridIcon as LayoutGrid } from "@hugeicons/core-free-icons"
import type { PresetPageCopy } from "@/app/domains/workspace/copy/preset-page-copy"
import { usePermission } from "@/app/hooks/usePermission"
import { ModuleShell } from "./ModuleShell"
import { QuickLinkRow } from "./QuickLinkRow"

export function RestaurantDashboardModule({ pageCopy }: { pageCopy: PresetPageCopy }) {
    const { can } = usePermission()
    const d = pageCopy.dashboard

    return (
        <ModuleShell
            icon={UtensilsCrossed}
            title="Floor & kitchen rhythm"
            subtitle="Service queue, guests, and menu stock—keep sales and 86 risk visible in one glance."
            footerMarkdown={[d.verticalHint, d.schoolFeeTermHint].filter(Boolean).join("\n\n")}
        >
            <QuickLinkRow
                items={[
                    { href: "/orders/sale", label: pageCopy.ordersUi.recordSale, icon: ShoppingBag, show: can("VIEW_SALES") },
                    { href: "/orders", label: pageCopy.orders.title, icon: ShoppingBag, show: can("VIEW_SALES") },
                    { href: "/restaurant/live", label: "Restaurant Live", icon: ChefHat, show: can("VIEW_DASHBOARD") },
                    { href: "/restaurant/tables", label: "Tables", icon: LayoutGrid, show: can("VIEW_SALES") },
                    { href: "/restaurant/kitchen", label: "Kitchen", icon: ChefHat, show: can("VIEW_SALES") },
                    { href: "/customers", label: pageCopy.customers.title, icon: Users, show: can("VIEW_SALES") },
                    { href: "/inventory", label: pageCopy.inventory.title, icon: Package, show: can("VIEW_PRODUCTS") },
                    { href: "/activity", label: pageCopy.activity.title, icon: Activity, show: can("VIEW_DASHBOARD") },
                ]}
            />
        </ModuleShell>
    )
}
