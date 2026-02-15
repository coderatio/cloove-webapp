"use client"

import * as React from 'react'
import DataTable from '@/app/components/DataTable'
import { useIsMobile } from '@/app/hooks/useMediaQuery'
import { PageTransition } from '@/app/components/layout/page-transition'
import { ListCard } from '@/app/components/ui/list-card'
import { GlassCard } from '@/app/components/ui/glass-card'
import { AlertTriangle, Package, Trash2, Loader2, Plus, Sparkles } from 'lucide-react'
import { cn } from '@/app/lib/utils'
import { ManagementHeader } from '@/app/components/shared/ManagementHeader'
import { InsightWhisper } from '@/app/components/dashboard/InsightWhisper'
import { Skeleton } from '@/app/components/ui/skeleton'
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
    DrawerBody,
} from "@/app/components/ui/drawer"
import { useInventory, InventoryStats } from '../hooks/useInventory'
import { MoneyInput } from '@/app/components/ui/money-input'
import { formatCurrency } from '@/app/lib/formatters'
import { ImageUpload } from '@/app/components/ui/image-upload'
import { StoreSelector } from '@/app/components/shared/storeSelector'
import { StoreContextSelector } from '@/app/components/shared/StoreContextSelector'
import { BulkUploadDrawer } from './BulkUploadDrawer'

interface StoreStockMapping {
    storeId: string
    stockQuantity: number | string
}

function StoreStockInputs({
    storeIds,
    stocks,
    onChange
}: {
    storeIds: string[],
    stocks: StoreStockMapping[],
    onChange: (stocks: StoreStockMapping[]) => void
}) {
    const { stores } = useStores()
    const selectedStores = stores.filter(s => storeIds.includes(s.id))

    if (selectedStores.length <= 1) return null

    return (
        <div className="space-y-4 p-4 rounded-2xl bg-brand-deep/2 dark:bg-white/2 border border-brand-deep/5 dark:border-white/5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40 px-1">Stock per Store</label>
            <div className="grid grid-cols-1 gap-3">
                {selectedStores.map(store => {
                    const found = stocks.find(s => s.storeId === store.id)
                    const currentStock = found?.stockQuantity !== undefined ? found.stockQuantity : 0
                    return (
                        <div key={store.id} className="flex items-center justify-between gap-4">
                            <span className="text-xs font-medium text-brand-deep/60 dark:text-brand-cream/60 truncate max-w-[150px]">{store.name}</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={currentStock}
                                onChange={(e) => {
                                    const rawValue = e.target.value.replace(/[^0-9]/g, '')
                                    const val = rawValue === '' ? '' : parseInt(rawValue)

                                    let newStocks: StoreStockMapping[]
                                    const exists = stocks.some(s => s.storeId === store.id)

                                    if (exists) {
                                        newStocks = stocks.map(s =>
                                            s.storeId === store.id ? { ...s, stockQuantity: val } : s
                                        )
                                    } else {
                                        newStocks = [...stocks, { storeId: store.id, stockQuantity: val }]
                                    }

                                    onChange(newStocks)
                                }}
                                className="w-24 px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-brand-green/20"
                            />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export function InventoryView() {
    const isMobile = useIsMobile()
    const { currency } = useBusiness()
    const { stores, currentStore } = useStores()
    const [selectedStoreId, setSelectedStoreId] = React.useState<string>(currentStore?.id || 'all-stores')

    const { products, summary, isLoading, isFetching, createProduct, updateProduct, deleteProduct } = useInventory(
        selectedStoreId !== 'all-stores' ? selectedStoreId : undefined
    )

    const selectedStoreName = React.useMemo(() => {
        if (selectedStoreId === 'all-stores') return 'All Stores'
        return stores.find(s => s.id === selectedStoreId)?.name || 'Store'
    }, [selectedStoreId, stores])

    const [search, setSearch] = React.useState("")
    const [selectedFilters, setSelectedFilters] = React.useState<string[]>([])
    const [isAddDrawerOpen, setIsAddDrawerOpen] = React.useState(false)
    const [isBulkUploadOpen, setIsBulkUploadOpen] = React.useState(false)
    const [editingItem, setEditingItem] = React.useState<any>(null)
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    // Form states
    const [formData, setFormData] = React.useState({
        product: '',
        price: '',
        imageUrls: [] as string[],
        storeIds: [] as string[],
        variants: [] as any[]
    })

    // Map backend products to view-friendly inventory items
    const inventory = React.useMemo(() => {
        if (!products) return []

        return products.map(p => {
            let globalStock = 0
            let localStock = 0
            const variants = p.variants || (p as any).product_variants || []
            const storeBreakdown: Record<string, number> = {}

            variants.forEach((v: any) => {
                const inventories = v.inventories || (v as any).variant_inventories || []
                inventories.forEach((inv: any) => {
                    const storeId = inv.storeId || (inv as any).store_id
                    const storeName = inv.store?.name || (inv as any).store_name || 'Store'
                    const stockQuantity = Number(inv.stockQuantity !== undefined ? inv.stockQuantity : (inv as any).stock_quantity || 0)

                    globalStock += stockQuantity

                    if (selectedStoreId !== 'all-stores' && storeId === selectedStoreId) {
                        localStock += stockQuantity
                    }

                    if (stockQuantity > 0) {
                        storeBreakdown[storeName] = (storeBreakdown[storeName] || 0) + stockQuantity
                    }
                })
            })

            return {
                id: p.id,
                product: p.name,
                stock: globalStock,
                localStock: localStock,
                storeBreakdown,
                price: formatCurrency(p.basePrice || 0),
                numericPrice: p.basePrice || 0,
                variantsCount: variants.length,
                availableIn: (p as any).stores?.map((s: any) => s.name) || [],
                status: (selectedStoreId === 'all-stores' ? globalStock : localStock) <= (summary?.lowStockThreshold || 5) ? 'Low Stock' : 'In Stock',
                category: (p as any).category || 'General',
                raw: p
            }
        })
    }, [products, currentStore])

    const filterGroups = [
        {
            key: 'storeId',
            title: 'Stores',
            options: stores.map(s => ({ label: s.name, value: s.id })) as any
        },
        {
            key: 'status',
            title: 'Status',
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
    const totalStockUnits = summary?.totalStockUnits || 0

    const filteredInventory = inventory.filter(item => {
        const matchesSearch = item.product.toLowerCase().includes(search.toLowerCase())
        const activeStatuses = selectedFilters.filter(f => filterGroups.find(g => g.key === 'status')?.options.some((o: any) => o.value === f))
        const matchesStatus = activeStatuses.length === 0 || activeStatuses.includes(item.status)


        const activeStores = selectedFilters.filter(f => filterGroups.find(g => g.key === 'storeId')?.options.some((o: any) => o.value === f))
        const matchesStore = activeStores.length === 0 || activeStores.some(storeId => (item.raw as any).stores?.some((s: any) => s.id === storeId))

        return matchesSearch && matchesStatus && matchesStore
    })

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            await createProduct({
                name: formData.product,
                price: parseFloat(formData.price) || 0,
                imageUrls: formData.imageUrls,
                storeIds: formData.storeIds,
                variants: formData.variants.map(v => {
                    // Final sum check before submission
                    const total = (v.storeInventory || [])
                        .filter((s: any) => formData.storeIds.includes(s.storeId))
                        .reduce((sum: number, s: any) => sum + (Number(s.stockQuantity) || 0), 0)

                    return {
                        ...v,
                        price: parseFloat(v.price) || 0,
                        stockQuantity: formData.storeIds.length > 1 ? total : (Number(v.stockQuantity) || 0),
                        storeInventory: v.storeInventory?.map((s: any) => ({ ...s, stockQuantity: Number(s.stockQuantity) || 0 }))
                    }
                })
            })
            setIsAddDrawerOpen(false)
            setFormData({ product: '', price: '', imageUrls: [], storeIds: [], variants: [] })
        } catch (error) {
            console.error(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingItem) return
        setIsSubmitting(true)
        try {
            await updateProduct({
                id: editingItem.id,
                data: {
                    name: formData.product,
                    basePrice: parseFloat(formData.price) || 0,
                    imageUrls: formData.imageUrls,
                    storeIds: formData.storeIds,
                    variants: formData.variants.map(v => {
                        // Final sum check before submission
                        const total = (v.storeInventory || [])
                            .filter((s: any) => formData.storeIds.includes(s.storeId))
                            .reduce((sum: number, s: any) => sum + (Number(s.stockQuantity) || 0), 0)

                        return {
                            ...v,
                            price: parseFloat(v.price) || 0,
                            stockQuantity: formData.storeIds.length > 1 ? total : (Number(v.stockQuantity) || 0),
                            storeInventory: v.storeInventory?.map((s: any) => ({ ...s, stockQuantity: Number(s.stockQuantity) || 0 }))
                        }
                    })
                }
            })
            setEditingItem(null)
            setFormData({ product: '', price: '', imageUrls: [], storeIds: [], variants: [] })
        } catch (error) {
            console.error(error)
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
            key: 'variantsCount',
            header: 'Variants',
            render: (value: number) => (
                <span className="px-2 py-0.5 rounded-full bg-brand-deep/5 dark:bg-white/5 text-brand-deep/60 dark:text-brand-cream/60 text-[10px] font-medium border border-brand-deep/5 dark:border-white/5">
                    {value} {value === 1 ? 'variant' : 'variants'}
                </span>
            )
        },
        {
            key: 'stock',
            header: 'Stock',
            render: (value: number, item: any) => {
                const breakdown = Object.entries(item.storeBreakdown || {}).filter(([_, qty]) => (qty as number) > 0)
                const isAllStores = selectedStoreId === 'all-stores'

                return (
                    <div className="flex flex-col gap-1">
                        <span className={cn("font-mono", (isAllStores ? value : item.localStock) <= (summary?.lowStockThreshold || 5) ? 'font-bold text-rose-600 dark:text-rose-400' : 'text-brand-accent/60 dark:text-brand-cream/60')}>
                            {isAllStores ? value : item.localStock} units
                        </span>
                        {!isAllStores && (
                            <span className="text-[10px] text-brand-accent/40 dark:text-brand-cream/40 font-medium">
                                Total: {value} units
                            </span>
                        )}
                    </div>
                )
            }
        },
        {
            key: 'price',
            header: 'Price',
            render: (value: string) => <span className="font-serif font-medium text-brand-deep dark:text-brand-cream">{value}</span>
        },
        {
            key: 'availableIn',
            header: 'Available In',
            render: (stores: string[]) => (
                <div className="flex flex-wrap gap-1">
                    {stores.map(name => (
                        <span key={name} className="px-2 py-0.5 rounded-full bg-brand-green/10 dark:bg-brand-gold/20 text-brand-green dark:text-brand-cream/80 text-[9px] font-medium border border-brand-green/20">
                            {name}
                        </span>
                    ))}
                    {stores.length === 0 && (
                        <span className="text-[9px] text-brand-accent/40 dark:text-brand-cream/40 italic">Not assigned</span>
                    )}
                </div>
            )
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

    const isAllStores = selectedStoreId === 'all-stores'

    return (
        <PageTransition>
            <div className="max-w-5xl mx-auto space-y-8 pb-24">
                <ManagementHeader
                    title="Inventory"
                    description="Track and manage your products across all stores."
                    extraActions={
                        <div className="w-full flex items-center gap-2">
                            <StoreContextSelector
                                value={selectedStoreId}
                                onChange={setSelectedStoreId}
                                className="w-full sm:w-auto flex justify-between"
                            />
                            <Button
                                variant="ghost"
                                onClick={() => setIsBulkUploadOpen(true)}
                                className="flex h-12 rounded-full bg-white border border-brand-accent/10 text-brand-deep-800 hover:text-brand-deep dark:bg-white/5 dark:text-brand-cream/80 dark:border dark:border-brand-gold-500/20 dark:hover:text-brand-gold transition-all gap-2"
                            >
                                <Sparkles className="w-4 h-4" />
                                Bulk Import
                            </Button>
                        </div>
                    }
                    addButtonLabel="Add Product"
                    onAddClick={() => {
                        setFormData({
                            product: "",
                            price: "",
                            imageUrls: [],
                            storeIds: [],
                            variants: [{ name: 'Standard', sku: '', price: '', stockQuantity: 0, storeInventory: [] }]
                        })
                        setIsAddDrawerOpen(true)
                    }}
                    mobileFloatingAction={true}
                />

                {isFetching ? (
                    <Skeleton className="h-12 w-full rounded-2xl" />
                ) : (
                    <InsightWhisper insight={intelligenceWhisper} />
                )}

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <GlassCard className="p-5 flex items-center gap-4 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Package className="w-24 h-24 dark:text-brand-cream/10" />
                        </div>
                        <div className="h-12 w-12 rounded-full bg-brand-green/10 dark:bg-brand-green/20 flex items-center justify-center text-brand-deep dark:text-brand-cream">
                            {isFetching ? <Loader2 className="h-5 w-5 animate-spin" /> : <Package className="h-6 w-6" />}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-brand-accent/40 dark:text-brand-cream/60 uppercase tracking-wider">Total Units</p>
                            {isFetching ? <Skeleton className="h-8 w-20 mt-1" /> : <p className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream">{totalStockUnits}</p>}
                        </div>
                    </GlassCard>

                    <GlassCard className="p-5 flex items-center gap-4 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Plus className="w-24 h-24 dark:text-brand-cream/10" />
                        </div>
                        <div className="h-12 w-12 rounded-full bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center text-brand-deep dark:text-brand-cream">
                            {isFetching ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-brand-accent/40 dark:text-brand-cream/60 uppercase tracking-wider">Products</p>
                            {isFetching ? <Skeleton className="h-8 w-16 mt-1" /> : <p className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream">{totalProducts}</p>}
                        </div>
                    </GlassCard>

                    <GlassCard className="p-5 flex items-center gap-4 relative overflow-hidden group border-brand-gold/20">
                        <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity text-brand-gold">
                            <AlertTriangle className="w-24 h-24 dark:text-brand-cream/10" />
                        </div>
                        <div className="h-12 w-12 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                            {isFetching ? <Loader2 className="h-5 w-5 animate-spin text-brand-gold" /> : <AlertTriangle className="h-6 w-6" />}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-brand-gold/60 dark:text-brand-gold/70 uppercase tracking-wider">Inventory Value</p>
                            {isFetching ? <Skeleton className="h-8 w-32 mt-1" /> : <p className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream">
                                {formatCurrency(totalInventoryValue)}
                            </p>}
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
                    {isMobile ? (
                        <div className="space-y-4">
                            {isFetching ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <GlassCard key={i} className="p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Skeleton className="h-5 w-32" />
                                            <Skeleton className="h-4 w-12" />
                                        </div>
                                        <Skeleton className="h-4 w-full" />
                                        <div className="flex justify-between items-center pt-2 border-t border-brand-deep/5 dark:border-white/5">
                                            <Skeleton className="h-4 w-20" />
                                            <Skeleton className="h-8 w-24 rounded-full" />
                                        </div>
                                    </GlassCard>
                                ))
                            ) : (
                                filteredInventory.map(item => (
                                    <ListCard
                                        key={item.id}
                                        title={item.product}
                                        subtitle={`${item.price}${!isAllStores ? ` • Total: ${item.stock}` : ''}`}
                                        status={item.status}
                                        statusColor={item.status === 'Low Stock' ? 'danger' : 'success'}
                                        value={`${!isAllStores ? item.localStock : item.stock}`}
                                        valueLabel={!isAllStores ? `in ${selectedStoreName}` : "Units"}
                                        onClick={() => {
                                            const raw = (item as any).raw
                                            setFormData({
                                                product: item.product,
                                                price: item.numericPrice.toString(),
                                                imageUrls: raw.images?.map((img: any) => img.url) || [],
                                                storeIds: raw.stores?.map((s: any) => s.id) || [],
                                                variants: raw?.variants?.map((v: any) => ({
                                                    id: v.id,
                                                    name: v.name || 'Standard',
                                                    sku: v.sku || '',
                                                    price: v.price?.toString() || item.numericPrice.toString(),
                                                    stockQuantity: v.inventories?.reduce((sum: number, inv: any) => sum + (Number(inv.stockQuantity) || 0), 0) || 0,
                                                    storeInventory: v.inventories?.map((inv: any) => ({
                                                        storeId: inv.storeId,
                                                        stockQuantity: inv.stockQuantity
                                                    })) || []
                                                })) || [{ name: 'Standard', sku: '', price: item.numericPrice.toString(), stockQuantity: 0, storeInventory: [] }]
                                            })
                                            setEditingItem(item)
                                        }}
                                    />
                                ))
                            )}
                            {!isFetching && filteredInventory.length === 0 && (
                                <GlassCard className="p-12 text-center">
                                    <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p className="text-brand-accent/40">No products found</p>
                                </GlassCard>
                            )}
                        </div>
                    ) : (
                        <div className={cn("transition-opacity duration-300", isFetching && "opacity-50")}>
                            <GlassCard className="overflow-hidden border-brand-deep/5 dark:border-white/5">
                                <DataTable
                                    columns={columns}
                                    data={filteredInventory}
                                    isLoading={isFetching}
                                    onRowClick={(item) => {
                                        const raw = (item as any).raw
                                        setFormData({
                                            product: item.product,
                                            price: item.numericPrice.toString(),
                                            imageUrls: raw.images?.map((img: any) => img.url) || [],
                                            storeIds: raw.stores?.map((s: any) => s.id) || [],
                                            variants: raw?.variants?.map((v: any) => ({
                                                id: v.id,
                                                name: v.name || '',
                                                sku: v.sku || '',
                                                price: v.price?.toString() || item.numericPrice.toString(),
                                                stockQuantity: v.inventories?.[0]?.stockQuantity || 0,
                                                storeInventory: v.inventories?.map((inv: any) => ({
                                                    storeId: inv.storeId,
                                                    stockQuantity: inv.stockQuantity
                                                })) || []
                                            })) || []
                                        })
                                        setEditingItem(item)
                                    }}
                                />
                            </GlassCard>
                        </div>
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

                            <DrawerBody className="pb-12 min-h-0">
                                <form onSubmit={editingItem ? handleUpdate : handleAdd} className="max-w-lg mx-auto space-y-8">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1">Product Images</label>
                                        <ImageUpload
                                            value={formData.imageUrls}
                                            onChange={(urls) => setFormData({ ...formData, imageUrls: urls })}
                                        />
                                    </div>

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

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1">Available In Stores</label>
                                        <StoreSelector
                                            value={formData.storeIds}
                                            onChange={(ids) => {
                                                const newVariants = formData.variants.map(v => {
                                                    const total = (v.storeInventory || [])
                                                        .filter((s: any) => ids.includes(s.storeId))
                                                        .reduce((sum: number, s: any) => sum + (Number(s.stockQuantity) || 0), 0)
                                                    return { ...v, stockQuantity: total }
                                                })
                                                setFormData({ ...formData, storeIds: ids, variants: newVariants })
                                            }}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1">Base Price</label>
                                        <MoneyInput
                                            currencySymbol={currency}
                                            required
                                            value={formData.price}
                                            onChange={(val) => {
                                                const newPrice = val.toString()
                                                // Auto-update variants with empty or default price
                                                const newVariants = formData.variants.map(v => ({
                                                    ...v,
                                                    price: v.price === formData.price || !v.price ? newPrice : v.price
                                                }))
                                                setFormData({ ...formData, price: newPrice, variants: newVariants })
                                            }}
                                            placeholder="e.g. 12,000"
                                        />
                                    </div>

                                    {/* Variants Section */}
                                    <div className="space-y-4 pt-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-bold uppercase tracking-widest text-brand-deep/60 dark:text-brand-cream/60">Inventory & Variants</h4>
                                            <Button
                                                type="button"
                                                onClick={() => setFormData({
                                                    ...formData,
                                                    variants: [...formData.variants, { name: '', sku: '', price: formData.price, stockQuantity: 0, storeInventory: [] }]
                                                })}
                                                variant="outline"
                                                className="text-[10px] h-8 font-bold uppercase tracking-tighter bg-brand-deep/5 dark:bg-white/5 hover:bg-brand-deep/10 dark:hover:bg-white/10 px-3 rounded-full transition-all"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Add Variant
                                            </Button>
                                        </div>

                                        {formData.variants.length > 0 && (
                                            <div className="space-y-6">
                                                {formData.variants.map((variant, index) => (
                                                    <div key={index} className="p-4 rounded-2xl bg-brand-deep/2 dark:bg-white/2 border border-brand-deep/5 dark:border-white/5 space-y-4 relative group">
                                                        {formData.variants.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newVariants = [...formData.variants]
                                                                    newVariants.splice(index, 1)
                                                                    setFormData({ ...formData, variants: newVariants })
                                                                }}
                                                                className="absolute cursor-pointer -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center sm:opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        )}

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <input
                                                                    placeholder="Variant Name (e.g. XL)"
                                                                    value={variant.name}
                                                                    onChange={(e) => {
                                                                        const v = [...formData.variants]
                                                                        v[index].name = e.target.value
                                                                        setFormData({ ...formData, variants: v })
                                                                    }}
                                                                    className="text-xs w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/20"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <input
                                                                    placeholder="SKU"
                                                                    value={variant.sku}
                                                                    onChange={(e) => {
                                                                        const v = [...formData.variants]
                                                                        v[index].sku = e.target.value
                                                                        setFormData({ ...formData, variants: v })
                                                                    }}
                                                                    className="text-xs w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/20"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <input
                                                                    type="text"
                                                                    inputMode="numeric"
                                                                    pattern="[0-9]*"
                                                                    placeholder="Stock"
                                                                    readOnly={formData.storeIds.length > 1}
                                                                    value={(() => {
                                                                        if (formData.storeIds.length > 1) {
                                                                            return (variant.storeInventory || [])
                                                                                .filter((s: any) => formData.storeIds.includes(s.storeId))
                                                                                .reduce((sum: number, s: any) => sum + (Number(s.stockQuantity) || 0), 0)
                                                                        }
                                                                        return variant.stockQuantity || 0
                                                                    })()}
                                                                    onChange={(e) => {
                                                                        const rawValue = e.target.value.replace(/[^0-9]/g, '')
                                                                        const val = rawValue === '' ? '' : parseInt(rawValue)

                                                                        setFormData(prev => {
                                                                            const newVariants = [...prev.variants]
                                                                            const v = { ...newVariants[index] }
                                                                            v.stockQuantity = val

                                                                            // Bidirectional sync: if only 1 store, update its inventory too
                                                                            if (prev.storeIds.length === 1) {
                                                                                const storeId = prev.storeIds[0]
                                                                                const inv = [...(v.storeInventory || [])]
                                                                                const sIdx = inv.findIndex(s => s.storeId === storeId)
                                                                                if (sIdx > -1) {
                                                                                    inv[sIdx] = { ...inv[sIdx], stockQuantity: val }
                                                                                } else {
                                                                                    inv.push({ storeId, stockQuantity: val })
                                                                                }
                                                                                v.storeInventory = inv
                                                                            }

                                                                            newVariants[index] = v
                                                                            return { ...prev, variants: newVariants }
                                                                        })
                                                                    }}
                                                                    className={cn(
                                                                        "text-xs w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/20",
                                                                        formData.storeIds.length > 1 && "opacity-60 cursor-not-allowed bg-brand-deep/5 font-bold"
                                                                    )}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <MoneyInput
                                                                    currencySymbol={currency}
                                                                    className="h-11 text-xs pl-10 pr-4 rounded-xl"
                                                                    value={variant.price}
                                                                    onChange={(val) => {
                                                                        const v = [...formData.variants]
                                                                        v[index].price = val.toString()
                                                                        setFormData({ ...formData, variants: v })
                                                                    }}
                                                                    placeholder="Price"
                                                                />
                                                            </div>
                                                        </div>

                                                        <StoreStockInputs
                                                            storeIds={formData.storeIds}
                                                            stocks={variant.storeInventory || []}
                                                            onChange={(stocks) => {
                                                                // Ensure we only sum what's in the selected stores
                                                                const total = stocks
                                                                    .filter(s => formData.storeIds.includes(s.storeId))
                                                                    .reduce((sum, s) => sum + (Number(s.stockQuantity) || 0), 0)

                                                                setFormData(prev => {
                                                                    const newVariants = [...prev.variants]
                                                                    newVariants[index] = {
                                                                        ...newVariants[index],
                                                                        storeInventory: stocks,
                                                                        stockQuantity: total
                                                                    }
                                                                    return { ...prev, variants: newVariants }
                                                                })
                                                            }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-4 pt-6">
                                        <DrawerClose asChild>
                                            <Button variant="outline" className="flex-1 rounded-2xl h-14" disabled={isSubmitting}>Cancel</Button>
                                        </DrawerClose>
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="flex-1 rounded-2xl h-14 bg-brand-deep text-brand-gold dark:bg-brand-gold dark:hover:bg-brand-gold/80 dark:text-brand-deep font-bold shadow-xl"
                                        >
                                            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (editingItem ? "Save Changes" : "Create Product")}
                                        </Button>
                                    </div>

                                    {editingItem && (
                                        <div className="pt-6 border-t border-brand-deep/5 dark:border-white/5 mt-6">
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                disabled={isSubmitting}
                                                onClick={() => handleDelete(editingItem.id)}
                                                className="flex items-center justify-center gap-2 w-full py-4 text-xs font-bold text-rose-500/60 dark:text-rose-400 dark:hover:text-rose-500 hover:text-rose-500 transition-all uppercase tracking-widest disabled:opacity-50"
                                            >
                                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                Delete Product from Inventory
                                            </Button>
                                        </div>
                                    )}
                                </form>
                            </DrawerBody>
                        </DrawerContent>
                    </Drawer>
                    <BulkUploadDrawer
                        isOpen={isBulkUploadOpen}
                        onOpenChange={setIsBulkUploadOpen}
                        onComplete={() => {
                            // Refresh products or update state
                        }}
                    />
                </div>
            </div>
        </PageTransition>
    )
}
