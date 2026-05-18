"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Switch } from "@/app/components/ui/switch"
import { Textarea } from "@/app/components/ui/textarea"
import { GlassCard } from "@/app/components/ui/glass-card"
import { ManagementHeader } from "@/app/components/shared/ManagementHeader"
import { OperatingHoursBuilder, serializeSchedule, createDefaultSchedule } from "@/app/components/shared/OperatingHoursBuilder"
import { PersistedTabs, type TabItem } from "@/app/components/shared/PersistedTabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog"
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
    useStartVoiceCall,
    useUpdateVoiceSettings,
    useVoiceCalls,
    useVoiceHealth,
    useVoiceNumbers,
    useVoiceProviders,
    useVoiceSettings,
    useVoiceTransferTargets,
    type VoiceCall,
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

const TRANSFER_ROLE_OPTIONS = [
    { value: "frontdesk", label: "Front desk" },
    { value: "sales", label: "Sales" },
    { value: "support", label: "Support" },
    { value: "manager", label: "Manager" },
    { value: "owner", label: "Owner" },
]

const PRIORITY_OPTIONS = [
    { value: "0", label: "Primary" },
    { value: "1", label: "Secondary" },
    { value: "2", label: "Backup" },
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

function formatDuration(value: number | null) {
    if (!value) return "—"
    const minutes = Math.floor(value / 60)
    const seconds = value % 60
    return `${minutes}:${String(seconds).padStart(2, "0")}`
}

function humanizeRole(role: string | null | undefined) {
    if (!role) return "Staff"
    return role.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
}

export function VoiceView() {
    const providersQuery = useVoiceProviders()
    const numbersQuery = useVoiceNumbers()
    const settingsQuery = useVoiceSettings()
    const targetsQuery = useVoiceTransferTargets()
    const callsQuery = useVoiceCalls()
    const healthQuery = useVoiceHealth()

    const createNumber = useCreateVoiceNumber()
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
    const [numberForm, setNumberForm] = useState({
        provider: "africas_talking",
        label: "",
        phone_number: "",
        provider_credentials: {} as Record<string, string>,
        use_system_credentials: true,
        is_default: true,
    })
    const [targetForm, setTargetForm] = useState({
        label: "",
        role_label: "support",
        phone_number: "",
        priority: 0,
        is_fallback: false,
    })
    const [callForm, setCallForm] = useState({
        business_voice_number_id: "",
        customer_phone: "",
        customer_name: "",
        purpose: "",
        context: "",
    })
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
                        <GlassCard className="p-6 space-y-4">
                            <SectionTitle icon={Phone} title="Start outbound call" />
                            <div className="grid gap-4 md:grid-cols-2">
                                <Select
                                    value={callForm.business_voice_number_id || undefined}
                                    onValueChange={(value) => setCallForm((prev) => ({ ...prev, business_voice_number_id: value }))}
                                >
                                    <SelectTrigger className="rounded-2xl">
                                        <SelectValue placeholder="Select calling line" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        {(numbersQuery.data ?? []).map((number) => (
                                            <SelectItem key={number.id} value={number.id}>
                                                {number.label || number.phone_number}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input placeholder="Customer phone" value={callForm.customer_phone} onChange={(e) => setCallForm((prev) => ({ ...prev, customer_phone: e.target.value }))} />
                            </div>
                            <Input placeholder="Customer name" value={callForm.customer_name} onChange={(e) => setCallForm((prev) => ({ ...prev, customer_name: e.target.value }))} />
                            <Input placeholder="Purpose" value={callForm.purpose} onChange={(e) => setCallForm((prev) => ({ ...prev, purpose: e.target.value }))} />
                            <Textarea placeholder="Context for the agent" value={callForm.context} onChange={(e) => setCallForm((prev) => ({ ...prev, context: e.target.value }))} rows={4} />
                            <Button
                                onClick={() =>
                                    startCall.mutate({
                                        ...callForm,
                                        business_voice_number_id: callForm.business_voice_number_id || null,
                                    })
                                }
                                disabled={startCall.isPending || !callForm.customer_phone.trim()}
                                className="rounded-full"
                            >
                                {startCall.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PhoneCall className="mr-2 h-4 w-4" />}
                                Queue call
                            </Button>
                        </GlassCard>

                        <GlassCard className="p-6 space-y-4">
                            <SectionTitle icon={Headphones} title="Voice numbers" />
                            <div className="space-y-3">
                                {(numbersQuery.data ?? []).map((number) => (
                                    <div key={number.id} className="rounded-2xl border border-black/5 px-4 py-3 dark:border-white/10">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="font-medium">{number.label || number.phone_number}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {providerMap.get(number.provider)?.name || number.provider}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {number.use_system_credentials ? "Managed credentials" : "Custom credentials"}
                                                </p>
                                            </div>
                                            <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                                {number.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    </div>
                </>
            )}

            {activeTab === "transfer" && (
                <GlassCard className="p-6 space-y-4">
                    <SectionTitle icon={PhoneForwarded} title="Transfer targets" />
                    <p className="text-sm text-muted-foreground">
                        Choose who receives escalated calls when the AI needs a human handoff.
                    </p>
                    <div className="space-y-3">
                        {(targetsQuery.data ?? []).map((target) => (
                            <div key={target.id} className="flex items-center justify-between rounded-2xl border border-black/5 px-4 py-3 dark:border-white/10">
                                <div>
                                    <p className="font-medium">{target.label}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {humanizeRole(target.role_label)} • {target.phone_number}
                                    </p>
                                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                        {target.priority === 0 ? "Primary route" : `Priority ${target.priority + 1}`}
                                        {target.is_fallback ? " • Fallback" : ""}
                                    </p>
                                </div>
                                <Button variant="ghost" onClick={() => deleteTarget.mutate(target.id)}>
                                    Remove
                                </Button>
                            </div>
                        ))}
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Staff name</p>
                            <Input
                                placeholder="Jane Ibrahim"
                                value={targetForm.label}
                                onChange={(e) => setTargetForm((prev) => ({ ...prev, label: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Role</p>
                            <Select
                                value={targetForm.role_label}
                                onValueChange={(value) => setTargetForm((prev) => ({ ...prev, role_label: value }))}
                            >
                                <SelectTrigger className="rounded-2xl">
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl">
                                    {TRANSFER_ROLE_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Phone number</p>
                            <Input
                                placeholder="+2348012345678"
                                value={targetForm.phone_number}
                                onChange={(e) => setTargetForm((prev) => ({ ...prev, phone_number: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Routing order</p>
                            <Select
                                value={String(targetForm.priority)}
                                onValueChange={(value) => setTargetForm((prev) => ({ ...prev, priority: Number(value) }))}
                            >
                                <SelectTrigger className="rounded-2xl">
                                    <SelectValue placeholder="Select order" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl">
                                    {PRIORITY_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <ToggleRow
                        label="Use as fallback if primary transfer fails"
                        checked={targetForm.is_fallback}
                        onCheckedChange={(value) => setTargetForm((prev) => ({ ...prev, is_fallback: value }))}
                    />
                    <Button
                        onClick={() => createTarget.mutate(targetForm)}
                        disabled={createTarget.isPending || !targetForm.label.trim() || !targetForm.phone_number.trim()}
                        className="rounded-full"
                    >
                        Add target
                    </Button>
                </GlassCard>
            )}

            {activeTab === "settings" && (
                <div className="grid gap-6 xl:grid-cols-2">
                    <GlassCard className="p-6 space-y-4">
                        <SectionTitle icon={Headphones} title="Number connection" />
                        <div className="grid gap-3">
                            <Select
                                value={numberForm.provider}
                                onValueChange={(value) =>
                                    setNumberForm((prev) => {
                                        const provider = providerMap.get(value)
                                        return {
                                            ...prev,
                                            provider: value,
                                            provider_credentials: {},
                                            use_system_credentials: provider?.system_credentials_enabled
                                                ? prev.use_system_credentials
                                                : false,
                                        }
                                    })
                                }
                            >
                                <SelectTrigger className="rounded-2xl">
                                    <SelectValue placeholder="Select provider" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl">
                                    {providerOptions.map((provider) => (
                                        <SelectItem key={provider.id} value={provider.id}>
                                            {provider.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input placeholder="Label" value={numberForm.label} onChange={(e) => setNumberForm((prev) => ({ ...prev, label: e.target.value }))} />
                            <Input placeholder="Phone number" value={numberForm.phone_number} onChange={(e) => setNumberForm((prev) => ({ ...prev, phone_number: e.target.value }))} />
                            {selectedProvider?.system_credentials_enabled && (
                                <ToggleRow
                                    label="Use managed credentials"
                                    checked={numberForm.use_system_credentials}
                                    onCheckedChange={(value) => setNumberForm((prev) => ({ ...prev, use_system_credentials: value }))}
                                />
                            )}
                            {!numberForm.use_system_credentials && selectedProvider?.custom_credentials_enabled !== false && (
                                <>
                                    {(selectedProvider?.credential_fields ?? []).map((field) => (
                                        <div key={field.key} className="space-y-2">
                                            <p className="text-sm font-medium">
                                                {field.label}
                                                {field.required ? " *" : ""}
                                            </p>
                                            <Input
                                                placeholder={field.placeholder ?? field.label}
                                                type={field.type === "password" ? "password" : "text"}
                                                value={numberForm.provider_credentials[field.key] ?? ""}
                                                onChange={(e) =>
                                                    setNumberForm((prev) => ({
                                                        ...prev,
                                                        provider_credentials: {
                                                            ...prev.provider_credentials,
                                                            [field.key]: e.target.value,
                                                        },
                                                    }))
                                                }
                                            />
                                            {field.help_text ? (
                                                <p className="text-xs text-muted-foreground">{field.help_text}</p>
                                            ) : null}
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Connect a calling provider, assign the number, and decide whether Cloove manages credentials or the business brings its own.
                        </p>
                        <Button
                            onClick={() => createNumber.mutate(numberForm)}
                            disabled={createNumber.isPending || !numberForm.phone_number.trim()}
                            className="rounded-full"
                        >
                            {createNumber.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Save number
                        </Button>
                    </GlassCard>

                    <GlassCard className="p-6 space-y-4">
                        <SectionTitle icon={ShieldCheck} title="Agent settings" />
                        <div className="grid gap-3 md:grid-cols-2">
                            <Input placeholder="Display name" value={settingsForm.display_name} onChange={(e) => setSettingsForm((prev) => ({ ...prev, display_name: e.target.value }))} />
                            <Select
                                value={settingsForm.language}
                                onValueChange={(value) => setSettingsForm((prev) => ({ ...prev, language: value }))}
                            >
                                <SelectTrigger className="rounded-2xl">
                                    <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl">
                                    {LANGUAGE_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Conversation tone</p>
                            <Select
                                value={settingsForm.tone}
                                onValueChange={(value) => setSettingsForm((prev) => ({ ...prev, tone: value }))}
                            >
                                <SelectTrigger className="rounded-2xl">
                                    <SelectValue placeholder="Select tone" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl">
                                    {TONE_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-medium">Greeting</p>
                                {GREETING_PRESETS.map((preset) => (
                                    <Button
                                        key={preset.id}
                                        type="button"
                                        variant="outline"
                                        className="h-8 rounded-full px-3 text-xs"
                                        onClick={() =>
                                            setSettingsForm((prev) => ({
                                                ...prev,
                                                greeting_message: preset.build(businessDisplayName),
                                            }))
                                        }
                                    >
                                        {preset.label}
                                    </Button>
                                ))}
                            </div>
                            <Textarea
                                placeholder="How the AI should welcome callers"
                                value={settingsForm.greeting_message}
                                onChange={(e) => setSettingsForm((prev) => ({ ...prev, greeting_message: e.target.value }))}
                                rows={3}
                            />
                        </div>
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-medium">Fallback response</p>
                                {FALLBACK_PRESETS.map((preset) => (
                                    <Button
                                        key={preset.id}
                                        type="button"
                                        variant="outline"
                                        className="h-8 rounded-full px-3 text-xs"
                                        onClick={() =>
                                            setSettingsForm((prev) => ({
                                                ...prev,
                                                fallback_message: preset.text,
                                            }))
                                        }
                                    >
                                        {preset.label}
                                    </Button>
                                ))}
                            </div>
                            <Textarea
                                placeholder="What the AI should say when it needs the caller to repeat or wait"
                                value={settingsForm.fallback_message}
                                onChange={(e) => setSettingsForm((prev) => ({ ...prev, fallback_message: e.target.value }))}
                                rows={3}
                            />
                        </div>
                        <div className="space-y-3">
                            <OperatingHoursBuilder
                                value={settingsForm.operating_hours}
                                onChange={(value) => setSettingsForm((prev) => ({ ...prev, operating_hours: value }))}
                                description="Used for after-hours routing and caller expectation setting."
                            />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <ToggleRow label="AI enabled" checked={settingsForm.ai_enabled} onCheckedChange={(value) => setSettingsForm((prev) => ({ ...prev, ai_enabled: value }))} />
                            <ToggleRow label="Record calls" checked={settingsForm.recording_enabled} onCheckedChange={(value) => setSettingsForm((prev) => ({ ...prev, recording_enabled: value }))} />
                            <ToggleRow label="Transcribe calls" checked={settingsForm.transcription_enabled} onCheckedChange={(value) => setSettingsForm((prev) => ({ ...prev, transcription_enabled: value }))} />
                            <ToggleRow label="Human handoff" checked={settingsForm.human_handoff_enabled} onCheckedChange={(value) => setSettingsForm((prev) => ({ ...prev, human_handoff_enabled: value }))} />
                        </div>
                        <Button onClick={() => updateSettings.mutate(settingsForm)} disabled={updateSettings.isPending} className="rounded-full">
                            {updateSettings.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Save settings
                        </Button>
                    </GlassCard>
                </div>
            )}

            {activeTab === "calls" && (
                <GlassCard className="p-6 space-y-4">
                    <SectionTitle icon={Headphones} title="Recent calls" />
                    {isLoading ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading voice activity...
                        </div>
                    ) : (callsQuery.data ?? []).length === 0 ? (
                        <p className="text-sm text-muted-foreground">No calls logged yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                    <tr>
                                        <th className="pb-3">Customer</th>
                                        <th className="pb-3">Direction</th>
                                        <th className="pb-3">Status</th>
                                        <th className="pb-3">Duration</th>
                                        <th className="pb-3">Created</th>
                                        <th className="pb-3"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(callsQuery.data ?? []).map((call) => (
                                        <tr key={call.id} className="border-t border-black/5 dark:border-white/10">
                                            <td className="py-3">
                                                <div className="font-medium">{call.customer_name || "Unknown caller"}</div>
                                                <div className="text-muted-foreground">{call.customer_phone || "—"}</div>
                                            </td>
                                            <td className="py-3 capitalize">{call.direction.replace("_", " ")}</td>
                                            <td className="py-3 capitalize">{call.status.replace("_", " ")}</td>
                                            <td className="py-3">{formatDuration(call.duration_seconds)}</td>
                                            <td className="py-3">{new Date(call.created_at).toLocaleString()}</td>
                                            <td className="py-3 text-right">
                                                <Button variant="ghost" onClick={() => setSelectedCall(call)}>Open</Button>
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
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Call details</DialogTitle>
                    </DialogHeader>
                    {selectedCall && (
                        <div className="space-y-5">
                            <div className="grid gap-4 md:grid-cols-2">
                                <MetaItem label="Customer" value={selectedCall.customer_name || selectedCall.customer_phone || "Unknown"} />
                                <MetaItem label="Status" value={selectedCall.status} />
                                <MetaItem label="Resolution" value={selectedCall.resolution || "—"} />
                                <MetaItem label="Transfer" value={selectedCall.transfer_status || "—"} />
                            </div>
                            {selectedCall.summary && (
                                <div>
                                    <p className="mb-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">Summary</p>
                                    <p className="text-sm leading-6">{selectedCall.summary}</p>
                                </div>
                            )}
                            {selectedCall.recording_url && (
                                <div>
                                    <p className="mb-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">Recording</p>
                                    <audio controls className="w-full" src={selectedCall.recording_url} />
                                </div>
                            )}
                            <div>
                                <p className="mb-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">Transcript</p>
                                <div className="space-y-3">
                                    {(selectedCall.turns ?? []).length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No transcript captured yet.</p>
                                    ) : (
                                        (selectedCall.turns ?? []).map((turn) => (
                                            <div key={turn.id} className="rounded-2xl border border-black/5 px-4 py-3 dark:border-white/10">
                                                <div className="mb-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                                    {turn.speaker}
                                                </div>
                                                <p className="text-sm leading-6">{turn.transcript || turn.prompt_text || "—"}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
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
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
                    <p className="mt-2 text-3xl font-semibold">{value}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/5 dark:bg-white/5">
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </GlassCard>
    )
}

function ToggleRow({
    label,
    checked,
    onCheckedChange,
}: {
    label: string
    checked: boolean
    onCheckedChange: (value: boolean) => void
}) {
    return (
        <label className="flex items-center justify-between rounded-2xl border border-black/5 px-4 py-3 text-sm dark:border-white/10">
            <span>{label}</span>
            <Switch checked={checked} onCheckedChange={onCheckedChange} />
        </label>
    )
}

function MetaItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-black/5 px-4 py-3 dark:border-white/10">
            <div className="mb-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
            <div className="text-sm">{value}</div>
        </div>
    )
}
