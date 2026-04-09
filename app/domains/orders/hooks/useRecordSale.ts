"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/app/lib/api-client"
import { useBusiness } from "@/app/components/BusinessProvider"
import { toast } from "sonner"

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
    /** School preset: omit to use workspace default; null = no term */
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

/**
 * Hook to record a new sale via the API.
 * Follows the same pattern as useOrders.ts (apiClient + React Query).
 */
export function useRecordSale() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()

    const mutation = useMutation({
        mutationFn: (payload: RecordSalePayload) =>
            apiClient.post<RecordedSale>('/sales', payload),
        onSuccess: () => {
            // Invalidate sales list so OrdersView refreshes
            queryClient.invalidateQueries({ queryKey: ['sales', activeBusiness?.id] })
        },
        onError: (error: any) => {
            const message = error?.message || 'Failed to record sale'
            toast.error(message)
        },
    })

    return {
        recordSale: mutation.mutateAsync,
        isRecording: mutation.isPending,
        recordError: mutation.error,
        reset: mutation.reset,
    }
}
