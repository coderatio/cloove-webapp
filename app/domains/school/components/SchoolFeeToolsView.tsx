"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    BookOpen,
    Check,
    CheckSquare,
    Copy,
    Link2,
    Loader2,
    Plus,
    Search,
    Square,
    Trash2,
    X,
} from "lucide-react"
import { PageTransition } from "@/app/components/layout/page-transition"
import { ManagementHeader } from "@/app/components/shared/ManagementHeader"
import { Button } from "@/app/components/ui/button"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { MoneyInput } from "@/app/components/ui/money-input"
import { Badge } from "@/app/components/ui/badge"
import { useSettings, useUpdateBusinessSettings } from "@/app/domains/business/hooks/useBusinessSettings"
import { usePermission } from "@/app/hooks/usePermission"
import { useBusiness } from "@/app/components/BusinessProvider"
import { useOrders } from "@/app/domains/orders/hooks/useOrders"
import { useBatchSalePaymentLinks } from "@/app/domains/checkout/hooks/useBatchSalePaymentLinks"
import { FeeTemplatesSection } from "./FeeTemplatesSection"
import { formatCurrency } from "@/app/lib/formatters"
import { cn } from "@/app/lib/utils"
import { toast } from "sonner"
import type { Order } from "@/app/domains/orders/types"

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface SchoolFeeTemplate {
    id: string
    label: string
    amount: number
    notes?: string
}

function normalizeTemplates(raw: unknown): SchoolFeeTemplate[] {
    if (!Array.isArray(raw)) return []
    const out: SchoolFeeTemplate[] = []
    for (const row of raw) {
        if (!row || typeof row !== "object") continue
        const o = row as Record<string, unknown>
        const id = typeof o.id === "string" ? o.id : ""
        const label = typeof o.label === "string" ? o.label : ""
        const amount = typeof o.amount === "number" ? o.amount : Number(o.amount)
        if (!id || !label.trim() || !Number.isFinite(amount) || amount < 0) continue
        const notes = typeof o.notes === "string" ? o.notes : undefined
        const t: SchoolFeeTemplate = { id, label: label.trim(), amount }
        if (notes !== undefined) t.notes = notes
        out.push(t)
    }
    return out
}

// ─── Section: Fee Presets ──────────────────────────────────────────────────────

function FeePresetsSection() {
    const { can } = usePermission()
    const canConfig = can("MANAGE_BUSINESS_CONFIG")
    const { activeBusiness, currency: currencySymbol } = useBusiness()
    const currencyCode = activeBusiness?.currency ?? "NGN"
    const { data: settings } = useSettings()
    const updateSettings = useUpdateBusinessSettings()

    const [templates, setTemplates] = React.useState<SchoolFeeTemplate[]>([])
    React.useEffect(() => {
        setTemplates(normalizeTemplates(settings?.business?.configs?.school_fee_templates))
    }, [settings?.business?.configs?.school_fee_templates])

    const [draftLabel, setDraftLabel] = React.useState("")
    const [draftAmount, setDraftAmount] = React.useState(0)
    const [draftNotes, setDraftNotes] = React.useState("")
    const [showForm, setShowForm] = React.useState(false)

    const persist = (next: SchoolFeeTemplate[]) => {
        if (!canConfig) return
        updateSettings.mutate(
            { school_fee_templates: JSON.stringify(next), quiet: true },
            {
                onSuccess: () => toast.success("Presets saved"),
                onError: () => toast.error("Could not save presets"),
            }
        )
    }

    const addTemplate = () => {
        const label = draftLabel.trim()
        if (!label || draftAmount <= 0) {
            toast.error("Enter a label and a positive amount.")
            return
        }
        const next: SchoolFeeTemplate[] = [
            ...templates,
            {
                id: crypto.randomUUID?.() ?? `ft-${Date.now()}`,
                label,
                amount: draftAmount,
                notes: draftNotes.trim() || undefined,
            },
        ]
        setTemplates(next)
        setDraftLabel("")
        setDraftAmount(0)
        setDraftNotes("")
        setShowForm(false)
        persist(next)
    }

    const removeTemplate = (id: string) => {
        const next = templates.filter((t) => t.id !== id)
        setTemplates(next)
        persist(next)
    }

    return (
        <GlassCard className="overflow-hidden border-brand-gold/15 bg-linear-to-br from-white/70 to-brand-gold/[0.03] dark:from-white/[0.07] dark:to-brand-gold/[0.03] p-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-5 py-5 border-b border-brand-deep/5 dark:border-white/8">
                <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-gold mt-0.5">
                        <BookOpen className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="font-serif text-base text-brand-deep dark:text-brand-cream">
                            Saved fee presets
                        </p>
                        <p className="mt-0.5 text-sm text-brand-deep/60 dark:text-brand-cream/60 max-w-md">
                            Common fee lines your staff pick from when recording a payment.
                        </p>
                    </div>
                </div>
                {canConfig && (
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="rounded-full shrink-0"
                        onClick={() => setShowForm((v) => !v)}
                    >
                        {showForm ? <X className="h-3.5 w-3.5 mr-1.5" /> : <Plus className="h-3.5 w-3.5 mr-1.5" />}
                        {showForm ? "Cancel" : "Add preset"}
                    </Button>
                )}
            </div>

            {/* Presets list */}
            <div className="px-5 py-4 space-y-2">
                {templates.length === 0 && !showForm && (
                    <p className="text-sm text-brand-deep/50 dark:text-brand-cream/50 py-2">
                        No presets yet. Add tuition, transport, or exam lines your team records often.
                    </p>
                )}
                <AnimatePresence initial={false}>
                    {templates.map((t) => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            transition={{ duration: 0.18 }}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-brand-deep/8 dark:border-white/8 bg-white/50 dark:bg-white/[0.03] px-4 py-3"
                        >
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-sm text-brand-deep dark:text-brand-cream">
                                        {t.label}
                                    </span>
                                    <span className="text-sm text-brand-deep/55 dark:text-brand-cream/55">
                                        {formatCurrency(t.amount, { currency: currencyCode })}
                                    </span>
                                </div>
                                {t.notes && (
                                    <p className="text-xs text-brand-deep/45 dark:text-brand-cream/45 mt-0.5 truncate">
                                        {t.notes}
                                    </p>
                                )}
                            </div>
                            {canConfig && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive/60 hover:text-destructive hover:bg-destructive/8 rounded-xl shrink-0"
                                    disabled={updateSettings.isPending}
                                    onClick={() => removeTemplate(t.id)}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Add form */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.22 }}
                            className="overflow-hidden"
                        >
                            <div className="rounded-2xl border border-brand-gold/20 bg-brand-gold/[0.04] dark:bg-brand-gold/[0.06] px-4 py-4 mt-2 space-y-3">
                                <p className="text-xs font-semibold uppercase tracking-wider text-brand-deep/45 dark:text-brand-cream/45">
                                    New preset
                                </p>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="preset-label" className="text-xs">Fee label</Label>
                                        <Input
                                            id="preset-label"
                                            value={draftLabel}
                                            onChange={(e) => setDraftLabel(e.target.value)}
                                            placeholder="e.g. Tuition"
                                            className="rounded-xl h-10"
                                            onKeyDown={(e) => e.key === "Enter" && addTemplate()}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="preset-amount" className="text-xs">Amount</Label>
                                        <MoneyInput
                                            id="preset-amount"
                                            value={draftAmount}
                                            onChange={setDraftAmount}
                                            size="sm"
                                            currencySymbol={currencySymbol}
                                            className="rounded-xl"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="preset-notes" className="text-xs">Notes (optional)</Label>
                                    <Input
                                        id="preset-notes"
                                        value={draftNotes}
                                        onChange={(e) => setDraftNotes(e.target.value)}
                                        placeholder="e.g. SS1 only"
                                        className="rounded-xl h-10"
                                    />
                                </div>
                                <div className="flex gap-2 pt-1">
                                    <Button
                                        type="button"
                                        size="sm"
                                        className="rounded-full"
                                        onClick={addTemplate}
                                        disabled={updateSettings.isPending}
                                    >
                                        {updateSettings.isPending ? (
                                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                        ) : (
                                            <Plus className="h-3.5 w-3.5 mr-1.5" />
                                        )}
                                        Save preset
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="rounded-full"
                                        onClick={() => setShowForm(false)}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {!canConfig && (
                    <p className="text-xs text-brand-deep/45 dark:text-brand-cream/45 pt-1">
                        Only workspace managers can edit fee presets.
                    </p>
                )}
            </div>
        </GlassCard>
    )
}

// ─── Sale row in the batch picker ─────────────────────────────────────────────

function SaleRow({
    order,
    selected,
    onToggle,
    currency,
}: {
    order: Order
    selected: boolean
    onToggle: () => void
    currency: string
}) {
    const total = Number(order.totalAmount || 0)
    const paid = Number(order.amountPaid || 0)
    const remaining = Math.max(0, Number(order.remainingAmount ?? total - paid))

    return (
        <Button
            type="button"
            variant="ghost"
            onClick={onToggle}
            className={cn(
                "w-full h-auto whitespace-normal justify-start flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all duration-150",
                selected
                    ? "border-brand-green/30 bg-brand-green/[0.05] dark:bg-brand-green/[0.08]"
                    : "border-brand-deep/8 dark:border-white/8 bg-white/40 dark:bg-white/[0.03] hover:bg-white/70 dark:hover:bg-white/[0.06]"
            )}
        >
            <div className={cn(
                "mt-0.5 shrink-0 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors",
                selected
                    ? "border-brand-green bg-brand-green text-white"
                    : "border-brand-deep/25 dark:border-white/25"
            )}>
                {selected && <Check className="h-3 w-3" />}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-medium text-sm text-brand-deep dark:text-brand-cream truncate">
                        {order.customer || "Unknown student"}
                    </span>
                    <span className={cn(
                        "text-sm font-semibold shrink-0",
                        remaining > 0
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-brand-deep/50 dark:text-brand-cream/50"
                    )}>
                        {formatCurrency(remaining, { currency })} due
                    </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-brand-deep/50 dark:text-brand-cream/50">
                        {order.summary}
                    </span>
                    {order.academicTerm && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0 rounded-md font-normal">
                            {order.academicTerm.name}
                        </Badge>
                    )}
                    {order.shortCode && (
                        <span className="text-xs font-mono text-brand-deep/35 dark:text-brand-cream/35">
                            #{order.shortCode}
                        </span>
                    )}
                </div>
            </div>
        </Button>
    )
}

// ─── Section: Batch Payment Links ─────────────────────────────────────────────

function BatchLinksSection() {
    const { activeBusiness } = useBusiness()
    const currencyCode = activeBusiness?.currency ?? "NGN"
    const [search, setSearch] = React.useState("")
    const [selected, setSelected] = React.useState<Set<string>>(new Set())
    const [results, setResults] = React.useState<
        Array<{ saleId: string; reference: string | null; ok: boolean; error?: string }>
    >([])
    const batch = useBatchSalePaymentLinks()

    const { orders, isLoading } = useOrders(1, 100, {
        paymentStatus: ["PARTIAL"],
    })

    const filtered = React.useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return orders
        return orders.filter(
            (o) =>
                o.customer?.toLowerCase().includes(q) ||
                o.summary?.toLowerCase().includes(q) ||
                o.shortCode?.toLowerCase().includes(q)
        )
    }, [orders, search])

    const allSelected = filtered.length > 0 && filtered.every((o) => selected.has(o.id))

    const toggleAll = () => {
        if (allSelected) {
            setSelected((prev) => {
                const next = new Set(prev)
                filtered.forEach((o) => next.delete(o.id))
                return next
            })
        } else {
            setSelected((prev) => {
                const next = new Set(prev)
                filtered.forEach((o) => next.add(o.id))
                return next
            })
        }
    }

    const toggleOne = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const onGenerate = () => {
        const ids = Array.from(selected)
        if (ids.length === 0) {
            toast.error("Select at least one fee to generate links for.")
            return
        }
        setResults([])
        batch.mutate(ids, {
            onSuccess: (r) => {
                setResults(r)
                setSelected(new Set())
            },
        })
    }

    const origin = typeof window !== "undefined" ? window.location.origin : ""

    const copyAll = async () => {
        const lines = results
            .filter((r) => r.ok && r.reference)
            .map((r) => `${origin}/pay/${r.reference}`)
        if (lines.length === 0) {
            toast.error("No successful links to copy.")
            return
        }
        await navigator.clipboard.writeText(lines.join("\n"))
        toast.success(`${lines.length} link${lines.length > 1 ? "s" : ""} copied`)
    }

    return (
        <GlassCard className="overflow-hidden border-brand-gold/15 bg-linear-to-br from-white/70 to-brand-gold/[0.03] dark:from-white/[0.07] dark:to-brand-gold/[0.03] p-0">
            {/* Header */}
            <div className="flex items-start gap-3 px-5 py-5 border-b border-brand-deep/5 dark:border-white/8">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-gold mt-0.5">
                    <Link2 className="h-4 w-4" />
                </div>
                <div>
                    <p className="font-serif text-base text-brand-deep dark:text-brand-cream">
                        Batch payment links
                    </p>
                    <p className="mt-0.5 text-sm text-brand-deep/60 dark:text-brand-cream/60 max-w-md">
                        Select fees with outstanding balances and generate shareable payment links for each in one go.
                    </p>
                </div>
            </div>

            <div className="px-5 py-4 space-y-3">
                {/* Search + select-all row */}
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-deep/35 dark:text-brand-cream/35 pointer-events-none" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by student name…"
                            className="pl-9 h-9 rounded-xl text-sm"
                        />
                    </div>
                    {filtered.length > 0 && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={toggleAll}
                            className="flex items-center gap-1.5 text-xs text-brand-deep/55 dark:text-brand-cream/55 shrink-0"
                        >
                            {allSelected ? (
                                <CheckSquare className="h-4 w-4" />
                            ) : (
                                <Square className="h-4 w-4" />
                            )}
                            {allSelected ? "Deselect all" : "Select all"}
                        </Button>
                    )}
                </div>

                {/* List */}
                {isLoading ? (
                    <div className="flex items-center gap-2 text-sm text-brand-deep/55 dark:text-brand-cream/55 py-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading outstanding fees…
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="rounded-2xl border border-brand-deep/8 dark:border-white/8 bg-white/30 dark:bg-white/[0.02] px-5 py-8 text-center">
                        <p className="text-sm text-brand-deep/50 dark:text-brand-cream/50">
                            {search ? "No fees match your search." : "No outstanding fees found. Record a fee payment to see it here."}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-0.5">
                        {filtered.map((order) => (
                            <SaleRow
                                key={order.id}
                                order={order}
                                selected={selected.has(order.id)}
                                onToggle={() => toggleOne(order.id)}
                                currency={currencyCode}
                            />
                        ))}
                    </div>
                )}

                {/* Generate button */}
                {filtered.length > 0 && (
                    <div className="flex items-center justify-between gap-3 pt-1">
                        <p className="text-xs text-brand-deep/50 dark:text-brand-cream/50">
                            {selected.size > 0
                                ? `${selected.size} fee${selected.size > 1 ? "s" : ""} selected`
                                : "Tap fees to select them"}
                        </p>
                        <Button
                            type="button"
                            className="rounded-full"
                            disabled={selected.size === 0 || batch.isPending}
                            onClick={onGenerate}
                        >
                            {batch.isPending ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Link2 className="h-4 w-4 mr-2" />
                            )}
                            {batch.isPending
                                ? "Generating…"
                                : `Generate ${selected.size > 0 ? selected.size : ""} link${selected.size !== 1 ? "s" : ""}`}
                        </Button>
                    </div>
                )}

                {/* Results */}
                <AnimatePresence>
                    {results.length > 0 && !batch.isPending && (
                        <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.22 }}
                            className="rounded-2xl border border-brand-green/20 bg-brand-green/[0.04] dark:bg-brand-green/[0.06] px-4 py-4 space-y-3"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="h-7 w-7 rounded-full bg-brand-green/15 flex items-center justify-center">
                                        <Check className="h-3.5 w-3.5 text-brand-green" />
                                    </div>
                                    <p className="text-sm font-medium text-brand-deep dark:text-brand-cream">
                                        {results.filter((r) => r.ok).length} link{results.filter((r) => r.ok).length !== 1 ? "s" : ""} ready
                                        {results.filter((r) => !r.ok).length > 0 && (
                                            <span className="ml-1.5 text-destructive/70 font-normal">
                                                · {results.filter((r) => !r.ok).length} failed
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    className="rounded-full"
                                    onClick={() => void copyAll()}
                                >
                                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                                    Copy all URLs
                                </Button>
                            </div>
                            <ul className="space-y-1.5 max-h-44 overflow-y-auto">
                                {results.map((r) => (
                                    <li key={r.saleId} className="text-xs rounded-xl px-3 py-2 bg-white/50 dark:bg-white/[0.04] border border-brand-deep/6 dark:border-white/6">
                                        {r.ok && r.reference ? (
                                            <a
                                                href={`${origin}/pay/${r.reference}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-brand-deep/80 dark:text-brand-cream/80 font-mono hover:text-brand-deep dark:hover:text-brand-cream break-all"
                                            >
                                                {origin}/pay/{r.reference}
                                            </a>
                                        ) : (
                                            <span className="text-destructive font-mono break-all">
                                                {r.saleId}: {r.error ?? "Failed"}
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </GlassCard>
    )
}

// ─── Main view ─────────────────────────────────────────────────────────────────

const sectionMotion = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } }

export function SchoolFeeToolsView() {
    return (
        <PageTransition>
            <div className="max-w-5xl mx-auto space-y-8 pb-24">
                <motion.div {...sectionMotion} transition={{ duration: 0.35 }}>
                    <ManagementHeader
                        title="Fee presets & links"
                        description="Manage saved fee templates for quick entry and generate bulk payment links for outstanding fees."
                    />
                </motion.div>

                <motion.div
                    {...sectionMotion}
                    transition={{ duration: 0.35, delay: 0.06 }}
                    className="space-y-6"
                >
                    <FeeTemplatesSection />
                    <FeePresetsSection />
                    <BatchLinksSection />
                </motion.div>
            </div>
        </PageTransition>
    )
}
