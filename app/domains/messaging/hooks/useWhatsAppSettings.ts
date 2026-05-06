import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/app/lib/api-client"
import { toast } from "sonner"
import { useBusiness } from "@/app/components/BusinessProvider"

export interface WhatsAppNumber {
  id: string
  business_id: string
  store_id: string | null
  provider: string
  phone_number: string
  phone_number_id: string
  waba_id: string | null
  has_verify_token: boolean
  status: "pending" | "verifying" | "active" | "suspended" | "failed"
  verification_logs: Array<{
    timestamp: string
    attempt: number
    source: string
    outcome: string
    meta_status: string | null
    message: string
  }>
  is_default: boolean
  display_name: string | null
  created_at: string
  updated_at: string | null
}

export interface WhatsAppNumberStatus extends WhatsAppNumber {
  meta_status: string | null
  code_verification_status: string | null
  quality_rating: string | null
  is_official_business_account: boolean | null
  verified_name: string | null
  meta_error?: string
}

export type AgentProfile = "commerce" | "service"

export interface AgentCapabilitiesSummary {
  products: boolean
  cart: boolean
  orders: boolean
  debts: boolean
  promotions: boolean
  storefrontLink: boolean
  services: boolean
  inquiries: boolean
  booking: boolean
  qrOrdering: boolean
  humanHandoff: boolean
}

export interface GoSettings {
  id?: string
  business_id: string
  store_id: string | null
  display_name: string | null
  welcome_message: string | null
  fallback_message: string | null
  tone: string
  ai_enabled: boolean
  ai_instructions: string | null
  business_info: string | null
  faq: string | null
  restricted_topics: string | null
  operating_hours: string | null
  delivery_info: string | null
  return_policy: string | null
  qr_ordering_enabled: boolean
  human_handoff_enabled: boolean
  show_powered_by_cloove: boolean
  agent_profile?: AgentProfile
  capabilities?: AgentCapabilitiesSummary
  capabilities_overrides?: Partial<AgentCapabilitiesSummary> | null
  created_at?: string
  updated_at?: string | null
}

export interface UpdateGoSettingsInput extends Partial<GoSettings> {
  agent_profile?: AgentProfile
  capabilities?: Partial<AgentCapabilitiesSummary> | null
}

export interface EmbeddedSignupPayload {
  code: string
  waba_id: string
  phone_number_id: string
}

export type GoSettingsContentField =
  | "welcome_message"
  | "fallback_message"
  | "ai_instructions"
  | "business_info"
  | "faq"
  | "restricted_topics"
  | "operating_hours"
  | "delivery_info"
  | "return_policy"

const QUERY_KEYS = {
  numbers: (businessId?: string) => ["whatsapp-numbers", businessId].filter(Boolean),
  numberStatus: (id: string, businessId?: string) =>
    ["whatsapp-numbers", id, "status", businessId].filter(Boolean),
  goSettings: (businessId?: string) => ["go-settings", businessId].filter(Boolean),
}

export function useWhatsAppNumbers() {
  const { activeBusiness } = useBusiness()
  const businessId = activeBusiness?.id

  return useQuery({
    queryKey: QUERY_KEYS.numbers(businessId),
    queryFn: () => apiClient.get<WhatsAppNumber[]>("/whatsapp-numbers"),
    enabled: !!businessId,
  })
}

export function useWhatsAppNumberStatus(id: string | null, enabled: boolean) {
  const { activeBusiness } = useBusiness()
  const businessId = activeBusiness?.id

  return useQuery({
    queryKey: QUERY_KEYS.numberStatus(id ?? "", businessId),
    queryFn: () => apiClient.get<WhatsAppNumberStatus>(`/whatsapp-numbers/${id}/status`),
    enabled: !!id && enabled && !!businessId,
    refetchInterval: enabled ? 10_000 : false,
  })
}

export function useConnectWhatsAppNumber() {
  const queryClient = useQueryClient()
  const { activeBusiness } = useBusiness()
  const businessId = activeBusiness?.id

  return useMutation({
    mutationFn: (payload: EmbeddedSignupPayload) =>
      apiClient.post<{ message: string; data: WhatsAppNumber }>(
        "/whatsapp-numbers/connect",
        payload,
        { fullResponse: true }
      ),
    onSuccess: (data) => {
      toast.success(data?.message || "WhatsApp number connected")
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.numbers(businessId) })
    },
    onError: () => {
      toast.error("Failed to connect WhatsApp number. Please try again.")
    },
  })
}

export function useUpdateWhatsAppNumber() {
  const queryClient = useQueryClient()
  const { activeBusiness } = useBusiness()
  const businessId = activeBusiness?.id

  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string
      access_token?: string
      app_secret?: string
      webhook_verify_token?: string
      display_name?: string
    }) => apiClient.patch<WhatsAppNumber>(`/whatsapp-numbers/${id}`, body),
    onSuccess: () => {
      toast.success("Credentials updated")
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.numbers(businessId) })
    },
    onError: () => {
      toast.error("Failed to update credentials")
    },
  })
}

export function useDisconnectWhatsAppNumber() {
  const queryClient = useQueryClient()
  const { activeBusiness } = useBusiness()
  const businessId = activeBusiness?.id

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post(`/whatsapp-numbers/${id}/disconnect`, {}),
    onSuccess: () => {
      toast.success("WhatsApp number disconnected")
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.numbers(businessId) })
    },
    onError: () => {
      toast.error("Failed to disconnect number")
    },
  })
}

export function useRestoreWhatsAppNumber() {
  const queryClient = useQueryClient()
  const { activeBusiness } = useBusiness()
  const businessId = activeBusiness?.id

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<{ message: string; data: WhatsAppNumber }>(
        `/whatsapp-numbers/${id}/restore`,
        {},
        { fullResponse: true }
      ),
    onSuccess: (data) => {
      toast.success(data?.message || "WhatsApp number restored")
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.numbers(businessId) })
    },
    onError: () => {
      toast.error("Failed to restore number")
    },
  })
}


export function useGoSettings() {
  const { activeBusiness } = useBusiness()
  const businessId = activeBusiness?.id

  return useQuery({
    queryKey: QUERY_KEYS.goSettings(businessId),
    queryFn: () => apiClient.get<GoSettings>("/go-settings"),
    enabled: !!businessId,
  })
}

export function useUpdateGoSettings() {
  const queryClient = useQueryClient()
  const { activeBusiness } = useBusiness()
  const businessId = activeBusiness?.id

  return useMutation({
    mutationFn: (settings: UpdateGoSettingsInput) =>
      apiClient.put<GoSettings>("/go-settings", settings),
    onMutate: async (newSettings) => {
      const previous = queryClient.getQueryData(QUERY_KEYS.goSettings(businessId))
      queryClient.setQueryData(QUERY_KEYS.goSettings(businessId), (old: GoSettings | undefined) => ({
        ...old,
        ...newSettings,
      }))
      return { previous }
    },
    onError: (err: { message?: string }, _vars, context) => {
      queryClient.setQueryData(QUERY_KEYS.goSettings(businessId), context?.previous)
      toast.error(err.message ?? "Failed to update settings")
    },
    onSuccess: () => {
      toast.success("Settings updated")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.goSettings(businessId) })
    },
  })
}

export function useGenerateGoSettingsContent() {
  return useMutation({
    mutationFn: (payload: {
      field: GoSettingsContentField
      prompt: string
      current_value?: string | null
      store_id?: string | null
    }) =>
      apiClient.post<{ content: string }>("/go-settings/generate-content", payload),
    onError: () => {
      toast.error("Failed to generate content")
    },
  })
}
