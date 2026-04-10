import { apiClient } from "@/app/lib/api-client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useBusiness } from "@/app/components/BusinessProvider"

export interface FeeTemplateItem {
    id: string
    feeTemplateId: string
    name: string
    amount: number
    isOptional: boolean
    sortOrder: number
}

export interface FeeTemplate {
    id: string
    businessId: string
    name: string
    description: string | null
    academicTermId: string | null
    scope: 'ALL' | 'DEPARTMENT'
    departmentId: string | null
    dueAt: string | null
    status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
    appliedAt: string | null
    createdAt: string
    items: FeeTemplateItem[]
    academicTerm?: { id: string; name: string } | null
    department?: { id: string; name: string } | null
}

export interface FeeTemplateStatusData {
    templateId: string
    totalStudents: number
    paid: number
    partial: number
    unpaid: number
    totalBilled: number
    totalCollected: number
}

export interface ApplyResult {
    applied: number
    skipped: number
    failed: number
    errors: Array<{ customerId: string; message: string }>
}

export interface FeeTemplateItemInput {
    name: string
    amount: number
    isOptional?: boolean
    sortOrder?: number
}

export interface StoreFeeTemplateInput {
    name: string
    description?: string
    academicTermId?: string | null
    scope?: 'ALL' | 'DEPARTMENT'
    departmentId?: string | null
    dueAt?: string | null
    items: FeeTemplateItemInput[]
}

export function useFeeTemplates() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    const { data: templates, isLoading } = useQuery<FeeTemplate[]>({
        queryKey: ['fee-templates', businessId],
        queryFn: () => apiClient.get<FeeTemplate[]>('/fee-templates'),
        enabled: !!businessId,
    })

    const createMutation = useMutation({
        mutationFn: (data: StoreFeeTemplateInput) =>
            apiClient.post<FeeTemplate>('/fee-templates', data),
        onSuccess: () => {
            toast.success('Fee template created')
            queryClient.invalidateQueries({ queryKey: ['fee-templates', businessId] })
        },
        onError: (error: any) => toast.error(error.message || 'Failed to create template'),
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<StoreFeeTemplateInput> }) =>
            apiClient.patch<FeeTemplate>(`/fee-templates/${id}`, data),
        onSuccess: () => {
            toast.success('Fee template updated')
            queryClient.invalidateQueries({ queryKey: ['fee-templates', businessId] })
        },
        onError: (error: any) => toast.error(error.message || 'Failed to update template'),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiClient.delete(`/fee-templates/${id}`),
        onSuccess: () => {
            toast.success('Fee template deleted')
            queryClient.invalidateQueries({ queryKey: ['fee-templates', businessId] })
        },
        onError: (error: any) => toast.error(error.message || 'Failed to delete template'),
    })

    const applyMutation = useMutation({
        mutationFn: (id: string) =>
            apiClient.post<ApplyResult>(`/fee-templates/${id}/apply`, {}),
        onSuccess: (data, id) => {
            queryClient.invalidateQueries({ queryKey: ['fee-templates', businessId] })
            queryClient.invalidateQueries({ queryKey: ['fee-template-status', id] })
            queryClient.invalidateQueries({ queryKey: ['orders'] })
        },
        onError: (error: any) => toast.error(error.message || 'Failed to apply template'),
    })

    const archiveMutation = useMutation({
        mutationFn: (id: string) => apiClient.post(`/fee-templates/${id}/archive`, {}),
        onSuccess: () => {
            toast.success('Template archived')
            queryClient.invalidateQueries({ queryKey: ['fee-templates', businessId] })
        },
        onError: (error: any) => toast.error(error.message || 'Failed to archive template'),
    })

    return {
        templates: templates ?? [],
        isLoading,
        createTemplate: createMutation.mutateAsync,
        updateTemplate: (id: string, data: Partial<StoreFeeTemplateInput>) =>
            updateMutation.mutateAsync({ id, data }),
        deleteTemplate: deleteMutation.mutateAsync,
        applyTemplate: applyMutation.mutateAsync,
        archiveTemplate: archiveMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isApplying: applyMutation.isPending,
        applyingId: applyMutation.isPending ? applyMutation.variables : null,
    }
}

export function useFeeTemplateStatus(templateId: string | null) {
    return useQuery<FeeTemplateStatusData>({
        queryKey: ['fee-template-status', templateId],
        queryFn: () => apiClient.get<FeeTemplateStatusData>(`/fee-templates/${templateId}/status`),
        enabled: !!templateId,
    })
}
