import { Customer } from "./data/customerMocks"

export type OrderStatus = 'COMPLETED' | 'PENDING' | 'CANCELLED' | 'REFUNDED' | 'Completed' | 'Pending' | 'Cancelled' | 'ALL'

export interface OrderItem {
    productName: string
    quantity: number
    price: number
    total: number
}

export interface Order {
    id: string
    shortCode?: string
    date: string // Formatted string from backend
    summary: string
    items: OrderItem[]
    totalAmount: number | string // Numeric from backend now, but support string for safety
    currency?: string
    customer: string // Customer name
    paymentMethod: string
    status: OrderStatus
    channel?: string
    notes?: string
    tags?: Array<{ id: string; name: string; slug: string; color?: string }>
    isAutomated?: boolean
    deposit?: {
        virtualAccountNumber: string
        bankName: string
        paymentReference: string
        amount: number
        provider: string
        status: string
        expiresAt: string
    }
    // Frontend-only or extra fields
    storeName?: string
}

export interface OrdersMeta {
    total: number
    perPage: number
    currentPage: number
    lastPage: number
    firstPage: number
}

export interface OrdersResponse {
    data: Order[]
    meta?: OrdersMeta
    summary?: {
        todayOrders: number
        todayRevenue: number
    }
}

export interface OrderFilterParams {
    status?: OrderStatus
    search?: string
    storeId?: string
    storeIds?: string[]
}
