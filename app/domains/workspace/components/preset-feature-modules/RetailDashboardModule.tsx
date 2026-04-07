"use client"

import { ScanBarcode, Banknote, Package, Link2, Truck, ShoppingBag } from "lucide-react"
import type { PresetPageCopy } from "@/app/domains/workspace/copy/preset-page-copy"
import { usePermission } from "@/app/hooks/usePermission"
import { ModuleShell } from "./ModuleShell"
import { QuickLinkRow } from "./QuickLinkRow"

export function RetailDashboardModule({ pageCopy }: { pageCopy: PresetPageCopy }) {
    const { can } = usePermission()
    const d = pageCopy.dashboard

    return (
        <ModuleShell
            icon={ScanBarcode}
            title="Retail floor & checkout"
            subtitle="Keep checkout fast and shelves honest—card and bank transfers still reconcile in Finance."
            footerMarkdown={[d.verticalHint, d.schoolFeeTermHint].filter(Boolean).join("\n\n")}
        >
            <QuickLinkRow
                items={[
                    { href: "/orders/sale", label: `${pageCopy.ordersUi.recordSale} (quick)`, icon: ScanBarcode, show: can("VIEW_SALES") },
                    { href: "/orders", label: pageCopy.orders.title, icon: ShoppingBag, show: can("VIEW_SALES") },
                    { href: "/inventory", label: pageCopy.inventory.title, icon: Package, show: can("VIEW_PRODUCTS") },
                    { href: "/finance", label: "Reconcile transfers", icon: Banknote, show: can("VIEW_FINANCIALS") },
                    { href: "/finance/payment-links", label: pageCopy.paymentLinks.title, icon: Link2, show: can("VIEW_FINANCIALS") },
                    { href: "/vendors", label: pageCopy.vendors.title, icon: Truck, show: can("VIEW_SUPPLIERS") },
                ]}
            />
        </ModuleShell>
    )
}
