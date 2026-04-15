export interface RecordSaleItem {
    productId?: string
    productName: string
    quantity: number
    customPrice?: number
    lineType?: "PRODUCT" | "FEE"
}

export interface RecordSalePayload {
    items: RecordSaleItem[]
    paymentMethod: string
    amountPaid?: number
    discountAmount?: number
    promotionId?: string
    customerId?: string
    customerName?: string
    tags?: string[]
    serviceMode?: "DINE_IN" | "TAKEAWAY"
    tableLabel?: string
    covers?: number
    kitchenStation?: string
    kitchenTicketInitialStatus?: string
    sendToKitchen?: boolean
    notes?: string
    channel?: string
    academicTermId?: string | null
}

export interface RecordedSale {
    saleId: string
    shortCode: string
    totalAmount: number
    amountPaid: number
    remainingAmount: number
    paymentMethod: string
    status: string
    date: string
    customer?: string
    items: Array<{
        productName: string
        quantity: number
        price: number
        total: number
    }>
}

export type RecordSaleResult = RecordedSale & {
    offlineQueued?: boolean
    idempotencyKey?: string
}
