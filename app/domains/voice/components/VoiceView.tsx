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
import { GlassCard } from "@/app/components/ui/glass-card"
import { cn, formatPhoneNumber } from "@/app/lib/utils"
import { ManagementHeader } from "@/app/components/shared/ManagementHeader"
import { serializeSchedule, createDefaultSchedule } from "@/app/components/shared/OperatingHoursBuilder"
import { Pagination } from "@/app/components/shared/Pagination"
import { PersistedTabs, type TabItem } from "@/app/components/shared/PersistedTabs"
import { TableSearch } from "@/app/components/shared/TableSearch"
import { VoiceCallDetailsDialog } from "@/app/domains/voice/components/VoiceCallDetailsDialog"
import {
    CallDirectionLabel,
    CallStatusBadge,
    CallStatusDot,
    formatCallDuration,
} from "@/app/domains/voice/components/VoiceCallLabels"
import { VoiceNumberCard } from "@/app/domains/voice/components/VoiceNumberCard"
import { VoiceOutboundCallComposer } from "@/app/domains/voice/components/VoiceOutboundCallComposer"
import { VoiceProviderCredentialsForm } from "@/app/domains/voice/components/VoiceProviderCredentialsForm"
import { VoiceNumberRequestDrawer } from "@/app/domains/voice/components/VoiceNumberRequestDrawer"
import { VoiceTransferTargetsForm } from "@/app/domains/voice/components/VoiceTransferTargetsForm"
import { VoiceAgentSettingsForm } from "@/app/domains/voice/components/VoiceAgentSettingsForm"
import { useDebounce } from "@/app/hooks/useDebounce"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/app/components/ui/select"
import {
    AudioLines,
    CheckCircle2,
    ChevronRight,
    Clock,
    FilterX,
    Headphones,
    Inbox,
    Loader2,
    MapPinned,
    PanelsTopLeft,
    Phone,
    PhoneCall,
    PhoneForwarded,
    PhoneIncoming,
    PhoneOutgoing,
    Plus,
    Radio,
    Settings2,
    ShieldCheck,
    XCircle,
} from "lucide-react"
import {
    useCancelVoiceNumberRequest,
    useCreateVoiceNumberRequest,
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
    useVoiceNumberRequests,
    useVoiceProviders,
    useVoiceSettings,
    useVoiceTransferTargets,
    type VoiceCall,
    type VoiceHealth,
    type VoiceNumberItem,
    type VoiceNumberRequestItem,
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
    voice_number_request_id: null as string | null,
    provider_credentials: {} as Record<string, string>,
    use_system_credentials: true,
    is_default: true,
}

const EMPTY_NUMBER_REQUEST_FORM = {
    provider: "africas_talking",
    label: "",
    country_code: "NG",
    notes: "",
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


function numberToForm(number: VoiceNumberItem) {
    return {
        provider: number.provider,
        label: number.label ?? "",
        phone_number: number.phone_number,
        voice_number_request_id: null,
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
    const numberRequestsQuery = useVoiceNumberRequests()
    const settingsQuery = useVoiceSettings()
    const targetsQuery = useVoiceTransferTargets()
    const recentCallsQuery = useVoiceCalls({ page: 1, limit: 100 })
    const healthQuery = useVoiceHealth()

    const createNumber = useCreateVoiceNumber()
    const createNumberRequest = useCreateVoiceNumberRequest()
    const cancelNumberRequest = useCancelVoiceNumberRequest()
    const updateNumber = useUpdateVoiceNumber()
    const disconnectNumber = useDisconnectVoiceNumber()
    const updateSettings = useUpdateVoiceSettings()
    const createTarget = useCreateVoiceTransferTarget()
    const deleteTarget = useDeleteVoiceTransferTarget()
    const startCall = useStartVoiceCall()

    const [selectedCall, setSelectedCall] = useState<VoiceCall | null>(null)
    const voiceTabs: TabItem[] = [
        { id: "overview", label: "Overview", icon: PanelsTopLeft },
        { id: "requests", label: "Requests", icon: PhoneIncoming },
        { id: "calls", label: "Calls", icon: AudioLines },
        { id: "transfer", label: "Transfer", icon: PhoneForwarded },
        { id: "settings", label: "Settings", icon: Settings2 },
    ]
    const [activeTab, setActiveTab] = useState("overview")
    const [requestListTab, setRequestListTab] = useState<"pending" | "ready" | "history">("pending")
    const [callsPage, setCallsPage] = useState(1)
    const [callsSearch, setCallsSearch] = useState("")
    const [callsDirection, setCallsDirection] = useState("all")
    const [callsStatus, setCallsStatus] = useState("all")
    const [numberDrawerMode, setNumberDrawerMode] = useState<"closed" | "create" | "edit">("closed")
    const [requestDrawerOpen, setRequestDrawerOpen] = useState(false)
    const [editingNumberId, setEditingNumberId] = useState<string | null>(null)
    const [numberForm, setNumberForm] = useState(EMPTY_NUMBER_FORM)
    const [numberRequestForm, setNumberRequestForm] = useState(EMPTY_NUMBER_REQUEST_FORM)
    const [targetForm, setTargetForm] = useState(EMPTY_TARGET_FORM)
    const [callForm, setCallForm] = useState(EMPTY_CALL_FORM)
    const [settingsForm, setSettingsForm] = useState(EMPTY_SETTINGS)

    const businessDisplayName = settingsForm.display_name.trim()
    const debouncedCallsSearch = useDebounce(callsSearch, 300)
    const callsQuery = useVoiceCalls({
        page: callsPage,
        limit: 10,
        search: debouncedCallsSearch.trim() || undefined,
        direction: callsDirection === "all" ? undefined : callsDirection,
        status: callsStatus === "all" ? undefined : callsStatus,
    })

    useEffect(() => {
        if (settingsQuery.data) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
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
        const calls = recentCallsQuery.data?.data ?? []
        const transferred = calls.filter((call) => call.transfer_status && call.transfer_status !== "not_requested").length
        const completed = calls.filter((call) => call.status === "completed" || call.status === "transferred").length
        return {
            total: recentCallsQuery.data?.meta.total ?? calls.length,
            transferred,
            completed,
        }
    }, [recentCallsQuery.data])
    const recentCalls = recentCallsQuery.data?.data ?? []
    const calls = callsQuery.data?.data ?? []
    const callsMeta = callsQuery.data?.meta

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
    const approvedRequests = useMemo(
        () => (numberRequestsQuery.data ?? []).filter((request) => request.status === "approved"),
        [numberRequestsQuery.data]
    )
    const pendingRequests = useMemo(
        () => (numberRequestsQuery.data ?? []).filter((request) => request.status === "pending"),
        [numberRequestsQuery.data]
    )
    const historyRequests = useMemo(
        () =>
            (numberRequestsQuery.data ?? []).filter(
                (request) => request.status !== "approved" && request.status !== "pending"
            ),
        [numberRequestsQuery.data]
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

    const handleNumberRequestCreated = () => {
        setRequestDrawerOpen(false)
        setNumberRequestForm(EMPTY_NUMBER_REQUEST_FORM)
        setActiveTab("requests")
        setRequestListTab("pending")
    }

    const openApprovedRequestNumberDrawer = (request: VoiceNumberRequestItem) => {
        setEditingNumberId(null)
        setNumberForm({
            provider: request.provider,
            label: request.label ?? "",
            phone_number: request.approved_phone_number ?? "",
            voice_number_request_id: request.id,
            provider_credentials: {},
            use_system_credentials: true,
            is_default: (numbersQuery.data ?? []).length === 0,
        })
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

    useEffect(() => {
        if (!providerOptions.length) return

        // eslint-disable-next-line react-hooks/set-state-in-effect
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

            <VoiceStatusBar
                health={healthQuery.data}
                isPending={healthQuery.isPending}
            />

            <PersistedTabs
                tabs={voiceTabs}
                activeTab={activeTab}
                onChange={setActiveTab}
                defaultTab="overview"
                queryParamName="voiceTab"
                orientation="horizontal"
            />

            <Drawer
                open={isNumberDrawerOpen}
                onOpenChange={(open) => {
                    if (!open) closeNumberDrawer()
                }}
            >
                <DrawerContent>
                    <DrawerStickyHeader>
                        <DrawerTitle className="font-sans text-xl font-semibold text-foreground">
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

            {activeTab === "overview" && (
                <>
                    <OverviewMetricsStrip
                        items={[
                            {
                                icon: PhoneCall,
                                label: "Recent calls",
                                value: String(metrics.total),
                                tone: "sky",
                            },
                            {
                                icon: PhoneForwarded,
                                label: "Transferred",
                                value: String(metrics.transferred),
                                tone: "amber",
                            },
                            {
                                icon: Inbox,
                                label: "Open calls",
                                value: String(healthQuery.data?.open_calls ?? 0),
                                tone: "slate",
                            },
                            {
                                icon: Radio,
                                label: "Active now",
                                value: String(healthQuery.data?.active_calls ?? 0),
                                tone: "emerald",
                                live: true,
                            },
                        ]}
                    />

                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.75fr)]">
                        <div className="space-y-5">
                            <GlassCard className="rounded-[2rem] border-black/5 p-5 space-y-4 dark:border-white/10">
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <SectionTitle icon={Headphones} title="Voice numbers" />
                                        </div>
                                        <div className="flex shrink-0 items-center gap-2">
                                            <VoiceNumberRequestDrawer
                                                open={requestDrawerOpen}
                                                onOpenChange={setRequestDrawerOpen}
                                                form={numberRequestForm}
                                                providerOptions={providerOptions}
                                                isPending={createNumberRequest.isPending}
                                                onChange={(updater) => setNumberRequestForm((prev) => updater(prev))}
                                                onSubmit={() =>
                                                    createNumberRequest.mutate(numberRequestForm, {
                                                        onSuccess: handleNumberRequestCreated,
                                                    })
                                                }
                                                trigger={
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        aria-label="Request voice number"
                                                        title="Request voice number"
                                                        className="h-10 rounded-full border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-200 dark:hover:bg-slate-900 sm:px-4"
                                                        onClick={() => setRequestDrawerOpen(true)}
                                                    >
                                                        <PhoneIncoming className="h-4 w-4 sm:mr-1.5" />
                                                        <span className="hidden sm:inline">Request</span>
                                                    </Button>
                                                }
                                            />
                                            <Button
                                                type="button"
                                                aria-label="Connect voice number"
                                                title="Connect voice number"
                                                className="h-10 rounded-full bg-brand-deep px-3 text-sm font-medium text-brand-gold-300 shadow-sm hover:bg-brand-deep/92 hover:text-brand-gold-200 dark:bg-brand-gold dark:text-brand-deep dark:hover:bg-brand-gold/92 dark:hover:text-brand-deep sm:px-4"
                                                onClick={openCreateNumberDrawer}
                                            >
                                                <Plus className="h-4 w-4 sm:mr-1.5" />
                                                <span className="hidden sm:inline">Connect</span>
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="max-w-sm text-sm text-muted-foreground">
                                        Connected lines used for inbound and outbound calls.
                                    </p>
                                </div>
                                {approvedRequests.length > 0 ? (
                                    <div className="space-y-3 rounded-[2rem] border border-emerald-200/70 bg-emerald-50/70 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">Approved numbers ready to connect</p>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    Approved requests appear here and feed into the existing connect-number flow.
                                                </p>
                                            </div>
                                            <span className="inline-flex h-9 min-w-fit items-center whitespace-nowrap rounded-full bg-emerald-600 px-4 text-sm font-medium text-white">
                                                {approvedRequests.length} ready
                                            </span>
                                        </div>
                                        <div className="grid gap-3">
                                            {approvedRequests.map((request) => (
                                                <ApprovedNumberRequestCard
                                                    key={request.id}
                                                    request={request}
                                                    providerName={
                                                        providerMap.get(request.provider)?.name ??
                                                        request.provider.replace(/_/g, " ")
                                                    }
                                                    onConnect={() => openApprovedRequestNumberDrawer(request)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
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

                            <GlassCard className="rounded-[2rem] border-black/5 p-5 space-y-4 dark:border-white/10">
                                <div className="flex items-center justify-between gap-4">
                                    <SectionTitle icon={AudioLines} title="Recent activity" />
                                    <span className="text-sm text-muted-foreground">
                                        {metrics.total} {metrics.total === 1 ? "call" : "calls"}
                                    </span>
                                </div>
                                {recentCalls.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-black/10 px-4 py-6 text-center text-sm text-muted-foreground dark:border-white/10">
                                        No call activity yet.
                                    </div>
                                ) : (
                                    <div className="space-y-1.5">
                                        {recentCalls.slice(0, 5).map((call) => {
                                            const isOutbound = call.direction.toLowerCase().includes("outbound")
                                            const DirectionIcon = isOutbound ? PhoneOutgoing : PhoneIncoming
                                            return (
                                                <button
                                                    key={call.id}
                                                    type="button"
                                                    onClick={() => setSelectedCall(call)}
                                                    className="group flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-black/5 px-3 py-3 text-left transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
                                                >
                                                    <div
                                                        className={cn(
                                                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                                                            isOutbound
                                                                ? "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300"
                                                                : "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300"
                                                        )}
                                                        aria-hidden
                                                    >
                                                        <DirectionIcon className="h-4 w-4" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-medium">
                                                            {call.customer_name || formatPhoneNumber(call.customer_phone) || "Unknown caller"}
                                                        </p>
                                                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                                            <CallStatusDot
                                                                status={call.status}
                                                                showLabel={false}
                                                            />
                                                            {call.customer_name && call.customer_phone ? (
                                                                <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                                                                    {formatPhoneNumber(call.customer_phone)}
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                    <div className="shrink-0 text-right">
                                                        {call.duration_seconds ? (
                                                            <p className="font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                                                                {formatCallDuration(call.duration_seconds)}
                                                            </p>
                                                        ) : null}
                                                        <p className="text-xs text-muted-foreground">
                                                            {new Date(call.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <ChevronRight
                                                        className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-slate-500 dark:text-slate-600 dark:group-hover:text-slate-400"
                                                        aria-hidden
                                                    />
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </GlassCard>

                        </div>
                        <div className="space-y-5">
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
                            <GlassCard className="rounded-[2rem] border-black/5 p-5 space-y-4 dark:border-white/10">
                                <SectionTitle icon={ShieldCheck} title="System health" />
                                <div className="space-y-1.5">
                                    <HealthRow
                                        label="Provider"
                                        value={healthQuery.data?.provider_status?.trim() || "Unknown"}
                                        tone={getProviderTone(healthQuery.data?.provider_status)}
                                    />
                                    <HealthRow
                                        label="Unprocessed events"
                                        value={String(healthQuery.data?.unprocessed_events ?? 0)}
                                        tone={(healthQuery.data?.unprocessed_events ?? 0) > 0 ? "amber" : "emerald"}
                                    />
                                    <HealthRow
                                        label="Failed (24h)"
                                        value={String(healthQuery.data?.failed_requests_last_24h ?? 0)}
                                        tone={(healthQuery.data?.failed_requests_last_24h ?? 0) > 0 ? "rose" : "emerald"}
                                    />
                                    <HealthRow
                                        label="Last event"
                                        value={
                                            healthQuery.data?.last_event_at
                                                ? new Date(healthQuery.data.last_event_at).toLocaleString(undefined, {
                                                      month: "short",
                                                      day: "numeric",
                                                      hour: "numeric",
                                                      minute: "2-digit",
                                                  })
                                                : "No recent events"
                                        }
                                        tone="slate"
                                    />
                                </div>
                            </GlassCard>
                        </div>
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
                    isDeletePending={deleteTarget.isPending}
                    onDelete={async (id) => {
                        await deleteTarget.mutateAsync(id)
                    }}
                />
            )}

            {activeTab === "requests" && (
                <GlassCard className="rounded-[2rem] border-black/5 p-5 space-y-5 dark:border-white/10">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <SectionTitle icon={MapPinned} title="Requested numbers" />
                            <p className="mt-2 text-sm text-muted-foreground">
                                Track provisioning requests, connect approved numbers, and review completed requests.
                            </p>
                        </div>
                        <VoiceNumberRequestDrawer
                            open={requestDrawerOpen}
                            onOpenChange={setRequestDrawerOpen}
                            form={numberRequestForm}
                            providerOptions={providerOptions}
                            isPending={createNumberRequest.isPending}
                            onChange={(updater) => setNumberRequestForm((prev) => updater(prev))}
                            onSubmit={() =>
                                createNumberRequest.mutate(numberRequestForm, {
                                    onSuccess: handleNumberRequestCreated,
                                })
                            }
                            trigger={
                                <Button
                                    type="button"
                                    variant="outline"
                                    aria-label="Request voice number"
                                    title="Request voice number"
                                    className="h-11 w-11 shrink-0 rounded-full border-slate-200 bg-white px-0 text-slate-700 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-200 dark:hover:bg-slate-900 sm:w-auto sm:gap-2 sm:px-4"
                                    onClick={() => setRequestDrawerOpen(true)}
                                >
                                    <PhoneIncoming className="h-4.5 w-4.5" />
                                    <span className="hidden sm:inline">Request number</span>
                                </Button>
                            }
                        />
                    </div>

                    {(approvedRequests.length === 0 && pendingRequests.length === 0 && historyRequests.length === 0) ? (
                        <div className="rounded-3xl border border-dashed border-black/10 px-5 py-10 text-center dark:border-white/10">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
                                <PhoneIncoming className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <p className="mt-4 text-sm font-medium text-foreground">No number requests yet</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Submit a provisioning request to have a provider-backed voice number assigned to your business.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="inline-flex w-full max-w-full items-center gap-2 overflow-x-auto rounded-2xl bg-black/[0.03] p-1 dark:bg-white/[0.04]">
                                <RequestInnerTabButton
                                    label="Pending"
                                    count={pendingRequests.length}
                                    isActive={requestListTab === "pending"}
                                    icon={PhoneIncoming}
                                    onClick={() => setRequestListTab("pending")}
                                />
                                <RequestInnerTabButton
                                    label="Ready"
                                    count={approvedRequests.length}
                                    isActive={requestListTab === "ready"}
                                    icon={Phone}
                                    onClick={() => setRequestListTab("ready")}
                                />
                                <RequestInnerTabButton
                                    label="History"
                                    count={historyRequests.length}
                                    isActive={requestListTab === "history"}
                                    icon={ShieldCheck}
                                    onClick={() => setRequestListTab("history")}
                                />
                            </div>

                            {requestListTab === "pending" ? (
                                pendingRequests.length > 0 ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <SectionTitle icon={PhoneIncoming} title="Pending requests" />
                                            <span className="text-sm text-muted-foreground">{pendingRequests.length} pending</span>
                                        </div>
                                        <div className="space-y-2">
                                            {pendingRequests.map((request) => (
                                                <NumberRequestRow
                                                    key={request.id}
                                                    request={request}
                                                    providerName={
                                                        providerMap.get(request.provider)?.name ??
                                                        request.provider.replace(/_/g, " ")
                                                    }
                                                    isCancelling={
                                                        cancelNumberRequest.isPending &&
                                                        cancelNumberRequest.variables === request.id
                                                    }
                                                    onCancel={() => cancelNumberRequest.mutate(request.id)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <RequestTabEmptyState
                                        title="No pending requests"
                                        description="New provisioning requests will appear here while they are waiting for review."
                                    />
                                )
                            ) : null}

                            {requestListTab === "ready" ? (
                                approvedRequests.length > 0 ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <SectionTitle icon={Phone} title="Approved and ready" />
                                            <span className="text-sm text-muted-foreground">{approvedRequests.length} ready</span>
                                        </div>
                                        <div className="grid gap-3">
                                            {approvedRequests.map((request) => (
                                                <ApprovedNumberRequestCard
                                                    key={request.id}
                                                    request={request}
                                                    providerName={
                                                        providerMap.get(request.provider)?.name ??
                                                        request.provider.replace(/_/g, " ")
                                                    }
                                                    onConnect={() => openApprovedRequestNumberDrawer(request)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <RequestTabEmptyState
                                        title="No approved requests"
                                        description="Approved requests will move here when a provider allocates a number and it is ready to connect."
                                    />
                                )
                            ) : null}

                            {requestListTab === "history" ? (
                                historyRequests.length > 0 ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <SectionTitle icon={MapPinned} title="Request history" />
                                            <span className="text-sm text-muted-foreground">{historyRequests.length} listed</span>
                                        </div>
                                        <div className="space-y-2">
                                            {historyRequests.map((request) => (
                                                <NumberRequestRow
                                                    key={request.id}
                                                    request={request}
                                                    providerName={
                                                        providerMap.get(request.provider)?.name ??
                                                        request.provider.replace(/_/g, " ")
                                                    }
                                                    isCancelling={false}
                                                    onCancel={() => undefined}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <RequestTabEmptyState
                                        title="No request history"
                                        description="Completed, cancelled, and rejected requests will appear here."
                                    />
                                )
                            ) : null}
                        </div>
                    )}
                </GlassCard>
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
                <GlassCard className="rounded-[2rem] border-black/5 p-6 space-y-5 dark:border-white/10">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                            <SectionTitle icon={Headphones} title="Recent calls" />
                            <p className="mt-2 text-sm text-muted-foreground">
                                Review past calls, listen to recordings, and read transcripts.
                            </p>
                        </div>
                        {!callsQuery.isPending && (callsMeta?.total ?? 0) > 0 ? (
                            <span className="inline-flex h-7 shrink-0 items-center rounded-full bg-slate-100 px-3 text-xs font-medium text-slate-600 dark:bg-white/5 dark:text-slate-300">
                                {callsMeta?.total ?? 0} {(callsMeta?.total ?? 0) === 1 ? "call" : "calls"}
                            </span>
                        ) : null}
                    </div>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        <TableSearch
                            value={callsSearch}
                            onChange={(value) => {
                                setCallsSearch(value)
                                setCallsPage(1)
                            }}
                            placeholder="Search by customer, phone, or purpose..."
                            className="w-full lg:max-w-md"
                        />
                        <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:items-center">
                            <Select
                                value={callsDirection}
                                onValueChange={(value) => {
                                    setCallsDirection(value)
                                    setCallsPage(1)
                                }}
                            >
                                <SelectTrigger className="h-12 min-w-[160px] rounded-2xl">
                                    <SelectValue placeholder="All directions" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All directions</SelectItem>
                                    <SelectItem value="inbound">Inbound</SelectItem>
                                    <SelectItem value="outbound">Outbound</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select
                                value={callsStatus}
                                onValueChange={(value) => {
                                    setCallsStatus(value)
                                    setCallsPage(1)
                                }}
                            >
                                <SelectTrigger className="h-12 min-w-[180px] rounded-2xl">
                                    <SelectValue placeholder="All statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All statuses</SelectItem>
                                    <SelectItem value="queued">Queued</SelectItem>
                                    <SelectItem value="initiated">Initiated</SelectItem>
                                    <SelectItem value="ringing">Ringing</SelectItem>
                                    <SelectItem value="in_progress">In progress</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="failed">Failed</SelectItem>
                                    <SelectItem value="missed">Missed</SelectItem>
                                    <SelectItem value="transferred">Transferred</SelectItem>
                                </SelectContent>
                            </Select>
                            {(callsSearch || callsDirection !== "all" || callsStatus !== "all") && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                        setCallsSearch("")
                                        setCallsDirection("all")
                                        setCallsStatus("all")
                                    }}
                                    className="h-12 rounded-2xl px-4 text-sm text-slate-600 dark:text-slate-300"
                                >
                                    <FilterX className="mr-2 h-4 w-4" />
                                    Clear
                                </Button>
                            )}
                        </div>
                    </div>
                    {callsQuery.isPending ? (
                        <div className="overflow-x-auto -mx-2">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="text-left text-[13px] font-medium text-slate-500 dark:text-slate-400">
                                        <th className="px-2 pb-2 font-medium">Customer</th>
                                        <th className="px-2 pb-2 font-medium">Direction</th>
                                        <th className="px-2 pb-2 font-medium">Status</th>
                                        <th className="px-2 pb-2 font-medium">Duration</th>
                                        <th className="px-2 pb-2 font-medium">Created</th>
                                        <th className="px-2 pb-2" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <tr key={i} className="border-t border-slate-100 dark:border-white/[0.06]">
                                            <td className="px-2 py-3.5">
                                                <div className="h-3.5 w-32 animate-pulse rounded-md bg-slate-100 dark:bg-white/5" />
                                                <div className="mt-1.5 h-3 w-24 animate-pulse rounded-md bg-slate-100 dark:bg-white/5" />
                                            </td>
                                            <td className="px-2 py-3.5"><div className="h-3.5 w-16 animate-pulse rounded-md bg-slate-100 dark:bg-white/5" /></td>
                                            <td className="px-2 py-3.5"><div className="h-5 w-20 animate-pulse rounded-full bg-slate-100 dark:bg-white/5" /></td>
                                            <td className="px-2 py-3.5"><div className="h-3.5 w-10 animate-pulse rounded-md bg-slate-100 dark:bg-white/5" /></td>
                                            <td className="px-2 py-3.5"><div className="h-3.5 w-24 animate-pulse rounded-md bg-slate-100 dark:bg-white/5" /></td>
                                            <td className="px-2 py-3.5" />
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : calls.length === 0 ? (
                        (() => {
                            const isFiltered =
                                Boolean(callsSearch) ||
                                callsDirection !== "all" ||
                                callsStatus !== "all"
                            return (
                                <div className="rounded-3xl border border-dashed border-black/10 px-5 py-12 text-center dark:border-white/10">
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
                                        <Headphones className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <p className="mt-4 text-sm font-medium text-foreground">
                                        {isFiltered ? "No calls match the current filters" : "No calls logged yet"}
                                    </p>
                                    <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                                        {isFiltered
                                            ? "Try a different search term or clear filters to see all calls."
                                            : "Inbound and outbound calls will appear here once activity begins."}
                                    </p>
                                    {isFiltered ? (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="mt-4 rounded-full"
                                            onClick={() => {
                                                setCallsSearch("")
                                                setCallsDirection("all")
                                                setCallsStatus("all")
                                            }}
                                        >
                                            <FilterX className="mr-2 h-4 w-4" />
                                            Clear filters
                                        </Button>
                                    ) : null}
                                </div>
                            )
                        })()
                    ) : (
                        <>
                            <div className="overflow-x-auto -mx-2">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-[13px] font-medium text-slate-500 dark:text-slate-400">
                                            <th className="px-2 pb-2 font-medium">Customer</th>
                                            <th className="px-2 pb-2 font-medium">Direction</th>
                                            <th className="px-2 pb-2 font-medium">Status</th>
                                            <th className="px-2 pb-2 font-medium">Duration</th>
                                            <th className="px-2 pb-2 font-medium">Created</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {calls.map((call) => (
                                            <tr
                                                key={call.id}
                                                onClick={() => setSelectedCall(call)}
                                                className="cursor-pointer border-t border-slate-100 transition-colors hover:bg-slate-50/60 dark:border-white/[0.06] dark:hover:bg-white/[0.02]"
                                            >
                                                <td className="px-2 py-3.5">
                                                    <div className="font-medium text-slate-900 dark:text-slate-100">
                                                        {call.customer_name || "Unknown caller"}
                                                    </div>
                                                    <div className="mt-0.5 font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                                                        {formatPhoneNumber(call.customer_phone) || "—"}
                                                    </div>
                                                </td>
                                                <td className="px-2 py-3.5">
                                                    <CallDirectionLabel direction={call.direction} />
                                                </td>
                                                <td className="px-2 py-3.5">
                                                    <CallStatusBadge status={call.status} />
                                                </td>
                                                <td className="px-2 py-3.5 font-mono text-[13px] tabular-nums text-slate-700 dark:text-slate-300">
                                                    {formatCallDuration(call.duration_seconds)}
                                                </td>
                                                <td className="px-2 py-3.5 text-slate-600 dark:text-slate-400">
                                                    {new Date(call.created_at).toLocaleString(undefined, {
                                                        month: "short",
                                                        day: "numeric",
                                                        hour: "numeric",
                                                        minute: "2-digit",
                                                    })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <Pagination
                                currentPage={callsMeta?.page ?? 1}
                                totalPages={callsMeta?.lastPage ?? 1}
                                onPageChange={setCallsPage}
                                isLoading={callsQuery.isFetching}
                            />
                        </>
                    )}
                </GlassCard>
            )}

            <VoiceCallDetailsDialog
                call={selectedCall}
                open={!!selectedCall}
                onOpenChange={(open) => !open && setSelectedCall(null)}
            />

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

type MetricTone = "sky" | "amber" | "emerald" | "slate"

const METRIC_TONE_STYLES: Record<MetricTone, { accent: string; iconBg: string }> = {
    sky: {
        accent: "before:bg-sky-500",
        iconBg: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300",
    },
    amber: {
        accent: "before:bg-amber-500",
        iconBg: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    },
    emerald: {
        accent: "before:bg-emerald-500",
        iconBg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    },
    slate: {
        accent: "before:bg-slate-300 dark:before:bg-white/15",
        iconBg: "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300",
    },
}

function OverviewMetricsStrip({
    items,
}: {
    items: Array<{
        icon: typeof Phone
        label: string
        value: string
        tone?: MetricTone
        live?: boolean
    }>
}) {
    return (
        <GlassCard className="overflow-hidden rounded-[28px] border-black/5 p-0 dark:border-white/10">
            <div className="grid grid-cols-2 xl:grid-cols-4">
                {items.map((item, index) => (
                    <OverviewMetricSegment
                        key={item.label}
                        icon={item.icon}
                        label={item.label}
                        value={item.value}
                        tone={item.tone}
                        live={item.live}
                        className={cn(
                            "min-w-0",
                            index % 2 === 1 && "border-l border-black/5 dark:border-white/10",
                            index >= 2 && "border-t border-black/5 dark:border-white/10",
                            index > 0 && "xl:border-t-0 xl:border-l",
                            index % 2 === 0 && index < 2 && "xl:border-l-0"
                        )}
                    />
                ))}
            </div>
        </GlassCard>
    )
}

function OverviewMetricSegment({
    icon: Icon,
    label,
    value,
    tone = "slate",
    live = false,
    className,
}: {
    icon: typeof Phone
    label: string
    value: string
    tone?: MetricTone
    live?: boolean
    className?: string
}) {
    const styles = METRIC_TONE_STYLES[tone]
    const showLivePulse = live && Number(value) > 0

    return (
        <div
            className={cn(
                "relative overflow-hidden px-4 py-4 sm:px-5 sm:py-5",
                "before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:rounded-r-full",
                styles.accent,
                className
            )}
        >
            <div className="flex h-full flex-col gap-5">
                <div
                    className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
                        styles.iconBg
                    )}
                >
                    <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase text-slate-500 dark:text-slate-400">
                        {label}
                    </p>
                    <div className="mt-2 flex min-w-0 items-baseline gap-2">
                        <p className="truncate font-serif text-2xl font-semibold leading-none tracking-tight text-brand-deep sm:text-3xl dark:text-brand-cream">
                            {value}
                        </p>
                        {showLivePulse ? (
                            <span className="relative inline-flex h-2 w-2" aria-label="Live">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                            </span>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    )
}

function HealthRow({
    label,
    value,
    tone,
}: {
    label: string
    value: string
    tone: StatusTone
}) {
    const dotClass = STATUS_CHIP_STYLES[tone].dot
    return (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-black/5 px-3 py-2.5 dark:border-white/10">
            <div className="flex min-w-0 items-center gap-2.5">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", dotClass)} aria-hidden />
                <span className="text-[13px] font-medium text-slate-600 dark:text-slate-300">
                    {label}
                </span>
            </div>
            <span className="truncate text-sm font-medium capitalize text-slate-900 dark:text-slate-100">
                {value}
            </span>
        </div>
    )
}

type StatusTone = "emerald" | "amber" | "rose" | "slate"

const STATUS_CHIP_STYLES: Record<StatusTone, { container: string; dot: string }> = {
    emerald: {
        container: "border-emerald-200/70 bg-emerald-50/80 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
        dot: "bg-emerald-500",
    },
    amber: {
        container: "border-amber-200/70 bg-amber-50/80 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
        dot: "bg-amber-500",
    },
    rose: {
        container: "border-rose-200/70 bg-rose-50/80 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300",
        dot: "bg-rose-500",
    },
    slate: {
        container: "border-slate-200/80 bg-slate-50/80 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300",
        dot: "bg-slate-400 dark:bg-slate-500",
    },
}

function StatusChip({
    tone,
    label,
    pulse = false,
}: {
    tone: StatusTone
    label: string
    pulse?: boolean
}) {
    const styles = STATUS_CHIP_STYLES[tone]
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                styles.container
            )}
        >
            <span className="relative inline-flex h-1.5 w-1.5">
                {pulse ? (
                    <span
                        className={cn(
                            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
                            styles.dot
                        )}
                        aria-hidden
                    />
                ) : null}
                <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", styles.dot)} />
            </span>
            <span>{label}</span>
        </span>
    )
}

const HEALTHY_PROVIDER_STATES = new Set(["online", "operational", "healthy", "active", "ok", "ready"])
const DEGRADED_PROVIDER_STATES = new Set(["degraded", "warning", "limited", "partial"])
const DOWN_PROVIDER_STATES = new Set(["offline", "down", "failed", "error", "unavailable"])

function getProviderTone(status: string | undefined): StatusTone {
    const normalized = status?.toLowerCase().trim() ?? ""
    if (HEALTHY_PROVIDER_STATES.has(normalized)) return "emerald"
    if (DEGRADED_PROVIDER_STATES.has(normalized)) return "amber"
    if (DOWN_PROVIDER_STATES.has(normalized)) return "rose"
    return "slate"
}

function VoiceStatusBar({
    health,
    isPending,
}: {
    health: VoiceHealth | undefined
    isPending: boolean
}) {
    if (isPending && !health) {
        return (
            <div className="flex flex-wrap items-center gap-2">
                <div className="h-7 w-32 animate-pulse rounded-full bg-slate-100 dark:bg-white/5" />
                <div className="h-7 w-28 animate-pulse rounded-full bg-slate-100 dark:bg-white/5" />
            </div>
        )
    }

    const providerStatus = health?.provider_status?.trim() || "Unknown"
    const providerTone = getProviderTone(providerStatus)
    const activeCalls = health?.active_calls ?? 0
    const failed24h = health?.failed_requests_last_24h ?? 0

    return (
        <div className="flex flex-wrap items-center gap-2">
            <StatusChip
                tone={providerTone}
                label={`Provider · ${providerStatus.replace(/_/g, " ")}`}
                pulse={providerTone === "emerald"}
            />
            <StatusChip
                tone={activeCalls > 0 ? "emerald" : "slate"}
                label={`${activeCalls} ${activeCalls === 1 ? "active call" : "active calls"}`}
                pulse={activeCalls > 0}
            />
            {failed24h > 0 ? (
                <StatusChip tone="rose" label={`${failed24h} failed (24h)`} />
            ) : null}
        </div>
    )
}

function ApprovedNumberRequestCard({
    request,
    providerName,
    onConnect,
}: {
    request: VoiceNumberRequestItem
    providerName: string
    onConnect: () => void
}) {
    return (
        <div className="rounded-[2rem] border border-emerald-200/80 bg-white/85 p-4 dark:border-emerald-500/20 dark:bg-slate-950/30">
            <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                    <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">
                                {request.label || formatPhoneNumber(request.approved_phone_number) || "Approved voice number"}
                            </p>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                                    {formatPhoneNumber(request.approved_phone_number)}
                                </span>
                                <span aria-hidden className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>
                                <span className="capitalize">{providerName}</span>
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Approved {request.approved_at ? new Date(request.approved_at).toLocaleDateString() : "recently"}
                            </p>
                        </div>
                        <Button
                            type="button"
                            onClick={onConnect}
                            className="h-9 shrink-0 rounded-full bg-brand-deep px-4 text-sm font-medium text-brand-gold-300 hover:bg-brand-deep/92 dark:bg-brand-gold dark:text-brand-deep dark:hover:bg-brand-gold/92"
                        >
                            Connect now
                        </Button>
                    </div>
                </div>
            </div>
            <RequestLogTimeline logs={request.logs} className="ml-[3.25rem] mt-4" />
        </div>
    )
}

const REQUEST_STATUS_META: Record<
    VoiceNumberRequestItem["status"],
    { tone: StatusTone; icon: typeof Phone; label: string }
> = {
    pending: { tone: "amber", icon: Clock, label: "Pending review" },
    approved: { tone: "emerald", icon: CheckCircle2, label: "Approved" },
    fulfilled: { tone: "emerald", icon: CheckCircle2, label: "Fulfilled" },
    cancelled: { tone: "rose", icon: XCircle, label: "Cancelled" },
    rejected: { tone: "rose", icon: XCircle, label: "Rejected" },
}

function NumberRequestRow({
    request,
    providerName,
    isCancelling,
    onCancel,
}: {
    request: VoiceNumberRequestItem
    providerName: string
    isCancelling: boolean
    onCancel: () => void
}) {
    const meta = REQUEST_STATUS_META[request.status] ?? {
        tone: "slate" as StatusTone,
        icon: PhoneIncoming,
        label: request.status.replace(/_/g, " "),
    }
    const StatusIcon = meta.icon
    const iconStyles = {
        amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
        emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
        rose: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300",
        slate: "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400",
    }[meta.tone]

    return (
        <div className="rounded-[2rem] border border-black/6 bg-white/40 px-4 py-4 dark:border-white/10 dark:bg-white/[0.02]">
            <div className="flex items-start gap-3">
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", iconStyles)}>
                    <StatusIcon className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">
                                {request.label || `${request.country_code} voice number request`}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                <span className="capitalize">{providerName}</span>
                                <span aria-hidden className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>
                                <span>Submitted {new Date(request.created_at).toLocaleDateString()}</span>
                            </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 sm:flex-row-reverse">
                            <StatusChip tone={meta.tone} label={meta.label} />
                            {request.status === "pending" ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 rounded-full text-xs"
                                    disabled={isCancelling}
                                    onClick={onCancel}
                                >
                                    {isCancelling ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                                    Cancel
                                </Button>
                            ) : null}
                        </div>
                    </div>
                    {request.notes ? (
                        <p className="mt-2 rounded-xl bg-black/[0.02] px-3 py-2 text-xs leading-5 text-slate-600 dark:bg-white/[0.03] dark:text-slate-400">
                            {request.notes}
                        </p>
                    ) : null}
                </div>
            </div>
            <RequestLogTimeline logs={request.logs} className="ml-[3.25rem] mt-3" />
        </div>
    )
}

function RequestInnerTabButton({
    label,
    count,
    isActive,
    icon: Icon,
    onClick,
}: {
    label: string
    count: number
    isActive: boolean
    icon: typeof Phone
    onClick: () => void
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                isActive
                    ? "bg-white text-foreground shadow-sm dark:bg-slate-900"
                    : "text-muted-foreground hover:bg-white/70 dark:hover:bg-white/[0.06]"
            )}
        >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
            <span
                className={cn(
                    "rounded-full px-2 py-0.5 text-xs",
                    isActive
                        ? "bg-black/[0.05] text-foreground dark:bg-white/[0.08]"
                        : "bg-black/[0.04] text-muted-foreground dark:bg-white/[0.05]"
                )}
            >
                {count}
            </span>
        </button>
    )
}

function RequestTabEmptyState({
    title,
    description,
}: {
    title: string
    description: string
}) {
    return (
        <div className="rounded-3xl border border-dashed border-black/10 px-5 py-10 text-center dark:border-white/10">
            <p className="text-sm font-medium text-foreground">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
    )
}

function RequestLogTimeline({
    logs,
    className,
}: {
    logs?: VoiceNumberRequestItem["logs"]
    className?: string
}) {
    if (!logs?.length) return null

    return (
        <div className={cn("rounded-[1.25rem] bg-black/[0.02] px-4 py-3 dark:bg-white/[0.03]", className)}>
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Request activity
            </p>
            <div className="relative mt-3 space-y-3">
                {logs.map((log, index) => (
                    <div key={log.id} className="relative flex gap-3">
                        {index < logs.length - 1 ? (
                            <span
                                aria-hidden
                                className="absolute left-[3px] top-3 -bottom-2 w-[1.5px] bg-black/[0.06] dark:bg-white/[0.06]"
                            />
                        ) : null}
                        <span
                            aria-hidden
                            className="relative mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-green/80 ring-[2px] ring-white dark:bg-emerald-400/80 dark:ring-slate-950"
                        />
                        <div className="min-w-0 flex-1 pb-0.5">
                            <p className="text-sm font-medium text-foreground">{log.title}</p>
                            {log.description ? (
                                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{log.description}</p>
                            ) : null}
                            <p className="mt-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">
                                {new Date(log.created_at).toLocaleString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit",
                                })}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
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
