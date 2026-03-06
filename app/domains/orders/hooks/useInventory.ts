"use client"

import { useQuery } from "@tanstack/react-query"
import { apiClient, ApiResponse } from "@/app/lib/api-client"
import { useBusiness } from "@/app/components/BusinessProvider"
import { useSettings } from "@/app/domains/business/hooks/useBusinessSettings"
import { initialInventory } from "../data/inventoryMocks"

export interface Product {
    id: string
    product: string
    category: string
    price: number    // numeric, never a string
    stock: number
    status: 'In Stock' | 'Out of Stock' | 'Low Stock'
    barcode?: string
    image?: string
}

/**
 * Compute total stock from the nested variants → inventories structure
 * returned by the API: variants[].inventories[].stockQuantity
 */
function computeTotalStock(item: any): number {
    if (typeof item.stock === 'number') return item.stock

    // API shape: item.variants[] → item.inventories[] → stockQuantity
    if (Array.isArray(item.variants)) {
        let total = 0
        for (const variant of item.variants) {
            if (Array.isArray(variant.inventories)) {
                for (const inv of variant.inventories) {
                    total += Number(inv.stockQuantity ?? inv.stock_quantity ?? 0)
                }
            }
        }
        return total
    }

    // Mock shape: a string like "150 units"
    if (typeof item.stock === 'string') {
        return parseInt(item.stock.replace(/[^0-9]/g, ''), 10) || 0
    }

    return 0
}

/**
 * Extract price from the first variant if available
 */
function extractVariantPrice(item: any): number {
    if (Array.isArray(item.variants) && item.variants[0]) {
        return Number(item.variants[0].price || 0)
    }
    return 0
}

/**
 * Map raw API product or mock into our normalised Product shape.
 */
function mapProduct(item: any, lowStockThreshold: number): Product {
    const stock = computeTotalStock(item)

    // Derive status from stock level using business config threshold
    let status: Product['status'] = 'In Stock'
    if (stock <= 0) status = 'Out of Stock'
    else if (stock <= lowStockThreshold) status = 'Low Stock'

    // If the API product has an explicit status field, prefer it
    if (item.status === 'Out of Stock' || item.status === 'Low Stock' || item.status === 'In Stock') {
        status = item.status
    }

    return {
        id: item.id || String(Math.random()),
        // API uses "name", mocks use "product"
        product: item.product || item.name || item.productName || 'Unknown',
        // category may be a plain string or an object { id, name, slug }
        category: typeof item.category === 'object' && item.category !== null
            ? item.category.name || 'Uncategorised'
            : item.category || item.categoryName || 'Uncategorised',
        // API uses "basePrice" (AdonisJS camelCase) or "base_price" (snake_case)
        // Fall back to variant price, then mock string format
        price: typeof item.basePrice === 'number' && item.basePrice > 0
            ? item.basePrice
            : typeof item.base_price === 'number' && item.base_price > 0
                ? item.base_price
                : typeof item.price === 'number' && item.price > 0
                    ? item.price
                    : extractVariantPrice(item)
                    || parseInt(String(item.price ?? '0').replace(/[^0-9]/g, ''), 10) || 0,
        stock,
        status,
        barcode: item.barcode,
        // API uses "images" array (prefer primary), mocks may use "image"
        image: Array.isArray(item.images)
            ? (item.images.find((img: any) => img.isPrimary)?.url || item.images[0]?.url)
            : (item.image || item.imageUrl),
    }
}

export interface UseInventoryOptions {
    search?: string
    category?: string | null
    page?: number
}

/**
 * Hook to fetch products/inventory for the POS catalog.
 * Uses business config for low_stock_threshold.
 * Implements a Hybrid Search approach:
 * - Fetches up to 500 items initially.
 * - If total <= 500, it enables `isLocalMode`, meaning the UI can filter in-memory.
 * - If total > 500, `isLocalMode` is false, meaning the UI must debounce and pass `search` here.
 * Falls back to mock data if the backend endpoint is not yet available.
 */
export function useInventory(options: UseInventoryOptions = {}) {
    const { search = '', category = null, page = 1 } = options
    const { activeBusiness } = useBusiness()
    const { data: settings } = useSettings()
    const lowStockThreshold = settings?.business?.configs?.low_stock_threshold ?? 5

    const { data, isLoading, error } = useQuery({
        queryKey: ['inventory', activeBusiness?.id, lowStockThreshold, search, category, page],
        queryFn: async () => {
            try {
                const params: Record<string, string> = {
                    page: String(page),
                    limit: '500', // Fetch up to 500 for local mode
                }

                if (search) params.search = search
                if (category) params.category = category // Assuming backend supports this, or we fallback to local filtering if the DB is small

                const response = await apiClient.get<any>('/products', params, { fullResponse: true })

                // fullResponse: true means we get { success, data, meta }
                const raw = Array.isArray(response?.data) ? response.data : []
                const mappedProducts = raw.map((item: any) => mapProduct(item, lowStockThreshold)).filter((p: Product) => p.product !== 'Unknown')

                const meta = response?.meta || {}
                const total = meta.total || mappedProducts.length

                return {
                    products: mappedProducts,
                    total,
                    isLocalMode: total <= 500
                }
            } catch {
                // Gracefully fall back to mock data if endpoint not available
                const mockProducts = initialInventory.map((item: any) => mapProduct(item, lowStockThreshold))
                return {
                    products: mockProducts,
                    total: mockProducts.length,
                    isLocalMode: true
                }
            }
        },
        enabled: !!activeBusiness?.id,
        staleTime: 60_000, // 1 minute
    })

    return {
        products: data?.products ?? initialInventory.map((item: any) => mapProduct(item, lowStockThreshold)),
        totalProducts: data?.total ?? 0,
        isLocalMode: data?.isLocalMode ?? true,
        isLoadingProducts: isLoading,
        productError: error,
    }
}
