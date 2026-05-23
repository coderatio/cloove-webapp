"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/app/lib/api-client"
import type { ApiResponse } from "@/app/lib/api-client"
import { useBusiness } from "@/app/components/BusinessProvider"
import { toast } from "sonner"

export interface VoiceNumberItem {
    id: string
    businessId: string
    storeId: string | null
    provider: string
    label: string | null
    phoneNumber: string
    providerNumberId: string | null
    providerAccountId: string | null
    useSystemCredentials: boolean
    hasCustomCredentials: boolean
    status: string
    isDefault: boolean
    smsEnabled?: boolean
    aiAgentId: string | null
    countryCode: string | null
    numberType: string | null
    rates: {
        inboundPerMinute: number | null
        outboundPerMinute: number | null
        currency: string | null
        countryIso: string | null
        numberType: string | null
    } | null
    createdAt: string
    updatedAt: string | null
}

export interface VoiceNumberRequestItem {
    id: string
    businessId: string
    storeId: string | null
    provider: string
    label: string | null
    countryCode: string
    numberType: string | null
    quantity: number | null
    setupFeeAmount: number | null
    monthlyFeeAmount: number | null
    currency: string | null
    provisioningAttempts: number | null
    lastProvisioningError: string | null
    walletTransactionId: string | null
    aiAgentId: string | null
    notes: string | null
    status:
        | "pending"
        | "provisioning"
        | "approved"
        | "rejected"
        | "cancelled"
        | "fulfilled"
        | "failed"
    approvedPhoneNumber: string | null
    providerNumberId: string | null
    providerAccountId: string | null
    approvedAt: string | null
    fulfilledAt: string | null
    createdAt: string
    updatedAt: string | null
    logs?: VoiceNumberRequestLogItem[]
}

export interface VoiceNumberRequestLogItem {
    id: string
    voiceNumberRequestId: string
    businessId: string
    eventType: string
    title: string
    description: string | null
    metadata: Record<string, unknown> | null
    createdAt: string
}

export interface VoiceProviderOption {
    id: string
    name: string
    /**
     * Customer-facing label for the provider (e.g. "Cloove Voice Basic").
     * Falls back to `name` when null. Internal identifiers always use `id`.
     */
    displayName: string | null
    isEnabled: boolean
    isDefault?: boolean
    logoUrl: string | null
    supportsInbound: boolean
    supportsOutbound: boolean
    supportsRecording: boolean
    supportsTranscription: boolean
    supportsTransfer: boolean
    supportsSms?: boolean
    supportsApiProvisioning?: boolean
    /**
     * Countries this provider can provision voice numbers in. The backend
     * expands the codes stored in `voice_call_providers` system config into
     * full metadata objects for direct UI consumption.
     */
    supportedCountries: VoiceNumberRequestCountry[]
    pricing?: Record<
        string,
        Record<
            string,
            {
                setupFee: number
                monthlyFee: number
                currency: string
                inboundPerMinute: number | null
                outboundPerMinute: number | null
            }
        >
    > | null
    provisioningKycLevel?: number | null
    systemCredentialsEnabled: boolean
    customCredentialsEnabled: boolean
    credentialFields: Array<{
        key: string
        label: string
        type: "text" | "password"
        placeholder?: string | null
        required: boolean
        helpText?: string | null
    }>
    priority: number
}

export interface VoiceSettings {
    id?: string
    businessId: string
    storeId: string | null
    displayName: string | null
    greetingMessage: string | null
    fallbackMessage: string | null
    voicemailMessage: string | null
    language: string
    tone: string
    aiEnabled: boolean
    recordingEnabled: boolean
    transcriptionEnabled: boolean
    humanHandoffEnabled: boolean
    afterHoursEnabled: boolean
    disclosureEnabled: boolean
    businessInfo: string | null
    aiInstructions: string | null
    restrictedTopics: string | null
    operatingHours: string | null
}

export interface VoiceTransferTarget {
    id: string
    businessId: string
    userId: string | null
    label: string
    roleLabel: string | null
    phoneNumber: string
    priority: number
    isActive: boolean
    isFallback: boolean
    availabilityNote: string | null
}

export interface VoiceCallTurn {
    id: string
    sequence: number
    speaker: string
    source: string
    transcript: string | null
    promptText?: string | null
    createdAt: string
}

export interface VoiceCallEvent {
    id: string
    eventType: string
    status: string | null
    occurredAt: string | null
}

export interface VoiceCall {
    id: string
    direction: string
    status: string
    resolution: string | null
    transferStatus: string | null
    customerPhone: string | null
    customerName: string | null
    purpose: string | null
    summary: string | null
    recordingUrl: string | null
    durationSeconds: number | null
    createdAt: string
    aiAgentId: string | null
    aiAgent: { id: string; name: string } | null
    turns?: VoiceCallTurn[]
    events?: VoiceCallEvent[]
}

export interface VoiceCallListMeta {
    total: number
    page: number
    limit: number
    lastPage: number
}

export interface VoiceCallListResult {
    data: VoiceCall[]
    meta: VoiceCallListMeta
}

export interface VoiceCallListParams {
    page?: number
    limit?: number
    search?: string
    direction?: string
    status?: string
}

export interface VoiceHealth {
    activeCalls: number
    openCalls: number
    failedRequestsLast24h: number
    unprocessedEvents: number
    pendingEvents: number
    lastEventAt: string | null
    providerStatus: string
}

export interface VoiceNumberRequestCountry {
    id: string
    name: string
    code: string
    phoneCode: string
    currency: {
        code: string
        symbol: string
    }
    isDefault: boolean
}

const keys = {
    providers: ["voice", "providers"],
    numbers: (businessId?: string) => ["voice", "numbers", businessId],
    numberRequests: (businessId?: string) => ["voice", "number-requests", businessId],
    settings: (businessId?: string) => ["voice", "settings", businessId],
    targets: (businessId?: string) => ["voice", "targets", businessId],
    calls: (businessId?: string, params?: VoiceCallListParams) => ["voice", "calls", businessId, params ?? {}],
    health: (businessId?: string) => ["voice", "health", businessId],
}

export function useVoiceProviders() {
    return useQuery({
        queryKey: keys.providers,
        queryFn: () => apiClient.get<VoiceProviderOption[]>("/voice-providers"),
        staleTime: 5 * 60 * 1000,
    })
}

export function useVoiceNumbers() {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useQuery({
        queryKey: keys.numbers(businessId),
        queryFn: () => apiClient.get<VoiceNumberItem[]>("/voice/numbers"),
        enabled: !!businessId,
    })
}

export function useVoiceNumberRequests() {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useQuery({
        queryKey: keys.numberRequests(businessId),
        queryFn: () => apiClient.get<VoiceNumberRequestItem[]>("/voice/number-requests"),
        enabled: !!businessId,
    })
}

export function useVoiceSettings() {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useQuery({
        queryKey: keys.settings(businessId),
        queryFn: () => apiClient.get<VoiceSettings>("/voice/settings"),
        enabled: !!businessId,
    })
}

export function useVoiceTransferTargets() {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useQuery({
        queryKey: keys.targets(businessId),
        queryFn: () => apiClient.get<VoiceTransferTarget[]>("/voice/transfer-targets"),
        enabled: !!businessId,
    })
}

export function useVoiceCalls(params: VoiceCallListParams = {}) {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useQuery({
        queryKey: keys.calls(businessId, params),
        queryFn: async () => {
            const response = await apiClient.get<ApiResponse<VoiceCall[]>>(
                "/voice/calls",
                {
                    page: String(params.page ?? 1),
                    limit: String(params.limit ?? 20),
                    ...(params.search ? { search: params.search } : {}),
                    ...(params.direction ? { direction: params.direction } : {}),
                    ...(params.status ? { status: params.status } : {}),
                },
                { fullResponse: true }
            )

            return {
                data: response.data,
                meta: {
                    total: Number(response.meta?.total ?? response.data.length ?? 0),
                    page: Number(response.meta?.page ?? params.page ?? 1),
                    limit: Number(response.meta?.limit ?? params.limit ?? 20),
                    lastPage: Number(response.meta?.lastPage ?? 1),
                },
            } satisfies VoiceCallListResult
        },
        enabled: !!businessId,
        refetchInterval: 15000,
        placeholderData: (previousData) => previousData,
    })
}

export function useVoiceHealth() {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useQuery({
        queryKey: keys.health(businessId),
        queryFn: () => apiClient.get<VoiceHealth>("/voice/health"),
        enabled: !!businessId,
        refetchInterval: 15000,
    })
}

export function useCreateVoiceNumber() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useMutation({
        mutationFn: (payload: Record<string, unknown>) => apiClient.post<VoiceNumberItem>("/voice/numbers", payload),
        onSuccess: () => {
            toast.success("Voice number saved")
            void queryClient.invalidateQueries({ queryKey: keys.numbers(businessId) })
            void queryClient.invalidateQueries({ queryKey: keys.numberRequests(businessId) })
        },
        onError: (error: { message?: string }) => toast.error(error.message ?? "Failed to save voice number"),
    })
}

export function useCreateVoiceNumberRequest() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useMutation({
        mutationFn: (payload: Record<string, unknown>) =>
            apiClient.post<VoiceNumberRequestItem>("/voice/number-requests", payload),
        onSuccess: () => {
            toast.success("Voice number request submitted")
            void queryClient.invalidateQueries({ queryKey: keys.numberRequests(businessId) })
        },
        onError: (error: { message?: string }) =>
            toast.error(error.message ?? "Failed to submit voice number request"),
    })
}

export function useCancelVoiceNumberRequest() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useMutation({
        mutationFn: (id: string) => apiClient.post<VoiceNumberRequestItem>(`/voice/number-requests/${id}/cancel`, {}),
        onSuccess: () => {
            toast.success("Voice number request cancelled")
            void queryClient.invalidateQueries({ queryKey: keys.numberRequests(businessId) })
        },
        onError: (error: { message?: string }) =>
            toast.error(error.message ?? "Failed to cancel voice number request"),
    })
}

export function useUpdateVoiceNumber() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
            apiClient.patch<VoiceNumberItem>(`/voice/numbers/${id}`, payload),
        onSuccess: () => {
            toast.success("Voice number updated")
            void queryClient.invalidateQueries({ queryKey: keys.numbers(businessId) })
        },
        onError: (error: { message?: string }) => toast.error(error.message ?? "Failed to update voice number"),
    })
}

export function useDisconnectVoiceNumber() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useMutation({
        mutationFn: (id: string) => apiClient.post<VoiceNumberItem>(`/voice/numbers/${id}/disconnect`, {}),
        onSuccess: () => {
            toast.success("Voice number disconnected")
            void queryClient.invalidateQueries({ queryKey: keys.numbers(businessId) })
        },
        onError: (error: { message?: string }) => toast.error(error.message ?? "Failed to disconnect voice number"),
    })
}

// Maps camelCase form keys to the snake_case payload the API validator
// still expects. Centralised here so the UI keeps a single naming convention.
const VOICE_SETTINGS_PAYLOAD_MAP: Record<keyof VoiceSettings, string> = {
    id: "id",
    businessId: "business_id",
    storeId: "store_id",
    displayName: "display_name",
    greetingMessage: "greeting_message",
    fallbackMessage: "fallback_message",
    voicemailMessage: "voicemail_message",
    language: "language",
    tone: "tone",
    aiEnabled: "ai_enabled",
    recordingEnabled: "recording_enabled",
    transcriptionEnabled: "transcription_enabled",
    humanHandoffEnabled: "human_handoff_enabled",
    afterHoursEnabled: "after_hours_enabled",
    disclosureEnabled: "disclosure_enabled",
    businessInfo: "business_info",
    aiInstructions: "ai_instructions",
    restrictedTopics: "restricted_topics",
    operatingHours: "operating_hours",
}

function toVoiceSettingsPayload(payload: Partial<VoiceSettings>): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(payload)) {
        const apiKey = VOICE_SETTINGS_PAYLOAD_MAP[key as keyof VoiceSettings] ?? key
        result[apiKey] = value
    }
    return result
}

export function useUpdateVoiceSettings() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useMutation({
        mutationFn: (payload: Partial<VoiceSettings>) =>
            apiClient.put<VoiceSettings>("/voice/settings", toVoiceSettingsPayload(payload)),
        onSuccess: () => {
            toast.success("Voice settings updated")
            void queryClient.invalidateQueries({ queryKey: keys.settings(businessId) })
        },
        onError: (error: { message?: string }) => toast.error(error.message ?? "Failed to update voice settings"),
    })
}

export function useCreateVoiceTransferTarget() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useMutation({
        mutationFn: (payload: Record<string, unknown>) => apiClient.post<VoiceTransferTarget>("/voice/transfer-targets", payload),
        onSuccess: () => {
            toast.success("Transfer target added")
            void queryClient.invalidateQueries({ queryKey: keys.targets(businessId) })
        },
        onError: (error: { message?: string }) => toast.error(error.message ?? "Failed to add transfer target"),
    })
}

export function useDeleteVoiceTransferTarget() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useMutation({
        mutationFn: (id: string) => apiClient.delete(`/voice/transfer-targets/${id}`),
        onSuccess: () => {
            toast.success("Transfer target removed")
            void queryClient.invalidateQueries({ queryKey: keys.targets(businessId) })
        },
        onError: (error: { message?: string }) => toast.error(error.message ?? "Failed to remove transfer target"),
    })
}

// ────────────────────────────────────────────────────────────────────────────
// AI agents (first-class) — see plan §4h / §5c.
// ────────────────────────────────────────────────────────────────────────────

export interface AiAgentItem {
    id: string
    businessId: string
    storeId: string | null
    name: string
    slug: string
    status: "draft" | "active" | "paused" | "archived"
    agentProfile: string
    speechProviderId: string | null
    voiceId: string | null
    language: string
    tone: string
    greetingMessage: string | null
    fallbackMessage: string | null
    voicemailMessage: string | null
    businessInfo: string | null
    aiInstructions: string | null
    restrictedTopics: string | null
    operatingHours: string | Record<string, unknown> | null
    enabledTools: string[]
    capabilitiesOverride: Record<string, boolean> | null
    behaviourFlags: Record<string, boolean> | null
    isDefault: boolean
    linkedNumberCount: number
    metadata: Record<string, unknown> | null
    createdAt: string
    updatedAt: string | null
}

export interface VoiceToolDefinitionItem {
    name: string
    category: string
    displayName: string
    description: string | null
    surface: string
    capabilityKey: string | null
    defaultForProfile: Record<string, boolean> | null
    requiredPlanTier: string | null
    icon: string | null
    sortOrder: number
}

export interface VoiceToolPreset {
    key: string
    label: string
    description: string
    tools: string[]
}

export interface VoiceToolCatalog {
    tools: VoiceToolDefinitionItem[]
    presets: VoiceToolPreset[]
}

const aiAgentKeys = {
    list: (businessId?: string) => ["voice", "ai-agents", businessId],
    one: (id: string, businessId?: string) => ["voice", "ai-agents", businessId, id],
    tools: ["voice", "tool-catalog"],
}

export function useVoiceAiAgents() {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useQuery({
        queryKey: aiAgentKeys.list(businessId),
        queryFn: () => apiClient.get<AiAgentItem[]>("/voice/ai-agents"),
        enabled: !!businessId,
    })
}

export function useVoiceAiAgent(id: string | null) {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useQuery({
        queryKey: aiAgentKeys.one(id ?? "", businessId),
        queryFn: () => apiClient.get<AiAgentItem>(`/voice/ai-agents/${id}`),
        enabled: !!businessId && !!id,
    })
}

export function useVoiceTools() {
    return useQuery({
        queryKey: aiAgentKeys.tools,
        queryFn: () => apiClient.get<VoiceToolCatalog>("/voice/tools"),
        staleTime: 10 * 60 * 1000,
    })
}

export interface VoiceSpeechVoiceItem {
    id: string
    name: string
    description: string | null
    accent: string | null
    gender: "female" | "male" | "neutral" | null
    previewUrl: string | null
    tier: "standard" | "premium"
}

export interface VoiceSpeechProviderItem {
    id: string
    name: string
    displayName: string
    realtimeProvider: "openai" | "gemini"
    isDefault: boolean
    logoUrl: string | null
    description: string | null
    requiredPlanTier: string | null
    supportedLanguages: string[]
    priority: number
    voices: VoiceSpeechVoiceItem[]
}

const speechProviderKeys = {
    list: ["voice", "speech-providers"],
}

export function useVoiceSpeechProviders() {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useQuery({
        queryKey: speechProviderKeys.list,
        queryFn: () => apiClient.get<VoiceSpeechProviderItem[]>("/voice/speech-providers"),
        enabled: !!businessId,
        staleTime: 10 * 60 * 1000,
    })
}

export function useCreateVoiceAiAgent() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useMutation({
        mutationFn: (payload: Record<string, unknown>) =>
            apiClient.post<AiAgentItem>("/voice/ai-agents", payload),
        onSuccess: () => {
            toast.success("AI agent created")
            void queryClient.invalidateQueries({ queryKey: aiAgentKeys.list(businessId) })
        },
        onError: (error: { message?: string }) =>
            toast.error(error.message ?? "Failed to create AI agent"),
    })
}

export function useUpdateVoiceAiAgent() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
            apiClient.patch<AiAgentItem>(`/voice/ai-agents/${id}`, payload),
        onSuccess: () => {
            toast.success("AI agent updated")
            void queryClient.invalidateQueries({ queryKey: aiAgentKeys.list(businessId) })
        },
        onError: (error: { message?: string }) =>
            toast.error(error.message ?? "Failed to update AI agent"),
    })
}

export function useDeleteVoiceAiAgent() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useMutation({
        mutationFn: (id: string) => apiClient.delete(`/voice/ai-agents/${id}`),
        onSuccess: () => {
            toast.success("AI agent deleted")
            void queryClient.invalidateQueries({ queryKey: aiAgentKeys.list(businessId) })
        },
        onError: (error: { message?: string }) =>
            toast.error(error.message ?? "Failed to delete AI agent"),
    })
}

export function useDuplicateVoiceAiAgent() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useMutation({
        mutationFn: ({ id, name }: { id: string; name?: string }) =>
            apiClient.post<AiAgentItem>(`/voice/ai-agents/${id}/duplicate`, name ? { name } : {}),
        onSuccess: () => {
            toast.success("AI agent duplicated")
            void queryClient.invalidateQueries({ queryKey: aiAgentKeys.list(businessId) })
        },
        onError: (error: { message?: string }) =>
            toast.error(error.message ?? "Failed to duplicate AI agent"),
    })
}

export function useSetDefaultVoiceAiAgent() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useMutation({
        mutationFn: (id: string) =>
            apiClient.post<AiAgentItem>(`/voice/ai-agents/${id}/set-default`, {}),
        onSuccess: () => {
            toast.success("Default AI agent updated")
            void queryClient.invalidateQueries({ queryKey: aiAgentKeys.list(businessId) })
        },
        onError: (error: { message?: string }) =>
            toast.error(error.message ?? "Failed to set default AI agent"),
    })
}

export function useAssignVoiceAiAgentToNumber() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useMutation({
        mutationFn: ({ numberId, aiAgentId }: { numberId: string; aiAgentId: string | null; silent?: boolean }) =>
            apiClient.patch<VoiceNumberItem>(`/voice/numbers/${numberId}/assign-ai-agent`, {
                ai_agent_id: aiAgentId,
            }),
        onSuccess: (_data, variables) => {
            if (!variables.silent) toast.success("AI agent assignment updated")
            void queryClient.invalidateQueries({ queryKey: keys.numbers(businessId) })
        },
        onError: (error: { message?: string }, variables) => {
            if (variables.silent) return
            toast.error(error.message ?? "Failed to assign AI agent")
        },
    })
}

// ────────────────────────────────────────────────────────────────────────────
// Number request marketplace — eligibility, pricing preview, live search.
// ────────────────────────────────────────────────────────────────────────────

export interface VoiceEligibilityGate {
    key: "kyc" | "wallet"
    satisfied: boolean
    current: number | string | null
    required: number | string | null
    currency?: string
    action: string
    cta?: { label: string; href: string }
}

export interface VoiceEligibilityResult {
    isEligible: boolean
    requiredAction: string | null
    verificationLevel: number
    requiredVerificationLevel: number
    wallet: { balance: number; currency: string; required: number } | null
    gates: VoiceEligibilityGate[]
}

export interface VoiceNumberPricing {
    provider: string
    countryIso: string
    numberType: string
    setupFee: number
    monthlyFee: number
    currency: string
    quantity: number
    totalSetupFee: number
    totalMonthlyFee: number
    totalUpfrontDebit: number
}

export interface VoiceNumberOffer {
    provider: string
    countryIso: string
    numberType: string
    setupFee: number
    monthlyFee: number
    currency: string
}

export interface VoiceAvailableNumber {
    phoneNumber: string
    countryIso: string
    numberType: string
    region?: string | null
    rateCenter?: string | null
    monthlyCost?: number | null
    setupCost?: number | null
    currency?: string | null
    metadata?: Record<string, unknown> | null
}

export interface UseNumberRequestEligibilityParams {
    provider?: string
    countryCode?: string
    numberType?: string
    quantity?: number
}

export function useNumberRequestEligibility(params: UseNumberRequestEligibilityParams) {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id
    const ready = !!params.provider && !!params.countryCode

    return useQuery({
        queryKey: ["voice", "number-request-eligibility", businessId, params],
        queryFn: () =>
            apiClient.get<VoiceEligibilityResult>("/voice/number-requests/eligibility", {
                provider: params.provider!,
                country_code: params.countryCode!,
                number_type: params.numberType ?? "local",
                quantity: String(params.quantity ?? 1),
            }),
        enabled: ready && !!businessId,
    })
}

export function useNumberRequestPricing(params: UseNumberRequestEligibilityParams) {
    const ready = !!params.provider && !!params.countryCode

    return useQuery({
        queryKey: ["voice", "number-request-pricing", params],
        queryFn: async () => {
            const result = await apiClient.post<VoiceNumberPricing>(
                "/voice/number-requests/pricing/preview",
                {
                    provider: params.provider!,
                    country_code: params.countryCode!,
                    number_type: params.numberType ?? "local",
                    quantity: params.quantity ?? 1,
                }
            )
            return result
        },
        enabled: ready,
        retry: false,
    })
}

export function useVoiceNumberOffers(provider?: string) {
    return useQuery({
        queryKey: ["voice", "number-request-offers", provider],
        queryFn: () =>
            apiClient.get<VoiceNumberOffer[]>("/voice/number-requests/pricing", {
                provider: provider!,
            }),
        enabled: !!provider,
        staleTime: 5 * 60 * 1000,
    })
}

export interface UseNumberSearchParams {
    provider?: string
    countryCode?: string
    numberType?: string
    areaCode?: string | null
    contains?: string | null
    limit?: number
}

export function useNumberSearch() {
    return useMutation({
        mutationFn: (params: UseNumberSearchParams) =>
            apiClient.post<VoiceAvailableNumber[]>("/voice/number-search", {
                provider: params.provider,
                country_code: params.countryCode,
                number_type: params.numberType ?? "local",
                area_code: params.areaCode ?? undefined,
                contains: params.contains ?? undefined,
                limit: params.limit ?? 10,
            }),
        onError: (error: { message?: string }) =>
            toast.error(error.message ?? "No numbers available right now. Try a different country or type."),
    })
}

export function useStartVoiceCall() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useMutation({
        mutationFn: (payload: Record<string, unknown>) => apiClient.post("/voice/outbound-calls", payload),
        onSuccess: () => {
            toast.success("Outbound call queued")
            void Promise.all([
                queryClient.invalidateQueries({ queryKey: keys.calls(businessId) }),
                queryClient.invalidateQueries({ queryKey: keys.health(businessId) }),
            ])
        },
        onError: (error: { message?: string }) => toast.error(error.message ?? "Failed to queue outbound call"),
    })
}

// ────────────────────────────────────────────────────────────────────────────
// Voice Call Charges & Wallet Debts — billing UI
// ────────────────────────────────────────────────────────────────────────────

export interface VoiceCallCharge {
    id: string
    reference: string
    externalReference: string | null
    amount: number
    currency: string
    description: string
    voiceCallId: string
    metadata: {
        voice_call_id?: string
        provider?: string
        direction?: string
        country?: string
        number_type?: string
        rate_per_minute?: number
        duration_seconds?: number
        full_amount?: number
        shortfall?: number
        callerNumber?: string
        answerNumber?: string
    } | null
    balanceBefore: number
    balanceAfter: number
    createdAt: string
    processedAt: string
}

export interface VoiceCallChargesMeta {
    page: number
    limit: number
}

export interface WalletDebtItem {
    id: string
    businessId: string
    walletId: string
    originType: string
    originId: string
    originDescription: string
    originalAmount: number
    paidAmount: number
    remainingAmount: number
    currency: string
    status: string
    relatedTransactionId: string | null
    metadata: Record<string, unknown> | null
    settledAt: string | null
    createdAt: string
    updatedAt: string | null
}

export interface WalletDebtsMeta {
    count: number
    totalOutstanding: number
    currency: string | null
}

export function useVoiceCallCharges(page: number = 1, limit: number = 20) {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
    }

    return useQuery({
        queryKey: ["voice", "charges", businessId, page, limit],
        queryFn: async () => {
            const response = await apiClient.get<ApiResponse<VoiceCallCharge[]>>("/finance/voice-calls/charges", params, { fullResponse: true })
            const rawMeta = response.meta
                ? (response.meta as unknown as VoiceCallChargesMeta)
                : undefined
            return {
                data: response.data,
                meta: rawMeta ?? { page, limit },
            }
        },
        enabled: !!businessId,
        staleTime: 30_000,
    })
}

export function useWalletDebts() {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useQuery({
        queryKey: ["finance", "wallet-debts", businessId],
        queryFn: async () => {
            const response = await apiClient.get<ApiResponse<WalletDebtItem[]>>("/finance/wallet-debts", {}, { fullResponse: true })
            const rawMeta = response.meta
                ? (response.meta as unknown as WalletDebtsMeta)
                : undefined
            return {
                data: response.data,
                meta: rawMeta ?? { count: 0, totalOutstanding: 0, currency: null },
            }
        },
        enabled: !!businessId,
        staleTime: 15_000,
        refetchInterval: 30_000,
    })
}
