"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Copy, Check, Link2, XCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/app/lib/utils"
import { Button } from "@/app/components/ui/button"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Skeleton } from "@/app/components/ui/skeleton"
import { usePaymentLinks, useCancelPaymentLink } from "@/app/domains/checkout/hooks/usePaymentLinks"
import { toast } from "sonner"

const statusTabs = [
    { label: 'All', value: undefined },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Paid', value: 'PAID' },
    { label: 'Expired', value: 'EXPIRED' },
    { label: 'Cancelled', value: 'CANCELLED' },
] as const

const statusColors: Record<string, string> = {
    ACTIVE: 'bg-brand-green/10 text-brand-green',
    PAID: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    EXPIRED: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    CANCELLED: 'bg-red-500/10 text-red-600 dark:text-red-400',
}

const targetTypeColors: Record<string, string> = {
    SALE: 'bg-brand-gold/10 text-brand-gold',
    DEBT: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
}

export function PaymentLinksView() {
    const [page, setPage] = useState(1)
    const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [cancellingId, setCancellingId] = useState<string | null>(null)

    const { data: response, isLoading } = usePaymentLinks(page, 20, statusFilter)
    const cancelLink = useCancelPaymentLink()

    const allLinks = Array.isArray(response?.data) ? response.data : []
    const links = allLinks.filter((l: { targetType: string }) => l.targetType !== 'WALLET')
    const meta = response?.meta
    const totalPages = meta ? (meta.lastPage ?? meta.totalPages ?? 1) : 1

    const origin = typeof window !== 'undefined' ? window.location.origin : ''

    const handleCopy = (reference: string, id: string) => {
        const url = `${origin}/pay/${reference}`
        navigator.clipboard.writeText(url)
        setCopiedId(id)
        toast.success('Payment link copied')
        setTimeout(() => setCopiedId(null), 2000)
    }

    const handleCancel = async (id: string) => {
        setCancellingId(id)
        try {
            await cancelLink.mutateAsync(id)
        } finally {
            setCancellingId(null)
        }
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-serif font-medium text-brand-deep dark:text-brand-cream">
                    Payment Links
                </h1>
                <p className="text-sm text-brand-accent/60 dark:text-brand-cream/60 mt-1">
                    Manage your payment links for sales and debts
                </p>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                {statusTabs.map((tab) => (
                    <button
                        key={tab.label}
                        onClick={() => { setStatusFilter(tab.value); setPage(1) }}
                        className={cn(
                            "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
                            statusFilter === tab.value
                                ? "bg-brand-deep text-brand-cream dark:bg-brand-gold dark:text-brand-deep"
                                : "bg-brand-deep/5 dark:bg-white/5 text-brand-accent/60 dark:text-brand-cream/60 hover:bg-brand-deep/10 dark:hover:bg-white/10"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
                {isLoading ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                    >
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-24 w-full rounded-3xl" />
                        ))}
                    </motion.div>
                ) : links.length === 0 ? (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        className="flex flex-col items-center text-center py-16 space-y-4"
                    >
                        <div className="w-20 h-20 rounded-3xl bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center">
                            <Link2 className="w-10 h-10 text-brand-accent/30 dark:text-brand-cream/30" />
                        </div>
                        <h3 className="text-xl font-serif font-medium text-brand-deep dark:text-brand-cream">
                            No Payment Links
                        </h3>
                        <p className="text-sm text-brand-accent/60 dark:text-brand-cream/60 max-w-[300px]">
                            {statusFilter
                                ? `No ${statusFilter.toLowerCase()} payment links found.`
                                : 'Payment links you create for sales and debts will appear here.'}
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        className="space-y-3"
                    >
                        {links.map((link, index) => (
                            <motion.div
                                key={link.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <GlassCard className="p-5 border-brand-deep/5 dark:border-white/5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0 space-y-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-base font-serif font-medium text-brand-deep dark:text-brand-cream truncate">
                                                    {link.title || link.reference}
                                                </p>
                                                <span className={cn(
                                                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                                                    targetTypeColors[link.targetType] || 'bg-brand-deep/5 text-brand-accent/60'
                                                )}>
                                                    {link.targetType}
                                                </span>
                                                <span className={cn(
                                                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                                                    statusColors[link.status] || 'bg-brand-deep/5 text-brand-accent/60'
                                                )}>
                                                    {link.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-brand-accent/50 dark:text-brand-cream/50">
                                                <span className="font-mono">{link.reference}</span>
                                                {link.amount != null && (
                                                    <>
                                                        <span>·</span>
                                                        <span className="font-semibold text-brand-deep dark:text-brand-cream">
                                                            {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(link.amount)}
                                                        </span>
                                                    </>
                                                )}
                                                {typeof link.createdAt === 'string' && (
                                                    <>
                                                        <span>·</span>
                                                        <span>{new Date(link.createdAt).toLocaleDateString()}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleCopy(link.reference, link.id)}
                                                className="h-9 w-9 rounded-xl bg-brand-deep/5 dark:bg-white/5 hover:bg-brand-deep/10 dark:hover:bg-white/10"
                                            >
                                                {copiedId === link.id ? (
                                                    <Check className="w-4 h-4 text-brand-green" />
                                                ) : (
                                                    <Copy className="w-4 h-4" />
                                                )}
                                            </Button>
                                            {link.status === 'ACTIVE' && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleCancel(link.id)}
                                                    disabled={cancellingId === link.id}
                                                    className="h-9 w-9 rounded-xl bg-red-500/5 hover:bg-red-500/10 text-red-500"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        ))}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-4 pt-4">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                    className="h-10 w-10 rounded-xl"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <span className="text-sm font-medium text-brand-accent/60 dark:text-brand-cream/60">
                                    Page {page} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page >= totalPages}
                                    className="h-10 w-10 rounded-xl"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
