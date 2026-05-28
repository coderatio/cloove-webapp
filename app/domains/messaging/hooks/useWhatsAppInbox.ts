"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient, type ApiResponse } from "@/app/lib/api-client"

export interface WhatsAppInboxOverview {
    openConversations: number
    humanManagedConversations: number
    aiManagedConversations: number
    unreadMessages: number
    connectedNumbers: number
    recentMessages: WhatsAppInboxMessage[]
}

export interface WhatsAppInboxConversation {
    id: string
    customer_phone: string
    customer_name: string | null
    mode: "ai" | "human"
    status: "open" | "pending_customer" | "resolved" | "closed"
    unread_count: number
    last_inbound_at: string | null
    last_outbound_at: string | null
    assigned_to_user_id: string | null
    assigned_to_name: string | null
    business_whatsapp_number_id: string
    number_label: string | null
    context_summary: string | null
    handoff_summary: string | null
    last_customer_message: string | null
    last_ai_reply: string | null
    updated_at: string | null
}

export interface WhatsAppInboxMessage {
    id: string
    direction: "inbound" | "outbound"
    sender_type: "customer" | "ai" | "human" | "system"
    message_type: string
    text: string | null
    meta_message_id: string | null
    delivery_status: "pending" | "sent" | "delivered" | "read" | "failed"
    template_key: string | null
    template_name: string | null
    template_variables: Record<string, unknown> | null
    payload: Record<string, unknown> | null
    sent_at: string | null
    delivered_at: string | null
    read_at: string | null
    failed_at: string | null
    failure_reason: string | null
    user_name: string | null
    created_at: string | null
}

export interface WhatsAppInboxConversationDetail extends WhatsAppInboxConversation {
    messages: WhatsAppInboxMessage[]
}

export interface WhatsAppTemplateSummary {
    id: string
    key: string
    name: string
    category: "utility" | "marketing" | "authentication"
    language: string
    content: string
    business_whatsapp_number_id: string | null
    number_label: string | null
    status: "draft" | "published" | "archived"
    is_active: boolean
    is_approved: boolean
    can_send: boolean
    meta_template_name: string | null
    meta_language: string | null
    meta_status: string | null
    components: Array<Record<string, unknown>> | null
    sample_variables: Record<string, string>
    meta_readiness: {
        isReady?: boolean
        errors?: string[]
        warnings?: string[]
    } | null
    variables: Array<{ key: string; required?: boolean; type?: string; label?: string }>
    created_at?: string | null
    updated_at?: string | null
    approved_at?: string | null
}

export interface WhatsAppFlowSummary {
    id: string
    key: string
    name: string
    display_name: string
    cta_text: string
    body_text: string | null
    footer_text: string | null
    description: string | null
    categories: string[]
    status: string
    meta_status: string | null
    is_active: boolean
    is_system: boolean
    business_whatsapp_number_id: string | null
    published_at: string | null
    updated_at: string | null
    flow_json: Record<string, unknown>
}

export interface WhatsAppFlowStats {
    total: number
    draft: number
    published: number
    archived: number
}

export interface WhatsAppFlowListMeta {
    total: number
    page: number
    limit: number
    totalPages: number
}

export interface WhatsAppTemplateStats {
    total: number
    draft: number
    published: number
    archived: number
    sendable: number
}

export interface WhatsAppTemplateListMeta {
    total: number
    page: number
    limit: number
    totalPages: number
}

const QUERY_KEYS = {
    overview: ["whatsapp", "overview"],
    conversations: ["whatsapp", "conversations"],
    conversation: (id: string | null) => ["whatsapp", "conversations", id],
    templates: ["whatsapp", "templates"],
    templateStats: ["whatsapp", "template-stats"],
    flows: ["whatsapp", "flows"],
    flowStats: ["whatsapp", "flow-stats"],
}

export function useWhatsAppOverview() {
    return useQuery({
        queryKey: QUERY_KEYS.overview,
        queryFn: () => apiClient.get<WhatsAppInboxOverview>("/whatsapp/overview"),
    })
}

export function useWhatsAppConversations() {
    return useQuery({
        queryKey: QUERY_KEYS.conversations,
        queryFn: () => apiClient.get<WhatsAppInboxConversation[]>("/whatsapp/conversations"),
        refetchInterval: 10_000,
    })
}

export function useWhatsAppConversation(id: string | null) {
    return useQuery({
        queryKey: QUERY_KEYS.conversation(id),
        queryFn: () => apiClient.get<WhatsAppInboxConversationDetail>(`/whatsapp/conversations/${id}`),
        enabled: !!id,
        refetchInterval: id ? 8_000 : false,
    })
}

function useConversationMutation<TVariables>(
    endpointBuilder: (variables: TVariables) => string,
    bodyBuilder?: (variables: TVariables) => unknown
) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (variables: TVariables) =>
            apiClient.post(endpointBuilder(variables), bodyBuilder ? bodyBuilder(variables) : {}),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.overview })
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations })
            const id = typeof variables === "object" && variables && "id" in (variables as object)
                ? String((variables as { id?: string }).id ?? "")
                : ""
            if (id) {
                queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversation(id) })
            }
        },
    })
}

export function useTakeOverConversation() {
    return useConversationMutation<{ id: string }>(({ id }) => `/whatsapp/conversations/${id}/take-over`)
}

export function useReturnConversationToAi() {
    return useConversationMutation<{ id: string }>(({ id }) => `/whatsapp/conversations/${id}/return-to-ai`)
}

export function useResolveConversation() {
    return useConversationMutation<{ id: string }>(({ id }) => `/whatsapp/conversations/${id}/resolve`)
}

export function useAssignConversation() {
    return useConversationMutation<{ id: string; userId: string | null }>(
        ({ id }) => `/whatsapp/conversations/${id}/assign`,
        ({ userId }) => ({ user_id: userId })
    )
}

export function useSendConversationMessage() {
    return useConversationMutation<{ id: string; text: string }>(
        ({ id }) => `/whatsapp/conversations/${id}/messages`,
        ({ text }) => ({ text })
    )
}

export function useWhatsAppTemplates(params?: {
    businessWhatsappNumberId?: string | null
    page?: number
    limit?: number
    search?: string
    status?: "draft" | "published" | "archived" | "all"
}) {
    return useQuery({
        queryKey: [...QUERY_KEYS.templates, params],
        queryFn: async () => {
            const response = await apiClient.get<ApiResponse<WhatsAppTemplateSummary[]>>(
                "/whatsapp/templates",
                {
                    page: String(params?.page ?? 1),
                    limit: String(params?.limit ?? 12),
                    ...(params?.businessWhatsappNumberId ? { business_whatsapp_number_id: params.businessWhatsappNumberId } : {}),
                    ...(params?.search ? { search: params.search } : {}),
                    ...(params?.status && params.status !== "all" ? { status: params.status } : {}),
                },
                { fullResponse: true }
            )

            return {
                data: response.data,
                meta: (response.meta ?? {}) as unknown as WhatsAppTemplateListMeta,
            }
        },
        enabled: !!params?.businessWhatsappNumberId,
    })
}

export function useWhatsAppTemplateStats() {
    return useQuery({
        queryKey: QUERY_KEYS.templateStats,
        queryFn: () => apiClient.get<WhatsAppTemplateStats>("/whatsapp/templates/stats"),
        enabled: false,
    })
}

export function useWhatsAppTemplateStatsForNumber(businessWhatsappNumberId: string | null) {
    return useQuery({
        queryKey: [...QUERY_KEYS.templateStats, businessWhatsappNumberId],
        queryFn: () =>
            apiClient.get<WhatsAppTemplateStats>("/whatsapp/templates/stats", {
                business_whatsapp_number_id: String(businessWhatsappNumberId),
            }),
        enabled: !!businessWhatsappNumberId,
    })
}

export function useSendConversationTemplate() {
    return useConversationMutation<{ id: string; templateKey: string; variables: Record<string, unknown> }>(
        ({ id }) => `/whatsapp/conversations/${id}/templates/send`,
        ({ templateKey, variables }) => ({ template_key: templateKey, variables })
    )
}

export function useTestSendTemplate() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (input: {
            businessWhatsappNumberId: string
            phone: string
            customerName?: string
            templateKey: string
            variables: Record<string, unknown>
        }) =>
            apiClient.post("/whatsapp/templates/test-send", {
                business_whatsapp_number_id: input.businessWhatsappNumberId,
                phone: input.phone,
                customer_name: input.customerName ?? null,
                template_key: input.templateKey,
                variables: input.variables,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.overview })
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations })
        },
    })
}

export function useWhatsAppFlows(businessWhatsappNumberId: string | null) {
    return useQuery({
        queryKey: [...QUERY_KEYS.flows, businessWhatsappNumberId],
        queryFn: async () => {
            const response = await apiClient.get<ApiResponse<WhatsAppFlowSummary[]>>(
                "/whatsapp/flows",
                { business_whatsapp_number_id: String(businessWhatsappNumberId) },
                { fullResponse: true }
            )

            return {
                data: response.data,
                meta: (response.meta ?? {}) as unknown as WhatsAppFlowListMeta,
            }
        },
        enabled: !!businessWhatsappNumberId,
    })
}

export function useWhatsAppFlowStats(businessWhatsappNumberId: string | null) {
    return useQuery({
        queryKey: [...QUERY_KEYS.flowStats, businessWhatsappNumberId],
        queryFn: () =>
            apiClient.get<WhatsAppFlowStats>("/whatsapp/flows/stats", {
                business_whatsapp_number_id: String(businessWhatsappNumberId),
            }),
        enabled: !!businessWhatsappNumberId,
    })
}

function invalidateTemplateQueries(queryClient: ReturnType<typeof useQueryClient>) {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.templates })
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.templateStats })
}

function invalidateFlowQueries(queryClient: ReturnType<typeof useQueryClient>) {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.flows })
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.flowStats })
}

export function useCreateWhatsAppTemplate() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (input: {
            businessWhatsappNumberId: string
            key: string
            name: string
            category: string
            language: string
            content: string
            headerText?: string
            footerText?: string
            buttons?: Array<Record<string, unknown>>
            sampleVariables?: Record<string, string>
            variables: Array<{ key: string; required?: boolean; type?: string; label?: string }>
        }) => apiClient.post<WhatsAppTemplateSummary>("/whatsapp/templates", {
            business_whatsapp_number_id: input.businessWhatsappNumberId,
            key: input.key,
            name: input.name,
            category: input.category,
            language: input.language,
            content: input.content,
            header_text: input.headerText ?? null,
            footer_text: input.footerText ?? null,
            buttons: input.buttons ?? [],
            sample_variables: input.sampleVariables ?? {},
            variables: input.variables,
        }),
        onSuccess: () => invalidateTemplateQueries(queryClient),
    })
}

export function useUpdateWhatsAppTemplate() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (input: {
            id: string
            businessWhatsappNumberId: string
            key: string
            name: string
            category: string
            language: string
            content: string
            headerText?: string
            footerText?: string
            buttons?: Array<Record<string, unknown>>
            sampleVariables?: Record<string, string>
            variables: Array<{ key: string; required?: boolean; type?: string; label?: string }>
        }) => apiClient.patch<WhatsAppTemplateSummary>(`/whatsapp/templates/${input.id}`, {
            business_whatsapp_number_id: input.businessWhatsappNumberId,
            key: input.key,
            name: input.name,
            category: input.category,
            language: input.language,
            content: input.content,
            header_text: input.headerText ?? null,
            footer_text: input.footerText ?? null,
            buttons: input.buttons ?? [],
            sample_variables: input.sampleVariables ?? {},
            variables: input.variables,
        }),
        onSuccess: () => invalidateTemplateQueries(queryClient),
    })
}

export function usePublishWhatsAppTemplate() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (input: { id: string; businessWhatsappNumberId: string }) =>
            apiClient.post<WhatsAppTemplateSummary>(`/whatsapp/templates/${input.id}/publish`, {
                business_whatsapp_number_id: input.businessWhatsappNumberId,
            }),
        onSuccess: () => invalidateTemplateQueries(queryClient),
    })
}

export function useArchiveWhatsAppTemplate() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (input: { id: string; businessWhatsappNumberId: string }) =>
            apiClient.post<WhatsAppTemplateSummary>(`/whatsapp/templates/${input.id}/archive`, {
                business_whatsapp_number_id: input.businessWhatsappNumberId,
            }),
        onSuccess: () => invalidateTemplateQueries(queryClient),
    })
}

export function useCreateWhatsAppFlow() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (input: {
            businessWhatsappNumberId: string
            key: string
            name: string
            displayName: string
            ctaText: string
            bodyText?: string
            footerText?: string
            description?: string
            categories: string[]
            flowJson: Record<string, unknown>
        }) => apiClient.post<WhatsAppFlowSummary>("/whatsapp/flows", {
            business_whatsapp_number_id: input.businessWhatsappNumberId,
            key: input.key,
            name: input.name,
            display_name: input.displayName,
            cta_text: input.ctaText,
            body_text: input.bodyText ?? null,
            footer_text: input.footerText ?? null,
            description: input.description ?? null,
            categories: input.categories,
            flow_json: input.flowJson,
        }),
        onSuccess: () => invalidateFlowQueries(queryClient),
    })
}

export function useUpdateWhatsAppFlow() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (input: {
            id: string
            businessWhatsappNumberId: string
            key: string
            name: string
            displayName: string
            ctaText: string
            bodyText?: string
            footerText?: string
            description?: string
            categories: string[]
            flowJson: Record<string, unknown>
        }) => apiClient.patch<WhatsAppFlowSummary>(`/whatsapp/flows/${input.id}`, {
            business_whatsapp_number_id: input.businessWhatsappNumberId,
            key: input.key,
            name: input.name,
            display_name: input.displayName,
            cta_text: input.ctaText,
            body_text: input.bodyText ?? null,
            footer_text: input.footerText ?? null,
            description: input.description ?? null,
            categories: input.categories,
            flow_json: input.flowJson,
        }),
        onSuccess: () => invalidateFlowQueries(queryClient),
    })
}

export function usePublishWhatsAppFlow() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (input: { id: string; businessWhatsappNumberId: string }) =>
            apiClient.post<WhatsAppFlowSummary>(`/whatsapp/flows/${input.id}/publish`, {
                business_whatsapp_number_id: input.businessWhatsappNumberId,
            }),
        onSuccess: () => invalidateFlowQueries(queryClient),
    })
}

export function useArchiveWhatsAppFlow() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (input: { id: string; businessWhatsappNumberId: string }) =>
            apiClient.post<WhatsAppFlowSummary>(`/whatsapp/flows/${input.id}/archive`, {
                business_whatsapp_number_id: input.businessWhatsappNumberId,
            }),
        onSuccess: () => invalidateFlowQueries(queryClient),
    })
}

function slugify(value: string) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
}

export function useDuplicateWhatsAppFlow() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (input: {
            flow: WhatsAppFlowSummary
            businessWhatsappNumberId: string
        }) => {
            const baseKey = slugify(input.flow.key ?? input.flow.name)
            const suffix = Math.random().toString(36).slice(2, 6)
            const duplicateKey = `${baseKey}_copy_${suffix}`
            const duplicateName = `${input.flow.name}_copy_${suffix}`
            const duplicateDisplay = `${input.flow.display_name} (copy)`

            return apiClient.post<WhatsAppFlowSummary>("/whatsapp/flows", {
                business_whatsapp_number_id: input.businessWhatsappNumberId,
                key: duplicateKey,
                name: duplicateName,
                display_name: duplicateDisplay,
                cta_text: input.flow.cta_text,
                body_text: input.flow.body_text ?? null,
                footer_text: input.flow.footer_text ?? null,
                description: input.flow.description ?? null,
                categories: input.flow.categories,
                flow_json: input.flow.flow_json,
            })
        },
        onSuccess: () => invalidateFlowQueries(queryClient),
    })
}
