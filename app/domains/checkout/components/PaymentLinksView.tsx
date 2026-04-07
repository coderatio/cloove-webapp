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
import { usePresetPageCopy } from "@/app/domains/workspace/hooks/usePresetPageCopy"
import { formatCurrency, formatDate } from "@/app/lib/formatters"
import { Button } from "@/app/components/ui/button"
import { FilterPopover } from "@/app/components/shared/FilterPopover"
import { TableSearch } from "@/app/components/shared/TableSearch"
import { Skeleton } from "@/app/components/ui/skeleton"
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover"
import { format } from "date-fns"
import { SearchableSelect } from "@/app/components/ui/searchable-select"
import { usePaymentLinks, usePaymentLinkStats, useCancelPaymentLink, useCreateDynamicWalletLink, useUpdatePaymentLink } from "../hooks/usePaymentLinks"
import { PaymentLinkDialog } from "./PaymentLinkDialog"
import { toast } from "sonner"
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
import { PaymentLinkDetailDrawer } from "./PaymentLinkDetailDrawer"
import { CreatePaymentLinkDrawer } from "./CreatePaymentLinkDrawer"
import { PaymentLink, statusConfig, targetTypeConfig, STATUS_OPTIONS, TARGET_TYPE_OPTIONS } from "./PaymentLinkTypes"

const PAGE_SIZE = 20

export function PaymentLinksView() {
    const isMobile = useIsMobile()
    const { activeBusiness } = useBusiness()
    const pageCopy = usePresetPageCopy()
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
    const [editingLink, setEditingLink] = React.useState<PaymentLink | null>(null)
    const [paymentLinkDialogOpen, setPaymentLinkDialogOpen] = React.useState(false)
    const [generatedPaymentLink, setGeneratedPaymentLink] = React.useState<string | null>(null)

    const statusFilter = selectedFilters.find(f => STATUS_OPTIONS.some(s => s.value === f)) || undefined
    const targetTypeFilter = selectedFilters.find(f => TARGET_TYPE_OPTIONS.some(s => s.value === f && s.value !== "ALL")) || undefined

    const { data: response, isPending, error } = usePaymentLinks(currentPage, PAGE_SIZE, deferredSearch, statusFilter, targetTypeFilter)
    const { data: statsData, isLoading: isStatsLoading } = usePaymentLinkStats()
    const cancelLink = useCancelPaymentLink()
    const createDynamicWallet = useCreateDynamicWalletLink()
    const updateLink = useUpdatePaymentLink()

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

    const handleCreateLink = React.useCallback(async (data: { id?: string; title: string; description: string; amount: number; expiresIn: string; customDate?: Date; customTime: string }) => {
        const { id, title, description, amount, expiresIn, customDate, customTime } = data
        
        const expiresAt = expiresIn !== "never" ? (() => {
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
        })() : undefined

        try {
            if (id) {
                await updateLink.mutateAsync({
                    id,
                    data: {
                        title: title.trim(),
                        description: description.trim() || undefined,
                        amount,
                        expiresAt,
                    },
                })
            } else {
                const result = await createDynamicWallet.mutateAsync({
                    title: title.trim(),
                    description: description.trim() || undefined,
                    amount,
                    expiresAt,
                })
                const reference = result?.reference || (result as any)?.data?.reference
                if (reference) {
                    setGeneratedPaymentLink(`${origin}/pay/${reference}`)
                    setPaymentLinkDialogOpen(true)
                }
            }
            setIsCreateOpen(false)
            setEditingLink(null)
        } catch {
            // Error handled by hook's onError
        }
    }, [createDynamicWallet, updateLink, origin])

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
                        onClick={() => {
                            setEditingLink(item)
                            setIsCreateOpen(true)
                        }}
                        className="rounded-xl flex items-center gap-3 cursor-pointer dark:text-brand-cream dark:focus:bg-white/5"
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
                        {item.title && item.title !== item.reference ? item.reference : "Payment Link"}
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
                    <ManagementHeader
                        title={pageCopy.paymentLinks.title}
                        description={pageCopy.paymentLinks.descriptionShort}
                    />
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
                    title={pageCopy.paymentLinks.title}
                    description={pageCopy.paymentLinks.descriptionLong}
                    addButtonLabel="Create Link"
                    onAddClick={() => setIsCreateOpen(true)}
                />

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                                    subtitle={link.title && link.title !== link.reference ? link.reference : (typeConfig ? typeConfig.label : link.targetType)}
                                    icon={Link2}
                                    status={config.label}
                                    statusColor={config.statusColor}
                                    value={link.amount != null ? formatCurrency(link.amount, { currency: currencyCode }) : undefined}
                                    valueLabel="Amount"
                                    meta={
                                        <div className="flex flex-col gap-0.5">
                                            <span>Created {formatDate(link.createdAt || "", "MMM d")}</span>
                                            {link.expiresAt && (
                                                <span className="text-rose-500/60 dark:text-rose-400/60">
                                                    Expires {formatDate(link.expiresAt, "MMM d, h:mm a")}
                                                </span>
                                            )}
                                        </div>
                                    }
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
                <CreatePaymentLinkDrawer 
                    isOpen={isCreateOpen} 
                    onOpenChange={(open) => {
                        setIsCreateOpen(open)
                        if (!open) setEditingLink(null)
                    }}
                    onSubmit={(data) => handleCreateLink(data)}
                    isPending={createDynamicWallet.isPending}
                    currencySymbol={currencySymbol}
                    editingLink={editingLink}
                />

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
