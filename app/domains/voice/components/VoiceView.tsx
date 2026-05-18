"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/app/components/ui/button"
import {
    Drawer,
    DrawerBody,
    DrawerContent,
    DrawerDescription,
    DrawerStickyHeader,
    DrawerTitle,
} from "@/app/components/ui/drawer"
import { Input } from "@/app/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Switch } from "@/app/components/ui/switch"
import { Textarea } from "@/app/components/ui/textarea"
import { GlassCard } from "@/app/components/ui/glass-card"
import { cn } from "@/app/lib/utils"
import { ManagementHeader } from "@/app/components/shared/ManagementHeader"
import { serializeSchedule, createDefaultSchedule } from "@/app/components/shared/OperatingHoursBuilder"
import { PersistedTabs, type TabItem } from "@/app/components/shared/PersistedTabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog"
import { VoiceNumberCard } from "@/app/domains/voice/components/VoiceNumberCard"
import { VoiceOutboundCallComposer } from "@/app/domains/voice/components/VoiceOutboundCallComposer"
import { VoiceProviderCredentialsForm } from "@/app/domains/voice/components/VoiceProviderCredentialsForm"
import { VoiceTransferTargetsForm } from "@/app/domains/voice/components/VoiceTransferTargetsForm"
import { VoiceAgentSettingsForm } from "@/app/domains/voice/components/VoiceAgentSettingsForm"
import {
    AudioLines,
    Headphones,
    Loader2,
    PanelsTopLeft,
    Phone,
    PhoneCall,
    PhoneForwarded,
    Settings2,
    ShieldCheck,
} from "lucide-react"
import {
    useCreateVoiceNumber,
    useCreateVoiceTransferTarget,
    useDeleteVoiceTransferTarget,
    useDisconnectVoiceNumber,
    useStartVoiceCall,
    useUpdateVoiceNumber,
    useUpdateVoiceSettings,
    useVoiceCalls,
    useVoiceHealth,
    useVoiceNumbers,
    useVoiceProviders,
    useVoiceSettings,
    useVoiceTransferTargets,
    type VoiceCall,
    type VoiceNumberItem,
} from "@/app/domains/voice/hooks/useVoice"

const EMPTY_SETTINGS = {
    display_name: "",
    greeting_message: "",
    fallback_message: "",
    voicemail_message: "",
    language: "en-NG",
    tone: "professional",
    ai_enabled: true,
    recording_enabled: true,
    transcription_enabled: true,
    human_handoff_enabled: true,
    after_hours_enabled: true,
    disclosure_enabled: true,
    business_info: "",
    ai_instructions: "",
    restricted_topics: "",
    operating_hours: "",
}

const LANGUAGE_OPTIONS = [
    { value: "en-NG", label: "English (Nigeria)" },
    { value: "en-KE", label: "English (Kenya)" },
    { value: "en-GH", label: "English (Ghana)" },
    { value: "fr-FR", label: "French" },
    { value: "sw-KE", label: "Swahili" },
]

const TONE_OPTIONS = [
    { value: "professional", label: "Professional" },
    { value: "warm", label: "Warm" },
    { value: "concise", label: "Concise" },
    { value: "supportive", label: "Supportive" },
]

const GREETING_PRESETS = [
    {
        id: "standard",
        label: "Standard welcome",
        build: (name: string) =>
            `Hello, you've reached ${name || "our team"}. I'm the voice assistant. How can I help you today?`,
    },
    {
        id: "support",
        label: "Support desk",
        build: (name: string) =>
            `Welcome to ${name || "our support team"}. I can help with common questions or connect you to a staff member if needed.`,
    },
    {
        id: "afterhours",
        label: "After hours",
        build: (name: string) =>
            `Thanks for calling ${name || "our business"}. We're currently outside live support hours, but I can take your request and arrange a follow-up.`,
    },
]

const FALLBACK_PRESETS = [
    {
        id: "retry",
        label: "Retry prompt",
        text: "I didn't catch that clearly. Please say your request again, or ask for a staff member.",
    },
    {
        id: "handoff",
        label: "Escalation prompt",
        text: "I can connect you to a staff member now, or take a message for a callback.",
    },
    {
        id: "voicemail",
        label: "Callback capture",
        text: "Please share your name, phone number, and reason for calling, and our team will get back to you.",
    },
]

const EMPTY_NUMBER_FORM = {
    provider: "africas_talking",
    label: "",
    phone_number: "",
    provider_credentials: {} as Record<string, string>,
    use_system_credentials: true,
    is_default: true,
}

const EMPTY_TARGET_FORM = {
    label: "",
    role_label: "support",
    phone_number: "",
    priority: 0,
    is_fallback: false,
}

const EMPTY_CALL_FORM = {
    business_voice_number_id: "",
    customer_phone: "",
    customer_name: "",
    purpose: "",
    context: "",
}

function formatDuration(value: number | null) {
    if (!value) return "—"
    const minutes = Math.floor(value / 60)
    const seconds = value % 60
    return `${minutes}:${String(seconds).padStart(2, "0")}`
}

function numberToForm(number: VoiceNumberItem) {
    return {
        provider: number.provider,
        label: number.label ?? "",
        phone_number: number.phone_number,
        provider_credentials: {} as Record<string, string>,
        use_system_credentials: number.use_system_credentials,
        is_default: number.is_default,
    }
}

function buildNumberUpdatePayload(form: typeof EMPTY_NUMBER_FORM) {
    const payload: Record<string, unknown> = {
        label: form.label.trim() || null,
        provider: form.provider,
        use_system_credentials: form.use_system_credentials,
        is_default: form.is_default,
    }

    const credentials = Object.fromEntries(
        Object.entries(form.provider_credentials).filter(([, value]) => value.trim().length > 0)
    )

    if (Object.keys(credentials).length > 0) {
        payload.provider_credentials = credentials
    }

    return payload
}

export function VoiceView() {
    const providersQuery = useVoiceProviders()
    const numbersQuery = useVoiceNumbers()
    const settingsQuery = useVoiceSettings()
    const targetsQuery = useVoiceTransferTargets()
    const callsQuery = useVoiceCalls()
    const healthQuery = useVoiceHealth()

    const createNumber = useCreateVoiceNumber()
    const updateNumber = useUpdateVoiceNumber()
    const disconnectNumber = useDisconnectVoiceNumber()
    const updateSettings = useUpdateVoiceSettings()
    const createTarget = useCreateVoiceTransferTarget()
    const deleteTarget = useDeleteVoiceTransferTarget()
    const startCall = useStartVoiceCall()

    const [selectedCall, setSelectedCall] = useState<VoiceCall | null>(null)
    const voiceTabs: TabItem[] = [
        { id: "overview", label: "Overview", icon: PanelsTopLeft },
        { id: "calls", label: "Calls", icon: AudioLines },
        { id: "transfer", label: "Transfer", icon: PhoneForwarded },
        { id: "settings", label: "Settings", icon: Settings2 },
    ]
    const [activeTab, setActiveTab] = useState("overview")
    const [numberDrawerMode, setNumberDrawerMode] = useState<"closed" | "create" | "edit">("closed")
    const [editingNumberId, setEditingNumberId] = useState<string | null>(null)
    const [numberForm, setNumberForm] = useState(EMPTY_NUMBER_FORM)
    const [targetForm, setTargetForm] = useState(EMPTY_TARGET_FORM)
    const [callForm, setCallForm] = useState(EMPTY_CALL_FORM)
    const [settingsForm, setSettingsForm] = useState(EMPTY_SETTINGS)

    const businessDisplayName = settingsForm.display_name.trim()

    useEffect(() => {
        if (settingsQuery.data) {
            setSettingsForm({
                display_name: settingsQuery.data.display_name ?? "",
                greeting_message: settingsQuery.data.greeting_message ?? "",
                fallback_message: settingsQuery.data.fallback_message ?? "",
                voicemail_message: settingsQuery.data.voicemail_message ?? "",
                language: settingsQuery.data.language ?? "en-NG",
                tone: settingsQuery.data.tone ?? "professional",
                ai_enabled: settingsQuery.data.ai_enabled ?? true,
                recording_enabled: settingsQuery.data.recording_enabled ?? true,
                transcription_enabled: settingsQuery.data.transcription_enabled ?? true,
                human_handoff_enabled: settingsQuery.data.human_handoff_enabled ?? true,
                after_hours_enabled: settingsQuery.data.after_hours_enabled ?? true,
                disclosure_enabled: settingsQuery.data.disclosure_enabled ?? true,
                business_info: settingsQuery.data.business_info ?? "",
                ai_instructions: settingsQuery.data.ai_instructions ?? "",
                restricted_topics: settingsQuery.data.restricted_topics ?? "",
                operating_hours:
                    settingsQuery.data.operating_hours ?? serializeSchedule(createDefaultSchedule()),
            })
        }
    }, [settingsQuery.data])

    const metrics = useMemo(() => {
        const calls = callsQuery.data ?? []
        const transferred = calls.filter((call) => call.transfer_status && call.transfer_status !== "not_requested").length
        const completed = calls.filter((call) => call.status === "completed" || call.status === "transferred").length
        return {
            total: calls.length,
            transferred,
            completed,
        }
    }, [callsQuery.data])

    const providerOptions = useMemo(
        () => (providersQuery.data ?? []).filter((provider) => provider.is_enabled),
        [providersQuery.data]
    )
    const providerMap = useMemo(
        () => new Map(providerOptions.map((provider) => [provider.id, provider])),
        [providerOptions]
    )
    const selectedProvider = providerMap.get(numberForm.provider) ?? providerOptions[0]
    const editingNumber = useMemo(
        () => (numbersQuery.data ?? []).find((number) => number.id === editingNumberId) ?? null,
        [editingNumberId, numbersQuery.data]
    )
    const isNumberDrawerOpen = numberDrawerMode !== "closed"

    const closeNumberDrawer = () => {
        setNumberDrawerMode("closed")
        setEditingNumberId(null)
        setNumberForm(EMPTY_NUMBER_FORM)
    }

    const openCreateNumberDrawer = () => {
        setEditingNumberId(null)
        setNumberForm(EMPTY_NUMBER_FORM)
        setNumberDrawerMode("create")
    }

    const openEditNumberDrawer = (number: VoiceNumberItem) => {
        setEditingNumberId(number.id)
        setNumberForm(numberToForm(number))
        setNumberDrawerMode("edit")
    }

    const handleSaveNumber = () => {
        if (numberDrawerMode === "edit" && editingNumber) {
            updateNumber.mutate(
                { id: editingNumber.id, payload: buildNumberUpdatePayload(numberForm) },
                { onSuccess: closeNumberDrawer }
            )
            return
        }

        createNumber.mutate(numberForm, { onSuccess: closeNumberDrawer })
    }

    const isLoading =
        providersQuery.isPending ||
        numbersQuery.isPending ||
        settingsQuery.isPending ||
        targetsQuery.isPending ||
        callsQuery.isPending ||
        healthQuery.isPending

    useEffect(() => {
        if (!providerOptions.length) return

        setNumberForm((prev) => {
            const hasSelectedProvider = providerMap.has(prev.provider)
            const fallbackProviderId =
                providerOptions.find((provider) => provider.is_default)?.id ?? providerOptions[0]?.id ?? prev.provider
            const nextProviderId = hasSelectedProvider ? prev.provider : fallbackProviderId
            const nextProvider = providerMap.get(nextProviderId) ?? providerOptions[0]
            const nextUseSystemCredentials = nextProvider?.system_credentials_enabled
                ? prev.use_system_credentials
                : false

            if (
                nextProviderId === prev.provider &&
                nextUseSystemCredentials === prev.use_system_credentials
            ) {
                return prev
            }

            return {
                ...prev,
                provider: nextProviderId,
                provider_credentials: hasSelectedProvider ? prev.provider_credentials : {},
                use_system_credentials: nextUseSystemCredentials,
            }
        })
    }, [providerMap, providerOptions])

    return (
        <div className="space-y-8">
            <ManagementHeader
                title="Voice"
                description="Manage call handling, outbound calls, transfers, recordings, and transcripts."
            />

            <PersistedTabs
                tabs={voiceTabs}
                activeTab={activeTab}
                onChange={setActiveTab}
                defaultTab="overview"
                queryParamName="voiceTab"
                orientation="horizontal"
            />

            {activeTab === "overview" && (
                <>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <MetricCard icon={PhoneCall} label="Recent calls" value={String(metrics.total)} />
                        <MetricCard icon={PhoneForwarded} label="Transferred" value={String(metrics.transferred)} />
                        <MetricCard icon={ShieldCheck} label="Pending events" value={String(healthQuery.data?.pending_events ?? 0)} />
                        <MetricCard icon={PhoneCall} label="Active now" value={String(healthQuery.data?.active_calls ?? 0)} />
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                        <VoiceOutboundCallComposer
                            form={callForm}
                            numbers={numbersQuery.data ?? []}
                            isPending={startCall.isPending}
                            onChange={(updater) => setCallForm((prev) => updater(prev))}
                            onSubmit={() =>
                                startCall.mutate(
                                    {
                                        ...callForm,
                                        business_voice_number_id: callForm.business_voice_number_id || null,
                                    },
                                    { onSuccess: () => setCallForm(EMPTY_CALL_FORM) }
                                )
                            }
                        />

                        <GlassCard className="p-6 space-y-4">
                            <div className="flex items-start justify-between gap-4">
                                <SectionTitle icon={Headphones} title="Voice numbers" />
                                <Drawer
                                    open={isNumberDrawerOpen}
                                    onOpenChange={(open) => {
                                        if (!open) closeNumberDrawer()
                                    }}
                                >
                                    <Button type="button" className="rounded-full" onClick={openCreateNumberDrawer}>
                                        Connect number
                                    </Button>
                                    <DrawerContent>
                                        <DrawerStickyHeader>
                                            <DrawerTitle className="font-sans text-xl font-semibold tracking-normal text-foreground">
                                                {numberDrawerMode === "edit" ? "Edit voice number" : "Connect voice number"}
                                            </DrawerTitle>
                                            <DrawerDescription>
                                                {numberDrawerMode === "edit"
                                                    ? "Update how this line appears in Cloove and refresh provider credentials if needed."
                                                    : "Add a provider-backed calling number for inbound and outbound AI calls."}
                                            </DrawerDescription>
                                        </DrawerStickyHeader>
                                        <DrawerBody>
                                            <VoiceProviderCredentialsForm
                                                form={numberForm}
                                                providerOptions={providerOptions}
                                                selectedProvider={selectedProvider}
                                                mode={numberDrawerMode === "edit" ? "update" : "create"}
                                                isPending={createNumber.isPending || updateNumber.isPending}
                                                framed={false}
                                                onChange={(updater) => setNumberForm((prev) => updater(prev))}
                                                onSubmit={handleSaveNumber}
                                            />
                                        </DrawerBody>
                                    </DrawerContent>
                                </Drawer>
                            </div>
                            <div className="space-y-3">
                                {(numbersQuery.data ?? []).length === 0 ? (
                                    <VoiceNumbersEmptyState onConnect={openCreateNumberDrawer} />
                                ) : (
                                    (numbersQuery.data ?? []).map((number) => (
                                        <VoiceNumberCard
                                            key={number.id}
                                            number={number}
                                            provider={providerMap.get(number.provider)}
                                            isUpdating={
                                                updateNumber.isPending && updateNumber.variables?.id === number.id
                                            }
                                            isDisconnecting={
                                                disconnectNumber.isPending &&
                                                disconnectNumber.variables === number.id
                                            }
                                            onEdit={() => openEditNumberDrawer(number)}
                                            onSetDefault={() =>
                                                updateNumber.mutate({
                                                    id: number.id,
                                                    payload: { is_default: true },
                                                })
                                            }
                                            onReconnect={() =>
                                                updateNumber.mutate({
                                                    id: number.id,
                                                    payload: { status: "active" },
                                                })
                                            }
                                            onDisconnect={() => disconnectNumber.mutate(number.id)}
                                        />
                                    ))
                                )}
                            </div>
                        </GlassCard>
                    </div>
                </>
            )}

            {activeTab === "transfer" && (
                <VoiceTransferTargetsForm
                    targets={targetsQuery.data ?? []}
                    form={targetForm}
                    isCreatePending={createTarget.isPending}
                    onFormChange={(updater) => setTargetForm((prev) => updater(prev))}
                    onCreate={() =>
                        createTarget.mutate(targetForm, {
                            onSuccess: () => setTargetForm(EMPTY_TARGET_FORM),
                        })
                    }
                    onDelete={(id) => deleteTarget.mutate(id)}
                />
            )}

            {activeTab === "settings" && (
                <div className="max-w-4xl">
                    <VoiceAgentSettingsForm
                        settings={settingsForm}
                        businessDisplayName={businessDisplayName}
                        languageOptions={LANGUAGE_OPTIONS}
                        toneOptions={TONE_OPTIONS}
                        greetingPresets={GREETING_PRESETS}
                        fallbackPresets={FALLBACK_PRESETS}
                        isPending={updateSettings.isPending}
                        onChange={(updater) => setSettingsForm((prev) => updater(prev))}
                        onSubmit={() => updateSettings.mutate(settingsForm)}
                    />
                </div>
            )}

            {activeTab === "calls" && (
                <GlassCard className="p-6 space-y-5">
                    <div className="flex items-center justify-between gap-4">
                        <SectionTitle icon={Headphones} title="Recent calls" />
                        {!isLoading && (callsQuery.data ?? []).length > 0 ? (
                            <span className="text-sm text-muted-foreground">
                                {(callsQuery.data ?? []).length} {(callsQuery.data ?? []).length === 1 ? "call" : "calls"}
                            </span>
                        ) : null}
                    </div>
                    {isLoading ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading voice activity...
                        </div>
                    ) : (callsQuery.data ?? []).length === 0 ? (
                        <p className="text-sm text-muted-foreground">No calls logged yet.</p>
                    ) : (
                        <div className="overflow-x-auto -mx-2">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="text-left text-[13px] font-medium text-slate-500 dark:text-slate-400">
                                        <th className="px-2 pb-2 font-medium">Customer</th>
                                        <th className="px-2 pb-2 font-medium">Direction</th>
                                        <th className="px-2 pb-2 font-medium">Status</th>
                                        <th className="px-2 pb-2 font-medium">Duration</th>
                                        <th className="px-2 pb-2 font-medium">Created</th>
                                        <th className="px-2 pb-2"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(callsQuery.data ?? []).map((call) => (
                                        <tr
                                            key={call.id}
                                            className="border-t border-slate-100 transition-colors hover:bg-slate-50/60 dark:border-white/[0.06] dark:hover:bg-white/[0.02]"
                                        >
                                            <td className="px-2 py-3.5">
                                                <div className="font-medium text-slate-900 dark:text-slate-100">
                                                    {call.customer_name || "Unknown caller"}
                                                </div>
                                                <div className="mt-0.5 font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                                                    {call.customer_phone || "—"}
                                                </div>
                                            </td>
                                            <td className="px-2 py-3.5">
                                                <CallDirectionLabel direction={call.direction} />
                                            </td>
                                            <td className="px-2 py-3.5">
                                                <CallStatusBadge status={call.status} />
                                            </td>
                                            <td className="px-2 py-3.5 font-mono text-[13px] tabular-nums text-slate-700 dark:text-slate-300">
                                                {formatDuration(call.duration_seconds)}
                                            </td>
                                            <td className="px-2 py-3.5 text-slate-600 dark:text-slate-400">
                                                {new Date(call.created_at).toLocaleString(undefined, {
                                                    month: "short",
                                                    day: "numeric",
                                                    hour: "numeric",
                                                    minute: "2-digit",
                                                })}
                                            </td>
                                            <td className="px-2 py-3.5 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setSelectedCall(call)}
                                                    className="h-8 rounded-md px-2.5 text-[13px] font-medium text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-slate-100"
                                                >
                                                    Open
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </GlassCard>
            )}

            <Dialog open={!!selectedCall} onOpenChange={(open) => !open && setSelectedCall(null)}>
                <DialogContent className="max-w-2xl rounded-3xl!">
                    <DialogHeader>
                        <DialogTitle>Call details</DialogTitle>
                    </DialogHeader>
                    {selectedCall && (
                        <div className="space-y-6">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                                <span className="font-medium text-slate-900 dark:text-slate-100">
                                    {selectedCall.customer_name || "Unknown caller"}
                                </span>
                                {selectedCall.customer_phone ? (
                                    <>
                                        <span aria-hidden className="text-slate-300 dark:text-slate-600">·</span>
                                        <span className="font-mono text-[13px] tabular-nums text-slate-600 dark:text-slate-300">
                                            {selectedCall.customer_phone}
                                        </span>
                                    </>
                                ) : null}
                                <span aria-hidden className="text-slate-300 dark:text-slate-600">·</span>
                                <CallDirectionLabel direction={selectedCall.direction} />
                                <span aria-hidden className="text-slate-300 dark:text-slate-600">·</span>
                                <span className="text-slate-500 dark:text-slate-400">
                                    {new Date(selectedCall.created_at).toLocaleString(undefined, {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                        hour: "numeric",
                                        minute: "2-digit",
                                    })}
                                </span>
                            </div>

                            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl border border-slate-200/70 bg-slate-50/50 px-5 py-4 dark:border-white/10 dark:bg-white/[0.02] sm:grid-cols-4">
                                <CallDataRow label="Status">
                                    <CallStatusBadge status={selectedCall.status} />
                                </CallDataRow>
                                <CallDataRow label="Duration">
                                    <span className="font-mono text-sm tabular-nums text-slate-900 dark:text-slate-100">
                                        {formatDuration(selectedCall.duration_seconds)}
                                    </span>
                                </CallDataRow>
                                <CallDataRow
                                    label="Resolution"
                                    value={humanizeValue(selectedCall.resolution)}
                                />
                                <CallDataRow
                                    label="Transfer"
                                    value={humanizeValue(selectedCall.transfer_status)}
                                />
                            </dl>

                            {selectedCall.summary ? (
                                <CallSection title="Summary">
                                    <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
                                        {selectedCall.summary}
                                    </p>
                                </CallSection>
                            ) : null}

                            {selectedCall.recording_url ? (
                                <CallSection title="Recording">
                                    <audio controls className="w-full" src={selectedCall.recording_url} />
                                </CallSection>
                            ) : null}

                            <CallSection title="Transcript">
                                {(selectedCall.turns ?? []).length === 0 ? (
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        No transcript captured yet.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {(selectedCall.turns ?? []).map((turn) => (
                                            <div
                                                key={turn.id}
                                                className="rounded-lg bg-slate-50 px-4 py-3 dark:bg-white/[0.03]"
                                            >
                                                <div className="text-xs font-medium capitalize text-slate-500 dark:text-slate-400">
                                                    {turn.speaker}
                                                </div>
                                                <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-200">
                                                    {turn.transcript || turn.prompt_text || "—"}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CallSection>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

function SectionTitle({ icon: Icon, title }: { icon: typeof Phone; title: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black/5 dark:bg-white/5">
                <Icon className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold">{title}</h2>
        </div>
    )
}

function MetricCard({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
    return (
        <GlassCard className="p-5">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
                    <p className="mt-2 text-3xl font-semibold">{value}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/5 dark:bg-white/5">
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </GlassCard>
    )
}

function CallDataRow({
    label,
    value,
    children,
}: {
    label: string
    value?: string
    children?: React.ReactNode
}) {
    return (
        <div className="min-w-0">
            <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                {children ?? (value && value.length > 0 ? value : <span className="text-slate-400 dark:text-slate-500">—</span>)}
            </dd>
        </div>
    )
}

function CallSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section>
            <h3 className="mb-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
            {children}
        </section>
    )
}

function humanizeValue(value: string | null | undefined) {
    if (!value) return ""
    const normalized = value.replace(/_/g, " ").trim().toLowerCase()
    if (!normalized || normalized === "not requested") return ""
    return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

function CallDirectionLabel({ direction }: { direction: string }) {
    const normalized = direction.toLowerCase()
    const isOutbound = normalized.includes("outbound")
    return (
        <span className="inline-flex items-center gap-1.5 text-[13px] text-slate-700 dark:text-slate-300">
            <span
                aria-hidden
                className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    isOutbound ? "bg-sky-500" : "bg-violet-500"
                )}
            />
            <span className="capitalize">{normalized.replace(/_/g, " ")}</span>
        </span>
    )
}

function CallStatusBadge({ status }: { status: string }) {
    const normalized = status.toLowerCase()
    const styles: Record<string, string> = {
        completed:
            "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20",
        transferred:
            "bg-sky-50 text-sky-700 ring-sky-100 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/20",
        failed:
            "bg-red-50 text-red-700 ring-red-100 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20",
        missed:
            "bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20",
        in_progress:
            "bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20",
        queued:
            "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-white/5 dark:text-slate-300 dark:ring-white/10",
    }
    const className =
        styles[normalized] ??
        "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-white/5 dark:text-slate-300 dark:ring-white/10"
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-md px-2 py-0.5 text-[12px] font-medium capitalize ring-1 ring-inset",
                className
            )}
        >
            {normalized.replace(/_/g, " ")}
        </span>
    )
}

function VoiceNumbersEmptyState({ onConnect }: { onConnect: () => void }) {
    return (
        <div className="rounded-3xl border border-brand-green-100/80 bg-linear-to-br from-brand-green-50/80 via-white to-brand-gold-50/40 px-5 py-8 text-center shadow-sm dark:border-brand-green-800/30 dark:from-brand-deep-950/80 dark:via-slate-950/80 dark:to-brand-green-950/50 sm:px-6 sm:py-9">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-brand-green-100 bg-white shadow-[0_1px_0_rgba(11,61,46,0.04)] dark:border-brand-green-800/40 dark:bg-slate-950/60">
                <Phone className="h-6 w-6 text-brand-green dark:text-emerald-400" />
            </div>
            <h3 className="mt-4 font-serif text-lg text-brand-deep dark:text-brand-cream">
                Connect your first voice line
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-brand-accent/70 dark:text-brand-cream/55">
                Link a business phone number so Cloove can answer inbound calls, place outbound calls, and transfer
                callers to your team when needed.
            </p>
            <ul className="mx-auto mt-5 grid w-full grid-cols-1 gap-2 text-left sm:grid-cols-3">
                <li className="rounded-2xl border border-brand-green-100/70 bg-white px-3 py-2.5 text-xs leading-5 text-brand-deep/80 dark:border-brand-green-800/35 dark:bg-slate-950/55 dark:text-brand-cream/75">
                    <span className="font-medium text-brand-deep dark:text-brand-cream">Inbound AI</span>
                    <span className="mt-0.5 block text-brand-accent/60 dark:text-brand-cream/45">
                        Greet callers and handle common questions
                    </span>
                </li>
                <li className="rounded-2xl border border-brand-green-100/70 bg-white px-3 py-2.5 text-xs leading-5 text-brand-deep/80 dark:border-brand-green-800/35 dark:bg-slate-950/55 dark:text-brand-cream/75">
                    <span className="font-medium text-brand-deep dark:text-brand-cream">Outbound calls</span>
                    <span className="mt-0.5 block text-brand-accent/60 dark:text-brand-cream/45">
                        Reach customers from your business line
                    </span>
                </li>
                <li className="rounded-2xl border border-brand-green-100/70 bg-white px-3 py-2.5 text-xs leading-5 text-brand-deep/80 dark:border-brand-green-800/35 dark:bg-slate-950/55 dark:text-brand-cream/75">
                    <span className="font-medium text-brand-deep dark:text-brand-cream">Live transfer</span>
                    <span className="mt-0.5 block text-brand-accent/60 dark:text-brand-cream/45">
                        Hand off to staff when a human is needed
                    </span>
                </li>
            </ul>
            <Button
                type="button"
                onClick={onConnect}
                className="mt-6 h-11 rounded-full bg-brand-deep px-6 text-brand-gold-300 hover:bg-brand-deep/90 dark:bg-brand-gold dark:text-brand-deep dark:hover:bg-brand-gold/90"
            >
                <Phone className="mr-2 h-4 w-4" />
                Connect voice number
            </Button>
        </div>
    )
}
