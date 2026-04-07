"use client"

import { LayoutGrid, Banknote, ShoppingBag, Users, Package } from "lucide-react"
import type { PresetPageCopy } from "@/app/domains/workspace/copy/preset-page-copy"
import { usePermission } from "@/app/hooks/usePermission"
import { ModuleShell } from "./ModuleShell"
import { QuickLinkRow } from "./QuickLinkRow"

export function DefaultDashboardModule({ pageCopy }: { pageCopy: PresetPageCopy }) {
    const { can } = usePermission()
    const d = pageCopy.dashboard

    return (
        <ModuleShell
            icon={LayoutGrid}
            title="Run your business"
            subtitle="Quick paths for sales, money, people, and stock—aligned with how Nigerian SMBs switch between cash, transfers, and credit."
            footerMarkdown={[d.verticalHint, d.schoolFeeTermHint].filter(Boolean).join("\n\n")}
        >
            <QuickLinkRow
                items={[
                    { href: "/orders", label: pageCopy.orders.title, icon: ShoppingBag, show: can("VIEW_SALES") },
                    { href: "/finance", label: pageCopy.finance.title, icon: Banknote, show: can("VIEW_FINANCIALS") },
                    { href: "/customers", label: pageCopy.customers.title, icon: Users, show: can("VIEW_SALES") },
                    { href: "/inventory", label: pageCopy.inventory.title, icon: Package, show: can("VIEW_PRODUCTS") },
                ]}
            />
        </ModuleShell>
    )
}
