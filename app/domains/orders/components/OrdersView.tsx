"use client"

import * as React from 'react'
import DataTable from '@/app/components/DataTable'
import { useIsMobile } from '@/app/hooks/useMediaQuery'
import { PageTransition } from '@/app/components/layout/page-transition'
import { ListCard } from '@/app/components/ui/list-card'
import { GlassCard } from '@/app/components/ui/glass-card'
import { ShoppingBag, TrendingUp, Trash2, ReceiptText, AlertCircle, RefreshCw, FilterX, CheckCircle2, XCircle, Loader2, Clock, Copy, MoreVertical, Check, Eye, Receipt, UtensilsCrossed, ChefHat, ShoppingCart, User } from 'lucide-react'
import { Order, OrderStatus, PaymentStatus } from "../types"
import { OrderFilterPanel } from "./OrderFilterPanel"
import { ActiveFilterChips } from "./ActiveFilterChips"
import { RecordPaymentDrawer } from "./RecordPaymentDrawer"
import { OrderDetailsDrawer } from "./OrderDetailsDrawer"
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/app/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/app/components/ui/select'
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
import { useKitchenTicketActions, type KitchenTicket } from '@/app/domains/restaurant/hooks/useRestaurantOps'
import { useDebounce } from '@/app/hooks/useDebounce'
import { OrdersSkeleton } from './OrdersSkeleton'
import { Pagination } from '@/app/components/shared/Pagination'
import { formatCurrency, formatDate, formatCompactCurrency, formatCompactNumber } from '@/app/lib/formatters'
import { CurrencyText } from '@/app/components/shared/CurrencyText'
import { useBusiness } from '@/app/components/BusinessProvider'
import { useLayoutPresetId, usePresetPageCopy } from "@/app/domains/workspace/hooks/usePresetPageCopy"
import { useAcademicCalendar } from "@/app/domains/school/hooks/useAcademicCalendar"
import type { OrderFilterState, OrderFilterConfig } from "../types"
import { OrderActionMenu } from './OrderActionMenu'
import { toast } from 'sonner'
import { useReceiptPrinter } from '@/app/hooks/useReceiptPrinter'
import { format } from 'date-fns'
import { useCreatePaymentLink } from '@/app/domains/checkout/hooks/usePaymentLinks'
import { PaymentLinkDialog } from '@/app/domains/checkout/components/PaymentLinkDialog'
import { Markdown } from '@/app/components/ui/markdown'
import { PresetOrdersQuickStrip } from '@/app/domains/workspace/components/preset-feature-modules/PresetOrdersQuickStrip'
import { SchoolFeeRecordDrawer } from '@/app/domains/school/components/SchoolFeeRecordDrawer'

const KITCHEN_TICKET_BADGE: Record<
    'queued' | 'preparing' | 'ready' | 'served',
    { label: string; className: string }
> = {
    queued: {
        label: 'Queued',
        className: 'bg-amber-500/8 text-amber-700 dark:text-amber-300',
    },
    preparing: {
        label: 'Preparing',
        className: 'bg-blue-500/8 text-blue-700 dark:text-blue-300',
    },
    ready: {
        label: 'Ready',
        className: 'bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
    },
    served: {
        label: 'Served',
        className: 'bg-brand-accent/8 text-brand-accent/60 dark:text-brand-cream/50',
    },
}

const KITCHEN_INITIAL_STATUS_OPTIONS: Array<{ value: KitchenTicket["status"]; label: string }> = [
    { value: "queued", label: "Queued" },
    { value: "preparing", label: "Preparing" },
    { value: "ready", label: "Ready" },
    { value: "served", label: "Served" },
]

const KITCHEN_STATION_OPTIONS = [
    { value: "kitchen", label: "Kitchen" },
    { value: "grill", label: "Grill" },
    { value: "pastry", label: "Pastry" },
    { value: "pickup", label: "Pickup" },
    { value: "custom", label: "Enter manually" },
]

function kitchenTicketBadgeConfig(
    status: string | null | undefined
): { label: string; className: string } | null {
    if (status == null || String(status).trim() === '') return null
    const key = String(status).toLowerCase().trim() as keyof typeof KITCHEN_TICKET_BADGE
    if (key in KITCHEN_TICKET_BADGE) return KITCHEN_TICKET_BADGE[key]
    return {
        label: String(status).replace(/_/g, ' '),
        className: 'bg-brand-deep/8 text-brand-accent/70 dark:text-brand-cream/60',
    }
}

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
    const [filterState, setFilterState] = React.useState<OrderFilterState>({ selectedFilters: [] })

    const setFilters = React.useCallback((next: OrderFilterState) => {
        setFilterState(next)
        setPage(1)
    }, [])

    const clearFilters = React.useCallback(() => {
        setFilterState({ selectedFilters: [] })
        setPage(1)
    }, [])
    const [viewingOrder, setViewingOrder] = React.useState<Order | null>(null)
    const [recordingPaymentOrder, setRecordingPaymentOrder] = React.useState<Order | null>(null)
    const [paymentLinkDialogOpen, setPaymentLinkDialogOpen] = React.useState(false)
    const [generatedPaymentLink, setGeneratedPaymentLink] = React.useState<string | null>(null)
    const [schoolFeeDrawerOpen, setSchoolFeeDrawerOpen] = React.useState(false)
    const [kitchenOrder, setKitchenOrder] = React.useState<Order | null>(null)
    const [kitchenStation, setKitchenStation] = React.useState("kitchen")
    const [kitchenStationMode, setKitchenStationMode] = React.useState("kitchen")
    const [kitchenInitialStatus, setKitchenInitialStatus] =
        React.useState<KitchenTicket["status"]>("queued")
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
        isGeneratingReceipt,
    } = useOrders(page, limit, {
        search: debouncedSearch,
        status: filterState.selectedFilters.filter(f => f.startsWith('S:')).map(f => f.slice(2)) as OrderStatus[],
        paymentStatus: filterState.selectedFilters.filter(f => f.startsWith('P:')).map(f => f.slice(2)) as PaymentStatus[],
        automation: filterState.selectedFilters.filter(f => f.startsWith('A:')).map(f => f.slice(2)),
        serviceModes: filterState.selectedFilters.filter(f => f.startsWith('M:')).map(f => f.slice(2)),
        startDate: filterState.startDate,
        endDate: filterState.endDate,
        storeId: currentStore?.id,
        academicTermId: layoutPreset === "school" && filterState.academicTermId ? filterState.academicTermId : undefined,
    })

    const seenOrderIdsRef = React.useRef<Set<string> | null>(null)
    React.useEffect(() => {
        if (!orders.length) return
        const currentIds = new Set(orders.map((order) => order.id))
        if (!seenOrderIdsRef.current) {
            seenOrderIdsRef.current = currentIds
            return
        }

        const newAutomated = orders.find(
            (order) =>
                !seenOrderIdsRef.current?.has(order.id) &&
                (order.isAutomated || order.channel === "STOREFRONT" || order.channel === "WHATSAPP")
        )
        seenOrderIdsRef.current = currentIds
        if (!newAutomated) return

        try {
            const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext
            if (AudioContextCtor) {
                const audio = new AudioContextCtor()
                const oscillator = audio.createOscillator()
                const gain = audio.createGain()
                oscillator.connect(gain)
                gain.connect(audio.destination)
                oscillator.frequency.value = 880
                gain.gain.value = 0.05
                oscillator.start()
                oscillator.stop(audio.currentTime + 0.35)
            }
        } catch {
            // Browsers may block sound until the page has user activation.
        }

        toast.info(`New order${newAutomated.shortCode ? ` #${newAutomated.shortCode}` : ""}`, {
            description: "Open the order to stop checking it.",
            duration: Infinity,
            action: {
                label: "View",
                onClick: () => setViewingOrder(newAutomated),
            },
        })
    }, [orders])

    const { printReceipt } = useReceiptPrinter()
    const kitchenAction = useKitchenTicketActions()
    const kitchenSendCurrency = kitchenOrder?.currency ?? activeBusiness?.currency ?? "NGN"
    const kitchenSendLineItems = kitchenOrder?.items?.filter(Boolean) ?? []
    const handleAdvanceKitchen = React.useCallback(
        (ticketId: string, status: 'queued' | 'preparing' | 'ready' | 'served') =>
            kitchenAction.advance.mutateAsync({ id: ticketId, status }),
        [kitchenAction.advance]
    )
    const openSendToKitchenDialog = React.useCallback((order: Order) => {
        setKitchenOrder(order)
        setKitchenStation("kitchen")
        setKitchenStationMode("kitchen")
        setKitchenInitialStatus(order.status === "COMPLETED" ? "preparing" : "queued")
    }, [])

    const closeSendToKitchenDialog = React.useCallback(() => {
        setKitchenOrder(null)
        setKitchenStation("kitchen")
        setKitchenStationMode("kitchen")
        setKitchenInitialStatus("queued")
    }, [])

    const handleCreateKitchenTicket = React.useCallback(
        async () => {
            if (!kitchenOrder) return

            const result = await kitchenAction.create.mutateAsync({
                saleId: kitchenOrder.id,
                station: kitchenStation.trim() || "kitchen",
                status: kitchenInitialStatus,
            })
            const notification = result?.notification
            if (notification?.status === "sent") {
                toast.success(`Sent to kitchen. WhatsApp sent${notification.customerName ? ` to ${notification.customerName}` : ""}.`)
            } else if (notification?.reason && notification.reason !== "auto_send_disabled") {
                toast.success("Sent to kitchen. WhatsApp not sent.")
            } else {
                toast.success("Sent to kitchen.")
            }
            closeSendToKitchenDialog()
        },
        [closeSendToKitchenDialog, kitchenAction.create, kitchenInitialStatus, kitchenOrder, kitchenStation]
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
    const filterConfig = React.useMemo<OrderFilterConfig>(
        () => ({
            groups: [
                {
                    title: oui.filterGroups.orderStatus,
                    type: 'multiselect' as const,
                    options: [
                        { label: fo.orderStatus.completed, value: "S:COMPLETED" },
                        { label: fo.orderStatus.pending, value: "S:PENDING" },
                        { label: fo.orderStatus.cancelled, value: "S:CANCELLED" },
                        { label: fo.orderStatus.refunded, value: "S:REFUNDED" },
                    ],
                },
                {
                    title: oui.filterGroups.paymentStatus,
                    type: 'multiselect' as const,
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
            showDateRange: true,
            dateRangePlaceholder: oui.dateFilterPlaceholder,
            termOptions: layoutPreset === "school"
                ? (academicCal?.sessions ?? []).flatMap(s =>
                    (s.terms ?? []).map(t => ({ id: t.id, label: `${s.name} · ${t.name}` }))
                )
                : undefined,
        }),
        [oui.filterGroups, fo, layoutPreset, academicCal]
    )

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
                            {layoutPreset === "restaurant" && (row.serviceMode || row.kitchenTicketStatus) && (
                                <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                    {row.serviceMode === "DINE_IN" ? (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-500/8 text-blue-700 dark:text-blue-300 text-[9px] font-bold uppercase tracking-wider">
                                            <UtensilsCrossed className="w-2.5 h-2.5" />
                                            {row.tableLabel ?? "Dine-In"}
                                        </span>
                                    ) : row.serviceMode === "TAKEAWAY" ? (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/8 text-amber-700 dark:text-amber-300 text-[9px] font-bold uppercase tracking-wider">
                                            <ShoppingCart className="w-2.5 h-2.5" />
                                            Takeaway
                                        </span>
                                    ) : null}
                                    {(() => {
                                        const cfg = kitchenTicketBadgeConfig(row.kitchenTicketStatus)
                                        if (!cfg) return null
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
                        onSendToKitchen={openSendToKitchenDialog}
                    />
                )
            }
        ]
    }, [layoutPreset, oui, activeBusiness?.currency, handlePrintReceipt, handleGeneratePaymentLink, handleUpdateStatus, requeryOrder, generateReceipt, handleAdvanceKitchen, openSendToKitchenDialog])

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
            <div className="max-w-6xl mx-auto space-y-8 pb-24">
                <ManagementHeader
                    title={pageCopy.orders.title}
                    description={pageCopy.orders.descriptionWithStore(
                        currentStore?.name || oui.storeDescriptionFallback
                    )}
                    extraActions={
                        layoutPreset === "school" ? (
                            <Button
                                className="hidden h-11 rounded-full bg-primary px-5 font-semibold text-white shadow-sm transition-colors hover:bg-primary/92 hover:text-white md:flex [&_svg]:text-white"
                                onClick={() => setSchoolFeeDrawerOpen(true)}
                            >
                                <ShoppingBag className="w-4 h-4 mr-2" />
                                {oui.recordSale}
                            </Button>
                        ) : (
                            <Link href="/orders/sale" className="hidden md:block">
                                <Button
                                    className="h-11 rounded-full bg-primary px-5 font-semibold text-white shadow-sm transition-colors hover:bg-primary/92 hover:text-white [&_svg]:text-white"
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
                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-accent/40 dark:text-brand-cream/40 ml-1 shrink-0">
                            {isLoading ? oui.sectionTitleLoading : oui.sectionTitle}
                        </p>
                        <div className="flex items-center gap-2 flex-1 justify-end">
                            <TableSearch
                                value={search}
                                onChange={(val) => { setSearch(val); setPage(1); }}
                                placeholder={oui.searchPlaceholder}
                            />
                            <OrderFilterPanel
                                config={filterConfig}
                                value={filterState}
                                onChange={setFilters}
                                onClear={clearFilters}
                            />
                        </div>
                    </div>
                    <ActiveFilterChips
                        value={filterState}
                        config={filterConfig}
                        onChange={setFilters}
                        onClearAll={clearFilters}
                    />
                </div>

                {isLoading ? (
                    <OrdersSkeleton isMobile={isMobile} />
                ) : orders.length === 0 ? (
                    (() => {
                        const isFiltered = search !== "" ||
                            filterState.selectedFilters.length > 0 ||
                            !!filterState.startDate ||
                            !!filterState.academicTermId;

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
                                            clearFilters()
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
                                        {layoutPreset === "restaurant" && (() => {
                                            const cfg = kitchenTicketBadgeConfig(order.kitchenTicketStatus)
                                            if (!cfg) return null
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
                                        onGeneratePaymentLink={handleGeneratePaymentLink}
                                        onAdvanceKitchen={handleAdvanceKitchen}
                                        onSendToKitchen={openSendToKitchenDialog}
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

                <Dialog
                    open={!!kitchenOrder}
                    onOpenChange={(open) => {
                        if (!open) closeSendToKitchenDialog()
                    }}
                >
                    <DialogContent className="flex! max-h-[min(88vh,720px)] w-full max-w-lg flex-col gap-0 overflow-hidden rounded-3xl! border-brand-deep/10 bg-white/95 p-0 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-brand-deep-900/95">
                        <DialogHeader className="shrink-0 space-y-1.5 border-b border-brand-deep/10 px-6 pb-4 pt-6 pr-14 text-left sm:text-left dark:border-white/10">
                            <DialogTitle>Send order to kitchen</DialogTitle>
                            <DialogDescription>
                                Review the generated ticket details or adjust them before creating the kitchen ticket.
                            </DialogDescription>
                        </DialogHeader>

                        {kitchenOrder && (
                            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-6 py-4 [-webkit-overflow-scrolling:touch]">
                                <div className="rounded-2xl border border-brand-deep/8 bg-brand-deep/3 p-4 dark:border-white/10 dark:bg-white/5">
                                    <div className="pr-0.5">
                                        <table
                                            className="w-full border-separate border-spacing-0 text-left"
                                            aria-label="Order preview"
                                        >
                                            <tbody>
                                                <tr className="border-b border-brand-deep/10 dark:border-white/10">
                                                    <td className="min-w-0 pb-3 pr-4 align-middle">
                                                        <span className="text-sm font-semibold leading-tight text-brand-deep dark:text-brand-cream">
                                                            #{kitchenOrder.shortCode ?? kitchenOrder.id.slice(0, 8)}
                                                        </span>
                                                    </td>
                                                    <td className="whitespace-nowrap pb-3 text-right align-middle">
                                                        <span className="inline-flex items-center rounded-full bg-brand-deep/8 px-3 py-1 text-xs font-bold tabular-nums text-brand-deep dark:bg-white/10 dark:text-brand-cream">
                                                            {formatCurrency(kitchenOrder.totalAmount, {
                                                                currency: kitchenSendCurrency,
                                                            })}
                                                        </span>
                                                    </td>
                                                </tr>

                                                {kitchenSendLineItems.length > 0 ? (
                                                    kitchenSendLineItems.map((item, idx) => {
                                                        const qty = Number(item.quantity)
                                                        const unit =
                                                            Number.isFinite(qty) && qty === 1 ? "unit" : "units"
                                                        const isLastLine =
                                                            idx === kitchenSendLineItems.length - 1
                                                        return (
                                                            <tr
                                                                key={idx}
                                                                className={cn(
                                                                    "border-b border-brand-deep/10 dark:border-white/10",
                                                                    isLastLine && "border-b-0"
                                                                )}
                                                            >
                                                                <td className="min-w-0 py-3 pr-4 align-top">
                                                                    <p className="text-sm font-medium leading-snug text-brand-deep dark:text-brand-cream">
                                                                        {item.productName}
                                                                    </p>
                                                                    <p className="mt-1 text-xs leading-snug text-brand-accent/55 dark:text-brand-cream/45">
                                                                        {qty} {unit} ×{" "}
                                                                        <CurrencyText
                                                                            value={formatCurrency(item.price, {
                                                                                currency: kitchenSendCurrency,
                                                                            })}
                                                                        />
                                                                    </p>
                                                                </td>
                                                                <td className="whitespace-nowrap py-3 align-top text-right tabular-nums">
                                                                    <span className="inline-block text-sm font-medium leading-snug text-brand-deep dark:text-brand-cream">
                                                                        <CurrencyText
                                                                            value={formatCurrency(item.total, {
                                                                                currency: kitchenSendCurrency,
                                                                            })}
                                                                        />
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        )
                                                    })
                                                ) : (
                                                    <tr>
                                                        <td
                                                            colSpan={2}
                                                            className="py-3 text-sm leading-snug text-brand-accent/70 dark:text-brand-cream/60"
                                                        >
                                                            {kitchenOrder.summary}
                                                        </td>
                                                    </tr>
                                                )}

                                                <tr>
                                                    <td
                                                        colSpan={2}
                                                        className="border-t border-brand-deep/10 pt-3 dark:border-white/10"
                                                    >
                                                        <span className="inline-flex items-center gap-2 text-xs leading-relaxed text-brand-accent/50 dark:text-brand-cream/40">
                                                            <User
                                                                className="size-3.5 shrink-0 text-brand-accent/45 dark:text-brand-cream/35"
                                                                aria-hidden
                                                            />
                                                            <span className="min-w-0">
                                                                {kitchenOrder.customer || "Walk-in"}
                                                            </span>
                                                        </span>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="min-w-0 space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/60 dark:text-brand-cream/50">
                                                Station
                                            </label>
                                            <Select
                                                value={kitchenStationMode}
                                                onValueChange={(value) => {
                                                    setKitchenStationMode(value)
                                                    if (value !== "custom") setKitchenStation(value)
                                                }}
                                            >
                                                <SelectTrigger className="rounded-2xl">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {KITCHEN_STATION_OPTIONS.map((option) => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/60 dark:text-brand-cream/50">
                                                Initial stage
                                            </label>
                                            <Select
                                                value={kitchenInitialStatus}
                                                onValueChange={(value) =>
                                                    setKitchenInitialStatus(value as KitchenTicket["status"])
                                                }
                                            >
                                                <SelectTrigger className="rounded-2xl">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {KITCHEN_INITIAL_STATUS_OPTIONS.map((option) => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    {kitchenStationMode === "custom" && (
                                        <div className="w-full min-w-0">
                                            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-brand-accent/60 dark:text-brand-cream/50">
                                                Station name
                                            </label>
                                            <Input
                                                value={kitchenStation}
                                                onChange={(event) => setKitchenStation(event.target.value)}
                                                placeholder="Enter station name"
                                                className="w-full rounded-2xl"
                                            />
                                        </div>
                                    )}
                                </div>

                                <p className="text-xs leading-5 text-brand-accent/55 dark:text-brand-cream/45">
                                    Defaults are generated from the order. Creating the ticket may also send the configured WhatsApp update for the selected initial stage.
                                </p>
                            </div>
                        )}

                        <DialogFooter className="shrink-0 gap-2 border-t border-brand-deep/10 bg-white/95 px-6 pb-6 pt-4 dark:border-white/10 dark:bg-brand-deep-900/95 sm:justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={closeSendToKitchenDialog}
                                disabled={kitchenAction.create.isPending}
                                className="rounded-full"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleCreateKitchenTicket}
                                disabled={!kitchenStation.trim() || kitchenAction.create.isPending}
                                className="rounded-full"
                            >
                                {kitchenAction.create.isPending ? "Creating..." : "Create ticket"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
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
                                className="h-14 w-14 rounded-full bg-primary text-white shadow-lg transition-colors hover:bg-primary/92 hover:text-white active:bg-primary/90 [&_svg]:text-white"
                                onClick={() => setSchoolFeeDrawerOpen(true)}
                            >
                                <ShoppingBag className="h-6 w-6" />
                            </Button>
                        ) : (
                            <Link href="/orders/sale">
                                <Button
                                    size="icon"
                                    className="h-14 w-14 rounded-full bg-primary text-white shadow-lg transition-colors hover:bg-primary/92 hover:text-white active:bg-primary/90 [&_svg]:text-white"
                                >
                                    <ShoppingBag className="h-6 w-6" />
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

                        try {
                            await updateOrder({
                                id: recordingPaymentOrder.id,
                                updates: {
                                    amountPaid: newAmountPaid,
                                    paymentMethod: method as any,
                                    status: newStatus as any
                                }
                            })
                            toast.success(`Recorded ${formatCurrency(amount, { currency: recordingPaymentOrder.currency || 'NGN' })} payment`)
                        } catch (err: any) {
                            // onError in useOrders also toasts, this is a safety net
                            if (!err?.message) toast.error('Failed to record payment')
                        }
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
