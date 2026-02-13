import { useMutation } from "@tanstack/react-query"
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
    return useMutation({
        mutationFn: (payload: ChangePasswordPayload) =>
            apiClient.patch("/security/password", payload),
        onSuccess: (data: any) => {
            toast.success(data.message || "Password updated successfully")
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to update password")
        },
    })
}

export const useChangePin = () => {
    return useMutation({
        mutationFn: (payload: ChangePinPayload) =>
            apiClient.patch("/security/pin", payload),
        onSuccess: (data: any) => {
            toast.success(data.message || "PIN updated successfully")
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to update PIN")
        },
    })
}
