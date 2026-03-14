"use client"

import * as React from "react"
import DataTable, { type Column } from "@/app/components/DataTable"
import { useIsMobile } from "@/app/hooks/useMediaQuery"
import { PageTransition } from "@/app/components/layout/page-transition"
import { ListCard } from "@/app/components/ui/list-card"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Truck, Users, AlertCircle, ChevronLeft, ChevronRight, MoreHorizontal, Pencil, Trash2, Eye, Plus, Banknote } from "lucide-react"
import { cn } from "@/app/lib/utils"
import { ManagementHeader } from "@/app/components/shared/ManagementHeader"
import { useBusiness } from "@/app/components/BusinessProvider"
import { formatCurrency } from "@/app/lib/formatters"
import { Button } from "@/app/components/ui/button"
import { TableSearch } from "@/app/components/shared/TableSearch"
import { ConfirmDialog } from "@/app/components/shared/ConfirmDialog"
import { Skeleton } from "@/app/components/ui/skeleton"
import { useVendors, useVendorStats, usePayableMutations, type Vendor, type PayableApi } from "../hooks/useVendors"
import { VendorFormDrawer } from "./VendorFormDrawer"
import { VendorDetailDrawer } from "./VendorDetailDrawer"
import { RecordPayableDrawer } from "./RecordPayableDrawer"
import { PaySupplierDrawer } from "./PaySupplierDrawer"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/app/components/ui/dropdown-menu"

const PAGE_SIZE = 20

export function VendorsView() {
    const isMobile = useIsMobile()
    const { activeBusiness } = useBusiness()
    const currencyCode = activeBusiness?.currency ?? "NGN"
    const [search, setSearch] = React.useState("")
    const deferredSearch = React.useDeferredValue(search)
    const [currentPage, setCurrentPage] = React.useState(1)
    const [isAddOpen, setIsAddOpen] = React.useState(false)
    const [editingItem, setEditingItem] = React.useState<Vendor | null>(null)
    const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false)
    const [itemToDelete, setItemToDelete] = React.useState<Vendor | null>(null)
    const [viewingVendor, setViewingVendor] = React.useState<Vendor | null>(null)
    const [recordPayableVendor, setRecordPayableVendor] = React.useState<Vendor | null>(null)
    const [payingPayable, setPayingPayable] = React.useState<PayableApi | null>(null)

    const {
        vendors,
        meta,
        isPending,
        error,
        createVendor,
        updateVendor,
        deleteVendor,
        isCreating,
        isUpdating,
        isDeleting,
    } = useVendors(currentPage, PAGE_SIZE, deferredSearch)

    const { data: statsData, isLoading: isStatsLoading } = useVendorStats()
    const stats = statsData?.data

    const { createPayable, payPayable, isCreatingPayable, isPayingPayable } = usePayableMutations()

    const handleAdd = async (data: any) => {
        await createVendor(data)
        setIsAddOpen(false)
    }

    const handleUpdate = async (data: any) => {
        if (!editingItem) return
        await updateVendor({ id: editingItem.id, data })
        setEditingItem(null)
    }

    const handleDelete = async () => {
        if (!itemToDelete) return
        await deleteVendor(itemToDelete.id)
        setConfirmDeleteOpen(false)
        setItemToDelete(null)
        setEditingItem(null)
    }

    const handleRecordPayable = async (data: any) => {
        if (!recordPayableVendor) return
        await createPayable({ vendorId: recordPayableVendor.id, data })
        setRecordPayableVendor(null)
    }

    const handlePayPayable = async (amount: number) => {
        if (!payingPayable) return
        await payPayable({ payableId: payingPayable.id, data: { amount } })
        setPayingPayable(null)
    }

    const renderActions = (item: Vendor) => (
        <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-brand-deep/5 dark:hover:bg-white/5 rounded-full">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 border-brand-deep/5 dark:border-white/5 shadow-2xl">
                    <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 p-3">
                        Vendor Actions
                    </DropdownMenuLabel>
                    <DropdownMenuItem
                        onClick={() => setViewingVendor(item)}
                        className="rounded-xl flex items-center gap-3 cursor-pointer dark:text-brand-cream dark:focus:bg-white/5"
                    >
                        <div className="h-8 w-8 rounded-full bg-brand-green/10 dark:bg-emerald-500/10 flex items-center justify-center text-brand-green dark:text-emerald-400">
                            <Eye className="w-4 h-4" />
                        </div>
                        <span className="font-medium">View Details</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => setRecordPayableVendor(item)}
                        className="rounded-xl flex items-center gap-3 cursor-pointer dark:text-brand-cream dark:focus:bg-white/5"
                    >
                        <div className="h-8 w-8 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                            <Plus className="w-4 h-4" />
                        </div>
                        <span className="font-medium">Record Payable</span>
                    </DropdownMenuItem>
                    {item.outstanding > 0 && (
                        <DropdownMenuItem
                            onClick={() => setViewingVendor(item)}
                            className="rounded-xl flex items-center gap-3 cursor-pointer dark:text-brand-cream dark:focus:bg-white/5"
                        >
                            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <Banknote className="w-4 h-4" />
                            </div>
                            <span className="font-medium">Make Payment</span>
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="bg-brand-deep/5 my-1" />
                    <DropdownMenuItem
                        onClick={() => setEditingItem(item)}
                        className="rounded-xl flex items-center gap-3 cursor-pointer dark:text-brand-cream dark:focus:bg-white/5"
                    >
                        <div className="h-8 w-8 rounded-full bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center text-brand-accent dark:text-brand-cream">
                            <Pencil className="w-4 h-4" />
                        </div>
                        <span className="font-medium">Edit Vendor</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => {
                            setItemToDelete(item)
                            setConfirmDeleteOpen(true)
                        }}
                        className="rounded-xl flex items-center gap-3 cursor-pointer text-rose-500 dark:text-rose-400 dark:focus:bg-white/5"
                    >
                        <div className="h-8 w-8 rounded-full bg-rose-500/10 flex items-center justify-center">
                            <Trash2 className="w-4 h-4" />
                        </div>
                        <span className="font-medium">Delete Vendor</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )

    const columns: Column<Vendor>[] = [
        {
            key: "name",
            header: "Vendor",
            render: (_value, item) => (
                <span className="font-serif font-medium text-base text-brand-deep dark:text-brand-cream">
                    {item.name}
                </span>
            ),
        },
        {
            key: "phoneNumber",
            header: "Phone",
            render: (_value, item) => (
                <span className="text-brand-accent/60 dark:text-brand-cream/60">
                    {item.phoneNumber || "—"}
                </span>
            ),
        },
        {
            key: "email",
            header: "Email",
            render: (_value, item) => (
                <span className="text-brand-accent/60 dark:text-brand-cream/60">
                    {item.email || "—"}
                </span>
            ),
        },
        {
            key: "outstanding",
            header: "Outstanding",
            render: (_value, item) => (
                <span className={cn(
                    "font-medium px-2 py-0.5 rounded-full text-xs inline-flex items-center gap-1.5",
                    item.outstanding > 0
                        ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                        : "text-brand-accent/30 dark:text-brand-cream/30"
                )}>
                    {item.outstanding > 0 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    )}
                    {item.outstanding > 0
                        ? formatCurrency(item.outstanding, { currency: currencyCode })
                        : "—"}
                </span>
            ),
        },
        {
            key: "actions" as any,
            header: "",
            render: (_value, item) => renderActions(item),
        },
    ]

    const isFormPending = isCreating || isUpdating
    const totalPages = meta?.totalPages ?? 1
    const canPrev = currentPage > 1
    const canNext = currentPage < totalPages

    if (error) {
        return (
            <PageTransition>
                <div className="max-w-5xl mx-auto space-y-8 pb-24">
                    <ManagementHeader title="Vendors" description="Manage your suppliers." />
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
                    title="Vendors"
                    description="Manage your suppliers and track payables."
                    addButtonLabel="Add Vendor"
                    onAddClick={() => setIsAddOpen(true)}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <GlassCard className="p-5 flex items-center gap-4 relative overflow-hidden group rounded-3xl before:rounded-3xl">
                        <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Truck className="w-24 h-24" />
                        </div>
                        <div className="h-12 w-12 rounded-full bg-brand-green/10 dark:bg-brand-green/20 flex items-center justify-center text-brand-deep dark:text-brand-cream">
                            <Truck className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-brand-accent/40 dark:text-brand-cream/60 uppercase tracking-widest">
                                Total Vendors
                            </p>
                            {isStatsLoading ? (
                                <Skeleton className="h-8 w-12 mt-1" />
                            ) : (
                                <p className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream">
                                    {stats?.totalVendors ?? vendors.length}
                                </p>
                            )}
                        </div>
                    </GlassCard>

                    <GlassCard className="p-5 flex items-center gap-4 relative overflow-hidden group rounded-3xl before:rounded-3xl">
                        <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Users className="w-24 h-24" />
                        </div>
                        <div className="h-12 w-12 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-brand-gold/60 dark:text-brand-gold/80 uppercase tracking-widest">
                                Active Suppliers
                            </p>
                            {isStatsLoading ? (
                                <Skeleton className="h-8 w-12 mt-1" />
                            ) : (
                                <p className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-gold">
                                    {stats?.activeSuppliers ?? 0}
                                </p>
                            )}
                        </div>
                    </GlassCard>

                    <GlassCard className={cn(
                        "p-5 flex items-center gap-4 relative overflow-hidden group transition-all rounded-3xl",
                        (stats?.outstandingPayables ?? 0) > 0
                            ? "border-rose-500/20 bg-rose-500/5 shadow-[0_0_20px_rgba(239,68,68,0.05)]"
                            : "border-brand-deep/5"
                    )}>
                        <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity text-rose-500">
                            <AlertCircle className="w-24 h-24" />
                        </div>
                        <div className="h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-rose-500/60 uppercase tracking-widest">
                                Outstanding
                            </p>
                            {isStatsLoading ? (
                                <Skeleton className="h-8 w-20 mt-1" />
                            ) : (
                                <p className="text-2xl font-serif font-medium text-rose-500">
                                    {formatCurrency(stats?.outstandingPayables ?? 0, { currency: currencyCode })}
                                </p>
                            )}
                        </div>
                    </GlassCard>
                </div>

                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-accent/40 dark:text-brand-cream/40 ml-1">
                            Supplier Directory
                        </p>
                        <div className="flex items-center gap-3 font-sans w-full md:w-auto">
                            <TableSearch
                                value={search}
                                onChange={setSearch}
                                placeholder="Search vendors..."
                                className="flex-1 min-w-0 w-full"
                            />
                        </div>
                    </div>
                </div>

                {isPending && !vendors.length ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                        ))}
                    </div>
                ) : isMobile ? (
                    <div className="space-y-3">
                        {vendors.length === 0 ? (
                            <GlassCard className="p-12 text-center">
                                <div className="flex flex-col items-center space-y-4">
                                    <div className="w-20 h-20 rounded-3xl bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center">
                                        <Truck className="w-10 h-10 text-brand-accent/30 dark:text-brand-cream/30" />
                                    </div>
                                    <h3 className="text-xl font-serif font-medium text-brand-deep dark:text-brand-cream">
                                        No Vendors Found
                                    </h3>
                                    <p className="text-sm text-brand-accent/60 dark:text-brand-cream/60 max-w-[300px]">
                                        {deferredSearch
                                            ? "No vendors match your search term."
                                            : "Add a vendor to start tracking your supplier directory and payables."}
                                    </p>
                                    {!deferredSearch && (
                                        <Button
                                            onClick={() => setIsAddOpen(true)}
                                            className="rounded-2xl bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep hover:bg-brand-deep/90 dark:hover:bg-brand-gold/90 font-semibold"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Vendor
                                        </Button>
                                    )}
                                </div>
                            </GlassCard>
                        ) : (
                            vendors.map((vendor, index) => (
                                <ListCard
                                    key={vendor.id}
                                    title={vendor.name}
                                    subtitle={vendor.phoneNumber || vendor.email || "No contact info"}
                                    meta={vendor.address || undefined}
                                    icon={Truck}
                                    iconClassName="text-brand-deep/40 dark:text-brand-cream/40"
                                    status={vendor.outstanding > 0 ? "Outstanding" : undefined}
                                    statusColor={vendor.outstanding > 0 ? "danger" : undefined}
                                    value={vendor.outstanding > 0 ? formatCurrency(vendor.outstanding, { currency: currencyCode }) : undefined}
                                    valueLabel={vendor.outstanding > 0 ? "Owed" : undefined}
                                    delay={index * 0.05}
                                    actions={renderActions(vendor)}
                                    onClick={() => setViewingVendor(vendor)}
                                />
                            ))
                        )}
                    </div>
                ) : (
                    <GlassCard className="overflow-hidden border-brand-deep/5 dark:border-white/5">
                        <DataTable
                            columns={columns}
                            data={vendors}
                            emptyMessage="No vendors found"
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

                <VendorFormDrawer
                    open={isAddOpen || !!editingItem}
                    onOpenChange={(open) => {
                        if (!open) {
                            setIsAddOpen(false)
                            setEditingItem(null)
                        }
                    }}
                    editingVendor={editingItem}
                    onSubmit={editingItem ? handleUpdate : handleAdd}
                    onDelete={editingItem ? () => {
                        setItemToDelete(editingItem)
                        setConfirmDeleteOpen(true)
                    } : undefined}
                    isSubmitting={isFormPending}
                    isDeleting={isDeleting}
                />

                <VendorDetailDrawer
                    vendor={viewingVendor}
                    open={!!viewingVendor}
                    onOpenChange={(open) => !open && setViewingVendor(null)}
                    onEdit={(v) => {
                        setViewingVendor(null)
                        setEditingItem(v)
                    }}
                    onRecordPayable={(v) => {
                        setViewingVendor(null)
                        setRecordPayableVendor(v)
                    }}
                    onPayPayable={(p) => {
                        setViewingVendor(null)
                        setPayingPayable(p)
                    }}
                />

                <RecordPayableDrawer
                    vendor={recordPayableVendor}
                    open={!!recordPayableVendor}
                    onOpenChange={(open) => !open && setRecordPayableVendor(null)}
                    onSubmit={handleRecordPayable}
                    isSubmitting={isCreatingPayable}
                />

                <PaySupplierDrawer
                    payable={payingPayable}
                    open={!!payingPayable}
                    onOpenChange={(open) => !open && setPayingPayable(null)}
                    onSubmit={handlePayPayable}
                    isSubmitting={isPayingPayable}
                />

                <ConfirmDialog
                    open={confirmDeleteOpen}
                    onOpenChange={setConfirmDeleteOpen}
                    onConfirm={handleDelete}
                    title="Delete Vendor"
                    description={`Are you sure you want to remove ${itemToDelete?.name}? This action cannot be undone.`}
                    confirmText="Delete Vendor"
                    variant="destructive"
                />
            </div>
        </PageTransition>
    )
}
