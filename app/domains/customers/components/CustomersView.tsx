"use client"

import * as React from "react"
import DataTable, { type Column } from "@/app/components/DataTable"
import { useIsMobile } from "@/app/hooks/useMediaQuery"
import { PageTransition } from "@/app/components/layout/page-transition"
import { ListCard } from "@/app/components/ui/list-card"
import { GlassCard } from "@/app/components/ui/glass-card"
import { AlertCircle, Users, Trash2, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/app/lib/utils"
import { ManagementHeader } from "@/app/components/shared/ManagementHeader"
import { InsightWhisper } from "@/app/components/dashboard/InsightWhisper"
import { useBusiness } from "@/app/components/BusinessProvider"
import { useStores } from "@/app/domains/stores/providers/StoreProvider"
import { formatCurrency } from "@/app/lib/formatters"
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
import { useCustomers, type Customer } from "../hooks/useCustomers"

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
                    {item.isBlacklisted && (
                        <span className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">
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
                                : "text-brand-accent/30"
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
                            className="rounded-2xl"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <GlassCard className="p-5 flex items-center gap-4 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Users className="w-24 h-24" />
                        </div>
                        <div className="h-12 w-12 rounded-full bg-brand-green/10 dark:bg-brand-green/20 flex items-center justify-center text-brand-deep dark:text-brand-cream">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-brand-accent/40 dark:text-brand-cream/60 uppercase tracking-wider">
                                Total Customers
                            </p>
                            {isPending && !customers.length ? (
                                <Skeleton className="h-8 w-16 mt-1" />
                            ) : (
                                <p className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream">
                                    {meta?.total ?? customers.length}
                                </p>
                            )}
                        </div>
                    </GlassCard>

                    <GlassCard
                        className={cn(
                            "p-5 flex items-center gap-4 relative overflow-hidden group transition-all",
                            owingCustomersOnPage > 0
                                ? "border-brand-gold/30 bg-brand-gold/5"
                                : "border-brand-deep/5"
                        )}
                    >
                        <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity text-brand-gold">
                            <AlertCircle className="w-24 h-24" />
                        </div>
                        <div className="h-12 w-12 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-brand-gold/60 dark:text-brand-gold/70 uppercase tracking-wider">
                                Payments Pending
                            </p>
                            <div className="flex items-baseline gap-2">
                                {isPending && !customers.length ? (
                                    <Skeleton className="h-8 w-12 mt-1" />
                                ) : (
                                    <>
                                        <p className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-gold">
                                            {owingCustomersOnPage}
                                        </p>
                                        <span className="text-sm text-brand-accent/40">
                                            {formatCurrency(totalDebtOnPage, { currency: currencyCode })} due
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </GlassCard>
                </div>

                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-accent/40 dark:text-brand-cream/40 ml-1">
                            Relationship List
                        </p>
                        <div className="flex items-center gap-3 font-sans">
                            <TableSearch
                                value={search}
                                onChange={setSearch}
                                placeholder="Search by name..."
                            />
                            <FilterPopover
                                groups={filterGroups}
                                selectedValues={selectedFilters}
                                onSelectionChange={setSelectedFilters}
                                onClear={() => setSelectedFilters([])}
                            />
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
                        {filteredCustomers.map((customer, index) => (
                            <ListCard
                                key={customer.id}
                                title={customer.name}
                                subtitle={`${customer.orders} orders • Last: ${customer.lastOrder}`}
                                status={customer.owing !== "—" ? "Owing" : undefined}
                                statusColor={customer.owing !== "—" ? "warning" : undefined}
                                value={
                                    customer.owing !== "—" ? customer.owing : customer.totalSpent
                                }
                                valueLabel={customer.owing !== "—" ? "Debt" : "Total Spent"}
                                delay={index * 0.05}
                                onClick={() => openEdit(customer)}
                            />
                        ))}
                    </div>
                ) : (
                    <GlassCard className="overflow-hidden border-brand-deep/5 dark:border-white/5">
                        <DataTable
                            columns={columns}
                            data={filteredCustomers}
                            emptyMessage="No customers found"
                            onRowClick={(item: Customer) => openEdit(item)}
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
                            className="rounded-xl"
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
                            className="rounded-xl"
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
                                            className="flex-1 rounded-2xl h-14"
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
            </div>
        </PageTransition>
    )
}
