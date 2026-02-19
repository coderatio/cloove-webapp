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

export interface ProductVariant {
    id: string
    productId: string
    name: string | null
    sku: string | null
    price: number | null
    inventories: StoreInventory[]
}

export interface Product {
    id: string
    businessId: string
    name: string
    description: string | null
    basePrice: number
    images: ProductImage[]
    variants: ProductVariant[]
    product_variants?: ProductVariant[]
    stores?: { id: string, name: string }[]
}

export interface InventoryStats {
    totalValue: number
    totalProducts: number
    totalStockUnits: number
    lowStockItems: number
    lowStockThreshold: number
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
    raw: Product
}
