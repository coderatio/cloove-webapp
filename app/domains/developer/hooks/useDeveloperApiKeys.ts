"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { apiClient } from "@/app/lib/api-client"
import { useBusiness } from "@/app/components/BusinessProvider"

export const DEVELOPER_API_KEY_SCOPES = [
    "vox:read",
    "vox:calls:read",
    "vox:calls:create",
    "vox:agents:read",
    "vox:numbers:read",
    "webhooks:read",
    "webhooks:write",
] as const

export type DeveloperApiKeyScope = (typeof DEVELOPER_API_KEY_SCOPES)[number]
export type DeveloperApiKeyEnvironment = "test" | "live"
export type DeveloperApiKeyStatus = "active" | "revoked"

export interface DeveloperApiKey {
    id: string
    businessId: string
    name: string
    environment: DeveloperApiKeyEnvironment
    prefix: string
    lastFour: string
    scopes: DeveloperApiKeyScope[]
    allowedOrigins: string[]
    allowedIpRanges: string[]
    status: DeveloperApiKeyStatus
    lastUsedAt: string | null
    lastUsedIp: string | null
    lastRotatedAt: string | null
    revokedAt: string | null
    expiresAt: string | null
    createdAt: string
    updatedAt: string | null
    plaintext: string | null
}

export interface DeveloperApiKeyEvent {
    id: string
    businessId: string
    developerApiKeyId: string | null
    actorUserId: string | null
    eventType: string
    title: string
    description: string | null
    ipAddress: string | null
    metadata: Record<string, unknown> | null
    createdAt: string
}

export interface DeveloperUsageRow {
    date: string
    environment: DeveloperApiKeyEnvironment
    method: string
    endpoint: string
    statusFamily: string
    requestCount: number
    errorCount: number
    totalLatencyMs: number
}

export interface CreateDeveloperApiKeyPayload {
    name: string
    environment: DeveloperApiKeyEnvironment
    scopes: DeveloperApiKeyScope[]
    allowed_origins?: string[]
    allowed_ip_ranges?: string[]
    expires_at?: string | null
}

const keys = {
    apiKeys: (businessId?: string) => ["developer", "api-keys", businessId],
    events: (businessId?: string) => ["developer", "events", businessId],
    usage: (businessId: string | undefined, days: number) => ["developer", "usage", businessId, days],
}

export function useDeveloperApiKeys() {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useQuery({
        queryKey: keys.apiKeys(businessId),
        queryFn: () => apiClient.get<DeveloperApiKey[]>("/developer/api-keys"),
        enabled: !!businessId,
    })
}

export function useDeveloperEvents() {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useQuery({
        queryKey: keys.events(businessId),
        queryFn: () => apiClient.get<DeveloperApiKeyEvent[]>("/developer/events"),
        enabled: !!businessId,
    })
}

export function useDeveloperUsage(days = 30) {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useQuery({
        queryKey: keys.usage(businessId, days),
        queryFn: () => apiClient.get<DeveloperUsageRow[]>("/developer/usage", { days: String(days) }),
        enabled: !!businessId,
    })
}

export function useCreateDeveloperApiKey() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useMutation({
        mutationFn: (payload: CreateDeveloperApiKeyPayload) =>
            apiClient.post<DeveloperApiKey>("/developer/api-keys", payload),
        onSuccess: () => {
            toast.success("API key created")
            void queryClient.invalidateQueries({ queryKey: keys.apiKeys(businessId) })
            void queryClient.invalidateQueries({ queryKey: keys.events(businessId) })
        },
        onError: (error: { message?: string }) => toast.error(error.message ?? "Failed to create API key"),
    })
}

export function useRotateDeveloperApiKey() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useMutation({
        mutationFn: (id: string) => apiClient.post<DeveloperApiKey>(`/developer/api-keys/${id}/rotate`, {}),
        onSuccess: () => {
            toast.success("API key rotated")
            void queryClient.invalidateQueries({ queryKey: keys.apiKeys(businessId) })
            void queryClient.invalidateQueries({ queryKey: keys.events(businessId) })
        },
        onError: (error: { message?: string }) => toast.error(error.message ?? "Failed to rotate API key"),
    })
}

export function useRevokeDeveloperApiKey() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useMutation({
        mutationFn: (id: string) => apiClient.post<DeveloperApiKey>(`/developer/api-keys/${id}/revoke`, {}),
        onSuccess: () => {
            toast.success("API key revoked")
            void queryClient.invalidateQueries({ queryKey: keys.apiKeys(businessId) })
            void queryClient.invalidateQueries({ queryKey: keys.events(businessId) })
        },
        onError: (error: { message?: string }) => toast.error(error.message ?? "Failed to revoke API key"),
    })
}
