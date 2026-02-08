"use client"

import DataTable from '../components/DataTable' // Keep using for desktop but we wrap it
import { useIsMobile } from '../hooks/useMediaQuery'
import { PageTransition } from '../components/layout/page-transition'
import { ListCard } from '../components/ui/list-card'
import { GlassCard } from '../components/ui/glass-card'
import { Filter } from 'lucide-react'
import { Button } from '../components/ui/button'

const mockOrders = [
    { id: '1', date: 'Today, 2:34 PM', customer: 'Mrs. Adebayo', items: 3, amount: '₦12,500', status: 'Paid' },
    { id: '2', date: 'Today, 1:15 PM', customer: 'Walk-in', items: 1, amount: '₦4,200', status: 'Paid' },
    { id: '3', date: 'Today, 11:42 AM', customer: 'Fatima Shop', items: 5, amount: '₦28,000', status: 'Pending' },
    { id: '4', date: 'Yesterday', customer: 'Chief Okonkwo', items: 2, amount: '₦8,500', status: 'Pending' },
    { id: '5', date: 'Yesterday', customer: 'Walk-in', items: 1, amount: '₦3,800', status: 'Paid' },
    { id: '6', date: 'Feb 5', customer: 'Mrs. Adebayo', items: 4, amount: '₦15,000', status: 'Pending' },
    { id: '7', date: 'Feb 5', customer: 'Blessing Stores', items: 2, amount: '₦9,200', status: 'Paid' },
    { id: '8', date: 'Feb 4', customer: 'Walk-in', items: 1, amount: '₦2,500', status: 'Paid' },
]

// Fix columns type to be compatible with DataTable
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const columns: any[] = [
    { key: 'date', header: 'Date' },
    { key: 'customer', header: 'Customer' },
    { key: 'items', header: 'Items' },
    { key: 'amount', header: 'Amount' },
    {
        key: 'status',
        header: 'Status',
        render: (value: string) => (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${value === 'Paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                {value}
            </span>
        )
    },
]

export default function OrdersPage() {
    const isMobile = useIsMobile()
    const totalOrders = mockOrders.length
    const paidOrders = mockOrders.filter(o => o.status === 'Paid').length

    return (
        <PageTransition>
            <div className="flex items-end justify-between mb-6">
                <div>
                    <h1 className="font-serif text-3xl font-semibold tracking-tight">Orders</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {totalOrders} orders • {paidOrders} paid • {totalOrders - paidOrders} pending
                    </p>
                </div>
                <Button variant="outline" size="sm" className="gap-2 hidden md:flex">
                    <Filter className="h-4 w-4" /> Filter
                </Button>
            </div>

            {isMobile ? (
                <div className="space-y-3 pb-20">
                    {mockOrders.map((order, index) => (
                        <ListCard
                            key={order.id}
                            title={order.customer}
                            subtitle={order.date}
                            status={order.status}
                            statusColor={order.status === 'Paid' ? 'success' : 'warning'}
                            value={order.amount}
                            valueLabel={`${order.items} items`}
                            delay={index * 0.05}
                        />
                    ))}
                </div>
            ) : (
                <GlassCard className="p-1">
                    <DataTable columns={columns} data={mockOrders} emptyMessage="No orders yet" />
                </GlassCard>
            )}
        </PageTransition>
    )
}
