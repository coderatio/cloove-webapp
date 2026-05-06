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
  Eye,
  EyeOff,
  Save,
  MessageSquare,
  Bot,
  Shield,
  Briefcase
} from "lucide-react"
import {
  useWhatsAppNumbers,
  useWhatsAppNumberStatus,
  useUpdateWhatsAppNumber,
  useDisconnectWhatsAppNumber,
  useRestoreWhatsAppNumber,
  useGoSettings,
  useUpdateGoSettings,
  useGenerateGoSettingsContent,
  type WhatsAppNumber,
  type GoSettings,
  type GoSettingsContentField,
} from "../hooks/useWhatsAppSettings"
import { MarkdownEditor } from "@/app/components/ui/markdown-editor"
import { ConnectWhatsAppForm } from "./ConnectWhatsAppForm"
import { AgentProfileSection } from "./AgentProfileSection"

interface WhatsAppSettingsProps {
  onDirtyChange?: (isDirty: boolean) => void
  onSavingChange?: (isSaving: boolean) => void
  saveTrigger?: number
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  active: { label: "Connected", icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400" },
  pending: { label: "Verifying...", icon: Clock, color: "text-amber-600 dark:text-amber-400" },
  verifying: { label: "Verifying...", icon: Clock, color: "text-amber-600 dark:text-amber-400" },
  failed: { label: "Failed", icon: XCircle, color: "text-red-600 dark:text-red-400" },
  suspended: { label: "Disconnected", icon: AlertCircle, color: "text-slate-500 dark:text-slate-400" },
}

const TONE_OPTIONS = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "formal", label: "Formal" },
  { value: "casual", label: "Casual" },
]

export function WhatsAppSettings({ onDirtyChange, onSavingChange, saveTrigger }: WhatsAppSettingsProps) {
  const { data: numbers, isLoading: numbersLoading } = useWhatsAppNumbers()
  const { data: goSettingsData, isLoading: settingsLoading } = useGoSettings()
  const updateGoSettings = useUpdateGoSettings()
  const generateContent = useGenerateGoSettingsContent()
  const disconnectNumber = useDisconnectWhatsAppNumber()

  const restoreNumber = useRestoreWhatsAppNumber()

  const activeNumber = (numbers as WhatsAppNumber[] | undefined)?.find(
    (n) => n.status === "active" || n.status === "pending" || n.status === "verifying"
  )

  const suspendedNumber = !activeNumber
    ? (numbers as WhatsAppNumber[] | undefined)?.find((n) => n.status === "suspended")
    : undefined

  const isPending = activeNumber?.status === "pending" || activeNumber?.status === "verifying"

  const { data: statusData } = useWhatsAppNumberStatus(
    activeNumber?.id ?? null,
    isPending
  )

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
  })

  const [activeSettingsTab, setActiveSettingsTab] = useState<"general" | "ai">("general")

  const [isDirty, setIsDirty] = useState(false)
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false)

  useEffect(() => {
    onSavingChange?.(updateGoSettings.isPending)
  }, [updateGoSettings.isPending, onSavingChange])

  useEffect(() => {
    if (goSettingsData) {
      const s = goSettingsData as GoSettings
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

  const handleDisconnect = () => {
    if (!activeNumber) return
    disconnectNumber.mutate(activeNumber.id)
    setShowDisconnectConfirm(false)
  }

  if (numbersLoading || settingsLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-8 pb-16">
      {/* Connection Status Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">
          Connection Status
        </h2>

        {!activeNumber && !suspendedNumber ? (
          <ConnectWhatsAppForm />
        ) : activeNumber ? (
          <SettingsCard>
            <ConnectedNumberCard
              number={activeNumber}
              statusData={statusData}
              isPending={isPending}
              showDisconnectConfirm={showDisconnectConfirm}
              onDisconnectClick={() => setShowDisconnectConfirm(true)}
              onDisconnectConfirm={handleDisconnect}
              onDisconnectCancel={() => setShowDisconnectConfirm(false)}
              isDisconnecting={disconnectNumber.isPending}
            />
          </SettingsCard>
        ) : suspendedNumber ? (
          <SettingsCard>
            <SuspendedNumberCard
              number={suspendedNumber}
              onRestore={() => restoreNumber.mutate(suspendedNumber.id)}
              isRestoring={restoreNumber.isPending}
            />
          </SettingsCard>
        ) : null}
      </section>

      {/* Credential editing — show when not yet active so user can fix issues */}
      {activeNumber && activeNumber.status !== "active" && (
        <CredentialEditor number={activeNumber} />
      )}

      {/* Verification logs — show when not active */}
      {activeNumber && activeNumber.status !== "active" && activeNumber.verification_logs.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">
            Verification Log
          </h2>
          <SettingsCard className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
              {[...activeNumber.verification_logs].reverse().map((log, i) => (
                <div key={i} className="flex gap-4 p-4 text-sm">
                  <span className="shrink-0 text-slate-500 tabular-nums w-32">
                    {new Date(log.timestamp).toLocaleString(undefined, {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                  <span
                    className={`shrink-0 w-24 font-medium ${log.outcome === "active"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : log.outcome === "failed" || log.outcome === "unreachable"
                        ? "text-red-600 dark:text-red-400"
                        : "text-amber-600 dark:text-amber-400"
                      }`}
                  >
                    {log.outcome}
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </SettingsCard>
        </section>
      )}

      {/* Settings tabs — only show when number is active */}
      {activeNumber && activeNumber.status === "active" && (
        <div className="pt-4">
          <div className="flex gap-6 border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveSettingsTab("general")}
              className={`pb-3 text-sm font-medium transition-colors relative ${activeSettingsTab === "general"
                ? "text-brand-deep dark:text-brand-cream"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                General Settings
              </div>
              {activeSettingsTab === "general" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-deep dark:bg-brand-cream rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveSettingsTab("ai")}
              className={`pb-3 text-sm font-medium transition-colors relative ${activeSettingsTab === "ai"
                ? "text-brand-deep dark:text-brand-cream"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
            >
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4" />
                AI Assistant
              </div>
              {activeSettingsTab === "ai" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-deep dark:bg-brand-cream rounded-t-full" />
              )}
            </button>
          </div>

          <div className="mt-8">
            {activeSettingsTab === "general" && (
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
                        value={activeNumber?.display_name ?? ""}
                        disabled
                        className="bg-slate-50 dark:bg-slate-900/50"
                      />
                      <p className="text-sm text-slate-500">
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
                    <div className="p-6">
                      <SettingToggle
                        label="AI Assistant"
                        description="Let AI handle customer conversations automatically."
                        checked={localSettings.ai_enabled ?? true}
                        onChange={(v) => handleChange("ai_enabled", v)}
                      />
                    </div>
                    <div className="p-6">
                      <SettingToggle
                        label="QR Code Ordering"
                        description="Allow customers to scan a QR code to start ordering."
                        checked={localSettings.qr_ordering_enabled ?? false}
                        onChange={(v) => handleChange("qr_ordering_enabled", v)}
                      />
                    </div>
                    <div className="p-6">
                      <SettingToggle
                        label="Human Handoff"
                        description="Transfer conversations to a human when AI cannot help."
                        checked={localSettings.human_handoff_enabled ?? false}
                        onChange={(v) => handleChange("human_handoff_enabled", v)}
                      />
                    </div>
                    <div className="p-6">
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

            {activeSettingsTab === "ai" && (
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
                      <SettingTextarea
                        label="Operating Hours"
                        placeholder="E.g. 'Monday–Friday: 9am–6pm, Saturday: 10am–4pm, Sunday: Closed'"
                        value={localSettings.operating_hours ?? ""}
                        onChange={(v) => handleChange("operating_hours", v)}
                        rows={2}
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
      )}
    </div>
  )
}

function SettingsCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-brand-deep/20 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm p-6 ${className}`}>
      {children}
    </div>
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
    <div className="flex items-center justify-between gap-8">
      <div className="space-y-1">
        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{label}</span>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

function ConnectedNumberCard({
  number,
  statusData,
  isPending,
  showDisconnectConfirm,
  onDisconnectClick,
  onDisconnectConfirm,
  onDisconnectCancel,
  isDisconnecting,
}: {
  number: WhatsAppNumber
  statusData: unknown
  isPending: boolean
  showDisconnectConfirm: boolean
  onDisconnectClick: () => void
  onDisconnectConfirm: () => void
  onDisconnectCancel: () => void
  isDisconnecting: boolean
}) {
  const config = STATUS_CONFIG[number.status] ?? STATUS_CONFIG.failed
  const StatusIcon = config.icon

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20">
            <Phone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100 text-lg">
              {number.phone_number}
            </p>
            {number.display_name && (
              <p className="text-sm text-slate-500">
                {number.display_name}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {number.status !== "pending" && number.status !== "verifying" && !showDisconnectConfirm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDisconnectClick}
              className="text-red-600 rounded-full hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10 h-8 px-3"
            >
              <Unplug className="w-4 h-4 mr-2" />
              Disconnect
            </Button>
          )}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 ${config.color}`}>
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <StatusIcon className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">{config.label}</span>
          </div>
        </div>
      </div>

      {isPending && (
        <p className="text-sm text-slate-500 mt-2">
          We&apos;re verifying your number with Meta. This usually takes a few minutes.
        </p>
      )}

      {number.status === "failed" && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 mt-4">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
          <p className="text-sm text-red-800 dark:text-red-300">
            Verification failed. Check the logs below and update your credentials if needed.
          </p>
        </div>
      )}

      {number.status !== "pending" && number.status !== "verifying" && showDisconnectConfirm && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 mt-4">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
          <p className="text-sm text-red-800 dark:text-red-300 flex-1">
            Are you sure? Customers won&apos;t be able to message this number through Cloove.
          </p>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDisconnectCancel}
            className="text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 dark:text-slate-300 dark:hover:text-white"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onDisconnectConfirm}
            disabled={isDisconnecting}
            className="bg-red-600 hover:bg-red-700 text-white shadow-sm"
          >
            {isDisconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Disconnect"}
          </Button>
        </div>
      )}
    </div>
  )
}

function SuspendedNumberCard({
  number,
  onRestore,
  isRestoring,
}: {
  number: WhatsAppNumber
  onRestore: () => void
  isRestoring: boolean
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
            <Phone className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100 text-lg">
              {number.phone_number}
            </p>
            {number.display_name && (
              <p className="text-sm text-slate-500">
                {number.display_name}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Disconnected</span>
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 mt-4">
        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
        <p className="text-sm text-amber-800 dark:text-amber-300 flex-1">
          This number is disconnected. Reconnect to resume AI messaging.
        </p>
        <Button
          onClick={onRestore}
          disabled={isRestoring}
          className="bg-brand-deep text-brand-cream hover:bg-brand-deep/90 shadow-sm shrink-0"
        >
          {isRestoring ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reconnect
            </>
          )}
        </Button>
      </div>
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
        <p className="text-sm text-slate-500">{hint}</p>
      )}
    </div>
  )
}

function CredentialEditor({ number }: { number: WhatsAppNumber }) {
  const updateNumber = useUpdateWhatsAppNumber()
  const [accessToken, setAccessToken] = useState("")
  const [appSecret, setAppSecret] = useState("")
  const [webhookVerifyToken, setWebhookVerifyToken] = useState("")
  const [showToken, setShowToken] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [showVerifyToken, setShowVerifyToken] = useState(false)

  const hasChanges = accessToken.trim() || appSecret.trim() || webhookVerifyToken.trim()

  const handleSave = () => {
    const body: Record<string, string> = {}
    if (accessToken.trim()) body.access_token = accessToken.trim()
    if (appSecret.trim()) body.app_secret = appSecret.trim()
    if (webhookVerifyToken.trim()) body.webhook_verify_token = webhookVerifyToken.trim()

    if (Object.keys(body).length === 0) return

    updateNumber.mutate(
      { id: number.id, ...body },
      {
        onSuccess: () => {
          setAccessToken("")
          setAppSecret("")
          setWebhookVerifyToken("")
        },
      }
    )
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">
        Update Credentials
      </h2>
      <SettingsCard className="space-y-6">
        <p className="text-sm text-slate-500 max-w-2xl">
          If verification is failing, you can update your credentials here. Leave fields empty to keep
          the current value.
        </p>

        <div className="space-y-5 max-w-xl">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Access Token
            </label>
            <div className="relative">
              <Textarea
                value={showToken ? accessToken : accessToken ? "••••••••••" : ""}
                onChange={(e) => setAccessToken(e.target.value)}
                onFocus={() => setShowToken(true)}
                placeholder="Paste new token to replace current"
                rows={2}
                className="pr-10 resize-none font-mono text-sm bg-white dark:bg-slate-900/50"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              App Secret
            </label>
            <div className="relative">
              <Input
                type={showSecret ? "text" : "password"}
                value={appSecret}
                onChange={(e) => setAppSecret(e.target.value)}
                placeholder="Paste new secret to replace current"
                className="pr-10 bg-white dark:bg-slate-900/50"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Webhook Verify Token
            </label>
            <div className="relative">
              <Input
                type={showVerifyToken ? "text" : "password"}
                value={webhookVerifyToken}
                onChange={(e) => setWebhookVerifyToken(e.target.value)}
                placeholder="Paste new verify token to replace current"
                className="pr-10 bg-white dark:bg-slate-900/50"
              />
              <button
                type="button"
                onClick={() => setShowVerifyToken(!showVerifyToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showVerifyToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updateNumber.isPending}
            className="bg-brand-deep text-brand-cream hover:bg-brand-deep/90 shadow-sm"
          >
            {updateNumber.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Update Credentials
          </Button>
        </div>
      </SettingsCard>
    </section>
  )
}
