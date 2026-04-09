import { apiClient } from "@/app/lib/api-client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useBusiness } from "@/app/components/BusinessProvider"

export interface Department {
    id: string
    name: string
    description: string | null
    memberCount: number
    createdAt: string
}

export interface DepartmentMember {
    id: string
    memberableType: 'BusinessUser' | 'Customer'
    memberableId: string
    createdAt: string
}

export function useDepartments() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    const { data: departments, isLoading } = useQuery<Department[]>({
        queryKey: ['departments', businessId],
        queryFn: () => apiClient.get<Department[]>('/departments'),
        enabled: !!businessId,
    })

    const createMutation = useMutation({
        mutationFn: (data: { name: string; description?: string }) =>
            apiClient.post<Department>('/departments', data),
        onSuccess: () => {
            toast.success('Department created')
            queryClient.invalidateQueries({ queryKey: ['departments', businessId] })
        },
        onError: (error: any) => toast.error(error.message || 'Failed to create department'),
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string | null } }) =>
            apiClient.patch<Department>(`/departments/${id}`, data),
        onSuccess: () => {
            toast.success('Department updated')
            queryClient.invalidateQueries({ queryKey: ['departments', businessId] })
        },
        onError: (error: any) => toast.error(error.message || 'Failed to update department'),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiClient.delete(`/departments/${id}`),
        onSuccess: () => {
            toast.success('Department deleted')
            queryClient.invalidateQueries({ queryKey: ['departments', businessId] })
        },
        onError: (error: any) => toast.error(error.message || 'Failed to delete department'),
    })

    const addMembersMutation = useMutation({
        mutationFn: ({
            departmentId,
            members,
        }: {
            departmentId: string
            members: Array<{ memberableType: 'BusinessUser' | 'Customer'; memberableId: string }>
        }) => apiClient.post(`/departments/${departmentId}/members`, { members }),
        onSuccess: (_data, vars) => {
            toast.success('Member(s) added')
            queryClient.invalidateQueries({ queryKey: ['departments', businessId] })
            queryClient.invalidateQueries({ queryKey: ['department-members', vars.departmentId] })
        },
        onError: (error: any) => toast.error(error.message || 'Failed to add members'),
    })

    const removeMembersMutation = useMutation({
        mutationFn: ({
            departmentId,
            members,
        }: {
            departmentId: string
            members: Array<{ memberableType: 'BusinessUser' | 'Customer'; memberableId: string }>
        }) => apiClient.request(`/departments/${departmentId}/members`, { method: 'DELETE', body: JSON.stringify({ members }) }),
        onSuccess: (_data, vars) => {
            toast.success('Member(s) removed')
            queryClient.invalidateQueries({ queryKey: ['departments', businessId] })
            queryClient.invalidateQueries({ queryKey: ['department-members', vars.departmentId] })
        },
        onError: (error: any) => toast.error(error.message || 'Failed to remove members'),
    })

    return {
        departments: departments ?? [],
        isLoading,
        createDepartment: createMutation.mutateAsync,
        updateDepartment: (id: string, data: { name?: string; description?: string | null }) =>
            updateMutation.mutateAsync({ id, data }),
        deleteDepartment: deleteMutation.mutateAsync,
        addMembers: addMembersMutation.mutateAsync,
        removeMembers: removeMembersMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    }
}

export function useDepartmentMembers(departmentId: string | null) {
    return useQuery<DepartmentMember[]>({
        queryKey: ['department-members', departmentId],
        queryFn: () => apiClient.get<DepartmentMember[]>(`/departments/${departmentId}/members`),
        enabled: !!departmentId,
    })
}
