"use client"

import * as React from 'react'
import Image from "next/image"
import DataTable from '@/app/components/DataTable'
import { useIsMobile } from '@/app/hooks/useMediaQuery'
import { PageTransition } from '@/app/components/layout/page-transition'
import { ListCard } from '@/app/components/ui/list-card'
import { GlassCard } from '@/app/components/ui/glass-card'
import { AlertTriangle, Package, Trash2, Loader2, Plus, Sparkles, MoreVertical, Copy, Eye, Pencil, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/app/lib/utils'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/app/components/ui/dropdown-menu"
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
import { useInventory } from '../hooks/useInventory'
import { Product, InventoryItem, InventoryStats } from '../types'
import { Badge } from '@/app/components/ui/badge'
import { MoneyInput } from '@/app/components/ui/money-input'
import { formatCurrency } from '@/app/lib/formatters'
import { ImageUpload } from '@/app/components/ui/image-upload'
import { StoreSelector } from '@/app/components/shared/storeSelector'
import { StoreContextSelector } from '@/app/components/shared/StoreContextSelector'
import { BulkUploadDrawer } from './BulkUploadDrawer'
import { ConfirmDialog } from '@/app/components/shared/ConfirmDialog'
import { ProductViewDrawer } from './ProductViewDrawer'

const PER_PAGE = 10
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
    const [currentPage, setCurrentPage] = React.useState(1)
    const pageSize = PER_PAGE

    const { products, meta, summary, isLoading, isFetching, createProduct, updateProduct, deleteProduct } = useInventory(
        selectedStoreId !== 'all-stores' ? selectedStoreId : undefined,
        currentPage,
        pageSize
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
    const [viewItem, setViewItem] = React.useState<any>(null)
    const [isViewDrawerOpen, setIsViewDrawerOpen] = React.useState(false)
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false)
    const [itemToDelete, setItemToDelete] = React.useState<any>(null)

    // Form states
    const [formData, setFormData] = React.useState({
        product: '',
        description: '',
        price: '',
        imageUrls: [] as string[],
        storeIds: [] as string[],
        variants: [] as any[]
    })

    // Map backend products to view-friendly inventory items
    const inventory = React.useMemo(() => {
        if (!products) return []

        return products.map((p: Product) => {
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
                image: (p as any).images?.find((img: any) => img.isPrimary)?.url || (p as any).images?.[0]?.url,
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

    const filteredInventory = React.useMemo(() => {
        const query = search.toLowerCase()
        const statusOptions = filterGroups.find(g => g.key === 'status')?.options || []
        const storeOptions = filterGroups.find(g => g.key === 'storeId')?.options || []

        const activeStatuses = new Set(selectedFilters.filter(f => statusOptions.some((o: any) => o.value === f)))
        const activeStores = new Set(selectedFilters.filter(f => storeOptions.some((o: any) => o.value === f)))

        return inventory.filter((item: InventoryItem) => {
            const matchesSearch = item.product.toLowerCase().includes(query)
            const matchesStatus = activeStatuses.size === 0 || activeStatuses.has(item.status)
            const matchesStore = activeStores.size === 0 || Array.from(activeStores).some(storeId => (item.raw as any).stores?.some((s: any) => s.id === storeId))

            return matchesSearch && matchesStatus && matchesStore
        })
    }, [inventory, search, selectedFilters, filterGroups])

    const prepareFormData = (item: any) => {
        const raw = item.raw
        return {
            product: item.product,
            description: raw.description || '',
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
        }
    }

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            await createProduct({
                name: formData.product,
                description: formData.description,
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
            setFormData({ product: '', description: '', price: '', imageUrls: [], storeIds: [], variants: [] })
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
                    description: formData.description,
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
            setFormData({ product: '', description: '', price: '', imageUrls: [], storeIds: [], variants: [] })
        } catch (error) {
            console.error(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        setIsSubmitting(true)
        try {
            await deleteProduct(id)
            setEditingItem(null)
            setItemToDelete(null)
        } catch (error) {
            console.error(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const columns: any[] = [
        {
            key: 'product',
            header: 'Product',
            render: (val: string, item: any) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-deep/5 dark:bg-white/5 border border-brand-deep/5 dark:border-white/5 flex items-center justify-center overflow-hidden shrink-0 relative">
                        {item.image ? (
                            <Image
                                src={item.image}
                                alt={val}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <Package className="w-4 h-4 text-brand-deep/20 dark:text-white/20" />
                        )}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-medium text-brand-deep dark:text-brand-cream truncate">{val}</span>
                        <span className="text-[10px] text-brand-accent/40 dark:text-brand-cream/40 uppercase tracking-widest font-bold">{item.category}</span>
                    </div>
                </div>
            )
        },
        {
            key: 'variantsCount',
            header: 'Variants',
            render: (value: number) => (
                <Badge variant="default">
                    {value} {value === 1 ? 'variant' : 'variants'}
                </Badge>
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
                        {!isAllStores ? (
                            <span className="text-[10px] text-brand-accent/40 dark:text-brand-cream/40 font-medium">
                                Total: {value} units
                            </span>
                        ) : null}
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
                        <Badge key={name} variant="success">
                            {name}
                        </Badge>
                    ))}
                    {stores.length === 0 ? (
                        <span className="text-[9px] text-brand-accent/40 dark:text-brand-cream/40 italic">Not assigned</span>
                    ) : null}
                </div>
            )
        },
        {
            key: 'status',
            header: 'Status',
            render: (value: string) => (
                <Badge variant={value === 'In Stock' ? 'success' : 'warning'} className='uppercase'>
                    {value}
                </Badge>
            )
        },
        {
            key: 'actions' as any,
            header: '',
            render: (_: any, item: any) => (
                <div className="flex justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-brand-deep/5 dark:hover:bg-white/5">
                                <span className="sr-only">Open menu</span>
                                <MoreVertical className="h-4 w-4 text-brand-deep/40 dark:text-brand-cream/40" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2 bg-white/80 dark:bg-[#021a12]/80 backdrop-blur-xl border-brand-deep/5 dark:border-white/5 shadow-2xl">
                            <DropdownMenuItem
                                onClick={() => {
                                    setViewItem(item)
                                    setIsViewDrawerOpen(true)
                                }}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-brand-deep/60 dark:text-brand-cream/60 focus:bg-brand-green/10 focus:text-brand-green dark:focus:bg-brand-gold/10 dark:focus:text-brand-gold cursor-pointer"
                            >
                                <Eye className="w-4 h-4" />
                                View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    setFormData(prepareFormData(item))
                                    setEditingItem(item)
                                }}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-brand-deep/60 dark:text-brand-cream/60 focus:bg-brand-green/10 focus:text-brand-green dark:focus:bg-brand-gold/10 dark:focus:text-brand-gold cursor-pointer"
                            >
                                <Pencil className="w-4 h-4" />
                                Edit Product
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    const data = prepareFormData(item)
                                    // Strip SKUs and IDs for duplication
                                    setFormData({
                                        ...data,
                                        product: `${data.product} (Copy)`,
                                        variants: data.variants.map((v: any) => ({ ...v, id: undefined, sku: '' }))
                                    })
                                    setIsAddDrawerOpen(true)
                                }}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-brand-deep/60 dark:text-brand-cream/60 focus:bg-brand-green/10 focus:text-brand-green dark:focus:bg-brand-gold/10 dark:focus:text-brand-gold cursor-pointer"
                            >
                                <Copy className="w-4 h-4" />
                                Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1 bg-brand-deep/5 dark:bg-white/5" />
                            <DropdownMenuItem
                                onClick={() => {
                                    setItemToDelete(item)
                                    setConfirmDeleteOpen(true)
                                }}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-rose-500 focus:bg-rose-500/10 focus:text-rose-600 cursor-pointer"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
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
                            description: "",
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
                                filteredInventory.map((item: InventoryItem) => (
                                    <ListCard
                                        key={item.id}
                                        title={item.product}
                                        subtitle={item.category}
                                        image={item.image}
                                        status={item.status}
                                        statusColor={item.status === 'Low Stock' ? 'danger' : 'success'}
                                        value={`${!isAllStores ? item.localStock : item.stock}`}
                                        valueLabel={!isAllStores ? `in ${selectedStoreName}` : "Units"}
                                        onClick={() => {
                                            setViewItem(item)
                                            setIsViewDrawerOpen(true)
                                        }}
                                        actions={
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-brand-deep/5 dark:hover:bg-white/5">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48 p-1.5 rounded-2xl bg-white/95 dark:bg-brand-deep-800 backdrop-blur-xl border border-brand-deep/5 dark:border-white/5 shadow-2xl">
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setViewItem(item)
                                                            setIsViewDrawerOpen(true)
                                                        }}
                                                        className="flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-xl focus:bg-brand-green/10 dark:focus:bg-brand-gold/10 transition-colors"
                                                    >
                                                        <Eye className="w-4 h-4 text-brand-green dark:text-brand-gold" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setFormData(prepareFormData(item))
                                                            setEditingItem(item)
                                                        }}
                                                        className="flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-xl focus:bg-brand-green/10 dark:focus:bg-brand-gold/10 transition-colors"
                                                    >
                                                        <Pencil className="w-4 h-4 text-brand-green dark:text-brand-gold" />
                                                        Edit Product
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            const duplicated = {
                                                                ...prepareFormData(item),
                                                                product: `${item.product} (Copy)`,
                                                                variants: prepareFormData(item).variants.map((v: any) => ({ ...v, sku: '' }))
                                                            }
                                                            setFormData(duplicated)
                                                            setIsAddDrawerOpen(true)
                                                        }}
                                                        className="flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-xl focus:bg-brand-green/10 dark:focus:bg-brand-gold/10 transition-colors"
                                                    >
                                                        <Copy className="w-4 h-4 text-brand-green dark:text-brand-gold" />
                                                        Duplicate
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="my-1 border-brand-deep/5 dark:border-white/5" />
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setItemToDelete(item)
                                                            setConfirmDeleteOpen(true)
                                                        }}
                                                        className="flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-rose-500 rounded-xl focus:bg-rose-500/10 dark:focus:bg-rose-500/10 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        Delete Product
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        }
                                    />
                                ))
                            )}
                            {!isFetching && filteredInventory.length === 0 ? (
                                <GlassCard className="p-12 text-center">
                                    <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p className="text-brand-accent/40">No products found</p>
                                </GlassCard>
                            ) : null}

                            {/* Mobile Pagination */}
                            {meta && (meta as any).totalPages > 1 ? (
                                <div className="flex items-center justify-between pt-4 border-t border-brand-deep/5 dark:border-white/5">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={(meta as any).currentPage === 1}
                                        onClick={() => setCurrentPage((meta as any).currentPage - 1)}
                                        className="rounded-xl h-10 border-brand-deep/5 dark:border-white/10"
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-1 dark:text-brand-gold" />
                                        Prev
                                    </Button>
                                    <div className="flex items-center gap-1.5">
                                        {Array.from({ length: Math.min((meta as any).totalPages, 5) }).map((_, i) => {
                                            const page = i + 1
                                            return (
                                                <button
                                                    key={i}
                                                    onClick={() => setCurrentPage(page)}
                                                    className={cn(
                                                        "w-1.5 h-1.5 rounded-full transition-all duration-300",
                                                        (meta as any).currentPage === page
                                                            ? "bg-brand-green w-3 dark:bg-brand-gold"
                                                            : "bg-brand-accent/20 dark:bg-white/10"
                                                    )}
                                                />
                                            )
                                        })}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={(meta as any).currentPage === (meta as any).totalPages}
                                        onClick={() => setCurrentPage((meta as any).currentPage + 1)}
                                        className="rounded-xl h-10 border-brand-deep/5 dark:border-white/10"
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4 ml-1 dark:text-brand-gold" />
                                    </Button>
                                </div>
                            ) : null}
                        </div>
                    ) : (
                        <div className={cn("transition-opacity duration-300", isFetching && "opacity-50")}>
                            <GlassCard className="overflow-hidden border-brand-deep/5 dark:border-white/5">
                                <DataTable
                                    columns={columns}
                                    data={filteredInventory}
                                    isLoading={isFetching}
                                    manualPagination={{
                                        currentPage: (meta as any)?.currentPage || 1,
                                        totalPages: (meta as any)?.totalPages || 1,
                                        onPageChange: (page) => setCurrentPage(page)
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
                                <DrawerTitle className="text-2xl font-serif">{editingItem ? "Edit Product" : "Add New Product"}</DrawerTitle>
                                <DrawerDescription className="mt-1">
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
                                        <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1">Product Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Tell a story about this product..."
                                            rows={3}
                                            className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/20 text-brand-deep dark:text-brand-cream resize-none text-sm leading-relaxed"
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

                                    {editingItem ? (
                                        <div className="pt-6 border-t border-brand-deep/5 dark:border-white/5 mt-6">
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                disabled={isSubmitting}
                                                onClick={() => {
                                                    setItemToDelete(editingItem)
                                                    setConfirmDeleteOpen(true)
                                                }}
                                                className="flex items-center justify-center gap-2 w-full py-4 text-xs font-bold text-rose-500/60 dark:text-rose-400 dark:hover:text-rose-500 hover:text-rose-500 transition-all uppercase tracking-widest disabled:opacity-50"
                                            >
                                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                Delete Product from Inventory
                                            </Button>
                                        </div>
                                    ) : null}
                                </form>
                            </DrawerBody>
                        </DrawerContent>
                    </Drawer>
                    <BulkUploadDrawer
                        isOpen={isBulkUploadOpen}
                        onOpenChange={setIsBulkUploadOpen}
                        onComplete={() => setIsBulkUploadOpen(false)}
                    />
                    <ConfirmDialog
                        open={confirmDeleteOpen}
                        onOpenChange={setConfirmDeleteOpen}
                        onConfirm={() => handleDelete(itemToDelete?.id)}
                        isLoading={isSubmitting}
                        title="Delete Product?"
                        description={`This will permanently remove "${itemToDelete?.product || 'this product'}" from your inventory across all stores. This action cannot be undone.`}
                        confirmText="Delete Product"
                        variant="destructive"
                    />
                    <ProductViewDrawer
                        isOpen={isViewDrawerOpen}
                        onOpenChange={setIsViewDrawerOpen}
                        item={viewItem}
                        onEdit={(item) => {
                            setFormData(prepareFormData(item))
                            setEditingItem(item)
                        }}
                        onDelete={(item) => {
                            setItemToDelete(item)
                            setConfirmDeleteOpen(true)
                        }}
                    />
                </div>
            </div>
        </PageTransition>
    )
}
