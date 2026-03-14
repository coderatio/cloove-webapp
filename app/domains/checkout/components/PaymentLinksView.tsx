"use client"

import * as React from "react"
import DataTable, { type Column } from "@/app/components/DataTable"
import { useIsMobile } from "@/app/hooks/useMediaQuery"
import { PageTransition } from "@/app/components/layout/page-transition"
import { ListCard } from "@/app/components/ui/list-card"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Link2, CheckCircle2, Clock, XCircle, ChevronLeft, ChevronRight, MoreHorizontal, Copy, Check, ExternalLink, Loader2, Eye, Pencil, Trash2 } from "lucide-react"
import { cn } from "@/app/lib/utils"
import { ManagementHeader } from "@/app/components/shared/ManagementHeader"
import { useBusiness } from "@/app/components/BusinessProvider"
import { formatCurrency, formatDate } from "@/app/lib/formatters"
import { Button } from "@/app/components/ui/button"
import { FilterPopover } from "@/app/components/shared/FilterPopover"
import { TableSearch } from "@/app/components/shared/TableSearch"
import { Skeleton } from "@/app/components/ui/skeleton"
import { Calendar } from "@/app/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { SearchableSelect } from "@/app/components/ui/searchable-select"
import { usePaymentLinks, usePaymentLinkStats, useCancelPaymentLink, useCreateDynamicWalletLink } from "../hooks/usePaymentLinks"
import { PaymentLinkDialog } from "./PaymentLinkDialog"
import { toast } from "sonner"
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerBody,
    DrawerFooter,
} from "@/app/components/ui/drawer"
import { MoneyInput } from "@/app/components/ui/money-input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
} from "@/app/components/ui/dropdown-menu"
import { Input } from "@/app/components/ui/input"
import { Textarea } from "@/app/components/ui/textarea"
import { Label } from "@/app/components/ui/label"

const PAGE_SIZE = 20

const STATUS_OPTIONS = [
    { label: "All", value: "ALL" },
    { label: "Active", value: "ACTIVE" },
    { label: "Paid", value: "PAID" },
    { label: "Expired", value: "EXPIRED" },
    { label: "Cancelled", value: "CANCELLED" },
]

const TARGET_TYPE_OPTIONS = [
    { label: "All", value: "ALL" },
    { label: "Sale", value: "SALE" },
    { label: "Debt", value: "DEBT" },
    { label: "Wallet", value: "WALLET" },
]

const statusConfig: Record<string, { label: string; className: string; statusColor?: "success" | "warning" | "danger" | "neutral" }> = {
    ACTIVE: { label: "Active", className: "bg-brand-green/10 text-brand-green border-brand-green/20 dark:bg-brand-green-600/10 dark:text-brand-cream/60 dark:border-brand-green-600/20", statusColor: "success" },
    PAID: { label: "Paid", className: "bg-brand-green-500/10 text-brand-green-600 dark:text-brand-green-400 border-brand-green-500/20", statusColor: "success" },
    EXPIRED: { label: "Expired", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", statusColor: "warning" },
    CANCELLED: { label: "Cancelled", className: "bg-rose-500/10 text-rose-500 border-rose-500/20", statusColor: "danger" },
}

const targetTypeConfig: Record<string, { label: string; className: string }> = {
    SALE: { label: "Sale", className: "bg-brand-gold/10 text-brand-gold border-brand-gold/20" },
    DEBT: { label: "Debt", className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
    WALLET: { label: "Wallet", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
}

interface PaymentLink {
    id: string
    reference: string
    amount: number | null
    status: string
    targetType: string
    title: string | null
    isStatic: boolean
    customerName?: string | null
    customerEmail?: string | null
    createdAt?: string
    expiresAt?: string | null
    [key: string]: unknown
}

export function PaymentLinksView() {
    const isMobile = useIsMobile()
    const { activeBusiness } = useBusiness()
    const currencyCode = activeBusiness?.currency ?? "NGN"
    const currencySymbol = currencyCode === "USD" ? "$" : currencyCode === "GHS" ? "GH₵" : "₦"

    const [search, setSearch] = React.useState("")
    const deferredSearch = React.useDeferredValue(search)
    const [currentPage, setCurrentPage] = React.useState(1)
    const [selectedFilters, setSelectedFilters] = React.useState<string[]>([])
    const [selectedLink, setSelectedLink] = React.useState<PaymentLink | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = React.useState(false)
    const [copiedId, setCopiedId] = React.useState<string | null>(null)
    const [isCreateOpen, setIsCreateOpen] = React.useState(false)
    const [paymentLinkDialogOpen, setPaymentLinkDialogOpen] = React.useState(false)
    const [generatedPaymentLink, setGeneratedPaymentLink] = React.useState<string | null>(null)

    // Create form state
    const [title, setTitle] = React.useState("")
    const [description, setDescription] = React.useState("")
    const [amount, setAmount] = React.useState(0)
    const [expiresIn, setExpiresIn] = React.useState("24h")
    const [customDate, setCustomDate] = React.useState<Date | undefined>(undefined)
    const [customTime, setCustomTime] = React.useState("23:59")

    const statusFilter = selectedFilters.find(f => STATUS_OPTIONS.some(s => s.value === f)) || undefined
    const targetTypeFilter = selectedFilters.find(f => TARGET_TYPE_OPTIONS.some(s => s.value === f && s.value !== "ALL")) || undefined

    const { data: response, isPending, error } = usePaymentLinks(currentPage, PAGE_SIZE, deferredSearch, statusFilter, targetTypeFilter)
    const { data: statsData, isLoading: isStatsLoading } = usePaymentLinkStats()
    const cancelLink = useCancelPaymentLink()
    const createDynamicWallet = useCreateDynamicWalletLink()

    const stats = statsData?.data

    const links = (Array.isArray(response?.data) ? response.data : []) as PaymentLink[]
    // Exclude static WALLET links (managed via AddFundsDrawer), keep dynamic wallet links
    const filteredLinks = links.filter(l => !(l.targetType === "WALLET" && l.isStatic))
    const meta = response?.meta as { total?: number; currentPage?: number; lastPage?: number } | undefined
    const totalPages = meta?.lastPage ?? 1
    const canPrev = currentPage > 1
    const canNext = currentPage < totalPages

    const origin = typeof window !== "undefined" ? window.location.origin : ""

    const handleCopy = React.useCallback((reference: string, id: string) => {
        const url = `${origin}/pay/${reference}`
        navigator.clipboard.writeText(url)
        setCopiedId(id)
        toast.success("Payment link copied")
        setTimeout(() => setCopiedId(null), 2000)
    }, [origin])

    const handleCancel = React.useCallback(async (id: string) => {
        await cancelLink.mutateAsync(id)
    }, [cancelLink])

    const handleCreate = React.useCallback(async () => {
        if (!title.trim() || amount <= 0) return
        try {
            const result = await createDynamicWallet.mutateAsync({
                title: title.trim(),
                description: description.trim() || undefined,
                amount,
                expiresAt: expiresIn !== "never" ? (() => {
                    const now = new Date()
                    if (expiresIn === "1h") now.setHours(now.getHours() + 1)
                    else if (expiresIn === "24h") now.setHours(now.getHours() + 24)
                    else if (expiresIn === "7d") now.setDate(now.getDate() + 7)
                    else if (expiresIn === "30d") now.setDate(now.getDate() + 30)
                    else if (expiresIn === "custom" && customDate) {
                        const [hours, minutes] = customTime.split(":").map(Number)
                        const finalDate = new Date(customDate)
                        finalDate.setHours(hours, minutes, 0, 0)
                        return finalDate.toISOString()
                    }
                    return now.toISOString()
                })() : undefined,
            })
            const reference = result?.reference || (result as any)?.data?.reference
            if (reference) {
                setGeneratedPaymentLink(`${origin}/pay/${reference}`)
                setPaymentLinkDialogOpen(true)
            }
            setIsCreateOpen(false)
            setTitle("")
            setDescription("")
            setAmount(0)
            setCustomDate(undefined)
            setCustomTime("23:59")
            setExpiresIn("24h")
        } catch {
            // Error handled by hook's onError
        }
    }, [title, description, amount, createDynamicWallet, origin])

    const filterGroups = [
        { title: "Status", options: STATUS_OPTIONS },
        { title: "Type", options: TARGET_TYPE_OPTIONS },
    ]

    const renderActions = (item: PaymentLink) => (
        <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-brand-deep/5 dark:hover:bg-white/5 rounded-full">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 border-brand-deep/5 dark:border-white/5 shadow-2xl">
                    <DropdownMenuItem
                        onClick={() => {
                            setSelectedLink(item)
                            setIsDetailsOpen(true)
                        }}
                        className="rounded-xl flex items-center gap-3 cursor-pointer dark:text-brand-cream dark:focus:bg-white/5"
                    >
                        <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <Eye className="w-4 h-4" />
                        </div>
                        <span className="font-medium">View Details</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="rounded-xl flex items-center gap-3 cursor-not-allowed dark:text-brand-cream dark:focus:bg-white/5 opacity-50"
                    >
                        <div className="h-8 w-8 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                            <Pencil className="w-4 h-4" />
                        </div>
                        <span className="font-medium">Edit Link</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => handleCopy(item.reference, item.id)}
                        className="rounded-xl flex items-center gap-3 cursor-pointer dark:text-brand-cream dark:focus:bg-white/5"
                    >
                        <div className="h-8 w-8 rounded-full bg-brand-green/10 dark:bg-emerald-500/10 flex items-center justify-center text-brand-green dark:text-emerald-400">
                            {copiedId === item.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </div>
                        <span className="font-medium">{copiedId === item.id ? "Copied!" : "Copy Link"}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => window.open(`${origin}/pay/${item.reference}`, "_blank")}
                        className="rounded-xl flex items-center gap-3 cursor-pointer dark:text-brand-cream dark:focus:bg-white/5"
                    >
                        <div className="h-8 w-8 rounded-full bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center text-brand-accent dark:text-brand-cream">
                            <ExternalLink className="w-4 h-4" />
                        </div>
                        <span className="font-medium">Open Link</span>
                    </DropdownMenuItem>
                    {item.status === "ACTIVE" && (
                        <DropdownMenuItem
                            onClick={() => handleCancel(item.id)}
                            className="rounded-xl flex items-center gap-3 cursor-pointer text-rose-500 dark:focus:bg-white/5"
                        >
                            <div className="h-8 w-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                                <XCircle className="w-4 h-4" />
                            </div>
                            <span className="font-medium">Cancel Link</span>
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )

    const columns: Column<PaymentLink>[] = [
        {
            key: "title",
            header: "Title",
            width: "35%",
            render: (_value, item) => (
                <div 
                    className="min-w-0 cursor-pointer group/title"
                    onClick={() => {
                        setSelectedLink(item)
                        setIsDetailsOpen(true)
                    }}
                >
                    <span className="font-serif font-medium text-base text-brand-deep dark:text-brand-cream truncate block group-hover/title:text-brand-green dark:group-hover/title:text-brand-gold transition-colors" title={item.title || item.reference}>
                        {item.title || item.reference}
                    </span>
                    <span className="text-[10px] font-mono text-brand-accent/30 dark:text-brand-cream/30">
                        Payment Link
                    </span>
                </div>
            ),
        },
        {
            key: "targetType",
            header: "Type",
            width: "15%",
            render: (_value, item) => {
                const config = targetTypeConfig[item.targetType] ?? { label: item.targetType, className: "bg-brand-deep/5 text-brand-accent/60" }
                return (
                    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap", config.className)}>
                        {config.label}
                    </span>
                )
            },
        },
        {
            key: "amount",
            header: "Amount",
            width: "15%",
            render: (_value, item) => (
                <span className="font-serif text-brand-deep dark:text-brand-cream text-base">
                    {item.amount != null ? formatCurrency(item.amount, { currency: currencyCode }) : "\u2014"}
                </span>
            ),
        },
        {
            key: "status",
            header: "Status",
            width: "15%",
            render: (_value, item) => {
                const config = statusConfig[item.status] ?? { label: item.status, className: "bg-brand-deep/5 text-brand-accent/60 border-brand-deep/5" }
                return (
                    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border inline-flex items-center gap-1.5", config.className)}>
                        {config.label}
                    </span>
                )
            },
        },
        {
            key: "expiresAt",
            header: "Expires",
            width: "20%",
            render: (_value, item) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-brand-accent/80 dark:text-brand-cream/80 whitespace-nowrap">
                        {item.expiresAt ? formatDate(item.expiresAt, "MMM d, yyyy") : "Never"}
                    </span>
                    {item.expiresAt && (
                        <span className="text-[10px] text-brand-accent/40 dark:text-brand-cream/40 font-mono">
                            {formatDate(item.expiresAt, "h:mm a")}
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: "actions" as any,
            header: "",
            render: (_value, item) => renderActions(item),
        },
    ]

    if (error) {
        return (
            <PageTransition>
                <div className="max-w-5xl mx-auto space-y-8 pb-24">
                    <ManagementHeader title="Payment Links" description="Manage payment links." />
                    <GlassCard className="p-8 text-center">
                        <p className="text-brand-deep dark:text-brand-cream mb-4">
                            {(error as Error).message}
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => window.location.reload()}
                            className="rounded-2xl dark:border-white/5 dark:text-brand-cream hover:dark:bg-white/5"
                        >
                            Retry
                        </Button>
                    </GlassCard>
                </div>
            </PageTransition>
        )
    }

    return (
        <PageTransition>
            <div className="max-w-5xl mx-auto space-y-8 pb-24">
                <ManagementHeader
                    title="Payment Links"
                    description="Manage payment links for sales, debts, and wallet top-ups."
                    addButtonLabel="Create Link"
                    onAddClick={() => setIsCreateOpen(true)}
                />

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <GlassCard className="p-5 flex items-center gap-4 relative overflow-hidden group rounded-3xl before:rounded-3xl">
                        <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Link2 className="w-24 h-24" />
                        </div>
                        <div className="h-12 w-12 rounded-full bg-brand-deep/10 dark:bg-white/10 flex items-center justify-center text-brand-deep dark:text-brand-cream">
                            <Link2 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-brand-accent/40 dark:text-brand-cream/60 uppercase tracking-widest">
                                Total Links
                            </p>
                            {isStatsLoading ? (
                                <Skeleton className="h-8 w-12 mt-1" />
                            ) : (
                                <p className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream">
                                    {stats?.total ?? 0}
                                </p>
                            )}
                        </div>
                    </GlassCard>

                    <GlassCard className="p-5 flex items-center gap-4 relative overflow-hidden group rounded-3xl before:rounded-3xl">
                        <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity text-brand-green">
                            <CheckCircle2 className="w-24 h-24" />
                        </div>
                        <div className="h-12 w-12 rounded-full bg-brand-green/10 dark:bg-brand-green/20 flex items-center justify-center text-brand-green">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-brand-accent/40 dark:text-brand-cream/60 uppercase tracking-widest">
                                Active
                            </p>
                            {isStatsLoading ? (
                                <Skeleton className="h-8 w-12 mt-1" />
                            ) : (
                                <p className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream">
                                    {stats?.active ?? 0}
                                </p>
                            )}
                        </div>
                    </GlassCard>

                    <GlassCard className="p-5 flex items-center gap-4 relative overflow-hidden group rounded-3xl before:rounded-3xl">
                        <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity text-blue-500">
                            <CheckCircle2 className="w-24 h-24" />
                        </div>
                        <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-blue-500/60 uppercase tracking-widest">
                                Paid
                            </p>
                            {isStatsLoading ? (
                                <Skeleton className="h-8 w-12 mt-1" />
                            ) : (
                                <p className="text-2xl font-serif font-medium text-blue-600 dark:text-blue-400">
                                    {stats?.paid ?? 0}
                                </p>
                            )}
                        </div>
                    </GlassCard>

                    <GlassCard className="p-5 flex items-center gap-4 relative overflow-hidden group rounded-3xl before:rounded-3xl">
                        <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity text-amber-500">
                            <Clock className="w-24 h-24" />
                        </div>
                        <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <Clock className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest">
                                Expired
                            </p>
                            {isStatsLoading ? (
                                <Skeleton className="h-8 w-12 mt-1" />
                            ) : (
                                <p className="text-2xl font-serif font-medium text-amber-600 dark:text-amber-400">
                                    {stats?.expired ?? 0}
                                </p>
                            )}
                        </div>
                    </GlassCard>
                </div>

                {/* Search & Filters */}
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-accent/40 dark:text-brand-cream/40 ml-1">
                            Payment Links
                        </p>
                        <div className="flex items-center gap-3 font-sans w-full md:w-auto">
                            <TableSearch
                                value={search}
                                onChange={setSearch}
                                placeholder="Search links..."
                                className="flex-1 min-w-0 w-full"
                            />
                            <div className="shrink-0">
                                <FilterPopover
                                    groups={filterGroups}
                                    selectedValues={selectedFilters}
                                    onSelectionChange={setSelectedFilters}
                                    onClear={() => setSelectedFilters([])}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Data Display */}
                {isPending && !filteredLinks.length ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                        ))}
                    </div>
                ) : filteredLinks.length === 0 ? (
                    <GlassCard className="p-12 text-center">
                        <div className="flex flex-col items-center space-y-4">
                            <div className="w-20 h-20 rounded-3xl bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center">
                                <Link2 className="w-10 h-10 text-brand-accent/30 dark:text-brand-cream/30" />
                            </div>
                            <h3 className="text-xl font-serif font-medium text-brand-deep dark:text-brand-cream">
                                No Payment Links
                            </h3>
                            <p className="text-sm text-brand-accent/60 dark:text-brand-cream/60 max-w-[300px]">
                                {deferredSearch || selectedFilters.length > 0
                                    ? "No payment links match your search or filters."
                                    : "Create a payment link to receive payments into your wallet."}
                            </p>
                            {!deferredSearch && selectedFilters.length === 0 && (
                                <Button
                                    onClick={() => setIsCreateOpen(true)}
                                    className="rounded-2xl bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep hover:bg-brand-deep/90 dark:hover:bg-brand-gold/90 font-semibold"
                                >
                                    <Link2 className="w-4 h-4 mr-2" />
                                    Create Payment Link
                                </Button>
                            )}
                        </div>
                    </GlassCard>
                ) : isMobile ? (
                    <div className="space-y-3">
                        {filteredLinks.map((link, index) => {
                            const config = statusConfig[link.status] ?? statusConfig.ACTIVE
                            const typeConfig = targetTypeConfig[link.targetType]
                            return (
                                <ListCard
                                    key={link.id}
                                    title={link.title || link.reference}
                                    subtitle={typeConfig ? typeConfig.label : link.targetType}
                                    icon={Link2}
                                    status={config.label}
                                    statusColor={config.statusColor}
                                    value={link.amount != null ? formatCurrency(link.amount, { currency: currencyCode }) : undefined}
                                    valueLabel="Amount"
                                    meta={link.expiresAt ? `${formatDate(link.createdAt || "", "MMM d")} \u2022 Exp. ${formatDate(link.expiresAt, "MMM d, h:mm a")}` : link.createdAt ? formatDate(link.createdAt, "MMM d, yyyy") : undefined}
                                    delay={index * 0.05}
                                    actions={renderActions(link)}
                                    onClick={() => {
                                        setSelectedLink(link)
                                        setIsDetailsOpen(true)
                                    }}
                                />
                            )
                        })}
                    </div>
                ) : (
                    <GlassCard className="overflow-hidden border-brand-deep/5 dark:border-white/5">
                        <DataTable
                            columns={columns}
                            data={filteredLinks}
                            emptyMessage="No payment links found"
                        />
                    </GlassCard>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!canPrev || isPending}
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            className="rounded-xl dark:border-white/5 dark:text-brand-cream hover:dark:bg-white/5"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                        </Button>
                        <span className="text-sm text-brand-accent/60 dark:text-brand-cream/60">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!canNext || isPending}
                            onClick={() => setCurrentPage((p) => p + 1)}
                            className="rounded-xl dark:border-white/5 dark:text-brand-cream hover:dark:bg-white/5"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                )}

                {/* Create Payment Link Drawer */}
                <Drawer open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DrawerContent>
                        <DrawerStickyHeader>
                            <DrawerTitle>Create Payment Link</DrawerTitle>
                            <DrawerDescription>
                                Create a payment link to receive funds into your wallet.
                            </DrawerDescription>
                        </DrawerStickyHeader>
                        <DrawerBody className="pb-8">
                            <div className="space-y-10 py-6">
                                <div className="space-y-2.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 px-1">
                                        Link Title
                                    </Label>
                                    <div className="relative group">
                                        <Input
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="e.g. Service Invoice, Product Payment"
                                            className="h-14 sm:h-14 rounded-2xl text-base px-6 bg-white/50 dark:bg-white/5 border-brand-deep/10 dark:border-white/10 focus-visible:ring-brand-gold/20 focus-visible:border-brand-gold/30 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 px-1">
                                        Payment Amount
                                    </Label>
                                    <MoneyInput
                                        value={amount}
                                        onChange={setAmount}
                                        currencySymbol={currencySymbol}
                                        placeholder="0.00"
                                    />
                                </div>

                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between px-1">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40">
                                            Description
                                        </Label>
                                        <span className="text-[10px] font-medium text-brand-accent/20 dark:text-brand-cream/20">Optional</span>
                                    </div>
                                    <Textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Briefly describe what this payment is for..."
                                        className="min-h-[100px] rounded-2xl p-4 bg-white/40 dark:bg-white/5 border-brand-accent/5 dark:border-white/5 focus-visible:ring-brand-gold/20 resize-none text-base"
                                    />
                                </div>

                                <div className="space-y-2.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 px-1">
                                        Link Expiration
                                    </Label>
                                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-brand-deep/5 dark:bg-white/5 p-1 rounded-[20px] border border-brand-deep/5 dark:border-white/5">
                                        {[
                                            { label: "1h", value: "1h" },
                                            { label: "24h", value: "24h" },
                                            { label: "7d", value: "7d" },
                                            { label: "30d", value: "30d" },
                                            { label: "Never", value: "never" },
                                            { label: "Custom", value: "custom" },
                                        ].map((opt) => (
                                            <Button
                                                key={opt.value}
                                                type="button"
                                                variant={expiresIn === opt.value ? "base" : "ghost"}
                                                onClick={() => setExpiresIn(opt.value)}
                                                className={cn(
                                                    "h-10 rounded-[14px] text-[11px] font-bold uppercase tracking-wider transition-all duration-300",
                                                    expiresIn === opt.value
                                                        ? "bg-brand-deep text-brand-gold shadow-lg dark:bg-brand-gold dark:text-brand-deep"
                                                        : "text-brand-accent/60 dark:text-brand-cream/60 hover:bg-white/50 dark:hover:bg-white/5"
                                                )}
                                            >
                                                {opt.label}
                                            </Button>
                                        ))}
                                    </div>

                                    {expiresIn === "custom" && (
                                        <div className="mt-6 pt-6 border-t border-brand-deep/5 dark:border-white/5 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 px-1">
                                                    Expiry Date
                                                </Label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className={cn(
                                                                "w-full h-14 rounded-2xl justify-start text-left font-medium bg-white/50 dark:bg-white/5 border-brand-deep/10 dark:border-white/10 px-6 transition-all hover:bg-white/60 dark:hover:bg-white/10",
                                                                !customDate && "text-brand-accent/30 dark:text-brand-cream/30"
                                                            )}
                                                        >
                                                            <CalendarIcon className="mr-3 h-4 w-4 opacity-40 shrink-0" />
                                                            <span className="truncate">
                                                                {customDate ? format(customDate, "PPP") : "Pick a date"}
                                                            </span>
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden border-none shadow-2xl" align="center">
                                                        <Calendar
                                                            mode="single"
                                                            selected={customDate}
                                                            onSelect={setCustomDate}
                                                            autoFocus
                                                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>

                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 px-1">
                                                    Expiry Time
                                                </Label>
                                                <div className="flex gap-2">
                                                    <div className="flex-1">
                                                        <SearchableSelect
                                                            options={Array.from({ length: 24 }).map((_, i) => ({
                                                                label: i.toString().padStart(2, '0'),
                                                                value: i.toString().padStart(2, '0')
                                                            }))}
                                                            value={customTime.split(":")[0]}
                                                            onChange={(hour) => setCustomTime(`${hour}:${customTime.split(":")[1]}`)}
                                                            placeholder="HR"
                                                            triggerClassName="h-14 rounded-2xl pl-12 pr-10 bg-white/50 dark:bg-white/5 border-brand-deep/10 dark:border-white/10 text-base font-medium"
                                                            renderTrigger={(val) => (
                                                                <Button
                                                                    variant="outline"
                                                                    className="w-full h-14 rounded-2xl justify-between pl-12 pr-4 bg-white/50 dark:bg-white/5 border-brand-deep/10 dark:border-white/10 text-base font-medium relative group"
                                                                >
                                                                    <Clock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-accent/30 dark:text-brand-cream/30 pointer-events-none group-focus:text-brand-gold/60 transition-colors" />
                                                                    <span className="text-brand-deep dark:text-brand-cream">{val || "00"}</span>
                                                                    <span className="text-[10px] font-bold text-brand-accent/20 dark:text-brand-cream/20">HR</span>
                                                                </Button>
                                                            )}
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <SearchableSelect
                                                            options={["00", "15", "30", "45", "59"].map(min => ({
                                                                label: min,
                                                                value: min
                                                            }))}
                                                            value={customTime.split(":")[1]}
                                                            onChange={(min) => setCustomTime(`${customTime.split(":")[0]}:${min}`)}
                                                            placeholder="MIN"
                                                            triggerClassName="h-14 rounded-2xl px-6 bg-white/50 dark:bg-white/5 border-brand-deep/10 dark:border-white/10 text-base font-medium"
                                                            renderTrigger={(val) => (
                                                                <Button
                                                                    variant="outline"
                                                                    className="w-full h-14 rounded-2xl justify-between px-6 bg-white/50 dark:bg-white/5 border-brand-deep/10 dark:border-white/10 text-base font-medium relative"
                                                                >
                                                                    <span className="text-brand-deep dark:text-brand-cream">{val || "59"}</span>
                                                                    <span className="text-[10px] font-bold text-brand-accent/20 dark:text-brand-cream/20">MIN</span>
                                                                </Button>
                                                            )}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </DrawerBody>
                        <DrawerFooter>
                            <Button
                                onClick={handleCreate}
                                disabled={!title.trim() || amount <= 0 || createDynamicWallet.isPending}
                                className="w-full h-14 rounded-2xl bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep hover:bg-brand-deep/90 dark:hover:bg-brand-gold/90 font-semibold text-base gap-2"
                            >
                                {createDynamicWallet.isPending ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Link2 className="w-5 h-5" />
                                )}
                                Create Payment Link
                            </Button>
                        </DrawerFooter>
                    </DrawerContent>
                </Drawer>

                {/* Details Drawer */}
                <PaymentLinkDetailDrawer
                    link={selectedLink}
                    isOpen={isDetailsOpen}
                    onOpenChange={setIsDetailsOpen}
                    onCopy={() => handleCopy(selectedLink?.reference || "", selectedLink?.id || "")}
                    onCancel={() => {
                        if (selectedLink) {
                            handleCancel(selectedLink.id)
                            setIsDetailsOpen(false)
                        }
                    }}
                    origin={origin}
                    currencyCode={currencyCode}
                />

                {/* Payment Link Dialog */}
                <PaymentLinkDialog
                    isOpen={paymentLinkDialogOpen}
                    onClose={() => setPaymentLinkDialogOpen(false)}
                    link={generatedPaymentLink}
                    isLoading={createDynamicWallet.isPending}
                />
            </div>
        </PageTransition>
    )
}

interface PaymentLinkDetailDrawerProps {
    link: PaymentLink | null
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onCopy: () => void
    onCancel: () => void
    origin: string
    currencyCode: string
}

function PaymentLinkDetailDrawer({
    link,
    isOpen,
    onOpenChange,
    onCopy,
    onCancel,
    origin,
    currencyCode,
}: PaymentLinkDetailDrawerProps) {
    if (!link) return null

    const typeConfig = targetTypeConfig[link.targetType] ?? { label: link.targetType, className: "bg-brand-deep/5 text-brand-accent/60" }
    const status = statusConfig[link.status] ?? statusConfig.ACTIVE

    return (
        <Drawer open={isOpen} onOpenChange={onOpenChange}>
            <DrawerContent>
                <DrawerStickyHeader>
                    <DrawerTitle className="font-serif text-2xl">Link Details</DrawerTitle>
                    <DrawerDescription>View and manage your payment link metadata.</DrawerDescription>
                </DrawerStickyHeader>

                <DrawerBody className="pb-8">
                    <div className="space-y-6 max-w-lg mx-auto">
                        {/* Header Info */}
                        <div className="space-y-1">
                            <h3 className="text-xl font-serif font-medium text-brand-deep dark:text-brand-cream">
                                {link.title || link.reference}
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border", typeConfig.className)}>
                                    {typeConfig.label}
                                </span>
                                <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border", status.className)}>
                                    {status.label}
                                </span>
                            </div>
                        </div>

                        {/* Amount Card */}
                        <GlassCard className="p-6 rounded-3xl before:rounded-3xl border-brand-green/10 bg-brand-green/5">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-green/60 mb-1">
                                Link Amount
                            </p>
                            <p className="text-3xl font-serif font-medium text-brand-green">
                                {link.amount != null ? formatCurrency(link.amount, { currency: currencyCode }) : "\u2014"}
                            </p>
                        </GlassCard>

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <GlassCard className="p-4 rounded-3xl before:rounded-3xl space-y-1">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 px-1">
                                    Created On
                                </p>
                                <p className="text-sm font-medium text-brand-deep dark:text-brand-cream px-1">
                                    {formatDate(link.createdAt, "MMMM d, yyyy")}
                                </p>
                            </GlassCard>
                            <GlassCard className="p-4 rounded-3xl before:rounded-3xl space-y-1">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 px-1">
                                    Expires At
                                </p>
                                <p className="text-sm font-medium text-brand-deep dark:text-brand-cream px-1">
                                    {link.expiresAt ? formatDate(link.expiresAt, "MMM d, yyyy @ h:mm a") : "Never"}
                                </p>
                            </GlassCard>
                        </div>

                        {/* Reference Section */}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 px-1">
                                Link Reference
                            </Label>
                            <div className="h-14 rounded-2xl border border-brand-deep/5 dark:border-white/5 bg-brand-deep/5 dark:bg-white/5 flex items-center justify-between px-5 group">
                                <code className="text-sm font-mono text-brand-gold truncate mr-4">
                                    {link.reference}
                                </code>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onCopy}
                                    className="h-8 w-8 p-0 rounded-full hover:bg-brand-gold/10 hover:text-brand-gold transition-colors"
                                >
                                    <Copy className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Full URL Section */}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 px-1">
                                Payment URL
                            </Label>
                            <div className="min-h-14 py-3 rounded-2xl border border-brand-deep/5 dark:border-white/5 bg-brand-deep/5 dark:bg-white/5 flex items-center justify-between px-5">
                                <p className="text-xs text-brand-accent/60 dark:text-brand-cream/60 break-all mr-4">
                                    {`${origin}/pay/${link.reference}`}
                                </p>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(`${origin}/pay/${link.reference}`, "_blank")}
                                    className="h-8 w-8 p-0 rounded-full hover:bg-blue-500/10 hover:text-blue-500 transition-colors shrink-0"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </DrawerBody>

                <DrawerFooter>
                    <div className="flex flex-col md:flex-row gap-3 max-w-lg mx-auto w-full">
                        <Button
                            variant="outline"
                            onClick={onCopy}
                            className="flex-1 h-14 rounded-2xl border-brand-deep/10 dark:border-white/10 dark:text-brand-cream font-medium gap-2"
                        >
                            <Copy className="w-4 h-4" />
                            Copy Link
                        </Button>
                        {link.status === "ACTIVE" && (
                            <Button
                                variant="destructive"
                                onClick={onCancel}
                                className="flex-1 h-14 rounded-2xl bg-rose-500 text-white hover:bg-rose-600 font-bold shadow-xl shadow-rose-500/10 gap-2"
                            >
                                <XCircle className="w-4 h-4" />
                                Cancel Link
                            </Button>
                        )}
                    </div>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}
