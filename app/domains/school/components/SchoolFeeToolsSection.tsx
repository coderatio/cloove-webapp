"use client"

import * as React from "react"
import { Link2, Plus, Trash2 } from "lucide-react"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { useSettings, useUpdateBusinessSettings } from "@/app/domains/business/hooks/useBusinessSettings"
import { usePermission } from "@/app/hooks/usePermission"
import { SchoolBatchPaymentLinksDrawer } from "./SchoolBatchPaymentLinksDrawer"
import { toast } from "sonner"

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

export function SchoolFeeToolsSection() {
    const { can } = usePermission()
    const canConfig = can("MANAGE_BUSINESS_CONFIG")
    const { data: settings } = useSettings()
    const updateSettings = useUpdateBusinessSettings()

    const [batchOpen, setBatchOpen] = React.useState(false)
    const [templates, setTemplates] = React.useState<SchoolFeeTemplate[]>([])

    React.useEffect(() => {
        const raw = settings?.business?.configs?.school_fee_templates
        setTemplates(normalizeTemplates(raw))
    }, [settings?.business?.configs?.school_fee_templates])

    const [draftLabel, setDraftLabel] = React.useState("")
    const [draftAmount, setDraftAmount] = React.useState("")
    const [draftNotes, setDraftNotes] = React.useState("")

    const persist = (next: SchoolFeeTemplate[]) => {
        if (!canConfig) return
        updateSettings.mutate(
            { school_fee_templates: JSON.stringify(next), quiet: true },
            {
                onSuccess: () => toast.success("Fee presets saved"),
                onError: () => toast.error("Could not save presets"),
            }
        )
    }

    const addTemplate = () => {
        const label = draftLabel.trim()
        const amount = Number(draftAmount)
        if (!label || !Number.isFinite(amount) || amount < 0) {
            toast.error("Enter a label and a valid amount.")
            return
        }
        const next: SchoolFeeTemplate[] = [
            ...templates,
            {
                id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `ft-${Date.now()}`,
                label,
                amount,
                notes: draftNotes.trim() || undefined,
            },
        ]
        setTemplates(next)
        setDraftLabel("")
        setDraftAmount("")
        setDraftNotes("")
        persist(next)
    }

    const removeTemplate = (id: string) => {
        const next = templates.filter((t) => t.id !== id)
        setTemplates(next)
        persist(next)
    }

    return (
        <>
            <GlassCard className="overflow-hidden border-brand-gold/15 bg-linear-to-br from-white/60 to-brand-gold/[0.04] dark:from-white/[0.06] dark:to-brand-gold/[0.03] p-0">
                <div className="border-b border-brand-deep/5 px-5 py-4 dark:border-white/10">
                    <h2 className="font-serif text-lg text-brand-deep dark:text-brand-cream">Fee presets & batch links</h2>
                    <p className="text-sm text-brand-deep/65 dark:text-brand-cream/65 mt-1 max-w-2xl">
                        Save common fee amounts as a checklist for staff. Generate many payment links at once from
                        pending fee IDs.
                    </p>
                </div>
                <div className="px-5 py-5 space-y-6">
                    <div className="space-y-3">
                        <p className="text-sm font-medium text-brand-deep dark:text-brand-cream">Saved fee labels</p>
                        {templates.length === 0 ? (
                            <p className="text-sm text-brand-deep/60 dark:text-brand-cream/60">
                                No presets yet—add tuition, transport, or exam lines your team records often.
                            </p>
                        ) : (
                            <ul className="space-y-2">
                                {templates.map((t) => (
                                    <li
                                        key={t.id}
                                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-deep/10 dark:border-white/10 px-3 py-2 text-sm"
                                    >
                                        <span className="text-brand-deep dark:text-brand-cream">
                                            <strong>{t.label}</strong>
                                            <span className="text-brand-deep/60 dark:text-brand-cream/60">
                                                {" "}
                                                · {t.amount.toLocaleString()}{" "}
                                                {settings?.business?.currency ?? ""}
                                            </span>
                                            {t.notes ? (
                                                <span className="block text-xs text-brand-deep/55 dark:text-brand-cream/55 mt-0.5">
                                                    {t.notes}
                                                </span>
                                            ) : null}
                                        </span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg"
                                            disabled={!canConfig || updateSettings.isPending}
                                            aria-label={`Remove ${t.label}`}
                                            onClick={() => removeTemplate(t.id)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {canConfig ? (
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-end">
                                <div className="space-y-1">
                                    <Label htmlFor="fee-label">Label</Label>
                                    <Input
                                        id="fee-label"
                                        value={draftLabel}
                                        onChange={(e) => setDraftLabel(e.target.value)}
                                        placeholder="Tuition"
                                        className="rounded-2xl"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="fee-amount">Amount</Label>
                                    <Input
                                        id="fee-amount"
                                        type="number"
                                        min={0}
                                        step="1"
                                        value={draftAmount}
                                        onChange={(e) => setDraftAmount(e.target.value)}
                                        placeholder="0"
                                        className="rounded-2xl"
                                    />
                                </div>
                                <div className="space-y-1 sm:col-span-2 lg:col-span-2">
                                    <Label htmlFor="fee-notes">Notes (optional)</Label>
                                    <Input
                                        id="fee-notes"
                                        value={draftNotes}
                                        onChange={(e) => setDraftNotes(e.target.value)}
                                        placeholder="e.g. SS1 only"
                                        className="rounded-2xl"
                                    />
                                </div>
                                <div className="lg:col-span-4">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="rounded-full"
                                        onClick={() => addTemplate()}
                                        disabled={updateSettings.isPending}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add preset
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-brand-deep/55 dark:text-brand-cream/55">
                                Only workspace managers can edit fee presets.
                            </p>
                        )}
                    </div>

                    <div className="border-t border-brand-deep/10 dark:border-white/10 pt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <p className="text-sm font-medium text-brand-deep dark:text-brand-cream">Batch payment links</p>
                            <p className="text-xs text-brand-deep/55 dark:text-brand-cream/55 mt-0.5 max-w-md">
                                Paste pending sale IDs from Fees & sales—ideal after recording many manual fees.
                            </p>
                        </div>
                        <Button
                            type="button"
                            className="rounded-full shrink-0"
                            onClick={() => setBatchOpen(true)}
                        >
                            <Link2 className="h-4 w-4 mr-2" />
                            Open batch generator
                        </Button>
                    </div>
                </div>
            </GlassCard>

            <SchoolBatchPaymentLinksDrawer open={batchOpen} onOpenChange={setBatchOpen} />
        </>
    )
}
