"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon as AlertTriangle, ArrowLeft01Icon as ArrowLeft, ArrowRight01Icon as ArrowRight, CheckmarkCircle02Icon as CheckCircle2, ChevronRightIcon as ChevronRight, Clock01Icon as Clock, Loading03Icon as Loader2, PackageDeliveredIcon as PackageCheck, CallIcon as Phone, SecurityCheckIcon as ShieldCheck, SparklesIcon as Sparkles, Wallet01Icon as Wallet } from "@hugeicons/core-free-icons"
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
import { Textarea } from "@/app/components/ui/textarea"
import { Skeleton } from "@/app/components/ui/skeleton"
import { CurrencyDisplay } from "@/app/components/shared/CurrencyDisplay"
import { cn } from "@/app/lib/utils"
import {
    useCreateVoiceNumberRequest,
    useNumberPoolAvailability,
    useNumberRequestEligibility,
    useNumberRequestPricing,
    useVoiceAiAgents,
    useVoiceProviders,
    type VoiceProviderOption,
} from "@/app/domains/voice/hooks/useVoice"

type WizardStep = "gate" | "mode" | "pricing" | "agent" | "confirm"
type WizardMode = "basic" | "advanced"
type NumberType = "local" | "mobile" | "toll_free" | "national"

const STEP_ORDER: WizardStep[] = ["gate", "mode", "pricing", "agent", "confirm"]

interface VoiceNumberRequestWizardProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    trigger?: ReactNode
}

/**
 * Multi-step replacement for `VoiceNumberRequestDrawer` — see plan §5b.
 *
 * Flow: Gate (KYC + wallet) → Mode (Basic/Advanced) → Pricing preview →
 * AI agent selection (optional) → Confirm.
 *
 * The wizard intentionally keeps PIN verification inline (a simple confirm
 * button) rather than wiring `PinVerificationDrawer`, because the wallet
 * has already been gated and the actual debit happens after submit. PIN
 * gating for wallet-debiting actions is handled centrally by the API.
 */
export function VoiceNumberRequestWizard({
    open,
    onOpenChange,
    trigger,
}: VoiceNumberRequestWizardProps) {
    const providersQuery = useVoiceProviders()
    const providers = useMemo(() => providersQuery.data ?? [], [providersQuery.data])

    const [step, setStep] = useState<WizardStep>("gate")
    const [mode, setMode] = useState<WizardMode>("basic")
    const [providerId, setProviderId] = useState<string>("")
    const [countryCode, setCountryCode] = useState<string>("")
    const [numberType, setNumberType] = useState<NumberType>("local")
    const [quantity, setQuantity] = useState<number>(1)
    const [aiAgentId, setAiAgentId] = useState<string | null>(null)
    const [label, setLabel] = useState<string>("")
    const [notes, setNotes] = useState<string>("")

    useEffect(() => {
        if (open) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setStep("gate")
            setMode("basic")
        }
    }, [open])

    useEffect(() => {
        if (providerId || providers.length === 0) return
        const def = providers.find((p) => p.isDefault) ?? providers[0]
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (def) setProviderId(def.id)
    }, [providers, providerId])

    const selectedProvider = useMemo<VoiceProviderOption | null>(
        () => providers.find((p) => p.id === providerId) ?? null,
        [providers, providerId]
    )
    const countries = useMemo(
        () => selectedProvider?.supportedCountries ?? [],
        [selectedProvider?.supportedCountries]
    )

    useEffect(() => {
        if (!countries.length) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            if (countryCode) setCountryCode("")
            return
        }
        if (countryCode && countries.some((c) => c.code === countryCode)) return
        const def = countries.find((c) => c.isDefault) ?? countries[0]
        if (def) setCountryCode(def.code)
    }, [countries, countryCode])

    const eligibilityQuery = useNumberRequestEligibility({
        provider: providerId || undefined,
        countryCode: countryCode || undefined,
        numberType,
        quantity,
    })
    const pricingQuery = useNumberRequestPricing({
        provider: providerId || undefined,
        countryCode: countryCode || undefined,
        numberType,
        quantity,
    })
    const aiAgentsQuery = useVoiceAiAgents()
    const availabilityQuery = useNumberPoolAvailability(providerId || undefined)
    const createRequest = useCreateVoiceNumberRequest()

    const eligibility = eligibilityQuery.data
    const pricing = pricingQuery.data
    const aiAgents = aiAgentsQuery.data ?? []
    const isEligible = eligibility?.isEligible === true

    // How many numbers we currently hold in the pool for the chosen
    // country + type. `0` means the request will join the waitlist.
    const availableStock = useMemo(() => {
        const rows = availabilityQuery.data ?? []
        const match = rows.find(
            (r) => r.countryCode === countryCode && r.numberType === numberType
        )
        return match?.available ?? 0
    }, [availabilityQuery.data, countryCode, numberType])

    const canAdvanceFromGate = isEligible
    const canAdvanceFromMode = Boolean(providerId && countryCode)
    const canAdvanceFromPricing = Boolean(pricing)
    const canSubmit = canAdvanceFromPricing && isEligible

    const handleSubmit = async () => {
        if (!canSubmit) return
        try {
            await createRequest.mutateAsync({
                provider: providerId,
                label: label || null,
                country_code: countryCode,
                number_type: numberType,
                quantity,
                ai_agent_id: aiAgentId,
                notes: notes || null,
            })
            onOpenChange(false)
        } catch {
            // Toast handled inside the hook.
        }
    }

    const goNext = () => {
        const idx = STEP_ORDER.indexOf(step)
        if (idx >= 0 && idx < STEP_ORDER.length - 1) setStep(STEP_ORDER[idx + 1])
    }
    const goBack = () => {
        const idx = STEP_ORDER.indexOf(step)
        if (idx > 0) setStep(STEP_ORDER[idx - 1])
    }

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            {trigger}
            <DrawerContent className="max-h-[92vh]">
                <DrawerStickyHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {step !== "gate" && (
                                <button
                                    onClick={goBack}
                                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/5 transition-all hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
                                >
                                    <HugeiconsIcon icon={ArrowLeft} className="h-4 w-4" />
                                </button>
                            )}
                            <div className="space-y-1">
                                <DrawerTitle className="font-sans text-xl font-semibold">
                                    Get a voice number
                                </DrawerTitle>
                                <DrawerDescription>
                                    Step {STEP_ORDER.indexOf(step) + 1} of {STEP_ORDER.length}
                                </DrawerDescription>
                            </div>
                        </div>
                        <WizardProgress current={step} />
                    </div>
                </DrawerStickyHeader>

                <DrawerBody className="pb-12 pt-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -12 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-6"
                        >
                            {step === "gate" && (
                                <GateStep
                                    isLoading={eligibilityQuery.isLoading || providersQuery.isLoading}
                                    eligibility={eligibility ?? null}
                                    onClose={() => onOpenChange(false)}
                                />
                            )}
                            {step === "mode" && (
                                <ModeStep
                                    mode={mode}
                                    onModeChange={setMode}
                                    providers={providers}
                                    providerId={providerId}
                                    onProviderChange={setProviderId}
                                    countryCode={countryCode}
                                    onCountryChange={setCountryCode}
                                    numberType={numberType}
                                    onNumberTypeChange={setNumberType}
                                    quantity={quantity}
                                    onQuantityChange={setQuantity}
                                    label={label}
                                    onLabelChange={setLabel}
                                    availableStock={availableStock}
                                    isCheckingStock={availabilityQuery.isLoading}
                                />
                            )}
                            {step === "pricing" && (
                                <PricingStep
                                    isLoading={pricingQuery.isLoading}
                                    pricing={pricing ?? null}
                                    error={pricingQuery.error as Error | null}
                                    eligibility={eligibility ?? null}
                                />
                            )}
                            {step === "agent" && (
                                <AgentStep
                                    isLoading={aiAgentsQuery.isLoading}
                                    aiAgents={aiAgents}
                                    selectedId={aiAgentId}
                                    onSelect={setAiAgentId}
                                    notes={notes}
                                    onNotesChange={setNotes}
                                />
                            )}
                            {step === "confirm" && (
                                <ConfirmStep
                                    provider={selectedProvider}
                                    countryCode={countryCode}
                                    numberType={numberType}
                                    quantity={quantity}
                                    label={label}
                                    notes={notes}
                                    selectedAgentName={
                                        aiAgents.find((a) => a.id === aiAgentId)?.name ??
                                        (aiAgents.find((a) => a.isDefault)?.name
                                            ? `${aiAgents.find((a) => a.isDefault)?.name} (default)`
                                            : "Default AI agent will be assigned")
                                    }
                                    pricing={pricing ?? null}
                                    availableStock={availableStock}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </DrawerBody>

                <div className="border-t border-black/5 px-6 py-4 dark:border-white/5">
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-muted-foreground">
                            {step === "gate" && "Confirm your account is ready to get a number."}
                            {step === "mode" && (mode === "basic" ? "Pick a country and we'll assign a number." : "Pick the exact number type and quantity.")}
                            {step === "pricing" && "You're only charged once a number is assigned."}
                            {step === "agent" && "Optionally pre-link an AI agent for this number."}
                            {step === "confirm" && (availableStock > 0 ? "We'll assign a number and debit your wallet." : "We'll add you to the waitlist — no charge yet.")}
                        </span>
                        <div className="flex items-center gap-2">
                            {step !== "gate" && (
                                <Button variant="ghost" onClick={goBack} className="rounded-full">
                                    Back
                                </Button>
                            )}
                            {step !== "confirm" ? (
                                <Button
                                    onClick={goNext}
                                    disabled={
                                        (step === "gate" && !canAdvanceFromGate) ||
                                        (step === "mode" && !canAdvanceFromMode) ||
                                        (step === "pricing" && !canAdvanceFromPricing)
                                    }
                                    className="rounded-full"
                                >
                                    Continue
                                    <HugeiconsIcon icon={ArrowRight} className="ml-2 h-4 w-4" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleSubmit}
                                    disabled={!canSubmit || createRequest.isPending}
                                    className="rounded-full"
                                >
                                    {createRequest.isPending ? (
                                        <HugeiconsIcon icon={Loader2} className="mr-2 h-4 w-4 animate-spin" />
                                    ) : null}
                                    {availableStock > 0 ? "Confirm & pay" : "Join waitlist"}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Steps
// ─────────────────────────────────────────────────────────────────────────────

function WizardProgress({ current }: { current: WizardStep }) {
    return (
        <div className="hidden items-center gap-1.5 sm:flex">
            {STEP_ORDER.map((s) => (
                <span
                    key={s}
                    className={cn(
                        "h-1.5 w-6 rounded-full transition-colors",
                        STEP_ORDER.indexOf(current) >= STEP_ORDER.indexOf(s)
                            ? "bg-brand-gold-700"
                            : "bg-black/10 dark:bg-white/10"
                    )}
                />
            ))}
        </div>
    )
}

function GateStep({
    isLoading,
    eligibility,
    onClose,
}: {
    isLoading: boolean
    eligibility: import("@/app/domains/voice/hooks/useVoice").VoiceEligibilityResult | null
    onClose: () => void
}) {
    return (
        <div className="space-y-5">
            <SectionHeader
                icon={ShieldCheck}
                title="Account readiness check"
                description="We do a quick KYC and wallet check so provisioning never fails halfway."
            />

            {isLoading ? (
                <div className="space-y-3">
                    <Skeleton className="h-16 w-full rounded-2xl" />
                    <Skeleton className="h-16 w-full rounded-2xl" />
                </div>
            ) : eligibility ? (
                <div className="divide-y divide-brand-deep/5 rounded-2xl border-y border-brand-deep/5 dark:divide-white/10 dark:border-white/10">
                    {eligibility.gates.map((gate) => (
                        <GateCard
                            key={gate.key}
                            icon={gate.key === "kyc" ? ShieldCheck : Wallet}
                            title={gate.key === "kyc" ? "KYC verification" : "Wallet balance"}
                            satisfied={gate.satisfied}
                            action={gate.action}
                            cta={gate.cta}
                            onClose={onClose}
                        />
                    ))}
                </div>
            ) : (
                <p className="rounded-2xl border border-brand-deep/5 bg-brand-deep/[0.025] px-4 py-3 text-sm text-muted-foreground dark:border-white/10 dark:bg-white/[0.035]">
                    We&apos;re preparing your account readiness check.
                </p>
            )}
        </div>
    )
}

function GateCard({
    icon: Icon,
    title,
    satisfied,
    action,
    cta,
    onClose,
}: {
    icon: typeof ShieldCheck
    title: string
    satisfied: boolean
    action: string
    cta?: { label: string; href: string }
    onClose: () => void
}) {
    return (
        <div className="flex items-center gap-4 py-4">
            <div
                className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                    satisfied
                        ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
                        : "bg-brand-gold/10 text-brand-gold dark:bg-brand-gold/15 dark:text-brand-gold-300"
                )}
            >
                {satisfied ? <HugeiconsIcon icon={CheckCircle2} className="h-5 w-5" /> : <HugeiconsIcon icon={Icon} className="h-5 w-5" />}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-brand-deep dark:text-brand-cream">{title}</h3>
                    <span
                        className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-medium",
                            satisfied
                                ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
                                : "bg-brand-gold/10 text-brand-gold dark:bg-brand-gold/15 dark:text-brand-gold-300"
                        )}
                    >
                        {satisfied ? "Ready" : "Action needed"}
                    </span>
                </div>
                <p className="text-sm text-muted-foreground">{action}</p>
                {!satisfied && cta && (
                    <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 rounded-full border-brand-gold/25 text-brand-gold hover:bg-brand-gold/10 hover:text-brand-gold"
                        onClick={() => {
                            onClose()
                            setTimeout(() => {
                                window.location.href = cta.href
                            }, 200)
                        }}
                    >
                        {cta.label}
                        <HugeiconsIcon icon={ChevronRight} className="ml-1 h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    )
}

function ModeStep({
    mode,
    onModeChange,
    providers,
    providerId,
    onProviderChange,
    countryCode,
    onCountryChange,
    numberType,
    onNumberTypeChange,
    quantity,
    onQuantityChange,
    label,
    onLabelChange,
    availableStock,
    isCheckingStock,
}: {
    mode: WizardMode
    onModeChange: (v: WizardMode) => void
    providers: VoiceProviderOption[]
    providerId: string
    onProviderChange: (v: string) => void
    countryCode: string
    onCountryChange: (v: string) => void
    numberType: NumberType
    onNumberTypeChange: (v: NumberType) => void
    quantity: number
    onQuantityChange: (v: number) => void
    label: string
    onLabelChange: (v: string) => void
    availableStock: number
    isCheckingStock: boolean
}) {
    const selectedProvider = providers.find((p) => p.id === providerId) ?? null
    const countries = selectedProvider?.supportedCountries ?? []

    return (
        <div className="space-y-5">
            <SectionHeader
                icon={Phone}
                title="Choose your number"
                description="Most teams use Basic. Switch to Advanced if you need a specific number type or quantity."
            />

            <div className="grid grid-cols-2 rounded-2xl border border-brand-deep/5 bg-brand-deep/[0.035] p-1 dark:border-white/10 dark:bg-white/[0.045]">
                <ModeTab active={mode === "basic"} onClick={() => onModeChange("basic")}>
                    Basic
                </ModeTab>
                <ModeTab active={mode === "advanced"} onClick={() => onModeChange("advanced")}>
                    Advanced
                </ModeTab>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                    <label className="px-1 text-sm font-medium text-brand-deep dark:text-brand-cream">Voice plan</label>
                    <Select value={providerId} onValueChange={onProviderChange}>
                        <SelectTrigger className="rounded-2xl border-brand-deep/8 bg-white/70 dark:border-white/10 dark:bg-white/5">
                            <SelectValue placeholder="Pick a plan" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                            {providers.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                    {p.displayName || p.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <label className="px-1 text-sm font-medium text-brand-deep dark:text-brand-cream">Country</label>
                    <Select value={countryCode} onValueChange={onCountryChange} disabled={!countries.length}>
                        <SelectTrigger className="rounded-2xl border-brand-deep/8 bg-white/70 dark:border-white/10 dark:bg-white/5">
                            <SelectValue placeholder="Pick a country" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                            {countries.map((c) => (
                                <SelectItem key={c.id} value={c.code}>
                                    {c.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {mode === "advanced" && (
                    <>
                        <div className="space-y-2">
                            <label className="px-1 text-sm font-medium text-brand-deep dark:text-brand-cream">Number type</label>
                            <Select value={numberType} onValueChange={(v) => onNumberTypeChange(v as NumberType)}>
                                <SelectTrigger className="rounded-2xl border-brand-deep/8 bg-white/70 dark:border-white/10 dark:bg-white/5">
                                    <SelectValue placeholder="Pick a number type" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl">
                                    <SelectItem value="local">Local</SelectItem>
                                    <SelectItem value="mobile">Mobile</SelectItem>
                                    <SelectItem value="toll_free">Toll-free</SelectItem>
                                    <SelectItem value="national">National</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="px-1 text-sm font-medium text-brand-deep dark:text-brand-cream">Quantity</label>
                            <Input
                                type="number"
                                min={1}
                                max={5}
                                value={quantity}
                                onChange={(e) => onQuantityChange(Math.max(1, Math.min(5, Number(e.target.value || 1))))}
                                className="rounded-2xl border-brand-deep/8 bg-white/70 dark:border-white/10 dark:bg-white/5"
                            />
                        </div>
                    </>
                )}

                <div className="space-y-2 sm:col-span-2">
                    <label className="px-1 text-sm font-medium text-brand-deep dark:text-brand-cream">Internal label (optional)</label>
                    <Input
                        placeholder="e.g. Main support line"
                        value={label}
                        onChange={(e) => onLabelChange(e.target.value)}
                        className="rounded-2xl border-brand-deep/8 bg-white/70 dark:border-white/10 dark:bg-white/5"
                    />
                </div>
            </div>

            {countryCode && <StockIndicator available={availableStock} isLoading={isCheckingStock} />}
        </div>
    )
}

/**
 * Shows how many numbers we currently hold in the pool for the chosen
 * country + type. When empty, explains the waitlist path — the request can
 * still be submitted and is auto-assigned the moment we load stock.
 */
function StockIndicator({ available, isLoading }: { available: number; isLoading: boolean }) {
    if (isLoading) {
        return <Skeleton className="h-16 w-full rounded-2xl" />
    }
    if (available > 0) {
        return (
            <div className="flex items-start gap-3 rounded-2xl border border-brand-green/20 bg-brand-green/[0.045] p-4 dark:border-brand-green/25 dark:bg-brand-green/[0.08]">
                <HugeiconsIcon icon={PackageCheck} className="mt-0.5 h-5 w-5 text-brand-green dark:text-brand-green-300" />
                <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-brand-deep dark:text-brand-cream">
                        {available} {available === 1 ? "number" : "numbers"} ready to assign
                    </p>
                    <p className="text-sm text-muted-foreground">
                        We&apos;ll assign one from our verified pool the instant you confirm.
                    </p>
                </div>
            </div>
        )
    }
    return (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
            <HugeiconsIcon icon={Clock} className="mt-0.5 h-5 w-5 text-amber-600" />
            <div className="space-y-0.5">
                <p className="text-sm font-semibold text-brand-deep dark:text-brand-cream">
                    None in stock right now
                </p>
                <p className="text-sm text-muted-foreground">
                    You can still submit — we&apos;ll add you to the waitlist and assign a number
                    automatically as soon as stock arrives. You won&apos;t be charged until then.
                </p>
            </div>
        </div>
    )
}

function ModeTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                active
                    ? "bg-white text-brand-deep shadow-sm dark:bg-white/10 dark:text-brand-cream"
                    : "text-muted-foreground hover:text-brand-deep dark:hover:text-brand-cream"
            )}
        >
            {children}
        </button>
    )
}

function PricingStep({
    isLoading,
    pricing,
    error,
    eligibility,
}: {
    isLoading: boolean
    pricing: import("@/app/domains/voice/hooks/useVoice").VoiceNumberPricing | null
    error: Error | null
    eligibility: import("@/app/domains/voice/hooks/useVoice").VoiceEligibilityResult | null
}) {
    if (isLoading) {
        return (
            <div className="space-y-3">
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-20 w-full rounded-2xl" />
            </div>
        )
    }
    if (error || !pricing) {
        return (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
                <HugeiconsIcon icon={AlertTriangle} className="h-5 w-5 text-amber-600" />
                <div className="space-y-1">
                    <h3 className="text-sm font-semibold">No pricing configured</h3>
                    <p className="text-sm text-muted-foreground">
                        We don&apos;t have pricing for this combination yet. Try a different country or number type, or contact support.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <SectionHeader
                icon={Wallet}
                title="Pricing preview"
                description="Setup fee + the first month's rental. You're only charged once a number is assigned to you."
            />

            <div className="rounded-2xl border border-brand-deep/5 bg-brand-deep/[0.025] p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
                <div className="space-y-3">
                    <PriceRow label="Setup fee" amount={pricing.setupFee} currency={pricing.currency} qty={pricing.quantity} />
                    <PriceRow label="Monthly rental (first month)" amount={pricing.monthlyFee} currency={pricing.currency} qty={pricing.quantity} />
                    <div className="border-t border-brand-deep/5 pt-3 dark:border-white/10">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-brand-deep dark:text-brand-cream">Upfront total</span>
                            <span className="text-lg font-bold text-brand-deep dark:text-brand-cream">
                                <CurrencyDisplay value={pricing.totalUpfrontDebit} currency={pricing.currency} />
                            </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Renews at <CurrencyDisplay value={pricing.totalMonthlyFee} currency={pricing.currency} />/month.
                        </p>
                    </div>
                </div>
            </div>

            {eligibility?.wallet && (
                <div className="flex items-center justify-between rounded-2xl border border-brand-green/15 bg-brand-green/[0.035] p-3 text-sm dark:border-brand-green/20 dark:bg-brand-green/[0.06]">
                    <span className="text-muted-foreground">Wallet balance after debit</span>
                    <span className="font-medium text-brand-deep dark:text-brand-cream">
                        <CurrencyDisplay
                            value={eligibility.wallet.balance - pricing.totalUpfrontDebit}
                            currency={eligibility.wallet.currency}
                        />
                    </span>
                </div>
            )}
        </div>
    )
}

function PriceRow({ label, amount, currency, qty }: { label: string; amount: number; currency: string; qty: number }) {
    return (
        <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
                {label}
                {qty > 1 ? ` × ${qty}` : ""}
            </span>
            <span className="font-medium">
                <CurrencyDisplay value={amount * qty} currency={currency} />
            </span>
        </div>
    )
}

function AgentStep({
    isLoading,
    aiAgents,
    selectedId,
    onSelect,
    notes,
    onNotesChange,
}: {
    isLoading: boolean
    aiAgents: import("@/app/domains/voice/hooks/useVoice").AiAgentItem[]
    selectedId: string | null
    onSelect: (id: string | null) => void
    notes: string
    onNotesChange: (v: string) => void
}) {
    const defaultAgent = aiAgents.find((a) => a.isDefault) ?? null

    return (
        <div className="space-y-4">
            <SectionHeader
                icon={Sparkles}
                title="Pre-link an AI agent (optional)"
                description="Skip this if you&apos;ll configure after the number is provisioned. The default AI agent runs in the meantime."
            />

            {isLoading ? (
                <div className="space-y-2">
                    <Skeleton className="h-14 w-full rounded-2xl" />
                    <Skeleton className="h-14 w-full rounded-2xl" />
                </div>
            ) : aiAgents.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-brand-deep/10 bg-brand-deep/[0.025] p-4 text-sm text-muted-foreground dark:border-white/10 dark:bg-white/[0.035]">
                    You haven&apos;t created any AI agents yet. We&apos;ll use a default agent once the number is provisioned.
                </div>
            ) : (
                <div className="space-y-2">
                    <AgentOption
                        active={selectedId === null}
                        title={defaultAgent ? `Default — ${defaultAgent.name}` : "Default AI agent"}
                        subtitle="Calls answer with your business's default voice agent."
                        onClick={() => onSelect(null)}
                    />
                    {aiAgents
                        .filter((a) => !a.isDefault)
                        .map((agent) => (
                            <AgentOption
                                key={agent.id}
                                active={selectedId === agent.id}
                                title={agent.name}
                                subtitle={`${agent.enabledTools.length} tools • ${agent.linkedNumberCount} numbers linked`}
                                onClick={() => onSelect(agent.id)}
                            />
                        ))}
                </div>
            )}

            <div className="space-y-2">
                <label className="px-1 text-sm font-medium text-brand-deep dark:text-brand-cream">Anything we should know? (optional)</label>
                <Textarea
                    placeholder="Use cases, special routing needs, etc."
                    rows={3}
                    value={notes}
                    onChange={(e) => onNotesChange(e.target.value)}
                    className="rounded-2xl border-brand-deep/8 bg-white/70 dark:border-white/10 dark:bg-white/5"
                />
            </div>
        </div>
    )
}

function AgentOption({
    active,
    title,
    subtitle,
    onClick,
}: {
    active: boolean
    title: string
    subtitle: string
    onClick: () => void
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "flex w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left shadow-sm transition-all",
                active
                    ? "border-brand-green/35 bg-brand-green/[0.045] ring-1 ring-inset ring-brand-green/15 dark:border-brand-green/35 dark:bg-brand-green/[0.08]"
                    : "border-brand-deep/5 bg-brand-deep/[0.035] hover:border-brand-deep/10 hover:bg-brand-deep/[0.055] dark:border-white/8 dark:bg-white/[0.045] dark:hover:border-white/14 dark:hover:bg-white/[0.07]"
            )}
        >
            <div>
                <p className="text-sm font-semibold text-brand-deep dark:text-brand-cream">{title}</p>
                <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
            {active && <HugeiconsIcon icon={CheckCircle2} className="h-5 w-5 text-brand-green dark:text-brand-green-300" />}
        </button>
    )
}

function ConfirmStep({
    provider,
    countryCode,
    numberType,
    quantity,
    label,
    notes,
    selectedAgentName,
    pricing,
    availableStock,
}: {
    provider: VoiceProviderOption | null
    countryCode: string
    numberType: NumberType
    quantity: number
    label: string
    notes: string
    selectedAgentName: string
    pricing: import("@/app/domains/voice/hooks/useVoice").VoiceNumberPricing | null
    availableStock: number
}) {
    const countryName =
        provider?.supportedCountries.find((c) => c.code === countryCode)?.name ?? countryCode
    const inStock = availableStock > 0

    return (
        <div className="space-y-4">
            <SectionHeader
                icon={CheckCircle2}
                title="Confirm your request"
                description={
                    inStock
                        ? "We'll assign a verified number from our pool and debit your wallet. You'll be notified the moment it's live."
                        : "No numbers are in stock right now — we'll add you to the waitlist and assign one automatically. You won't be charged until then."
                }
            />

            <div className="space-y-3 rounded-2xl border border-brand-deep/5 bg-brand-deep/[0.025] p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
                <ConfirmRow label="Voice plan" value={provider?.displayName || provider?.name || "—"} />
                <ConfirmRow label="Country" value={countryName} />
                <ConfirmRow label="Number type" value={numberType.replace("_", " ")} />
                <ConfirmRow label="Quantity" value={String(quantity)} />
                {label && <ConfirmRow label="Label" value={label} />}
                <ConfirmRow label="AI agent" value={selectedAgentName} />
                {notes && <ConfirmRow label="Notes" value={notes} />}
            </div>

            {pricing && (
                <div className="flex items-center justify-between rounded-2xl border border-brand-green/20 bg-brand-green/[0.045] p-4 dark:border-brand-green/25 dark:bg-brand-green/[0.08]">
                    <span className="text-sm font-semibold text-brand-deep dark:text-brand-cream">
                        {inStock ? "Wallet debit on confirm" : "Charged on assignment"}
                    </span>
                    <span className="text-lg font-bold text-brand-deep dark:text-brand-cream">
                        <CurrencyDisplay value={pricing.totalUpfrontDebit} currency={pricing.currency} />
                    </span>
                </div>
            )}
        </div>
    )
}

function ConfirmRow({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium">{value}</span>
        </div>
    )
}

function SectionHeader({
    icon: Icon,
    title,
    description,
}: {
    icon: typeof Phone
    title: string
    description: string
}) {
    return (
        <div className="rounded-2xl border border-brand-deep/5 bg-brand-deep/[0.025] px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
            <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-gold/10 text-brand-gold dark:bg-brand-gold/15 dark:text-brand-gold-300">
                    <HugeiconsIcon icon={Icon} className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <h2 className="text-base font-semibold text-brand-deep dark:text-brand-cream">{title}</h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
                </div>
            </div>
        </div>
    )
}
