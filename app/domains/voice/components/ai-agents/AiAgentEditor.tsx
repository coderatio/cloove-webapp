"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
    ArrowLeft,
    ArrowRight,
    Brain,
    CheckCircle2,
    Loader2,
    Phone,
    Play,
    Sparkles,
    Sun,
    Wrench,
} from "lucide-react"
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
import { Switch } from "@/app/components/ui/switch"
import { Textarea } from "@/app/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { cn, formatPhoneNumber } from "@/app/lib/utils"
import { OperatingHoursBuilder } from "@/app/components/shared/OperatingHoursBuilder"
import {
    scheduleStringToStructured,
    structuredToScheduleString,
} from "@/app/lib/operating-hours"
import {
    useCreateVoiceAiAgent,
    useUpdateVoiceAiAgent,
    useVoiceNumbers,
    useAssignVoiceAiAgentToNumber,
    useVoiceSpeechProviders,
    useVoiceTools,
    type AiAgentItem,
    type VoiceSpeechProviderItem,
    type VoiceSpeechVoiceItem,
    type VoiceToolPreset,
} from "@/app/domains/voice/hooks/useVoice"
import { ToolPicker } from "@/app/domains/voice/components/ai-agents/ToolPicker"

type Step = "template" | "identity" | "prompt" | "availability" | "tools" | "behaviour" | "numbers" | "review"

const STEPS: { key: Step; label: string; icon: typeof Phone }[] = [
    { key: "template", label: "Template", icon: Sparkles },
    { key: "identity", label: "Identity", icon: Brain },
    { key: "prompt", label: "Prompt", icon: Brain },
    { key: "availability", label: "Availability", icon: Sun },
    { key: "tools", label: "Tools", icon: Wrench },
    { key: "behaviour", label: "Behaviour", icon: CheckCircle2 },
    { key: "numbers", label: "Numbers", icon: Phone },
    { key: "review", label: "Review", icon: CheckCircle2 },
]

const TEMPLATES = [
    { key: "scratch", label: "Start from scratch", description: "Build an agent step-by-step." },
    { key: "sales", label: "Sales assistant", description: "Catalog browsing, cart, checkout." },
    { key: "support", label: "Support assistant", description: "Order status, returns, FAQs." },
    { key: "restaurant", label: "Restaurant host", description: "Menu, table bookings." },
    { key: "service", label: "Service consultant", description: "Bookings, follow-ups, transfers." },
] as const

const DEFAULT_BEHAVIOUR_FLAGS = {
    ai_enabled: true,
    recording_enabled: false,
    transcription_enabled: true,
    human_handoff_enabled: true,
    after_hours_enabled: true,
    disclosure_enabled: true,
}

interface AiAgentEditorProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    agent?: AiAgentItem | null
}

export function AiAgentEditor({ open, onOpenChange, agent }: AiAgentEditorProps) {
    const isEdit = Boolean(agent?.id)
    const [step, setStep] = useState<Step>(isEdit ? "identity" : "template")
    const [template, setTemplate] = useState<string>("scratch")
    const [name, setName] = useState<string>("")
    const [language, setLanguage] = useState<string>("en-NG")
    const [tone, setTone] = useState<string>("professional")
    const [speechProviderId, setSpeechProviderId] = useState<string>("")
    const [voiceId, setVoiceId] = useState<string>("")
    const [greeting, setGreeting] = useState<string>("")
    const [fallback, setFallback] = useState<string>("")
    const [voicemail, setVoicemail] = useState<string>("")
    const [businessInfo, setBusinessInfo] = useState<string>("")
    const [aiInstructions, setAiInstructions] = useState<string>("")
    const [restrictedTopics, setRestrictedTopics] = useState<string>("")
    const [operatingHours, setOperatingHours] = useState<string>("")
    const [enabledTools, setEnabledTools] = useState<string[]>([])
    const [behaviourFlags, setBehaviourFlags] = useState(DEFAULT_BEHAVIOUR_FLAGS)
    const [isDefault, setIsDefault] = useState<boolean>(false)
    const [selectedNumberIds, setSelectedNumberIds] = useState<string[]>([])
    const [isEditorHydrated, setIsEditorHydrated] = useState(false)

    const createMutation = useCreateVoiceAiAgent()
    const updateMutation = useUpdateVoiceAiAgent()
    const assignMutation = useAssignVoiceAiAgentToNumber()
    const numbersQuery = useVoiceNumbers()
    const numbers = useMemo(() => numbersQuery.data ?? [], [numbersQuery.data])
    const toolsCatalogQuery = useVoiceTools()
    const lastAppliedTemplateRef = useRef<string | null>(null)
    const speechProvidersQuery = useVoiceSpeechProviders()
    const speechProviders: VoiceSpeechProviderItem[] = useMemo(
        () => speechProvidersQuery.data ?? [],
        [speechProvidersQuery.data]
    )

    const activeProvider = useMemo<VoiceSpeechProviderItem | null>(() => {
        if (speechProviders.length === 0) return null
        if (speechProviderId) {
            const match = speechProviders.find((p) => p.id === speechProviderId)
            if (match) return match
        }
        return speechProviders.find((p) => p.isDefault) ?? speechProviders[0]
    }, [speechProviders, speechProviderId])

    const activeVoice = useMemo<VoiceSpeechVoiceItem | null>(() => {
        if (!activeProvider) return null
        const voices = activeProvider.voices ?? []
        if (voiceId) {
            const match = voices.find((v) => v.id === voiceId)
            if (match) return match
        }
        return voices[0] ?? null
    }, [activeProvider, voiceId])

    // Once the catalog loads, snap empty selections back onto the resolved
    // defaults so the Identity step renders the correct option immediately
    // and the payload sent on save never carries an empty string.
    useEffect(() => {
        if (!open || !activeProvider) return
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (!speechProviderId) setSpeechProviderId(activeProvider.id)
        if (!voiceId && activeVoice) setVoiceId(activeVoice.id)
    }, [open, activeProvider, activeVoice, speechProviderId, voiceId])

    // Hydrate fields when opening for edit.
    useEffect(() => {
        if (!open) return
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsEditorHydrated(false)
        lastAppliedTemplateRef.current = null
        if (agent) {
            setStep("identity")
            setName(agent.name)
            setLanguage(agent.language)
            setTone(agent.tone)
            setSpeechProviderId(agent.speechProviderId ?? "")
            setVoiceId(agent.voiceId ?? "")
            setGreeting(agent.greetingMessage ?? "")
            setFallback(agent.fallbackMessage ?? "")
            setVoicemail(agent.voicemailMessage ?? "")
            setBusinessInfo(agent.businessInfo ?? "")
            setAiInstructions(agent.aiInstructions ?? "")
            setRestrictedTopics(agent.restrictedTopics ?? "")
            setOperatingHours(
                structuredToScheduleString(
                    agent.operatingHours as
                    | string
                    | Array<{ dayOfWeek: number; openAt: string; closeAt: string }>
                    | null
                )
            )
            setEnabledTools(agent.enabledTools ?? [])
            setBehaviourFlags({
                ...DEFAULT_BEHAVIOUR_FLAGS,
                ...(agent.behaviourFlags ?? {}),
                recording_enabled: false,
            })
            setIsDefault(agent.isDefault)
            setSelectedNumberIds(numbers.filter((n) => n.aiAgentId === agent.id).map((n) => n.id))
        } else {
            setStep("template")
            setTemplate("scratch")
            setName("")
            setLanguage("en-NG")
            setTone("professional")
            setSpeechProviderId("")
            setVoiceId("")
            setGreeting("")
            setFallback("")
            setVoicemail("")
            setBusinessInfo("")
            setAiInstructions("")
            setRestrictedTopics("")
            setOperatingHours("")
            setEnabledTools([])
            setBehaviourFlags(DEFAULT_BEHAVIOUR_FLAGS)
            setIsDefault(false)
            setSelectedNumberIds([])
        }
        setIsEditorHydrated(true)
    }, [open, agent, numbers])

    // Apply tool preset when a template is chosen during create. Skipped on
    // edit (preserves the agent's saved tools) and guarded by a ref so it
    // runs once per template choice — not on every ToolPicker remount.
    useEffect(() => {
        if (!open || isEdit) return
        const catalog = toolsCatalogQuery.data
        if (!catalog) return
        if (lastAppliedTemplateRef.current === template) return

        lastAppliedTemplateRef.current = template
        if (template === "scratch") {
            setEnabledTools([])
            return
        }
        const preset = findPresetForTemplate(template, catalog.presets)
        if (preset) setEnabledTools(preset.tools)
    }, [open, isEdit, template, toolsCatalogQuery.data])

    // Edit mode drops the create-only stages: `template` (the persona seed
    // picker) and `review` (the final summary). The user goes straight to
    // the section they want to change via the step chips and saves from
    // anywhere — they shouldn't have to walk through 8 screens just to tweak
    // a tool toggle.
    const activeSteps = useMemo(
        () =>
            isEdit
                ? STEPS.filter((s) => s.key !== "template" && s.key !== "review")
                : STEPS,
        [isEdit]
    )
    const currentIdx = Math.max(
        0,
        activeSteps.findIndex((s) => s.key === step)
    )
    const goNext = () => {
        if (currentIdx < activeSteps.length - 1) setStep(activeSteps[currentIdx + 1].key)
    }
    const goBack = () => {
        if (currentIdx > 0) setStep(activeSteps[currentIdx - 1].key)
    }

    const handleTemplate = (key: string) => {
        setTemplate(key)
        // Seed greeting based on template — actual tool preset is applied via
        // the ToolPicker preset dropdown so the user still sees the choice.
        switch (key) {
            case "sales":
                setGreeting("Hi! Thanks for calling. How can I help you find what you need today?")
                setName((prev) => prev || "Sales Assistant")
                break
            case "support":
                setGreeting("Hello, thanks for reaching out. I can help with your order or any questions.")
                setName((prev) => prev || "Support Assistant")
                break
            case "restaurant":
                setGreeting("Welcome! Would you like to make a reservation or hear our menu?")
                setName((prev) => prev || "Restaurant Host")
                break
            case "service":
                setGreeting("Hi, I'm your assistant. How can I help with your appointment or service today?")
                setName((prev) => prev || "Service Consultant")
                break
            default:
                break
        }
    }

    const buildPayload = () => ({
        name: name.trim(),
        language,
        tone,
        speech_provider_id: speechProviderId || activeProvider?.id || null,
        voice_id: voiceId || activeVoice?.id || null,
        greeting_message: greeting || null,
        fallback_message: fallback || null,
        voicemail_message: voicemail || null,
        business_info: businessInfo || null,
        ai_instructions: aiInstructions || null,
        restricted_topics: restrictedTopics || null,
        operating_hours: scheduleStringToStructured(operatingHours),
        enabled_tools: enabledTools,
        behaviour_flags: behaviourFlags,
        is_default: isDefault,
    })

    const handleSave = async (statusOnCreate: "active" | "draft" = "active") => {
        try {
            const payload = isEdit
                ? buildPayload()
                : { ...buildPayload(), status: statusOnCreate }
            const saved = isEdit
                ? await updateMutation.mutateAsync({ id: agent!.id, payload })
                : await createMutation.mutateAsync(payload)

            // Sync linked numbers
            const currentlyLinked = numbers.filter((n) => n.aiAgentId === saved.id).map((n) => n.id)
            const toLink = selectedNumberIds.filter((id) => !currentlyLinked.includes(id))
            const toUnlink = currentlyLinked.filter((id) => !selectedNumberIds.includes(id))

            await Promise.all([
                ...toLink.map((numberId) =>
                    assignMutation.mutateAsync({ numberId, aiAgentId: saved.id, silent: true })
                ),
                ...toUnlink.map((numberId) =>
                    assignMutation.mutateAsync({ numberId, aiAgentId: null, silent: true })
                ),
            ])

            onOpenChange(false)
        } catch {
            // Toasts handled in hooks.
        }
    }

    const isSaving = createMutation.isPending || updateMutation.isPending || assignMutation.isPending
    const canSave = name.trim().length >= 2

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="max-h-[92vh]">
                <DrawerStickyHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {!isEdit && currentIdx > 0 && (
                                <button
                                    onClick={goBack}
                                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </button>
                            )}
                            <div className="space-y-1">
                                <DrawerTitle className="font-sans text-xl font-semibold">
                                    {isEdit ? `Edit ${agent?.name}` : "New AI agent"}
                                </DrawerTitle>
                                <DrawerDescription>
                                    {isEdit
                                        ? activeSteps[currentIdx]?.label
                                        : `Step ${currentIdx + 1} of ${activeSteps.length} — ${activeSteps[currentIdx]?.label ?? ""}`}
                                </DrawerDescription>
                            </div>
                        </div>
                        {isEdit ? null : <StepDots steps={activeSteps} current={step} />}
                    </div>
                    {isEdit ? (
                        <StepChips steps={activeSteps} current={step} onSelect={setStep} />
                    ) : null}
                </DrawerStickyHeader>

                <DrawerBody className="pb-12 pt-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -12 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4"
                        >
                            {step === "template" && (
                                <div className="space-y-4">
                                    <div className="rounded-2xl border border-brand-deep/5 bg-brand-deep/2.5 px-4 py-3 dark:border-white/10 dark:bg-white/[0.035]">
                                        <div className="flex items-start gap-3">
                                            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-gold/10 text-brand-gold dark:bg-brand-gold/15 dark:text-brand-gold-300">
                                                <Sparkles className="h-4 w-4" />
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-brand-deep dark:text-brand-cream">
                                                    Start with the closest workflow
                                                </p>
                                                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                                    Templates prefill the agent name and opening greeting. You can still
                                                    edit the voice, prompts, tools, and numbers in the next steps.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <ManualSetupCard
                                        active={template === "scratch"}
                                        onClick={() => handleTemplate("scratch")}
                                    />

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 px-1">
                                            <span className="h-px flex-1 bg-brand-deep/8 dark:bg-white/10" />
                                            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                                Workflow templates
                                            </span>
                                            <span className="h-px flex-1 bg-brand-deep/8 dark:bg-white/10" />
                                        </div>
                                        {TEMPLATES.filter((t) => t.key !== "scratch").map((t) => (
                                            <OptionCard
                                                key={t.key}
                                                active={template === t.key}
                                                title={t.label}
                                                description={t.description}
                                                onClick={() => handleTemplate(t.key)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                            {step === "identity" && (
                                <div className="space-y-4">
                                    <Field label="Agent name">
                                        <Input
                                            placeholder="e.g. Sales Assistant"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="rounded-2xl border-brand-deep/8 bg-white/70 focus-visible:ring-brand-gold/20 dark:border-white/10 dark:bg-white/5"
                                        />
                                    </Field>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <Field label="Language">
                                            <Select value={language} onValueChange={setLanguage}>
                                                <SelectTrigger className="rounded-2xl border-brand-deep/8 bg-white/70 focus:ring-brand-gold/20 dark:border-white/10 dark:bg-white/5">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl">
                                                    <SelectItem value="en-NG">English (Nigeria)</SelectItem>
                                                    <SelectItem value="en-US">English (US)</SelectItem>
                                                    <SelectItem value="en-GB">English (UK)</SelectItem>
                                                    <SelectItem value="pcm-NG">Pidgin (Nigeria)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </Field>
                                        <Field label="Tone">
                                            <Select value={tone} onValueChange={setTone}>
                                                <SelectTrigger className="rounded-2xl border-brand-deep/8 bg-white/70 focus:ring-brand-gold/20 dark:border-white/10 dark:bg-white/5">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl">
                                                    <SelectItem value="professional">Professional</SelectItem>
                                                    <SelectItem value="warm">Warm</SelectItem>
                                                    <SelectItem value="concise">Concise</SelectItem>
                                                    <SelectItem value="supportive">Supportive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </Field>
                                    </div>

                                    <SpeechProviderPicker
                                        providers={speechProviders}
                                        isLoading={speechProvidersQuery.isLoading}
                                        selectedProviderId={activeProvider?.id ?? ""}
                                        selectedVoiceId={activeVoice?.id ?? ""}
                                        onProviderChange={(id) => {
                                            setSpeechProviderId(id)
                                            const provider = speechProviders.find((p) => p.id === id)
                                            const first = provider?.voices?.[0]?.id ?? ""
                                            setVoiceId(first)
                                        }}
                                        onVoiceChange={setVoiceId}
                                    />
                                </div>
                            )}
                            {step === "prompt" && (
                                <div className="space-y-3">
                                    <Field label="Greeting message">
                                        <Textarea
                                            rows={2}
                                            value={greeting}
                                            onChange={(e) => setGreeting(e.target.value)}
                                            placeholder="Hi! Thanks for calling — how can I help?"
                                            className="rounded-2xl border-brand-deep/8 bg-white/70 focus-visible:ring-brand-gold/20 dark:border-white/10 dark:bg-white/5"
                                        />
                                    </Field>
                                    <Field label="Fallback message">
                                        <Textarea
                                            rows={2}
                                            value={fallback}
                                            onChange={(e) => setFallback(e.target.value)}
                                            placeholder="Said when AI can't answer."
                                            className="rounded-2xl border-brand-deep/8 bg-white/70 focus-visible:ring-brand-gold/20 dark:border-white/10 dark:bg-white/5"
                                        />
                                    </Field>
                                    <Field label="Voicemail message">
                                        <Textarea
                                            rows={2}
                                            value={voicemail}
                                            onChange={(e) => setVoicemail(e.target.value)}
                                            placeholder="Played when nobody is available."
                                            className="rounded-2xl border-brand-deep/8 bg-white/70 focus-visible:ring-brand-gold/20 dark:border-white/10 dark:bg-white/5"
                                        />
                                    </Field>
                                    <Field label="Business info">
                                        <Textarea
                                            rows={3}
                                            value={businessInfo}
                                            onChange={(e) => setBusinessInfo(e.target.value)}
                                            placeholder="Hours, address, what you do — context for every call."
                                            className="rounded-2xl border-brand-deep/8 bg-white/70 focus-visible:ring-brand-gold/20 dark:border-white/10 dark:bg-white/5"
                                        />
                                    </Field>
                                    <Field label="Custom instructions">
                                        <Textarea
                                            rows={4}
                                            value={aiInstructions}
                                            onChange={(e) => setAiInstructions(e.target.value)}
                                            placeholder="Anything custom: always upsell add-ons, never quote prices, etc."
                                            className="rounded-2xl border-brand-deep/8 bg-white/70 focus-visible:ring-brand-gold/20 dark:border-white/10 dark:bg-white/5"
                                        />
                                    </Field>
                                    <Field label="Restricted topics">
                                        <Textarea
                                            rows={2}
                                            value={restrictedTopics}
                                            onChange={(e) => setRestrictedTopics(e.target.value)}
                                            placeholder="Topics this agent should refuse to discuss."
                                            className="rounded-2xl border-brand-deep/8 bg-white/70 focus-visible:ring-brand-gold/20 dark:border-white/10 dark:bg-white/5"
                                        />
                                    </Field>
                                </div>
                            )}
                            {step === "availability" && (
                                <AvailabilityStep
                                    isReady={isEditorHydrated}
                                    value={operatingHours}
                                    onChange={setOperatingHours}
                                />
                            )}
                            {step === "tools" && (
                                <ToolPicker
                                    selected={enabledTools}
                                    onChange={setEnabledTools}
                                />
                            )}
                            {step === "behaviour" && (
                                <div className="space-y-2">
                                    {(Object.keys(behaviourFlags) as (keyof typeof behaviourFlags)[]).map(
                                        (flag) => (
                                            <BehaviourRow
                                                key={flag}
                                                label={flagLabels[flag] ?? flag}
                                                description={flagDescriptions[flag] ?? null}
                                                badge={flag === "recording_enabled" ? "Coming soon" : undefined}
                                                checked={behaviourFlags[flag]}
                                                disabled={flag === "recording_enabled"}
                                                onChange={(v) =>
                                                    setBehaviourFlags((prev) => ({ ...prev, [flag]: v }))
                                                }
                                            />
                                        )
                                    )}
                                    <div className="mt-4 rounded-2xl border border-brand-deep/5 bg-brand-deep/2.5 p-3 dark:border-white/10 dark:bg-white/[0.035]">
                                        <BehaviourRow
                                            label="Default agent for new numbers"
                                            description="New numbers without an explicit agent assignment will fall back to this one."
                                            checked={isDefault}
                                            onChange={setIsDefault}
                                        />
                                    </div>
                                </div>
                            )}
                            {step === "numbers" && (
                                <div className="space-y-4">
                                    <div className="rounded-2xl border border-brand-deep/5 bg-brand-deep/2.5 px-4 py-3 dark:border-white/10 dark:bg-white/[0.035]">
                                        <div className="flex items-start gap-3">
                                            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-gold/10 text-brand-gold dark:bg-brand-gold/15 dark:text-brand-gold-300">
                                                <Phone className="h-4 w-4" />
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-brand-deep dark:text-brand-cream">
                                                    Choose where this agent should answer
                                                </p>
                                                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                                    Turn on the numbers that should route incoming calls to this AI
                                                    agent. You can skip this and assign numbers later.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    {numbers.length === 0 ? (
                                        <div className="rounded-2xl border border-dashed border-brand-deep/10 px-4 py-6 text-center dark:border-white/10">
                                            <p className="text-sm font-medium text-brand-deep dark:text-brand-cream">
                                                No connected numbers yet
                                            </p>
                                            <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-muted-foreground">
                                                Create this agent now, then provision a number from the Numbers tab and
                                                link it when ready.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
                                                <span>{selectedNumberIds.length} selected</span>
                                                <span>{numbers.length} available</span>
                                            </div>
                                            <div className="space-y-3">
                                                {numbers.map((n) => {
                                                    const isSelected = selectedNumberIds.includes(n.id)
                                                    const isLinkedElsewhere =
                                                        n.aiAgentId && (!agent || n.aiAgentId !== agent.id)
                                                    return (
                                                        <label
                                                            key={n.id}
                                                            className={cn(
                                                                "flex cursor-pointer items-center justify-between gap-3 rounded-2xl border p-4 transition-all",
                                                                isSelected
                                                                    ? "border-brand-green/35 bg-brand-green/4 ring-1 ring-inset ring-brand-green/15 dark:border-brand-gold/35 dark:bg-brand-gold/6 dark:ring-brand-gold/15"
                                                                    : "border-brand-deep/5 bg-brand-deep/[0.035] hover:border-brand-deep/10 hover:bg-brand-deep/5.5 dark:border-white/8 dark:bg-white/4.5 dark:hover:border-white/14 dark:hover:bg-white/[0.07]"
                                                            )}
                                                        >
                                                            <div className="min-w-0">
                                                                <p className="font-mono text-sm text-brand-deep dark:text-brand-cream">
                                                                    {formatPhoneNumber(n.phoneNumber) || n.phoneNumber}
                                                                </p>
                                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                                    {n.label || n.provider}{" "}
                                                                    {isLinkedElsewhere && "• currently linked to another agent"}
                                                                </p>
                                                            </div>
                                                            <div className="flex shrink-0 items-center gap-3">
                                                                <span className="hidden text-xs font-medium text-muted-foreground sm:inline">
                                                                    {isSelected ? "Routes here" : "Off"}
                                                                </span>
                                                                <Switch
                                                                    checked={isSelected}
                                                                    onCheckedChange={(checked) => {
                                                                        setSelectedNumberIds((prev) =>
                                                                            checked
                                                                                ? Array.from(new Set([...prev, n.id]))
                                                                                : prev.filter((id) => id !== n.id)
                                                                        )
                                                                    }}
                                                                />
                                                            </div>
                                                        </label>
                                                    )
                                                })}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                            {step === "review" && (
                                <div className="space-y-4">
                                    <div className="rounded-2xl border border-brand-deep/5 bg-brand-deep/2.5 px-4 py-3 dark:border-white/10 dark:bg-white/[0.035]">
                                        <div className="flex items-start gap-3">
                                            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-gold/10 text-brand-gold dark:bg-brand-gold/15 dark:text-brand-gold-300">
                                                <CheckCircle2 className="h-4 w-4" />
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-brand-deep dark:text-brand-cream">
                                                    Review before creating this agent
                                                </p>
                                                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                                    Check the identity, voice, tools, and number routing. You can go back
                                                    to adjust anything before saving.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 rounded-2xl border border-brand-deep/5 bg-brand-deep/2.5 p-5 text-sm dark:border-white/10 dark:bg-white/[0.035]">
                                        <ReviewRow label="Name" value={name || "—"} />
                                        <ReviewRow label="Language / tone" value={`${language} • ${tone}`} />
                                        <ReviewRow
                                            label="Speech provider"
                                            value={activeProvider?.displayName ?? "—"}
                                        />
                                        <ReviewRow label="Voice" value={activeVoice?.name ?? "—"} />
                                        <ReviewRow label="Tools enabled" value={`${enabledTools.length} tools`} />
                                        <ReviewRow label="Linked numbers" value={`${selectedNumberIds.length}`} />
                                        <ReviewRow
                                            label="Default agent"
                                            value={isDefault ? "Yes" : "No"}
                                        />
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </DrawerBody>

                <div className="border-t border-black/5 px-6 py-4 dark:border-white/5">
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-muted-foreground">
                            {isEdit
                                ? "Jump between sections above. Save changes whenever you're done."
                                : step === "review"
                                    ? "Review and save."
                                    : `${activeSteps[currentIdx]?.label ?? ""} — ${currentIdx + 1}/${activeSteps.length}`}
                        </span>
                        <div className="flex items-center gap-2">
                            {!isEdit && currentIdx > 0 && (
                                <Button variant="ghost" onClick={goBack} className="rounded-full">
                                    Back
                                </Button>
                            )}
                            {isEdit ? (
                                <Button
                                    onClick={() => handleSave()}
                                    disabled={!canSave || isSaving}
                                    className="rounded-full"
                                >
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Save changes
                                </Button>
                            ) : step !== "review" ? (
                                <Button onClick={goNext} className="rounded-full">
                                    Continue
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        variant="ghost"
                                        onClick={() => handleSave("draft")}
                                        disabled={!canSave || isSaving}
                                        className="rounded-full"
                                    >
                                        Save as draft
                                    </Button>
                                    <Button
                                        onClick={() => handleSave("active")}
                                        disabled={!canSave || isSaving}
                                        className="rounded-full"
                                    >
                                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Create & activate
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    )
}

function StepDots({
    steps,
    current,
}: {
    steps: typeof STEPS
    current: Step
}) {
    const currentIdx = steps.findIndex((s) => s.key === current)
    return (
        <div className="hidden items-center gap-1.5 sm:flex">
            {steps.map((s, idx) => (
                <span
                    key={s.key}
                    className={cn(
                        "h-1.5 w-4 rounded-full transition-colors",
                        idx <= currentIdx ? "bg-brand-gold-700" : "bg-black/10 dark:bg-white/10"
                    )}
                />
            ))}
        </div>
    )
}

function StepChips({
    steps,
    current,
    onSelect,
}: {
    steps: typeof STEPS
    current: Step
    onSelect: (step: Step) => void
}) {
    return (
        <div className="mt-3 -mx-1 flex items-center gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {steps.map((s) => {
                const Icon = s.icon
                const active = s.key === current
                return (
                    <button
                        key={s.key}
                        type="button"
                        onClick={() => onSelect(s.key)}
                        className={cn(
                            "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                            active
                                ? "bg-brand-deep text-brand-gold-300 dark:bg-brand-gold-700 dark:text-white"
                                : "text-muted-foreground hover:bg-black/5 hover:text-foreground dark:hover:bg-white/5"
                        )}
                    >
                        <Icon className="h-3.5 w-3.5" />
                        {s.label}
                    </button>
                )
            })}
        </div>
    )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="space-y-2">
            <label className="px-1 text-sm font-medium">{label}</label>
            {children}
        </div>
    )
}

function AvailabilityStep({
    isReady,
    value,
    onChange,
}: {
    isReady: boolean
    value: string
    onChange: (value: string) => void
}) {
    const [canRenderBuilder, setCanRenderBuilder] = useState(false)

    useEffect(() => {
        if (!isReady) return

        const timeoutId = window.setTimeout(() => {
            setCanRenderBuilder(true)
        }, 180)

        return () => window.clearTimeout(timeoutId)
    }, [isReady])

    if (!isReady || !canRenderBuilder) return <AvailabilityLoader />

    return (
        <OperatingHoursBuilder
            label="Availability"
            description="Set when this agent should answer calls. Outside these hours, callers follow the after-hours behaviour settings."
            value={value}
            onChange={onChange}
        />
    )
}

function AvailabilityLoader() {
    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-brand-deep/5 bg-brand-deep/2.5 px-4 py-3 dark:border-white/10 dark:bg-white/[0.035]">
                <div className="flex items-center gap-2 text-sm font-medium text-brand-deep dark:text-brand-cream">
                    <Loader2 className="h-4 w-4 animate-spin text-brand-gold" />
                    Loading opening hours
                </div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Preparing the weekly schedule editor.
                </p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-brand-deep/5 dark:border-white/10">
                {Array.from({ length: 5 }).map((_, index) => (
                    <div
                        key={index}
                        className={cn(
                            "grid gap-3 px-4 py-4 md:grid-cols-[1.1fr_0.8fr_0.8fr_auto] md:items-center",
                            index > 0 && "border-t border-brand-deep/5 dark:border-white/10"
                        )}
                    >
                        <div className="space-y-2">
                            <div className="h-4 w-28 rounded-full bg-brand-deep/8 dark:bg-white/10" />
                            <div className="h-3 w-20 rounded-full bg-brand-deep/5 dark:bg-white/8" />
                        </div>
                        <div className="h-12 rounded-2xl bg-brand-deep/5 dark:bg-white/8" />
                        <div className="h-12 rounded-2xl bg-brand-deep/5 dark:bg-white/8" />
                        <div className="h-12 w-28 rounded-2xl bg-brand-deep/5 dark:bg-white/8" />
                    </div>
                ))}
            </div>
        </div>
    )
}

function OptionCard({
    active,
    title,
    description,
    onClick,
}: {
    active: boolean
    title: string
    description: string
    onClick: () => void
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "flex w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/20",
                active
                    ? "border-brand-gold/45 bg-brand-gold/6 ring-1 ring-inset ring-brand-gold/20 shadow-brand-gold/5"
                    : "border-brand-deep/5 bg-brand-deep/[0.035] hover:border-brand-deep/10 hover:bg-brand-deep/5.5 dark:border-white/8 dark:bg-white/4.5 dark:hover:border-white/14 dark:hover:bg-white/[0.07]"
            )}
        >
            <div>
                <p className="text-sm font-semibold text-brand-deep dark:text-brand-cream">{title}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            {active && <CheckCircle2 className="h-5 w-5 text-brand-gold" />}
        </button>
    )
}

function ManualSetupCard({
    active,
    onClick,
}: {
    active: boolean
    onClick: () => void
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/20",
                active
                    ? "border-brand-deep/20 bg-white ring-1 ring-inset ring-brand-deep/10 dark:border-white/18 dark:bg-white/[0.06]"
                    : "border-brand-deep/8 bg-white/70 hover:border-brand-deep/14 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-white/16 dark:hover:bg-white/[0.07]"
            )}
        >
            <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-deep/5 text-brand-deep dark:bg-white/8 dark:text-brand-cream">
                    <ArrowRight className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-brand-deep dark:text-brand-cream">
                        Start from scratch
                    </p>
                    <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                        Configure every step manually without preset tools or copy.
                    </p>
                </div>
            </div>
            {active && <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-deep dark:text-brand-cream" />}
        </button>
    )
}

function SpeechProviderPicker({
    providers,
    isLoading,
    selectedProviderId,
    selectedVoiceId,
    onProviderChange,
    onVoiceChange,
}: {
    providers: VoiceSpeechProviderItem[]
    isLoading: boolean
    selectedProviderId: string
    selectedVoiceId: string
    onProviderChange: (id: string) => void
    onVoiceChange: (id: string) => void
}) {
    const activeProvider = useMemo(
        () => providers.find((p) => p.id === selectedProviderId) ?? null,
        [providers, selectedProviderId]
    )
    const voices = activeProvider?.voices ?? []
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [playingUrl, setPlayingUrl] = useState<string | null>(null)

    useEffect(() => {
        return () => {
            audioRef.current?.pause()
            audioRef.current = null
        }
    }, [])

    const handlePreview = (url: string) => {
        if (typeof window === "undefined") return

        if (playingUrl === url) {
            audioRef.current?.pause()
            if (audioRef.current) audioRef.current.currentTime = 0
            audioRef.current = null
            setPlayingUrl(null)
            return
        }

        audioRef.current?.pause()
        if (audioRef.current) audioRef.current.currentTime = 0

        const audio = new Audio(url)
        audioRef.current = audio
        setPlayingUrl(url)
        audio.addEventListener("ended", () => setPlayingUrl(null), { once: true })
        audio.addEventListener("error", () => setPlayingUrl(null), { once: true })
        void audio.play().catch(() => {
            if (audioRef.current === audio) audioRef.current = null
            setPlayingUrl(null)
        })
    }

    if (isLoading && providers.length === 0) {
        return (
            <div className="space-y-2">
                <label className="px-1 text-sm font-medium">Speech provider</label>
                <div className="flex items-center gap-2 rounded-2xl border border-brand-deep/5 bg-brand-deep/2.5 px-3 py-3 text-sm text-muted-foreground dark:border-white/10 dark:bg-white/[0.035]">
                    <Loader2 className="h-4 w-4 animate-spin text-brand-gold" />
                    Loading voices…
                </div>
            </div>
        )
    }

    if (providers.length === 0) {
        return (
            <div className="space-y-2">
                <label className="px-1 text-sm font-medium">Speech provider</label>
                <div className="rounded-2xl border border-brand-gold/15 bg-brand-gold/5 px-3 py-3 text-sm text-muted-foreground dark:border-brand-gold/20 dark:bg-brand-gold/10">
                    No speech providers enabled. Ask an admin to enable one in System Configuration.
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            <Field label="Speech provider">
                <div className="grid gap-2 sm:grid-cols-2">
                    {providers.map((provider) => {
                        const active = provider.id === selectedProviderId
                        return (
                            <button
                                key={provider.id}
                                type="button"
                                onClick={() => onProviderChange(provider.id)}
                                className={cn(
                                    "rounded-3xl cursor-pointer border p-3 text-left shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/20",
                                    active
                                        ? "border-brand-gold/45 bg-brand-gold/[0.06] ring-1 ring-inset ring-brand-gold/20 shadow-brand-gold/5"
                                        : "border-brand-deep/8 bg-brand-deep/[0.035] hover:border-brand-deep/16 hover:bg-brand-deep/[0.055] dark:border-white/8 dark:bg-white/[0.045] dark:hover:border-white/16 dark:hover:bg-white/[0.07]"
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold">{provider.displayName}</p>
                                    {provider.isDefault && (
                                        <span className="rounded-full bg-brand-gold/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand-gold">
                                            Default
                                        </span>
                                    )}
                                </div>
                                {provider.description && (
                                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                                        {provider.description}
                                    </p>
                                )}
                                <p className="mt-2 text-[11px] text-muted-foreground">
                                    {provider.voices.length} voice{provider.voices.length === 1 ? "" : "s"}
                                </p>
                            </button>
                        )
                    })}
                </div>
            </Field>

            <Field label="Voice">
                {voices.length === 0 ? (
                    <div className="rounded-2xl border border-brand-gold/15 bg-brand-gold/5 px-3 py-3 text-sm text-muted-foreground dark:border-brand-gold/20 dark:bg-brand-gold/10">
                        This provider has no voices configured yet.
                    </div>
                ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                        {voices.map((voice) => {
                            const active = voice.id === selectedVoiceId
                            return (
                                <div
                                    key={voice.id}
                                    onClick={() => onVoiceChange(voice.id)}
                                    className={cn(
                                        "flex items-start justify-between gap-3 rounded-3xl border p-3 text-left shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/20",
                                        active
                                            ? "border-brand-gold/45 bg-brand-gold/6 ring-1 ring-inset ring-brand-gold/20 shadow-brand-gold/5"
                                            : "border-brand-deep/8 bg-brand-deep/[0.035] hover:border-brand-deep/16 hover:bg-brand-deep/[0.055] dark:border-white/8 dark:bg-white/[0.045] dark:hover:border-white/16 dark:hover:bg-white/[0.07]"
                                    )}
                                >
                                    <button
                                        type="button"
                                        onClick={() => onVoiceChange(voice.id)}
                                        className="min-w-0 cursor-pointer flex-1 text-left focus-visible:outline-none"
                                    >
                                        <div className="flex items-center gap-2">
                                            <p className="truncate text-sm font-semibold">{voice.name}</p>
                                            {voice.tier === "premium" && (
                                                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-700 dark:text-amber-300">
                                                    Premium
                                                </span>
                                            )}
                                        </div>
                                        {voice.description && (
                                            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                                                {voice.description}
                                            </p>
                                        )}
                                        <div className="mt-1 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
                                            {voice.gender && <span className="capitalize">{voice.gender}</span>}
                                            {voice.accent && voice.gender && <span>·</span>}
                                            {voice.accent && <span>{voice.accent}</span>}
                                        </div>
                                    </button>
                                    {voice.previewUrl && (
                                        <VoicePreviewButton
                                            isPlaying={playingUrl === voice.previewUrl}
                                            onPreview={() => handlePreview(voice.previewUrl!)}
                                        />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </Field>
        </div>
    )
}

function VoicePreviewButton({
    isPlaying,
    onPreview,
}: {
    isPlaying: boolean
    onPreview: () => void
}) {
    return (
        <button
            type="button"
            onClick={(event) => {
                event.stopPropagation()
                onPreview()
            }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-gold-700 text-white shadow-sm shadow-brand-gold/15 hover:bg-brand-gold-600"
            aria-label="Preview voice"
        >
            {isPlaying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
        </button>
    )
}

function BehaviourRow({
    label,
    description,
    badge,
    checked,
    disabled,
    onChange,
}: {
    label: string
    description?: string | null
    badge?: string
    checked: boolean
    disabled?: boolean
    onChange: (v: boolean) => void
}) {
    return (
        <div
            className={cn(
                "flex items-start justify-between gap-3 rounded-2xl border border-brand-deep/5 bg-brand-deep/2.5 px-3 py-3 dark:border-white/10 dark:bg-white/[0.035]",
                disabled && "opacity-75"
            )}
        >
            <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{label}</p>
                    {badge && (
                        <span className="rounded-full border border-brand-gold/20 bg-brand-gold/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand-gold">
                            {badge}
                        </span>
                    )}
                </div>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </div>
            <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
        </div>
    )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium">{value}</span>
        </div>
    )
}

function findPresetForTemplate(templateKey: string, presets: VoiceToolPreset[]) {
    const keywordsByTemplate: Record<string, string[]> = {
        sales: ["sales", "ecommerce", "e-commerce", "commerce", "retail", "catalog"],
        support: ["support", "customer", "faq", "help"],
        restaurant: ["restaurant", "menu", "table", "booking"],
        service: ["service", "appointment", "booking", "consultant"],
    }
    const keywords = keywordsByTemplate[templateKey] ?? [templateKey]
    return presets.find((preset) => {
        const searchable = `${preset.key} ${preset.label} ${preset.description}`.toLowerCase()
        return keywords.some((keyword) => searchable.includes(keyword))
    })
}

const flagLabels: Record<string, string> = {
    ai_enabled: "AI answering enabled",
    recording_enabled: "Recording calls",
    transcription_enabled: "Live transcription",
    human_handoff_enabled: "Press 0 to reach a human",
    after_hours_enabled: "Answer outside business hours",
    disclosure_enabled: "Announce that this is an AI",
}

const flagDescriptions: Record<string, string> = {
    ai_enabled: "Turn off to immediately go to voicemail.",
    recording_enabled: "Store call audio for review and training.",
    transcription_enabled: "Generate text transcripts of each call.",
    human_handoff_enabled: "Caller can press 0 to transfer to a real person.",
    after_hours_enabled: "When off, after-hours callers reach voicemail directly.",
    disclosure_enabled: "Recommended for compliance in many regions.",
}
