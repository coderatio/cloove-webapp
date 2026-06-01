import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/app/lib/api-client"
import { toast } from "sonner"
import { useBusiness } from "@/app/components/BusinessProvider"

export enum WhatsAppNumberStatusValue {
  PENDING = "pending",
  VERIFYING = "verifying",
  ACTIVE = "active",
  SUSPENDED = "suspended",
  FAILED = "failed",
}

export interface WhatsAppNumber {
  id: string
  business_id: string
  store_id: string | null
  provider: string
  phone_number: string
  phone_number_id: string
  waba_id: string | null
  app_id: string | null
  has_verify_token: boolean
  status: WhatsAppNumberStatusValue
  verification_logs_count: number
  is_default: boolean
  display_name: string | null
  display_phone_number: string | null
  verified_name: string | null
  meta_status: string | null
  code_verification_status: string | null
  quality_rating: string | null
  is_official_business_account: boolean | null
  connection_mode: "embedded" | "manual"
  meta_business_id: string | null
  selected_catalog_id: string | null
  selected_catalog_name: string | null
  catalog_bootstrap_status: WhatsAppCatalogSyncStatus | null
  catalog_bootstrap_error: string | null
  catalog_bootstrap_failed_at: string | null
  created_at: string
  updated_at: string | null
}

export interface WhatsAppNumberStatus extends WhatsAppNumber {
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

export type RestaurantOrderStage = "queued" | "preparing" | "ready" | "served"
export type RestaurantNewOrderSound = "off" | "chime" | "bell"

export interface OrderNotificationMessage {
  enabled: boolean
  body: string
}

export interface OrderNotificationPreset {
  id: string
  label: string
  body: string
}

export interface OrderNotificationsSettings {
  version: number
  enabled: boolean
  restaurant: {
    enabled: boolean
    auto_send_on_stage_change: boolean
    new_order_sound: RestaurantNewOrderSound
    stage_messages: Record<RestaurantOrderStage, OrderNotificationMessage>
    manual_presets: OrderNotificationPreset[]
  }
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
  human_handoff_phone?: string | null
  show_powered_by_cloove: boolean
  checkout_delivery_fee?: {
    enabled: boolean
    flat_fee: number
    free_delivery_threshold?: number | null
    label?: string | null
  } | null
  agent_profile?: AgentProfile
  capabilities?: AgentCapabilitiesSummary
  capabilities_overrides?: Partial<AgentCapabilitiesSummary> | null
  order_notifications?: OrderNotificationsSettings | null
  created_at?: string
  updated_at?: string | null
}

export interface UpdateGoSettingsInput extends Omit<Partial<GoSettings>, "capabilities"> {
  agent_profile?: AgentProfile
  capabilities?: Partial<AgentCapabilitiesSummary> | null
}

export interface EmbeddedSignupPayload {
  business_id: string
  code: string
  meta_business_id?: string
  waba_id: string
  phone_number_id: string
  catalog_id?: string
  catalog_name?: string
}

export interface ManualConnectPayload {
  phone_number?: string
  phone_number_id?: string
  waba_id?: string
  meta_business_id?: string
  access_token?: string
  app_secret?: string
  app_id?: string
  catalog_id?: string
  catalog_name?: string
  display_name?: string | null
  store_id?: string | null
}

export enum WhatsAppCatalogSyncStatus {
  PENDING = "pending",
  SYNCING = "syncing",
  SYNCED = "synced",
  FAILED = "failed",
}

export interface WhatsAppCatalogStatus {
  id: string
  business_id: string
  whatsapp_number_id: string
  waba_id: string
  meta_catalog_id: string
  sync_status: WhatsAppCatalogSyncStatus
  last_synced_at: string | null
  last_error: string | null
  products_count: number
  synced_products_count: number
  variants_count: number
  synced_variants_count: number
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
  catalog: (businessId?: string) => ["whatsapp-catalog", businessId].filter(Boolean),
  goSettings: (businessId?: string) => ["go-settings", businessId].filter(Boolean),
}

export function useWhatsAppNumbers() {
  const { activeBusiness } = useBusiness()
  const businessId = activeBusiness?.id

  return useQuery({
    queryKey: QUERY_KEYS.numbers(businessId),
    queryFn: () => apiClient.get<WhatsAppNumber[]>("/whatsapp-numbers"),
    enabled: !!businessId,
    // Webhooks and background polling update the row server-side; pulling
    // on focus ensures the user sees Meta-driven status changes the
    // moment they return to the tab.
    refetchOnWindowFocus: true,
  })
}

export function useWhatsAppNumberStatus(id: string | null, enabled: boolean) {
  const { activeBusiness } = useBusiness()
  const businessId = activeBusiness?.id
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: QUERY_KEYS.numberStatus(id ?? "", businessId),
    queryFn: async () => {
      const data = await apiClient.get<WhatsAppNumberStatus>(`/whatsapp-numbers/${id}/status`)
      // The status endpoint persists transitions server-side, so refresh
      // the list whenever a poll completes — that's how a card flips from
      // "Verifying..." to "Connected" without a page reload.
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.numbers(businessId) })
      return data
    },
    enabled: !!id && enabled && !!businessId,
    refetchInterval: (query) => {
      const data = query.state.data as WhatsAppNumberStatus | undefined
      const shouldKeepPolling =
        enabled &&
        (data?.status === WhatsAppNumberStatusValue.PENDING ||
          data?.status === WhatsAppNumberStatusValue.VERIFYING)

      return shouldKeepPolling ? 10_000 : false
    },
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  })
}

export interface VerificationLogEntry {
  id: string
  timestamp: string
  attempt: number
  source: string
  outcome: string
  meta_status: string | null
  code_verification_status: string | null
  quality_rating: string | null
  message: string
  metadata: Record<string, unknown> | null
}

interface VerificationLogsPage {
  entries: VerificationLogEntry[]
  next_cursor: string | null
}

const VERIFICATION_LOG_PAGE_SIZE = 25

export function useWhatsAppNumberVerificationLogs(numberId: string | null, enabled: boolean) {
  const { activeBusiness } = useBusiness()
  const businessId = activeBusiness?.id

  return useInfiniteQuery({
    queryKey: ["whatsapp-numbers", numberId, "verification-logs", businessId].filter(Boolean),
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ limit: String(VERIFICATION_LOG_PAGE_SIZE) })
      if (pageParam) params.set("before", pageParam)
      return apiClient.get<VerificationLogsPage>(
        `/whatsapp-numbers/${numberId}/verification-logs?${params.toString()}`
      )
    },
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled: !!numberId && enabled && !!businessId,
    refetchOnWindowFocus: false,
  })
}

export function useCheckWhatsAppNumberStatus() {
  const queryClient = useQueryClient()
  const { activeBusiness } = useBusiness()
  const businessId = activeBusiness?.id

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.get<WhatsAppNumberStatus>(`/whatsapp-numbers/${id}/status`),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.numbers(businessId) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.numberStatus(id, businessId) })
      toast.success("Status refreshed from Meta")
    },
    onError: () => {
      toast.error("Could not refresh status. Check your access token.")
    },
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.catalog(businessId) })
    },
    onError: () => {
      toast.error("Failed to connect WhatsApp number. Please try again.")
    },
  })
}

export function useManualConnectWhatsAppNumber() {
  const queryClient = useQueryClient()
  const { activeBusiness } = useBusiness()
  const businessId = activeBusiness?.id

  return useMutation({
    mutationFn: (payload: ManualConnectPayload) =>
      apiClient.post<{ message: string; warning?: string | null; data: WhatsAppNumber }>(
        "/whatsapp-numbers/manual-connect",
        payload,
        { fullResponse: true }
      ),
    onSuccess: (data) => {
      toast.success("WhatsApp saved.")
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.numbers(businessId) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.catalog(businessId) })
      if (data?.data?.id) {
        window.setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.numberStatus(data.data.id, businessId) })
        }, 2500)
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to connect WhatsApp number")
    },
  })
}

export function useWhatsAppCatalogStatus(number: WhatsAppNumber | null) {
  const { activeBusiness } = useBusiness()
  const businessId = activeBusiness?.id
  const enabled = !!number && !!businessId
  const isProvisioning =
    number?.status === WhatsAppNumberStatusValue.PENDING ||
    number?.status === WhatsAppNumberStatusValue.VERIFYING

  return useQuery({
    queryKey: QUERY_KEYS.catalog(businessId),
    queryFn: () => apiClient.get<WhatsAppCatalogStatus | null>("/whatsapp-numbers/catalog"),
    enabled,
    refetchInterval: (query) => {
      const data = query.state.data as WhatsAppCatalogStatus | null | undefined
      const status = data?.sync_status
      const shouldKeepPolling =
        isProvisioning ||
        status === WhatsAppCatalogSyncStatus.PENDING ||
        status === WhatsAppCatalogSyncStatus.SYNCING

      return shouldKeepPolling ? 15_000 : false
    },
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  })
}

export function useWhatsAppNumberCatalogStatus(number: WhatsAppNumber | null) {
  const { activeBusiness } = useBusiness()
  const businessId = activeBusiness?.id
  const enabled = !!number && !!businessId
  const isProvisioning =
    number?.status === WhatsAppNumberStatusValue.PENDING ||
    number?.status === WhatsAppNumberStatusValue.VERIFYING
  const numberId = number?.id ?? ""

  return useQuery({
    queryKey: ["whatsapp-numbers", numberId, "catalog", businessId].filter(Boolean),
    queryFn: () =>
      apiClient.get<WhatsAppCatalogStatus | null>(`/whatsapp-numbers/${numberId}/catalog`),
    enabled,
    refetchInterval: (query) => {
      const data = query.state.data as WhatsAppCatalogStatus | null | undefined
      const status = data?.sync_status
      const shouldKeepPolling =
        isProvisioning ||
        status === WhatsAppCatalogSyncStatus.PENDING ||
        status === WhatsAppCatalogSyncStatus.SYNCING

      return shouldKeepPolling ? 15_000 : false
    },
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  })
}

export function useSyncWhatsAppNumberCatalog() {
  const queryClient = useQueryClient()
  const { activeBusiness } = useBusiness()
  const businessId = activeBusiness?.id

  return useMutation({
    mutationFn: (numberId: string) =>
      apiClient.post<{
        message: string
        data?: { queued: boolean; reason?: string; message?: string }
      }>(`/whatsapp-numbers/${numberId}/catalog/sync`, {}, { fullResponse: true }),
    onSuccess: (data, numberId) => {
      if (data?.data?.queued === false) {
        toast.error("Catalog sync failed. Check the card for details.")
      } else {
        toast.success("Catalog sync started.")
      }
      queryClient.invalidateQueries({
        queryKey: ["whatsapp-numbers", numberId, "catalog", businessId].filter(Boolean),
      })
    },
    onError: () => {
      toast.error("Could not start catalog sync.")
    },
  })
}

export function useSyncWhatsAppCatalog() {
  const queryClient = useQueryClient()
  const { activeBusiness } = useBusiness()
  const businessId = activeBusiness?.id

  return useMutation({
    mutationFn: () =>
      apiClient.post<{
        message: string
        data?: { queued: boolean; reason?: string; message?: string }
      }>("/whatsapp-numbers/catalog/sync", {}, { fullResponse: true }),
    onSuccess: (data) => {
      if (data?.data?.queued === false) {
        toast.error("Catalog sync failed. Check the card for details.")
      } else {
        toast.success("Catalog sync started.")
      }
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.catalog(businessId) })
    },
    onError: () => {
      toast.error("Could not start catalog sync.")
    },
  })
}

export function useResyncWhatsAppConfig() {
  const queryClient = useQueryClient()
  const { activeBusiness } = useBusiness()
  const businessId = activeBusiness?.id

  return useMutation({
    mutationFn: () =>
      apiClient.post<{
        message: string
        data?: { appCallbackConfigured: boolean; configured: number; failed: number }
      }>("/whatsapp-numbers/webhook/setup", {}, { fullResponse: true }),
    onSuccess: (data) => {
      if (data?.data?.failed && data.data.failed > 0) {
        toast.error("Config resynced with issues. Review status.")
      } else {
        toast.success("Config resynced.")
      }
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.numbers(businessId) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.catalog(businessId) })
    },
    onError: () => {
      toast.error("Could not resync config.")
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
      app_id?: string
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

export function useDeleteWhatsAppNumber() {
  const queryClient = useQueryClient()
  const { activeBusiness } = useBusiness()
  const businessId = activeBusiness?.id

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<{ message?: string }>(`/whatsapp-numbers/${id}`, { fullResponse: true }),
    onSuccess: (data) => {
      toast.success(data?.message || "WhatsApp number deleted")
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.numbers(businessId) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.catalog(businessId) })
    },
    onError: () => {
      toast.error("Failed to delete number")
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
