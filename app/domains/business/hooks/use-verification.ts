import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/app/lib/api-client"
import { toast } from "sonner"

export type VerificationLevel = 1 | 2 | 3
export type VerificationStatus = "pending" | "verified" | "rejected" | "unverified"
export type VerificationType = "BVN" | "GOVT_ID" | "ADDRESS"

export interface VerificationData {
    bvn?: string
    address?: string
    idType?: "passport" | "drivers_license" | "nin" | "voters_card"
    idNumber?: string
}

export interface VerificationResponse {
    verifications: Array<{
        type: VerificationType
        status: string
        level: VerificationLevel
        // Add other fields if needed
    }>
}

export interface SubmitVerificationPayload {
    level: VerificationLevel
    type: VerificationType
    data: VerificationData
}

export const useVerifications = () => {
    return useQuery({
        queryKey: ["verifications"],
        queryFn: () => apiClient.get<VerificationResponse>("/api/verification"),
    })
}

export const useSubmitVerification = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload: SubmitVerificationPayload) =>
            apiClient.post("/api/verification", payload),
        onSuccess: (data: any) => {
            toast.success(data.message || "Verification submitted successfully")
            // Invalidate and refetch verification data
            queryClient.invalidateQueries({ queryKey: ["verifications"] })
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to submit verification")
        },
    })
}
