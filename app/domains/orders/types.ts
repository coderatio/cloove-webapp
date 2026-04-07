import { Customer } from "./data/customerMocks"

export type OrderStatus = 'COMPLETED' | 'PENDING' | 'CANCELLED' | 'REFUNDED' | 'ALL'

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
    subtotalAmount?: number
    discountAmount?: number
    currency?: string
    customer: string // Customer name
    amountPaid: number
    remainingAmount?: number
    paymentMethod: string
    status: OrderStatus
    channel?: string
    notes?: string
    tags?: Array<{ id: string; name: string; slug: string; color?: string }>
    /** School preset: fee posted to this academic term */
    academicTerm?: {
        id: string
        name: string
        session?: { id: string; name: string }
    }
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
        totalOrders: number
        totalRevenue: number
        averageOrderValue: number
        pendingOrdersCount: number
        completedOrdersCount: number
    }
}

export type PaymentStatus = 'PAID' | 'PARTIAL' | 'PENDING'

export interface OrderFilterParams {
    status?: string[]
    paymentStatus?: string[]
    automation?: string[]
    isAutomated?: boolean
    search?: string
    startDate?: string
    endDate?: string
    storeId?: string
    storeIds?: string[]
    customerId?: string
    academicTermId?: string
}
