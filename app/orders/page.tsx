"use client"

import DataTable from '../components/DataTable'
import { useIsMobile } from '../hooks/useMediaQuery'
import { PageTransition } from '../components/layout/page-transition'
import { ListCard } from '../components/ui/list-card'
import { GlassCard } from '../components/ui/glass-card'
import { Filter, ShoppingBag, CheckCircle2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { cn } from '@/app/lib/utils'

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
    {
        key: 'date',
        header: 'Date',
        render: (value: string) => <span className="text-muted-foreground text-sm">{value}</span>
    },
    {
        key: 'customer',
        header: 'Customer',
        render: (value: string) => <span className="font-medium text-brand-deep dark:text-brand-cream">{value}</span>
    },
    { key: 'items', header: 'Items' },
    {
        key: 'amount',
        header: 'Amount',
        render: (value: string) => <span className="font-serif font-medium text-brand-deep dark:text-brand-cream">{value}</span>
    },
    {
        key: 'status',
        header: 'Status',
        render: (value: string) => (
            <span className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5",
                value === 'Paid'
                    ? 'bg-brand-green/10 text-brand-green dark:bg-brand-green/20 dark:text-brand-cream'
                    : 'bg-zinc-100 text-zinc-600 dark:bg-white/5 dark:text-white/60'
            )}>
                {value === 'Paid' && <CheckCircle2 className="w-3 h-3" />}
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
            <div className="max-w-4xl mx-auto space-y-6 pb-24">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div className="flex flex-col gap-2">
                        <h1 className="font-serif text-4xl font-medium tracking-tight text-brand-deep dark:text-brand-cream">
                            Orders
                        </h1>
                        <p className="text-brand-deep/60 dark:text-brand-cream/60">
                            View and manage your recent sales.
                        </p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2 hidden md:flex border-brand-deep/10 hover:bg-brand-deep/5 text-brand-deep dark:border-white/10 dark:text-brand-cream dark:hover:bg-white/5">
                        <Filter className="h-4 w-4" /> Filter
                    </Button>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <GlassCard className="p-5 flex items-center gap-4 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                            <ShoppingBag className="w-24 h-24" />
                        </div>
                        <div className="h-12 w-12 rounded-full bg-brand-green/10 dark:bg-brand-green/20 flex items-center justify-center text-brand-deep dark:text-brand-cream">
                            <ShoppingBag className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Orders</p>
                            <p className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream">{totalOrders}</p>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-5 flex items-center gap-4 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                            <CheckCircle2 className="w-24 h-24 text-brand-green" />
                        </div>
                        <div className="h-12 w-12 rounded-full bg-brand-green/10 dark:bg-brand-green/20 flex items-center justify-center text-brand-deep dark:text-brand-cream">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-brand-deep/70 dark:text-brand-cream/70 uppercase tracking-wider">Paid Orders</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-2xl font-serif font-medium text-brand-green dark:text-brand-gold">{paidOrders}</p>
                                <span className="text-sm text-muted-foreground">completed</span>
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* Main Content */}
                {isMobile ? (
                    <div className="space-y-3 pb-24">
                        <p className="text-sm font-medium text-muted-foreground px-1">Recent Orders</p>
                        {mockOrders.map((order, index) => (
                            <ListCard
                                key={order.id}
                                title={order.customer}
                                subtitle={order.date}
                                status={order.status}
                                statusColor={order.status === 'Paid' ? 'success' : 'neutral'} // Changed from 'warning' to 'neutral' for cleaner look
                                value={order.amount}
                                valueLabel={`${order.items} items`}
                                delay={index * 0.05}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="glass-panel p-1 rounded-2xl overflow-hidden">
                        <DataTable columns={columns} data={mockOrders} emptyMessage="No orders found" />
                    </div>
                )}
            </div>
        </PageTransition>
    )
}
