"use client"

import React, { useState } from "react"
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerTitle,
    DrawerClose,
} from "@/app/components/ui/drawer"
import { Button } from "@/app/components/ui/button"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Badge } from "@/app/components/ui/badge"
import {
    Filter,
    ArrowLeft,
    Loader2,
} from "lucide-react"
import { type Customer } from "../hooks/useCustomers"
import { useOrders } from "../../orders/hooks/useOrders"
import { type Order, OrderStatus, PaymentStatus } from "../../orders/types"
import { useBusiness } from "@/app/components/BusinessProvider"
import { cn } from "@/app/lib/utils"
import { TableSearch } from "@/app/components/shared/TableSearch"
import { FilterPopover } from "@/app/components/shared/FilterPopover"
import { DateRangePicker } from "@/app/components/shared/DateRangePicker"
import { Pagination } from "@/app/components/shared/Pagination"
import { OrderDetailsDrawer } from "../../orders/components/OrderDetailsDrawer"
import { CustomerTransactionListItem } from "./CustomerTransactionListItem"
import { useReceiptPrinter } from "@/app/hooks/useReceiptPrinter"
import { format } from "date-fns"

interface CustomerLedgerDrawerProps {
    customer: Customer | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CustomerLedgerDrawer({
    customer,
    open,
    onOpenChange
}: CustomerLedgerDrawerProps) {
    const { activeBusiness } = useBusiness()
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState("")
    const [selectedFilters, setSelectedFilters] = useState<string[]>([])
    const [startDate, setStartDate] = useState<string | undefined>()
    const [endDate, setEndDate] = useState<string | undefined>()
    const [viewingOrder, setViewingOrder] = useState<Order | null>(null)

    const limit = 10
    const {
        orders,
        meta,
        isLoading,
        updateOrder,
        isUpdating,
        deleteOrder,
        isDeleting
    } = useOrders(page, limit, {
        search,
        customerId: customer?.id,
        status: selectedFilters.filter(f => f.startsWith('S:')).map(f => f.slice(2)) as OrderStatus[],
        paymentStatus: selectedFilters.filter(f => f.startsWith('P:')).map(f => f.slice(2)) as PaymentStatus[],
        startDate,
        endDate,
    })

    const { printReceipt } = useReceiptPrinter()

    if (!customer) return null

    const currencyCode = activeBusiness?.currency || 'NGN'

    const filterGroups = [
        {
            title: "Order Status",
            options: [
                { label: "Completed", value: "S:COMPLETED" },
                { label: "Pending", value: "S:PENDING" },
                { label: "Cancelled", value: "S:CANCELLED" },
            ]
        },
        {
            title: "Payment Status",
            options: [
                { label: "Paid", value: "P:PAID" },
                { label: "Partial", value: "P:PARTIAL" },
                { label: "Pending", value: "P:PENDING" },
            ]
        }
    ]

    const handlePrintReceipt = async (order: Order) => {
        if (!activeBusiness) return
        const receiptData = {
            businessName: activeBusiness.name,
            businessAddress: (activeBusiness as any).address,
            businessPhone: (activeBusiness as any).phone,
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
        await printReceipt(receiptData)
    }

    return (
        <>
            <Drawer open={open} onOpenChange={onOpenChange}>
                <DrawerContent>
                    <DrawerStickyHeader className="border-b border-brand-deep/5 dark:border-white/5">
                        <div className="flex items-center gap-4">
                            <DrawerClose asChild>
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full dark:text-brand-cream hover:dark:bg-white/10">
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                            </DrawerClose>
                            <div>
                                <DrawerTitle className="text-xl font-serif">Transaction Ledger</DrawerTitle>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40">
                                    {customer.name} • {meta?.total || 0} Transactions
                                </p>
                            </div>
                        </div>
                    </DrawerStickyHeader>

                    <div className="p-6 overflow-y-auto max-h-[80vh] space-y-6">
                        {/* Filters Row */}
                        <div className="flex flex-col md:flex-row gap-3">
                            <TableSearch
                                value={search}
                                onChange={(val) => { setSearch(val); setPage(1); }}
                                placeholder="Search transactions..."
                                className="flex-1 w-full"
                            />
                            <div className="flex flex-row items-center gap-2 w-full md:w-auto">
                                <div className="flex-1 md:flex-none">
                                    <FilterPopover
                                        groups={filterGroups}
                                        selectedValues={selectedFilters}
                                        onSelectionChange={(values) => { setSelectedFilters(values); setPage(1); }}
                                        onClear={() => { setSelectedFilters([]); setPage(1); }}
                                    />
                                </div>
                                <div className="flex-1 md:flex-none">
                                    <DateRangePicker
                                        value={{
                                            from: startDate ? new Date(startDate) : undefined,
                                            to: endDate ? new Date(endDate) : undefined
                                        }}
                                        onChange={(range) => {
                                            setStartDate(range?.from);
                                            setEndDate(range?.to);
                                            setPage(1);
                                        }}
                                        placeholder="Dates"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Transactions List */}
                        <div className="space-y-3">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="w-8 h-8 animate-spin text-brand-gold" />
                                </div>
                            ) : orders.length > 0 ? (
                                <>
                                    <div className="bg-brand-deep/5 dark:bg-white/5 p-4 rounded-3xl space-y-3">
                                        {orders.map((tx: Order) => (
                                            <CustomerTransactionListItem
                                                key={tx.id}
                                                transaction={tx}
                                                currencyCode={currencyCode}
                                                onClick={() => setViewingOrder(tx)}
                                            />
                                        ))}
                                    </div>
                                    <Pagination
                                        currentPage={page}
                                        totalPages={meta?.lastPage || 1}
                                        onPageChange={setPage}
                                        isLoading={isLoading}
                                    />
                                </>
                            ) : (
                                <div className="py-20 text-center space-y-4">
                                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-deep/5 dark:bg-white/5">
                                        <Filter className="w-8 h-8 text-brand-accent/20 dark:text-brand-cream/20" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-serif font-medium text-brand-deep dark:text-brand-cream">No records found</p>
                                        <p className="text-[10px] text-brand-accent/40 dark:text-brand-cream/40 uppercase tracking-widest">Try adjusting your filters</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>

            <OrderDetailsDrawer
                order={viewingOrder}
                open={!!viewingOrder}
                onOpenChange={(open) => !open && setViewingOrder(null)}
                onUpdateStatus={async (id, status) => { await updateOrder({ id, updates: { status } }) }}
                onDelete={async (id) => { await deleteOrder(id) }}
                onPrintReceipt={handlePrintReceipt}
                isUpdating={isUpdating}
                isDeleting={isDeleting}
            />
        </>
    )
}
