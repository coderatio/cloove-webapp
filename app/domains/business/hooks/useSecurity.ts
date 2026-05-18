import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/app/lib/api-client"
import { toast } from "sonner"

export interface ChangePasswordPayload {
    currentPassword: string
    newPassword: string
}

export interface ChangePinPayload {
    currentPin?: string
    newPin: string
}

export const useChangePassword = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload: ChangePasswordPayload) =>
            apiClient.patch("/security/password", payload),
        onSuccess: () => {
            toast.success("Password updated successfully")
            queryClient.invalidateQueries({ queryKey: ["security-status"] })
            queryClient.invalidateQueries({ queryKey: ["security-activity"] })
        },
        onError: (error: unknown) => {
            const message = error instanceof Error ? error.message : "Failed to update password"
            toast.error(message)
        },
    })
}

export const useChangePin = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload: ChangePinPayload) =>
            apiClient.patch("/security/pin", payload),
        onSuccess: () => {
            toast.success("PIN updated successfully")
            queryClient.invalidateQueries({ queryKey: ["security-status"] })
            queryClient.invalidateQueries({ queryKey: ["security-activity"] })
        },
        onError: (error: unknown) => {
            const message = error instanceof Error ? error.message : "Failed to update PIN"
            toast.error(message)
        },
    })
}

export interface SecurityStatus {
    lastPasswordChange: string | null
    lastPinChange: string | null
}

export const useSecurityStatus = () => {
    return useQuery({
        queryKey: ["security-status"],
        queryFn: () => apiClient.get<SecurityStatus>("/security/status"),
    });
};

export interface SecurityActivityItem {
    id: string
    event: string
    description: string | null
    ipAddress: string | null
    userAgent: string | null
    createdAt: string
}

export interface SecurityActivityResponse {
    currentSession: {
        ipAddress: string | null
        userAgent: string | null
        lastSeenAt: string
    }
    activity: SecurityActivityItem[]
}

export const useSecurityActivity = (limit: number = 12) => {
    return useQuery({
        queryKey: ["security-activity", limit],
        queryFn: () =>
            apiClient.get<SecurityActivityResponse>("/security/activity", {
                limit: String(limit),
            }),
    })
}
