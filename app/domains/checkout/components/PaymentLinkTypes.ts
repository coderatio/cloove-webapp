export interface PaymentLink {
    id: string
    reference: string
    amount: number | null
    status: string
    targetType: string
    title: string | null
    description?: string | null
    isStatic: boolean
    customerName?: string | null
    customerEmail?: string | null
    createdAt: string
    expiresAt?: string | null
    [key: string]: unknown
}

export const STATUS_OPTIONS = [
    { label: "All", value: "ALL" },
    { label: "Active", value: "ACTIVE" },
    { label: "Paid", value: "PAID" },
    { label: "Expired", value: "EXPIRED" },
    { label: "Cancelled", value: "CANCELLED" },
]

export const TARGET_TYPE_OPTIONS = [
    { label: "All", value: "ALL" },
    { label: "Sale", value: "SALE" },
    { label: "Debt", value: "DEBT" },
    { label: "Wallet", value: "WALLET" },
]

export const statusConfig: Record<string, { label: string; className: string; statusColor?: "success" | "warning" | "danger" | "neutral" }> = {
    ACTIVE: { label: "Active", className: "bg-brand-green/10 text-brand-green border-brand-green/20 dark:bg-brand-green-600/10 dark:text-brand-cream/60 dark:border-brand-green-600/20", statusColor: "success" },
    PAID: { label: "Paid", className: "bg-brand-green-500/10 text-brand-green-600 dark:text-brand-green-400 border-brand-green-500/20", statusColor: "success" },
    EXPIRED: { label: "Expired", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", statusColor: "warning" },
    CANCELLED: { label: "Cancelled", className: "bg-rose-500/10 text-rose-500 border-rose-500/20", statusColor: "danger" },
}

export const targetTypeConfig: Record<string, { label: string; className: string }> = {
    SALE: { label: "Sale", className: "bg-brand-gold/10 text-brand-gold border-brand-gold/20" },
    DEBT: { label: "Debt", className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
    WALLET: { label: "Wallet", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
}
