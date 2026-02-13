import { apiClient } from "@/app/lib/api-client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useBusiness } from "@/app/components/BusinessProvider"
import type { Role } from "../data/staffMocks"

export interface StaffMember {
    id: string
    businessId: string
    userId: string
    role: Role
    status: 'ACTIVE' | 'PENDING'
    permissions: Record<string, boolean> | null
    createdAt: string
    updatedAt: string
    user: {
        id: string
        fullName: string
        phoneNumber: string
        email: string | null
    }
}

export function useStaff() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    const { data: staff, error, isLoading } = useQuery<StaffMember[]>({
        queryKey: ['staff', businessId],
        queryFn: () => apiClient.get<StaffMember[]>('/staff'),
        enabled: !!businessId
    })

    const inviteStaffMutation = useMutation({
        mutationFn: (data: { fullName: string; phoneNumber: string; role: Role; permissions?: Record<string, boolean> }) =>
            apiClient.post('/staff', data),
        onSuccess: () => {
            toast.success("Staff invitation sent successfully")
            queryClient.invalidateQueries({ queryKey: ['staff', businessId] })
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to invite staff")
        }
    })

    const updateStaffMutation = useMutation({
        mutationFn: ({ userId, data }: { userId: string; data: { role: Role; permissions?: Record<string, boolean> } }) =>
            apiClient.patch(`/staff/${userId}`, data),
        onSuccess: () => {
            toast.success("Staff member updated successfully")
            queryClient.invalidateQueries({ queryKey: ['staff', businessId] })
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to update staff")
        }
    })

    const removeStaffMutation = useMutation({
        mutationFn: (userId: string) => apiClient.delete(`/staff/${userId}`),
        onSuccess: () => {
            toast.success("Staff member removed successfully")
            queryClient.invalidateQueries({ queryKey: ['staff', businessId] })
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to remove staff")
        }
    })

    return {
        staff,
        isLoading,
        error,
        inviteStaff: inviteStaffMutation.mutateAsync,
        updateStaff: (userId: string, data: any) => updateStaffMutation.mutateAsync({ userId, data }),
        removeStaff: removeStaffMutation.mutateAsync
    }
}
