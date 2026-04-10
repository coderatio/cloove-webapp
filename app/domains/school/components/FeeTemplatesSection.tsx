"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Plus,
    Trash2,
    Loader2,
    FileText,
    Users,
    Pencil,
    Play,
    Archive,
    CheckCircle2,
    Clock,
    AlertCircle,
    Search,
    CalendarDays,
    Layers,
    CircleDot,
} from "lucide-react"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Calendar } from "@/app/components/ui/calendar"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/app/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover"
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose,
} from "@/app/components/ui/drawer"
import { ConfirmDialog } from "@/app/components/shared/ConfirmDialog"
import { MoneyInput } from "@/app/components/ui/money-input"
import { Label } from "@/app/components/ui/label"
import { useBusiness } from "@/app/components/BusinessProvider"
import { useDepartments } from "@/app/domains/staff/hooks/useDepartments"
import { useAcademicCalendar } from "@/app/domains/school/hooks/useAcademicCalendar"
import {
    useFeeTemplates,
    useFeeTemplateStatus,
    type FeeTemplate,
    type FeeTemplateItemInput,
    type StoreFeeTemplateInput,
} from "../hooks/useFeeTemplates"
import { formatCurrency } from "@/app/lib/formatters"
import { cn } from "@/app/lib/utils"
import { toast } from "sonner"
import { format } from "date-fns"
import { CurrencyText } from "@/app/components/shared/CurrencyText"

// ─── Types ─────────────────────────────────────────────────────────────────────

type StatusFilter = "ALL" | "DRAFT" | "ACTIVE" | "ARCHIVED"

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
    DRAFT: {
        label: "Draft",
        dot: "bg-amber-400",
        bar: "bg-amber-400/60 dark:bg-amber-400/40",
        pill: "bg-amber-400/10 text-amber-600 dark:text-amber-400/80 border-amber-400/20",
    },
    ACTIVE: {
        label: "Active",
        dot: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]",
        bar: "bg-emerald-500/70 dark:bg-emerald-500/50",
        pill: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400/80 border-emerald-500/20",
    },
    ARCHIVED: {
        label: "Archived",
        dot: "bg-brand-deep/20 dark:bg-white/20",
        bar: "bg-brand-deep/15 dark:bg-white/10",
        pill: "bg-brand-deep/5 text-brand-accent/50 dark:text-brand-cream/40 border-brand-deep/10 dark:border-white/10",
    },
} satisfies Record<FeeTemplate["status"], { label: string; dot: string; bar: string; pill: string }>

// ─── Progress bar ───────────────────────────────────────────────────────────────

function TemplateProgressBar({ templateId }: { templateId: string }) {
    const { data, isLoading } = useFeeTemplateStatus(templateId)

    if (isLoading) {
        return (
            <div className="animate-pulse space-y-2">
                <div className="h-2 w-full rounded-full bg-brand-deep/6 dark:bg-white/6" />
            </div>
        )
    }

    if (!data || data.totalStudents === 0) return null

    const paidPct = (data.paid / data.totalStudents) * 100
    const partialPct = (data.partial / data.totalStudents) * 100
    const collectedPct = data.totalBilled > 0
        ? Math.min(100, (data.totalCollected / data.totalBilled) * 100)
        : 0

    return (
        <div className="space-y-2.5 pt-1">
            {/* Stats row */}
            <div className="flex items-center gap-4 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-brand-accent/60 dark:text-brand-cream/50">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-400/80">{data.paid}</span> paid
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-brand-accent/60 dark:text-brand-cream/50">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span className="font-semibold tabular-nums text-amber-600 dark:text-amber-400/80">{data.partial}</span> partial
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-brand-accent/60 dark:text-brand-cream/50">
                    <AlertCircle className="w-3 h-3 text-brand-deep/30 dark:text-brand-cream/30" />
                    <span className="font-semibold tabular-nums">{data.unpaid}</span> unpaid
                </span>
                <span className="ml-auto text-[11px] font-semibold text-brand-accent/50 dark:text-brand-cream/40 tabular-nums">
                    {Math.round(collectedPct)}% collected
                </span>
            </div>

            {/* Segmented bar */}
            <div className="h-2 rounded-full bg-brand-deep/6 dark:bg-white/6 overflow-hidden flex gap-px">
                <motion.div
                    className="h-full bg-emerald-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${paidPct}%` }}
                    transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
                />
                <motion.div
                    className="h-full bg-amber-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${partialPct}%` }}
                    transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
                />
            </div>
        </div>
    )
}

// ─── Template Card ──────────────────────────────────────────────────────────────

function TemplateCard({
    template,
    currency,
    index,
    onEdit,
    onApply,
    onArchive,
    onDelete,
    isApplying,
}: {
    template: FeeTemplate
    currency: string
    index: number
    onEdit: () => void
    onApply: () => void
    onArchive: () => void
    onDelete: () => void
    isApplying: boolean
}) {
    const cfg = STATUS_CONFIG[template.status]
    const mandatory = template.items.filter((i) => !i.isOptional)
    const total = mandatory.reduce((s, i) => s + Number(i.amount), 0)
    const previewItems = mandatory.slice(0, 3)
    const overflow = mandatory.length - 3

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ delay: index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="group relative"
        >
            <div
                className={cn(
                    "relative rounded-[20px] border overflow-hidden transition-all duration-400",
                    "bg-brand-cream/50 border-brand-green/8 shadow-[0_3px_16px_rgba(6,44,33,0.03)]",
                    "dark:bg-white/3 dark:border-white/6",
                    "hover:shadow-[0_8px_28px_rgba(6,44,33,0.07)] hover:border-brand-green/15",
                    "dark:hover:shadow-[0_8px_28px_rgba(0,0,0,0.2)] dark:hover:border-white/10",
                    template.status === "ARCHIVED" && "opacity-70"
                )}
            >
                {/* Inner glow */}
                <div className="absolute inset-0 bg-linear-to-br from-white/30 via-transparent to-transparent dark:from-white/3 pointer-events-none" />

                {/* Left status bar */}
                <div className={cn("absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full", cfg.bar)} />

                <div className="relative pl-5 pr-4 py-4 space-y-3.5">
                    {/* Top row: title + status + total */}
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h4 className="font-serif text-[14px] font-semibold text-brand-deep dark:text-brand-cream leading-snug">
                                    {template.name}
                                </h4>
                                {/* Status pill */}
                                <span className={cn(
                                    "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wide",
                                    cfg.pill
                                )}>
                                    <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                                    {cfg.label}
                                </span>
                            </div>

                            {/* Meta row */}
                            <div className="flex items-center gap-3 flex-wrap">
                                {template.academicTerm && (
                                    <span className="inline-flex items-center gap-1 text-[11px] text-brand-accent/50 dark:text-brand-cream/40">
                                        <CalendarDays className="w-3 h-3" />
                                        {template.academicTerm.name}
                                    </span>
                                )}
                                {template.scope === "DEPARTMENT" && template.department && (
                                    <span className="inline-flex items-center gap-1 text-[11px] text-brand-accent/50 dark:text-brand-cream/40">
                                        <Users className="w-3 h-3" />
                                        {template.department.name}
                                    </span>
                                )}
                                {template.scope === "ALL" && (
                                    <span className="inline-flex items-center gap-1 text-[11px] text-brand-accent/40 dark:text-brand-cream/35">
                                        <Layers className="w-3 h-3" />
                                        All students
                                    </span>
                                )}
                                {template.dueAt && (
                                    <span className="text-[11px] text-brand-accent/40 dark:text-brand-cream/35">
                                        Due {new Date(template.dueAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Total amount */}
                        <div className="shrink-0 text-right">
                            <p className="font-serif text-[17px] font-semibold text-brand-deep dark:text-brand-cream tabular-nums">
                                <CurrencyText value={formatCurrency(total, { currency })} />
                            </p>
                            <p className="text-[10px] text-brand-accent/40 dark:text-brand-cream/35 mt-0.5">
                                {mandatory.length} item{mandatory.length !== 1 ? "s" : ""}
                            </p>
                        </div>
                    </div>

                    {/* Fee items preview */}
                    {previewItems.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {previewItems.map((item) => (
                                <span
                                    key={item.id}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-brand-deep/4 dark:bg-white/5 border border-brand-deep/6 dark:border-white/6 text-[10px] text-brand-accent/60 dark:text-brand-cream/50"
                                >
                                    <CircleDot className="w-2.5 h-2.5 text-brand-gold/50" />
                                    {item.name}
                                </span>
                            ))}
                            {overflow > 0 && (
                                <span className="text-[10px] text-brand-accent/40 dark:text-brand-cream/35 font-medium">
                                    +{overflow} more
                                </span>
                            )}
                        </div>
                    )}

                    {/* Progress (ACTIVE / ARCHIVED) */}
                    {template.status !== "DRAFT" && (
                        <TemplateProgressBar templateId={template.id} />
                    )}

                    {/* Actions row */}
                    <div className="flex items-center gap-2 pt-0.5 border-t border-brand-deep/5 dark:border-white/5">
                        {template.status !== "ARCHIVED" && (
                            <Button
                                size="sm"
                                className="h-7 text-[11px] rounded-full px-3 font-semibold"
                                onClick={onApply}
                                disabled={isApplying}
                            >
                                {isApplying ? (
                                    <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                                ) : (
                                    <Play className="w-3 h-3 mr-1.5" />
                                )}
                                {template.status === "DRAFT" ? "Apply to students" : "Re-apply"}
                            </Button>
                        )}

                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[11px] rounded-full px-2.5 text-brand-accent/50 dark:text-brand-cream/40 hover:text-brand-deep dark:hover:text-brand-cream"
                            onClick={onEdit}
                        >
                            <Pencil className="w-3 h-3 mr-1" />
                            Edit
                        </Button>

                        {template.status === "ACTIVE" && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-[11px] rounded-full px-2.5 text-brand-accent/40 dark:text-brand-cream/35"
                                onClick={onArchive}
                            >
                                <Archive className="w-3 h-3 mr-1" />
                                Archive
                            </Button>
                        )}

                        {template.status === "DRAFT" && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-[11px] rounded-full px-2.5 text-red-400/60 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 ml-auto"
                                onClick={onDelete}
                            >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Delete
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

// ─── Skeleton ───────────────────────────────────────────────────────────────────

function TemplateSkeleton({ index }: { index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.06 }}
            className="animate-pulse rounded-[20px] border border-brand-green/6 dark:border-white/5 bg-brand-cream/40 dark:bg-white/2 p-4 space-y-3"
        >
            <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                    <div className="h-4 w-48 rounded-full bg-brand-deep/8 dark:bg-white/8" />
                    <div className="h-3 w-32 rounded-full bg-brand-deep/5 dark:bg-white/5" />
                </div>
                <div className="h-5 w-20 rounded-full bg-brand-deep/5 dark:bg-white/5" />
            </div>
            <div className="flex gap-1.5">
                <div className="h-5 w-16 rounded-lg bg-brand-deep/4 dark:bg-white/4" />
                <div className="h-5 w-20 rounded-lg bg-brand-deep/4 dark:bg-white/4" />
            </div>
        </motion.div>
    )
}

// ─── Empty State ────────────────────────────────────────────────────────────────

function TemplatesEmptyState({
    filter,
    onAdd,
}: {
    filter: StatusFilter
    onAdd: () => void
}) {
    const copy: Record<StatusFilter, { heading: string; body: string; cta?: string }> = {
        ALL: {
            heading: "No fee templates yet",
            body: "Build a template with line items and apply it to all students or a specific department in one go.",
            cta: "Create first template",
        },
        DRAFT: { heading: "No drafts", body: "Create a template to start here." },
        ACTIVE: { heading: "No active templates", body: "Apply a draft template to see it here." },
        ARCHIVED: { heading: "No archived templates", body: "Archived templates will appear here." },
    }
    const { heading, body, cta } = copy[filter]

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="py-10 flex flex-col items-center text-center space-y-4"
        >
            <div className="relative">
                <div className="w-14 h-14 rounded-3xl bg-brand-gold/8 dark:bg-brand-gold/10 border border-brand-gold/15 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-brand-gold/60" />
                </div>
                {cta && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-xl bg-brand-cream dark:bg-brand-deep border border-brand-gold/20 flex items-center justify-center">
                        <Plus className="w-2.5 h-2.5 text-brand-gold" />
                    </div>
                )}
            </div>
            <div className="space-y-1.5 max-w-xs">
                <h4 className="font-serif text-[14px] font-semibold text-brand-deep dark:text-brand-cream">
                    {heading}
                </h4>
                <p className="text-[12.5px] text-brand-accent/50 dark:text-brand-cream/40 leading-relaxed">
                    {body}
                </p>
            </div>
            {cta && (
                <Button size="sm" variant="secondary" className="rounded-full" onClick={onAdd}>
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    {cta}
                </Button>
            )}
        </motion.div>
    )
}

// ─── Item Row (builder) ─────────────────────────────────────────────────────────

function ItemRow({
    item,
    index,
    currencySymbol,
    onUpdate,
    onRemove,
    canRemove,
}: {
    item: FeeTemplateItemInput & { _key: string }
    index: number
    currencySymbol: string
    onUpdate: (u: Partial<FeeTemplateItemInput>) => void
    onRemove: () => void
    canRemove: boolean
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-2 group/row"
        >
            {/* Row number */}
            <span className="shrink-0 w-5 text-[11px] text-brand-accent/30 dark:text-brand-cream/25 tabular-nums text-right select-none">
                {index + 1}.
            </span>

            <Input
                className="flex-1 h-12 text-sm"
                placeholder={`e.g. Tuition fee, Transport levy…`}
                value={item.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
            />

            <div className="w-32 shrink-0">
                <MoneyInput
                    value={item.amount}
                    onChange={(v) => onUpdate({ amount: v })}
                    currencySymbol={currencySymbol}
                    placeholder="0"
                    className="h-12 text-sm"
                    size="sm"
                />
            </div>

            <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                    "h-8 w-8 shrink-0 rounded-xl text-red-400/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-opacity",
                    canRemove ? "opacity-0 group-hover/row:opacity-100" : "invisible"
                )}
                onClick={onRemove}
                disabled={!canRemove}
            >
                <Trash2 className="w-3.5 h-3.5" />
            </Button>
        </motion.div>
    )
}

// ─── Apply Confirm ──────────────────────────────────────────────────────────────

function ApplyConfirmDialog({
    template,
    open,
    onOpenChange,
    onConfirm,
    isLoading,
}: {
    template: FeeTemplate | null
    open: boolean
    onOpenChange: (v: boolean) => void
    onConfirm: () => void
    isLoading: boolean
}) {
    if (!template) return null
    const mandatory = template.items.filter((i) => !i.isOptional)

    return (
        <ConfirmDialog
            open={open}
            onOpenChange={onOpenChange}
            title={`Apply "${template.name}"?`}
            description={
                template.scope === "DEPARTMENT" && template.department
                    ? `This will create ${mandatory.length} outstanding fee line${mandatory.length !== 1 ? "s" : ""} for every student in "${template.department.name}" not yet billed under this template. Students already billed will be skipped.`
                    : `This will create outstanding fee records for every student in your roster not yet billed under this template. Students already billed will be skipped.`
            }
            confirmText={template.status === "DRAFT" ? "Apply to Students" : "Re-apply"}
            variant="primary"
            isLoading={isLoading}
            onConfirm={onConfirm}
        />
    )
}

// ─── Filter Tabs ────────────────────────────────────────────────────────────────

function FilterTabs({
    active,
    counts,
    onChange,
}: {
    active: StatusFilter
    counts: Record<StatusFilter, number>
    onChange: (f: StatusFilter) => void
}) {
    const tabs: { key: StatusFilter; label: string }[] = [
        { key: "ALL", label: "All" },
        { key: "DRAFT", label: "Draft" },
        { key: "ACTIVE", label: "Active" },
        { key: "ARCHIVED", label: "Archived" },
    ]

    return (
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-brand-deep/4 dark:bg-white/4">
            {tabs.map(({ key, label }) => (
                <button
                    key={key}
                    type="button"
                    onClick={() => onChange(key)}
                    className={cn(
                        "flex-1 flex cursor-pointer items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all duration-200",
                        active === key
                            ? "bg-white dark:bg-white/10 text-brand-deep dark:text-brand-cream shadow-sm"
                            : "text-brand-accent/50 dark:text-brand-cream/40 hover:text-brand-deep/70 dark:hover:text-brand-cream/70"
                    )}
                >
                    {label}
                    {counts[key] > 0 && (
                        <span className={cn(
                            "tabular-nums text-[9px] px-1 rounded-full",
                            active === key
                                ? "bg-brand-deep/8 dark:bg-white/10 text-brand-accent/60 dark:text-brand-cream/50"
                                : "bg-brand-deep/5 dark:bg-white/5"
                        )}>
                            {counts[key]}
                        </span>
                    )}
                </button>
            ))}
        </div>
    )
}

// ─── Main Section ───────────────────────────────────────────────────────────────

export function FeeTemplatesSection() {
    const { activeBusiness, currency: currencySymbol } = useBusiness()
    const currencyCode = activeBusiness?.currency ?? "NGN"

    const {
        templates,
        isLoading,
        createTemplate,
        updateTemplate,
        deleteTemplate,
        applyTemplate,
        archiveTemplate,
        isCreating,
        isUpdating,
        isApplying,
        applyingId,
    } = useFeeTemplates()

    const { departments } = useDepartments()
    const calendarQuery = useAcademicCalendar()
    const calendarData = calendarQuery.data as { sessions: any[] } | undefined

    const allTerms = useMemo(
        () => calendarData?.sessions?.flatMap((s) => s.terms ?? []) ?? [],
        [calendarData]
    )

    // Filter / search state
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
    const [search, setSearch] = useState("")
    const showSearch = templates.length > 5

    const counts = useMemo<Record<StatusFilter, number>>(() => ({
        ALL: templates.length,
        DRAFT: templates.filter((t) => t.status === "DRAFT").length,
        ACTIVE: templates.filter((t) => t.status === "ACTIVE").length,
        ARCHIVED: templates.filter((t) => t.status === "ARCHIVED").length,
    }), [templates])

    const filtered = useMemo(() => {
        let list = statusFilter === "ALL" ? templates : templates.filter((t) => t.status === statusFilter)
        if (search.trim()) {
            const q = search.toLowerCase()
            list = list.filter(
                (t) =>
                    t.name.toLowerCase().includes(q) ||
                    t.department?.name.toLowerCase().includes(q) ||
                    t.academicTerm?.name.toLowerCase().includes(q)
            )
        }
        return list
    }, [templates, statusFilter, search])

    // Drawer
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [editing, setEditing] = useState<FeeTemplate | null>(null)

    // Confirms
    const [applyTarget, setApplyTarget] = useState<FeeTemplate | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<FeeTemplate | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Form
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [academicTermId, setAcademicTermId] = useState("")
    const [scope, setScope] = useState<"ALL" | "DEPARTMENT">("ALL")
    const [departmentId, setDepartmentId] = useState("")
    const [dueAt, setDueAt] = useState("")
    const [items, setItems] = useState<Array<FeeTemplateItemInput & { _key: string }>>([
        { _key: crypto.randomUUID(), name: "", amount: 0, isOptional: false, sortOrder: 0 },
    ])

    const isSaving = isCreating || isUpdating

    const totalAmount = useMemo(
        () => items.filter((i) => i.name.trim() && i.amount > 0 && !i.isOptional).reduce((s, i) => s + Number(i.amount), 0),
        [items]
    )

    function openCreate() {
        setEditing(null)
        setName(""); setDescription(""); setAcademicTermId(""); setScope("ALL")
        setDepartmentId(""); setDueAt("")
        setItems([{ _key: crypto.randomUUID(), name: "", amount: 0, isOptional: false, sortOrder: 0 }])
        setIsDrawerOpen(true)
    }

    function openEdit(t: FeeTemplate) {
        setEditing(t)
        setName(t.name)
        setDescription(t.description ?? "")
        setAcademicTermId(t.academicTermId ?? "")
        setScope(t.scope)
        setDepartmentId(t.departmentId ?? "")
        setDueAt(t.dueAt ? t.dueAt.slice(0, 10) : "")
        setItems(
            t.items.length > 0
                ? t.items.map((i) => ({ _key: i.id, name: i.name, amount: Number(i.amount), isOptional: i.isOptional, sortOrder: i.sortOrder }))
                : [{ _key: crypto.randomUUID(), name: "", amount: 0, isOptional: false, sortOrder: 0 }]
        )
        setIsDrawerOpen(true)
    }

    function addItem() {
        setItems((p) => [...p, { _key: crypto.randomUUID(), name: "", amount: 0, isOptional: false, sortOrder: p.length }])
    }

    function updateItem(key: string, updates: Partial<FeeTemplateItemInput>) {
        setItems((p) => p.map((i) => i._key === key ? { ...i, ...updates } : i))
    }

    function removeItem(key: string) {
        setItems((p) => p.filter((i) => i._key !== key))
    }

    async function handleSave() {
        if (!name.trim()) return
        const validItems = items.filter((i) => i.name.trim() && i.amount > 0)
        if (validItems.length === 0) {
            toast.error("Add at least one fee item with a name and amount.")
            return
        }
        if (scope === "DEPARTMENT" && !departmentId) {
            toast.error("Select a department for this template.")
            return
        }
        const payload: StoreFeeTemplateInput = {
            name,
            description: description || undefined,
            academicTermId: academicTermId || null,
            scope,
            departmentId: scope === "DEPARTMENT" && departmentId ? departmentId : null,
            dueAt: dueAt || null,
            items: validItems.map((i, idx) => ({
                name: i.name.trim(), amount: i.amount, isOptional: i.isOptional ?? false, sortOrder: idx,
            })),
        }
        try {
            editing ? await updateTemplate(editing.id, payload) : await createTemplate(payload)
            setIsDrawerOpen(false)
        } catch { /* handled */ }
    }

    async function handleApply() {
        if (!applyTarget) return
        try {
            const result = await applyTemplate(applyTarget.id)
            setApplyTarget(null)
            toast.success(`Applied to ${result.applied} student${result.applied !== 1 ? "s" : ""}${result.skipped > 0 ? ` · ${result.skipped} already billed` : ""}`)
        } catch { setApplyTarget(null) }
    }

    async function handleDelete() {
        if (!deleteTarget) return
        setIsDeleting(true)
        try { await deleteTemplate(deleteTarget.id); setDeleteTarget(null) }
        catch { /* handled */ }
        finally { setIsDeleting(false) }
    }

    const isEditingActive = editing?.status === "ACTIVE"
    const selectedDueDate = dueAt ? new Date(`${dueAt}T00:00:00`) : undefined

    return (
        <>
            <GlassCard className="overflow-hidden border-brand-gold/12 bg-linear-to-br from-white/70 to-brand-gold/[0.02] dark:from-white/[0.06] dark:to-brand-gold/[0.02] p-0">
                {/* ── Header ── */}
                <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-brand-deep/5 dark:border-white/6">
                    <div className="flex items-start gap-3.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-gold/12 mt-0.5">
                            <FileText className="h-4 w-4 text-brand-gold" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <p className="font-serif text-[15px] font-semibold text-brand-deep dark:text-brand-cream">
                                    Fee Templates
                                </p>
                                {templates.length > 0 && (
                                    <span className="px-2 py-0.5 rounded-full bg-brand-deep/6 dark:bg-white/8 text-[10px] font-bold text-brand-accent/60 dark:text-brand-cream/50 tabular-nums tracking-wide">
                                        {templates.length}
                                    </span>
                                )}
                            </div>
                            <p className="mt-0.5 text-[12.5px] text-brand-deep/55 dark:text-brand-cream/50 max-w-sm">
                                Build reusable fee structures and apply them to students in bulk each term.
                            </p>
                        </div>
                    </div>
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="rounded-full shrink-0"
                        onClick={openCreate}
                    >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        New template
                    </Button>
                </div>

                {/* ── Filters + Search ── */}
                {templates.length > 0 && (
                    <div className="px-6 pt-4 space-y-3">
                        <FilterTabs active={statusFilter} counts={counts} onChange={setStatusFilter} />
                        <AnimatePresence>
                            {showSearch && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-deep/30 dark:text-brand-cream/30 pointer-events-none" />
                                        <Input
                                            className="pl-9 h-9 text-sm rounded-xl bg-brand-deep/3 dark:bg-white/3 border-brand-deep/8 dark:border-white/8"
                                            placeholder="Search templates…"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* ── Content ── */}
                <div className="px-6 py-4 space-y-3">
                    {isLoading ? (
                        [0, 1, 2].map((i) => <TemplateSkeleton key={i} index={i} />)
                    ) : filtered.length === 0 ? (
                        search.trim() ? (
                            <div className="py-8 text-center">
                                <p className="text-sm text-brand-accent/45 dark:text-brand-cream/40">
                                    No templates match <span className="font-medium text-brand-accent/70 dark:text-brand-cream/60">&ldquo;{search}&rdquo;</span>
                                </p>
                            </div>
                        ) : (
                            <TemplatesEmptyState filter={statusFilter} onAdd={openCreate} />
                        )
                    ) : (
                        <AnimatePresence initial={false}>
                            {filtered.map((t, i) => (
                                <TemplateCard
                                    key={t.id}
                                    template={t}
                                    currency={currencyCode}
                                    index={i}
                                    onEdit={() => openEdit(t)}
                                    onApply={() => setApplyTarget(t)}
                                    onArchive={() => archiveTemplate(t.id)}
                                    onDelete={() => setDeleteTarget(t)}
                                    isApplying={isApplying && applyingId === t.id}
                                />
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </GlassCard>

            {/* ── Builder Drawer ── */}
            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <DrawerContent>
                    <DrawerStickyHeader>
                        <DrawerTitle>{editing ? "Edit Template" : "New Fee Template"}</DrawerTitle>
                        <DrawerDescription>
                            {isEditingActive
                                ? "Changes won't affect fee records already created for students."
                                : editing
                                    ? "Update the template structure before applying."
                                    : "Define fee items and target group. Apply when ready to bill."}
                        </DrawerDescription>
                    </DrawerStickyHeader>

                    <div className="flex-1 overflow-y-auto">
                        {/* Section 1: Details */}
                        <div className="px-8 pt-8 pb-6 space-y-4 border-b border-brand-deep/5 dark:border-white/5">
                            <h3 className="text-[10px] font-sans! font-bold uppercase tracking-[0.15em] text-brand-accent/35 dark:text-brand-cream/60">
                                Template Details
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-sm">Name <span className="text-brand-gold font-normal">*</span></Label>
                                    <Input
                                        placeholder="e.g. SS1 Term 1 Fees 2024/2025"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm">
                                        Description{" "}
                                        <span className="text-brand-accent/35 dark:text-brand-cream/30 font-normal">
                                            (optional)
                                        </span>
                                    </Label>
                                    <Input
                                        placeholder="Notes about this template…"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Target & Period */}
                        <div className="px-8 py-6 space-y-4 border-b border-brand-deep/5 dark:border-white/5">
                            <h3 className="text-[10px] font-sans! font-bold uppercase tracking-[0.15em] text-brand-accent/35 dark:text-brand-cream/60">
                                Target & Period
                            </h3>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label className="text-sm">
                                        Academic Term{" "}
                                        <span className="text-brand-accent/35 dark:text-brand-cream/30 font-normal">(optional)</span>
                                    </Label>
                                    <Select
                                        value={academicTermId || "__none__"}
                                        onValueChange={(value) => setAcademicTermId(value === "__none__" ? "" : value)}
                                    >
                                        <SelectTrigger className="h-12 rounded-xl">
                                            <SelectValue placeholder="No term" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__none__">No term</SelectItem>
                                            {allTerms.map((t: any) => (
                                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm">
                                        Due Date{" "}
                                        <span className="text-brand-accent/35 dark:text-brand-cream/30 font-normal">(optional)</span>
                                    </Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className={cn(
                                                    "h-12 w-full rounded-xl justify-start text-left px-3 font-normal",
                                                    !dueAt && "text-brand-accent/35 dark:text-brand-cream/35"
                                                )}
                                            >
                                                <span className="truncate">
                                                    {selectedDueDate ? format(selectedDueDate, "dd/MM/yyyy") : "dd/mm/yyyy"}
                                                </span>
                                                <CalendarDays className="ml-auto h-4 w-4 opacity-70" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={selectedDueDate}
                                                onSelect={(date) => setDueAt(date ? format(date, "yyyy-MM-dd") : "")}
                                                autoFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>

                            {/* Scope picker */}
                            <div className="space-y-2">
                                <Label className="text-sm">Apply To</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(["ALL", "DEPARTMENT"] as const).map((s) => (
                                        <Button
                                            key={s}
                                            type="button"
                                            variant="ghost"
                                            onClick={() => setScope(s)}
                                            className={cn(
                                                "relative h-auto py-3 px-4 rounded-2xl border text-left transition-all duration-200 group",
                                                "flex flex-col items-start justify-start whitespace-normal",
                                                scope === s
                                                    ? "border-brand-gold/40 bg-brand-gold/6 dark:bg-brand-gold/8"
                                                    : "border-brand-deep/8 dark:border-white/8 hover:border-brand-gold/25 hover:bg-brand-gold/3"
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "w-3.5 h-3.5 rounded-full border-2 mb-2 transition-colors",
                                                    scope === s
                                                        ? "border-brand-gold bg-brand-gold"
                                                        : "border-brand-deep/25 dark:border-white/25"
                                                )} />
                                                <div>
                                                    <p className={cn(
                                                        "text-[12px] font-semibold leading-tight",
                                                        scope === s ? "text-brand-gold" : "text-brand-deep/70 dark:text-brand-cream/60"
                                                    )}>
                                                        {s === "ALL" ? "All Students" : "Department / Faculty"}
                                                    </p>
                                                    <p className="text-[10px] text-brand-accent/40 dark:text-brand-cream/35 mt-0.5">
                                                        {s === "ALL" ? "Every student in your roster" : "Members of a specific group"}
                                                    </p>
                                                </div>
                                            </div>
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <AnimatePresence>
                                {scope === "DEPARTMENT" && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-2"
                                    >
                                        <Label className="text-sm">Department <span className="text-brand-gold font-normal">*</span></Label>
                                        {departments.length === 0 ? (
                                            <p className="text-[12px] text-amber-600 dark:text-amber-400/70 px-1">
                                                No departments yet. Create one in the Staff section first.
                                            </p>
                                        ) : (
                                            <Select
                                                value={departmentId || "__none__"}
                                                onValueChange={(value) => setDepartmentId(value === "__none__" ? "" : value)}
                                            >
                                                <SelectTrigger className="h-12 rounded-xl">
                                                    <SelectValue placeholder="Select department" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="__none__">Select department</SelectItem>
                                                    {departments.map((d) => (
                                                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Section 3: Fee Items */}
                        <div className="px-8 py-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-sans! font-bold uppercase tracking-[0.15em] text-brand-accent/35 dark:text-brand-cream/60">
                                    Fee Line Items
                                </h3>
                                {totalAmount > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center gap-1.5"
                                    >
                                        <span className="text-[10px] text-brand-accent/40 dark:text-brand-cream/35">Total</span>
                                        <span className="font-serif text-[15px] font-semibold text-brand-deep dark:text-brand-cream tabular-nums">
                                            <CurrencyText
                                                value={formatCurrency(totalAmount, { currency: currencyCode })}
                                            />
                                        </span>
                                    </motion.div>
                                )}
                            </div>

                            <AnimatePresence initial={false}>
                                <div className="space-y-2">
                                    {items.map((item, idx) => (
                                        <ItemRow
                                            key={item._key}
                                            item={item}
                                            index={idx}
                                            currencySymbol={currencySymbol}
                                            onUpdate={(u) => updateItem(item._key, u)}
                                            onRemove={() => removeItem(item._key)}
                                            canRemove={items.length > 1}
                                        />
                                    ))}
                                </div>
                            </AnimatePresence>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="rounded-full bg-white dark:bg-brand-deep border-dashed mt-2 text-brand-accent/50 dark:text-brand-cream/80 hover:text-brand-deep dark:hover:text-brand-cream"
                                onClick={addItem}
                            >
                                <Plus className="w-3.5 h-3.5 mr-1.5" />
                                Add fee item
                            </Button>
                        </div>
                    </div>

                    <DrawerFooter>
                        <Button
                            onClick={handleSave}
                            disabled={!name.trim() || isSaving}
                            className="h-13 rounded-2xl"
                        >
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {editing ? "Save Changes" : "Create Template"}
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>

            {/* ── Apply Confirm ── */}
            <ApplyConfirmDialog
                template={applyTarget}
                open={!!applyTarget}
                onOpenChange={(v) => { if (!v) setApplyTarget(null) }}
                onConfirm={handleApply}
                isLoading={isApplying}
            />

            {/* ── Delete Confirm ── */}
            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}
                title={`Delete "${deleteTarget?.name}"?`}
                description="This draft template will be permanently removed. Any students already billed under it are unaffected."
                confirmText="Delete Template"
                variant="destructive"
                isLoading={isDeleting}
                onConfirm={handleDelete}
            />
        </>
    )
}
