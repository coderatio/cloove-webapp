"use client"

import DataTable from '../components/DataTable'
import { useIsMobile } from '../hooks/useMediaQuery'
import { PageTransition } from '../components/layout/page-transition'
import { ListCard } from '../components/ui/list-card'
import { GlassCard } from '../components/ui/glass-card'
import { AlertTriangle, Package } from 'lucide-react'
import { cn } from '@/app/lib/utils'

const mockInventory = [
    { id: '1', product: 'Ankara Fabric (Blue)', stock: 45, price: '₦4,500', status: 'In Stock' },
    { id: '2', product: 'Ankara Fabric (Gold)', stock: 32, price: '₦4,500', status: 'In Stock' },
    { id: '3', product: 'Lace Material (White)', stock: 3, price: '₦12,000', status: 'Low Stock' },
    { id: '4', product: 'Lace Material (Cream)', stock: 18, price: '₦12,000', status: 'In Stock' },
    { id: '5', product: 'Plain Cotton', stock: 2, price: '₦2,500', status: 'Low Stock' },
    { id: '6', product: 'Silk Blend', stock: 25, price: '₦8,500', status: 'In Stock' },
    { id: '7', product: 'Velvet (Red)', stock: 12, price: '₦6,800', status: 'In Stock' },
    { id: '8', product: 'Velvet (Black)', stock: 8, price: '₦6,800', status: 'In Stock' },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const columns: any[] = [
    {
        key: 'product',
        header: 'Product',
        render: (value: string) => <span className="font-medium text-brand-deep dark:text-brand-cream">{value}</span>
    },
    {
        key: 'stock',
        header: 'Stock',
        render: (value: number) => (
            <span
                className={cn(
                    "font-mono",
                    value <= 5 ? 'font-bold text-rose-600 dark:text-rose-400' : 'text-muted-foreground'
                )}
            >
                {value} units
            </span>
        )
    },
    { key: 'price', header: 'Price' },
    {
        key: 'status',
        header: 'Status',
        render: (value: string) => (
            <span className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                value === 'In Stock'
                    ? 'bg-brand-green/10 text-brand-green dark:bg-brand-green/20 dark:text-brand-cream'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            )}>
                {value}
            </span>
        )
    },
]

export default function InventoryPage() {
    const isMobile = useIsMobile()
    const totalProducts = mockInventory.length
    const lowStockItems = mockInventory.filter(i => i.status === 'Low Stock').length

    const sortedInventory = isMobile
        ? [...mockInventory].sort((a, b) => {
            if (a.status === 'Low Stock' && b.status !== 'Low Stock') return -1
            if (a.status !== 'Low Stock' && b.status === 'Low Stock') return 1
            return 0
        })
        : mockInventory

    return (
        <PageTransition>
            <div className="max-w-4xl mx-auto space-y-6 pb-24">
                {/* Header Section */}
                <div className="flex flex-col gap-2">
                    <h1 className="font-serif text-4xl font-medium tracking-tight text-brand-deep dark:text-brand-cream">
                        Inventory
                    </h1>
                    <p className="text-brand-deep/60 dark:text-brand-cream/60">
                        Track your stock levels and product catalog.
                    </p>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <GlassCard className="p-5 flex items-center gap-4 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Package className="w-24 h-24" />
                        </div>
                        <div className="h-12 w-12 rounded-full bg-brand-green/10 dark:bg-brand-green/20 flex items-center justify-center text-brand-deep dark:text-brand-cream">
                            <Package className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Products</p>
                            <p className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream">{totalProducts}</p>
                        </div>
                    </GlassCard>

                    {lowStockItems > 0 && (
                        <GlassCard className="p-5 flex items-center gap-4 relative overflow-hidden group border-rose-500/30 bg-rose-500/5">
                            <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                                <AlertTriangle className="w-24 h-24 text-rose-500" />
                            </div>
                            <div className="h-12 w-12 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-rose-700 dark:text-rose-400 uppercase tracking-wider">Low Stock Output</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-2xl font-serif font-medium text-rose-600 dark:text-rose-400">{lowStockItems}</p>
                                    <span className="text-sm text-rose-600/60 dark:text-rose-400/60">items need attention</span>
                                </div>
                            </div>
                        </GlassCard>
                    )}
                </div>

                {/* Main Content */}
                {isMobile ? (
                    <div className="space-y-3 pb-24">
                        <p className="text-sm font-medium text-muted-foreground px-1">Product List</p>
                        {sortedInventory.map((product, index) => {
                            const isLow = product.status === 'Low Stock'
                            return (
                                <ListCard
                                    key={product.id}
                                    title={product.product}
                                    subtitle={product.price}
                                    status={product.status}
                                    statusColor={isLow ? 'danger' : 'success'}
                                    value={`${product.stock}`}
                                    valueLabel="units"
                                    delay={index * 0.05}
                                />
                            )
                        })}
                    </div>
                ) : (
                    <div className="glass-panel p-1 rounded-2xl overflow-hidden">
                        <DataTable columns={columns} data={mockInventory} emptyMessage="No products found" />
                    </div>
                )}
            </div>
        </PageTransition>
    )
}
