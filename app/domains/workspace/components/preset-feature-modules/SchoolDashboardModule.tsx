"use client"

import {
    GraduationCap,
    Users,
    ShoppingBag,
    Package,
    Banknote,
    Receipt,
    CalendarRange,
    Link2,
    AlertCircle,
} from "lucide-react"
import type { PresetPageCopy } from "@/app/domains/workspace/copy/preset-page-copy"
import { usePermission } from "@/app/hooks/usePermission"
import { ModuleShell } from "./ModuleShell"
import { QuickLinkRow } from "./QuickLinkRow"

export function SchoolDashboardModule({ pageCopy }: { pageCopy: PresetPageCopy }) {
    const { can } = usePermission()
    const d = pageCopy.dashboard

    return (
        <ModuleShell
            icon={GraduationCap}
            title="School fees & community"
            subtitle="Directory, fee collection, and resources—built for term-style billing and parent communication."
            footerMarkdown={[d.verticalHint, d.schoolFeeTermHint].filter(Boolean).join("\n\n")}
        >
            <QuickLinkRow
                items={[
                    { href: "/customers", label: pageCopy.customers.title, icon: Users, show: can("VIEW_SALES") },
                    { href: "/orders", label: pageCopy.orders.title, icon: ShoppingBag, show: can("VIEW_SALES") },
                    { href: "/school/calendar", label: "Years & terms", icon: CalendarRange, show: can("VIEW_SALES") },
                    {
                        href: "/finance/payment-links",
                        label: pageCopy.paymentLinks.title,
                        icon: Link2,
                        show: can("VIEW_FINANCIALS"),
                    },
                    {
                        href: "/debts",
                        label: pageCopy.debts.title,
                        icon: AlertCircle,
                        show: can("VIEW_CUSTOMERS"),
                    },
                    { href: "/inventory", label: pageCopy.inventory.title, icon: Package, show: can("VIEW_PRODUCTS") },
                    { href: "/finance", label: pageCopy.finance.title, icon: Banknote, show: can("VIEW_FINANCIALS") },
                    { href: "/expenses", label: pageCopy.expenses.title, icon: Receipt, show: can("VIEW_EXPENSES") },
                ]}
            />
            <div className="mt-4 rounded-xl border border-brand-gold/20 bg-brand-gold/5 px-3 py-3 dark:bg-brand-gold/10">
                <p className="text-sm text-brand-deep/85 dark:text-brand-cream/90">
                    <strong>Term rhythm:</strong> use <strong>Fees & sales</strong> for payments and{" "}
                    <strong>Students & parents</strong> as your single directory—filters and search help you chase
                    balances without mixing classes.
                </p>
            </div>
        </ModuleShell>
    )
}
