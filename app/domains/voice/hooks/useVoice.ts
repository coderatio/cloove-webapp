"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/app/lib/api-client"
import type { ApiResponse } from "@/app/lib/api-client"
import { useBusiness } from "@/app/components/BusinessProvider"
import { toast } from "sonner"

export interface VoiceNumberItem {
    id: string
    business_id: string
    store_id: string | null
    provider: string
    label: string | null
    phone_number: string
    provider_number_id: string | null
    provider_account_id: string | null
    use_system_credentials: boolean
    has_custom_credentials: boolean
    status: string
    is_default: boolean
    sms_enabled?: boolean
    ai_agent_id: string | null
    country_code: string | null
    number_type: string | null
    rates: {
        inboundPerMinute: number | null
        outboundPerMinute: number | null
        currency: string | null
        countryIso: string | null
        numberType: string | null
    } | null
    created_at: string
    updated_at: string | null
}

export interface VoiceNumberRequestItem {
    id: string
    business_id: string
    store_id: string | null
    provider: string
    label: string | null
    country_code: string
    number_type: string | null
    quantity: number | null
    setup_fee_amount: number | null
    monthly_fee_amount: number | null
    currency: string | null
    provisioning_attempts: number | null
    last_provisioning_error: string | null
    wallet_transaction_id: string | null
    ai_agent_id: string | null
    notes: string | null
    status:
        | "pending"
        | "provisioning"
        | "approved"
        | "rejected"
        | "cancelled"
        | "fulfilled"
        | "failed"
    approved_phone_number: string | null
    provider_number_id: string | null
    provider_account_id: string | null
    approved_at: string | null
    fulfilled_at: string | null
    created_at: string
    updated_at: string | null
    logs?: VoiceNumberRequestLogItem[]
}

export interface VoiceNumberRequestLogItem {
    id: string
    voice_number_request_id: string
    business_id: string
    event_type: string
    title: string
    description: string | null
    metadata: Record<string, unknown> | null
    created_at: string
}

export interface VoiceProviderOption {
    id: string
    name: string
    /**
     * Customer-facing label for the provider (e.g. "Cloove Voice Basic").
     * Falls back to `name` when null. Internal identifiers always use `id`.
     */
    display_name: string | null
    is_enabled: boolean
    is_default?: boolean
    logo_url: string | null
    supports_inbound: boolean
    supports_outbound: boolean
    supports_recording: boolean
    supports_transcription: boolean
    supports_transfer: boolean
    /**
     * Countries this provider can provision voice numbers in. The backend
     * expands the codes stored in `voice_call_providers` system config into
     * full metadata objects for direct UI consumption.
     */
    supported_countries: VoiceNumberRequestCountry[]
    system_credentials_enabled: boolean
    custom_credentials_enabled: boolean
    credential_fields: Array<{
        key: string
        label: string
        type: "text" | "password"
        placeholder?: string | null
        required: boolean
        help_text?: string | null
    }>
    priority: number
}

export interface VoiceSettings {
    id?: string
    business_id: string
    store_id: string | null
    display_name: string | null
    greeting_message: string | null
    fallback_message: string | null
    voicemail_message: string | null
    language: string
    tone: string
    ai_enabled: boolean
    recording_enabled: boolean
    transcription_enabled: boolean
    human_handoff_enabled: boolean
    after_hours_enabled: boolean
    disclosure_enabled: boolean
    business_info: string | null
    ai_instructions: string | null
    restricted_topics: string | null
    operating_hours: string | null
}

export interface VoiceTransferTarget {
    id: string
    business_id: string
    user_id: string | null
    label: string
    role_label: string | null
    phone_number: string
    priority: number
    is_active: boolean
    is_fallback: boolean
    availability_note: string | null
}

export interface VoiceCallTurn {
    id: string
    sequence: number
    speaker: string
    source: string
    transcript: string | null
    prompt_text?: string | null
    created_at: string
}

export interface VoiceCallEvent {
    id: string
    event_type: string
    status: string | null
    occurred_at: string | null
}

export interface VoiceCall {
    id: string
    direction: string
    status: string
    resolution: string | null
    transfer_status: string | null
    customer_phone: string | null
    customer_name: string | null
    purpose: string | null
    summary: string | null
    recording_url: string | null
    duration_seconds: number | null
    created_at: string
    ai_agent_id: string | null
    ai_agent: { id: string; name: string } | null
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
    active_calls: number
    open_calls: number
    failed_requests_last_24h: number
    unprocessed_events: number
    pending_events: number
    last_event_at: string | null
    provider_status: string
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

export function useUpdateVoiceSettings() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useMutation({
        mutationFn: (payload: Partial<VoiceSettings>) => apiClient.put<VoiceSettings>("/voice/settings", payload),
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
    business_id: string
    store_id: string | null
    name: string
    slug: string
    status: "draft" | "active" | "paused" | "archived"
    agent_profile: string
    speech_provider_id: string | null
    voice_id: string | null
    language: string
    tone: string
    greeting_message: string | null
    fallback_message: string | null
    voicemail_message: string | null
    business_info: string | null
    ai_instructions: string | null
    restricted_topics: string | null
    operating_hours: string | Record<string, unknown> | null
    enabled_tools: string[]
    capabilities_override: Record<string, boolean> | null
    behaviour_flags: Record<string, boolean> | null
    is_default: boolean
    linked_number_count: number
    metadata: Record<string, unknown> | null
    created_at: string
    updated_at: string | null
}

export interface VoiceToolDefinitionItem {
    name: string
    category: string
    display_name: string
    description: string | null
    surface: string
    capability_key: string | null
    default_for_profile: Record<string, boolean> | null
    required_plan_tier: string | null
    icon: string | null
    sort_order: number
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
    preview_url: string | null
    tier: "standard" | "premium"
}

export interface VoiceSpeechProviderItem {
    id: string
    name: string
    display_name: string
    realtime_provider: "openai" | "gemini"
    is_default: boolean
    logo_url: string | null
    description: string | null
    required_plan_tier: string | null
    supported_languages: string[]
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
