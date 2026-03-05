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
    }
}

/**
 * Hook to fetch products/inventory for the POS catalog.
 * Uses business config for low_stock_threshold.
 * Falls back to mock data if the backend endpoint is not yet available.
 */
export function useInventory() {
    const { activeBusiness } = useBusiness()
    const { data: settings } = useSettings()
    const lowStockThreshold = settings?.business?.configs?.low_stock_threshold ?? 5

    const { data, isLoading, error } = useQuery<Product[]>({
        queryKey: ['inventory', activeBusiness?.id, lowStockThreshold],
        queryFn: async () => {
            try {
                const response = await apiClient.get<any>('/products', {
                    page: '1',
                    limit: '200',
                }, { fullResponse: true })

                // fullResponse: true means we get { success, data, meta }
                const raw = Array.isArray(response?.data) ? response.data : []
                return raw.map((item: any) => mapProduct(item, lowStockThreshold)).filter((p: Product) => p.product !== 'Unknown')
            } catch {
                // Gracefully fall back to mock data if endpoint not available
                return initialInventory.map((item: any) => mapProduct(item, lowStockThreshold))
            }
        },
        enabled: !!activeBusiness?.id,
        staleTime: 60_000, // 1 minute
    })

    return {
        products: data ?? initialInventory.map((item: any) => mapProduct(item, lowStockThreshold)),
        isLoadingProducts: isLoading,
        productError: error,
    }
}
