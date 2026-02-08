"use client"

import DataTable from '../components/DataTable'
import { useIsMobile } from '../hooks/useMediaQuery'
import { PageTransition } from '../components/layout/page-transition'
import { ListCard } from '../components/ui/list-card'
import { GlassCard } from '../components/ui/glass-card'
import { AlertCircle } from 'lucide-react'

const mockCustomers = [
    { id: '1', name: 'Mrs. Adebayo', orders: 12, totalSpent: '₦156,000', lastOrder: 'Today', owing: '₦15,000' },
    { id: '2', name: 'Chief Okonkwo', orders: 8, totalSpent: '₦89,500', lastOrder: 'Yesterday', owing: '₦8,500' },
    { id: '3', name: 'Fatima Shop', orders: 15, totalSpent: '₦234,000', lastOrder: 'Today', owing: '₦5,000' },
    { id: '4', name: 'Blessing Stores', orders: 6, totalSpent: '₦54,200', lastOrder: 'Feb 5', owing: '—' },
    { id: '5', name: 'Mama Tunde', orders: 4, totalSpent: '₦32,800', lastOrder: 'Feb 3', owing: '—' },
    { id: '6', name: 'Grace Fashion', orders: 9, totalSpent: '₦118,500', lastOrder: 'Feb 1', owing: '—' },
]

// Fix columns type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const columns: any[] = [
    { key: 'name', header: 'Customer' },
    { key: 'orders', header: 'Orders' },
    { key: 'totalSpent', header: 'Total Spent' },
    { key: 'lastOrder', header: 'Last Order' },
    {
        key: 'owing',
        header: 'Owing',
        render: (value: string) => (
            <span
                className={value !== '—' ? 'font-medium text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}
            >
                {value}
            </span>
        )
    },
]

export default function CustomersPage() {
    const isMobile = useIsMobile()
    const totalCustomers = mockCustomers.length
    const owingCustomers = mockCustomers.filter(c => c.owing !== '—').length

    return (
        <PageTransition>
            <div className="mb-6">
                <h1 className="font-serif text-3xl font-semibold tracking-tight">Customers</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {owingCustomers} owe you • ₦28,500 total
                </p>
            </div>

            {owingCustomers > 0 && (
                <GlassCard className="mb-6 p-4 border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-900/10 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-amber-900 dark:text-amber-400 text-sm">
                            {owingCustomers} customers owe you money
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-500/80 mt-0.5">
                            Oldest: 12 days overdue
                        </p>
                    </div>
                </GlassCard>
            )}

            {isMobile ? (
                <div className="space-y-3 pb-20">
                    {mockCustomers.map((customer, index) => {
                        const hasDebt = customer.owing !== '—'
                        return (
                            <ListCard
                                key={customer.id}
                                title={customer.name}
                                subtitle={`${customer.orders} orders • Last: ${customer.lastOrder}`}
                                status={hasDebt ? 'Owing' : undefined}
                                statusColor={hasDebt ? 'warning' : undefined}
                                value={hasDebt ? customer.owing : customer.totalSpent}
                                valueLabel={hasDebt ? 'Debt' : 'Total Spent'}
                                delay={index * 0.05}
                            />
                        )
                    })}
                </div>
            ) : (
                <GlassCard className="p-1">
                    <DataTable columns={columns} data={mockCustomers} emptyMessage="No customers yet" />
                </GlassCard>
            )}
        </PageTransition>
    )
}
