"use client"

import * as React from "react"
import DataTable, { type Column } from "@/app/components/DataTable"
import { useIsMobile } from "@/app/hooks/useMediaQuery"
import { PageTransition } from "@/app/components/layout/page-transition"
import { ListCard } from "@/app/components/ui/list-card"
import { GlassCard } from "@/app/components/ui/glass-card"
import { AlertCircle, Users, Trash2, Loader2, ChevronLeft, ChevronRight, UserPenIcon } from "lucide-react"
import { cn } from "@/app/lib/utils"
import { ManagementHeader } from "@/app/components/shared/ManagementHeader"
import { InsightWhisper } from "@/app/components/dashboard/InsightWhisper"
import { useBusiness } from "@/app/components/BusinessProvider"
import { useStores } from "@/app/domains/stores/providers/StoreProvider"
import { formatCurrency } from "@/app/lib/formatters"
import { CurrencyText } from "@/app/components/shared/CurrencyText"
import { Button } from "@/app/components/ui/button"
import { FilterPopover } from "@/app/components/shared/FilterPopover"
import { TableSearch } from "@/app/components/shared/TableSearch"
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerClose,
} from "@/app/components/ui/drawer"
import { Switch } from "@/app/components/ui/switch"
import { ConfirmDialog } from "@/app/components/shared/ConfirmDialog"
import { Skeleton } from "@/app/components/ui/skeleton"
import { useCustomers, useCustomerStats, type Customer } from "../hooks/useCustomers"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from "@/app/components/ui/dropdown-menu"
import {
    MoreHorizontal,
    Phone,
    MessageSquare,
    Receipt,
    User,
    Ban,
    CheckCircle2,
    TrendingUp,
    Crown,
    Star
} from "lucide-react"
import { CustomerProfileDrawer } from "./CustomerProfileDrawer"
import { RecordPaymentDrawer } from "@/app/domains/orders/components/RecordPaymentDrawer"

const PAGE_SIZE = 20

export function CustomersView() {
    const isMobile = useIsMobile()
    const { activeBusiness } = useBusiness()
    const { currentStore, stores } = useStores()
    const currencyCode = activeBusiness?.currency ?? "NGN"
    const [search, setSearch] = React.useState("")
    const deferredSearch = React.useDeferredValue(search)
    const [currentPage, setCurrentPage] = React.useState(1)
    const [selectedFilters, setSelectedFilters] = React.useState<string[]>([])
    const [isAddOpen, setIsAddOpen] = React.useState(false)
    const [editingItem, setEditingItem] = React.useState<Customer | null>(null)
    const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false)
    const [itemToDelete, setItemToDelete] = React.useState<Customer | null>(null)
    const [viewingCustomerId, setViewingCustomerId] = React.useState<string | null>(null)
    const [recordingPaymentFor, setRecordingPaymentFor] = React.useState<Customer | null>(null)

    const storeIds = React.useMemo(() => stores.map((s) => s.id), [stores])
    const selectedStoreIds = React.useMemo(
        () => selectedFilters.filter((id) => storeIds.includes(id)),
        [selectedFilters, storeIds]
    )
    const selectedStatusFilters = React.useMemo(
        () => selectedFilters.filter((x) => x === "owing" || x === "clean"),
        [selectedFilters]
    )

    React.useEffect(() => {
        setCurrentPage(1)
    }, [selectedStoreIds.join(",")])

    const {
        customers,
        meta,
        isPending,
        error,
        createCustomer,
        updateCustomer,
        deleteCustomer,
        isCreating,
        isUpdating,
        isDeleting,
    } = useCustomers(
        currentPage,
        PAGE_SIZE,
        deferredSearch,
        selectedStoreIds.length > 0 ? selectedStoreIds : undefined
    )

    const { data: statsData, isLoading: isStatsLoading } = useCustomerStats()
    const stats = statsData?.data

    const filterGroups = [
        {
            title: "Store Location",
            options: stores.map((s) => ({ label: s.name, value: s.id })),
        },
        {
            title: "Account Status",
            options: [
                { label: "Has Debt", value: "owing" },
                { label: "Up to Date", value: "clean" },
            ],
        },
    ]

    const [formData, setFormData] = React.useState({
        name: "",
        phoneNumber: "",
        email: "",
        isBlacklisted: false,
    })

    const filteredCustomers = React.useMemo(() => {
        return customers.filter((c) => {
            const isOwing = c.owing !== "—"
            const matchesStatus =
                selectedStatusFilters.length === 0 ||
                (selectedStatusFilters.includes("owing") && isOwing) ||
                (selectedStatusFilters.includes("clean") && !isOwing)
            return matchesStatus
        })
    }, [customers, selectedStatusFilters])

    const owingCustomersOnPage = customers.filter((c) => c.owing !== "—").length
    const totalDebtOnPage = customers.reduce((acc, curr) => {
        if (curr.owing === "—") return acc
        const val = parseInt(curr.owing.replace(/[^0-9]/g, ""), 10) || 0
        return acc + val
    }, 0)

    const viewingCustomer = React.useMemo(() =>
        customers.find(c => c.id === viewingCustomerId) || null,
        [customers, viewingCustomerId]
    )

    const resetForm = () => {
        setFormData({ name: "", phoneNumber: "", email: "", isBlacklisted: false })
    }

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        await createCustomer({
            name: formData.name.trim(),
            phoneNumber: formData.phoneNumber.trim() || undefined,
            email: formData.email.trim() || undefined,
            isBlacklisted: formData.isBlacklisted,
        })
        setIsAddOpen(false)
        resetForm()
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingItem) return
        await updateCustomer({
            id: editingItem.id,
            data: {
                name: formData.name.trim(),
                phoneNumber: formData.phoneNumber.trim() || undefined,
                email: formData.email.trim() || undefined,
                isBlacklisted: formData.isBlacklisted,
            },
        })
        setEditingItem(null)
        resetForm()
    }

    const handleDelete = async () => {
        if (!itemToDelete) return
        await deleteCustomer(itemToDelete.id)
        setConfirmDeleteOpen(false)
        setItemToDelete(null)
        setEditingItem(null)
    }

    const openEdit = (item: Customer) => {
        setFormData({
            name: item.name,
            phoneNumber: item.phoneNumber,
            email: item.email,
            isBlacklisted: item.isBlacklisted,
        })
        setEditingItem(item)
    }

    const renderCustomerActions = (item: Customer) => (
        <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-brand-deep/5 dark:hover:bg-white/5 rounded-full">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 border-brand-deep/5 dark:border-white/5 shadow-2xl">
                    <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 p-3">
                        Relationship Actions
                    </DropdownMenuLabel>
                    <DropdownMenuItem
                        onClick={() => setViewingCustomerId(item.id)}
                        className="rounded-xl flex items-center gap-3 cursor-pointer dark:text-brand-cream dark:focus:bg-white/5"
                    >
                        <div className="h-8 w-8 rounded-full bg-brand-green/10 dark:bg-emerald-500/10 flex items-center justify-center text-brand-green dark:text-emerald-400">
                            <User className="w-4 h-4" />
                        </div>
                        <span className="font-medium">View Profile</span>
                    </DropdownMenuItem>

                    {item.owing !== "—" && (
                        <DropdownMenuItem
                            onClick={() => setRecordingPaymentFor(item)}
                            className="rounded-xl flex items-center gap-3 cursor-pointer dark:text-brand-cream dark:focus:bg-white/5"
                        >
                            <div className="h-8 w-8 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                                <Receipt className="w-4 h-4" />
                            </div>
                            <span className="font-medium">Record Payment</span>
                        </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator className="bg-brand-deep/5 my-1" />

                    {item.phoneNumber && (
                        <>
                            <DropdownMenuItem className="rounded-xl flex items-center gap-3 cursor-pointer dark:text-brand-cream dark:focus:bg-white/5" asChild>
                                <a href={`tel:${item.phoneNumber}`}>
                                    <div className="h-8 w-8 rounded-full bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center text-brand-accent dark:text-brand-cream">
                                        <Phone className="w-4 h-4" />
                                    </div>
                                    <span className="font-medium">Direct Call</span>
                                </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-xl flex items-center gap-3 cursor-pointer dark:text-brand-cream dark:focus:bg-white/5" asChild>
                                <a href={`https://wa.me/${item.phoneNumber.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer">
                                    <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                        <MessageSquare className="w-4 h-4" />
                                    </div>
                                    <span className="font-medium">WhatsApp Chat</span>
                                </a>
                            </DropdownMenuItem>
                        </>
                    )}

                    <DropdownMenuSeparator className="bg-brand-deep/5 my-1" />

                    <DropdownMenuItem
                        onClick={() => openEdit(item)}
                        className="rounded-xl flex items-center gap-3 cursor-pointer dark:text-brand-cream dark:focus:bg-white/5"
                    >
                        <div className="h-8 w-8 rounded-full bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center text-brand-accent dark:text-brand-cream">
                            <UserPenIcon className="w-4 h-4" />
                        </div>
                        <span className="font-medium">Edit Profile</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={async () => {
                            await updateCustomer({
                                id: item.id,
                                data: { isBlacklisted: !item.isBlacklisted }
                            })
                        }}
                        className={cn(
                            "rounded-xl flex items-center gap-3 cursor-pointer dark:focus:bg-white/5",
                            item.isBlacklisted ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"
                        )}
                    >
                        <div className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center",
                            item.isBlacklisted ? "bg-emerald-500/10" : "bg-rose-500/10"
                        )}>
                            {item.isBlacklisted ? <CheckCircle2 className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                        </div>
                        <span className="font-medium">{item.isBlacklisted ? "Un-blacklist" : "Blacklist"}</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={async () => {
                            await updateCustomer({
                                id: item.id,
                                data: { isVip: !item.isVip }
                            })
                        }}
                        className={cn(
                            "rounded-xl flex items-center gap-3 cursor-pointer transition-colors dark:focus:bg-white/5",
                            item.isVip ? "text-brand-accent dark:text-brand-cream font-semibold" : "text-brand-gold font-medium"
                        )}
                    >
                        <div className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center transition-colors",
                            item.isVip ? "bg-brand-accent/10 dark:bg-white/5" : "bg-brand-gold/10"
                        )}>
                            <Star className={cn("w-4 h-4", item.isVip ? "text-brand-accent fill-brand-accent/20" : "text-brand-gold")} />
                        </div>
                        <span>{item.isVip ? "Demote from VIP" : "Make VIP"}</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )

    const columns: Column<Customer>[] = [
        {
            key: "name",
            header: "Customer",
            render: (_value: Customer[keyof Customer], item: Customer) => (
                <div className="flex flex-col gap-0.5">
                    <span
                        className={cn(
                            "font-serif font-medium text-base",
                            item.isBlacklisted
                                ? "text-brand-deep/30 dark:text-brand-cream/30 line-through"
                                : "text-brand-deep dark:text-brand-cream"
                        )}
                    >
                        {item.name}
                    </span>
                    {item.isVip && (
                        <div className="flex items-center gap-1 mt-1">
                            <Crown className="w-3 h-3 text-brand-gold fill-brand-gold/20" />
                            <span className="text-[9px] font-bold text-brand-gold uppercase tracking-widest">VIP</span>
                        </div>
                    )}
                    {item.isBlacklisted && (
                        <span className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter mt-1">
                            Blacklisted
                        </span>
                    )}
                </div>
            ),
        },
        { key: "orders", header: "Orders" },
        { key: "totalSpent", header: "Total Spent" },
        { key: "lastOrder", header: "Last Order" },
        {
            key: "owing",
            header: "Owing",
            render: (value: Customer[keyof Customer]) => {
                const owing = String(value)
                return (
                    <span
                        className={cn(
                            "font-medium px-2 py-0.5 rounded-full text-xs inline-flex items-center gap-1.5",
                            owing !== "—"
                                ? "bg-brand-gold/10 text-brand-deep dark:text-brand-gold border border-brand-gold/20"
                                : "text-brand-accent/30 dark:text-brand-cream/30"
                        )}
                    >
                        {owing !== "—" && (
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse" />
                        )}
                        {owing}
                    </span>
                )
            },
        },
        {
            key: "actions" as any,
            header: "",
            render: (_value, item: Customer) => renderCustomerActions(item),
        },
    ]

    const intelligenceWhisper =
        owingCustomersOnPage > 0
            ? `There are **${owingCustomersOnPage} customers** with unpaid debts totaling **₦${totalDebtOnPage.toLocaleString()}** on this page. Consider sending friendly reminders.`
            : `All customers on this page are up to date with their payments. Your credit health is looking excellent.`

    const isFormPending = isCreating || isUpdating
    const totalPages = meta?.totalPages ?? 1
    const canPrev = currentPage > 1
    const canNext = currentPage < totalPages

    if (error) {
        return (
            <PageTransition>
                <div className="max-w-5xl mx-auto space-y-8 pb-24">
                    <ManagementHeader title="Customers" description="Manage customer relationships." />
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
                    title="Customers"
                    description={`Manage customer relationships and track credit history for ${currentStore?.name || "your business"}.`}
                    addButtonLabel="Add Customer"
                    onAddClick={() => {
                        resetForm()
                        setIsAddOpen(true)
                    }}
                />

                <InsightWhisper insight={intelligenceWhisper} />

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <GlassCard className="p-5 flex items-center gap-4 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Users className="w-24 h-24" />
                        </div>
                        <div className="h-12 w-12 rounded-full bg-brand-green/10 dark:bg-brand-green/20 flex items-center justify-center text-brand-deep dark:text-brand-cream">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-brand-accent/40 dark:text-brand-cream/60 uppercase tracking-widest">
                                Total Customers
                            </p>
                            {isStatsLoading ? (
                                <Skeleton className="h-8 w-16 mt-1" />
                            ) : (
                                <p className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream">
                                    {stats?.totalCustomers ?? meta?.total ?? customers.length}
                                </p>
                            )}
                        </div>
                    </GlassCard>

                    <GlassCard className="p-5 flex items-center gap-4 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                            <TrendingUp className="w-24 h-24" />
                        </div>
                        <div className="h-12 w-12 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-brand-gold/60 dark:text-brand-gold/80 uppercase tracking-widest">
                                Active (30d)
                            </p>
                            {isStatsLoading ? (
                                <Skeleton className="h-8 w-12 mt-1" />
                            ) : (
                                <p className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-gold">
                                    {stats?.activeCustomers ?? 0}
                                </p>
                            )}
                        </div>
                    </GlassCard>

                    <GlassCard className="p-5 flex items-center gap-4 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                            <User className="w-24 h-24" />
                        </div>
                        <div className="h-12 w-12 rounded-full bg-brand-accent/10 flex items-center justify-center text-brand-accent">
                            <User className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-brand-accent/40 dark:text-brand-cream/40 uppercase tracking-widest">
                                New This Month
                            </p>
                            {isStatsLoading ? (
                                <Skeleton className="h-8 w-12 mt-1" />
                            ) : (
                                <p className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream">
                                    {stats?.newCustomers ?? 0}
                                </p>
                            )}
                        </div>
                    </GlassCard>

                    <GlassCard
                        className={cn(
                            "p-5 flex items-center gap-4 relative overflow-hidden group transition-all",
                            (stats?.totalDebt ?? 0) > 0
                                ? "border-rose-500/20 bg-rose-500/5 shadow-[0_0_20px_rgba(239,68,68,0.05)]"
                                : "border-brand-deep/5"
                        )}
                    >
                        <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity text-rose-500">
                            <AlertCircle className="w-24 h-24" />
                        </div>
                        <div className="h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-rose-500/60 uppercase tracking-widest">
                                Total Credit
                            </p>
                            {isStatsLoading ? (
                                <Skeleton className="h-8 w-12 mt-1" />
                            ) : (
                                <p className="text-2xl font-serif font-medium text-rose-500">
                                    <CurrencyText value={formatCurrency(stats?.totalDebt ?? 0, { currency: currencyCode })} />
                                </p>
                            )}
                        </div>
                    </GlassCard>
                </div>

                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-accent/40 dark:text-brand-cream/40 ml-1">
                            Relationship List
                        </p>
                        <div className="flex items-center gap-3 font-sans w-full md:w-auto">
                            <TableSearch
                                value={search}
                                onChange={setSearch}
                                placeholder="Search by name..."
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

                {isPending && !customers.length ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                        ))}
                    </div>
                ) : isMobile ? (
                    <div className="space-y-3">
                        {filteredCustomers.length === 0 ? (
                            <GlassCard className="p-12 text-center border-dashed border-brand-deep/20 dark:border-white/10 bg-transparent">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="h-16 w-16 rounded-3xl bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center mb-2">
                                        <Users className="w-8 h-8 text-brand-deep/20 dark:text-white/20" />
                                    </div>
                                    <h3 className="text-brand-deep dark:text-brand-cream font-medium">No customers found</h3>
                                    <p className="text-xs text-brand-accent/40 dark:text-brand-cream/40 max-w-[240px] mx-auto">
                                        Try adjusting your filters or search terms to find what you're looking for.
                                    </p>
                                </div>
                            </GlassCard>
                        ) : (
                            filteredCustomers.map((customer, index) => (
                                <ListCard
                                    key={customer.id}
                                    title={customer.name}
                                    subtitle={customer.lastOrder !== "Never" ? `Last order: ${customer.lastOrder}` : "No orders yet"}
                                    meta={`${customer.orders} orders total`}
                                    icon={User}
                                    iconClassName="text-brand-deep/40 dark:text-brand-cream/40"
                                    status={customer.isBlacklisted ? "Blacklisted" : customer.isVip ? "VIP" : undefined}
                                    statusColor={customer.isBlacklisted ? "danger" : customer.isVip ? "warning" : undefined}
                                    value={
                                        customer.owing !== "—" ? customer.owing : customer.totalSpent
                                    }
                                    valueLabel={customer.owing !== "—" ? "Current Debt" : "Total Lifetime Spend"}
                                    delay={index * 0.05}
                                    actions={renderCustomerActions(customer)}
                                    onClick={() => setViewingCustomerId(customer.id)}
                                />
                            ))
                        )}
                    </div>
                ) : (
                    <GlassCard className="overflow-hidden border-brand-deep/5 dark:border-white/5">
                        <DataTable
                            columns={columns}
                            data={filteredCustomers}
                            emptyMessage="No customers found"
                        />
                    </GlassCard>
                )}

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

                <Drawer
                    open={isAddOpen || !!editingItem}
                    onOpenChange={(open) => {
                        if (!open) {
                            setIsAddOpen(false)
                            setEditingItem(null)
                        }
                    }}
                >
                    <DrawerContent>
                        <DrawerStickyHeader>
                            <DrawerTitle>
                                {editingItem ? "Edit Profile" : "Add New Customer"}
                            </DrawerTitle>
                            <DrawerDescription>
                                {editingItem
                                    ? "Update customer information."
                                    : "Start a new business relationship."}
                            </DrawerDescription>
                        </DrawerStickyHeader>

                        <div className="p-8 pb-12 overflow-y-auto">
                            <form
                                onSubmit={editingItem ? handleUpdate : handleAdd}
                                className="max-w-lg mx-auto space-y-6"
                            >
                                <div className="space-y-3">
                                    <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1 block">
                                        Customer Name
                                    </label>
                                    <input
                                        autoFocus
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
                                        }
                                        placeholder="e.g. Mrs. Adebayo"
                                        className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/20 text-brand-deep dark:text-brand-cream"
                                        required
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1 block">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phoneNumber}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                phoneNumber: e.target.value,
                                            })
                                        }
                                        placeholder="e.g. 08012345678"
                                        className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/20 text-brand-deep dark:text-brand-cream"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1 block">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) =>
                                            setFormData({ ...formData, email: e.target.value })
                                        }
                                        placeholder="e.g. adebayo@example.com"
                                        className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/20 text-brand-deep dark:text-brand-cream"
                                    />
                                </div>

                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-brand-deep/2 dark:bg-white/5 border border-brand-deep/5 dark:border-white/5">
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-medium text-brand-deep dark:text-brand-cream">
                                                Blacklist Customer
                                            </p>
                                            <p className="text-xs text-brand-accent/40 dark:text-brand-cream/40">
                                                Prevent this customer from making new orders.
                                            </p>
                                        </div>
                                        <Switch
                                            checked={formData.isBlacklisted}
                                            onCheckedChange={(checked) =>
                                                setFormData({
                                                    ...formData,
                                                    isBlacklisted: checked,
                                                })
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <DrawerClose asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="flex-1 rounded-2xl h-14 border-brand-deep/5 dark:border-white/5 dark:text-brand-cream"
                                        >
                                            Cancel
                                        </Button>
                                    </DrawerClose>
                                    <Button
                                        type="submit"
                                        disabled={isFormPending}
                                        className="flex-1 rounded-2xl h-14 bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold shadow-xl"
                                    >
                                        {isFormPending ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : editingItem ? (
                                            "Save Changes"
                                        ) : (
                                            "Create Customer"
                                        )}
                                    </Button>
                                </div>

                                {editingItem && (
                                    <div className="pt-6 border-t border-brand-deep/5 dark:border-white/5 mt-6">
                                        <button
                                            type="button"
                                            disabled={isDeleting}
                                            onClick={() => {
                                                setItemToDelete(editingItem)
                                                setConfirmDeleteOpen(true)
                                            }}
                                            className="flex items-center justify-center gap-2 w-full py-4 text-xs font-bold text-rose-500/60 hover:text-rose-500 transition-all uppercase tracking-widest disabled:opacity-50"
                                        >
                                            {isDeleting ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                            Remove Customer Profile
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                    </DrawerContent>
                </Drawer>

                <ConfirmDialog
                    open={confirmDeleteOpen}
                    onOpenChange={setConfirmDeleteOpen}
                    onConfirm={handleDelete}
                    title="Delete Customer Profile"
                    description={`Are you sure you want to remove ${itemToDelete?.name}? This action cannot be undone and will remove their contact records.`}
                    confirmText="Delete Profile"
                    variant="destructive"
                />

                <CustomerProfileDrawer
                    customer={viewingCustomer}
                    open={!!viewingCustomerId}
                    onOpenChange={(open) => !open && setViewingCustomerId(null)}
                    onEdit={(c) => {
                        setViewingCustomerId(null)
                        openEdit(c)
                    }}
                    onUpdateVip={async (id, isVip) => {
                        await updateCustomer({ id, data: { isVip } })
                    }}
                />

                <RecordPaymentDrawer
                    order={recordingPaymentFor ? ({
                        id: recordingPaymentFor.id,
                        totalAmount: recordingPaymentFor.owing.replace(/[^0-9]/g, ""),
                        amountPaid: "0",
                        currency: currencyCode,
                        shortCode: recordingPaymentFor.name.substring(0, 8),
                    } as any) : null}
                    open={!!recordingPaymentFor}
                    onOpenChange={(open) => !open && setRecordingPaymentFor(null)}
                    onSuccess={async (amount, method) => {
                        // This would typically call a Collect Payment API
                        console.log(`Collecting ${amount} via ${method} for ${recordingPaymentFor?.name}`)
                    }}
                    isSubmitting={false}
                />
            </div>
        </PageTransition>
    )
}
