"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Search,
    GraduationCap,
    CheckCircle2,
    Plus,
    Trash2,
    Banknote,
    Wallet,
    CreditCard,
    ArrowLeft,
    Loader2,
    Link2,
    Receipt,
    User,
    Check,
} from "lucide-react"
import {
    Drawer,
    DrawerBody,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerStickyHeader,
    DrawerTitle,
} from "@/app/components/ui/drawer"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { MoneyInput } from "@/app/components/ui/money-input"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Badge } from "@/app/components/ui/badge"
import { Textarea } from "@/app/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/app/components/ui/select"
import { useCustomers } from "@/app/domains/orders/hooks/useCustomers"
import { useAcademicCalendar } from "@/app/domains/school/hooks/useAcademicCalendar"
import { useSettings } from "@/app/domains/business/hooks/useBusinessSettings"
import { useRecordSale } from "@/app/domains/orders/hooks/useRecordSale"
import { useCreatePaymentLink } from "@/app/domains/checkout/hooks/usePaymentLinks"
import { useBusiness } from "@/app/components/BusinessProvider"
import { formatCurrency } from "@/app/lib/formatters"
import { CurrencyText } from "@/app/components/shared/CurrencyText"
import { cn } from "@/app/lib/utils"
import { toast } from "sonner"
import type { Customer } from "@/app/domains/orders/data/customerMocks"

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "student" | "fees" | "payment" | "success"

interface FeeItem {
    /** unique key within this session (template id or `custom-{n}`) */
    key: string
    label: string
    amount: number
    /** true = user-typed custom line */
    isCustom: boolean
}

interface SuccessInfo {
    shortCode: string
    totalAmount: number
    amountPaid: number
    remainingAmount: number
    saleId: string
}

// ─── Fee template normaliser (same logic as SchoolFeeToolsSection) ────────────

interface FeeTemplate {
    id: string
    label: string
    amount: number
    notes?: string
}

function normalizeTemplates(raw: unknown): FeeTemplate[] {
    if (!Array.isArray(raw)) return []
    const out: FeeTemplate[] = []
    for (const row of raw) {
        if (!row || typeof row !== "object") continue
        const o = row as Record<string, unknown>
        const id = typeof o.id === "string" ? o.id : ""
        const label = typeof o.label === "string" ? o.label : ""
        const amount = typeof o.amount === "number" ? o.amount : Number(o.amount)
        if (!id || !label.trim() || !Number.isFinite(amount) || amount < 0) continue
        const notes = typeof o.notes === "string" ? o.notes : undefined
        out.push({ id, label: label.trim(), amount, notes })
    }
    return out
}

// ─── Payment method config ─────────────────────────────────────────────────────

const PAYMENT_METHODS = [
    { value: "CASH", label: "Cash", icon: Banknote },
    { value: "TRANSFER", label: "Transfer", icon: Wallet },
    { value: "POS", label: "POS", icon: CreditCard },
] as const

type PaymentMethodValue = (typeof PAYMENT_METHODS)[number]["value"]

// ─── Step indicators ──────────────────────────────────────────────────────────

function StepDots({ current }: { current: Step }) {
    const steps: Step[] = ["student", "fees", "payment", "success"]
    return (
        <div className="flex items-center gap-1.5 mt-3">
            {steps.map((s, i) => (
                <div
                    key={s}
                    className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        s === current
                            ? "w-5 bg-brand-gold"
                            : steps.indexOf(current) > i
                              ? "w-1.5 bg-brand-gold/40"
                              : "w-1.5 bg-brand-deep/10 dark:bg-white/10"
                    )}
                />
            ))}
        </div>
    )
}

// ─── Step 1: Student Picker ───────────────────────────────────────────────────

function StudentStep({
    selectedCustomer,
    onSelectCustomer,
    adHocName,
    onAdHocName,
    onNext,
}: {
    selectedCustomer: Customer | null
    onSelectCustomer: (c: Customer | null) => void
    adHocName: string
    onAdHocName: (name: string) => void
    onNext: () => void
}) {
    const [search, setSearch] = React.useState("")
    const { customers, isLoadingCustomers } = useCustomers(search)

    const canProceed = !!selectedCustomer || adHocName.trim().length >= 1

    return (
        <div className="space-y-5">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-deep/30 dark:text-brand-cream/30 pointer-events-none" />
                <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search students or parents…"
                    className="pl-9 rounded-2xl border-brand-deep/10 dark:border-white/10"
                    autoFocus
                />
            </div>

            {/* Customer list */}
            {isLoadingCustomers ? (
                <div className="flex items-center gap-2 text-sm text-brand-deep/50 dark:text-brand-cream/50 py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading…
                </div>
            ) : (
                <ul className="space-y-1.5 max-h-64 overflow-y-auto">
                    {customers.slice(0, 25).map((c) => {
                        const isSelected = selectedCustomer?.id === c.id
                        return (
                            <li key={c.id}>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                        onSelectCustomer(isSelected ? null : c)
                                        onAdHocName("")
                                    }}
                                    className={cn(
                                        "w-full h-auto whitespace-normal justify-start flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all duration-200",
                                        isSelected
                                            ? "bg-brand-gold/10 border border-brand-gold/30 ring-1 ring-brand-gold/20"
                                            : "border border-brand-deep/8 dark:border-white/8 hover:border-brand-gold/20 hover:bg-brand-gold/5"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "h-9 w-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold",
                                            isSelected
                                                ? "bg-brand-gold text-brand-deep"
                                                : "bg-brand-deep/8 dark:bg-white/8 text-brand-deep dark:text-brand-cream"
                                        )}
                                    >
                                        {c.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-brand-deep dark:text-brand-cream truncate">
                                            {c.name}
                                        </p>
                                        {c.phone ? (
                                            <p className="text-xs text-brand-deep/50 dark:text-brand-cream/50 truncate">
                                                {c.phone}
                                            </p>
                                        ) : null}
                                    </div>
                                    {isSelected && (
                                        <Check className="h-4 w-4 text-brand-gold shrink-0" />
                                    )}
                                </Button>
                            </li>
                        )
                    })}
                    {customers.length === 0 && search && (
                        <li className="py-6 text-center text-sm text-brand-deep/50 dark:text-brand-cream/50">
                            No match for "{search}"
                        </li>
                    )}
                </ul>
            )}

            {/* Ad-hoc name fallback */}
            {!selectedCustomer && (
                <div className="pt-2 border-t border-brand-deep/8 dark:border-white/8 space-y-2">
                    <p className="text-xs text-brand-deep/50 dark:text-brand-cream/50">
                        Or enter a name without creating a contact:
                    </p>
                    <Input
                        value={adHocName}
                        onChange={(e) => onAdHocName(e.target.value)}
                        placeholder="Student or parent name"
                        className="rounded-2xl border-brand-deep/10 dark:border-white/10"
                    />
                </div>
            )}

            <Button
                type="button"
                className="w-full rounded-full h-12"
                disabled={!canProceed}
                onClick={onNext}
            >
                Continue
                <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
            </Button>
        </div>
    )
}

// ─── Step 2: Fee Items ────────────────────────────────────────────────────────

function FeesStep({
    templates,
    feeItems,
    onToggleTemplate,
    onAddCustom,
    onRemoveItem,
    currency,
    currencySymbol,
    onNext,
    onBack,
}: {
    templates: FeeTemplate[]
    feeItems: FeeItem[]
    onToggleTemplate: (t: FeeTemplate) => void
    onAddCustom: (label: string, amount: number) => void
    onRemoveItem: (key: string) => void
    currency: string
    currencySymbol: string
    onNext: () => void
    onBack: () => void
}) {
    const [customLabel, setCustomLabel] = React.useState("")
    const [customAmount, setCustomAmount] = React.useState<number>(0)
    const [showCustomForm, setShowCustomForm] = React.useState(false)
    const [lastAdded, setLastAdded] = React.useState<string | null>(null)
    const labelRef = React.useRef<HTMLInputElement>(null)

    const total = feeItems.reduce((s, f) => s + f.amount, 0)
    const templateSelectedIds = new Set(feeItems.filter((f) => !f.isCustom).map((f) => f.key))
    const handleAddCustom = () => {
        if (!customLabel.trim() || customAmount <= 0) {
            toast.error("Enter a label and a positive amount.")
            return
        }
        const label = customLabel.trim()
        onAddCustom(label, customAmount)
        setLastAdded(label)
        // Stay on form – just clear the fields so staff can add another
        setCustomLabel("")
        setCustomAmount(0)
        setTimeout(() => {
            labelRef.current?.focus()
            setLastAdded(null)
        }, 1200)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleAddCustom()
        if (e.key === "Escape") setShowCustomForm(false)
    }

    return (
        <div className="space-y-5">
            {/* Presets */}
            {templates.length > 0 && (
                <div className="space-y-2.5">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-deep/35 dark:text-brand-cream/35">
                        Fee presets
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {templates.map((t) => {
                            const isSelected = templateSelectedIds.has(t.id)
                            return (
                                <Button
                                    key={t.id}
                                    type="button"
                                    variant="ghost"
                                    onClick={() => onToggleTemplate(t)}
                                    className={cn(
                                        "group relative h-auto whitespace-normal w-full flex items-start justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all duration-200",
                                        isSelected
                                            ? "bg-brand-gold/8 border-brand-gold/35 shadow-sm shadow-brand-gold/10"
                                            : "border-brand-deep/8 dark:border-white/8 hover:border-brand-gold/25 hover:bg-brand-gold/4"
                                    )}
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className={cn(
                                            "text-sm font-semibold transition-colors",
                                            isSelected ? "text-brand-deep dark:text-brand-cream" : "text-brand-deep/80 dark:text-brand-cream/80"
                                        )}>
                                            {t.label}
                                        </p>
                                        {t.notes ? (
                                            <p className="text-xs text-brand-deep/45 dark:text-brand-cream/45 mt-0.5 truncate">
                                                {t.notes}
                                            </p>
                                        ) : null}
                                        <p className={cn(
                                            "text-sm font-bold mt-1.5 transition-colors",
                                            isSelected ? "text-brand-gold" : "text-brand-deep/60 dark:text-brand-cream/60"
                                        )}>
                                            <CurrencyText value={formatCurrency(t.amount, { currency })} />
                                        </p>
                                    </div>
                                    {/* Checkbox */}
                                    <div className={cn(
                                        "h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border-2 transition-all duration-200",
                                        isSelected
                                            ? "bg-brand-gold border-brand-gold scale-110"
                                            : "border-brand-deep/20 dark:border-white/15 group-hover:border-brand-gold/40"
                                    )}>
                                        {isSelected && <Check className="h-2.5 w-2.5 text-brand-deep" strokeWidth={3} />}
                                    </div>
                                </Button>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Custom fee inline form */}
            <AnimatePresence initial={false}>
                {showCustomForm ? (
                    <motion.div
                        key="custom-form"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18 }}
                        className="rounded-2xl border border-brand-deep/10 dark:border-white/10 bg-brand-deep/[0.02] dark:bg-white/[0.02] overflow-hidden"
                    >
                        {/* Header row */}
                        <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-deep/40 dark:text-brand-cream/40">
                                Custom fee
                            </p>
                            {lastAdded && (
                                <motion.span
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1"
                                >
                                    <CheckCircle2 className="h-3 w-3" />
                                    "{lastAdded}" added
                                </motion.span>
                            )}
                        </div>

                        {/* Fields */}
                        <div className="flex items-end gap-2 px-4 pb-3" onKeyDown={handleKeyDown}>
                            <div className="flex-1 space-y-1.5">
                                <Label className="text-xs text-brand-deep/55 dark:text-brand-cream/55">
                                    Fee label
                                </Label>
                                <Input
                                    ref={labelRef}
                                    value={customLabel}
                                    onChange={(e) => setCustomLabel(e.target.value)}
                                    placeholder="e.g. Exam levy"
                                    className="h-10 rounded-xl border-brand-deep/10 dark:border-white/10"
                                    autoFocus
                                />
                            </div>
                            <div className="w-40 space-y-1.5">
                                <Label className="text-xs text-brand-deep/55 dark:text-brand-cream/55">
                                    Amount
                                </Label>
                                <MoneyInput
                                    value={customAmount}
                                    onChange={setCustomAmount}
                                    size="sm"
                                    currencySymbol={currencySymbol}
                                    className="rounded-xl"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 px-4 pb-4">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="rounded-full text-brand-deep/45 dark:text-brand-cream/45 hover:text-brand-deep dark:hover:text-brand-cream text-xs"
                                onClick={() => setShowCustomForm(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                className="rounded-full px-4"
                                onClick={handleAddCustom}
                                disabled={!customLabel.trim() || customAmount <= 0}
                            >
                                <Plus className="h-3.5 w-3.5 mr-1.5" />
                                Add line
                            </Button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="custom-trigger"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setShowCustomForm(true)}
                            className="w-full h-auto whitespace-normal justify-start flex items-center gap-3 rounded-2xl border border-dashed border-brand-deep/15 dark:border-white/15 px-4 py-3 text-sm text-brand-deep/50 dark:text-brand-cream/50 hover:border-brand-gold/30 hover:text-brand-deep dark:hover:text-brand-cream hover:bg-brand-gold/4 group"
                        >
                            <div className="h-7 w-7 rounded-full border border-dashed border-brand-deep/15 dark:border-white/15 group-hover:border-brand-gold/40 group-hover:bg-brand-gold/8 flex items-center justify-center transition-all">
                                <Plus className="h-3.5 w-3.5" />
                            </div>
                            <span className="font-medium">Add custom fee</span>
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Custom items already added */}
            {feeItems.filter((f) => f.isCustom).length > 0 && (
                <div className="space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-deep/35 dark:text-brand-cream/35">
                        Custom lines
                    </p>
                    {feeItems
                        .filter((f) => f.isCustom)
                        .map((f) => (
                            <div
                                key={f.key}
                                className="flex items-center justify-between gap-3 rounded-xl border border-brand-deep/8 dark:border-white/8 bg-white/50 dark:bg-white/[0.03] px-4 py-2.5"
                            >
                                <span className="text-sm font-medium text-brand-deep dark:text-brand-cream truncate">
                                    {f.label}
                                </span>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-sm font-bold text-brand-deep/70 dark:text-brand-cream/70 tabular-nums">
                                        <CurrencyText value={formatCurrency(f.amount, { currency })} />
                                    </span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-lg text-brand-deep/30 dark:text-brand-cream/30 hover:text-destructive hover:bg-destructive/8 transition-colors"
                                        onClick={() => onRemoveItem(f.key)}
                                        aria-label={`Remove ${f.label}`}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                </div>
            )}

            {/* Running total */}
            {feeItems.length > 0 && (
                <motion.div
                    layout
                    className="flex items-center justify-between rounded-2xl bg-linear-to-r from-brand-gold/8 to-brand-gold/4 border border-brand-gold/15 px-5 py-3.5"
                >
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-deep/40 dark:text-brand-cream/40">
                            Total
                        </p>
                        <p className="text-xs text-brand-deep/50 dark:text-brand-cream/50 mt-0.5">
                            {feeItems.length} line{feeItems.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                    <span className="text-xl font-bold font-serif text-brand-deep dark:text-brand-cream tabular-nums">
                        <CurrencyText value={formatCurrency(total, { currency })} />
                    </span>
                </motion.div>
            )}

            <div className="flex gap-3 pt-1">
                <Button
                    type="button"
                    variant="ghost"
                    className="rounded-full gap-2 text-brand-deep/45 dark:text-brand-cream/45"
                    onClick={onBack}
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>
                <Button
                    type="button"
                    className="flex-1 rounded-full h-12 font-semibold"
                    disabled={feeItems.length === 0}
                    onClick={onNext}
                >
                    Continue
                    <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                </Button>
            </div>
        </div>
    )
}

// ─── Step 3: Term & Payment ───────────────────────────────────────────────────

function PaymentStep({
    feeItems,
    termId,
    onTermId,
    paymentMethod,
    onPaymentMethod,
    amountPaid,
    onAmountPaid,
    notes,
    onNotes,
    currency,
    currencySymbol,
    onBack,
    onSubmit,
    isSubmitting,
}: {
    feeItems: FeeItem[]
    termId: string
    onTermId: (v: string) => void
    paymentMethod: PaymentMethodValue
    onPaymentMethod: (v: PaymentMethodValue) => void
    amountPaid: number
    onAmountPaid: (v: number) => void
    notes: string
    onNotes: (v: string) => void
    currency: string
    currencySymbol: string
    onBack: () => void
    onSubmit: () => void
    isSubmitting: boolean
}) {
    const { data: academicCal } = useAcademicCalendar()
    const total = feeItems.reduce((s, f) => s + f.amount, 0)
    const balance = Math.max(0, total - amountPaid)

    const flatTerms = React.useMemo(
        () =>
            (academicCal?.sessions ?? []).flatMap((s) =>
                (s.terms ?? []).map((t) => ({
                    id: t.id,
                    label: `${s.name} · ${t.name}`,
                }))
            ),
        [academicCal]
    )

    return (
        <div className="space-y-6">
            {/* Fee summary */}
            <GlassCard className="p-0 overflow-hidden border-brand-deep/8 dark:border-white/8">
                <div className="divide-y divide-brand-deep/5 dark:divide-white/5">
                    {feeItems.map((f) => (
                        <div
                            key={f.key}
                            className="flex items-center justify-between px-4 py-2.5 text-sm"
                        >
                            <span className="text-brand-deep/75 dark:text-brand-cream/75">
                                {f.label}
                            </span>
                            <span className="font-medium text-brand-deep dark:text-brand-cream">
                                <CurrencyText value={formatCurrency(f.amount, { currency })} />
                            </span>
                        </div>
                    ))}
                </div>
                <div className="px-4 py-3 flex items-center justify-between border-t border-brand-gold/15 bg-brand-gold/[0.03]">
                    <span className="text-xs font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40">
                        Total
                    </span>
                    <span className="text-lg font-bold font-serif text-brand-deep dark:text-brand-cream">
                        <CurrencyText value={formatCurrency(total, { currency })} />
                    </span>
                </div>
            </GlassCard>

            {/* Academic term */}
            {flatTerms.length > 0 && (
                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40">
                        Academic term
                    </Label>
                    <Select value={termId} onValueChange={onTermId}>
                        <SelectTrigger className="rounded-2xl border-brand-deep/10 dark:border-white/10">
                            <SelectValue placeholder="Select term (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__none__">No term</SelectItem>
                            <SelectItem value="__default__">Use workspace default</SelectItem>
                            {flatTerms.map((t) => (
                                <SelectItem key={t.id} value={t.id}>
                                    {t.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Payment method */}
            <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40">
                    Payment method
                </Label>
                <div className="grid grid-cols-3 gap-2">
                    {PAYMENT_METHODS.map((m) => {
                        const Icon = m.icon
                        const isSelected = paymentMethod === m.value
                        return (
                            <Button
                                key={m.value}
                                type="button"
                                variant="ghost"
                                onClick={() => onPaymentMethod(m.value)}
                                className={cn(
                                    "h-auto whitespace-normal flex flex-col items-center gap-2 rounded-2xl border px-3 py-3 relative transition-all duration-200",
                                    isSelected
                                        ? "bg-brand-gold/10 border-brand-gold/40 ring-1 ring-brand-gold/20 scale-[1.02] shadow-md"
                                        : "border-brand-deep/8 dark:border-white/8 hover:border-brand-gold/20 hover:bg-brand-gold/5"
                                )}
                            >
                                <Icon
                                    className={cn(
                                        "h-5 w-5",
                                        isSelected ? "text-brand-gold" : "text-brand-deep/50 dark:text-brand-cream/50"
                                    )}
                                />
                                <span
                                    className={cn(
                                        "text-[10px] font-bold uppercase tracking-wider",
                                        isSelected ? "text-brand-gold" : "text-brand-deep/50 dark:text-brand-cream/50"
                                    )}
                                >
                                    {m.label}
                                </span>
                                {isSelected && (
                                    <div className="absolute top-1.5 right-1.5">
                                        <CheckCircle2 className="h-3 w-3 text-brand-gold" />
                                    </div>
                                )}
                            </Button>
                        )
                    })}
                </div>
            </div>

            {/* Amount paid */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40">
                        Amount paid
                    </Label>
                    <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs text-brand-gold"
                        onClick={() => onAmountPaid(total)}
                    >
                        Pay in full
                    </Button>
                </div>
                <MoneyInput
                    value={amountPaid}
                    onChange={onAmountPaid}
                    max={total}
                    currencySymbol={currencySymbol}
                    className="h-14 rounded-2xl text-lg font-bold border-brand-deep/10 dark:border-white/10"
                    placeholder="0.00"
                />
                <div
                    className={cn(
                        "flex items-center justify-between rounded-xl px-4 py-2.5 text-sm",
                        balance === 0
                            ? "bg-emerald-500/5 border border-emerald-500/20"
                            : "bg-amber-500/5 border border-amber-500/20"
                    )}
                >
                    <span
                        className={cn(
                            "text-xs font-medium",
                            balance === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                        )}
                    >
                        {balance === 0 ? "Fully paid" : "Outstanding balance"}
                    </span>
                    <span
                        className={cn(
                            "font-bold",
                            balance === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-brand-deep dark:text-brand-cream"
                        )}
                    >
                        <CurrencyText value={formatCurrency(balance, { currency })} />
                    </span>
                </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40">
                    Notes <span className="normal-case font-normal">(optional)</span>
                </Label>
                <Textarea
                    value={notes}
                    onChange={(e) => onNotes(e.target.value)}
                    placeholder="Any context to attach to this fee record…"
                    className="rounded-2xl border-brand-deep/10 dark:border-white/10 min-h-[72px] resize-none text-sm"
                />
            </div>

            <div className="flex gap-3 pt-1">
                <Button
                    type="button"
                    variant="ghost"
                    className="rounded-full gap-2 text-brand-deep/50 dark:text-brand-cream/50"
                    onClick={onBack}
                    disabled={isSubmitting}
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>
                <Button
                    type="button"
                    className="flex-1 rounded-full h-12 font-semibold"
                    onClick={onSubmit}
                    disabled={isSubmitting || amountPaid <= 0}
                >
                    {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        <Receipt className="h-4 w-4 mr-2" />
                    )}
                    {amountPaid >= total ? "Record full payment" : "Record partial payment"}
                </Button>
            </div>
        </div>
    )
}

// ─── Step 4: Success ──────────────────────────────────────────────────────────

function SuccessStep({
    info,
    customerName,
    currency,
    onRecordAnother,
    onClose,
}: {
    info: SuccessInfo
    customerName: string
    currency: string
    onRecordAnother: () => void
    onClose: () => void
}) {
    const createPaymentLink = useCreatePaymentLink()
    const [paymentLink, setPaymentLink] = React.useState<string | null>(null)
    const [linkLoading, setLinkLoading] = React.useState(false)

    const handleGenerateLink = async () => {
        setLinkLoading(true)
        try {
            const result = await createPaymentLink.mutateAsync({
                targetType: "SALE",
                targetId: info.saleId,
            })
            const reference =
                (result as Record<string, unknown>)?.reference ??
                ((result as Record<string, unknown>)?.data as Record<string, unknown> | undefined)?.reference
            if (typeof reference === "string") {
                const origin = typeof window !== "undefined" ? window.location.origin : ""
                const link = `${origin}/pay/${reference}`
                setPaymentLink(link)
                await navigator.clipboard.writeText(link)
                toast.success("Payment link copied to clipboard")
            }
        } catch {
            toast.error("Could not generate link")
        } finally {
            setLinkLoading(false)
        }
    }

    return (
        <div className="flex flex-col items-center py-8 text-center space-y-6">
            <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <CheckCircle2 className="h-10 w-10" />
            </div>

            <div className="space-y-1">
                <h3 className="font-serif text-2xl text-brand-deep dark:text-brand-cream">
                    Fee recorded
                </h3>
                <p className="text-sm text-brand-deep/60 dark:text-brand-cream/60">
                    {customerName} · #{info.shortCode}
                </p>
            </div>

            <div className="w-full max-w-xs rounded-2xl border border-brand-deep/8 dark:border-white/8 divide-y divide-brand-deep/5 dark:divide-white/5 text-sm">
                <div className="flex justify-between px-4 py-2.5">
                    <span className="text-brand-deep/60 dark:text-brand-cream/60">Total</span>
                    <span className="font-bold text-brand-deep dark:text-brand-cream">
                        <CurrencyText value={formatCurrency(info.totalAmount, { currency })} />
                    </span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                    <span className="text-brand-deep/60 dark:text-brand-cream/60">Paid</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        <CurrencyText value={formatCurrency(info.amountPaid, { currency })} />
                    </span>
                </div>
                {info.remainingAmount > 0 && (
                    <div className="flex justify-between px-4 py-2.5">
                        <span className="text-brand-deep/60 dark:text-brand-cream/60">Outstanding</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                            <CurrencyText value={formatCurrency(info.remainingAmount, { currency })} />
                        </span>
                    </div>
                )}
            </div>

            {info.remainingAmount > 0 && (
                <div className="w-full max-w-xs space-y-2">
                    {paymentLink ? (
                        <div className="rounded-xl border border-brand-gold/20 bg-brand-gold/5 px-4 py-3 text-xs font-mono text-brand-deep/70 dark:text-brand-cream/70 break-all">
                            {paymentLink}
                        </div>
                    ) : (
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full rounded-full border-brand-gold/30 text-brand-deep dark:text-brand-cream hover:bg-brand-gold/10"
                            onClick={() => void handleGenerateLink()}
                            disabled={linkLoading}
                        >
                            {linkLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Link2 className="h-4 w-4 mr-2 text-brand-gold" />
                            )}
                            Generate payment link
                        </Button>
                    )}
                    <p className="text-xs text-brand-deep/40 dark:text-brand-cream/40">
                        Share with the family to pay the outstanding balance online.
                    </p>
                </div>
            )}

            <div className="flex flex-col gap-2 w-full max-w-xs">
                <Button type="button" className="rounded-full" onClick={onRecordAnother}>
                    Record another fee
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    className="rounded-full text-brand-deep/50 dark:text-brand-cream/50"
                    onClick={onClose}
                >
                    Done
                </Button>
            </div>
        </div>
    )
}

// ─── Main Drawer ──────────────────────────────────────────────────────────────

interface SchoolFeeRecordDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

const STEP_TITLES: Record<Step, string> = {
    student: "Who is paying?",
    fees: "What fees?",
    payment: "Payment details",
    success: "Done",
}

const STEP_DESC: Record<Step, string> = {
    student: "Search and select the student or parent, or enter a name.",
    fees: "Pick from your saved fee presets or add a custom line.",
    payment: "Set the term, payment method, and amount received.",
    success: "",
}

let customCounter = 0

export function SchoolFeeRecordDrawer({ open, onOpenChange }: SchoolFeeRecordDrawerProps) {
    const { activeBusiness, currency: currencySymbol } = useBusiness()
    const currency = activeBusiness?.currency ?? "NGN"
    const { data: settings } = useSettings()
    const { recordSale, isRecording } = useRecordSale()

    const feeTemplates = React.useMemo(
        () => normalizeTemplates(settings?.business?.configs?.school_fee_templates),
        [settings?.business?.configs?.school_fee_templates]
    )

    const [step, setStep] = React.useState<Step>("student")
    const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null)
    const [adHocName, setAdHocName] = React.useState("")
    const [feeItems, setFeeItems] = React.useState<FeeItem[]>([])
    const [termId, setTermId] = React.useState<string>("__default__")
    const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethodValue>("CASH")
    const [amountPaid, setAmountPaid] = React.useState<number>(0)
    const [notes, setNotes] = React.useState("")
    const [successInfo, setSuccessInfo] = React.useState<SuccessInfo | null>(null)

    const totalAmount = feeItems.reduce((s, f) => s + f.amount, 0)

    // Sync amount to total when fees change
    React.useEffect(() => {
        setAmountPaid(totalAmount)
    }, [totalAmount])

    const reset = React.useCallback(() => {
        setStep("student")
        setSelectedCustomer(null)
        setAdHocName("")
        setFeeItems([])
        setTermId("__default__")
        setPaymentMethod("CASH")
        setAmountPaid(0)
        setNotes("")
        setSuccessInfo(null)
    }, [])

    React.useEffect(() => {
        if (!open) reset()
    }, [open, reset])

    const handleToggleTemplate = (t: FeeTemplate) => {
        setFeeItems((prev) => {
            const existing = prev.find((f) => f.key === t.id)
            if (existing) return prev.filter((f) => f.key !== t.id)
            return [...prev, { key: t.id, label: t.label, amount: t.amount, isCustom: false }]
        })
    }

    const handleAddCustom = (label: string, amount: number) => {
        const key = `custom-${++customCounter}`
        setFeeItems((prev) => [...prev, { key, label, amount, isCustom: true }])
    }

    const handleRemoveItem = (key: string) => {
        setFeeItems((prev) => prev.filter((f) => f.key !== key))
    }

    const handleSubmit = async () => {
        const customerName =
            selectedCustomer?.name || adHocName.trim() || "Walk-in"

        try {
            const result = await recordSale({
                items: feeItems.map((f) => ({
                    productName: f.label,
                    quantity: 1,
                    customPrice: f.amount,
                })),
                paymentMethod,
                amountPaid,
                customerId: selectedCustomer?.id?.startsWith("new-")
                    ? undefined
                    : selectedCustomer?.id,
                customerName: selectedCustomer?.id ? undefined : customerName,
                notes: notes.trim() || undefined,
                academicTermId:
                    termId === "__default__"
                        ? undefined
                        : termId === "__none__"
                          ? null
                          : termId,
            })

            setSuccessInfo({
                saleId: result?.saleId ?? "",
                shortCode: result?.shortCode ?? "",
                totalAmount: result?.totalAmount ?? totalAmount,
                amountPaid: result?.amountPaid ?? amountPaid,
                remainingAmount: result?.remainingAmount ?? Math.max(0, totalAmount - amountPaid),
            })
            setStep("success")
        } catch {
            // Error shown by useRecordSale's onError
        }
    }

    const customerName =
        selectedCustomer?.name || adHocName.trim() || "—"

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="max-w-2xl max-h-[92vh] flex flex-col">
                <DrawerStickyHeader>
                    <div className="flex items-center gap-3 mb-0.5">
                        <div className="h-8 w-8 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold shrink-0">
                            <GraduationCap className="h-4 w-4" />
                        </div>
                        <DrawerTitle className="font-serif">
                            {STEP_TITLES[step]}
                        </DrawerTitle>
                    </div>
                    {step !== "success" && (
                        <DrawerDescription>{STEP_DESC[step]}</DrawerDescription>
                    )}
                    {step !== "success" && <StepDots current={step} />}

                    {/* Context breadcrumb after student is picked */}
                    {(step === "fees" || step === "payment") && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-brand-deep/55 dark:text-brand-cream/55">
                            <User className="h-3.5 w-3.5" />
                            <span>{customerName}</span>
                            {step === "payment" && feeItems.length > 0 && (
                                <>
                                    <span className="text-brand-deep/25">·</span>
                                    <span>
                                        {feeItems.length} fee{feeItems.length !== 1 ? "s" : ""}
                                    </span>
                                    <span className="text-brand-deep/25">·</span>
                                    <CurrencyText value={formatCurrency(totalAmount, { currency })} />
                                </>
                            )}
                        </div>
                    )}
                </DrawerStickyHeader>

                <DrawerBody className="overflow-y-auto">
                    <AnimatePresence mode="wait">
                        {step === "student" && (
                            <motion.div
                                key="student"
                                initial={{ opacity: 0, x: 16 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -16 }}
                            >
                                <StudentStep
                                    selectedCustomer={selectedCustomer}
                                    onSelectCustomer={setSelectedCustomer}
                                    adHocName={adHocName}
                                    onAdHocName={setAdHocName}
                                    onNext={() => setStep("fees")}
                                />
                            </motion.div>
                        )}

                        {step === "fees" && (
                            <motion.div
                                key="fees"
                                initial={{ opacity: 0, x: 16 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -16 }}
                            >
                                <FeesStep
                                    templates={feeTemplates}
                                    feeItems={feeItems}
                                    onToggleTemplate={handleToggleTemplate}
                                    onAddCustom={handleAddCustom}
                                    onRemoveItem={handleRemoveItem}
                                    currency={currency}
                                    currencySymbol={currencySymbol}
                                    onNext={() => setStep("payment")}
                                    onBack={() => setStep("student")}
                                />
                            </motion.div>
                        )}

                        {step === "payment" && (
                            <motion.div
                                key="payment"
                                initial={{ opacity: 0, x: 16 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -16 }}
                            >
                                <PaymentStep
                                    feeItems={feeItems}
                                    termId={termId}
                                    onTermId={setTermId}
                                    paymentMethod={paymentMethod}
                                    onPaymentMethod={setPaymentMethod}
                                    amountPaid={amountPaid}
                                    onAmountPaid={setAmountPaid}
                                    notes={notes}
                                    onNotes={setNotes}
                                    currency={currency}
                                    currencySymbol={currencySymbol}
                                    onBack={() => setStep("fees")}
                                    onSubmit={() => void handleSubmit()}
                                    isSubmitting={isRecording}
                                />
                            </motion.div>
                        )}

                        {step === "success" && successInfo && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.97 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <SuccessStep
                                    info={successInfo}
                                    customerName={customerName}
                                    currency={currency}
                                    onRecordAnother={reset}
                                    onClose={() => onOpenChange(false)}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </DrawerBody>

                {step === "student" && (
                    <DrawerFooter className="flex-row justify-start">
                        <DrawerClose asChild>
                            <Button type="button" variant="ghost" className="rounded-full text-brand-deep/50 dark:text-brand-cream/50">
                                Cancel
                            </Button>
                        </DrawerClose>
                    </DrawerFooter>
                )}
            </DrawerContent>
        </Drawer>
    )
}
