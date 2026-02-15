import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient, ApiResponse } from "@/app/lib/api-client"
import { toast } from "sonner"
import { useBusiness } from "@/app/components/BusinessProvider"
import { ExtractedProduct } from "../components/ProductExtractionCard"

export interface BulkUploadItem {
    name: string
    description?: string
    sku?: string
    price: number
    stockQuantity?: number
    category?: number
    storeIds?: string[]
}

export interface BulkUploadPayload {
    storeIds?: string[]
    products: BulkUploadItem[]
}

export function useBulkUpload() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    /**
     * Mutation to extract products from a file
     */
    const extractMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData()
            formData.append('file', file)

            // We use raw fetch or apiClient with custom config for FormData
            // since apiClient.post defaults to JSON.stringify
            return apiClient.request<ExtractedProduct[]>('/products/bulk-extract', {
                method: 'POST',
                body: formData as any,
                // Setting Content-Type to undefined/null allows the browser to set it with the boundary
                headers: {
                    'Content-Type': undefined as any
                }
            })
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to extract products")
        }
    })

    /**
     * Mutation to confirm and upload extracted products
     */
    const uploadMutation = useMutation({
        mutationFn: async (payload: BulkUploadPayload) => {
            return apiClient.post('/products/bulk-upload', payload)
        },
        onSuccess: (data: any) => {
            toast.success(data.message || "Products uploaded successfully")
            queryClient.invalidateQueries({ queryKey: ['products', businessId] })
        },
        onError: (error: any) => {
            console.log({ error })
            toast.error(error.message || "Failed to upload products")
        }
    })

    return {
        extractProducts: extractMutation.mutateAsync,
        isExtracting: extractMutation.isPending,
        confirmUpload: uploadMutation.mutateAsync,
        isUploading: uploadMutation.isPending
    }
}
