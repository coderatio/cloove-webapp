"use client"

import { useState, useEffect } from "react"
import { Input } from "@/app/components/ui/input"
import { Switch } from "@/app/components/ui/switch"
import { Button } from "@/app/components/ui/button"
import { Textarea } from "@/app/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select"
import {
  Loader2,
  Phone,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  Unplug,
  RotateCcw,
  MessageSquare,
  Bot,
  Shield,
  Briefcase,
  PackageCheck,
  RefreshCw,
  Bell,
  Plus,
  ChevronDown,
  ChevronRight,
  Plug,
} from "lucide-react"
import {
  useWhatsAppNumbers,
  useWhatsAppNumberStatus,
  useCheckWhatsAppNumberStatus,
  useDisconnectWhatsAppNumber,
  useRestoreWhatsAppNumber,
  useDeleteWhatsAppNumber,
  useGoSettings,
  useUpdateGoSettings,
  useGenerateGoSettingsContent,
  useWhatsAppNumberCatalogStatus,
  useSyncWhatsAppNumberCatalog,
  useResyncWhatsAppConfig,
  type WhatsAppNumber,
  type WhatsAppCatalogStatus,
  type GoSettings,
  type GoSettingsContentField,
  type OrderNotificationsSettings,
  type RestaurantOrderStage,
  WhatsAppNumberStatusValue,
  WhatsAppCatalogSyncStatus,
} from "../hooks/useWhatsAppSettings"
import { MarkdownEditor } from "@/app/components/ui/markdown-editor"
import { EmbeddedSignupButton } from "./EmbeddedSignupButton"
import { ConnectWhatsAppForm } from "./ConnectWhatsAppForm"
import { WhatsAppNumberLogsSheet } from "./WhatsAppNumberLogsSheet"
import { AgentProfileSection } from "./AgentProfileSection"
import { WhatsAppNotificationMessageInput } from "./WhatsAppNotificationMessageInput"
import { useBusiness } from "@/app/components/BusinessProvider"
import { useFeature } from "@/app/hooks/useFeature"
import { useLayoutPresetId } from "@/app/domains/workspace/hooks/usePresetPageCopy"
import { ConfirmDialog } from "@/app/components/shared/ConfirmDialog"
import { OperatingHoursBuilder } from "@/app/components/shared/OperatingHoursBuilder"

interface WhatsAppSettingsProps {
  onDirtyChange?: (isDirty: boolean) => void
  onSavingChange?: (isSaving: boolean) => void
  saveTrigger?: number
}

interface EmbeddedSignupRuntimeConfig {
  embeddedEnabled: boolean
  isConfigured: boolean
  error: string | null
}

const STATUS_CONFIG: Record<WhatsAppNumberStatusValue, { label: string; icon: React.ElementType; color: string }> = {
  [WhatsAppNumberStatusValue.ACTIVE]: { label: "Connected", icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400" },
  [WhatsAppNumberStatusValue.PENDING]: { label: "Verifying...", icon: Clock, color: "text-amber-600 dark:text-amber-400" },
  [WhatsAppNumberStatusValue.VERIFYING]: { label: "Verifying...", icon: Clock, color: "text-amber-600 dark:text-amber-400" },
  [WhatsAppNumberStatusValue.FAILED]: { label: "Failed", icon: XCircle, color: "text-red-600 dark:text-red-400" },
  [WhatsAppNumberStatusValue.SUSPENDED]: { label: "Disconnected", icon: AlertCircle, color: "text-slate-500 dark:text-slate-300" },
}

function getWhatsAppPhoneLabel(number: WhatsAppNumber) {
  return number.display_phone_number || number.phone_number
}

function getWhatsAppDisplayName(number: WhatsAppNumber) {
  return number.display_name || number.verified_name
}

const TONE_OPTIONS = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "formal", label: "Formal" },
  { value: "casual", label: "Casual" },
]

const ORDER_STAGE_LABELS: Record<RestaurantOrderStage, string> = {
  queued: "Queued",
  preparing: "Preparing",
  ready: "Ready",
  served: "Served",
}

/** Shown under each stage title—what this auto-message is for, not raw placeholder tokens */
const ORDER_STAGE_MESSAGE_HINTS: Record<RestaurantOrderStage, string> = {
  queued:
    "Sent when an order is accepted and waiting in the kitchen queue—confirm it landed and set expectations for what happens next.",
  preparing:
    "Sent when the kitchen starts working on the order—reassure the guest that prep is underway.",
  ready:
    "Sent when the order is ready for pickup or handoff—tell them how or where to collect if that helps.",
  served:
    "Sent when the order is marked finished or served—thank the guest or close the loop politely.",
}

const DEFAULT_ORDER_NOTIFICATIONS: OrderNotificationsSettings = {
  version: 1,
  enabled: false,
  restaurant: {
    enabled: true,
    auto_send_on_stage_change: true,
    stage_messages: {
      queued: {
        enabled: true,
        body: "Hi {customerName}, your order #{orderCode} has been received and sent to the kitchen.",
      },
      preparing: {
        enabled: true,
        body: "Good news, your order #{orderCode} is now being prepared.",
      },
      ready: {
        enabled: true,
        body: "Your order #{orderCode} is ready. Please collect it when convenient.",
      },
      served: {
        enabled: false,
        body: "Your order #{orderCode} has been served. Thank you for choosing {businessName}.",
      },
    },
    manual_presets: [
      {
        id: "checking_in",
        label: "Checking in",
        body: "Hi {customerName}, we are checking on your order #{orderCode} and will update you shortly.",
      },
      {
        id: "ready_reminder",
        label: "Ready reminder",
        body: "Hi {customerName}, your order #{orderCode} is ready for pickup.",
      },
    ],
  },
}

function mergeOrderNotifications(
  settings?: OrderNotificationsSettings | null
): OrderNotificationsSettings {
  if (!settings) return DEFAULT_ORDER_NOTIFICATIONS

  return {
    ...DEFAULT_ORDER_NOTIFICATIONS,
    ...settings,
    restaurant: {
      ...DEFAULT_ORDER_NOTIFICATIONS.restaurant,
      ...settings.restaurant,
      stage_messages: {
        ...DEFAULT_ORDER_NOTIFICATIONS.restaurant.stage_messages,
        ...settings.restaurant?.stage_messages,
      },
      manual_presets:
        settings.restaurant?.manual_presets ?? DEFAULT_ORDER_NOTIFICATIONS.restaurant.manual_presets,
    },
  }
}

export function WhatsAppSettings({ onDirtyChange, onSavingChange, saveTrigger }: WhatsAppSettingsProps) {
  const hasWhitelabelWhatsapp = useFeature("hasWhitelabelWhatsapp")
  const { data: numbers, isLoading: numbersLoading } = useWhatsAppNumbers()
  const { data: goSettingsData, isLoading: settingsLoading } = useGoSettings()
  const updateGoSettings = useUpdateGoSettings()
  const generateContent = useGenerateGoSettingsContent()
  const disconnectNumber = useDisconnectWhatsAppNumber()

  const restoreNumber = useRestoreWhatsAppNumber()
  const deleteNumber = useDeleteWhatsAppNumber()

  const allNumbers = (numbers as WhatsAppNumber[] | undefined) ?? []
  const livingNumbers = allNumbers.filter(
    (n) =>
      n.status === WhatsAppNumberStatusValue.ACTIVE ||
      n.status === WhatsAppNumberStatusValue.PENDING ||
      n.status === WhatsAppNumberStatusValue.VERIFYING ||
      n.status === WhatsAppNumberStatusValue.FAILED
  )
  const suspendedNumbers = allNumbers.filter(
    (n) => n.status === WhatsAppNumberStatusValue.SUSPENDED
  )

  const primaryActiveNumber =
    livingNumbers.find(
      (n) => n.status === WhatsAppNumberStatusValue.ACTIVE && n.is_default
    ) ??
    livingNumbers.find((n) => n.status === WhatsAppNumberStatusValue.ACTIVE) ??
    livingNumbers[0] ??
    null

  const resyncConfig = useResyncWhatsAppConfig()
  const syncNumberCatalog = useSyncWhatsAppNumberCatalog()

  const layoutPresetId = useLayoutPresetId()
  const showOrderNotificationsTab = layoutPresetId === "restaurant"

  const [localSettings, setLocalSettings] = useState<Partial<GoSettings>>({
    display_name: "",
    welcome_message: "",
    fallback_message: "",
    tone: "professional",
    ai_enabled: true,
    qr_ordering_enabled: false,
    human_handoff_enabled: false,
    show_powered_by_cloove: true,
    ai_instructions: "",
    business_info: "",
    faq: "",
    restricted_topics: "",
    operating_hours: "",
    delivery_info: "",
    return_policy: "",
    agent_profile: "commerce",
    capabilities_overrides: null,
    order_notifications: DEFAULT_ORDER_NOTIFICATIONS,
  })

  type SettingsTab = "connections" | "general" | "notifications" | "ai"
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTab>("connections")
  const [showManualConnect, setShowManualConnect] = useState(false)
  const resolvedSettingsTab: SettingsTab =
    !showOrderNotificationsTab && activeSettingsTab === "notifications"
      ? "general"
      : activeSettingsTab
  const [manualConnectAlert, setManualConnectAlert] = useState<{
    tone: "success" | "warning"
    message: string
  } | null>(null)
  const [embeddedConfig, setEmbeddedConfig] = useState<EmbeddedSignupRuntimeConfig>({
    embeddedEnabled: true,
    isConfigured: false,
    error: null,
  })
  const [embeddedConfigLoaded, setEmbeddedConfigLoaded] = useState(false)

  const [isDirty, setIsDirty] = useState(false)
  const [showAddAnother, setShowAddAnother] = useState(false)

  useEffect(() => {
    onSavingChange?.(updateGoSettings.isPending)
  }, [updateGoSettings.isPending, onSavingChange])

  useEffect(() => {
    if (goSettingsData) {
      const s = goSettingsData as GoSettings
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalSettings({
        display_name: s.display_name ?? "",
        welcome_message: s.welcome_message ?? "",
        fallback_message: s.fallback_message ?? "",
        tone: s.tone ?? "professional",
        ai_enabled: s.ai_enabled ?? true,
        qr_ordering_enabled: s.qr_ordering_enabled ?? false,
        human_handoff_enabled: s.human_handoff_enabled ?? false,
        show_powered_by_cloove: s.show_powered_by_cloove ?? true,
        ai_instructions: s.ai_instructions ?? "",
        business_info: s.business_info ?? "",
        faq: s.faq ?? "",
        restricted_topics: s.restricted_topics ?? "",
        operating_hours: s.operating_hours ?? "",
        delivery_info: s.delivery_info ?? "",
        return_policy: s.return_policy ?? "",
        agent_profile: s.agent_profile ?? "commerce",
        capabilities_overrides: s.capabilities_overrides ?? null,
        order_notifications: mergeOrderNotifications(s.order_notifications),
      })
      setIsDirty(false)
      onDirtyChange?.(false)
    }
  }, [goSettingsData, onDirtyChange])

  useEffect(() => {
    if (saveTrigger && saveTrigger > 0 && isDirty) {
      const { capabilities_overrides, ...rest } = localSettings
      updateGoSettings.mutate({
        ...rest,
        capabilities: capabilities_overrides ?? null,
      })
    }
  }, [saveTrigger])

  useEffect(() => {
    let cancelled = false
    const loadEmbeddedConfig = async () => {
      try {
        const response = await fetch("/api/meta/embedded-signup-config", { cache: "no-store" })
        const data = (await response.json()) as EmbeddedSignupRuntimeConfig
        if (!cancelled) {
          setEmbeddedConfig({
            embeddedEnabled: data.embeddedEnabled !== false,
            isConfigured: data.isConfigured === true,
            error: data.error ?? null,
          })
          setEmbeddedConfigLoaded(true)
        }
      } catch {
        if (!cancelled) {
          setEmbeddedConfig({
            embeddedEnabled: true,
            isConfigured: false,
            error: "We could not load the Meta connection options right now.",
          })
          setEmbeddedConfigLoaded(true)
        }
      }
    }

    loadEmbeddedConfig()
    return () => {
      cancelled = true
    }
  }, [])

  const handleChange = (key: keyof GoSettings, value: unknown) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }))
    setIsDirty(true)
    onDirtyChange?.(true)
  }

  const handleGenerateContent = async (
    field: GoSettingsContentField,
    prompt: string,
    currentValue: string
  ) => {
    const result = await generateContent.mutateAsync({
      field,
      prompt,
      current_value: currentValue,
      store_id: localSettings.store_id ?? null,
    })
    return result.content
  }

  const handleManualReconnectSuccess = ({ warning }: { warning?: string | null }) =>
    setManualConnectAlert({
      tone: warning ? "warning" : "success",
      message: warning || "WhatsApp connection saved successfully.",
    })

  if (!hasWhitelabelWhatsapp) {
    return (
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-brand-gold/20 bg-white p-8 shadow-sm dark:bg-slate-950/40 md:p-10">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-gold/10 text-brand-gold">
            <MessageSquare className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-brand-deep dark:text-brand-cream">
              WhatsApp white-label is a paid business add-on
            </h2>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-brand-deep/60 dark:text-brand-cream/60">
              Free and trial access do not include WhatsApp number setup. Purchase the WhatsApp add-on in Billing to
              connect and manage a branded business number for this workspace.
            </p>
          </div>
          <Button
            asChild
            className="h-auto min-h-14 rounded-[1.4rem] bg-brand-deep px-5 py-3 text-brand-gold-300 shadow-[0_18px_40px_rgba(11,61,46,0.18)] transition-all hover:-translate-y-0.5 hover:bg-brand-deep/92 hover:text-brand-gold-200 hover:shadow-[0_22px_44px_rgba(11,61,46,0.22)] dark:bg-brand-gold-700 dark:text-white dark:shadow-[0_18px_40px_rgba(245,158,11,0.18)] dark:hover:bg-brand-gold-800"
          >
            <a
              href="/settings?tab=billing&addon=whatsapp_whitelabel_number"
              className="inline-flex items-center gap-4"
            >
              <span className="text-left">
                <span className="block text-base font-semibold leading-none">Unlock WhatsApp in Billing</span>
                <span className="mt-1 block text-xs font-medium uppercase tracking-[0.18em] text-brand-gold-300/75 dark:text-brand-deep/70">
                  Business add-on
                </span>
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gold-300/15 text-brand-gold-300 dark:bg-brand-deep/10 dark:text-brand-deep">
                <ChevronRight className="h-4 w-4" />
              </span>
            </a>
          </Button>
        </div>
      </div>
    )
  }

  if (numbersLoading || settingsLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    )
  }

  const isGeneralAvailable =
    !!primaryActiveNumber && primaryActiveNumber.status === WhatsAppNumberStatusValue.ACTIVE
  const tabBorder =
    "pb-3 text-sm font-medium transition-colors relative shrink-0 whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50"

  return (
    <div className="min-w-0 max-w-4xl space-y-6 pb-16">
      <div className="sticky top-[calc(var(--subscription-banner-offset,0px)+12rem)] z-10 -mx-4 border-b border-slate-200 bg-background md:top-28 md:mx-0 dark:border-slate-800">
       <div className="scrollbar-none flex min-w-0 flex-nowrap gap-x-6 overflow-x-auto px-4 pt-2 md:px-0">
        <button
          onClick={() => setActiveSettingsTab("connections")}
          className={`${tabBorder} ${
            resolvedSettingsTab === "connections"
              ? "text-brand-deep dark:text-brand-cream"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <Plug className="w-4 h-4" />
            Connections
          </div>
          {resolvedSettingsTab === "connections" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-deep dark:bg-brand-cream rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => isGeneralAvailable && setActiveSettingsTab("general")}
          disabled={!isGeneralAvailable}
          className={`${tabBorder} ${
            resolvedSettingsTab === "general"
              ? "text-brand-deep dark:text-brand-cream"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            General Settings
          </div>
          {resolvedSettingsTab === "general" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-deep dark:bg-brand-cream rounded-t-full" />
          )}
        </button>
        {showOrderNotificationsTab && (
          <button
            onClick={() => isGeneralAvailable && setActiveSettingsTab("notifications")}
            disabled={!isGeneralAvailable}
            className={`${tabBorder} ${
              resolvedSettingsTab === "notifications"
                ? "text-brand-deep dark:text-brand-cream"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Order notifications
            </div>
            {resolvedSettingsTab === "notifications" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-deep dark:bg-brand-cream rounded-t-full" />
            )}
          </button>
        )}
        <button
          onClick={() => isGeneralAvailable && setActiveSettingsTab("ai")}
          disabled={!isGeneralAvailable}
          className={`${tabBorder} ${
            resolvedSettingsTab === "ai"
              ? "text-brand-deep dark:text-brand-cream"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            AI Assistant
          </div>
          {resolvedSettingsTab === "ai" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-deep dark:bg-brand-cream rounded-t-full" />
          )}
        </button>
       </div>
      </div>

      <div className="mt-6">
        {resolvedSettingsTab === "connections" && (
          <div className="space-y-4">
            {livingNumbers.length + suspendedNumbers.length > 0 && (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => resyncConfig.mutate()}
                  disabled={resyncConfig.isPending}
                  className="rounded-full"
                >
                  {resyncConfig.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Resync All
                </Button>
              </div>
            )}

            {livingNumbers.length === 0 && suspendedNumbers.length === 0 ? (
              <SettingsCard>
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                  <div className="space-y-2 sm:max-w-xl">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                        <MessageSquare className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                          Connect WhatsApp
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-300">
                          Sign in with Meta and choose the business number Cloove should manage.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  {embeddedConfig.embeddedEnabled ? (
                    <>
                      <div className="sm:flex-1">
                        <EmbeddedSignupButton showStatusMessage={false} />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 rounded-full sm:flex-1"
                        onClick={() => setShowManualConnect((prev) => !prev)}
                      >
                        {showManualConnect ? "Hide manual setup" : "Connect manually"}
                      </Button>
                    </>
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-300">
                      Embedded Meta form is disabled. Use manual setup below.
                    </p>
                  )}
                </div>
                <EmbeddedSignupConfigNotice
                  config={embeddedConfig}
                  isLoaded={embeddedConfigLoaded}
                  className="mt-3"
                />
                {(!embeddedConfig.embeddedEnabled || showManualConnect) && (
                  <div className="mt-6 border-t border-slate-100 pt-6 dark:border-slate-800/60">
                    <ConnectWhatsAppForm
                      onSuccess={({ warning }) => {
                        setShowManualConnect(false)
                        handleManualReconnectSuccess({ warning })
                      }}
                    />
                  </div>
                )}
              </SettingsCard>
            ) : (
              <>
                {livingNumbers.map((number) => (
                  <div key={number.id}>
                    <NumberStatusPoller number={number} />
                    <ConnectedNumberCard
                      number={number}
                      embeddedConfig={embeddedConfig}
                      embeddedConfigLoaded={embeddedConfigLoaded}
                      onDisconnect={() => disconnectNumber.mutate(number.id)}
                      isDisconnecting={
                        disconnectNumber.isPending && disconnectNumber.variables === number.id
                      }
                      onSyncCatalog={() => syncNumberCatalog.mutate(number.id)}
                      isSyncingCatalog={
                        syncNumberCatalog.isPending && syncNumberCatalog.variables === number.id
                      }
                      onManualReconnectSuccess={handleManualReconnectSuccess}
                    />
                  </div>
                ))}
                {suspendedNumbers.map((number) => (
                  <SuspendedNumberCard
                    key={number.id}
                    number={number}
                    embeddedConfig={embeddedConfig}
                    embeddedConfigLoaded={embeddedConfigLoaded}
                    onRestore={() => restoreNumber.mutate(number.id)}
                    isRestoring={
                      restoreNumber.isPending && restoreNumber.variables === number.id
                    }
                    onDelete={() => deleteNumber.mutate(number.id)}
                    isDeleting={
                      deleteNumber.isPending && deleteNumber.variables === number.id
                    }
                    onManualReconnectSuccess={handleManualReconnectSuccess}
                  />
                ))}

                <SettingsCard className="bg-slate-50/60 dark:bg-slate-900/40">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                    <div className="space-y-1">
                      <h3 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
                        <Plus className="h-4 w-4" />
                        Add another number
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-300">
                        Connect an additional WhatsApp number to this business.
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
                      {embeddedConfig.embeddedEnabled && (
                        <EmbeddedSignupButton
                          label="Connect with Meta"
                          containerClassName="w-full sm:w-auto"
                          showStatusMessage={false}
                        />
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 rounded-full"
                        onClick={() => setShowAddAnother((prev) => !prev)}
                      >
                        {showAddAnother ? "Hide form" : "Connect manually"}
                      </Button>
                    </div>
                  </div>
                  <EmbeddedSignupConfigNotice
                    config={embeddedConfig}
                    isLoaded={embeddedConfigLoaded}
                    className="mt-4"
                  />
                  {showAddAnother && (
                    <div className="mt-6 border-t border-slate-100 pt-6 dark:border-slate-800/60">
                      <ConnectWhatsAppForm
                        onSuccess={({ warning }) => {
                          setShowAddAnother(false)
                          handleManualReconnectSuccess({ warning })
                        }}
                      />
                    </div>
                  )}
                </SettingsCard>
              </>
            )}

            {manualConnectAlert ? (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${
                  manualConnectAlert.tone === "warning"
                    ? "border-amber-100 bg-amber-50/80 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
                    : "border-emerald-100 bg-emerald-50/80 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                }`}
              >
                {manualConnectAlert.message}
              </div>
            ) : null}
          </div>
        )}

        {resolvedSettingsTab === "general" && isGeneralAvailable && (
              <div className="space-y-8">
                <section className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-slate-400" />
                    Branding & Messaging
                  </h3>
                  <SettingsCard className="space-y-6">
                    <div className="space-y-2 max-w-xl">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Display Name
                      </label>
                      <Input
                        value={primaryActiveNumber?.display_name ?? ""}
                        disabled
                        className="bg-slate-50 dark:bg-slate-900/50"
                      />
                      <p className="text-sm text-slate-500 dark:text-slate-300">
                        Managed on Meta. Update your verified name in your WhatsApp Business settings.
                      </p>
                    </div>

                    <div className="space-y-2 max-w-xl">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Conversation Tone
                      </label>
                      <Select
                        value={localSettings.tone ?? "professional"}
                        onValueChange={(v) => handleChange("tone", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TONE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800/60 space-y-6">
                      <SettingTextarea
                        label="Welcome Message"
                        placeholder="Sent to customers on their first message"
                        value={localSettings.welcome_message ?? ""}
                        onChange={(v) => handleChange("welcome_message", v)}
                        rows={3}
                        markdown
                        aiField="welcome_message"
                        onGenerateAI={handleGenerateContent}
                      />

                      <SettingTextarea
                        label="Fallback Message"
                        placeholder="Sent when AI is disabled or unavailable"
                        value={localSettings.fallback_message ?? ""}
                        onChange={(v) => handleChange("fallback_message", v)}
                        rows={2}
                        markdown
                        aiField="fallback_message"
                        onGenerateAI={handleGenerateContent}
                      />
                    </div>
                  </SettingsCard>
                </section>

                <AgentProfileSection
                  profile={localSettings.agent_profile ?? "commerce"}
                  overrides={localSettings.capabilities_overrides ?? null}
                  onProfileChange={(profile) => handleChange("agent_profile", profile)}
                  onOverridesChange={(overrides) =>
                    handleChange("capabilities_overrides", overrides)
                  }
                />

                <section className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-slate-400" />
                    Features
                  </h3>
                  <SettingsCard className="space-y-0 divide-y divide-slate-100 dark:divide-slate-800/60 p-0">
                    <div className="px-3 py-3.5 sm:px-5 sm:py-5">
                      <SettingToggle
                        label="AI Assistant"
                        description="Let AI handle customer conversations automatically."
                        checked={localSettings.ai_enabled ?? true}
                        onChange={(v) => handleChange("ai_enabled", v)}
                      />
                    </div>
                    <div className="px-3 py-3.5 sm:px-5 sm:py-5">
                      <SettingToggle
                        label="QR Code Ordering"
                        description="Allow customers to scan a QR code to start ordering."
                        checked={localSettings.qr_ordering_enabled ?? false}
                        onChange={(v) => handleChange("qr_ordering_enabled", v)}
                      />
                    </div>
                    <div className="px-3 py-3.5 sm:px-5 sm:py-5">
                      <SettingToggle
                        label="Human Handoff"
                        description="Transfer conversations to a human when AI cannot help."
                        checked={localSettings.human_handoff_enabled ?? false}
                        onChange={(v) => handleChange("human_handoff_enabled", v)}
                      />
                    </div>
                    <div className="px-3 py-3.5 sm:px-5 sm:py-5">
                      <SettingToggle
                        label='Show "Powered by Cloove"'
                        description="Display Cloove branding in AI responses."
                        checked={localSettings.show_powered_by_cloove ?? true}
                        onChange={(v) => handleChange("show_powered_by_cloove", v)}
                      />
                    </div>
                  </SettingsCard>
                </section>
              </div>
            )}

        {resolvedSettingsTab === "notifications" && isGeneralAvailable && (
          <div className="space-y-8">
            <OrderNotificationsCard
              settings={mergeOrderNotifications(localSettings.order_notifications)}
              onChange={(settings) => handleChange("order_notifications", settings)}
            />
          </div>
        )}

        {resolvedSettingsTab === "ai" && isGeneralAvailable && (
              <div className="space-y-8">
                <section className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                    AI Personality
                  </h3>
                  <SettingsCard className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    <div className="pb-6">
                      <SettingTextarea
                        label="Custom Instructions"
                        placeholder="Tell the AI how to behave. E.g. 'Always greet customers by name', 'Recommend our combo deals', 'Upsell drinks with food orders'..."
                        value={localSettings.ai_instructions ?? ""}
                        onChange={(v) => handleChange("ai_instructions", v)}
                        rows={4}
                        hint="These instructions shape how your AI assistant interacts with customers."
                        markdown
                        aiField="ai_instructions"
                        onGenerateAI={handleGenerateContent}
                      />
                    </div>

                    <div className="pt-6">
                      <SettingTextarea
                        label="About Your Business"
                        placeholder="Describe what your business does, your story, what makes you unique. The AI will use this to answer customer questions."
                        value={localSettings.business_info ?? ""}
                        onChange={(v) => handleChange("business_info", v)}
                        rows={4}
                        markdown
                        aiField="business_info"
                        onGenerateAI={handleGenerateContent}
                      />
                    </div>
                  </SettingsCard>
                </section>

                <section className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                    Business Knowledge
                  </h3>
                  <SettingsCard className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    <div className="pb-6">
                      <OperatingHoursBuilder
                        label="Operating Hours"
                        value={localSettings.operating_hours ?? ""}
                        onChange={(v) => handleChange("operating_hours", v)}
                        description="Used by WhatsApp AI when customers ask if you are open or when they need availability guidance."
                      />
                    </div>

                    <div className="py-6">
                      <SettingTextarea
                        label="Delivery Information"
                        placeholder="Delivery areas, fees, estimated times, minimum orders..."
                        value={localSettings.delivery_info ?? ""}
                        onChange={(v) => handleChange("delivery_info", v)}
                        rows={3}
                        markdown
                        aiField="delivery_info"
                        onGenerateAI={handleGenerateContent}
                      />
                    </div>

                    <div className="py-6">
                      <SettingTextarea
                        label="Return & Refund Policy"
                        placeholder="Your return window, conditions, refund process..."
                        value={localSettings.return_policy ?? ""}
                        onChange={(v) => handleChange("return_policy", v)}
                        rows={3}
                        markdown
                        aiField="return_policy"
                        onGenerateAI={handleGenerateContent}
                      />
                    </div>

                    <div className="pt-6">
                      <SettingTextarea
                        label="Frequently Asked Questions"
                        placeholder="Q: Do you offer gift wrapping? A: Yes, we offer complimentary gift wrapping on all orders."
                        value={localSettings.faq ?? ""}
                        onChange={(v) => handleChange("faq", v)}
                        rows={6}
                        hint="Write Q&A pairs so the AI can answer common questions accurately."
                        markdown
                        aiField="faq"
                        onGenerateAI={handleGenerateContent}
                      />
                    </div>
                  </SettingsCard>
                </section>

                <section className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                    Restrictions
                  </h3>
                  <SettingsCard>
                    <SettingTextarea
                      label="Restricted Topics"
                      placeholder="Topics the AI should never discuss. E.g. 'competitor pricing', 'internal staff issues', 'wholesale rates'..."
                      value={localSettings.restricted_topics ?? ""}
                      onChange={(v) => handleChange("restricted_topics", v)}
                      rows={3}
                      hint="The AI will politely decline and redirect if a customer asks about these."
                      markdown
                      aiField="restricted_topics"
                      onGenerateAI={handleGenerateContent}
                    />
                  </SettingsCard>
                </section>
          </div>
        )}
      </div>
    </div>
  )
}

function SettingsCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-slate-950/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 ${className}`}>
      {children}
    </div>
  )
}

function EmbeddedSignupConfigNotice({
  config,
  isLoaded,
  className = "",
}: {
  config: EmbeddedSignupRuntimeConfig
  isLoaded: boolean
  className?: string
}) {
  if (!isLoaded) return null

  const isDisabled = !config.embeddedEnabled
  const message = isDisabled
    ? "Connect with Meta is not available for your business right now. You can still add your WhatsApp number manually."
    : !config.isConfigured && config.error
      ? `${config.error} You can still add your WhatsApp number manually.`
      : null

  if (!message) return null

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm leading-6 ${
        isDisabled
          ? "border-amber-100 bg-amber-50/80 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
          : "border-red-100 bg-red-50/80 text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
      } ${className}`}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{message}</p>
    </div>
  )
}

function NumberStatusPoller({ number }: { number: WhatsAppNumber }) {
  const enabled =
    number.status === WhatsAppNumberStatusValue.PENDING ||
    number.status === WhatsAppNumberStatusValue.VERIFYING
  useWhatsAppNumberStatus(number.id, enabled)
  return null
}

function OrderNotificationsCard({
  settings,
  onChange,
}: {
  settings: OrderNotificationsSettings
  onChange: (settings: OrderNotificationsSettings) => void
}) {
  const stages = Object.keys(ORDER_STAGE_LABELS) as RestaurantOrderStage[]
  const update = (next: Partial<OrderNotificationsSettings>) => onChange({ ...settings, ...next })
  const updateRestaurant = (next: Partial<OrderNotificationsSettings["restaurant"]>) =>
    onChange({ ...settings, restaurant: { ...settings.restaurant, ...next } })
  const updateStage = (
    stage: RestaurantOrderStage,
    next: Partial<OrderNotificationsSettings["restaurant"]["stage_messages"][RestaurantOrderStage]>
  ) =>
    updateRestaurant({
      stage_messages: {
        ...settings.restaurant.stage_messages,
        [stage]: { ...settings.restaurant.stage_messages[stage], ...next },
      },
    })
  const updatePreset = (id: string, field: "label" | "body", value: string) =>
    updateRestaurant({
      manual_presets: settings.restaurant.manual_presets.map((preset) =>
        preset.id === id ? { ...preset, [field]: value } : preset
      ),
    })

  const { businessName } = useBusiness()

  return (
    <section className="space-y-4">
      <h3 className="flex items-center gap-2 text-lg font-medium text-slate-900 dark:text-slate-100">
        <MessageSquare className="h-5 w-5 text-slate-400" />
        Order Notifications
      </h3>
      <SettingsCard className="space-y-6">
        <SettingToggle
          label="Restaurant order updates"
          description="Send short WhatsApp updates when kitchen orders move through stages."
          checked={settings.enabled}
          onChange={(enabled) => update({ enabled })}
        />

        <div className="border-t border-slate-100 pt-5 dark:border-slate-800/60">
          <SettingToggle
            label="Auto-send stage changes"
            description="Kitchen movement stays fast; WhatsApp message will be sent automatically."
            checked={settings.restaurant.auto_send_on_stage_change}
            onChange={(auto_send_on_stage_change) =>
              updateRestaurant({ auto_send_on_stage_change })
            }
          />
        </div>

        <div className="grid gap-3">
          {stages.map((stage) => {
            const message = settings.restaurant.stage_messages[stage]
            return (
              <div
                key={stage}
                className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800/70"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 pr-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {ORDER_STAGE_LABELS[stage]}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      {ORDER_STAGE_MESSAGE_HINTS[stage]} Use the braces button in the message toolbar or type{" "}
                      <kbd className="rounded border border-slate-200 bg-slate-50 px-1 font-mono text-[10px] text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {"{"}
                      </kbd>{" "}
                      to drop in names, totals, and other order details automatically.
                    </p>
                  </div>
                  <div className="shrink-0 pt-0.5">
                    <Switch
                      checked={message.enabled}
                      onCheckedChange={(enabled) => updateStage(stage, { enabled })}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <WhatsAppNotificationMessageInput
                    id={`order-notification-stage-${stage}`}
                    value={message.body}
                    onChange={(body) => updateStage(stage, { body })}
                    previewVariableContext={{
                      ...(businessName.trim() ? { businessName: businessName.trim() } : {}),
                      stage: ORDER_STAGE_LABELS[stage],
                    }}
                    placeholder="Write the message sent for this stage…"
                    minHeight={120}
                    showDefaultFooter={false}
                    className="border-slate-200 bg-white/95 dark:border-slate-800/80 dark:bg-slate-900/50"
                  />
                </div>
              </div>
            )
          })}
        </div>

        <div className="border-t border-slate-100 pt-5 dark:border-slate-800/60">
          <div className="mb-3">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Manual quick messages
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-300">
              Staff can pick one from an order or kitchen card, edit it, then send.
            </p>
          </div>
          <div className="grid gap-3">
            {settings.restaurant.manual_presets.map((preset) => (
              <div
                key={preset.id}
                className="grid gap-2 rounded-2xl border border-slate-100 p-4 dark:border-slate-800/70"
              >
                <Input
                  value={preset.label}
                  onChange={(event) => updatePreset(preset.id, "label", event.target.value)}
                  className="bg-white dark:bg-slate-900/50"
                />
                <WhatsAppNotificationMessageInput
                  id={`order-notification-preset-${preset.id}`}
                  value={preset.body}
                  onChange={(body) => updatePreset(preset.id, "body", body)}
                  previewVariableContext={
                    businessName.trim() ? { businessName: businessName.trim() } : undefined
                  }
                  placeholder="Preset message body…"
                  minHeight={120}
                  showDefaultFooter={false}
                  className="border-slate-200 bg-white/95 dark:border-slate-800/80 dark:bg-slate-900/50"
                />
              </div>
            ))}
          </div>
        </div>
      </SettingsCard>
    </section>
  )
}

function WhatsAppCatalogPanel({
  catalog,
  number,
  isSyncing,
  onSync,
}: {
  catalog: WhatsAppCatalogStatus | null
  number: WhatsAppNumber
  isSyncing: boolean
  onSync: () => void
}) {
  const status = catalog?.sync_status ?? WhatsAppCatalogSyncStatus.PENDING
  const isFailed = status === WhatsAppCatalogSyncStatus.FAILED
  const isProvisioning =
    number.status === WhatsAppNumberStatusValue.PENDING ||
    number.status === WhatsAppNumberStatusValue.VERIFYING
  const isRunning =
    isSyncing ||
    status === WhatsAppCatalogSyncStatus.SYNCING ||
    (status === WhatsAppCatalogSyncStatus.PENDING && isProvisioning)
  const lastSynced = formatCatalogSyncTime(catalog?.last_synced_at)
  const summary = catalog
    ? buildCatalogSummary(catalog, lastSynced)
    : isProvisioning
      ? "Catalog setup will begin after Meta finishes provisioning your number."
      : "Catalog setup is ready. Start sync once Meta permissions are in place."
  const hasCatalog = !!catalog
  const shouldShowBootstrapError = !hasCatalog || status === WhatsAppCatalogSyncStatus.FAILED
  const errorMessage =
    (isFailed && catalog?.last_error) ||
    (shouldShowBootstrapError ? number.catalog_bootstrap_error : null)
  const customerErrorMessage = errorMessage ? buildCatalogErrorMessage(errorMessage) : null
  const canSync = !isProvisioning && !isRunning
  const showCatalogStats = !!catalog && !isFailed

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">
        WhatsApp Catalog
      </h2>
      <SettingsCard className="space-y-4 border-brand-green-100/80 bg-linear-to-br from-brand-green-50/80 via-white to-brand-gold-50/45 p-4 shadow-sm dark:border-brand-green-700/30 dark:from-brand-deep-950/80 dark:via-slate-950/80 dark:to-brand-green-950/50 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <PackageCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  Cloove Product Catalog
                </p>
                <CatalogStatusBadge status={status} />
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant={isFailed ? "default" : "outline"}
            onClick={onSync}
            disabled={!canSync}
            className="h-11 w-full shrink-0 rounded-full px-5 sm:w-auto"
          >
            {isRunning ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {isFailed ? "Retry" : "Sync Now"}
          </Button>
        </div>
        <div className="space-y-2.5">
          {showCatalogStats ? (
            <CatalogSyncStats catalog={catalog} lastSynced={lastSynced} />
          ) : (
            <p className="text-sm leading-6 text-slate-500 dark:text-slate-300">
              {summary}
            </p>
          )}
          {customerErrorMessage ? (
            <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50/80 px-4 py-3 text-sm leading-6 text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="space-y-1">
                <p className="font-medium">Catalog setup needs attention</p>
                <p>{customerErrorMessage}</p>
              </div>
            </div>
          ) : null}
        </div>
      </SettingsCard>
    </section>
  )
}

function buildCatalogSummary(catalog: WhatsAppCatalogStatus, lastSynced: string): string {
  const hasProducts = catalog.products_count > 0

  if (catalog.sync_status === WhatsAppCatalogSyncStatus.FAILED) {
    return hasProducts
      ? `Catalog sync was interrupted. ${catalog.synced_products_count} of ${catalog.products_count} products were synced. Last checked: ${lastSynced}.`
      : "Catalog sync has not completed yet. Retry when your Meta catalog access is ready."
  }

  if (!hasProducts) {
    return catalog.last_synced_at
      ? `No products were available to sync. Last checked: ${lastSynced}.`
      : "No products have been synced yet."
  }

  return `${catalog.synced_products_count} of ${catalog.products_count} products synced. Last sync: ${lastSynced}.`
}

function buildCatalogErrorMessage(errorMessage: string): string {
  const normalizedError = errorMessage.trim()
  const metaStatusMatch = normalizedError.match(/\b(?:failed|error):\s*(\d{3})\b/i)
  const metaStatus = metaStatusMatch?.[1]

  if (metaStatus) {
    return `Meta could not finish creating your product catalog. Retry the setup, and if it still fails, check that your Meta Business account has catalog permissions.`
  }

  return normalizedError
}

function formatCatalogSyncTime(dateString?: string | null): string {
  if (!dateString) return "Not synced yet"

  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return "Not synced yet"

  const datePart = date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
  const timePart = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })

  return `${datePart} at ${timePart}`
}

function CatalogSyncStats({
  catalog,
  lastSynced,
}: {
  catalog: WhatsAppCatalogStatus
  lastSynced: string
}) {
  const additionalOptionVariants = Math.max(catalog.variants_count - catalog.products_count, 0)
  const syncedAdditionalOptionVariants = Math.min(
    Math.max(catalog.synced_variants_count - catalog.synced_products_count, 0),
    additionalOptionVariants
  )
  const hasProducts = catalog.products_count > 0

  if (!hasProducts) {
    return (
      <p className="text-sm leading-6 text-slate-500 dark:text-slate-300">
        No products have been synced yet.
      </p>
    )
  }

  return (
    <div className="space-y-2.5">
      <div className="grid gap-2 sm:grid-cols-2">
        <CatalogStat
          label="Products synced"
          value={`${catalog.synced_products_count}/${catalog.products_count}`}
          description="Customer-facing items available in WhatsApp"
        />
        <CatalogStat
          label="Product options"
          value={
            additionalOptionVariants > 0
              ? `${syncedAdditionalOptionVariants}/${additionalOptionVariants}`
              : "None"
          }
          description={
            additionalOptionVariants > 0
              ? "Additional selectable variants, excluding default product rows"
              : "No extra options beyond the default product rows"
          }
        />
      </div>
      <p className="text-xs leading-4 text-slate-500 dark:text-slate-400">
        Last sync: {lastSynced}
      </p>
    </div>
  )
}

function CatalogStat({
  label,
  value,
  description,
}: {
  label: string
  value: string
  description: string
}) {
  return (
    <div className="rounded-2xl border border-brand-green-100/70 bg-white px-4 py-2.5 shadow-[0_1px_0_rgba(11,61,46,0.03)] dark:border-brand-green-800/35 dark:bg-slate-950/55">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
        {value}
      </p>
      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </div>
  )
}

function CatalogStatusBadge({ status }: { status: WhatsAppCatalogStatus["sync_status"] }) {
  const styles: Record<WhatsAppCatalogSyncStatus, string> = {
    [WhatsAppCatalogSyncStatus.PENDING]: "text-amber-700 dark:text-amber-300",
    [WhatsAppCatalogSyncStatus.SYNCING]: "text-blue-700 dark:text-blue-300",
    [WhatsAppCatalogSyncStatus.SYNCED]: "text-emerald-700 dark:text-emerald-300",
    [WhatsAppCatalogSyncStatus.FAILED]: "text-red-700 dark:text-red-300",
  }
  const labels: Record<WhatsAppCatalogSyncStatus, string> = {
    [WhatsAppCatalogSyncStatus.PENDING]: "Pending",
    [WhatsAppCatalogSyncStatus.SYNCING]: "Syncing",
    [WhatsAppCatalogSyncStatus.SYNCED]: "Synced",
    [WhatsAppCatalogSyncStatus.FAILED]: "Failed",
  }
  const icons: Record<WhatsAppCatalogSyncStatus, React.ElementType> = {
    [WhatsAppCatalogSyncStatus.PENDING]: Clock,
    [WhatsAppCatalogSyncStatus.SYNCING]: Loader2,
    [WhatsAppCatalogSyncStatus.SYNCED]: CheckCircle2,
    [WhatsAppCatalogSyncStatus.FAILED]: AlertCircle,
  }
  const Icon = icons[status]

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${styles[status]}`}>
      <Icon className={`h-3.5 w-3.5 ${status === WhatsAppCatalogSyncStatus.SYNCING ? "animate-spin" : ""}`} />
      {labels[status]}
    </span>
  )
}

function SettingToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-2.5 sm:items-center sm:gap-5">
      <div className="min-w-0 flex-1 space-y-0.5 pr-2">
        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{label}</span>
        <p className="text-sm leading-snug text-slate-500 dark:text-slate-300">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="shrink-0" />
    </div>
  )
}

function ConnectedNumberCard({
  number,
  embeddedConfig,
  embeddedConfigLoaded,
  onDisconnect,
  isDisconnecting,
  onSyncCatalog,
  isSyncingCatalog,
  onManualReconnectSuccess,
}: {
  number: WhatsAppNumber
  embeddedConfig: EmbeddedSignupRuntimeConfig
  embeddedConfigLoaded: boolean
  onDisconnect: () => void
  isDisconnecting: boolean
  onSyncCatalog: () => void
  isSyncingCatalog: boolean
  onManualReconnectSuccess: (payload: { warning?: string | null }) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [showManualReconnect, setShowManualReconnect] = useState(false)
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false)
  const [logsOpen, setLogsOpen] = useState(false)
  const { data: catalog } = useWhatsAppNumberCatalogStatus(number)
  const checkStatus = useCheckWhatsAppNumberStatus()
  const isPending =
    number.status === WhatsAppNumberStatusValue.PENDING ||
    number.status === WhatsAppNumberStatusValue.VERIFYING
  const config = STATUS_CONFIG[number.status] ?? STATUS_CONFIG[WhatsAppNumberStatusValue.FAILED]
  const StatusIcon = config.icon
  const phoneLabel = getWhatsAppPhoneLabel(number)
  const displayName = getWhatsAppDisplayName(number)
  const effectiveCatalog =
    catalog ??
    (number.catalog_bootstrap_status
      ? {
          id: "catalog-bootstrap",
          business_id: number.business_id,
          whatsapp_number_id: number.id,
          waba_id: number.waba_id ?? "",
          meta_catalog_id: "",
          sync_status: number.catalog_bootstrap_status,
          last_synced_at: null,
          last_error: number.catalog_bootstrap_error,
          products_count: 0,
          synced_products_count: 0,
          variants_count: 0,
          synced_variants_count: 0,
        }
      : null)
  const catalogValue = effectiveCatalog
    ? effectiveCatalog.sync_status === WhatsAppCatalogSyncStatus.FAILED
      ? "Needs attention"
      : effectiveCatalog.sync_status === WhatsAppCatalogSyncStatus.SYNCED
        ? "Synced"
        : "Provisioning"
    : "Not connected"

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center gap-3 p-5 text-left hover:bg-slate-50/60 dark:hover:bg-slate-900/40"
        aria-expanded={isOpen}
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10">
          <Phone className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
              {phoneLabel}
            </p>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.color} bg-slate-100 dark:bg-slate-800`}
              title={config.label}
            >
              {isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <StatusIcon className="h-3 w-3" />
              )}
              {config.label}
            </span>
            {number.is_default && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Default
              </span>
            )}
            <span className="rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
              {number.connection_mode === "embedded" ? "Embedded" : "Manual"}
            </span>
          </div>
          {displayName && (
            <p className="truncate text-sm text-slate-500 dark:text-slate-300">
              {displayName}
            </p>
          )}
        </div>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="space-y-5 border-t border-slate-100 p-5 dark:border-slate-800/80">
          <p className="font-mono text-xs text-slate-400 dark:text-slate-500">
            Phone Number ID: {number.phone_number_id}
            {number.waba_id ? ` · WABA: ${number.waba_id}` : ""}
            {number.app_id ? ` · App: ${number.app_id}` : ""}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 sm:divide-x sm:divide-slate-200/80 dark:sm:divide-slate-800">
            <StatusMetric
              label="Connection"
              value={isPending ? "Waiting on Meta" : "Managed by Cloove"}
            />
            <StatusMetric label="Catalog" value={catalogValue} />
          </div>

          {isPending && (
            <div className="rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-sm leading-6 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
              We’re waiting for Meta to finish provisioning this number. Catalog sync stays paused until that completes.
            </div>
          )}

          {number.status === WhatsAppNumberStatusValue.FAILED && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50/80 p-4 dark:border-red-500/20 dark:bg-red-500/10">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
              <p className="text-sm leading-6 text-red-800 dark:text-red-300">
                Verification failed. Check the logs below and reconnect with Meta after fixing the issue.
              </p>
            </div>
          )}

          <div className="space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800/80">
            <p className="text-sm leading-6 text-slate-500 dark:text-slate-300">
              {number.connection_mode === "embedded"
                ? "Use a fresh Meta connection if you need to switch numbers or grant new permissions."
                : "Update config to change only the IDs or credentials you want."}
            </p>
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => checkStatus.mutate(number.id)}
                disabled={checkStatus.isPending && checkStatus.variables === number.id}
                className="h-10 w-full justify-center rounded-full sm:w-auto"
              >
                {checkStatus.isPending && checkStatus.variables === number.id ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Check status
              </Button>
              {number.connection_mode === "manual" ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowManualReconnect((prev) => !prev)}
                  className="h-10 w-full justify-center rounded-full sm:w-auto"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {showManualReconnect ? "Hide config form" : "Update Config"}
                </Button>
              ) : (
                <EmbeddedSignupButton
                  label="Connect Again"
                  containerClassName="w-full sm:w-auto"
                  showStatusMessage={false}
                  className="h-10 w-full justify-center rounded-full border border-slate-200 bg-white px-4 text-slate-900 hover:bg-slate-50 sm:w-auto dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                  icon={RefreshCw}
                />
              )}
              {number.verification_logs_count > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setLogsOpen(true)}
                  className="h-10 w-full rounded-full px-4 text-slate-600 hover:text-slate-900 sm:w-auto dark:text-slate-300 dark:hover:text-white"
                >
                  Logs ({number.verification_logs_count})
                </Button>
              )}
              {number.status !== WhatsAppNumberStatusValue.PENDING &&
                number.status !== WhatsAppNumberStatusValue.VERIFYING &&
                !showDisconnectConfirm ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDisconnectConfirm(true)}
                  className="h-10 w-full rounded-full px-4 text-red-600 hover:bg-red-50 hover:text-red-700 sm:ml-auto sm:w-auto dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  <Unplug className="mr-2 h-4 w-4" />
                  Disconnect
                </Button>
              ) : null}
            </div>
            {number.connection_mode === "embedded" ? (
              <EmbeddedSignupConfigNotice
                config={embeddedConfig}
                isLoaded={embeddedConfigLoaded}
                className="mt-3"
              />
            ) : null}
            {number.connection_mode === "manual" && showManualReconnect ? (
              <div className="mt-3 rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
                <ConnectWhatsAppForm
                  mode="update"
                  initialNumber={number}
                  onSuccess={({ warning }) => {
                    setShowManualReconnect(false)
                    onManualReconnectSuccess({ warning })
                  }}
                />
              </div>
            ) : null}
          </div>

          <WhatsAppNumberLogsSheet
            open={logsOpen}
            onOpenChange={setLogsOpen}
            number={number}
          />

          {number.status !== WhatsAppNumberStatusValue.PENDING &&
            number.status !== WhatsAppNumberStatusValue.VERIFYING &&
            showDisconnectConfirm && (
              <div className="flex flex-col gap-4 rounded-2xl border border-red-100 bg-red-50/80 p-4 dark:border-red-500/20 dark:bg-red-500/10 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
                  <p className="text-sm leading-6 text-red-800 dark:text-red-300">
                    Disconnect this number only if you want Cloove to stop handling messages for it.
                  </p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-start">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowDisconnectConfirm(false)}
                    className="w-full rounded-full text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 sm:w-auto dark:text-slate-300 dark:hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setShowDisconnectConfirm(false)
                      onDisconnect()
                    }}
                    disabled={isDisconnecting}
                    className="w-full rounded-full bg-red-600 text-white shadow-sm hover:bg-red-700 sm:w-auto"
                  >
                    {isDisconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Disconnect"}
                  </Button>
                </div>
              </div>
            )}

          <div className="border-t border-slate-100 pt-5 dark:border-slate-800/80">
            <WhatsAppCatalogPanel
              catalog={effectiveCatalog}
              number={number}
              isSyncing={isSyncingCatalog}
              onSync={onSyncCatalog}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function StatusMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
        {value}
      </p>
    </div>
  )
}

function SuspendedNumberCard({
  number,
  embeddedConfig,
  embeddedConfigLoaded,
  onRestore,
  isRestoring,
  onDelete,
  isDeleting,
  onManualReconnectSuccess,
}: {
  number: WhatsAppNumber
  embeddedConfig: EmbeddedSignupRuntimeConfig
  embeddedConfigLoaded: boolean
  onRestore: () => void
  isRestoring: boolean
  onDelete: () => void
  isDeleting: boolean
  onManualReconnectSuccess: (payload: { warning?: string | null }) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [showManualReconnect, setShowManualReconnect] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const phoneLabel = getWhatsAppPhoneLabel(number)
  const displayName = getWhatsAppDisplayName(number)

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center gap-3 p-5 text-left hover:bg-slate-50/60 dark:hover:bg-slate-900/40"
        aria-expanded={isOpen}
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
          <Phone className="h-5 w-5 text-slate-400" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
              {phoneLabel}
            </p>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <AlertCircle className="h-3 w-3" />
              Disconnected
            </span>
            <span className="rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
              {number.connection_mode === "embedded" ? "Embedded" : "Manual"}
            </span>
          </div>
          {displayName && (
            <p className="truncate text-sm text-slate-500 dark:text-slate-300">
              {displayName}
            </p>
          )}
        </div>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="space-y-4 border-t border-slate-100 p-5 dark:border-slate-800/80">
          <div className="flex flex-col gap-3 rounded-lg border border-amber-100 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10 sm:flex-row sm:items-center">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="flex-1 text-sm text-amber-800 dark:text-amber-300">
              This number is disconnected. Reconnect to resume AI messaging.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {number.connection_mode === "embedded" ? (
              <EmbeddedSignupButton
                label="Reconnect"
                containerClassName="w-full sm:w-auto"
                showStatusMessage={false}
                className="h-10 rounded-full bg-brand-deep px-4 text-brand-cream hover:bg-brand-deep/90"
                icon={RotateCcw}
              />
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowManualReconnect((prev) => !prev)}
                className="h-10 rounded-full"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                {showManualReconnect ? "Hide config form" : "Update config"}
              </Button>
            )}
            <Button
              onClick={onRestore}
              disabled={isRestoring}
              className="h-10 rounded-full bg-brand-deep text-brand-cream shadow-sm hover:bg-brand-deep/90"
            >
              {isRestoring ? <Loader2 className="h-4 w-4 animate-spin" /> : "Restore"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowDeleteConfirm(true)}
              className="h-10 rounded-full text-red-600 hover:bg-red-50 hover:text-red-700 sm:ml-auto dark:text-red-400 dark:hover:bg-red-500/10"
            >
              Delete
            </Button>
          </div>
          {number.connection_mode === "embedded" ? (
            <EmbeddedSignupConfigNotice
              config={embeddedConfig}
              isLoaded={embeddedConfigLoaded}
            />
          ) : null}
          {number.connection_mode !== "embedded" && showManualReconnect ? (
            <div className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
              <ConnectWhatsAppForm
                mode="update"
                initialNumber={number}
                onSuccess={({ warning }) => {
                  setShowManualReconnect(false)
                  onManualReconnectSuccess({ warning })
                }}
              />
            </div>
          ) : null}
        </div>
      )}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={onDelete}
        title="Delete disconnected number?"
        description="This removes this WhatsApp number from Cloove. You can reconnect it later if needed."
        confirmText="Delete Number"
        isLoading={isDeleting}
      />
    </div>
  )
}

function SettingTextarea({
  label,
  placeholder,
  value,
  onChange,
  rows = 3,
  hint,
  markdown = false,
  aiField,
  onGenerateAI,
}: {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  rows?: number
  hint?: string
  markdown?: boolean
  aiField?: GoSettingsContentField
  onGenerateAI?: (
    field: GoSettingsContentField,
    prompt: string,
    currentValue: string
  ) => Promise<string>
}) {
  return (
    <div className="space-y-2 max-w-3xl">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      {markdown ? (
        <MarkdownEditor
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          minHeight={`${rows * 28}px`}
          onGenerateAI={
            aiField && onGenerateAI
              ? (prompt, currentValue) => onGenerateAI(aiField, prompt, currentValue)
              : undefined
          }
        />
      ) : (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="bg-white dark:bg-slate-900/50"
        />
      )}
      {hint && (
        <p className="text-sm text-slate-500 dark:text-slate-300">{hint}</p>
      )}
    </div>
  )
}
