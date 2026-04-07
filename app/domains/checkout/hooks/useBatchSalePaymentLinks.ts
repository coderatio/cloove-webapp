"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/app/lib/api-client"
import { toast } from "sonner"

export interface BatchSaleLinkResult {
    saleId: string
    reference: string | null
    ok: boolean
    error?: string
}

export function useBatchSalePaymentLinks() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (saleIds: string[]) => {
            const res = await apiClient.request<{ results: BatchSaleLinkResult[] }>("/payment-links/batch-sales", {
                method: "POST",
                body: JSON.stringify({ saleIds }),
            })
            return res.results
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["payment-links"] })
        },
        onError: (err: Error) => {
            toast.error(err.message || "Batch links failed")
        },
    })
}
