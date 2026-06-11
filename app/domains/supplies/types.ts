export interface SupplyInventory {
    id: string
    storeId: string
    supplyId: string
    stockQuantity: number
    store?: { id: string; name: string }
}

export interface SupplyCategoryRef {
    id: string
    name: string
    slug: string
}

export interface Supply {
    id: string
    businessId: string
    name: string
    categoryId?: string | null
    category?: SupplyCategoryRef | null
    unit?: string | null
    costPrice?: number | null
    reorderLevel?: number | null
    notes?: string | null
    images?: string[] | null
    inventories: SupplyInventory[]
    createdAt?: string
    updatedAt?: string | null
}

export interface SupplyStats {
    totalValue: number
    totalSupplies: number
    totalStockUnits: number
    lowStockItems: number
    lowStockThreshold: number
}

export interface CreateSupplyPayload {
    name: string
    categoryId?: string
    unit?: string
    costPrice?: number
    reorderLevel?: number
    notes?: string
    imageUrls?: string[]
    storeInventory?: { storeId: string; stockQuantity: number }[]
}

export type AdjustStockMode = "RELATIVE" | "ABSOLUTE"

export interface AdjustStockPayload {
    id: string
    storeId: string
    adjustment: number
    mode: AdjustStockMode
}
