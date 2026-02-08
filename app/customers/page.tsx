"use client"

import DataTable from '../components/DataTable'
import { useIsMobile } from '../hooks/useMediaQuery'
import { PageTransition } from '../components/layout/page-transition'
import { ListCard } from '../components/ui/list-card'
import { GlassCard } from '../components/ui/glass-card'
import { AlertCircle, Users } from 'lucide-react'
import { cn } from '@/app/lib/utils'

const mockCustomers = [
    { id: '1', name: 'Mrs. Adebayo', orders: 12, totalSpent: '₦156,000', lastOrder: 'Today', owing: '₦15,000' },
    { id: '2', name: 'Chief Okonkwo', orders: 8, totalSpent: '₦89,500', lastOrder: 'Yesterday', owing: '₦8,500' },
    { id: '3', name: 'Fatima Shop', orders: 15, totalSpent: '₦234,000', lastOrder: 'Today', owing: '₦5,000' },
    { id: '4', name: 'Blessing Stores', orders: 6, totalSpent: '₦54,200', lastOrder: 'Feb 5', owing: '—' },
    { id: '5', name: 'Mama Tunde', orders: 4, totalSpent: '₦32,800', lastOrder: 'Feb 3', owing: '—' },
    { id: '6', name: 'Grace Fashion', orders: 9, totalSpent: '₦118,500', lastOrder: 'Feb 1', owing: '—' },
]



// eslint-disable-next-line @typescript-eslint/no-explicit-any
const columns: any[] = [
    {
        key: 'name',
        header: 'Customer',
        render: (value: string) => <span className="font-serif font-medium text-brand-deep dark:text-brand-cream text-base">{value}</span>
    },
    { key: 'orders', header: 'Orders' },
    { key: 'totalSpent', header: 'Total Spent' },
    { key: 'lastOrder', header: 'Last Order' },
    {
        key: 'owing',
        header: 'Owing',
        render: (value: string) => (
            <span
                className={cn(
                    "font-medium px-2 py-0.5 rounded-full text-xs inline-flex items-center gap-1.5",
                    value !== '—'
                        ? "bg-brand-gold/10 text-brand-deep dark:text-brand-gold border border-brand-gold/20"
                        : "text-muted-foreground"
                )}
            >
                {value !== '—' && <div className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse" />}
                {value}
            </span>
        )
    },
]

export default function CustomersPage() {
    const isMobile = useIsMobile()
    const totalCustomers = mockCustomers.length
    const owingCustomers = mockCustomers.filter(c => c.owing !== '—').length
    const totalDebt = "₦28,500" // Calculated from mock data

    return (
        <PageTransition>
            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex flex-col gap-2">
                    <h1 className="font-serif text-4xl font-medium tracking-tight text-brand-deep dark:text-brand-cream">
                        Customers
                    </h1>
                    <p className="text-brand-deep/60 dark:text-brand-cream/60">
                        Manage your relationships and track reliable clients.
                    </p>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <GlassCard className="p-5 flex items-center gap-4 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Users className="w-24 h-24" />
                        </div>
                        <div className="h-12 w-12 rounded-full bg-brand-green/10 dark:bg-brand-green/20 flex items-center justify-center text-brand-deep dark:text-brand-cream">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Customers</p>
                            <p className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream">{totalCustomers}</p>
                        </div>
                    </GlassCard>

                    {owingCustomers > 0 && (
                        <GlassCard className="p-5 flex items-center gap-4 relative overflow-hidden group border-brand-gold/30 bg-brand-gold/5">
                            <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                                <AlertCircle className="w-24 h-24 text-brand-gold" />
                            </div>
                            <div className="h-12 w-12 rounded-full bg-brand-gold/20 flex items-center justify-center text-brand-deep">
                                <AlertCircle className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-brand-deep/70 uppercase tracking-wider">Payments Pending</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-gold">{owingCustomers}</p>
                                    <span className="text-sm text-brand-deep/60 dark:text-brand-cream/60">owing {totalDebt}</span>
                                </div>
                            </div>
                        </GlassCard>
                    )}
                </div>

                {/* Main Content */}
                {isMobile ? (
                    <div className="space-y-3 pb-24">
                        <p className="text-sm font-medium text-muted-foreground px-1">Recent Activity</p>
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
                    <div className="glass-panel p-1 rounded-2xl overflow-hidden">
                        <DataTable columns={columns} data={mockCustomers} emptyMessage="No customers found" />
                    </div>
                )}
            </div>
        </PageTransition>
    )
}
