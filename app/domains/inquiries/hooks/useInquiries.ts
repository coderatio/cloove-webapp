"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/app/lib/api-client"
import { useBusiness } from "@/app/components/BusinessProvider"
import { toast } from "sonner"

export type InquiryStatus = "new" | "qualifying" | "scheduled" | "won" | "lost"

export interface ConsultationInquiry {
    id: string
    topic: string
    message: string | null
    preferredContactWindow: string | null
    contactChannel: string | null
    status: InquiryStatus
    source: string
    serviceId: string | null
    serviceName: string | null
    customerId: string
    customerName: string | null
    customerPhone: string | null
    assignedToId: string | null
    metadata: Record<string, unknown> | null
    createdAt: string
    updatedAt: string | null
}

interface InquiriesResponse {
    success: boolean
    data: ConsultationInquiry[]
    meta?: { total?: number; limit?: number; offset?: number }
}

interface InquiryResponse {
    success: boolean
    data: ConsultationInquiry
    message?: string
}

export interface InquiryFilters {
    status?: InquiryStatus | "ALL"
    serviceId?: string
    limit?: number
    offset?: number
}

export function useInquiries(filters: InquiryFilters = {}) {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    const params: Record<string, string> = {}
    if (filters.status && filters.status !== "ALL") params.status = filters.status
    if (filters.serviceId) params.serviceId = filters.serviceId
    if (filters.limit) params.limit = String(filters.limit)
    if (filters.offset) params.offset = String(filters.offset)

    const query = useQuery<InquiriesResponse>({
        queryKey: ["inquiries", businessId, filters],
        queryFn: () => apiClient.get<InquiriesResponse>("/inquiries", params),
        enabled: !!businessId,
    })

    const updateMutation = useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string
            payload: { status: InquiryStatus; assignedToId?: string | null; notes?: string | null }
        }) => apiClient.patch<InquiryResponse>(`/inquiries/${id}`, payload),
        onMutate: async ({ id, payload }) => {
            await queryClient.cancelQueries({ queryKey: ["inquiries", businessId] })
            const previous = queryClient.getQueryData<InquiriesResponse>([
                "inquiries",
                businessId,
                filters,
            ])
            if (previous) {
                queryClient.setQueryData<InquiriesResponse>(
                    ["inquiries", businessId, filters],
                    {
                        ...previous,
                        data: previous.data.map((inquiry) =>
                            inquiry.id === id
                                ? { ...inquiry, status: payload.status }
                                : inquiry
                        ),
                    }
                )
            }
            return { previous }
        },
        onError: (err: { message?: string }, _vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(["inquiries", businessId, filters], context.previous)
            }
            toast.error(err.message ?? "Failed to update inquiry")
        },
        onSuccess: () => {
            toast.success("Inquiry updated")
            void queryClient.invalidateQueries({ queryKey: ["inquiries", businessId] })
        },
    })

    return {
        inquiries: query.data?.data ?? [],
        isLoading: query.isPending,
        error: query.error,
        updateInquiry: updateMutation.mutateAsync,
        isUpdating: updateMutation.isPending,
    }
}
