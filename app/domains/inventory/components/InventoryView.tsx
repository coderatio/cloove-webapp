"use client"

import * as React from 'react'
import DataTable from '@/app/components/DataTable'
import { useIsMobile } from '@/app/hooks/useMediaQuery'
import { PageTransition } from '@/app/components/layout/page-transition'
import { ListCard } from '@/app/components/ui/list-card'
import { GlassCard } from '@/app/components/ui/glass-card'
import { AlertTriangle, Package, Trash2, Loader2, Plus } from 'lucide-react'
import { cn } from '@/app/lib/utils'
import { ManagementHeader } from '@/app/components/shared/ManagementHeader'
import { InsightWhisper } from '@/app/components/dashboard/InsightWhisper'
import { useBusiness } from '@/app/components/BusinessProvider'
import { useStores } from '@/app/domains/stores/providers/StoreProvider'
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
import { useInventory, InventoryStats } from '../hooks/useInventory'
import { MoneyInput } from '@/app/components/ui/money-input'
import { formatCurrency } from '@/app/lib/formatters'

export function InventoryView() {
    const isMobile = useIsMobile()
    const { currentStore } = useStores()
    const { products, summary, isLoading, createProduct, updateProduct, deleteProduct } = useInventory(
        currentStore?.id && currentStore.id !== 'all-stores' ? currentStore.id : undefined
    )

    const [search, setSearch] = React.useState("")
    const [selectedFilters, setSelectedFilters] = React.useState<string[]>([])
    const [isAddDrawerOpen, setIsAddDrawerOpen] = React.useState(false)
    const [editingItem, setEditingItem] = React.useState<any>(null)
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    // Form states
    const [formData, setFormData] = React.useState({ product: "", stock: 0, price: "", category: "General" })

    // Map backend products to view-friendly inventory items
    const inventory = React.useMemo(() => {
        if (!products) return []

        return products.map(p => {
            // Calculate total stock for this product in the current selected store (or total if no store filter)
            let totalStock = 0
            const variants = p.variants || (p as any).product_variants || []

            variants.forEach(v => {
                const inventories = v.inventories || (v as any).variant_inventories || []
                inventories.forEach(inv => {
                    const storeId = inv.storeId || (inv as any).store_id
                    const stockQuantity = inv.stockQuantity !== undefined ? inv.stockQuantity : (inv as any).stock_quantity

                    if (!currentStore || currentStore.id === 'all-stores' || storeId === currentStore.id) {
                        totalStock += (Number(stockQuantity) || 0)
                    }
                })
            })

            return {
                id: p.id,
                product: p.name,
                stock: totalStock,
                price: formatCurrency(p.basePrice || 0),
                numericPrice: p.basePrice || 0,
                status: totalStock <= 5 ? 'Low Stock' : 'In Stock',
                category: 'General', // Backend doesn't have categories yet
                raw: p
            }
        })
    }, [products, currentStore])

    const filterGroups = [
        {
            title: "Status",
            options: [
                { label: "In Stock", value: "In Stock" },
                { label: "Low Stock", value: "Low Stock" },
            ]
        }
    ]

    // Aggregated stats from backend summary
    const lowStockItems = summary?.lowStockItems || 0
    const totalInventoryValue = summary?.totalValue || 0
    const totalProducts = summary?.totalProducts || 0

    const filteredInventory = inventory.filter(item => {
        const matchesSearch = item.product.toLowerCase().includes(search.toLowerCase())
        const activeStatuses = selectedFilters.filter(f => filterGroups[0].options.some(o => o.value === f))
        const matchesStatus = activeStatuses.length === 0 || activeStatuses.includes(item.status)
        return matchesSearch && matchesStatus
    })

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            // Standardizing for backend ProductService.addOrUpdateProduct
            await createProduct({
                name: formData.product,
                basePrice: Number(formData.price) || 0,
                quantity: formData.stock,
                storeIds: currentStore ? [currentStore.id] : []
            })
            setIsAddDrawerOpen(false)
            setFormData({ product: "", stock: 0, price: "", category: "General" })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            await updateProduct(editingItem.id, {
                name: formData.product,
                basePrice: Number(formData.price) || 0,
                // Stock updates via ProductService.updateProduct are a bit complex because it's handled via variants/inventories
                // For now, we update the base info. Stock adjustment might need its own specialized flow.
                // But addOrUpdateProduct in the backend handles quantity if we pass it.
            })
            setEditingItem(null)
            setFormData({ product: "", stock: 0, price: "", category: "General" })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this product?")) return
        setIsSubmitting(true)
        try {
            await deleteProduct(id)
            setEditingItem(null)
        } finally {
            setIsSubmitting(false)
        }
    }

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
                <span className={cn("font-mono", value <= 5 ? 'font-bold text-rose-600 dark:text-rose-400' : 'text-brand-accent/60 dark:text-brand-cream/60')}>
                    {value} units
                </span>
            )
        },
        {
            key: 'price',
            header: 'Price',
            render: (value: string) => <span className="font-serif font-medium text-brand-deep dark:text-brand-cream">{value}</span>
        },
        {
            key: 'status',
            header: 'Status',
            render: (value: string) => (
                <span className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    value === 'In Stock'
                        ? 'bg-brand-green/10 text-brand-green dark:bg-brand-gold/10 dark:text-brand-gold'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-brand-gold/70'
                )}>
                    {value}
                </span>
            )
        },
    ]

    const intelligenceWhisper = lowStockItems > 0
        ? `You have **${lowStockItems} items** critically low on stock. Consider restocking soon to avoid losing sales.`
        : `Your inventory levels are looking healthy. No urgent restocks required today.`

    if (isLoading && !products) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-brand-gold" />
            </div>
        )
    }

    return (
        <PageTransition>
            <div className="max-w-5xl mx-auto space-y-8 pb-24">
                <ManagementHeader
                    title="Inventory"
                    description={`Track stock levels for ${currentStore?.name || 'your business'}. Manage product catalog and monitor inventory value.`}
                    addButtonLabel="Add Product"
                    onAddClick={() => {
                        setFormData({ product: "", stock: 0, price: "", category: "General" })
                        setIsAddDrawerOpen(true)
                    }}
                />

                <InsightWhisper insight={intelligenceWhisper} />

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <GlassCard className="p-5 flex items-center gap-4 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Package className="w-24 h-24 dark:text-brand-cream/10" />
                        </div>
                        <div className="h-12 w-12 rounded-full bg-brand-green/10 dark:bg-brand-green/20 flex items-center justify-center text-brand-deep dark:text-brand-cream">
                            <Package className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-brand-accent/40 dark:text-brand-cream/60 uppercase tracking-wider">Total Products</p>
                            <p className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream">{totalProducts}</p>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-5 flex items-center gap-4 relative overflow-hidden group border-brand-gold/20">
                        <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity text-brand-gold">
                            <AlertTriangle className="w-24 h-24 dark:text-brand-cream/10" />
                        </div>
                        <div className="h-12 w-12 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-brand-gold/60 dark:text-brand-gold/70 uppercase tracking-wider">Inventory Value</p>
                            <p className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream">
                                {formatCurrency(totalInventoryValue)}
                            </p>
                        </div>
                    </GlassCard>
                </div>

                {/* Main Content */}
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-accent/40 dark:text-brand-cream/40 ml-1">Product List</p>

                        <div className="flex items-center gap-3">
                            <TableSearch
                                value={search}
                                onChange={setSearch}
                                placeholder="Search products..."
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
                        {filteredInventory.map((item, index) => (
                            <ListCard
                                key={item.id}
                                title={item.product}
                                subtitle={item.price}
                                status={item.status}
                                statusColor={item.status === 'Low Stock' ? 'danger' : 'success'}
                                value={`${item.stock}`}
                                valueLabel="units"
                                delay={index * 0.05}
                                onClick={() => {
                                    setFormData({
                                        product: item.product,
                                        stock: item.stock,
                                        price: item.price.replace('₦', ''),
                                        category: item.category
                                    })
                                    setEditingItem(item)
                                }}
                            />
                        ))}
                        {filteredInventory.length === 0 && (
                            <GlassCard className="p-12 text-center">
                                <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p className="text-brand-accent/40">No products found</p>
                            </GlassCard>
                        )}
                    </div>
                ) : (
                    <GlassCard className="overflow-hidden border-brand-deep/5 dark:border-white/5">
                        <DataTable
                            columns={columns}
                            data={filteredInventory}
                            emptyMessage="No products found"
                            onRowClick={(item) => {
                                setFormData({
                                    product: item.product,
                                    stock: item.stock,
                                    price: item.price.replace('₦', ''),
                                    category: item.category
                                })
                                setEditingItem(item)
                            }}
                        />
                    </GlassCard>
                )}

                {/* Add/Edit Drawer */}
                <Drawer
                    open={isAddDrawerOpen || !!editingItem}
                    onOpenChange={(open) => {
                        if (!open) {
                            setIsAddDrawerOpen(false);
                            setEditingItem(null);
                        }
                    }}
                >
                    <DrawerContent>
                        <DrawerStickyHeader>
                            <DrawerTitle>{editingItem ? "Edit Product" : "Add New Product"}</DrawerTitle>
                            <DrawerDescription>
                                {editingItem ? "Update product details and stock levels." : "Add a new item to your store's catalog."}
                            </DrawerDescription>
                        </DrawerStickyHeader>

                        <div className="p-8 pb-12 overflow-y-auto">
                            <form onSubmit={editingItem ? handleUpdate : handleAdd} className="max-w-lg mx-auto space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1">Product Name</label>
                                    <input
                                        autoFocus
                                        required
                                        value={formData.product}
                                        onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                                        placeholder="e.g. Premium Lace Material"
                                        className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/20 text-brand-deep dark:text-brand-cream"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1">Current Stock</label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.stock}
                                            onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                                            className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/20 text-brand-deep dark:text-brand-cream"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1">Price</label>
                                        <MoneyInput
                                            required
                                            value={formData.price}
                                            onChange={(val) => setFormData({ ...formData, price: val.toString() })}
                                            placeholder="e.g. 12,000"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <DrawerClose asChild>
                                        <Button variant="outline" className="flex-1 rounded-2xl h-14" disabled={isSubmitting}>Cancel</Button>
                                    </DrawerClose>
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 rounded-2xl h-14 bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold shadow-xl"
                                    >
                                        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (editingItem ? "Save Changes" : "Create Product")}
                                    </Button>
                                </div>

                                {editingItem && (
                                    <div className="pt-6 border-t border-brand-deep/5 dark:border-white/5 mt-6">
                                        <button
                                            type="button"
                                            disabled={isSubmitting}
                                            onClick={() => handleDelete(editingItem.id)}
                                            className="flex items-center justify-center gap-2 w-full py-4 text-xs font-bold text-rose-500/60 hover:text-rose-500 transition-all uppercase tracking-widest disabled:opacity-50"
                                        >
                                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                            Delete Product from Inventory
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                    </DrawerContent>
                </Drawer>
            </div>
        </PageTransition>
    )
}
