"use client"

import * as React from 'react'
import Image from "next/image"
import DataTable, { type Column } from '@/app/components/DataTable'
import { useIsMobile } from '@/app/hooks/useMediaQuery'
import { PageTransition } from '@/app/components/layout/page-transition'
import { ListCard } from '@/app/components/ui/list-card'
import { GlassCard } from '@/app/components/ui/glass-card'
import { AlertTriangle, Package, Trash2, Loader2, Plus, Sparkles, MoreVertical, Copy, Eye, Pencil, ChevronLeft, ChevronRight, Barcode, RefreshCw, PackageX, ListTree, Layers, ChevronRight as ChevronRightIcon } from 'lucide-react'
import { cn } from '@/app/lib/utils'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/app/components/ui/select"
import { Switch } from "@/app/components/ui/switch"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/app/components/ui/dropdown-menu"
import { ManagementHeader } from '@/app/components/shared/ManagementHeader'
import { InsightWhisper } from '@/app/components/dashboard/InsightWhisper'
import { Skeleton } from '@/app/components/ui/skeleton'
import { useBusiness } from '@/app/components/BusinessProvider'
import { usePermission } from '@/app/hooks/usePermission'
import { usePresetPageCopy } from "@/app/domains/workspace/hooks/usePresetPageCopy"
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
    DrawerFooter,
} from "@/app/components/ui/drawer"
import { useInventory, type ProductFilterParams } from '../hooks/useInventory'
import { useProductCategories } from '../hooks/useProductCategories'
import { Product, InventoryItem, ProductVariant, StoreInventory } from '../types'
import { Badge } from '@/app/components/ui/badge'
import { useBarcodeGenerator, type BarcodeFormat } from '../hooks/useBarcodeGenerator'
import { MoneyInput } from '@/app/components/ui/money-input'
import { formatCurrency } from '@/app/lib/formatters'
import { CurrencyText } from '@/app/components/shared/CurrencyText'
import { ImageUpload } from '@/app/components/ui/image-upload'
import { StoreSelector } from '@/app/components/shared/storeSelector'
import { StoreContextSelector } from '@/app/components/shared/StoreContextSelector'
import { BulkUploadDrawer } from './BulkUploadDrawer'
import { ManageCategoriesDrawer } from './ManageCategoriesDrawer'
import { ConfirmDialog } from '@/app/components/shared/ConfirmDialog'
import { Markdown } from '@/app/components/ui/markdown'
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover"
import { ProductViewDrawer } from './ProductViewDrawer'
import { LabelPreviewDrawer } from './LabelPreviewDrawer'
import {
    VariantsAndOptionsSheet,
    newVariantKey,
    variantDisplayNameFromOptions,
    type FormStoreInventoryLine,
    type FormVariantOptionValue,
    type FormVariantRow,
    type FormProductOption,
} from './VariantsAndOptionsSheet'

const PER_PAGE = 10

const STATUS_FILTER_OPTIONS = [
    { label: "In Stock", value: "In Stock" },
    { label: "Low Stock", value: "Low Stock" },
] as const

/** API pagination meta for product lists */
interface ProductListMeta {
    currentPage: number
    totalPages: number
}

interface ProductFormState {
    product: string
    description: string
    price: string
    categoryId: string
    costPrice: string
    barcode: string
    unit: string
    isActive: boolean
    catalogSyncEnabled: boolean
    reorderLevel: string
    imageUrls: string[]
    storeIds: string[]
    variants: FormVariantRow[]
    productOptions: FormProductOption[]
}

function serializeProductOptions(options: FormProductOption[]): FormProductOption[] | undefined {
    const cleaned = options
        .map((opt, idx) => ({
            name: (opt.name || '').trim(),
            position: opt.position ?? idx + 1,
            values: Array.from(
                new Set((opt.values || []).map((v) => v.trim()).filter((v) => v.length > 0))
            ),
        }))
        .filter((opt) => opt.name.length > 0)
    return cleaned.length > 0 ? cleaned : undefined
}

function serializeVariantOptionValues(values: FormVariantOptionValue[]): FormVariantOptionValue[] {
    return values
        .map((entry) => ({
            name: (entry.name || '').trim(),
            value: (entry.value || '').trim(),
        }))
        .filter((entry) => entry.name.length > 0 && entry.value.length > 0)
}

/** Legacy/snake_case inventory rows from some API payloads */
type LegacyInventoryRow = Partial<Pick<StoreInventory, 'storeId' | 'stockQuantity'>> & {
    store_id?: string
    stock_quantity?: number
    store?: StoreInventory['store']
    store_name?: string
}

function variantInventoryRows(v: ProductVariant): LegacyInventoryRow[] {
    const ext = v as ProductVariant & { variant_inventories?: LegacyInventoryRow[] }
    if (v.inventories?.length) return v.inventories
    return ext.variant_inventories ?? []
}

function legacyInvStoreId(inv: LegacyInventoryRow): string {
    return inv.storeId ?? inv.store_id ?? ''
}

function legacyInvStock(inv: LegacyInventoryRow): number {
    return Number(inv.stockQuantity ?? inv.stock_quantity ?? 0)
}

function legacyInvStoreName(inv: LegacyInventoryRow): string {
    return inv.store?.name ?? inv.store_name ?? 'Store'
}

/** DataTable row includes phantom `actions` column key */
type InventoryTableRow = InventoryItem & { actions?: undefined }

export function InventoryView() {
    const isMobile = useIsMobile()
    const { currency, activeBusiness } = useBusiness()
    const { can } = usePermission()
    const canManageProducts = can('MANAGE_PRODUCTS')
    const pageCopy = usePresetPageCopy()
    const iui = pageCopy.inventoryUi
    const currencyCode = activeBusiness?.currency || 'NGN'
    const { stores } = useStores()
    const [selectedStoreId, setSelectedStoreId] = React.useState<string>('all-stores')
    const [currentPage, setCurrentPage] = React.useState(1)
    const pageSize = PER_PAGE
    const [search, setSearch] = React.useState("")
    const deferredSearch = React.useDeferredValue(search)
    const [selectedFilters, setSelectedFilters] = React.useState<string[]>([])

    const { options: categoryOptions } = useProductCategories()
    const storeFilterOptions = React.useMemo(
        () => stores.map((s) => ({ label: s.name, value: s.id })),
        [stores]
    )
    const [isLabelDrawerOpen, setIsLabelDrawerOpen] = React.useState(false)
    const [labelDrawerProducts, setLabelDrawerProducts] = React.useState<InventoryItem[]>([])
    const { autoGenerateBarcode } = useBarcodeGenerator()
    const [barcodeFormat] = React.useState<BarcodeFormat>('CODE128')

    const serverFilters = React.useMemo<ProductFilterParams>(() => {
        const status = selectedFilters.filter((f) =>
            STATUS_FILTER_OPTIONS.some((o) => o.value === f)
        )
        const storeIds = selectedFilters.filter((f) =>
            storeFilterOptions.some((o) => o.value === f)
        )
        const categoryIds = selectedFilters.filter((f) =>
            categoryOptions.some((o) => o.value === f)
        )
        return {
            ...(deferredSearch?.trim() ? { search: deferredSearch.trim() } : {}),
            ...(status.length > 0 ? { status } : {}),
            ...(storeIds.length > 0 ? { storeIds } : {}),
            ...(categoryIds.length > 0 ? { categoryIds } : {}),
        }
    }, [deferredSearch, selectedFilters, storeFilterOptions, categoryOptions])

    const filterSortKey = React.useMemo(
        () => selectedFilters.slice().sort().join(','),
        [selectedFilters]
    )

    React.useEffect(() => {
        setCurrentPage(1)
    }, [selectedStoreId, deferredSearch, filterSortKey])

    const { products, meta, summary, isFetching, createProduct, updateProduct, deleteProduct, syncProductCatalog, syncingCatalogState, removeProductFromCatalog, removingFromCatalogState } = useInventory(
        selectedStoreId !== 'all-stores' ? selectedStoreId : undefined,
        currentPage,
        pageSize,
        activeBusiness?.id ? serverFilters : undefined
    )

    const selectedStoreName = React.useMemo(() => {
        if (selectedStoreId === 'all-stores') return 'All Stores'
        return stores.find(s => s.id === selectedStoreId)?.name || 'Store'
    }, [selectedStoreId, stores])

    const defaultStore = React.useMemo(() => stores.find(s => s.isDefault) || stores[0], [stores])
    const [isAddDrawerOpen, setIsAddDrawerOpen] = React.useState(false)
    const [isBulkUploadOpen, setIsBulkUploadOpen] = React.useState(false)
    const [isCategoriesDrawerOpen, setIsCategoriesDrawerOpen] = React.useState(false)
    const [editingItem, setEditingItem] = React.useState<InventoryItem | null>(null)
    const [viewItem, setViewItem] = React.useState<InventoryItem | null>(null)
    const [isViewDrawerOpen, setIsViewDrawerOpen] = React.useState(false)
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false)
    const [itemToDelete, setItemToDelete] = React.useState<InventoryItem | null>(null)
    const [catalogRemoveConfirm, setCatalogRemoveConfirm] = React.useState<null | {
        item: InventoryItem
        scope: 'whitelabel' | 'global'
    }>(null)

    const INITIAL_FORM_STATE: ProductFormState = {
        product: '',
        description: '',
        price: '',
        categoryId: '',
        costPrice: '',
        barcode: '',
        unit: '',
        isActive: true,
        catalogSyncEnabled: true,
        reorderLevel: '',
        imageUrls: [],
        storeIds: [],
        variants: [],
        productOptions: [],
    }

    // Form states
    const [formData, setFormData] = React.useState<ProductFormState>(INITIAL_FORM_STATE)
    const [isVariantsSheetOpen, setIsVariantsSheetOpen] = React.useState(false)

    const pageMeta = meta as ProductListMeta | undefined

    // Map backend products to view-friendly inventory items
    const inventory = React.useMemo(() => {
        if (!products) return []

        return products.map((p: Product) => {
            let globalStock = 0
            let localStock = 0
            const variants = p.variants ?? p.product_variants ?? []
            const storeBreakdown: Record<string, number> = {}

            const perStoreStock: Record<string, number> = {}

            variants.forEach((v) => {
                variantInventoryRows(v).forEach((inv) => {
                    const invStoreId = legacyInvStoreId(inv)
                    const storeName = legacyInvStoreName(inv)
                    const stockQuantity = legacyInvStock(inv)

                    globalStock += stockQuantity
                    perStoreStock[invStoreId] = (perStoreStock[invStoreId] || 0) + stockQuantity

                    if (selectedStoreId !== 'all-stores' && invStoreId === selectedStoreId) {
                        localStock += stockQuantity
                    }

                    if (stockQuantity > 0) {
                        storeBreakdown[storeName] = (storeBreakdown[storeName] || 0) + stockQuantity
                    }
                })
            })

            const threshold = summary?.lowStockThreshold || 5
            const assignedStores = p.stores ?? []
            let status: string

            if (selectedStoreId === 'all-stores') {
                if (globalStock === 0) {
                    status = 'Out of Stock'
                } else {
                    const lowInAnyStore = assignedStores.length === 0 ||
                        assignedStores.some((s) => (perStoreStock[s.id] || 0) <= threshold)
                    status = lowInAnyStore ? 'Low Stock' : 'In Stock'
                }
            } else {
                if (localStock === 0) {
                    status = 'Out of Stock'
                } else {
                    status = localStock <= threshold ? 'Low Stock' : 'In Stock'
                }
            }

            const primaryImage = p.images?.find((img) => img.isPrimary)?.url ?? p.images?.[0]?.url

            return {
                id: p.id,
                product: p.name,
                stock: globalStock,
                localStock: localStock,
                storeBreakdown,
                price: formatCurrency(p.basePrice || 0, { currency: currencyCode }),
                numericPrice: p.basePrice || 0,
                variantsCount: variants.length,
                availableIn: assignedStores.map((s) => s.name),
                status,
                category: p.category?.name ?? 'General',
                image: primaryImage,
                catalogSync: p.catalogSync || null,
                catalogEligibility: p.catalogEligibility || null,
                raw: p
            }
        })
    }, [products, currencyCode, selectedStoreId, summary?.lowStockThreshold])

    const filterGroups = React.useMemo(
        () => [
            {
                key: 'storeId' as const,
                title: 'Stores',
                options: storeFilterOptions as { label: string; value: string }[]
            },
            {
                key: 'status' as const,
                title: 'Status',
                options: [...STATUS_FILTER_OPTIONS]
            },
            {
                key: 'categoryId' as const,
                title: 'Category',
                options: categoryOptions
            }
        ],
        [storeFilterOptions, categoryOptions]
    )

    // Aggregated stats from backend summary
    const lowStockItems = summary?.lowStockItems || 0
    const totalInventoryValue = summary?.totalValue || 0
    const totalProducts = summary?.totalProducts || 0
    const totalStockUnits = summary?.totalStockUnits || 0
    const catalogPendingWhitelabel = summary?.catalogPendingWhitelabel ?? 0
    const catalogPendingGlobal = summary?.catalogPendingGlobal ?? 0
    const catalogPendingTotal = catalogPendingWhitelabel + catalogPendingGlobal
    const catalogListedUnique = summary?.catalogListedProductsUnique ?? 0
    const catalogListedWl = summary?.catalogListedProductsWhitelabel ?? 0
    const catalogListedGl = summary?.catalogListedProductsGlobal ?? 0
    const showCatalogPendingCard = summary?.showCatalogPendingCard === true

    const filteredInventory = React.useMemo(() => {
        if (activeBusiness?.id) return inventory
        const query = search.toLowerCase()
        const statusOptions = filterGroups.find(g => g.key === 'status')?.options || []
        const storeOptions = filterGroups.find(g => g.key === 'storeId')?.options || []

        const activeStatuses = new Set(selectedFilters.filter(f => statusOptions.some((o) => o.value === f)))
        const activeStores = new Set(selectedFilters.filter(f => storeOptions.some((o) => o.value === f)))

        return inventory.filter((item: InventoryItem) => {
            const matchesSearch = item.product.toLowerCase().includes(query)
            const matchesStatus = activeStatuses.size === 0 || activeStatuses.has(item.status)
            const matchesStore = activeStores.size === 0 || Array.from(activeStores).some(sid => (item.raw as Product & { stores?: { id: string }[] }).stores?.some((s) => s.id === sid))

            return matchesSearch && matchesStatus && matchesStore
        })
    }, [activeBusiness?.id, inventory, search, selectedFilters, filterGroups])

    const displayItems = activeBusiness?.id ? inventory : filteredInventory

    const prepareFormData = (item: InventoryItem): ProductFormState => {
        const raw = item.raw
        const variantsSource = raw.variants ?? raw.product_variants ?? []
        const productOptions: FormProductOption[] = (raw.productOptions ?? []).map((opt, idx) => ({
            name: opt.name,
            position: opt.position ?? idx + 1,
            values: Array.from(new Set((opt.values ?? []).filter(Boolean))),
        }))
        return {
            product: item.product,
            description: raw.description || '',
            price: item.numericPrice.toString(),
            categoryId: raw.categoryId ?? raw.category?.id ?? '',
            costPrice: raw.costPrice != null ? String(raw.costPrice) : '',
            barcode: raw.barcode ?? '',
            unit: raw.unit ?? '',
            isActive: raw.isActive !== false,
            catalogSyncEnabled: raw.catalogSyncEnabled !== false,
            reorderLevel: raw.reorderLevel != null ? String(raw.reorderLevel) : '',
            imageUrls: raw.images?.map((img) => img.url) || [],
            storeIds: raw.stores?.map((s) => s.id) || [],
            productOptions,
            variants: variantsSource.map((v): FormVariantRow => ({
                _key: v.id || newVariantKey(),
                id: v.id,
                name: v.name || 'Standard',
                sku: v.sku || '',
                barcode: v.barcode || '',
                price: v.price != null ? v.price.toString() : item.numericPrice.toString(),
                stockQuantity:
                    v.inventories?.reduce((sum, inv) => sum + (Number(inv.stockQuantity) || 0), 0) || 0,
                storeInventory: v.inventories?.map((inv) => ({
                    storeId: inv.storeId,
                    stockQuantity: inv.stockQuantity,
                })) || [],
                optionValues: (v.optionValues ?? []).map((entry) => ({
                    name: entry.name,
                    value: entry.value,
                })),
            })) || [{
                _key: newVariantKey(),
                name: 'Standard',
                sku: '',
                barcode: '',
                price: item.numericPrice.toString(),
                stockQuantity: 0,
                storeInventory: [],
                optionValues: [],
            }]
        }
    }

    const productSyncEligibility = React.useCallback((item: InventoryItem) => {
        const serverEligibility = item.catalogEligibility
        if (serverEligibility && !serverEligibility.available) {
            return { canSync: false, hint: serverEligibility.message || 'This product is not eligible for catalog sync.' }
        }

        const raw = item.raw
        const variants = raw.variants ?? raw.product_variants ?? []
        const hasImage = Boolean(item.image)
        const isActive = raw.isActive !== false
        const hasPrice = Number(item.numericPrice || 0) > 0 || variants.some((v) => Number(v?.price || 0) > 0)
        const hasStock = Number(item.stock || 0) > 0

        if (!isActive) return { canSync: false, hint: 'Only active products can be synced.' }
        if (!hasImage) return { canSync: false, hint: 'Add a product image before syncing to catalog.' }
        if (!hasPrice) return { canSync: false, hint: 'Set a valid product or variant price before syncing.' }
        if (!hasStock) return { canSync: false, hint: 'Product must be in stock before syncing.' }
        return { canSync: true, hint: null as string | null }
    }, [])

    const catalogScopeHasSyncedItems = React.useCallback((item: InventoryItem, scope: 'whitelabel' | 'global') => {
        const sync = item.catalogSync
        const n = scope === 'whitelabel' ? sync?.whitelabel?.syncedItems ?? 0 : sync?.global?.syncedItems ?? 0
        return n > 0
    }, [])

    const productHasAnySyncedCatalogItems = React.useCallback(
        (item: InventoryItem) =>
            catalogScopeHasSyncedItems(item, 'whitelabel') || catalogScopeHasSyncedItems(item, 'global'),
        [catalogScopeHasSyncedItems]
    )

    /** Match Catalog column: ineligible products (N/A) must not get removal actions. */
    const productCanRemoveFromCatalog = React.useCallback(
        (item: InventoryItem) => {
            const el = item.catalogEligibility
            if (el && !el.available) return false
            return productHasAnySyncedCatalogItems(item)
        },
        [productHasAnySyncedCatalogItems]
    )

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            await createProduct({
                name: formData.product,
                description: formData.description,
                price: parseFloat(formData.price) || 0,
                categoryId: formData.categoryId || undefined,
                costPrice: formData.costPrice ? parseFloat(formData.costPrice) : undefined,
                barcode: formData.barcode || undefined,
                unit: formData.unit || undefined,
                isActive: formData.isActive,
                catalogSyncEnabled: formData.catalogSyncEnabled,
                reorderLevel: formData.reorderLevel ? parseInt(formData.reorderLevel, 10) : undefined,
                imageUrls: formData.imageUrls,
                storeIds: formData.storeIds,
                productOptions: serializeProductOptions(formData.productOptions),
                variants: formData.variants.map(v => {
                    const { _key: _omit, ...rest } = v
                    // Final sum check before submission
                    const total = (v.storeInventory || [])
                        .filter((s: FormStoreInventoryLine) => formData.storeIds.includes(s.storeId))
                        .reduce((sum: number, s: FormStoreInventoryLine) => sum + (Number(s.stockQuantity) || 0), 0)

                    const cleanOptionValues = serializeVariantOptionValues(v.optionValues)
                    const derivedName = variantDisplayNameFromOptions(cleanOptionValues)
                    return {
                        ...rest,
                        name: derivedName || v.name,
                        price: parseFloat(v.price) || 0,
                        stockQuantity: formData.storeIds.length > 1 ? total : (Number(v.stockQuantity) || 0),
                        storeInventory: v.storeInventory?.map((s: FormStoreInventoryLine) => ({ ...s, stockQuantity: Number(s.stockQuantity) || 0 })),
                        optionValues: cleanOptionValues,
                    }
                })
            })
            setIsAddDrawerOpen(false)
            setFormData(INITIAL_FORM_STATE)
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
                    categoryId: formData.categoryId || null,
                    costPrice: formData.costPrice ? parseFloat(formData.costPrice) : null,
                    barcode: formData.barcode || undefined,
                    unit: formData.unit || undefined,
                    isActive: formData.isActive,
                    catalogSyncEnabled: formData.catalogSyncEnabled,
                    reorderLevel: formData.reorderLevel ? parseInt(formData.reorderLevel, 10) : null,
                    imageUrls: formData.imageUrls,
                    storeIds: formData.storeIds,
                    productOptions: serializeProductOptions(formData.productOptions),
                    variants: formData.variants.map(v => {
                        const { _key: _omit, ...rest } = v
                        // Final sum check before submission
                        const total = (v.storeInventory || [])
                            .filter((s: FormStoreInventoryLine) => formData.storeIds.includes(s.storeId))
                            .reduce((sum: number, s: FormStoreInventoryLine) => sum + (Number(s.stockQuantity) || 0), 0)

                        const cleanOptionValues = serializeVariantOptionValues(v.optionValues)
                        const derivedName = variantDisplayNameFromOptions(cleanOptionValues)
                        return {
                            ...rest,
                            name: derivedName || v.name,
                            price: parseFloat(v.price) || 0,
                            stockQuantity: formData.storeIds.length > 1 ? total : (Number(v.stockQuantity) || 0),
                            storeInventory: v.storeInventory?.map((s: FormStoreInventoryLine) => ({ ...s, stockQuantity: Number(s.stockQuantity) || 0 })),
                            optionValues: cleanOptionValues,
                        }
                    })
                }
            })
            setEditingItem(null)
            setFormData(INITIAL_FORM_STATE)
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

    const columns: Column<InventoryTableRow>[] = [
        {
            key: 'product',
            header: 'Product',
            width: 'auto',
            cellClassName: 'whitespace-normal',
            render: (val: string, item: InventoryTableRow) => (
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
            width: '100px',
            render: (value: number) => (
                <Badge variant="default">
                    {value} {value === 1 ? 'variant' : 'variants'}
                </Badge>
            )
        },
        {
            key: 'stock',
            header: 'Stock',
            width: '110px',
            render: (value: number, item: InventoryTableRow) => {
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
            width: '100px',
            render: (value: string) => (
                <span className="font-serif font-medium text-brand-deep dark:text-brand-cream">
                    <CurrencyText value={value} />
                </span>
            )
        },
        {
            key: 'availableIn',
            header: 'Available In',
            width: '130px',
            cellClassName: 'whitespace-normal',
            render: (stores: string[]) => (
                <div className="flex flex-wrap gap-1">
                    {stores.map(name => (
                        <Badge key={name} variant="success" title={name} tabIndex={0} className="max-w-[110px] overflow-hidden cursor-default">
                            <span className="truncate">{name}</span>
                        </Badge>
                    ))}
                    {stores.length === 0 ? (
                        <span className="text-[9px] text-brand-accent/40 dark:text-brand-cream/40 italic">Not assigned</span>
                    ) : null}
                </div>
            )
        },
        {
            key: 'catalogSync',
            header: 'Catalog',
            width: '180px',
            cellClassName: 'whitespace-normal',
            render: (_sync: Product['catalogSync'], item: InventoryTableRow) => {
                const eligibility = item.catalogEligibility
                if (eligibility && !eligibility.available) {
                    return (
                        <Badge variant="secondary" className="uppercase">
                            N/A
                        </Badge>
                    )
                }
                const sync = item.catalogSync
                const whiteLabelSynced = Boolean(sync?.whitelabel?.hasItems)
                const globalSynced = Boolean(sync?.global?.hasItems)
                return (
                    <div className="flex flex-wrap gap-1">
                        <Badge variant={whiteLabelSynced ? 'success' : 'secondary'} className="uppercase">
                            WL {whiteLabelSynced ? 'Synced' : 'Not Synced'}
                        </Badge>
                        <Badge variant={globalSynced ? 'success' : 'secondary'} className="uppercase">
                            Global {globalSynced ? 'Synced' : 'Not Synced'}
                        </Badge>
                    </div>
                )
            }
        },
        {
            key: 'status',
            header: 'Status',
            width: '100px',
            render: (value: string) => (
                <Badge
                    variant={value === 'In Stock' ? 'success' : value === 'Out of Stock' ? 'destructive' : 'warning'}
                    className='uppercase'
                >
                    {value}
                </Badge>
            )
        },
        {
            key: 'actions',
            header: '',
            width: '50px',
            render: (_: unknown, item: InventoryTableRow) => (
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
                                    setLabelDrawerProducts([item])
                                    setIsLabelDrawerOpen(true)
                                }}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-brand-deep/60 dark:text-brand-cream/60 focus:bg-brand-green/10 focus:text-brand-green dark:focus:bg-brand-gold/10 dark:focus:text-brand-gold cursor-pointer"
                            >
                                <Barcode className="w-4 h-4" />
                                Print Labels
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    const data = prepareFormData(item)
                                    // Strip IDs and SKUs for duplication to prevent collisions
                                    const duplicated = {
                                        ...data,
                                        product: `${data.product} (Copy)`,
                                        variants: data.variants.map((v) => ({ ...v, _key: newVariantKey(), id: undefined, sku: '', barcode: '' }))
                                    }
                                    setFormData(duplicated)
                                    setIsAddDrawerOpen(true)
                                }}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-brand-deep/60 dark:text-brand-cream/60 focus:bg-brand-green/10 focus:text-brand-green dark:focus:bg-brand-gold/10 dark:focus:text-brand-gold cursor-pointer"
                            >
                                <Copy className="w-4 h-4" />
                                Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1 bg-brand-deep/5 dark:bg-white/5" />
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger
                                    disabled={!productSyncEligibility(item).canSync || syncingCatalogState.productId === item.id}
                                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-brand-deep/70 dark:text-brand-cream/80 focus:bg-brand-deep/10 dark:focus:bg-white/10 focus:text-brand-deep dark:focus:text-brand-cream data-[state=open]:bg-brand-deep/10 dark:data-[state=open]:bg-white/10 data-[state=open]:text-brand-deep dark:data-[state=open]:text-brand-cream"
                                >
                                    <Loader2 className={cn(
                                        "w-4 h-4",
                                        syncingCatalogState.productId === item.id && "animate-spin"
                                    )} />
                                    {syncingCatalogState.productId === item.id ? 'Syncing...' : 'Sync Catalog'}
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent
                                    alignOffset={-8}
                                    className="w-56 rounded-2xl p-2 bg-white/95 dark:bg-brand-deep-800 border-brand-deep/5 dark:border-white/5 shadow-2xl"
                                >
                                    <DropdownMenuItem
                                        onClick={async () => {
                                            const check = productSyncEligibility(item)
                                            if (!check.canSync) return
                                            await syncProductCatalog({ id: item.id, scope: 'whitelabel', productName: item.product })
                                        }}
                                        disabled={!productSyncEligibility(item).canSync || syncingCatalogState.productId === item.id}
                                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer"
                                    >
                                        <Loader2 className={cn("w-4 h-4", syncingCatalogState.productId === item.id && syncingCatalogState.scope === 'whitelabel' && "animate-spin")} />
                                        {syncingCatalogState.productId === item.id && syncingCatalogState.scope === 'whitelabel' ? 'Syncing White-label...' : 'Sync White-label'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={async () => {
                                            const check = productSyncEligibility(item)
                                            if (!check.canSync) return
                                            await syncProductCatalog({ id: item.id, scope: 'global', productName: item.product })
                                        }}
                                        disabled={!productSyncEligibility(item).canSync || syncingCatalogState.productId === item.id}
                                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer"
                                    >
                                        <Loader2 className={cn("w-4 h-4", syncingCatalogState.productId === item.id && syncingCatalogState.scope === 'global' && "animate-spin")} />
                                        {syncingCatalogState.productId === item.id && syncingCatalogState.scope === 'global' ? 'Syncing Global...' : 'Sync Global'}
                                    </DropdownMenuItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            {canManageProducts && productCanRemoveFromCatalog(item) ? (
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger
                                        disabled={removingFromCatalogState.productId === item.id}
                                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-brand-deep/70 dark:text-brand-cream/80 focus:bg-brand-deep/10 dark:focus:bg-white/10 focus:text-brand-deep dark:focus:text-brand-cream data-[state=open]:bg-brand-deep/10 dark:data-[state=open]:bg-white/10 data-[state=open]:text-brand-deep dark:data-[state=open]:text-brand-cream"
                                    >
                                        {removingFromCatalogState.productId === item.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <PackageX className="w-4 h-4 text-brand-deep/40 dark:text-brand-cream/40" />
                                        )}
                                        Remove from catalog
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent
                                        alignOffset={-8}
                                        className="w-56 rounded-2xl p-2 bg-white/95 dark:bg-brand-deep-800 border-brand-deep/5 dark:border-white/5 shadow-2xl"
                                    >
                                        <DropdownMenuItem
                                            onClick={() => setCatalogRemoveConfirm({ item, scope: 'whitelabel' })}
                                            disabled={
                                                !catalogScopeHasSyncedItems(item, 'whitelabel') ||
                                                removingFromCatalogState.productId === item.id
                                            }
                                            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer"
                                        >
                                            White-label
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => setCatalogRemoveConfirm({ item, scope: 'global' })}
                                            disabled={
                                                !catalogScopeHasSyncedItems(item, 'global') ||
                                                removingFromCatalogState.productId === item.id
                                            }
                                            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer"
                                        >
                                            Global
                                        </DropdownMenuItem>
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub>
                            ) : null}
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
                </div >
            )
        },
    ] as unknown as Column<InventoryTableRow>[]

    const intelligenceWhisper =
        lowStockItems > 0 ? iui.whisperLowStock(lowStockItems) : iui.whisperHealthy

    const isAllStores = selectedStoreId === 'all-stores'
    return (
        <PageTransition>
            <div className="max-w-6xl mx-auto space-y-8 pb-24">
                <ManagementHeader
                    title={pageCopy.inventory.title}
                    description={pageCopy.inventory.description}
                    extraActions={
                        <div className="w-full flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                            <StoreContextSelector
                                value={selectedStoreId}
                                onChange={setSelectedStoreId}
                                className="w-full sm:w-auto flex justify-between"
                            />
                            <Button
                                variant="ghost"
                                onClick={() => setIsCategoriesDrawerOpen(true)}
                                className="flex h-12 rounded-full bg-white border border-brand-accent/10 text-brand-deep-800 hover:text-brand-deep dark:bg-white/5 dark:text-brand-cream/80 dark:border dark:border-brand-gold-500/20 dark:hover:text-brand-gold transition-all gap-2"
                            >
                                Categories
                            </Button>
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
                    addButtonLabel={iui.addProduct}
                    onAddClick={() => {
                        setFormData({
                            ...INITIAL_FORM_STATE,
                            storeIds: defaultStore ? [defaultStore.id] : [],
                            variants: [{ _key: newVariantKey(), name: 'Standard', sku: '', barcode: '', price: '', stockQuantity: 0, storeInventory: [], optionValues: [] }]
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

                {pageCopy.inventoryUi.expiryComplianceBanner.trim() ? (
                    <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm text-brand-deep/90 dark:text-brand-cream/85 md:px-5">
                        <Markdown content={pageCopy.inventoryUi.expiryComplianceBanner} />
                    </div>
                ) : null}

                {/* Stats Row */}
                <div
                    className={cn(
                        "grid grid-cols-1 md:grid-cols-2 gap-4",
                        showCatalogPendingCard ? "xl:grid-cols-4" : "xl:grid-cols-3"
                    )}
                >
                    <GlassCard className="p-5 flex items-center gap-4 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Package className="w-24 h-24 dark:text-brand-cream/10" />
                        </div>
                        <div className="h-12 w-12 rounded-full bg-brand-green/10 dark:bg-brand-green/20 flex items-center justify-center text-brand-deep dark:text-brand-cream">
                            {isFetching ? <Loader2 className="h-5 w-5 animate-spin" /> : <Package className="h-6 w-6" />}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-brand-accent/40 dark:text-brand-cream/60 uppercase tracking-wider">{iui.stats.totalUnits}</p>
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
                            <p className="text-sm font-medium text-brand-accent/40 dark:text-brand-cream/60 uppercase tracking-wider">{iui.stats.products}</p>
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
                            <p className="text-sm font-medium text-brand-gold/60 dark:text-brand-gold/70 uppercase tracking-wider">{iui.stats.inventoryValue}</p>
                            {isFetching ? <Skeleton className="h-8 w-32 mt-1" /> : <p className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream">
                                <CurrencyText value={formatCurrency(totalInventoryValue, { currency: currencyCode })} />
                            </p>}
                        </div>
                    </GlassCard>

                    {showCatalogPendingCard ? (
                        <GlassCard
                            className={cn(
                                "p-5 flex items-center gap-4 relative overflow-hidden group",
                                catalogPendingTotal > 0
                                    ? "border-brand-green/20 dark:border-emerald-500/25"
                                    : "border-brand-deep/8 dark:border-white/8"
                            )}
                        >
                            <div className="absolute right-0 top-0 p-3 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity pointer-events-none">
                                <ListTree className="w-24 h-24 text-brand-green dark:text-emerald-400/30" />
                            </div>
                            <div
                                className={cn(
                                    "relative z-1 h-12 w-12 shrink-0 rounded-full flex items-center justify-center",
                                    catalogPendingTotal > 0
                                        ? "bg-brand-green/12 dark:bg-emerald-500/15 text-brand-green dark:text-emerald-300"
                                        : "bg-brand-accent/10 dark:bg-white/5 text-brand-deep dark:text-brand-cream"
                                )}
                            >
                                {isFetching ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <RefreshCw className="h-6 w-6" />
                                )}
                            </div>
                            <div className="relative z-1 flex-1 min-w-0">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute -top-1 right-0 h-9 w-9 rounded-full text-brand-deep/45 hover:text-brand-green hover:bg-brand-green/10 dark:text-brand-cream/45 dark:hover:bg-white/10 dark:hover:text-brand-gold"
                                            aria-label={`${iui.stats.catalogListedBreakdown}${catalogPendingTotal > 0 ? ` · ${iui.stats.catalogPendingBreakdown}` : ''}`}
                                        >
                                            <ListTree className="h-4 w-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent align="end" sideOffset={8} className="w-80 p-0 overflow-hidden rounded-2xl">
                                        <div className="px-4 py-3 border-b border-brand-deep/5 dark:border-white/10 bg-brand-deep/2 dark:bg-white/3">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/45 dark:text-brand-cream/45">
                                                {iui.stats.catalogListedBreakdown}
                                            </p>
                                        </div>
                                        <div className="p-4 space-y-4">
                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-sm font-medium text-brand-deep/75 dark:text-brand-cream/80">{iui.stats.catalogPendingWhitelabel}</span>
                                                <span className="text-xl font-semibold tabular-nums text-brand-deep dark:text-brand-cream">{catalogListedWl}</span>
                                            </div>
                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-sm font-medium text-brand-deep/75 dark:text-brand-cream/80">{iui.stats.catalogPendingGlobal}</span>
                                                <span className="text-xl font-semibold tabular-nums text-brand-deep dark:text-brand-cream">{catalogListedGl}</span>
                                            </div>
                                            {catalogPendingTotal > 0 ? (
                                                <div className="border-t border-brand-deep/8 dark:border-white/10 pt-4 space-y-3">
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/45 dark:text-brand-cream/45">
                                                        {iui.stats.catalogPendingBreakdown}
                                                    </p>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="text-sm font-medium text-brand-deep/75 dark:text-brand-cream/80">{iui.stats.catalogPendingWhitelabel}</span>
                                                        <span className="text-xl font-semibold tabular-nums text-brand-deep dark:text-brand-cream">{catalogPendingWhitelabel}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="text-sm font-medium text-brand-deep/75 dark:text-brand-cream/80">{iui.stats.catalogPendingGlobal}</span>
                                                        <span className="text-xl font-semibold tabular-nums text-brand-deep dark:text-brand-cream">{catalogPendingGlobal}</span>
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-accent/50 dark:text-brand-cream/55 pr-11">
                                    {iui.stats.catalogSyncTitle}
                                </p>
                                {isFetching ? (
                                    <Skeleton className="h-9 w-14 mt-2" />
                                ) : (
                                    <>
                                        <p className="mt-2 text-3xl font-serif font-medium text-brand-deep dark:text-brand-cream tabular-nums leading-none">
                                            {catalogListedUnique}
                                        </p>
                                        {catalogPendingTotal > 0 ? (
                                            <p className="mt-2 text-xs leading-relaxed text-brand-accent/50 dark:text-brand-cream/45 max-w-60">
                                                {iui.stats.catalogSyncPendingHint}
                                            </p>
                                        ) : null}
                                    </>
                                )}
                            </div>
                        </GlassCard>
                    ) : null}
                </div>

                {/* Main Content */}
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-accent/40 dark:text-brand-cream/40 ml-1">{iui.productList}</p>

                        <div className="flex items-center gap-3">
                            <TableSearch
                                value={search}
                                onChange={setSearch}
                                placeholder={iui.searchPlaceholder}
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
                                displayItems.map((item: InventoryItem) => (
                                    <ListCard
                                        key={item.id}
                                        title={item.product}
                                        subtitle={item.category}
                                        image={item.image}
                                        status={item.status}
                                        statusColor={item.status === 'Out of Stock' ? 'danger' : item.status === 'Low Stock' ? 'warning' : 'success'}
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
                                                            setLabelDrawerProducts([item])
                                                            setIsLabelDrawerOpen(true)
                                                        }}
                                                        className="flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-xl focus:bg-brand-green/10 dark:focus:bg-brand-gold/10 transition-colors"
                                                    >
                                                        <Barcode className="w-4 h-4 text-brand-green dark:text-brand-gold" />
                                                        Print Labels
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            const data = prepareFormData(item)
                                                            // Strip IDs and SKUs for duplication to prevent collisions
                                                            const duplicated = {
                                                                ...data,
                                                                product: `${data.product} (Copy)`,
                                                                variants: data.variants.map((v) => ({ ...v, _key: newVariantKey(), id: undefined, sku: '', barcode: '' }))
                                                            }
                                                            setFormData(duplicated)
                                                            setIsAddDrawerOpen(true)
                                                        }}
                                                        className="flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-xl focus:bg-brand-green/10 dark:focus:bg-brand-gold/10 transition-colors"
                                                    >
                                                        <Copy className="w-4 h-4 text-brand-green dark:text-brand-gold" />
                                                        Duplicate
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="my-1 bg-brand-deep/5 dark:bg-white/5" />
                                                    <DropdownMenuSub>
                                                        <DropdownMenuSubTrigger
                                                            disabled={!productSyncEligibility(item).canSync || syncingCatalogState.productId === item.id}
                                                            className="flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-xl text-brand-deep/70 dark:text-brand-cream/80 focus:bg-brand-deep/10 dark:focus:bg-white/10 focus:text-brand-deep dark:focus:text-brand-cream data-[state=open]:bg-brand-deep/10 dark:data-[state=open]:bg-white/10 data-[state=open]:text-brand-deep dark:data-[state=open]:text-brand-cream transition-colors"
                                                        >
                                                            <Loader2 className={cn(
                                                                "w-4 h-4 text-brand-green dark:text-brand-gold",
                                                                syncingCatalogState.productId === item.id && "animate-spin"
                                                            )} />
                                                            {syncingCatalogState.productId === item.id ? 'Syncing...' : 'Sync Catalog'}
                                                        </DropdownMenuSubTrigger>
                                                        <DropdownMenuSubContent
                                                            alignOffset={-8}
                                                            className="w-56 rounded-2xl p-2 bg-white/95 dark:bg-brand-deep-800 border border-brand-deep/5 dark:border-white/5 shadow-2xl"
                                                        >
                                                            <DropdownMenuItem
                                                                onClick={async (e) => {
                                                                    e.stopPropagation()
                                                                    const check = productSyncEligibility(item)
                                                                    if (!check.canSync) return
                                                                    await syncProductCatalog({ id: item.id, scope: 'whitelabel', productName: item.product })
                                                                }}
                                                                disabled={!productSyncEligibility(item).canSync || syncingCatalogState.productId === item.id}
                                                                className="flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-xl transition-colors"
                                                            >
                                                                <Loader2 className={cn("w-4 h-4 text-brand-green dark:text-brand-gold", syncingCatalogState.productId === item.id && syncingCatalogState.scope === 'whitelabel' && "animate-spin")} />
                                                                {syncingCatalogState.productId === item.id && syncingCatalogState.scope === 'whitelabel' ? 'Syncing White-label...' : 'Sync White-label'}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={async (e) => {
                                                                    e.stopPropagation()
                                                                    const check = productSyncEligibility(item)
                                                                    if (!check.canSync) return
                                                                    await syncProductCatalog({ id: item.id, scope: 'global', productName: item.product })
                                                                }}
                                                                disabled={!productSyncEligibility(item).canSync || syncingCatalogState.productId === item.id}
                                                                className="flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-xl transition-colors"
                                                            >
                                                                <Loader2 className={cn("w-4 h-4 text-brand-green dark:text-brand-gold", syncingCatalogState.productId === item.id && syncingCatalogState.scope === 'global' && "animate-spin")} />
                                                                {syncingCatalogState.productId === item.id && syncingCatalogState.scope === 'global' ? 'Syncing Global...' : 'Sync Global'}
                                                            </DropdownMenuItem>
                                                        </DropdownMenuSubContent>
                                                    </DropdownMenuSub>
                                                    {canManageProducts && productCanRemoveFromCatalog(item) ? (
                                                        <DropdownMenuSub>
                                                            <DropdownMenuSubTrigger
                                                                disabled={removingFromCatalogState.productId === item.id}
                                                                className="flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-xl text-brand-deep/70 dark:text-brand-cream/80 focus:bg-brand-deep/10 dark:focus:bg-white/10 focus:text-brand-deep dark:focus:text-brand-cream data-[state=open]:bg-brand-deep/10 dark:data-[state=open]:bg-white/10 data-[state=open]:text-brand-deep dark:data-[state=open]:text-brand-cream transition-colors"
                                                            >
                                                                {removingFromCatalogState.productId === item.id ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin text-brand-green dark:text-brand-gold" />
                                                                ) : (
                                                                    <PackageX className="w-4 h-4 text-brand-green dark:text-brand-gold" />
                                                                )}
                                                                Remove from catalog
                                                            </DropdownMenuSubTrigger>
                                                            <DropdownMenuSubContent
                                                                alignOffset={-8}
                                                                className="w-56 rounded-2xl p-2 bg-white/95 dark:bg-brand-deep-800 border border-brand-deep/5 dark:border-white/5 shadow-2xl"
                                                            >
                                                                <DropdownMenuItem
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        setCatalogRemoveConfirm({ item, scope: 'whitelabel' })
                                                                    }}
                                                                    disabled={
                                                                        !catalogScopeHasSyncedItems(item, 'whitelabel') ||
                                                                        removingFromCatalogState.productId === item.id
                                                                    }
                                                                    className="flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-xl transition-colors"
                                                                >
                                                                    White-label
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        setCatalogRemoveConfirm({ item, scope: 'global' })
                                                                    }}
                                                                    disabled={
                                                                        !catalogScopeHasSyncedItems(item, 'global') ||
                                                                        removingFromCatalogState.productId === item.id
                                                                    }
                                                                    className="flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-xl transition-colors"
                                                                >
                                                                    Global
                                                                </DropdownMenuItem>
                                                            </DropdownMenuSubContent>
                                                        </DropdownMenuSub>
                                                    ) : null}
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
                            {!isFetching && displayItems.length === 0 ? (
                                <GlassCard className="p-12 text-center">
                                    <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p className="text-brand-accent/40">No products found</p>
                                </GlassCard>
                            ) : null}

                            {/* Mobile Pagination */}
                            {pageMeta && pageMeta.totalPages > 1 ? (
                                <div className="flex items-center justify-between pt-4 border-t border-brand-deep/5 dark:border-white/5">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={pageMeta.currentPage === 1}
                                        onClick={() => setCurrentPage(pageMeta.currentPage - 1)}
                                        className="rounded-xl h-10 border-brand-deep/5 dark:border-white/10"
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-1 dark:text-brand-gold" />
                                        Prev
                                    </Button>
                                    <div className="flex items-center gap-1.5">
                                        {Array.from({ length: Math.min(pageMeta.totalPages, 5) }).map((_, i) => {
                                            const page = i + 1
                                            return (
                                                <button
                                                    key={i}
                                                    onClick={() => setCurrentPage(page)}
                                                    className={cn(
                                                        "w-1.5 h-1.5 rounded-full transition-all duration-300",
                                                        pageMeta.currentPage === page
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
                                        disabled={pageMeta.currentPage === pageMeta.totalPages}
                                        onClick={() => setCurrentPage(pageMeta.currentPage + 1)}
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
                                    data={displayItems}
                                    isLoading={isFetching}
                                    manualPagination={{
                                        currentPage: pageMeta?.currentPage || 1,
                                        totalPages: pageMeta?.totalPages || 1,
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
                                setFormData(INITIAL_FORM_STATE);
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

                            <DrawerBody className="pb-12 min-h-0 overflow-y-auto bg-brand-cream/30 dark:bg-brand-deep/10">
                                <form id="product-form" onSubmit={editingItem ? handleUpdate : handleAdd} className="max-w-xl mx-auto py-8 px-4 sm:px-8 space-y-10">
                                    {/* Section: Visuals */}
                                    <div className="space-y-4">
                                        <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-deep/40 dark:text-brand-cream/40 px-1">
                                            <Sparkles className="w-3 h-3 text-brand-gold" />
                                            Product Visuals
                                        </h3>
                                        <GlassCard className="p-6 bg-white/50 dark:bg-white/5 border-none shadow-sm ring-1 ring-brand-deep/10 dark:ring-white/5">
                                            <ImageUpload
                                                value={formData.imageUrls}
                                                onChange={(urls) => setFormData({ ...formData, imageUrls: urls })}
                                            />
                                        </GlassCard>
                                    </div>

                                    {/* Section: Basic Information */}
                                    <div className="space-y-6">
                                        <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-deep/40 dark:text-brand-cream/40">
                                            <Package className="w-3 h-3" />
                                            Basic Information
                                        </h3>
                                        <div className="grid gap-5">
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between ml-1">
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40">Product Barcode</label>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, barcode: autoGenerateBarcode(editingItem?.id || Math.random().toString(36).substring(7), barcodeFormat) })}
                                                        className="text-[9px] font-bold text-brand-gold hover:text-brand-gold/80 transition-colors flex items-center gap-1"
                                                    >
                                                        <Sparkles className="w-3 h-3" />
                                                        Auto-Generate
                                                    </button>
                                                </div>
                                                <input
                                                    placeholder="Product Barcode"
                                                    value={formData.barcode}
                                                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                                    className="w-full h-12 px-4 rounded-xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-gold/20 text-xs font-mono transition-all"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40 ml-1">Product Name</label>
                                                <input
                                                    autoFocus
                                                    required
                                                    value={formData.product}
                                                    onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                                                    placeholder="e.g. Premium Lace Material"
                                                    className="w-full px-5 py-3.5 rounded-2xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-gold/20 text-brand-deep dark:text-brand-cream transition-all font-sans"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40 ml-1">Category</label>
                                                <Select
                                                    value={formData.categoryId || "none"}
                                                    onValueChange={(val) => setFormData({ ...formData, categoryId: val === "none" ? "" : val })}
                                                >
                                                    <SelectTrigger className="w-full h-[54px] rounded-2xl bg-white dark:bg-white/5 border-brand-deep/5 dark:border-white/10 px-5 focus:ring-brand-gold/20 font-sans">
                                                        <SelectValue placeholder="Select Category" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">No category</SelectItem>
                                                        {categoryOptions.map((o) => (
                                                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40 ml-1">Product Description</label>
                                                <textarea
                                                    value={formData.description}
                                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                    placeholder="Tell a story about this product..."
                                                    rows={3}
                                                    className="w-full px-5 py-4 rounded-2xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-gold/20 text-brand-deep dark:text-brand-cream resize-none text-sm leading-relaxed transition-all font-sans"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section: Inventory & Identification */}
                                    <div className="space-y-6">
                                        <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-deep/40 dark:text-brand-cream/40">
                                            <AlertTriangle className="w-3 h-3" />
                                            Inventory & Tracking
                                        </h3>
                                        <GlassCard className="p-6 bg-white dark:bg-white/5 border-brand-deep/8 dark:border-white/10 space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40 ml-1">Barcode</label>
                                                <input
                                                    value={formData.barcode}
                                                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                                    placeholder="Optional Barcode / UPC"
                                                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-gold/20 text-xs transition-all font-mono"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40 ml-1">Unit</label>
                                                    <input
                                                        value={formData.unit}
                                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                                        placeholder="e.g. pcs, kg"
                                                        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-gold/20 text-xs transition-all"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40 ml-1">Reorder Level</label>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        value={formData.reorderLevel}
                                                        onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                                                        placeholder="Alert threshold"
                                                        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-gold/20 text-xs transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </GlassCard>
                                    </div>

                                    {/* Section: Pricing */}
                                    <div className="space-y-6">
                                        <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-deep/40 dark:text-brand-cream/40">
                                            <Sparkles className="w-3 h-3" />
                                            Pricing Strategy
                                        </h3>
                                        <div className="grid sm:grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40 ml-1">Base Selling Price</label>
                                                <MoneyInput
                                                    currencySymbol={currency}
                                                    required
                                                    value={formData.price}
                                                    onChange={(val) => {
                                                        const newPrice = val?.toString() || ''
                                                        const newVariants = formData.variants.map(v => ({
                                                            ...v,
                                                            price: v.price === formData.price || v.price === '' ? newPrice : v.price
                                                        }))
                                                        setFormData({ ...formData, price: newPrice, variants: newVariants })
                                                    }}
                                                    placeholder="e.g. 12,000"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40 ml-1">Unit Cost Price</label>
                                                <MoneyInput
                                                    currencySymbol={currency}
                                                    value={formData.costPrice}
                                                    onChange={(val) => setFormData({ ...formData, costPrice: typeof val === 'string' ? val : String(val ?? '') })}
                                                    placeholder="Optional"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section: Availability */}
                                    <div className="space-y-6">
                                        <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-deep/40 dark:text-brand-cream/40">
                                            <MoreVertical className="w-3 h-3" />
                                            Global Availability
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40 ml-1">Available In Stores</label>
                                                <StoreSelector
                                                    value={formData.storeIds}
                                                    onChange={(ids) => {
                                                        const newVariants = formData.variants.map(v => {
                                                            const total = (v.storeInventory || [])
                                                                .filter((s: FormStoreInventoryLine) => ids.includes(s.storeId))
                                                                .reduce((sum: number, s: FormStoreInventoryLine) => sum + (Number(s.stockQuantity) || 0), 0)
                                                            return { ...v, stockQuantity: total }
                                                        })
                                                        setFormData({ ...formData, storeIds: ids, variants: newVariants })
                                                    }}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-brand-deep/5 dark:border-white/5">
                                                <div className="space-y-0.5">
                                                    <label htmlFor="form-isActive" className="text-sm font-medium text-brand-deep dark:text-brand-cream cursor-pointer">
                                                        Active & Visible in Catalog
                                                    </label>
                                                    <span className="block text-[10px] text-brand-deep/40 dark:text-brand-cream/40 uppercase tracking-tight font-normal">Toggle to hide this product from customers</span>
                                                </div>
                                                <Switch
                                                    checked={formData.isActive}
                                                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-brand-deep/5 dark:border-white/5">
                                                <div className="space-y-0.5">
                                                    <label htmlFor="form-catalogSync" className="text-sm font-medium text-brand-deep dark:text-brand-cream cursor-pointer">
                                                        Auto-sync WhatsApp catalog
                                                    </label>
                                                    <span className="block text-[10px] text-brand-deep/40 dark:text-brand-cream/40 uppercase tracking-tight font-normal">When on, stock and product edits queue catalog updates</span>
                                                </div>
                                                <Switch
                                                    id="form-catalogSync"
                                                    checked={formData.catalogSyncEnabled}
                                                    onCheckedChange={(checked) => setFormData({ ...formData, catalogSyncEnabled: checked })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section: Variants & Options (opens in side sheet / drawer) */}
                                    <div className="space-y-4 pt-4">
                                        <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-deep/40 dark:text-brand-cream/40">
                                            <Layers className="w-3 h-3" />
                                            Variants & Options
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (formData.variants.length === 0) {
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        variants: [
                                                            {
                                                                _key: newVariantKey(),
                                                                name: '',
                                                                sku: '',
                                                                barcode: '',
                                                                price: prev.price,
                                                                stockQuantity: 0,
                                                                storeInventory: [],
                                                                optionValues: prev.productOptions.map((opt) => ({ name: opt.name, value: '' })),
                                                            },
                                                        ],
                                                    }))
                                                }
                                                setIsVariantsSheetOpen(true)
                                            }}
                                            className="w-full text-left rounded-2xl border border-brand-deep/5 dark:border-white/5 bg-white dark:bg-white/5 hover:border-brand-gold/30 hover:bg-brand-gold/2 transition-all p-5 flex items-center gap-4 group"
                                        >
                                            <div className="shrink-0 w-12 h-12 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center">
                                                <Layers className="w-5 h-5" strokeWidth={2.25} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <span className="text-sm font-semibold text-brand-deep dark:text-brand-cream">
                                                        {formData.variants.length === 0
                                                            ? 'Add variants & options'
                                                            : 'Manage variants & options'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Badge variant="default">
                                                        {formData.productOptions.length}{' '}
                                                        {formData.productOptions.length === 1 ? 'option' : 'options'}
                                                    </Badge>
                                                    <Badge variant="default">
                                                        {formData.variants.length}{' '}
                                                        {formData.variants.length === 1 ? 'variant' : 'variants'}
                                                    </Badge>
                                                    {formData.productOptions.length > 0 && (
                                                        <span className="text-[10px] text-brand-deep/40 dark:text-brand-cream/40 truncate">
                                                            {formData.productOptions.map((o) => o.name).filter(Boolean).join(' · ')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <ChevronRightIcon className="w-4 h-4 text-brand-deep/30 dark:text-brand-cream/30 shrink-0 group-hover:text-brand-gold transition-colors" />
                                        </button>
                                    </div>

                                    {/* Action Buttons */}
                                </form>
                            </DrawerBody>
                            <DrawerFooter className="bg-brand-cream/80 dark:bg-brand-deep-800 backdrop-blur-md pt-4">
                                <div className="max-w-xl mx-auto w-full space-y-4">
                                    <div className="flex gap-4">
                                        <DrawerClose asChild>
                                            <Button variant="ghost" className="flex-1 rounded-2xl h-14 uppercase tracking-widest text-[10px] font-bold text-brand-deep/40 dark:text-brand-cream/40 hover:bg-brand-deep/5 dark:hover:bg-white/5 transition-all" disabled={isSubmitting}>Cancel</Button>
                                        </DrawerClose>
                                        <Button
                                            onClick={() => {
                                                const form = document.getElementById('product-form') as HTMLFormElement
                                                form?.requestSubmit()
                                            }}
                                            disabled={isSubmitting}
                                            className="flex-1 rounded-2xl h-14 bg-brand-deep text-brand-gold dark:bg-brand-gold dark:hover:bg-brand-gold/80 dark:text-brand-deep font-bold shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest text-xs"
                                        >
                                            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (editingItem ? "Update Changes" : "Create Product")}
                                        </Button>
                                    </div>

                                    {editingItem && (
                                        <div className="text-center">
                                            <button
                                                type="button"
                                                disabled={isSubmitting}
                                                onClick={() => {
                                                    setItemToDelete(editingItem)
                                                    setConfirmDeleteOpen(true)
                                                }}
                                                className="px-6 py-2 text-[10px] font-bold text-rose-500/60 dark:text-rose-400/60 hover:text-rose-500 transition-all uppercase tracking-[0.2em] disabled:opacity-50 inline-flex items-center gap-2"
                                            >
                                                {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                                Permanent Removal
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </DrawerFooter>
                        </DrawerContent>
                    </Drawer>
                    <VariantsAndOptionsSheet
                        open={isVariantsSheetOpen}
                        onOpenChange={setIsVariantsSheetOpen}
                        productOptions={formData.productOptions}
                        variants={formData.variants}
                        storeIds={formData.storeIds}
                        productBasePrice={formData.price}
                        currencySymbol={currency}
                        currencyCode={currencyCode}
                        barcodeFormat={barcodeFormat}
                        autoGenerateBarcode={autoGenerateBarcode}
                        onChange={({ productOptions, variants }) =>
                            setFormData((prev) => ({ ...prev, productOptions, variants }))
                        }
                    />
                    <ManageCategoriesDrawer open={isCategoriesDrawerOpen} onOpenChange={setIsCategoriesDrawerOpen} />
                    <BulkUploadDrawer
                        isOpen={isBulkUploadOpen}
                        onOpenChange={setIsBulkUploadOpen}
                        onComplete={() => setIsBulkUploadOpen(false)}
                    />
                    <ConfirmDialog
                        open={confirmDeleteOpen}
                        onOpenChange={setConfirmDeleteOpen}
                        onConfirm={() => {
                            if (itemToDelete?.id) void handleDelete(itemToDelete.id)
                        }}
                        isLoading={isSubmitting}
                        title="Delete Product?"
                        description={`This will permanently remove "${itemToDelete?.product || 'this product'}" from your inventory across all stores. This action cannot be undone.`}
                        confirmText="Delete Product"
                        variant="destructive"
                    />
                    <ConfirmDialog
                        open={catalogRemoveConfirm !== null}
                        onOpenChange={(open) => {
                            if (!open) setCatalogRemoveConfirm(null)
                        }}
                        onConfirm={async () => {
                            if (!catalogRemoveConfirm) return
                            const { item, scope } = catalogRemoveConfirm
                            await removeProductFromCatalog(item.id, item.product, scope)
                        }}
                        isLoading={
                            !!catalogRemoveConfirm &&
                            removingFromCatalogState.productId === catalogRemoveConfirm.item.id &&
                            removingFromCatalogState.scope === catalogRemoveConfirm.scope
                        }
                        title={
                            catalogRemoveConfirm?.scope === 'global'
                                ? 'Remove from global catalog?'
                                : 'Remove from white-label catalog?'
                        }
                        description={
                            catalogRemoveConfirm
                                ? `You are about to remove "${catalogRemoveConfirm.item.product}" from the ${catalogRemoveConfirm.scope === 'global'
                                    ? 'global marketplace'
                                    : 'white-label'
                                } WhatsApp catalog. Matching items will be deleted from Meta. Automatic catalog sync for this product turns off only when it is no longer listed in any WhatsApp catalog for your business.`
                                : ''
                        }
                        confirmText="Remove from catalog"
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
                        onSyncCatalog={async (item, scope) => {
                            const check = productSyncEligibility(item)
                            if (!check.canSync) return
                            await syncProductCatalog({ id: item.id, scope, productName: item.product })
                        }}
                        isSyncingWhiteLabel={syncingCatalogState.productId === viewItem?.id && syncingCatalogState.scope === 'whitelabel'}
                        isSyncingGlobal={syncingCatalogState.productId === viewItem?.id && syncingCatalogState.scope === 'global'}
                        canSyncCatalog={viewItem ? productSyncEligibility(viewItem).canSync : false}
                        syncHint={viewItem ? productSyncEligibility(viewItem).hint : null}
                    />
                    <LabelPreviewDrawer
                        isOpen={isLabelDrawerOpen}
                        onOpenChange={setIsLabelDrawerOpen}
                        products={labelDrawerProducts}
                        mode={labelDrawerProducts.length > 1 ? 'bulk' : 'single'}
                    />
                </div>
            </div>
        </PageTransition >
    )
}
