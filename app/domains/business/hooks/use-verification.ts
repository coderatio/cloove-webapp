import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/app/lib/api-client"
import { toast } from "sonner"

export type VerificationLevel = number
export type VerificationStatus = "pending" | "verified" | "rejected" | "unverified"
export type VerificationType = "BVN" | "GOVT_ID" | "ADDRESS"

export interface VerificationData {
    bvn?: string
    address?: string
    idType?: "passport" | "drivers_license" | "nin" | "voters_card"
    idNumber?: string
}

export interface VerificationResponse {
    currentLevelId: string | null
    verifications: Array<{
        id: string
        status: string
        levelId: number
        verifiedAt: string | null
        createdAt: string
        logs: Array<{
            id: string
            status: string
            rejectionReason: string | null
            createdAt: string
        }>
    }>
}

export interface SubmitVerificationPayload {
    levelId: number
    type: VerificationType
    data: VerificationData
}

export interface VerificationLevelConfig {
    id: string
    level: number
    name: string
    description: string
    type: VerificationType
    icon: string
    requirements: string[] // Assuming backend sends array of strings
}

export const useVerifications = () => {
    return useQuery({
        queryKey: ["verifications"],
        queryFn: () => apiClient.get<VerificationResponse>("/verification"),
    })
}

export const useVerificationLevels = () => {
    return useQuery({
        queryKey: ["verification-levels"],
        queryFn: () => apiClient.get<VerificationLevelConfig[]>("/verification/levels"),
    })
}

export const useSubmitVerification = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload: SubmitVerificationPayload) =>
            apiClient.post("/verification", payload),
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
