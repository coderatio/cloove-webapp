export interface ProductImage {
    id: string
    url: string
    isPrimary: boolean
    alt?: string
}

export interface StoreInventory {
    id: string
    storeId: string
    productId: string
    variantId: string
    stockQuantity: number
    store?: {
        id: string
        name: string
    }
}

/** Per-variant value for a `ProductOption` axis declared on the parent product. */
export interface VariantOptionValue {
    name: string
    value: string
}

/** Shopify-style variant axis declared on the product. */
export interface ProductOption {
    name: string
    position: number
    values: string[]
}

export interface ProductVariant {
    id: string
    productId: string
    name: string | null
    sku: string | null
    barcode: string | null
    price: number | null
    inventories: StoreInventory[]
    optionValues?: VariantOptionValue[] | null
}

export interface ProductCategoryRef {
    id: string
    name: string
    slug: string
}

export interface Product {
    id: string
    businessId: string
    name: string
    description: string | null
    basePrice: number
    categoryId?: string | null
    category?: ProductCategoryRef | null
    sku?: string | null
    costPrice?: number | null
    barcode?: string | null
    unit?: string | null
    isActive?: boolean
    reorderLevel?: number | null
    images: ProductImage[]
    variants: ProductVariant[]
    product_variants?: ProductVariant[]
    productOptions?: ProductOption[] | null
    stores?: { id: string, name: string }[]
    catalogSync?: {
        whitelabel: {
            catalogConnected: boolean
            catalogSyncStatus: string | null
            totalItems: number
            syncedItems: number
            hasItems: boolean
            lastSyncedAt: string | null
            lastError: string | null
        }
        global: {
            catalogConnected: boolean
            catalogSyncStatus: string | null
            totalItems: number
            syncedItems: number
            hasItems: boolean
            lastSyncedAt: string | null
            lastError: string | null
        }
    } | null
    catalogEligibility?: {
        available: boolean
        reason: string | null
        message: string | null
    } | null
    /** Auto-queue WhatsApp catalog sync when inventory changes (default true). */
    catalogSyncEnabled?: boolean
}

export interface InventoryStats {
    totalValue: number
    totalProducts: number
    totalStockUnits: number
    lowStockItems: number
    lowStockThreshold: number
    /** Eligible products not fully synced to the white-label WhatsApp catalog */
    catalogPendingWhitelabel?: number
    /** Eligible products not fully synced to the global (marketplace) WhatsApp catalog */
    catalogPendingGlobal?: number
    /** Eligible products with ≥1 catalog item on white-label */
    catalogListedProductsWhitelabel?: number
    /** Eligible products with ≥1 catalog item on global */
    catalogListedProductsGlobal?: number
    /** Distinct eligible products listed on WL or global (headline “coverage” count) */
    catalogListedProductsUnique?: number
    /** When true, UI may show catalog pending summary — catalog integration reached SYNCED */
    showCatalogPendingCard?: boolean
}

export interface InventoryItem {
    id: string
    product: string
    stock: number
    localStock: number
    storeBreakdown: Record<string, number>
    price: string
    numericPrice: number
    variantsCount: number
    availableIn: string[]
    status: string
    category: string
    image?: string
    catalogSync?: Product['catalogSync']
    catalogEligibility?: Product['catalogEligibility']
    raw: Product
}
