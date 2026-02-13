"use client"

import * as React from 'react'
import DataTable from '@/app/components/DataTable'
import { useIsMobile } from '@/app/hooks/useMediaQuery'
import { PageTransition } from '@/app/components/layout/page-transition'
import { ListCard } from '@/app/components/ui/list-card'
import { GlassCard } from '@/app/components/ui/glass-card'
import { ShoppingBag, TrendingUp, Trash2, ReceiptText } from 'lucide-react'
import { cn } from '@/app/lib/utils'
import { ManagementHeader } from '@/app/components/shared/ManagementHeader'
import { InsightWhisper } from '@/app/components/dashboard/InsightWhisper'
import { useBusiness } from '@/app/components/BusinessProvider'
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
import { initialOrders } from '../data/ordersMocks'

export function OrdersView() {
    const isMobile = useIsMobile()
    const { currentStore, stores } = useBusiness()
    const [orders, setOrders] = React.useState(initialOrders)
    const [search, setSearch] = React.useState("")
    const [selectedFilters, setSelectedFilters] = React.useState<string[]>([])
    const [viewingOrder, setViewingOrder] = React.useState<any>(null)

    const filterGroups = [
        {
            title: "Store Location",
            options: stores.map(s => ({ label: s.name, value: s.id }))
        },
        {
            title: "Order Status",
            options: [
                { label: "Completed", value: "Completed" },
                { label: "Pending", value: "Pending" },
                { label: "Cancelled", value: "Cancelled" },
            ]
        }
    ]

    const completedOrdersValue = orders
        .filter(o => o.status === 'Completed')
        .reduce((acc, curr) => acc + (parseInt(curr.total.replace(/[^0-9]/g, '')) || 0), 0)

    const filteredOrders = orders.filter(o => {
        const matchesSearch = o.customer.toLowerCase().includes(search.toLowerCase()) || o.id.includes(search)
        const matchesStatus = selectedFilters.length === 0 || selectedFilters.includes(o.status)
        return matchesSearch && matchesStatus
    })

    const handleDelete = (id: string) => {
        setOrders(orders.filter(o => o.id !== id))
        setViewingOrder(null)
    }

    const columns: any[] = [
        {
            key: 'id',
            header: 'Order ID',
            render: (value: string) => <span className="font-mono text-xs text-brand-accent/40 dark:text-brand-cream/40">#{value.padStart(4, '0')}</span>
        },
        {
            key: 'customer',
            header: 'Customer',
            render: (value: string) => <span className="font-medium text-brand-deep dark:text-brand-cream">{value}</span>
        },
        { key: 'items', header: 'Items' },
        {
            key: 'total',
            header: 'Total',
            render: (value: string) => <span className="font-serif font-medium text-brand-deep dark:text-brand-cream">{value}</span>
        },
        {
            key: 'status',
            header: 'Status',
            render: (value: string) => (
                <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    value === 'Completed' ? "bg-brand-green/10 text-brand-green dark:bg-brand-gold/10 dark:text-brand-gold" :
                        value === 'Pending' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-brand-gold/70" :
                            "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                )}>
                    {value}
                </span>
            )
        },
        { key: 'date', header: 'Time' },
    ]

    const intelligenceWhisper = orders.some(o => o.status === 'Pending')
        ? `You have **${orders.filter(o => o.status === 'Pending').length} pending orders** awaiting fulfillment. Ensuring prompt delivery builds customer trust.`
        : `All orders have been successfully fulfilled. Your operations are running smoothly today.`

    return (
        <PageTransition>
            <div className="max-w-5xl mx-auto space-y-8 pb-24">
                <ManagementHeader
                    title="Orders"
                    description={`Monitor sales pipeline and track order fulfillment for ${currentStore.name}.`}
                />

                <InsightWhisper insight={intelligenceWhisper} />

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <GlassCard className="p-5 flex items-center gap-4 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                            <ShoppingBag className="w-24 h-24 dark:text-brand-cream/10" />
                        </div>
                        <div className="h-12 w-12 rounded-full bg-brand-green/10 dark:bg-brand-green/20 flex items-center justify-center text-brand-deep dark:text-brand-cream">
                            <ShoppingBag className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-brand-accent/40 dark:text-brand-cream/60 uppercase tracking-wider">Today's Orders</p>
                            <p className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream">{orders.filter(o => o.date.includes(':') || o.date === 'Today').length}</p>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-5 flex items-center gap-4 relative overflow-hidden group border-brand-green/20">
                        <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity text-brand-green dark:text-brand-cream/10">
                            <TrendingUp className="w-24 h-24" />
                        </div>
                        <div className="h-12 w-12 rounded-full bg-brand-green/10 dark:bg-brand-gold/10 flex items-center justify-center text-brand-green dark:text-brand-gold">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-brand-green/60 dark:text-brand-gold/60 uppercase tracking-wider">Revenue (Today)</p>
                            <p className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream">₦{completedOrdersValue.toLocaleString()}</p>
                        </div>
                    </GlassCard>
                </div>

                {/* Main Content */}
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-accent/40 dark:text-brand-cream/40 ml-1">Recent Transactions</p>

                        <div className="flex items-center gap-3">
                            <TableSearch
                                value={search}
                                onChange={setSearch}
                                placeholder="Search by customer or ID..."
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

                {isMobile ? (
                    <div className="space-y-3">
                        {filteredOrders.map((order, index) => (
                            <ListCard
                                key={order.id}
                                title={order.customer}
                                subtitle={`${order.items} • ${order.date}`}
                                status={order.status}
                                statusColor={order.status === 'Completed' ? 'success' : order.status === 'Pending' ? 'warning' : 'danger'}
                                value={order.total}
                                delay={index * 0.05}
                                onClick={() => setViewingOrder(order)}
                            />
                        ))}
                    </div>
                ) : (
                    <GlassCard className="overflow-hidden border-brand-deep/5 dark:border-white/5">
                        <DataTable
                            columns={columns}
                            data={filteredOrders}
                            emptyMessage="No orders found"
                            onRowClick={(item) => setViewingOrder(item)}
                        />
                    </GlassCard>
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
                                Transaction #{viewingOrder?.id.padStart(4, '0')} for {viewingOrder?.customer}
                            </DrawerDescription>
                        </DrawerStickyHeader>

                        <div className="p-8 pb-12 overflow-y-auto">
                            <div className="max-w-lg mx-auto space-y-8">
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1">Itemized List</h3>
                                    <GlassCard className="divide-y divide-brand-deep/5 dark:divide-white/5 border-brand-deep/5">
                                        <div className="p-4 flex justify-between items-center">
                                            <div>
                                                <p className="font-medium text-brand-deep dark:text-brand-cream">Ankara Fabric (Blue)</p>
                                                <p className="text-xs text-brand-accent/40 dark:text-brand-cream/40">2 units x ₦4,500</p>
                                            </div>
                                            <p className="font-serif text-brand-deep dark:text-brand-cream">₦9,000</p>
                                        </div>
                                        <div className="p-4 flex justify-between items-center">
                                            <div>
                                                <p className="font-medium text-brand-deep dark:text-brand-cream">Silk Blend</p>
                                                <p className="text-xs text-brand-accent/40 dark:text-brand-cream/40">1 unit x ₦6,000</p>
                                            </div>
                                            <p className="font-serif text-brand-deep dark:text-brand-cream">₦6,000</p>
                                        </div>
                                        <div className="p-4 flex justify-between items-center bg-brand-deep/5 dark:bg-white/5">
                                            <p className="font-bold text-xs uppercase tracking-widest text-brand-accent/60">Total Amount</p>
                                            <p className="text-xl font-serif font-medium text-brand-green dark:text-brand-gold">₦15,000</p>
                                        </div>
                                    </GlassCard>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1">Payment Information</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <GlassCard className="p-4">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/30 dark:text-brand-cream/30 mb-1">Status</p>
                                            <p className="text-sm font-medium text-brand-deep dark:text-brand-cream">{viewingOrder?.status}</p>
                                        </GlassCard>
                                        <GlassCard className="p-4">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/30 dark:text-brand-cream/30 mb-1">Method</p>
                                            <p className="text-sm font-medium text-brand-deep dark:text-brand-cream">Bank Transfer</p>
                                        </GlassCard>
                                    </div>
                                </div>

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

                                <div className="pt-6 border-t border-brand-deep/5 dark:border-white/5 mt-6">
                                    <button
                                        onClick={() => handleDelete(viewingOrder?.id)}
                                        className="flex items-center justify-center gap-2 w-full py-4 text-xs font-bold text-rose-500/60 hover:text-rose-500 transition-all uppercase tracking-widest"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Cancel & Delete Order
                                    </button>
                                </div>
                            </div>
                        </div>
                    </DrawerContent>
                </Drawer>
            </div>
        </PageTransition>
    )
}
