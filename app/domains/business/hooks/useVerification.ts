import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/app/lib/api-client"
import { toast } from "sonner"
import { VerificationTypeEnum, VerificationGroupEnum } from "../data/type"

export type VerificationLevel = number
export type VerificationStatus = "pending" | "verified" | "rejected" | "unverified"
export type VerificationType = "BVN" | "GOVT_ID" | "ADDRESS" | "REGISTRATION_DOCS" | "OWNER_ADDRESS"

export interface RegistrationDocsData {
    cacCertificateUrl: string
    mermatUrl: string
    statusReportUrl: string
}

export interface VerificationData {
    bvn?: string
    address?: string
    latitude?: number
    longitude?: number
    idType?: "passport" | "drivers_license" | "nin" | "voters_card"
    idNumber?: string
    idImage?: File | string | null
    fileName?: string
    fileType?: string
    fileSize?: number
    document_uri?: string
    cacCertificateUrl?: string
    mermatUrl?: string
    statusReportUrl?: string
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
    type: VerificationTypeEnum
    data: VerificationData
}

export interface VerificationLevelConfig {
    id: string
    level: number
    name: string
    description: string
    type: VerificationTypeEnum
    icon: string
    requirements: string[]
    isRequired: boolean
    businessType: string | null
    group: VerificationGroupEnum | null
    limits: {
        dailyWithdrawalAmount: number
        weeklyWithdrawalAmount: number
        monthlyWithdrawalAmount: number
        annualWithdrawalAmount: number
    }
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
