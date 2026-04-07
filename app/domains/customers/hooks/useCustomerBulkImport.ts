"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/app/lib/api-client"
import { useBusiness } from "@/app/components/BusinessProvider"
import { toast } from "sonner"

export interface CustomerBulkImportResult {
    total: number
    created: number
    skipped: number
    failed: number
    errors: Array<{ row: number; name: string; error: string }>
}

export function useCustomerBulkImport() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData()
            formData.append("file", file)
            return apiClient.request<CustomerBulkImportResult>("/customers/bulk-import", {
                method: "POST",
                body: formData,
            })
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["customers", businessId] })
            void queryClient.invalidateQueries({ queryKey: ["settings"] })
        },
        onError: (err: Error) => {
            toast.error(err.message || "Import failed")
        },
    })
}
