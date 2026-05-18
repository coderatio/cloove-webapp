"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/app/lib/api-client"
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
    created_at: string
    updated_at: string | null
}

export interface VoiceProviderOption {
    id: string
    name: string
    is_enabled: boolean
    is_default?: boolean
    logo_url: string | null
    supports_inbound: boolean
    supports_outbound: boolean
    supports_recording: boolean
    supports_transcription: boolean
    supports_transfer: boolean
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
    turns?: VoiceCallTurn[]
    events?: VoiceCallEvent[]
}

export interface VoiceHealth {
    active_calls: number
    failed_requests_last_24h: number
    pending_events: number
    last_event_at: string | null
    provider_status: string
}

const keys = {
    providers: ["voice", "providers"],
    numbers: (businessId?: string) => ["voice", "numbers", businessId],
    settings: (businessId?: string) => ["voice", "settings", businessId],
    targets: (businessId?: string) => ["voice", "targets", businessId],
    calls: (businessId?: string) => ["voice", "calls", businessId],
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

export function useVoiceCalls() {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useQuery({
        queryKey: keys.calls(businessId),
        queryFn: () => apiClient.get<VoiceCall[]>("/voice/calls", { limit: "100" }),
        enabled: !!businessId,
        refetchInterval: 15000,
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
        },
        onError: (error: { message?: string }) => toast.error(error.message ?? "Failed to save voice number"),
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
