"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import {
    Archive,
    ChevronsUpDown,
    GitBranch,
    Loader2,
    Plus,
    Save,
    Trash2,
    X,
} from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Textarea } from "@/app/components/ui/textarea"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Badge } from "@/app/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { MultiSelect, type MultiSelectOption } from "@/app/components/ui/multi-select"
import { SortableBlockList } from "@/app/components/ui/sortable-block-list"
import { useWhatsAppNumbers } from "@/app/domains/messaging/hooks/useWhatsAppSettings"
import {
    useCreateWhatsAppFlow,
    useUpdateWhatsAppFlow,
    usePublishWhatsAppFlow,
    type WhatsAppFlowSummary,
} from "@/app/domains/messaging/hooks/useWhatsAppInbox"
import { FlowPhonePreview } from "./FlowPhonePreview"
import {
    type FlowFieldDraft,
    type FlowFieldKind,
    createFlowFieldDraft,
    slugifyFlowFieldName,
    buildFlowJsonFromDraft,
    parseFlowJsonToDraft,
    formatWhatsAppNumberLabel,
} from "./FlowsTab"

const SESSION_KEY = "whatsapp_flow_builder_draft"

const FLOW_CATEGORIES: MultiSelectOption[] = [
    { value: "SIGN_UP", label: "Sign Up" },
    { value: "SIGN_IN", label: "Sign In" },
    { value: "APPOINTMENT_BOOKING", label: "Appointment Booking" },
    { value: "LEAD_GENERATION", label: "Lead Generation" },
    { value: "CONTACT_US", label: "Contact Us" },
    { value: "CUSTOMER_SUPPORT", label: "Customer Support" },
    { value: "SURVEY", label: "Survey" },
    { value: "OTHER", label: "Other" },
]

interface FlowBuilderProps {
    editingFlow: WhatsAppFlowSummary | null
    selectedNumberId: string
    onNumberChange: (id: string) => void
    onSave: () => void
    onCancel: () => void
}

function useFormPersistence(
    editingFlow: WhatsAppFlowSummary | null,
    selectedNumberId: string,
) {
    const restoreFromSession = useCallback(() => {
        try {
            const saved = sessionStorage.getItem(SESSION_KEY)
            if (saved) {
                const parsed = JSON.parse(saved)
                if (parsed?.forFlowId === editingFlow?.id && parsed?.forNumberId === selectedNumberId) {
                    return parsed as Record<string, unknown>
                }
            }
        } catch { /* ignore */ }
        return null
    }, [editingFlow?.id, selectedNumberId])

    const saveToSession = useCallback((state: Record<string, unknown>) => {
        try {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify({
                ...state,
                forFlowId: editingFlow?.id ?? null,
                forNumberId: selectedNumberId,
                savedAt: Date.now(),
            }))
        } catch { /* ignore */ }
    }, [editingFlow?.id, selectedNumberId])

    const clearSession = useCallback(() => {
        try {
            sessionStorage.removeItem(SESSION_KEY)
        } catch { /* ignore */ }
    }, [])

    return { restoreFromSession, saveToSession, clearSession }
}

export function FlowBuilder({ editingFlow, selectedNumberId, onNumberChange, onSave, onCancel }: FlowBuilderProps) {
    const { data: numbers } = useWhatsAppNumbers()
    const createFlow = useCreateWhatsAppFlow()
    const updateFlow = useUpdateWhatsAppFlow()
    const publishFlow = usePublishWhatsAppFlow()
    const { restoreFromSession, saveToSession, clearSession } = useFormPersistence(editingFlow, selectedNumberId)

    // Form state — initialised from editing flow or session
    const [flowKey, setFlowKey] = useState("")
    const [flowName, setFlowName] = useState("")
    const [flowDisplayName, setFlowDisplayName] = useState("")
    const [flowCta, setFlowCta] = useState("")
    const [flowBody, setFlowBody] = useState("")
    const [flowIntro, setFlowIntro] = useState("")
    const [flowFooter, setFlowFooter] = useState("")
    const [flowDescription, setFlowDescription] = useState("")
    const [flowCategories, setFlowCategories] = useState<string[]>(["OTHER"])
    const [flowFields, setFlowFields] = useState<FlowFieldDraft[]>([createFlowFieldDraft("text")])
    const [publishing, setPublishing] = useState(false)

    // Restore from session or editing flow
    useEffect(() => {
        const session = restoreFromSession()
        if (session && !editingFlow) {
            setFlowDisplayName(String(session.displayName ?? ""))
            setFlowCta(String(session.cta ?? ""))
            setFlowBody(String(session.body ?? ""))
            setFlowIntro(String(session.intro ?? ""))
            setFlowFooter(String(session.footer ?? ""))
            setFlowDescription(String(session.description ?? ""))
            setFlowCategories(
                Array.isArray(session.categories) && (session.categories as string[]).length > 0
                    ? (session.categories as string[])
                    : ["OTHER"]
            )
            setFlowFields((session.fields as FlowFieldDraft[]) ?? [createFlowFieldDraft("text")])
        } else if (editingFlow) {
            setFlowKey(editingFlow.key)
            setFlowName(editingFlow.name)
            setFlowDisplayName(editingFlow.display_name)
            setFlowCta(editingFlow.cta_text)
            setFlowBody(editingFlow.body_text || "")
            setFlowFooter(editingFlow.footer_text || "")
            setFlowDescription(editingFlow.description || "")
            setFlowCategories(editingFlow.categories.length > 0 ? editingFlow.categories : ["OTHER"])
            const parsed = parseFlowJsonToDraft(editingFlow.flow_json)
            setFlowIntro(parsed.introText)
            setFlowFields(parsed.fields)
        }
    }, [editingFlow])

    // Auto-generate flow key and internal name from display name (new flows only)
    useEffect(() => {
        if (!editingFlow && flowDisplayName.trim()) {
            const slug = slugifyFlowFieldName(flowDisplayName)
            setFlowKey(slug)
            setFlowName(slug)
        }
    }, [flowDisplayName, editingFlow])

    // Auto-save to sessionStorage
    useEffect(() => {
        if (!editingFlow) {
            const timer = setTimeout(() => {
                saveToSession({
                    displayName: flowDisplayName,
                    cta: flowCta,
                    body: flowBody,
                    intro: flowIntro,
                    footer: flowFooter,
                    description: flowDescription,
                    categories: flowCategories,
                    fields: flowFields,
                })
            }, 500)
            return () => clearTimeout(timer)
        }
    }, [flowDisplayName, flowCta, flowBody, flowIntro, flowFooter, flowDescription, flowCategories, flowFields, editingFlow, saveToSession])

    const updateField = (index: number, field: keyof FlowFieldDraft, value: string | boolean) => {
        setFlowFields((current) =>
            current.map((item, i) => {
                if (i !== index) return item
                const updated = { ...item, [field]: value }
                // Auto-generate field name from label
                if (field === "label" && typeof value === "string") {
                    updated.name = slugifyFlowFieldName(value)
                }
                return updated
            })
        )
    }

    const addField = (kind: FlowFieldKind = "text") => {
        setFlowFields((current) => [...current, createFlowFieldDraft(kind)])
    }

    const removeField = (index: number) => {
        setFlowFields((current) => current.filter((_, i) => i !== index))
    }

    const isValid =
        selectedNumberId &&
        flowKey.trim() &&
        flowName.trim() &&
        flowDisplayName.trim() &&
        flowCta.trim()

    const handlePublish = async () => {
        if (!isValid) return
        setPublishing(true)
        try {
            await updateFlow.mutateAsync({
                id: editingFlow!.id,
                businessWhatsappNumberId: selectedNumberId,
                key: flowKey.trim(),
                name: flowName.trim(),
                displayName: flowDisplayName.trim(),
                ctaText: flowCta.trim(),
                bodyText: flowBody.trim(),
                footerText: flowFooter.trim(),
                description: flowDescription.trim(),
                categories: flowCategories,
                flowJson: buildFlowJsonFromDraft({
                    key: flowKey.trim(),
                    title: flowDisplayName.trim() || flowName.trim(),
                    ctaText: flowCta.trim(),
                    introText: flowIntro.trim(),
                    fields: flowFields,
                }),
            })
            await publishFlow.mutateAsync({
                id: editingFlow!.id,
                businessWhatsappNumberId: selectedNumberId,
            })
            toast.success("Flow published")
            clearSession()
            onSave()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to publish flow")
        } finally {
            setPublishing(false)
        }
    }

    const handleSave = async () => {
        if (!isValid) return
        try {
            const flowJson = buildFlowJsonFromDraft({
                key: flowKey.trim(),
                title: flowDisplayName.trim() || flowName.trim(),
                ctaText: flowCta.trim(),
                introText: flowIntro.trim(),
                fields: flowFields,
            })
            const payload = {
                businessWhatsappNumberId: selectedNumberId,
                key: flowKey.trim(),
                name: flowName.trim(),
                displayName: flowDisplayName.trim(),
                ctaText: flowCta.trim(),
                bodyText: flowBody.trim(),
                footerText: flowFooter.trim(),
                description: flowDescription.trim(),
                categories: flowCategories,
                flowJson,
            }

            if (editingFlow) {
                await updateFlow.mutateAsync({ id: editingFlow.id, ...payload })
                toast.success("Flow updated")
            } else {
                await createFlow.mutateAsync(payload)
                toast.success("Flow created")
            }
            clearSession()
            onSave()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to save flow")
        }
    }

    const isSaving = createFlow.isPending || updateFlow.isPending

    // Preview data
    const previewData = {
        title: flowDisplayName.trim() || flowName.trim(),
        introText: flowIntro.trim(),
        ctaText: flowCta.trim(),
        fields: flowFields,
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="space-y-5"
        >
            {/* Header bar */}
            <GlassCard className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => { clearSession(); onCancel() }}
                            className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/60 bg-muted/30 text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                        <div>
                            <h2 className="text-sm font-semibold text-foreground">
                                {editingFlow ? "Edit flow" : "New flow"}
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                {editingFlow ? "Update and publish your WhatsApp flow" : "Build a new WhatsApp flow for your business number"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="rounded-full text-xs"
                            onClick={() => { clearSession(); onCancel() }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            className="rounded-full text-xs"
                            onClick={handleSave}
                            disabled={!isValid || isSaving}
                        >
                            {isSaving ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Save className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            {editingFlow ? "Save" : "Create"}
                        </Button>
                        {editingFlow && (
                            <Button
                                type="button"
                                size="sm"
                                className="rounded-full text-xs"
                                onClick={handlePublish}
                                disabled={!isValid || publishing || editingFlow.status === "PUBLISHED"}
                            >
                                {publishing ? (
                                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                ) : null}
                                {editingFlow.status === "PUBLISHED" ? "Published" : "Publish"}
                            </Button>
                        )}
                    </div>
                </div>
            </GlassCard>

            {/* Two-column layout */}
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_380px]">
                {/* Left: Form */}
                <div className="space-y-5">
                    {/* Section: Settings */}
                    <GlassCard className="divide-y divide-border/40 p-0">
                        <div className="flex items-center gap-2.5 px-5 pt-4 pb-3">
                            <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-border/60 bg-muted/30">
                                <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-foreground">Settings</h3>
                                <p className="text-xs text-muted-foreground">Basic configuration for this flow</p>
                            </div>
                        </div>
                        <div className="space-y-4 px-5 py-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-foreground">WhatsApp number</label>
                                <Select value={selectedNumberId} onValueChange={onNumberChange}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {numbers?.map((number) => (
                                            <SelectItem key={number.id} value={number.id}>
                                                {formatWhatsAppNumberLabel(number)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground/60">
                                    The business number this flow belongs to.
                                </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-foreground">
                                        Display name <span className="text-red-400">*</span>
                                    </label>
                                    <Input
                                        value={flowDisplayName}
                                        onChange={(e) => setFlowDisplayName(e.target.value)}
                                        placeholder="Customer Follow Up"
                                    />
                                    <p className="text-xs text-muted-foreground/60">
                                        The name shown to customers inside the flow
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-foreground">
                                        CTA text <span className="text-red-400">*</span>
                                    </label>
                                    <Input
                                        value={flowCta}
                                        onChange={(e) => setFlowCta(e.target.value)}
                                        placeholder="Open form"
                                    />
                                    <p className="text-xs text-muted-foreground/60">
                                        Button text that submits the form
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-foreground">Categories</label>
                                <MultiSelect
                                    options={FLOW_CATEGORIES}
                                    value={flowCategories}
                                    onChange={setFlowCategories}
                                    placeholder="Select categories..."
                                    renderTrigger={(selected) => {
                                        const selectedLabels = selected.length > 0
                                            ? FLOW_CATEGORIES
                                                .filter((opt) => selected.includes(opt.value))
                                                .map((opt) => opt.label)
                                            : []
                                        return (
                                            <div
                                                className="flex min-h-12 w-full cursor-pointer flex-wrap items-center gap-1.5 rounded-xl border border-brand-deep/10 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm transition hover:bg-brand-deep/2"
                                            >
                                                {selectedLabels.length === 0 ? (
                                                    <span className="text-brand-accent/40 dark:text-brand-cream/40 font-normal">
                                                        Select categories...
                                                    </span>
                                                ) : (
                                                    selectedLabels.map((label) => (
                                                        <span
                                                            key={label}
                                                            className="inline-flex items-center gap-1 rounded-full border border-brand-deep/10 dark:border-white/10 bg-brand-deep/5 dark:bg-white/10 px-2 py-0.5 text-xs font-medium text-brand-deep dark:text-brand-cream"
                                                        >
                                                            {label}
                                                        </span>
                                                    ))
                                                )}
                                                <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                                            </div>
                                        )
                                    }}
                                />
                                <p className="text-xs text-muted-foreground/60">
                                    Used by Meta for flow categorization.
                                </p>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Section: Content */}
                    <GlassCard className="divide-y divide-border/40 p-0">
                        <div className="flex items-center gap-2.5 px-5 pt-4 pb-3">
                            <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-border/60 bg-muted/30">
                                <svg className="h-3.5 w-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-foreground">Content</h3>
                                <p className="text-xs text-muted-foreground">Text and messaging for the flow</p>
                            </div>
                        </div>
                        <div className="space-y-4 px-5 py-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-foreground">Flow description</label>
                                <Textarea
                                    value={flowDescription}
                                    onChange={(e) => setFlowDescription(e.target.value)}
                                    rows={2}
                                    placeholder="Describe what this flow is for..."
                                    className="resize-none"
                                />
                                <p className="text-xs text-muted-foreground/60">
                                    Internal note; not shown to customers
                                </p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-foreground">Message body</label>
                                <Textarea
                                    value={flowBody}
                                    onChange={(e) => setFlowBody(e.target.value)}
                                    rows={3}
                                    placeholder="Body text shown in WhatsApp before the flow opens..."
                                    className="resize-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-foreground">Intro text</label>
                                <Textarea
                                    value={flowIntro}
                                    onChange={(e) => setFlowIntro(e.target.value)}
                                    rows={3}
                                    placeholder="Greeting or instructions shown at the top of the form..."
                                    className="resize-none"
                                />
                                <p className="text-xs text-muted-foreground/60">
                                    Displayed above the form fields inside the WhatsApp flow
                                </p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-foreground">Footer text</label>
                                <Input
                                    value={flowFooter}
                                    onChange={(e) => setFlowFooter(e.target.value)}
                                    placeholder="Small text below the form (optional)"
                                />
                            </div>
                        </div>
                    </GlassCard>

                    {/* Section: Form fields */}
                    <GlassCard className="divide-y divide-border/40 p-0">
                        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-border/60 bg-muted/30">
                                    <svg className="h-3.5 w-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground">Form fields</h3>
                                    <p className="text-xs text-muted-foreground">
                                        Fields that customers will fill in
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="rounded-full text-xs">
                                    {flowFields.length} field{flowFields.length === 1 ? "" : "s"}
                                </Badge>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full text-xs"
                                    onClick={() => addField("text")}
                                >
                                    <Plus className="mr-1 h-3 w-3" />
                                    Add
                                </Button>
                            </div>
                        </div>
                        <div className="px-5 py-4">
                            <AnimatePresence mode="popLayout">
                                {flowFields.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex flex-col items-center gap-2 py-8 text-center"
                                    >
                                        <p className="text-sm text-muted-foreground">No fields yet</p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="rounded-full text-xs"
                                            onClick={() => addField("text")}
                                        >
                                            <Plus className="mr-1 h-3 w-3" />
                                            Add your first field
                                        </Button>
                                    </motion.div>
                                ) : (
                                    <SortableBlockList
                                        items={flowFields}
                                        onReorder={setFlowFields}
                                        className="space-y-3"
                                        itemClassName="group rounded-3xl border-border/40 bg-background/50 hover:border-border/70 hover:bg-muted/10"
                                        renderItem={(field) => {
                                            const index = flowFields.findIndex((item) => item.id === field.id)

                                            return (
                                                <div className="px-3.5 py-3.5">
                                                    <div className="mb-3 flex items-center justify-between gap-2">
                                                        <div className="flex min-w-0 items-center gap-2">
                                                            <Select
                                                                value={field.kind}
                                                                onValueChange={(value) => updateField(index, "kind", value)}
                                                            >
                                                                <SelectTrigger className="h-7 rounded-lg border-0 bg-muted/30 px-2.5 text-xs font-medium text-muted-foreground hover:bg-muted/50 [&>svg]:h-3 [&>svg]:w-3">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="text">Short text</SelectItem>
                                                                    <SelectItem value="number">Number</SelectItem>
                                                                    <SelectItem value="textarea">Long text</SelectItem>
                                                                    <SelectItem value="dropdown">Dropdown</SelectItem>
                                                                    <SelectItem value="checkbox">Checkbox group</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => updateField(index, "required", !field.required)}
                                                                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                                                                    field.required
                                                                        ? "bg-brand-deep/10 text-brand-deep dark:bg-brand-gold-600/15 dark:text-brand-gold-300"
                                                                        : "text-muted-foreground/60 hover:text-muted-foreground"
                                                                }`}
                                                            >
                                                                {field.required ? "Required" : "Optional"}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeField(index)}
                                                                className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/40 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="grid gap-3 sm:grid-cols-2">
                                                        <div className="space-y-1.5 sm:col-span-2">
                                                            <label className="text-[11px] font-medium text-muted-foreground">Label</label>
                                                            <Input
                                                                value={field.label}
                                                                onChange={(e) => updateField(index, "label", e.target.value)}
                                                                placeholder="Full name"
                                                                className="h-9 text-sm"
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5 sm:col-span-2">
                                                            <label className="text-[11px] font-medium text-muted-foreground">Helper text</label>
                                                            <Input
                                                                value={field.helperText}
                                                                onChange={(e) => updateField(index, "helperText", e.target.value)}
                                                                placeholder="Optional: displayed below the field"
                                                                className="h-9 text-sm"
                                                            />
                                                        </div>
                                                        {(field.kind === "dropdown" || field.kind === "checkbox") ? (
                                                            <div className="space-y-1.5 sm:col-span-2">
                                                                <label className="text-[11px] font-medium text-muted-foreground">Options</label>
                                                                <Textarea
                                                                    value={field.optionsText}
                                                                    onChange={(e) => updateField(index, "optionsText", e.target.value)}
                                                                    rows={3}
                                                                    className="resize-none font-mono text-xs"
                                                                    placeholder={"order: Order issue\npayment: Payment issue\nother: Other"}
                                                                />
                                                                <p className="text-[11px] text-muted-foreground/60">
                                                                    One per line. Format: <span className="font-mono">id: Display label</span>
                                                                </p>
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            )
                                        }}
                                    />
                                )}
                            </AnimatePresence>
                        </div>
                    </GlassCard>
                </div>

                {/* Right: Phone preview (sticky) */}
                <div className="space-y-3 xl:sticky xl:top-24 xl:self-start">
                    <div className="flex items-center gap-2 px-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span className="text-xs font-semibold text-foreground">Live preview</span>
                        <span className="text-xs text-muted-foreground/50">· Phone view</span>
                    </div>
                    <div className="h-[calc(100svh-15rem)] min-h-[520px] max-h-[760px] xl:h-[calc(100svh-11rem)]">
                        <FlowPhonePreview {...previewData} />
                    </div>
                    <p className="px-1 text-[11px] leading-relaxed text-muted-foreground/70">
                        This preview mirrors the flow structure customers will see in WhatsApp, including field order and submit CTA.
                    </p>
                </div>
            </div>
        </motion.div>
    )
}
