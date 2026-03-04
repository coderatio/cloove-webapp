"use client"

import * as React from 'react'
import DataTable from '@/app/components/DataTable'
import { useIsMobile } from '@/app/hooks/useMediaQuery'
import { PageTransition } from '@/app/components/layout/page-transition'
import { ListCard } from '@/app/components/ui/list-card'
import { GlassCard } from '@/app/components/ui/glass-card'
import { ShoppingBag, TrendingUp, Trash2, ReceiptText, AlertCircle, RefreshCw, FilterX, CheckCircle2, XCircle, Loader2, Clock, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/app/lib/utils'
import { ManagementHeader } from '@/app/components/shared/ManagementHeader'
import { InsightWhisper } from '@/app/components/dashboard/InsightWhisper'
import { useStores } from '@/app/domains/stores/providers/StoreProvider'
import { Button } from '@/app/components/ui/button'
import { FilterPopover } from '@/app/components/shared/FilterPopover'
import { TableSearch } from '@/app/components/shared/TableSearch'
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerClose,
} from "@/app/components/ui/drawer"
import Link from 'next/link'
import { useOrders } from '../hooks/useOrders'
import { useDebounce } from '@/app/hooks/useDebounce'
import { OrdersSkeleton } from './OrdersSkeleton'
import { Pagination } from '@/app/components/shared/Pagination'
import { Order, OrderStatus } from '../types'
import { formatCurrency } from '@/app/lib/formatters'
import { useBusiness } from '@/app/components/BusinessProvider'

export function OrdersView() {
    const isMobile = useIsMobile()
    const { activeBusiness } = useBusiness()
    const { currentStore, stores } = useStores()
    const [page, setPage] = React.useState(1)
    const [search, setSearch] = React.useState("")
    const [selectedStatus, setSelectedStatus] = React.useState<OrderStatus>('ALL')
    const [viewingOrder, setViewingOrder] = React.useState<Order | null>(null)
    const statusColorMap: Record<string, { label: string, color: 'success' | 'warning' | 'danger' | 'neutral', className: string, icon: any }> = {
        COMPLETED: {
            label: 'Completed',
            color: 'success',
            className: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-400/10",
            icon: CheckCircle2
        },
        PENDING: {
            label: 'Pending',
            color: 'warning',
            className: "text-amber-600 dark:text-amber-400 bg-amber-600/5 dark:bg-amber-400/5",
            icon: Clock
        },
        CANCELLED: {
            label: 'Cancelled',
            color: 'danger',
            className: "text-red-600 dark:text-red-400 bg-red-600/5 dark:bg-red-400/5",
            icon: XCircle
        }
    }

    const debouncedSearch = useDebounce(search, 500)

    const limit = isMobile ? 15 : 50
    const {
        orders,
        meta,
        summary,
        isLoading,
        error,
        refetch,
        deleteOrder,
        isDeleting,
        updateOrder,
        isUpdating
    } = useOrders(page, limit, {
        search: debouncedSearch,
        status: selectedStatus,
        storeId: currentStore?.id
    })

    const totalPages = meta?.lastPage || (meta as any)?.last_page || 1

    const filterGroups = [
        {
            title: "Order Status",
            options: [
                { label: "All Statuses", value: "ALL" },
                { label: "Completed", value: "Completed" },
                { label: "Pending", value: "Pending" },
                { label: "Cancelled", value: "Cancelled" },
            ]
        }
    ]

    const handleStatusChange = (values: string[]) => {
        if (values.length > 0) {
            setSelectedStatus(values[0] as OrderStatus)
        } else {
            setSelectedStatus('ALL')
        }
        setPage(1)
    }

    const columns: any[] = [
        {
            key: 'id',
            header: 'Order ID',
            width: '100px',
            render: (value: string, row: Order) => (
                <span className="font-mono text-xs text-brand-accent/40 dark:text-brand-cream/40 uppercase">
                    #{row.shortCode || value.substring(0, 6)}
                </span>
            )
        },
        {
            key: 'customer',
            header: 'Customer',
            width: '150px',
            cellClassName: 'whitespace-normal',
            render: (value: string) => <span className="font-medium text-brand-deep dark:text-brand-cream">{value}</span>
        },
        {
            key: 'items',
            header: 'Summary',
            width: 'auto',
            cellClassName: 'whitespace-normal min-w-[200px]',
            render: (_: any, row: Order) => <span className="text-xs">{row.summary}</span>
        },
        {
            key: 'totalAmount',
            header: 'Total',
            width: '120px',
            render: (value: number | string, row: Order) => (
                <span className="text-sm font-bold text-brand-deep dark:text-brand-cream whitespace-nowrap">
                    {formatCurrency(value, { currency: row.currency || activeBusiness?.currency || 'NGN' })}
                </span>
            )
        },
        {
            key: 'status',
            header: 'Status',
            width: '100px',
            render: (value: string | undefined) => {
                const status = value?.toUpperCase() || 'UNKNOWN'
                const config = statusColorMap[status] || {
                    label: value || 'Unknown',
                    className: "text-brand-deep/60 dark:text-brand-cream/60 bg-brand-deep/5 dark:bg-white/5",
                    icon: AlertCircle
                }
                const StatusIcon = config.icon

                return (
                    <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-current/10 whitespace-nowrap", config.className)}>
                        <StatusIcon className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                            {config.label}
                        </span>
                    </div>
                )
            }
        },
        { key: 'date', header: 'Time', width: '120px' },
    ]

    const intelligenceWhisper = orders.some(o => o.status === 'Pending')
        ? `You have **${orders.filter(o => o.status === 'Pending').length} pending orders** awaiting fulfillment. Ensuring prompt delivery builds customer trust.`
        : `All orders have been successfully fulfilled. Your operations are running smoothly today.`

    const stats = [
        {
            label: "Today's Orders",
            value: summary?.todayOrders ?? orders.filter(o => o.date.includes(':') || o.date.toLowerCase().includes('today')).length,
            icon: ShoppingBag,
            color: "brand-green"
        },
        {
            label: "Revenue (Today)",
            value: formatCurrency(summary?.todayRevenue ?? 0, { currency: activeBusiness?.currency || 'NGN' }),
            icon: TrendingUp,
            color: "brand-gold"
        }
    ]

    if (error) {
        return (
            <PageTransition>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                    <div className="h-16 w-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-4">
                        <AlertCircle className="h-8 w-8" />
                    </div>
                    <h2 className="text-xl font-serif font-medium mb-2">Failed to load orders</h2>
                    <p className="text-brand-accent/60 dark:text-brand-cream/60 max-w-sm mb-6">
                        {error.message || "Something went wrong while fetching your orders. Please check your connection and try again."}
                    </p>
                    <Button onClick={() => refetch()} className="rounded-full px-8">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                    </Button>
                </div>
            </PageTransition>
        )
    }

    return (
        <PageTransition>
            <div className="max-w-5xl mx-auto space-y-8 pb-24">
                <ManagementHeader
                    title="Orders"
                    description={`Monitor sales pipeline and track order fulfillment for ${currentStore?.name || 'your business'}.`}
                    extraActions={
                        <Link href="/orders/sale" className="hidden md:block">
                            <Button
                                className="rounded-full bg-brand-gold text-brand-deep hover:bg-brand-gold/80 hover:scale-105 transition-all shadow-lg h-12 px-6 font-bold"
                            >
                                <ShoppingBag className="w-4 h-4 mr-2" />
                                Record Sale
                            </Button>
                        </Link>
                    }
                />

                <InsightWhisper insight={intelligenceWhisper} />

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {stats.map((stat, i) => (
                        <GlassCard key={i} className="p-5 flex items-center gap-4 relative overflow-hidden group">
                            <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                                <stat.icon className="w-24 h-24 dark:text-brand-cream/10" />
                            </div>
                            <div className={cn(
                                "h-12 w-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 duration-500",
                                stat.color === "brand-green" ? "bg-brand-green/10 dark:bg-brand-green/20 text-brand-green" : "bg-brand-gold/10 dark:bg-brand-gold/20 text-brand-gold"
                            )}>
                                <stat.icon className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-brand-accent/40 dark:text-brand-cream/60 uppercase tracking-wider">{stat.label}</p>
                                <p className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream">{stat.value}</p>
                            </div>
                        </GlassCard>
                    ))}
                </div>

                {/* Filters */}
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-accent/40 dark:text-brand-cream/40 ml-1">
                            {isLoading ? "Fetching Records..." : "Recent Transactions"}
                        </p>

                        <div className="flex items-center gap-3">
                            <TableSearch
                                value={search}
                                onChange={(val) => { setSearch(val); setPage(1); }}
                                placeholder="Search customer or ID..."
                            />
                            <FilterPopover
                                groups={filterGroups}
                                selectedValues={selectedStatus !== 'ALL' ? [selectedStatus] : []}
                                onSelectionChange={handleStatusChange}
                                onClear={() => { setSelectedStatus('ALL'); setPage(1); }}
                            />
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <OrdersSkeleton isMobile={isMobile} />
                ) : orders.length === 0 ? (
                    <div className="bg-brand-cream/40 dark:bg-white/5 border border-dashed border-brand-accent/10 dark:border-white/10 rounded-3xl flex flex-col items-center justify-center py-24 px-8 text-center text-brand-deep dark:text-brand-cream">
                        <div className="h-20 w-20 rounded-full bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center mb-6">
                            <FilterX className="h-10 w-10 opacity-20" />
                        </div>
                        <h3 className="text-xl font-serif font-medium mb-2">No orders match your criteria</h3>
                        <p className="text-sm text-brand-accent/40 dark:text-brand-cream/40 mb-8 max-w-sm">
                            We couldn't find any orders matching your current filters. Try adjusting your search or filtering by a different status.
                        </p>
                        <Button
                            variant="outline"
                            className="rounded-full px-8 h-12"
                            onClick={() => {
                                setSearch("")
                                setSelectedStatus('ALL')
                                setPage(1)
                            }}
                        >
                            Clear All Filters
                        </Button>
                    </div>
                ) : isMobile ? (
                    <div className="space-y-3">
                        {orders.map((order, index) => (
                            <ListCard
                                key={order.id}
                                title={order.customer}
                                subtitle={order.summary}
                                meta={order.date}
                                status={order.status}
                                statusColor={statusColorMap[order.status?.toUpperCase() || '']?.color || 'neutral'}
                                value={formatCurrency(order.totalAmount, { currency: order.currency || activeBusiness?.currency || 'NGN' })}
                                valueLabel={(order.isAutomated || order.paymentMethod === 'TRANSFER') ? 'Bank Transfer' : order.paymentMethod?.replace('_', ' ').toLowerCase()}
                                delay={index * 0.05}
                                onClick={() => setViewingOrder(order)}
                            />
                        ))}

                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            onPageChange={(p) => setPage(p)}
                            isLoading={isLoading}
                        />
                    </div>
                ) : (
                    <div className="space-y-6">
                        <GlassCard className="overflow-hidden border-brand-deep/5 dark:border-white/5 shadow-lg">
                            <DataTable
                                columns={columns}
                                data={orders as any}
                                onRowClick={(item) => setViewingOrder(item as Order)}
                            />
                        </GlassCard>

                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            onPageChange={(p) => setPage(p)}
                            isLoading={isLoading}
                        />
                    </div>
                )}

                {/* Order Detail Drawer */}
                <Drawer
                    open={!!viewingOrder}
                    onOpenChange={(open) => !open && setViewingOrder(null)}
                >
                    <DrawerContent>
                        <DrawerStickyHeader>
                            <DrawerTitle>Order Details</DrawerTitle>
                            <DrawerDescription>
                                Transaction #{viewingOrder?.shortCode || viewingOrder?.id.substring(0, 6)} for {viewingOrder?.customer}
                            </DrawerDescription>
                        </DrawerStickyHeader>

                        <div className="p-8 pb-12 overflow-y-auto">
                            <div className="max-w-lg mx-auto space-y-8">
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1">Itemized List</h3>
                                    <GlassCard className="divide-y divide-brand-deep/5 dark:divide-white/5 border-brand-deep/5 rounded-2xl">
                                        {viewingOrder?.items?.map((item, idx) => (
                                            <div key={idx} className="p-4 flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium text-brand-deep dark:text-brand-cream">{item.productName}</p>
                                                    <p className="text-xs text-brand-accent/40 dark:text-brand-cream/40">{Number(item.quantity)} {Number(item.quantity) === 1 ? 'unit' : 'units'} x {formatCurrency(item.price, { currency: viewingOrder.currency || activeBusiness?.currency || 'NGN' })}</p>
                                                </div>
                                                <p className="font-serif font-medium text-brand-deep dark:text-brand-cream">{formatCurrency(item.total, { currency: viewingOrder.currency || activeBusiness?.currency || 'NGN' })}</p>
                                            </div>
                                        )) || (
                                                <div className="p-4 text-center text-xs opacity-40">No item details available</div>
                                            )}
                                        <div className="p-4 flex justify-between items-center bg-brand-deep/5 dark:bg-white/5">
                                            <p className="font-bold text-xs uppercase tracking-widest text-brand-accent/60">Total Amount</p>
                                            <p className="text-2xl font-bold text-brand-green dark:text-brand-gold">
                                                {formatCurrency(viewingOrder?.totalAmount ?? 0, { currency: viewingOrder?.currency || activeBusiness?.currency || 'NGN' })}
                                            </p>
                                        </div>
                                    </GlassCard>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1">Payment Information</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <GlassCard className="p-4 rounded-3xl">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/30 dark:text-brand-cream/30 mb-2">Status</p>
                                            <div className="flex">
                                                {(() => {
                                                    const status = viewingOrder?.status?.toUpperCase() || 'UNKNOWN'
                                                    const config = statusColorMap[status] || {
                                                        label: viewingOrder?.status || 'Unknown',
                                                        className: "text-brand-deep/60 dark:text-brand-cream/60 bg-brand-deep/5 dark:bg-white/5",
                                                        icon: AlertCircle
                                                    }
                                                    const StatusIcon = config.icon
                                                    return (
                                                        <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-current/10 whitespace-nowrap", config.className)}>
                                                            <StatusIcon className="w-3 h-3" />
                                                            <span className="text-[10px] font-bold uppercase tracking-wider">
                                                                {config.label}
                                                            </span>
                                                        </div>
                                                    )
                                                })()}
                                            </div>
                                        </GlassCard>
                                        <GlassCard className="p-4 rounded-3xl">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/30 dark:text-brand-cream/30 mb-2">Method</p>
                                            <p className="text-sm font-bold text-brand-deep dark:text-brand-cream capitalize tracking-tight leading-none">
                                                {(viewingOrder?.isAutomated || viewingOrder?.paymentMethod === 'TRANSFER') ? 'Bank Transfer' : viewingOrder?.paymentMethod?.replace('_', ' ').toLowerCase()}
                                            </p>
                                        </GlassCard>
                                    </div>
                                    {viewingOrder?.notes && (
                                        <GlassCard className="p-4 rounded-3xl">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/30 dark:text-brand-cream/30 mb-1">Notes</p>
                                            <p className="text-sm text-brand-deep/70 dark:text-brand-cream/70 leading-relaxed">{viewingOrder.notes}</p>
                                        </GlassCard>
                                    )}
                                </div>

                                {viewingOrder?.deposit && (
                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1">Automated Payment Details</h3>
                                        <GlassCard className="p-6 rounded-3xl space-y-4 bg-brand-gold/5 border-brand-gold/10">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold/60 mb-1">Bank Name</p>
                                                    <p className="text-sm font-medium text-brand-deep dark:text-brand-cream">{viewingOrder.deposit.bankName}</p>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold/60">Account Number</p>
                                                        <button
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(viewingOrder.deposit?.virtualAccountNumber || '')
                                                                toast.success('Account number copied to clipboard')
                                                            }}
                                                            className="text-brand-gold hover:text-brand-gold/80 transition-colors"
                                                        >
                                                            <Copy className="w-2.5 h-2.5" />
                                                        </button>
                                                    </div>
                                                    <p className="text-sm font-mono font-medium text-brand-deep dark:text-brand-cream tracking-wider">{viewingOrder.deposit.virtualAccountNumber}</p>
                                                </div>
                                            </div>
                                            <div className="pt-3 border-t border-brand-gold/10 grid grid-cols-2 gap-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold/60">Reference</p>
                                                        <button
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(viewingOrder.deposit?.paymentReference || '')
                                                                toast.success('Reference copied to clipboard')
                                                            }}
                                                            className="text-brand-gold hover:text-brand-gold/80 transition-colors"
                                                        >
                                                            <Copy className="w-2.5 h-2.5" />
                                                        </button>
                                                    </div>
                                                    <p className="text-[11px] font-mono text-brand-deep/60 dark:text-brand-cream/60 truncate">{viewingOrder.deposit.paymentReference}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold/60 mb-1">Provider</p>
                                                    <p className="text-[11px] font-bold text-brand-deep/40 dark:text-brand-cream/40 uppercase tracking-tighter">{viewingOrder.deposit.provider}</p>
                                                </div>
                                            </div>
                                        </GlassCard>
                                    </div>
                                )}

                                <div className="flex gap-4 pt-6">
                                    <Button variant="outline" className="flex-1 rounded-2xl h-14 border-brand-deep/5">
                                        <ReceiptText className="w-4 h-4 mr-2" />
                                        Print Receipt
                                    </Button>
                                    <DrawerClose asChild>
                                        <Button className="flex-1 rounded-2xl h-14 bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold shadow-xl">
                                            Done
                                        </Button>
                                    </DrawerClose>
                                </div>

                                <div className={cn("pt-6 border-t border-brand-deep/5 dark:border-white/5 mt-6",
                                    viewingOrder?.isAutomated && viewingOrder?.status?.toUpperCase() !== 'PENDING' ? "hidden" : "")
                                }>
                                    {viewingOrder?.isAutomated ? (
                                        <div className="space-y-3">
                                            {viewingOrder.status?.toUpperCase() === 'PENDING' ? (
                                                <Button
                                                    variant="outline"
                                                    onClick={async () => {
                                                        if (viewingOrder) {
                                                            await updateOrder({ id: viewingOrder.id, updates: { status: 'CANCELLED' as any } })
                                                            setViewingOrder(null)
                                                        }
                                                    }}
                                                    disabled={isUpdating}
                                                    className="flex items-center justify-center gap-2 w-full h-14 text-xs font-bold text-amber-600 hover:text-amber-700 transition-all uppercase tracking-widest border-amber-600/10 rounded-2xl"
                                                >
                                                    <RefreshCw className={cn("w-4 h-4", isUpdating && "animate-spin")} />
                                                    {isUpdating ? "Cancelling..." : "Cancel Order"}
                                                </Button>
                                            ) : null
                                            }
                                        </div>
                                    ) : (
                                        <Button
                                            variant="ghost"
                                            onClick={async () => {
                                                if (viewingOrder) {
                                                    await deleteOrder(viewingOrder.id)
                                                    setViewingOrder(null)
                                                }
                                            }}
                                            disabled={isDeleting}
                                            className="flex items-center justify-center gap-2 w-full h-14 text-xs font-bold text-rose-500/60 hover:text-rose-500 hover:bg-rose-500/5 transition-all uppercase tracking-widest disabled:opacity-50 rounded-2xl"
                                        >
                                            <Trash2 className={cn("w-4 h-4", isDeleting && "animate-spin")} />
                                            {isDeleting ? "Deleting..." : "Cancel & Delete Order"}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </DrawerContent>
                </Drawer>
            </div>

            {/* Mobile Floating Action Button */}
            <AnimatePresence>
                {isMobile && !isLoading && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0, opacity: 0, y: 20 }}
                        className="fixed bottom-28 right-6 z-40 md:hidden"
                    >
                        <Link href="/orders/sale">
                            <Button
                                size="icon"
                                className="h-16 w-16 rounded-full bg-brand-gold text-brand-deep shadow-2xl hover:scale-110 active:scale-95 transition-all border-4 border-brand-cream dark:border-brand-deep"
                            >
                                <ShoppingBag className="w-7 h-7" />
                            </Button>
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>
        </PageTransition>
    )
}
