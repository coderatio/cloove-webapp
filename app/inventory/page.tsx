"use client"

import DataTable from '../components/DataTable'
import { useIsMobile } from '../hooks/useMediaQuery'
import { PageTransition } from '../components/layout/page-transition'
import { ListCard } from '../components/ui/list-card'
import { GlassCard } from '../components/ui/glass-card'
import { AlertTriangle } from 'lucide-react'

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

const columns: any[] = [
    { key: 'product', header: 'Product' },
    {
        key: 'stock',
        header: 'Stock',
        render: (value: number) => (
            <span
                className={value <= 5 ? 'font-bold text-rose-600 dark:text-rose-400' : ''}
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
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${value === 'In Stock' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
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
            <div className="mb-6">
                <h1 className="font-serif text-3xl font-semibold tracking-tight">Inventory</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {totalProducts} products • {lowStockItems} low stock
                </p>
            </div>

            {lowStockItems > 0 && (
                <GlassCard className="mb-6 p-4 border-l-4 border-l-rose-500 bg-rose-50/50 dark:bg-rose-950/10 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-rose-900 dark:text-rose-400 text-sm">
                            {lowStockItems} items running low
                        </p>
                        <p className="text-xs text-rose-700 dark:text-rose-500/80 mt-0.5">
                            Restock Lace & Cotton soon
                        </p>
                    </div>
                </GlassCard>
            )}

            {isMobile ? (
                <div className="space-y-3 pb-20">
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
                <GlassCard className="p-1">
                    <DataTable columns={columns} data={mockInventory} emptyMessage="No products yet" />
                </GlassCard>
            )}
        </PageTransition>
    )
}
