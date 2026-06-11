"use client"

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { apiClient } from "@/app/lib/api-client"
import { useBusiness } from "@/app/components/BusinessProvider"

// Keep in sync with api/app/domains/developer/scopes.ts (also served at
// GET /api/developer/scopes). Reference scopes by their DeveloperScope member.
export enum DeveloperScope {
    VOX_READ = "vox:read",
    VOX_CALLS_READ = "vox:calls:read",
    VOX_CALLS_CREATE = "vox:calls:create",
    VOX_AGENTS_READ = "vox:agents:read",
    VOX_NUMBERS_READ = "vox:numbers:read",
    MESSAGING_READ = "messaging:read",
    MESSAGING_CONVERSATIONS_READ = "messaging:conversations:read",
    MESSAGING_MESSAGES_READ = "messaging:messages:read",
    MESSAGING_MESSAGES_SEND = "messaging:messages:send",
    CONTACTS_READ = "contacts:read",
    CONTACTS_WRITE = "contacts:write",
    PRODUCTS_READ = "products:read",
    PRODUCTS_WRITE = "products:write",
    ORDERS_READ = "orders:read",
    ORDERS_WRITE = "orders:write",
    WALLET_READ = "wallet:read",
    PAYOUTS_READ = "payouts:read",
    PAYOUTS_WRITE = "payouts:write",
    WALLET_WITHDRAWALS_READ = "wallet:withdrawals:read",
    WALLET_WITHDRAWALS_CREATE = "wallet:withdrawals:create",
    HOTEL_READ = "hotel:read",
    HOTEL_ROOMS_READ = "hotel:rooms:read",
    HOTEL_ROOMS_WRITE = "hotel:rooms:write",
    HOTEL_RESERVATIONS_READ = "hotel:reservations:read",
    HOTEL_RESERVATIONS_WRITE = "hotel:reservations:write",
    WEBHOOKS_READ = "webhooks:read",
    WEBHOOKS_WRITE = "webhooks:write",
}

export type DeveloperApiKeyScope = `${DeveloperScope}`
export const DEVELOPER_API_KEY_SCOPES: DeveloperApiKeyScope[] = Object.values(DeveloperScope)

export interface DeveloperApiKeyWithdrawalPolicy {
    maxPerTransaction: number
    maxPerDay: number
    currency: string
    allowedPayoutAccountIds: string[]
}
export type DeveloperApiKeyEnvironment = "test" | "live"
export type DeveloperApiKeyStatus = "active" | "revoked"

export interface DeveloperApp {
    id: string
    businessId: string
    name: string
    environment: DeveloperApiKeyEnvironment
    status: "active" | "disabled"
    isDefault: boolean
    createdAt: string
    updatedAt: string | null
}

export interface DeveloperApiKey {
    id: string
    businessId: string
    developerAppId: string | null
    name: string
    environment: DeveloperApiKeyEnvironment
    publicId: string
    publicKey: string
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
    withdrawalPolicy: DeveloperApiKeyWithdrawalPolicy | null
    createdAt: string
    updatedAt: string | null
    plaintext: string | null
    plaintextAvailable?: boolean
}

export interface DeveloperApiKeyEvent {
    id: string
    businessId: string
    developerApiKeyId: string | null
    actorUserId: string | null
    actorName: string | null
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

// Keep in sync with api/app/domains/developer/webhook_events.ts (also served at
// GET /api/developer/webhook-events). Reference events by their WebhookEvent member.
export enum WebhookEvent {
    VOX_CALL_STARTED = "vox.call.started",
    VOX_CALL_COMPLETED = "vox.call.completed",
    VOX_CALL_FAILED = "vox.call.failed",
    VOX_RECORDING_READY = "vox.recording.ready",
    VOX_AGENT_UPDATED = "vox.agent.updated",
    MESSAGING_MESSAGE_RECEIVED = "messaging.message.received",
    MESSAGING_MESSAGE_SENT = "messaging.message.sent",
    MESSAGING_MESSAGE_DELIVERY_UPDATED = "messaging.message.delivery_updated",
    MESSAGING_CONVERSATION_ASSIGNED = "messaging.conversation.assigned",
    ORDER_CREATED = "order.created",
    ORDER_UPDATED = "order.updated",
    ORDER_CANCELLED = "order.cancelled",
    ORDER_REFUNDED = "order.refunded",
    PRODUCT_CREATED = "product.created",
    PRODUCT_UPDATED = "product.updated",
    INVENTORY_LOW_STOCK = "inventory.low_stock",
    INVENTORY_OUT_OF_STOCK = "inventory.out_of_stock",
    CONTACT_CREATED = "contact.created",
    CONTACT_UPDATED = "contact.updated",
    PAYMENT_RECEIVED = "payment.received",
    WALLET_WITHDRAWAL_REQUESTED = "wallet.withdrawal.requested",
    WALLET_WITHDRAWAL_COMPLETED = "wallet.withdrawal.completed",
    WALLET_WITHDRAWAL_FAILED = "wallet.withdrawal.failed",
    WALLET_DEPOSIT = "wallet.deposit",
    HOTEL_RESERVATION_CREATED = "hotel.reservation.created",
    HOTEL_RESERVATION_CHECKED_IN = "hotel.reservation.checked_in",
    HOTEL_RESERVATION_CHECKED_OUT = "hotel.reservation.checked_out",
    HOTEL_RESERVATION_CANCELLED = "hotel.reservation.cancelled",
    HOTEL_SERVICE_REQUEST_CREATED = "hotel.service_request.created",
}

export type DeveloperWebhookEvent = `${WebhookEvent}`
export const DEVELOPER_WEBHOOK_EVENTS: DeveloperWebhookEvent[] = Object.values(WebhookEvent)
export type DeveloperWebhookEndpointStatus = "active" | "disabled"

export interface DeveloperWebhookEndpoint {
    id: string
    businessId: string
    developerAppId: string | null
    name: string
    url: string
    environment: DeveloperApiKeyEnvironment
    events: DeveloperWebhookEvent[]
    status: DeveloperWebhookEndpointStatus
    lastDeliveryStatus: string | null
    failureCount: number
    lastDeliveredAt: string | null
    disabledAt: string | null
    createdAt: string
    updatedAt: string | null
}

export interface DeveloperWebhookSetting {
    id: string
    businessId: string
    developerAppId: string | null
    environment: DeveloperApiKeyEnvironment
    signingSecretPrefix: string
    signingSecret: string | null
    plaintextAvailable?: boolean
    lastRotatedAt: string | null
    createdAt: string
    updatedAt: string | null
}

export interface DeveloperWebhookDelivery {
    id: string
    businessId: string
    developerAppId: string | null
    webhookEndpointId: string | null
    environment: DeveloperApiKeyEnvironment
    eventType: DeveloperWebhookEvent
    status: "pending" | "delivered" | "failed"
    url: string
    attempts: number
    responseStatus: number | null
    latencyMs: number | null
    errorMessage: string | null
    payloadPreview: Record<string, unknown> | null
    deliveredAt: string | null
    createdAt: string
    updatedAt: string | null
}

export interface CreateDeveloperWebhookEndpointPayload {
    name: string
    developer_app_id?: string | null
    url: string
    environment: DeveloperApiKeyEnvironment
    events: DeveloperWebhookEvent[]
}

export interface CreateDeveloperApiKeyPayload {
    name: string
    developer_app_id?: string | null
    environment: DeveloperApiKeyEnvironment
    scopes: DeveloperApiKeyScope[]
    allowed_origins?: string[]
    allowed_ip_ranges?: string[]
    expires_at?: string | null
}

const keys = {
    apps: (businessId?: string) => ["developer", "apps", businessId],
    apiKeys: (businessId?: string, appId?: string | null) => ["developer", "api-keys", businessId, appId],
    webhookEndpoints: (businessId?: string, appId?: string | null) => ["developer", "webhook-endpoints", businessId, appId],
    webhookSettings: (businessId?: string, appId?: string | null) => ["developer", "webhook-settings", businessId, appId],
    webhookDeliveries: (businessId?: string, appId?: string | null) => ["developer", "webhook-deliveries", businessId, appId],
    events: (businessId?: string) => ["developer", "events", businessId],
    usage: (businessId: string | undefined, days: number) => ["developer", "usage", businessId, days],
}

export function useDeveloperApps() {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useQuery({
        queryKey: keys.apps(businessId),
        queryFn: () => apiClient.get<DeveloperApp[]>("/developer/apps"),
        enabled: !!businessId,
    })
}

export function useCreateDeveloperApp() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useMutation({
        mutationFn: (payload: { name: string; environment: DeveloperApiKeyEnvironment }) =>
            apiClient.post<DeveloperApp>("/developer/apps", payload),
        onSuccess: () => {
            toast.success("Developer app created")
            void queryClient.invalidateQueries({ queryKey: keys.apps(businessId) })
        },
        onError: (error: { message?: string }) => toast.error(error.message ?? "Failed to create developer app"),
    })
}

export function useDeveloperWebhookSettings(appId?: string | null) {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useQuery({
        queryKey: keys.webhookSettings(businessId, appId),
        queryFn: () => apiClient.get<DeveloperWebhookSetting[]>("/developer/webhook-settings", appId ? { developer_app_id: appId } : undefined),
        enabled: !!businessId,
    })
}

export function useDeveloperWebhookDeliveries(appId?: string | null) {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useQuery({
        queryKey: keys.webhookDeliveries(businessId, appId),
        queryFn: () => apiClient.get<DeveloperWebhookDelivery[]>("/developer/webhook-deliveries", appId ? { developer_app_id: appId } : undefined),
        enabled: !!businessId,
    })
}

export function useRotateDeveloperWebhookSecret(appId?: string | null) {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useMutation({
        mutationFn: (environment: DeveloperApiKeyEnvironment) =>
            apiClient.post<DeveloperWebhookSetting>(`/developer/webhook-settings/${environment}/rotate-secret`, appId ? { developer_app_id: appId } : {}),
        onSuccess: () => {
            toast.success("Webhook signing secret rotated")
            void queryClient.invalidateQueries({ queryKey: keys.webhookSettings(businessId, appId) })
            void queryClient.invalidateQueries({ queryKey: keys.events(businessId) })
        },
        onError: (error: { message?: string }) => toast.error(error.message ?? "Failed to rotate webhook secret"),
    })
}

export function useViewDeveloperWebhookSecret(appId?: string | null) {
    return useMutation({
        mutationFn: (environment: DeveloperApiKeyEnvironment) =>
            apiClient.post<{ signingSecret: string | null }>(
                `/developer/webhook-settings/${environment}/view-secret`,
                appId ? { developer_app_id: appId } : {}
            ),
        onError: (error: { message?: string }) => toast.error(error.message ?? "Failed to view webhook secret"),
    })
}

export function useResendDeveloperWebhookDelivery(appId?: string | null) {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useMutation({
        mutationFn: (id: string) =>
            apiClient.post<DeveloperWebhookDelivery>(`/developer/webhook-deliveries/${id}/resend`, {}),
        onSuccess: () => {
            toast.success("Webhook resend queued")
            void queryClient.invalidateQueries({ queryKey: keys.webhookDeliveries(businessId, appId) })
            void queryClient.invalidateQueries({ queryKey: keys.events(businessId) })
        },
        onError: (error: { message?: string }) => toast.error(error.message ?? "Failed to resend webhook"),
    })
}

export function useDeveloperWebhookEndpoints(appId?: string | null) {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useQuery({
        queryKey: keys.webhookEndpoints(businessId, appId),
        queryFn: () => apiClient.get<DeveloperWebhookEndpoint[]>("/developer/webhook-endpoints", appId ? { developer_app_id: appId } : undefined),
        enabled: !!businessId,
    })
}

export function useCreateDeveloperWebhookEndpoint(appId?: string | null) {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useMutation({
        mutationFn: (payload: CreateDeveloperWebhookEndpointPayload) =>
            apiClient.post<DeveloperWebhookEndpoint>("/developer/webhook-endpoints", payload),
        onSuccess: () => {
            toast.success("Webhook endpoint created")
            void queryClient.invalidateQueries({ queryKey: keys.webhookEndpoints(businessId, appId) })
            void queryClient.invalidateQueries({ queryKey: keys.events(businessId) })
        },
        onError: (error: { message?: string }) => toast.error(error.message ?? "Failed to create webhook endpoint"),
    })
}

export function useUpdateDeveloperWebhookEndpoint() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useMutation({
        mutationFn: ({ id, ...payload }: { id: string; name: string; url: string; events: DeveloperWebhookEvent[] }) =>
            apiClient.patch<DeveloperWebhookEndpoint>(`/developer/webhook-endpoints/${id}`, payload),
        onSuccess: () => {
            toast.success("Webhook endpoint updated")
            void queryClient.invalidateQueries({ queryKey: keys.webhookEndpoints(businessId) })
            void queryClient.invalidateQueries({ queryKey: keys.events(businessId) })
        },
        onError: (error: { message?: string }) => toast.error(error.message ?? "Failed to update webhook endpoint"),
    })
}

export function useDisableDeveloperWebhookEndpoint() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useMutation({
        mutationFn: (id: string) => apiClient.post<DeveloperWebhookEndpoint>(`/developer/webhook-endpoints/${id}/disable`, {}),
        onSuccess: () => {
            toast.success("Webhook endpoint disabled")
            void queryClient.invalidateQueries({ queryKey: keys.webhookEndpoints(businessId) })
            void queryClient.invalidateQueries({ queryKey: keys.events(businessId) })
        },
        onError: (error: { message?: string }) => toast.error(error.message ?? "Failed to disable webhook endpoint"),
    })
}

export function useDeveloperApiKeys(appId?: string | null) {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useQuery({
        queryKey: keys.apiKeys(businessId, appId),
        queryFn: () => apiClient.get<DeveloperApiKey[]>("/developer/api-keys", appId ? { developer_app_id: appId } : undefined),
        enabled: !!businessId,
    })
}

type EventsPageMeta = {
    total: number
    page: number
    perPage: number
    totalPages: number
    hasMore: boolean
}

export function useDeveloperEvents(filters?: {
    eventType?: string
    startDate?: string
    endDate?: string
}) {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useInfiniteQuery({
        queryKey: [...keys.events(businessId), filters],
        queryFn: async ({ pageParam }) => {
            const raw = await apiClient.get<{ data: DeveloperApiKeyEvent[]; meta: EventsPageMeta }>(
                "/developer/events",
                {
                    page: String(pageParam),
                    per_page: "50",
                    ...(filters?.eventType ? { event_type: filters.eventType } : {}),
                    ...(filters?.startDate ? { start_date: filters.startDate } : {}),
                    ...(filters?.endDate ? { end_date: filters.endDate } : {}),
                },
                { fullResponse: true }
            )
            return { events: raw.data, meta: raw.meta }
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            if (lastPage.meta.hasMore) {
                return lastPage.meta.page + 1
            }
            return undefined
        },
        enabled: !!businessId,
    })
}

export function useDeveloperUsage(days = 30, appId?: string | null) {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useQuery({
        queryKey: keys.usage(businessId, days),
        queryFn: () => apiClient.get<DeveloperUsageRow[]>("/developer/usage", { days: String(days), ...(appId ? { developer_app_id: appId } : {}) }),
        enabled: !!businessId,
    })
}

export function useCreateDeveloperApiKey(appId?: string | null) {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useMutation({
        mutationFn: (payload: CreateDeveloperApiKeyPayload) =>
            apiClient.post<DeveloperApiKey>("/developer/api-keys", payload),
        onSuccess: () => {
            toast.success("API key created")
            void queryClient.invalidateQueries({ queryKey: keys.apiKeys(businessId, appId) })
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

export function useViewDeveloperApiKeySecret() {
    return useMutation({
        mutationFn: (id: string) =>
            apiClient.post<{ plaintext: string | null }>(`/developer/api-keys/${id}/view-secret`, {}),
        onError: (error: { message?: string }) => toast.error(error.message ?? "Failed to view API key secret"),
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
