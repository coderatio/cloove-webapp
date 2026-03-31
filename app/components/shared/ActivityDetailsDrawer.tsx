"use client"

import Link from "next/link"
import { ExternalLink } from "lucide-react"
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerBody,
    DrawerTitle,
    DrawerDescription,
} from "@/app/components/ui/drawer"
import { VisuallyHidden } from "@/app/components/ui/visually-hidden"
import { ActivityIcon, type ActivityItem } from "@/app/components/dashboard/ActivityStream"
import { formatDateTime } from "@/app/lib/date-utils"
import { GlassCard } from "@/app/components/ui/glass-card"
import { cn } from "@/app/lib/utils"
import { CurrencyText } from "@/app/components/shared/CurrencyText"

interface ActivityDetailsDrawerProps {
    activity: ActivityItem | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

const EVENT_TYPE_LABELS: Record<string, string> = {
    ORDER_CREATED: "Sale Created",
    ORDER_UPDATED: "Sale Updated",
    ORDER_CANCELLED: "Sale Cancelled",
    ORDER_REFUNDED: "Order Refunded",
    PAYMENT_RECEIVED: "Payment Received",
    PAYMENT_MARKED_PAID: "Payment Marked Paid",
    PAYMENT_MARKED_PARTIAL: "Partial Payment",
    INVENTORY_INCREASED: "Stock Increased",
    INVENTORY_DECREASED: "Stock Decreased",
    DEBT_CREATED: "Debt Created",
    DEBT_REPAYMENT: "Debt Repayment",
    DEBT_CLEARED: "Debt Cleared",
    WITHDRAWAL_REQUESTED: "Withdrawal Requested",
    WITHDRAWAL_COMPLETED: "Withdrawal Completed",
    WITHDRAWAL_FAILED: "Withdrawal Failed",
    WALLET_DEPOSIT: "Wallet Deposit",
    EXPENSE_RECORDED: "Expense Recorded",
    CUSTOMER_CREATED: "Customer Created",
    CUSTOMER_UPDATED: "Customer Updated",
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
    if (!value) return null
    return (
        <div className="flex items-start justify-between gap-4 py-2.5 border-b border-brand-deep/5 dark:border-white/5 last:border-0">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-accent/50 dark:text-brand-cream/50 shrink-0">
                {label}
            </span>
            <span className="text-sm text-brand-deep dark:text-brand-cream text-right">
                {value}
            </span>
        </div>
    )
}

function formatFieldName(field: string): string {
    return field
        .replace(/([A-Z])/g, " $1")
        .replace(/[_-]/g, " ")
        .replace(/^\w/, (c) => c.toUpperCase())
        .trim()
}

function getDetails(activity: ActivityItem): { label: string; value?: string | null }[] {
    const m = activity.metadata ?? {}
    const rows: { label: string; value?: string | null }[] = []

    switch (activity.eventType) {
        case "ORDER_CREATED":
        case "ORDER_UPDATED":
        case "ORDER_CANCELLED":
        case "ORDER_REFUNDED":
            rows.push({ label: "Customer", value: m.customerName as string })
            rows.push({ label: "Items", value: m.itemCount != null ? String(m.itemCount) : undefined })
            rows.push({ label: "Order ID", value: m.orderId as string })
            break

        case "INVENTORY_INCREASED":
        case "INVENTORY_DECREASED":
            rows.push({ label: "Product", value: m.productName as string })
            rows.push({ label: "Change", value: m.change != null ? String(m.change) : undefined })
            break

        case "PAYMENT_RECEIVED":
        case "PAYMENT_MARKED_PAID":
        case "PAYMENT_MARKED_PARTIAL":
            if (m.feeAmount) rows.push({ label: "Fee", value: String(m.feeAmount) })
            break

        case "DEBT_CREATED":
        case "DEBT_REPAYMENT":
        case "DEBT_CLEARED":
            rows.push({ label: "Customer", value: m.customerName as string })
            break

        case "WITHDRAWAL_REQUESTED":
        case "WITHDRAWAL_COMPLETED":
        case "WITHDRAWAL_FAILED":
            if (m.reason) rows.push({ label: "Reason", value: m.reason as string })
            if (m.currency) rows.push({ label: "Currency", value: m.currency as string })
            break

        case "WALLET_DEPOSIT":
            if (m.feeAmount) rows.push({ label: "Fee", value: String(m.feeAmount) })
            if (m.currency) rows.push({ label: "Currency", value: m.currency as string })
            break

        case "EXPENSE_RECORDED":
            rows.push({ label: "Category", value: m.category as string })
            rows.push({ label: "Description", value: m.description as string })
            break

        case "CUSTOMER_CREATED":
            rows.push({ label: "Name", value: m.customerName as string })
            break

        case "CUSTOMER_UPDATED": {
            rows.push({ label: "Name", value: m.customerName as string })
            const fields = m.updatedFields as string[] | undefined
            if (fields?.length) {
                rows.push({ label: "Fields changed", value: fields.map(formatFieldName).join(", ") })
            }
            break
        }
    }

    return rows.filter((r) => r.value != null)
}

function getModuleLink(activity: ActivityItem): { href: string; label: string } | null {
    switch (activity.type) {
        case "sale":
            return activity.orderId
                ? { href: "/orders", label: "View in Orders" }
                : null
        case "payment":
        case "deposit":
        case "withdrawal":
        case "debt":
            return { href: "/finance", label: "View in Finance" }
        case "inventory":
            return { href: "/inventory", label: "View in Inventory" }
        case "customer":
            return { href: "/customers", label: "View in Customers" }
        default:
            return activity.href ? { href: activity.href, label: "View details" } : null
    }
}

export function ActivityDetailsDrawer({ activity, open, onOpenChange }: ActivityDetailsDrawerProps) {
    const details = activity ? getDetails(activity) : []
    const moduleLink = activity ? getModuleLink(activity) : null
    const eventLabel = activity?.eventType ? (EVENT_TYPE_LABELS[activity.eventType] ?? activity.eventType) : ""

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent>
                <VisuallyHidden>
                    <DrawerTitle>Activity Details</DrawerTitle>
                    <DrawerDescription>Details about this activity event</DrawerDescription>
                </VisuallyHidden>

                {activity && (
                    <>
                        <DrawerStickyHeader>
                            <div className="flex items-center gap-4">
                                <div className="scale-125">
                                    <ActivityIcon type={activity.type} />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-serif text-xl text-brand-deep dark:text-brand-cream leading-tight">
                                        {activity.description}
                                    </p>
                                    <p className="text-xs text-brand-accent/50 dark:text-brand-cream/50 mt-1">
                                        {eventLabel}
                                    </p>
                                </div>
                            </div>
                        </DrawerStickyHeader>

                        <DrawerBody>
                            <div className="space-y-5">
                                {/* Amount + Time summary */}
                                <div className="flex items-center justify-between gap-4">
                                    {activity.amount && (
                                        <span
                                            className={cn(
                                                "font-serif text-3xl font-medium",
                                                (activity.type === "sale" || activity.type === "payment" || activity.type === "deposit")
                                                    ? "text-brand-green dark:text-brand-gold"
                                                    : (activity.type === "withdrawal" || activity.type === "debt")
                                                      ? "text-rose-600 dark:text-rose-400"
                                                      : "text-brand-deep dark:text-brand-cream"
                                            )}
                                        >
                                            <CurrencyText
                                                value={`${(activity.type === "withdrawal" || activity.type === "debt") ? "-" : (activity.type === "sale" || activity.type === "payment" || activity.type === "deposit") ? "+" : ""}${activity.amount}`}
                                            />
                                        </span>
                                    )}
                                    {activity.timestamp && (
                                        <span className="text-sm text-brand-accent/50 dark:text-brand-cream/50">
                                            {formatDateTime(activity.timestamp)}
                                        </span>
                                    )}
                                </div>

                                {/* Details card */}
                                {details.length > 0 && (
                                    <GlassCard className="rounded-3xl p-5">
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 mb-2">
                                            Event Details
                                        </h4>
                                        {details.map((row) => (
                                            <DetailRow key={row.label} label={row.label} value={row.value} />
                                        ))}
                                    </GlassCard>
                                )}

                                {/* Module link */}
                                {moduleLink && (
                                    <Link
                                        href={moduleLink.href}
                                        className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-2xl bg-brand-deep/5 dark:bg-white/5 hover:bg-brand-deep/10 dark:hover:bg-white/10 text-sm font-semibold text-brand-deep dark:text-brand-cream transition-colors"
                                    >
                                        {moduleLink.label}
                                        <ExternalLink className="w-4 h-4" />
                                    </Link>
                                )}
                            </div>
                        </DrawerBody>
                    </>
                )}
            </DrawerContent>
        </Drawer>
    )
}
