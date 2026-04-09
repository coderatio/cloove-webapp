"use client"

import * as React from 'react'
import DataTable from '@/app/components/DataTable'
import { useIsMobile } from '@/app/hooks/useMediaQuery'
import { PageTransition } from '@/app/components/layout/page-transition'
import { ListCard } from '@/app/components/ui/list-card'
import { GlassCard } from '@/app/components/ui/glass-card'
import { ShoppingBag, TrendingUp, Trash2, ReceiptText, AlertCircle, RefreshCw, FilterX, CheckCircle2, XCircle, Loader2, Clock, Copy, MoreVertical, Check, Eye, Receipt, UtensilsCrossed, ChefHat, ShoppingCart } from 'lucide-react'
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
import { useKitchenTicketActions } from '@/app/domains/restaurant/hooks/useRestaurantOps'
import { useDebounce } from '@/app/hooks/useDebounce'
import { OrdersSkeleton } from './OrdersSkeleton'
import { Pagination } from '@/app/components/shared/Pagination'
import { formatCurrency, formatDate, formatCompactCurrency, formatCompactNumber } from '@/app/lib/formatters'
import { CurrencyText } from '@/app/components/shared/CurrencyText'
import { useBusiness } from '@/app/components/BusinessProvider'
import { useLayoutPresetId, usePresetPageCopy } from "@/app/domains/workspace/hooks/usePresetPageCopy"
import { useAcademicCalendar } from "@/app/domains/school/hooks/useAcademicCalendar"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/app/components/ui/select"
import { OrderActionMenu } from './OrderActionMenu'
import { toast } from 'sonner'
import { useReceiptPrinter } from '@/app/hooks/useReceiptPrinter'
import { format } from 'date-fns'
import { useCreatePaymentLink } from '@/app/domains/checkout/hooks/usePaymentLinks'
import { PaymentLinkDialog } from '@/app/domains/checkout/components/PaymentLinkDialog'
import { Markdown } from '@/app/components/ui/markdown'
import { PresetOrdersQuickStrip } from '@/app/domains/workspace/components/preset-feature-modules/PresetOrdersQuickStrip'
import { SchoolFeeRecordDrawer } from '@/app/domains/school/components/SchoolFeeRecordDrawer'

export function OrdersView() {
    const isMobile = useIsMobile()
    const { activeBusiness } = useBusiness()
    const layoutPreset = useLayoutPresetId()
    const pageCopy = usePresetPageCopy()
    const oui = pageCopy.ordersUi
    const { data: academicCal } = useAcademicCalendar()
    const { currentStore, stores } = useStores()
    const [page, setPage] = React.useState(1)
    const [search, setSearch] = React.useState("")
    const [selectedFilters, setSelectedFilters] = React.useState<string[]>([])
    const [startDate, setStartDate] = React.useState<string | undefined>()
    const [endDate, setEndDate] = React.useState<string | undefined>()
    const [academicTermFilter, setAcademicTermFilter] = React.useState<string>("")
    const [viewingOrder, setViewingOrder] = React.useState<Order | null>(null)
    const [recordingPaymentOrder, setRecordingPaymentOrder] = React.useState<Order | null>(null)
    const [paymentLinkDialogOpen, setPaymentLinkDialogOpen] = React.useState(false)
    const [generatedPaymentLink, setGeneratedPaymentLink] = React.useState<string | null>(null)
    const [schoolFeeDrawerOpen, setSchoolFeeDrawerOpen] = React.useState(false)
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
        serviceMode: selectedFilters.find(f => f.startsWith('M:'))?.slice(2),
        startDate,
        endDate,
        storeId: currentStore?.id,
        academicTermId: layoutPreset === "school" && academicTermFilter ? academicTermFilter : undefined,
    })

    const { printReceipt } = useReceiptPrinter()
    const kitchenAction = useKitchenTicketActions()
    const handleAdvanceKitchen = React.useCallback(
        (ticketId: string, status: 'queued' | 'preparing' | 'ready' | 'served') =>
            kitchenAction.mutateAsync({ id: ticketId, status }),
        [kitchenAction]
    )
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
            date: order.date || new Date().toISOString(),
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

    const fo = oui.filterOptions
    const filterGroups = React.useMemo(
        () => [
            {
                title: oui.filterGroups.orderStatus,
                options: [
                    { label: fo.orderStatus.completed, value: "S:COMPLETED" },
                    { label: fo.orderStatus.pending, value: "S:PENDING" },
                    { label: fo.orderStatus.cancelled, value: "S:CANCELLED" },
                    { label: fo.orderStatus.refunded, value: "S:REFUNDED" },
                ],
            },
            {
                title: oui.filterGroups.paymentStatus,
                options: [
                    { label: fo.paymentStatus.paid, value: "P:PAID" },
                    { label: fo.paymentStatus.partial, value: "P:PARTIAL" },
                    { label: fo.paymentStatus.pending, value: "P:PENDING" },
                ],
            },
            {
                title: oui.filterGroups.type,
                options: [
                    { label: fo.type.automated, value: "A:AUTOMATED" },
                    { label: fo.type.manual, value: "A:MANUAL" },
                ],
            },
            ...(layoutPreset === "restaurant" ? [
                {
                    title: "Service Mode",
                    options: [
                        { label: "Dine-In", value: "M:DINE_IN" },
                        { label: "Takeaway", value: "M:TAKEAWAY" },
                    ],
                },
            ] : []),
        ],
        [oui.filterGroups, fo, layoutPreset]
    )

    // Simplified filter logic handled by FilterPopover internally
    // handleFilterChange removed in favor of direct setSelectedFilters usage

    const columns: any[] = React.useMemo(() => {
        const termColumn =
            layoutPreset === "school" && oui.table.term
                ? [
                      {
                          key: "academicTerm",
                          header: oui.table.term,
                          width: "140px",
                          cellClassName: "whitespace-normal",
                          render: (_: unknown, row: Order) => {
                              const t = row.academicTerm
                              if (!t) {
                                  return (
                                      <span className="text-xs text-brand-accent/45 dark:text-brand-cream/45">—</span>
                                  )
                              }
                              const sess = t.session?.name
                              return (
                                  <span className="text-xs text-brand-accent/75 dark:text-brand-cream/75">
                                      {sess ? `${sess} · ` : ""}
                                      {t.name}
                                  </span>
                              )
                          },
                      },
                  ]
                : []

        return [
        {
            key: 'customer',
            header: oui.table.customer,
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
                                    toast.success(oui.toastOrderIdCopied)
                                }}
                                className="opacity-0 group-hover/id:opacity-100 transition-opacity p-0.5 rounded hover:bg-brand-deep/5 dark:hover:bg-white/10"
                                title={oui.copyOrderIdTitle}
                            >
                                <Copy className="w-3 h-3 text-brand-accent/40 dark:text-brand-cream/40" />
                            </button>
                        </div>
                        {layoutPreset === "restaurant" && row.serviceMode && (
                            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                {row.serviceMode === "DINE_IN" ? (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-500/8 text-blue-700 dark:text-blue-300 text-[9px] font-bold uppercase tracking-wider">
                                        <UtensilsCrossed className="w-2.5 h-2.5" />
                                        {row.tableLabel ?? "Dine-In"}
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/8 text-amber-700 dark:text-amber-300 text-[9px] font-bold uppercase tracking-wider">
                                        <ShoppingCart className="w-2.5 h-2.5" />
                                        Takeaway
                                    </span>
                                )}
                                {row.kitchenTicketStatus && (() => {
                                    const cfg = {
                                        queued:    { label: "Queued",    className: "bg-amber-500/8 text-amber-700 dark:text-amber-300" },
                                        preparing: { label: "Preparing", className: "bg-blue-500/8 text-blue-700 dark:text-blue-300" },
                                        ready:     { label: "Ready",     className: "bg-emerald-500/8 text-emerald-700 dark:text-emerald-300" },
                                        served:    { label: "Served",    className: "bg-brand-accent/8 text-brand-accent/60 dark:text-brand-cream/50" },
                                    }[row.kitchenTicketStatus]
                                    return (
                                        <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider", cfg.className)}>
                                            <ChefHat className="w-2.5 h-2.5" />
                                            {cfg.label}
                                        </span>
                                    )
                                })()}
                            </div>
                        )}
                    </div>
                )
            }
        },
        {
            key: 'items',
            header: oui.table.summary,
            width: 'auto',
            cellClassName: 'whitespace-normal min-w-[200px]',
            render: (_: any, row: Order) => <span className="text-xs text-brand-accent/60 dark:text-brand-cream/60">{row.summary}</span>
        },
        ...termColumn,
        {
            key: 'totalAmount',
            header: oui.table.total,
            width: '120px',
            render: (value: number | string, row: Order) => (
                <span className="text-sm font-bold text-brand-deep dark:text-brand-cream whitespace-nowrap">
                    <CurrencyText value={formatCurrency(value, { currency: row.currency || activeBusiness?.currency || 'NGN' })} />
                </span>
            )
        },
        {
            key: 'status',
            header: oui.table.status,
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
            header: oui.table.time,
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
                    onAdvanceKitchen={handleAdvanceKitchen}
                />
            )
        }
    ]
    }, [layoutPreset, oui, activeBusiness?.currency, handlePrintReceipt, handleGeneratePaymentLink, handleUpdateStatus, requeryOrder, generateReceipt, handleAdvanceKitchen])

    const pendingCount = summary?.pendingOrdersCount ?? 0
    const pendingOutstandingAmount = summary?.pendingOutstandingAmount ?? 0
    const intelligenceWhisper =
        pendingCount > 0 ? oui.whisperPending(pendingCount) : oui.whisperClear

    const stats = [
        {
            label: oui.stats.totalRevenue,
            value: <CurrencyText value={formatCompactCurrency((summary as any)?.completedRevenue ?? 0, { currency: activeBusiness?.currency || 'NGN' })} />,
            icon: TrendingUp,
            color: "brand-gold",
        },
        {
            label: oui.stats.totalOrders,
            value: formatCompactNumber(summary?.totalOrders ?? meta?.total ?? 0),
            icon: ShoppingBag,
            color: "brand-green",
        },
        {
            label: oui.stats.avgOrderValue,
            value: <CurrencyText value={formatCompactCurrency(summary?.averageOrderValue ?? 0, { currency: activeBusiness?.currency || 'NGN' })} />,
            icon: Receipt,
            color: "brand-gold",
        },
        {
            label: oui.stats.pendingFulfillment,
            value:
                layoutPreset === "school"
                    ? <CurrencyText value={formatCompactCurrency(pendingOutstandingAmount, { currency: activeBusiness?.currency || 'NGN' })} />
                    : formatCompactNumber(summary?.pendingOrdersCount ?? 0),
            icon: Clock,
            color: "brand-gold",
            isPending: layoutPreset === "school" ? pendingOutstandingAmount > 0 : pendingCount > 0
        }
    ]

    if (error) {
        return (
            <PageTransition>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                    <div className="h-16 w-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-4">
                        <AlertCircle className="h-8 w-8" />
                    </div>
                    <h2 className="text-xl font-serif font-medium mb-2">{oui.errorLoadTitle}</h2>
                    <p className="text-brand-accent/60 dark:text-brand-cream/60 max-w-sm mb-6">
                        {error.message || oui.errorLoadHint}
                    </p>
                    <Button onClick={() => refetch()} className="rounded-full px-8">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {oui.retry}
                    </Button>
                </div>
            </PageTransition>
        )
    }

    return (
        <PageTransition>
            <div className="max-w-5xl mx-auto space-y-8 pb-24">
                <ManagementHeader
                    title={pageCopy.orders.title}
                    description={pageCopy.orders.descriptionWithStore(
                        currentStore?.name || oui.storeDescriptionFallback
                    )}
                    extraActions={
                        layoutPreset === "school" ? (
                            <Button
                                className="hidden md:flex rounded-full bg-brand-gold text-brand-deep hover:bg-brand-gold/90 hover:scale-105 transition-all shadow-xl h-12 px-7 font-serif font-semibold tracking-wide animate-pulse-glow"
                                onClick={() => setSchoolFeeDrawerOpen(true)}
                            >
                                <ShoppingBag className="w-4 h-4 mr-2" />
                                {oui.recordSale}
                            </Button>
                        ) : (
                            <Link href="/orders/sale" className="hidden md:block">
                                <Button
                                    className="rounded-full bg-brand-gold text-brand-deep hover:bg-brand-gold/90 hover:scale-105 transition-all shadow-xl h-12 px-7 font-serif font-semibold tracking-wide animate-pulse-glow"
                                >
                                    <ShoppingBag className="w-4 h-4 mr-2" />
                                    {oui.recordSale}
                                </Button>
                            </Link>
                        )
                    }
                />

                <PresetOrdersQuickStrip />

                <InsightWhisper insight={intelligenceWhisper} />

                {oui.retailCheckoutBanner.trim() ? (
                    <div className="rounded-2xl border border-brand-gold/20 bg-brand-gold/5 px-4 py-3 text-sm text-brand-deep/90 dark:text-brand-cream/90 md:px-5">
                        <Markdown content={oui.retailCheckoutBanner} />
                    </div>
                ) : null}

                {/* Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {stats.map((stat, i) => (
                        <GlassCard
                            key={i}
                            className="p-6 flex flex-col justify-between relative overflow-hidden group border-brand-green/5 bg-white/40 dark:bg-white/5 dark:border-white/5 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-500 min-h-[140px]"
                        >
                            {/* Decorative ghost icon */}
                            <div className="absolute -right-4 -bottom-4 p-3 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-110 transition-all rotate-12 group-hover:rotate-0 duration-1000">
                                <stat.icon className="w-24 h-24 dark:text-brand-cream" />
                            </div>

                            <div className="relative z-10 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className={cn(
                                        "h-11 w-11 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:rotate-6 shadow-sm",
                                        stat.color === "brand-green"
                                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                            : "bg-brand-gold/10 text-brand-gold"
                                    )}>
                                        <stat.icon className="h-5 w-5" />
                                    </div>
                                    
                                    {(stat as any).isPending && (
                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 animate-pulse">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                            <span className="text-[8px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">{oui.actionRequired}</span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <p className="text-[10px] font-black text-brand-accent/30 dark:text-brand-cream/30 uppercase tracking-[0.2em] mb-1 leading-none">{stat.label}</p>
                                    <div className="text-3xl font-serif font-black text-brand-deep dark:text-brand-cream tracking-tighter leading-none">
                                        {stat.value}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Subtle hover accent line */}
                            <div className={cn(
                                "absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-700",
                                stat.color === "brand-green" ? "bg-emerald-500/30" : "bg-brand-gold/30"
                            )} />
                        </GlassCard>
                    ))}
                </div>

                {/* Filters */}
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-accent/40 dark:text-brand-cream/40 ml-1">
                            {isLoading ? oui.sectionTitleLoading : oui.sectionTitle}
                        </p>

                        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
                            <TableSearch
                                value={search}
                                onChange={(val) => { setSearch(val); setPage(1); }}
                                placeholder={oui.searchPlaceholder}
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
                                    placeholder={oui.dateFilterPlaceholder}
                                />
                                {layoutPreset === "school" && (academicCal?.sessions?.length ?? 0) > 0 ? (
                                    <Select
                                        value={academicTermFilter || "__all__"}
                                        onValueChange={(v) => {
                                            setAcademicTermFilter(v === "__all__" ? "" : v)
                                            setPage(1)
                                        }}
                                    >
                                        <SelectTrigger className="w-full md:w-[220px]">
                                            <SelectValue placeholder="Term" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__all__">All terms</SelectItem>
                                            {(academicCal?.sessions ?? []).flatMap((s) =>
                                                (s.terms ?? []).map((t) => (
                                                    <SelectItem key={t.id} value={t.id}>
                                                        {s.name} · {t.name}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                ) : null}
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
                            endDate !== undefined ||
                            (layoutPreset === "school" && !!academicTermFilter);

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
                                    {isFiltered ? oui.emptyFilteredTitle : oui.emptyUnfilteredTitle}
                                </h3>
                                <p className="text-sm text-brand-accent/40 dark:text-brand-cream/40 mb-8 max-w-sm">
                                    {isFiltered ? oui.emptyFilteredHint : oui.emptyUnfilteredHint}
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
                                            setAcademicTermFilter("")
                                            setPage(1)
                                        }}
                                    >
                                        {oui.clearFilters}
                                    </Button>
                                ) : (
                                    <Link href="/orders/sale">
                                        <Button
                                            variant="outline"
                                            className="rounded-full px-8 h-12 border-brand-accent/20 dark:border-white/20 hover:bg-brand-accent/5 dark:hover:bg-white/5"
                                        >
                                            <ShoppingBag className="w-4 h-4 mr-2 text-brand-gold" />
                                            {oui.recordFirstSale}
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
                                subtitle={
                                    <span className="flex items-center gap-1.5 flex-wrap">
                                        <span>{order.id.startsWith('#') ? order.id : `#${order.id.slice(0, 8)}`}</span>
                                        {layoutPreset === "restaurant" && order.serviceMode === "DINE_IN" && (
                                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-blue-500/8 text-blue-700 dark:text-blue-300 text-[9px] font-bold uppercase tracking-wider">
                                                <UtensilsCrossed className="w-2.5 h-2.5" />
                                                {order.tableLabel ?? "Dine-In"}
                                            </span>
                                        )}
                                        {layoutPreset === "restaurant" && order.serviceMode === "TAKEAWAY" && (
                                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-500/8 text-amber-700 dark:text-amber-300 text-[9px] font-bold uppercase tracking-wider">
                                                <ShoppingCart className="w-2.5 h-2.5" />
                                                Takeaway
                                            </span>
                                        )}
                                        {layoutPreset === "restaurant" && order.kitchenTicketStatus && (() => {
                                            const cfg = {
                                                queued:    { label: "Queued",    className: "bg-amber-500/8 text-amber-700 dark:text-amber-300" },
                                                preparing: { label: "Preparing", className: "bg-blue-500/8 text-blue-700 dark:text-blue-300" },
                                                ready:     { label: "Ready",     className: "bg-emerald-500/8 text-emerald-700 dark:text-emerald-300" },
                                                served:    { label: "Served",    className: "bg-brand-accent/8 text-brand-accent/60 dark:text-brand-cream/50" },
                                            }[order.kitchenTicketStatus]
                                            return (
                                                <span className={cn("inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider", cfg.className)}>
                                                    <ChefHat className="w-2.5 h-2.5" />
                                                    {cfg.label}
                                                </span>
                                            )
                                        })()}
                                    </span>
                                }
                                meta={formatDate(order.date, 'MMM d, h:mm a')}
                                status={statusColorMap[order.status?.toUpperCase() || '']?.label || order.status}
                                statusColor={statusColorMap[order.status?.toUpperCase() || '']?.color || 'neutral'}
                                value={<CurrencyText value={formatCurrency(order.totalAmount, { currency: order.currency || activeBusiness?.currency || 'NGN' })} />}
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
                                        onAdvanceKitchen={handleAdvanceKitchen}
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
                        {layoutPreset === "school" ? (
                            <Button
                                size="icon"
                                className="h-16 w-16 rounded-full bg-brand-gold text-brand-deep shadow-2xl hover:scale-110 active:scale-95 transition-all border-4 border-brand-cream dark:border-brand-deep animate-pulse-glow"
                                onClick={() => setSchoolFeeDrawerOpen(true)}
                            >
                                <ShoppingBag className="w-7 h-7" />
                            </Button>
                        ) : (
                            <Link href="/orders/sale">
                                <Button
                                    size="icon"
                                    className="h-16 w-16 rounded-full bg-brand-gold text-brand-deep shadow-2xl hover:scale-110 active:scale-95 transition-all border-4 border-brand-cream dark:border-brand-deep animate-pulse-glow"
                                >
                                    <ShoppingBag className="w-7 h-7" />
                                </Button>
                            </Link>
                        )}
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

            {layoutPreset === "school" && (
                <SchoolFeeRecordDrawer
                    open={schoolFeeDrawerOpen}
                    onOpenChange={setSchoolFeeDrawerOpen}
                />
            )}
        </PageTransition>
    )
}
