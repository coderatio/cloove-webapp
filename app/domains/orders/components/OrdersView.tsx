"use client"

import * as React from 'react'
import DataTable from '@/app/components/DataTable'
import { useIsMobile } from '@/app/hooks/useMediaQuery'
import { PageTransition } from '@/app/components/layout/page-transition'
import { ListCard } from '@/app/components/ui/list-card'
import { GlassCard } from '@/app/components/ui/glass-card'
import { ShoppingBag, TrendingUp, Trash2, ReceiptText, AlertCircle, RefreshCw, FilterX, CheckCircle2, XCircle, Loader2, Clock, Copy, MoreVertical, Check, Eye, Receipt } from 'lucide-react'
import { Order, OrderStatus, PaymentStatus } from "../types"
import { FilterPopover } from "@/app/components/shared/FilterPopover"
import { DateRangePicker } from "@/app/components/shared/DateRangePicker"
import { RecordPaymentDrawer } from "./RecordPaymentDrawer"
import { OrderDetailsDrawer } from "./OrderDetailsDrawer"
import { Button } from '@/app/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/app/lib/utils'
import { ManagementHeader } from '@/app/components/shared/ManagementHeader'
import { InsightWhisper } from '@/app/components/dashboard/InsightWhisper'
import { useStores } from '@/app/domains/stores/providers/StoreProvider'
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
import { formatCurrency, formatDate } from '@/app/lib/formatters'
import { useBusiness } from '@/app/components/BusinessProvider'
import { OrderActionMenu } from './OrderActionMenu'
import { toast } from 'sonner'
import { useReceiptPrinter } from '@/app/hooks/useReceiptPrinter'
import { format } from 'date-fns'
import { useCreatePaymentLink } from '@/app/domains/checkout/hooks/usePaymentLinks'
import { PaymentLinkDialog } from '@/app/domains/checkout/components/PaymentLinkDialog'

export function OrdersView() {
    const isMobile = useIsMobile()
    const { activeBusiness } = useBusiness()
    const { currentStore, stores } = useStores()
    const [page, setPage] = React.useState(1)
    const [search, setSearch] = React.useState("")
    const [selectedFilters, setSelectedFilters] = React.useState<string[]>([])
    const [startDate, setStartDate] = React.useState<string | undefined>()
    const [endDate, setEndDate] = React.useState<string | undefined>()
    const [viewingOrder, setViewingOrder] = React.useState<Order | null>(null)
    const [recordingPaymentOrder, setRecordingPaymentOrder] = React.useState<Order | null>(null)
    const [paymentLinkDialogOpen, setPaymentLinkDialogOpen] = React.useState(false)
    const [generatedPaymentLink, setGeneratedPaymentLink] = React.useState<string | null>(null)
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

    const limit = 10
    const {
        orders,
        meta,
        summary,
        isLoading,
        error,
        refetch,
        updateOrder,
        isUpdating,
        deleteOrder,
        isDeleting,
        requeryOrder,
        isRequerying,
        generateReceipt,
        isGeneratingReceipt
    } = useOrders(page, limit, {
        search: debouncedSearch,
        status: selectedFilters.filter(f => f.startsWith('S:')).map(f => f.slice(2)) as OrderStatus[],
        paymentStatus: selectedFilters.filter(f => f.startsWith('P:')).map(f => f.slice(2)) as PaymentStatus[],
        automation: selectedFilters.filter(f => f.startsWith('A:')).map(f => f.slice(2)),
        startDate,
        endDate,
        storeId: currentStore?.id
    })

    const { printReceipt } = useReceiptPrinter()
    const createPaymentLink = useCreatePaymentLink()

    const handleGeneratePaymentLink = React.useCallback(async (order: Order) => {
        setPaymentLinkDialogOpen(true)
        setGeneratedPaymentLink(null)
        try {
            const result = await createPaymentLink.mutateAsync({
                targetType: 'SALE',
                targetId: order.id,
            })
            const reference = result?.reference || (result as any)?.data?.reference
            if (reference) {
                const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
                setGeneratedPaymentLink(`${baseUrl}/pay/${reference}`)
            }
        } catch {
            // Error handled by the hook's onError
        }
    }, [createPaymentLink])

    const handlePrintReceipt = React.useCallback(async (order: Order) => {
        if (!activeBusiness) return

        const receiptData = {
            businessName: activeBusiness.name,
            businessAddress: undefined,
            businessPhone: undefined,
            businessLogo: activeBusiness.logo,
            orderId: order.id,
            shortCode: order.shortCode,
            date: order.date || format(new Date(), 'dd MMM yyyy, HH:mm'),
            customerName: order.customer,
            items: order.items?.map(item => ({
                productName: item.productName,
                quantity: Number(item.quantity),
                price: Number(item.price),
                total: Number(item.total)
            })) || [],
            subtotal: Number(order.subtotalAmount || order.totalAmount),
            discountAmount: order.discountAmount ? Number(order.discountAmount) : undefined,
            totalAmount: Number(order.totalAmount),
            amountPaid: Number(order.amountPaid),
            remainingAmount: Number(order.remainingAmount || 0),
            paymentMethod: order.paymentMethod,
            currency: order.currency || activeBusiness.currency || 'NGN'
        }

        await printReceipt(receiptData, order.id)
    }, [activeBusiness, printReceipt])

    const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
        await updateOrder({ id: orderId, updates: { status } })
    }

    const totalPages = meta?.lastPage || (meta as any)?.last_page || 1

    const filterGroups = [
        {
            title: "Order Status",
            options: [
                { label: "Completed", value: "S:COMPLETED" },
                { label: "Pending", value: "S:PENDING" },
                { label: "Cancelled", value: "S:CANCELLED" },
                { label: "Refunded", value: "S:REFUNDED" },
            ]
        },
        {
            title: "Payment Status",
            options: [
                { label: "Paid", value: "P:PAID" },
                { label: "Partial", value: "P:PARTIAL" },
                { label: "Pending", value: "P:PENDING" },
            ]
        },
        {
            title: "Type",
            options: [
                { label: "Automated", value: "A:AUTOMATED" },
                { label: "Manual", value: "A:MANUAL" },
            ]
        }
    ]

    // Simplified filter logic handled by FilterPopover internally
    // handleFilterChange removed in favor of direct setSelectedFilters usage

    const columns: any[] = [
        {
            key: 'customer',
            header: 'Customer',
            width: '200px',
            cellClassName: 'whitespace-normal',
            render: (value: string, row: Order) => {
                const orderId = row.shortCode || row.id.substring(0, 6)
                return (
                    <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-brand-deep dark:text-brand-cream">{value}</span>
                        <div className="group/id flex items-center gap-1.5">
                            <span className="font-mono text-[11px] text-brand-accent/40 dark:text-brand-cream/40 uppercase">
                                #{orderId}
                            </span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    navigator.clipboard.writeText(orderId)
                                    toast.success('Order ID copied')
                                }}
                                className="opacity-0 group-hover/id:opacity-100 transition-opacity p-0.5 rounded hover:bg-brand-deep/5 dark:hover:bg-white/10"
                                title="Copy Order ID"
                            >
                                <Copy className="w-3 h-3 text-brand-accent/40 dark:text-brand-cream/40" />
                            </button>
                        </div>
                    </div>
                )
            }
        },
        {
            key: 'items',
            header: 'Summary',
            width: 'auto',
            cellClassName: 'whitespace-normal min-w-[200px]',
            render: (_: any, row: Order) => <span className="text-xs text-brand-accent/60 dark:text-brand-cream/60">{row.summary}</span>
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
        {
            key: 'date',
            header: 'Time',
            width: '120px',
            render: (_: any, order: Order) => (
                <span className="text-xs text-brand-accent/60 dark:text-brand-cream/60">{formatDate(order.date, 'MMM d, h:mm a')}</span>
            )
        },
        {
            key: 'actions' as any,
            header: '',
            width: '48px',
            render: (_: any, row: Order) => (
                <OrderActionMenu
                    order={row}
                    onViewDetails={setViewingOrder}
                    onUpdateStatus={handleUpdateStatus}
                    onRequery={requeryOrder}
                    onGenerateReceipt={generateReceipt}
                    onPrintReceipt={handlePrintReceipt}
                    onRecordPayment={setRecordingPaymentOrder}
                    onGeneratePaymentLink={handleGeneratePaymentLink}
                />
            )
        }
    ]

    const intelligenceWhisper = orders.some(o => o.status === 'PENDING')
        ? `You have **${orders.filter(o => o.status === 'PENDING').length} pending orders** awaiting fulfillment. Ensuring prompt delivery builds customer trust.`
        : `All orders have been successfully fulfilled. Your operations are running smoothly today.`

    const stats = [
        {
            label: "Total Revenue",
            value: formatCurrency((summary as any)?.completedRevenue ?? 0, { currency: activeBusiness?.currency || 'NGN' }),
            icon: TrendingUp,
            color: "brand-gold",
            description: "Revenue from selected filters"
        },
        {
            label: "Total Orders",
            value: summary?.totalOrders ?? meta?.total ?? '—',
            icon: ShoppingBag,
            color: "brand-green",
            description: "Count of filtered orders"
        },
        {
            label: "Avg. Order Value",
            value: formatCurrency(summary?.averageOrderValue ?? 0, { currency: activeBusiness?.currency || 'NGN' }),
            icon: Receipt,
            color: "brand-gold",
            description: "Average revenue per order"
        },
        {
            label: "Pending Fulfillment",
            value: summary?.pendingOrdersCount ?? '—',
            icon: Clock,
            color: "brand-gold",
            description: "Awaiting fulfillment"
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
                                className="rounded-full bg-brand-gold text-brand-deep hover:bg-brand-gold/90 hover:scale-105 transition-all shadow-xl h-12 px-7 font-serif font-semibold tracking-wide animate-pulse-glow"
                            >
                                <ShoppingBag className="w-4 h-4 mr-2" />
                                Record Sale
                            </Button>
                        </Link>
                    }
                />

                <InsightWhisper insight={intelligenceWhisper} />

                {/* Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, i) => (
                        <GlassCard key={i} className="p-4 flex flex-col gap-3 relative overflow-hidden group border-brand-green/10 bg-white dark:bg-white/5 dark:border-white/5 shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="absolute -right-2 -top-2 p-3 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity rotate-12 group-hover:rotate-0 duration-700">
                                <stat.icon className="w-20 h-20 dark:text-brand-cream" />
                            </div>

                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-110",
                                    stat.color === "brand-green"
                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                        : "bg-brand-gold/10 text-brand-gold"
                                )}>
                                    <stat.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-brand-accent/40 dark:text-brand-cream/40 uppercase tracking-[0.15em]">{stat.label}</p>
                                    <p className="text-xl font-serif font-semibold text-brand-deep dark:text-brand-cream truncate">{stat.value}</p>
                                </div>
                            </div>

                            {stat.description && (
                                <p className="text-[10px] text-brand-accent/50 dark:text-brand-cream/50 group-hover:text-brand-accent/70 dark:group-hover:text-brand-cream/70 transition-colors">
                                    {stat.description}
                                </p>
                            )}
                        </GlassCard>
                    ))}
                </div>

                {/* Filters */}
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-accent/40 dark:text-brand-cream/40 ml-1">
                            {isLoading ? "Fetching Records..." : "Recent Transactions"}
                        </p>

                        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
                            <TableSearch
                                value={search}
                                onChange={(val) => { setSearch(val); setPage(1); }}
                                placeholder="Search customer or ID..."
                            />
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <FilterPopover
                                    groups={filterGroups}
                                    className="flex-1 md:flex-initial"
                                    selectedValues={selectedFilters}
                                    onSelectionChange={(values) => {
                                        setSelectedFilters(values)
                                        setPage(1)
                                    }}
                                    onClear={() => {
                                        setSelectedFilters([])
                                        setPage(1)
                                    }}
                                />
                                <DateRangePicker
                                    className="flex-1 md:flex-initial"
                                    value={{
                                        from: startDate ? new Date(startDate) : undefined,
                                        to: endDate ? new Date(endDate) : undefined
                                    }}
                                    onChange={(range) => {
                                        setStartDate(range?.from);
                                        setEndDate(range?.to);
                                        setPage(1);
                                    }}
                                    placeholder="Filter by date"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <OrdersSkeleton isMobile={isMobile} />
                ) : orders.length === 0 ? (
                    (() => {
                        const isFiltered = search !== "" ||
                            selectedFilters.length > 0 ||
                            startDate !== undefined ||
                            endDate !== undefined;

                        return (
                            <div className="bg-brand-cream/40 dark:bg-white/5 border border-dashed border-brand-accent/10 dark:border-white/10 rounded-3xl flex flex-col items-center justify-center py-24 px-8 text-center text-brand-deep dark:text-brand-cream">
                                <div className="h-20 w-20 rounded-full bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center mb-6">
                                    {isFiltered ? (
                                        <FilterX className="h-10 w-10 opacity-20" />
                                    ) : (
                                        <ShoppingBag className="h-10 w-10 opacity-20 text-brand-gold" />
                                    )}
                                </div>
                                <h3 className="text-xl font-serif font-medium mb-2">
                                    {isFiltered ? "No orders match your criteria" : "No orders yet"}
                                </h3>
                                <p className="text-sm text-brand-accent/40 dark:text-brand-cream/40 mb-8 max-w-sm">
                                    {isFiltered
                                        ? "We couldn't find any orders matching your current filters. Try adjusting your search or filtering by a different status."
                                        : "Your sales pipeline is empty. Once you record a sale, it will appear here for you to track and manage."}
                                </p>
                                {isFiltered ? (
                                    <Button
                                        variant="outline"
                                        className="rounded-full px-8 h-12"
                                        onClick={() => {
                                            setSearch("")
                                            setSelectedFilters([])
                                            setStartDate(undefined)
                                            setEndDate(undefined)
                                            setPage(1)
                                        }}
                                    >
                                        Clear All Filters
                                    </Button>
                                ) : (
                                    <Link href="/orders/sale">
                                        <Button
                                            variant="outline"
                                            className="rounded-full px-8 h-12 border-brand-accent/20 dark:border-white/20 hover:bg-brand-accent/5 dark:hover:bg-white/5"
                                        >
                                            <ShoppingBag className="w-4 h-4 mr-2 text-brand-gold" />
                                            Record Your First Sale
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        )
                    })()
                ) : isMobile ? (
                    <div className="space-y-4">
                        {orders.map((order, index) => (
                            <ListCard
                                key={order.id}
                                title={order.customer}
                                subtitle={order.id.startsWith('#') ? order.id : `#${order.id.slice(0, 8)}`}
                                meta={formatDate(order.date, 'MMM d, h:mm a')}
                                status={statusColorMap[order.status?.toUpperCase() || '']?.label || order.status}
                                statusColor={statusColorMap[order.status?.toUpperCase() || '']?.color || 'neutral'}
                                value={formatCurrency(order.totalAmount, { currency: order.currency || activeBusiness?.currency || 'NGN' })}
                                valueLabel={(order.isAutomated || order.paymentMethod === 'TRANSFER') ? 'Bank Transfer' : order.paymentMethod?.replace('_', ' ').toLowerCase()}
                                delay={index * 0.05}
                                actions={
                                    <OrderActionMenu
                                        order={order}
                                        onViewDetails={setViewingOrder}
                                        onUpdateStatus={handleUpdateStatus}
                                        onRequery={requeryOrder}
                                        onGenerateReceipt={generateReceipt}
                                        onPrintReceipt={handlePrintReceipt}
                                        onRecordPayment={setRecordingPaymentOrder}
                                    />
                                }
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
                                data={orders}
                                isLoading={isLoading}
                                pageSize={limit}
                                manualPagination={{
                                    currentPage: page,
                                    totalPages: totalPages,
                                    onPageChange: (p) => setPage(p),
                                    total: meta?.total
                                }}
                            />
                        </GlassCard>
                    </div>
                )}

                <OrderDetailsDrawer
                    order={viewingOrder}
                    open={!!viewingOrder}
                    onOpenChange={(open) => !open && setViewingOrder(null)}
                    onUpdateStatus={handleUpdateStatus}
                    onDelete={async (id) => { await deleteOrder(id) }}
                    onPrintReceipt={handlePrintReceipt}
                    onGeneratePaymentLink={handleGeneratePaymentLink}
                    isUpdating={isUpdating}
                    isDeleting={isDeleting}
                />
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
                                className="h-16 w-16 rounded-full bg-brand-gold text-brand-deep shadow-2xl hover:scale-110 active:scale-95 transition-all border-4 border-brand-cream dark:border-brand-deep animate-pulse-glow"
                            >
                                <ShoppingBag className="w-7 h-7" />
                            </Button>
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>

            <PaymentLinkDialog
                isOpen={paymentLinkDialogOpen}
                onClose={() => setPaymentLinkDialogOpen(false)}
                link={generatedPaymentLink}
                isLoading={createPaymentLink.isPending}
            />

            <RecordPaymentDrawer
                order={recordingPaymentOrder}
                open={!!recordingPaymentOrder}
                onOpenChange={(open) => !open && setRecordingPaymentOrder(null)}
                isSubmitting={isUpdating}
                onSuccess={async (amount, method) => {
                    if (recordingPaymentOrder) {
                        const newAmountPaid = Number(recordingPaymentOrder.amountPaid || 0) + amount
                        const total = Number(recordingPaymentOrder.totalAmount)
                        const newStatus = newAmountPaid >= total ? 'COMPLETED' : recordingPaymentOrder.status

                        await updateOrder({
                            id: recordingPaymentOrder.id,
                            updates: {
                                amountPaid: newAmountPaid,
                                paymentMethod: method as any,
                                status: newStatus as any
                            }
                        })
                        toast.success(`Recorded ${formatCurrency(amount, { currency: recordingPaymentOrder.currency || 'NGN' })} payment`)
                    }
                }}
            />
        </PageTransition>
    )
}
