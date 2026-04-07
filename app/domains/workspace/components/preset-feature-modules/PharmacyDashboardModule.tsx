"use client"

import { Pill, Package, Users, Banknote, ClipboardCheck, ShieldCheck, Wallet } from "lucide-react"
import type { PresetPageCopy } from "@/app/domains/workspace/copy/preset-page-copy"
import { usePermission } from "@/app/hooks/usePermission"
import { ModuleShell } from "./ModuleShell"
import { QuickLinkRow } from "./QuickLinkRow"

export function PharmacyDashboardModule({ pageCopy }: { pageCopy: PresetPageCopy }) {
    const { can } = usePermission()
    const d = pageCopy.dashboard

    return (
        <ModuleShell
            icon={ShieldCheck}
            title="Pharmacy operations"
            subtitle="Dispensing, stock batches, and patient balances—keep transfers reconciled for audits and trust."
            footerMarkdown={[d.verticalHint, d.schoolFeeTermHint].filter(Boolean).join("\n\n")}
        >
            <QuickLinkRow
                items={[
                    { href: "/orders", label: pageCopy.orders.title, icon: Pill, show: can("VIEW_SALES") },
                    { href: "/inventory", label: pageCopy.inventory.title, icon: Package, show: can("VIEW_PRODUCTS") },
                    { href: "/customers", label: pageCopy.customers.title, icon: Users, show: can("VIEW_SALES") },
                    { href: "/finance", label: pageCopy.finance.title, icon: Banknote, show: can("VIEW_FINANCIALS") },
                    { href: "/debts", label: pageCopy.debts.title, icon: Wallet, show: can("VIEW_CUSTOMERS") },
                ]}
            />
            <div className="mt-4 rounded-2xl border border-brand-deep/6 bg-brand-deep/2 px-3 py-3 dark:border-white/10 dark:bg-white/3">
                <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-deep/50 dark:text-brand-cream/50">
                    <ClipboardCheck className="h-3.5 w-3.5" />
                    Daily discipline
                </p>
                <ul className="space-y-1.5 text-sm text-brand-deep/80 dark:text-brand-cream/80">
                    <li className="flex gap-2">
                        <span className="text-brand-gold">1.</span>
                        Match batch and expiry on high-risk lines in <strong>Stock & batches</strong>.
                    </li>
                    <li className="flex gap-2">
                        <span className="text-brand-gold">2.</span>
                        Reconcile bank transfers in <strong>Finance</strong> before end of day.
                    </li>
                    <li className="flex gap-2">
                        <span className="text-brand-gold">3.</span>
                        Resolve patient balances under <strong>Debts</strong> or <strong>Patients</strong>.
                    </li>
                </ul>
            </div>
        </ModuleShell>
    )
}
