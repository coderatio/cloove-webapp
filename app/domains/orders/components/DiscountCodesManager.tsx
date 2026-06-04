"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import { HugeiconsIcon } from "@hugeicons/react"
import { BadgePercentIcon as BadgePercent, CalendarClockIcon as CalendarClock, HistoryIcon as History, Loading03Icon as Loader2, PencilEdit01Icon as PencilLine, PlusSignIcon as Plus, Delete02Icon as Trash2 } from "@hugeicons/core-free-icons"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Switch } from "@/app/components/ui/switch"
import { Badge } from "@/app/components/ui/badge"
import { GlassCard } from "@/app/components/ui/glass-card"
import { DateTimePickerField } from "@/app/components/shared/DateTimePickerField"
import { ConfirmDialog } from "@/app/components/shared/ConfirmDialog"
import {
    SideSheet,
    SideSheetBody,
    SideSheetContent,
    SideSheetFooter,
    SideSheetStickyHeader,
    SideSheetTitle,
    SideSheetDescription,
} from "@/app/components/ui/side-sheet"
import {
    DiscountCode,
    DiscountCodeInput,
    DiscountCodeType,
    useCreateDiscountCode,
    useDeleteDiscountCode,
    useDiscountCodes,
    useDiscountCodeUsages,
    useUpdateDiscountCode,
} from "../hooks/useDiscountCodes"

type DiscountCodeDraft = {
    code: string
    name: string
    type: DiscountCodeType
    value: string
    isActive: boolean
    firstOrderOnly: boolean
    usageLimit: string
    minimumSubtotal: string
    maximumDiscountAmount: string
    startsAt: string
    endsAt: string
}

const EMPTY_DRAFT: DiscountCodeDraft = {
    code: "",
    name: "",
    type: "PERCENTAGE",
    value: "",
    isActive: true,
    firstOrderOnly: false,
    usageLimit: "",
    minimumSubtotal: "",
    maximumDiscountAmount: "",
    startsAt: "",
    endsAt: "",
}

function toDateTimeLocal(value: string | null | undefined) {
    if (!value) return ""
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ""
    const pad = (v: number) => String(v).padStart(2, "0")
    const year = date.getFullYear()
    const month = pad(date.getMonth() + 1)
    const day = pad(date.getDate())
    const hours = pad(date.getHours())
    const minutes = pad(date.getMinutes())
    return `${year}-${month}-${day}T${hours}:${minutes}`
}

function newDiscountCodeDraft(): DiscountCodeDraft {
    return {
        ...EMPTY_DRAFT,
        startsAt: toDateTimeLocal(new Date().toISOString()),
    }
}

function toApiDate(value: string) {
    if (!value) return null
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function formatMoney(value: number | null | undefined) {
    if (value === null || value === undefined) return "—"
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(Number(value))
}

function draftFromCode(code?: DiscountCode | null): DiscountCodeDraft {
    if (!code) return EMPTY_DRAFT
    return {
        code: code.code ?? "",
        name: code.name ?? "",
        type: code.type ?? "PERCENTAGE",
        value: String(code.value ?? ""),
        isActive: code.isActive ?? true,
        firstOrderOnly: code.firstOrderOnly ?? false,
        usageLimit: code.usageLimit !== null && code.usageLimit !== undefined ? String(code.usageLimit) : "",
        minimumSubtotal:
            code.minimumSubtotal !== null && code.minimumSubtotal !== undefined
                ? String(code.minimumSubtotal)
                : "",
        maximumDiscountAmount:
            code.maximumDiscountAmount !== null && code.maximumDiscountAmount !== undefined
                ? String(code.maximumDiscountAmount)
                : "",
        startsAt: toDateTimeLocal(code.startsAt),
        endsAt: toDateTimeLocal(code.endsAt),
    }
}

function toPayload(draft: DiscountCodeDraft): DiscountCodeInput {
    const startsAt = draft.startsAt || toDateTimeLocal(new Date().toISOString())

    return {
        code: draft.code.trim(),
        name: draft.name.trim() || null,
        type: draft.type,
        value: Number(draft.value || 0),
        isActive: draft.isActive,
        firstOrderOnly: draft.firstOrderOnly,
        usageLimit: draft.usageLimit.trim() ? Number(draft.usageLimit) : null,
        minimumSubtotal: draft.minimumSubtotal.trim() ? Number(draft.minimumSubtotal) : null,
        maximumDiscountAmount: draft.maximumDiscountAmount.trim() ? Number(draft.maximumDiscountAmount) : null,
        startsAt: toApiDate(startsAt),
        endsAt: toApiDate(draft.endsAt),
    }
}

function describeRule(code: DiscountCode) {
    const parts: string[] = []
    if (code.firstOrderOnly) parts.push("First order only")
    if (code.minimumSubtotal !== null) parts.push(`Min ${formatMoney(code.minimumSubtotal)}`)
    if (code.usageLimit !== null) parts.push(`Limit ${code.usageCount}/${code.usageLimit}`)
    if (code.maximumDiscountAmount !== null) parts.push(`Cap ${formatMoney(code.maximumDiscountAmount)}`)
    return parts.length ? parts.join(" • ") : "No extra rules"
}

interface DiscountCodesManagerProps {
    canManage?: boolean
}

export function DiscountCodesManager({ canManage = true }: DiscountCodesManagerProps) {
    const { data: discountCodes = [], isLoading } = useDiscountCodes()
    const createCode = useCreateDiscountCode()
    const updateCode = useUpdateDiscountCode()
    const deleteCode = useDeleteDiscountCode()

    const [draft, setDraft] = useState<DiscountCodeDraft>(EMPTY_DRAFT)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [sheetMode, setSheetMode] = useState<"create" | "edit">("create")
    const [deleteTarget, setDeleteTarget] = useState<DiscountCode | null>(null)
    const [sheetOpen, setSheetOpen] = useState(false)
    const [usageTarget, setUsageTarget] = useState<DiscountCode | null>(null)
    const { data: usages = [], isLoading: usagesLoading } = useDiscountCodeUsages(usageTarget?.id ?? null)

    const selectedCode = useMemo(
        () => discountCodes.find((code) => code.id === editingId) ?? null,
        [discountCodes, editingId]
    )

    const startCreate = () => {
        if (!canManage) return
        setSheetMode("create")
        setEditingId(null)
        setDraft(newDiscountCodeDraft())
        setSheetOpen(true)
    }

    const startEdit = (code: DiscountCode) => {
        if (!canManage) return
        setSheetMode("edit")
        setEditingId(code.id)
        setDraft(draftFromCode(code))
        setSheetOpen(true)
    }

    const closeSheet = () => {
        setSheetOpen(false)
        setSheetMode("create")
        setEditingId(null)
        setDraft(EMPTY_DRAFT)
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!canManage) return
        const payload = toPayload(draft)
        if (!payload.code) return
        if (!Number.isFinite(payload.value) || payload.value <= 0) return

        if (sheetMode === "edit") {
            if (!editingId) return
            await updateCode.mutateAsync({ id: editingId, payload })
        } else {
            await createCode.mutateAsync(payload)
        }

        closeSheet()
    }

    const handleDelete = async () => {
        if (!deleteTarget || !canManage) return
        await deleteCode.mutateAsync(deleteTarget.id)
        setDeleteTarget(null)
        if (editingId === deleteTarget.id) {
            startCreate()
        }
    }

    const busy = createCode.isPending || updateCode.isPending || deleteCode.isPending

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                    <h3 className="flex items-center gap-2 text-lg font-medium text-brand-deep dark:text-brand-cream">
                        <HugeiconsIcon icon={BadgePercent} className="h-5 w-5 text-brand-gold" />
                        Code builder
                    </h3>
                    <p className="mt-1 text-sm text-brand-accent/60 dark:text-white/40">
                        Business-wide discount codes used by WhatsApp checkout and other order flows.
                    </p>
                </div>
                <Button type="button" variant="outline" disabled={!canManage} onClick={startCreate} className="rounded-full">
                    <HugeiconsIcon icon={Plus} className="mr-2 h-4 w-4" />
                    New code
                </Button>
            </div>

            <SideSheet open={sheetOpen} onOpenChange={(open) => (open ? setSheetOpen(true) : closeSheet())}>
                <SideSheetContent className="max-w-2xl">
                    <SideSheetStickyHeader>
                        <SideSheetTitle>
                            {sheetMode === "edit" ? "Edit discount code" : "New discount code"}
                        </SideSheetTitle>
                        <SideSheetDescription>
                            Set the discount value, eligibility rules, and active dates customers can use at checkout.
                        </SideSheetDescription>
                    </SideSheetStickyHeader>

                    <SideSheetBody>
                        <form id="discount-code-form" className="space-y-6" onSubmit={handleSubmit}>
                            <div className="rounded-2xl border border-brand-deep/10 bg-white/55 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-brand-deep/75 dark:text-brand-cream/75">
                                            Code
                                        </label>
                                        <Input
                                            value={draft.code}
                                            disabled={!canManage}
                                            onChange={(event) => setDraft((prev) => ({ ...prev, code: event.target.value }))}
                                            placeholder="NEW10"
                                            className="h-11 rounded-xl bg-white/60 dark:bg-white/5"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-brand-deep/75 dark:text-brand-cream/75">
                                            Name
                                        </label>
                                        <Input
                                            value={draft.name}
                                            disabled={!canManage}
                                            onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
                                            placeholder="Welcome offer"
                                            className="h-11 rounded-xl bg-white/60 dark:bg-white/5"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-brand-deep/10 bg-white/55 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-brand-deep/75 dark:text-brand-cream/75">
                                            Type
                                        </label>
                                        <Select
                                            value={draft.type}
                                            disabled={!canManage}
                                            onValueChange={(value) => setDraft((prev) => ({ ...prev, type: value as DiscountCodeType }))}
                                        >
                                            <SelectTrigger className="h-11 rounded-xl bg-white/60 dark:bg-white/5">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                                                <SelectItem value="FIXED">Fixed amount</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-brand-deep/75 dark:text-brand-cream/75">
                                            Value
                                        </label>
                                        <Input
                                            type="number"
                                            min={0}
                                            step={draft.type === "PERCENTAGE" ? "0.01" : "1"}
                                            value={draft.value}
                                            disabled={!canManage}
                                            onChange={(event) => setDraft((prev) => ({ ...prev, value: event.target.value }))}
                                            placeholder={draft.type === "PERCENTAGE" ? "10" : "500"}
                                            className="h-11 rounded-xl bg-white/60 dark:bg-white/5"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-brand-deep/75 dark:text-brand-cream/75">
                                            Usage limit
                                        </label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={draft.usageLimit}
                                            disabled={!canManage}
                                            onChange={(event) => setDraft((prev) => ({ ...prev, usageLimit: event.target.value }))}
                                            placeholder="Optional"
                                            className="h-11 rounded-xl bg-white/60 dark:bg-white/5"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-brand-deep/10 bg-white/55 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-brand-deep/75 dark:text-brand-cream/75">
                                            Minimum subtotal
                                        </label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={draft.minimumSubtotal}
                                            disabled={!canManage}
                                            onChange={(event) => setDraft((prev) => ({ ...prev, minimumSubtotal: event.target.value }))}
                                            placeholder="Optional"
                                            className="h-11 rounded-xl bg-white/60 dark:bg-white/5"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-brand-deep/75 dark:text-brand-cream/75">
                                            Max discount
                                        </label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={draft.maximumDiscountAmount}
                                            disabled={!canManage}
                                            onChange={(event) => setDraft((prev) => ({ ...prev, maximumDiscountAmount: event.target.value }))}
                                            placeholder="Optional"
                                            className="h-11 rounded-xl bg-white/60 dark:bg-white/5"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-brand-deep/10 bg-white/55 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <DateTimePickerField
                                        label="Starts"
                                        value={draft.startsAt}
                                        disabled={!canManage}
                                        placeholder="Starts immediately"
                                        clearLabel="Clear start"
                                        onChange={(value) => setDraft((prev) => ({ ...prev, startsAt: value }))}
                                    />
                                    <DateTimePickerField
                                        label="Ends"
                                        value={draft.endsAt}
                                        disabled={!canManage}
                                        placeholder="No end date"
                                        clearLabel="Clear end"
                                        onChange={(value) => setDraft((prev) => ({ ...prev, endsAt: value }))}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <label className="flex items-start justify-between gap-4 rounded-2xl border border-brand-deep/10 bg-white/40 p-4 dark:border-white/10 dark:bg-white/5">
                                    <div className="space-y-0.5">
                                        <span className="font-medium text-brand-deep dark:text-brand-cream">Active</span>
                                        <p className="text-xs text-brand-accent/60 dark:text-white/40">
                                            Disable without deleting the code.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={draft.isActive}
                                        disabled={!canManage}
                                        onCheckedChange={(checked) => setDraft((prev) => ({ ...prev, isActive: checked }))}
                                    />
                                </label>
                                <label className="flex items-start justify-between gap-4 rounded-2xl border border-brand-deep/10 bg-white/40 p-4 dark:border-white/10 dark:bg-white/5">
                                    <div className="space-y-0.5">
                                        <span className="font-medium text-brand-deep dark:text-brand-cream">First order only</span>
                                        <p className="text-xs text-brand-accent/60 dark:text-white/40">
                                            Restrict to customers who have not bought before.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={draft.firstOrderOnly}
                                        disabled={!canManage}
                                        onCheckedChange={(checked) => setDraft((prev) => ({ ...prev, firstOrderOnly: checked }))}
                                    />
                                </label>
                            </div>
                        </form>
                    </SideSheetBody>

                    <SideSheetFooter className="sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            {selectedCode ? (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full rounded-full text-red-600 hover:text-red-700 sm:w-auto"
                                    disabled={!canManage || busy}
                                    onClick={() => setDeleteTarget(selectedCode)}
                                >
                                    <HugeiconsIcon icon={Trash2} className="mr-2 h-4 w-4" />
                                    Delete
                                </Button>
                            ) : null}
                        </div>
                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <Button type="button" variant="ghost" onClick={closeSheet} className="rounded-full">
                                Cancel
                            </Button>
                            <Button form="discount-code-form" type="submit" disabled={!canManage || busy} className="rounded-full">
                                {busy && <HugeiconsIcon icon={Loader2} className="mr-2 h-4 w-4 animate-spin" />}
                                {sheetMode === "edit" ? "Update code" : "Create code"}
                            </Button>
                        </div>
                    </SideSheetFooter>
                </SideSheetContent>
            </SideSheet>

            <SideSheet open={!!usageTarget} onOpenChange={(open) => !open && setUsageTarget(null)}>
                <SideSheetContent>
                    <SideSheetStickyHeader>
                        <SideSheetTitle>Usage logs</SideSheetTitle>
                        <SideSheetDescription>
                            {usageTarget?.code ? `${usageTarget.code} applications across checkout orders.` : "Discount code applications."}
                        </SideSheetDescription>
                    </SideSheetStickyHeader>
                    <SideSheetBody className="space-y-3">
                        {usagesLoading ? (
                            <div className="flex items-center justify-center py-10">
                                <HugeiconsIcon icon={Loader2} className="h-5 w-5 animate-spin text-brand-gold" />
                            </div>
                        ) : usages.length === 0 ? (
                            <div className="rounded-2xl border border-brand-deep/10 bg-white/50 p-5 text-sm text-brand-accent/60 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/45">
                                No usage has been recorded for this code yet.
                            </div>
                        ) : (
                            usages.map((usage) => (
                                <div
                                    key={usage.id}
                                    className="rounded-2xl border border-brand-deep/10 bg-white/55 p-4 dark:border-white/10 dark:bg-white/[0.04]"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-medium text-brand-deep dark:text-brand-cream">
                                                {usage.customer?.name || usage.customer?.phoneNumber || "Unknown customer"}
                                            </p>
                                            <p className="mt-1 text-xs text-brand-accent/55 dark:text-white/40">
                                                {usage.sale?.shortCode ? `Order ${usage.sale.shortCode}` : usage.saleId ? `Sale ${usage.saleId.slice(0, 8)}` : "No sale reference"}
                                            </p>
                                        </div>
                                        <Badge variant="success">-{formatMoney(usage.discountAmount)}</Badge>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-brand-accent/55 dark:text-white/40">
                                        <span>Subtotal {formatMoney(usage.subtotalAmount)}</span>
                                        <span>{usage.source}</span>
                                        <span>{format(new Date(usage.createdAt), "PPp")}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </SideSheetBody>
                </SideSheetContent>
            </SideSheet>

            {isLoading ? (
                <div className="flex items-center justify-center py-8">
                    <HugeiconsIcon icon={Loader2} className="h-5 w-5 animate-spin text-brand-gold" />
                </div>
            ) : discountCodes.length === 0 ? (
                <GlassCard className="p-6 text-sm text-brand-accent/60 dark:text-white/40">
                    No discount codes yet.
                </GlassCard>
            ) : (
                <div className="grid gap-3">
                    {discountCodes.map((code) => (
                        <GlassCard key={code.id} className="p-4 sm:p-5">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0 space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-lg font-semibold text-brand-deep dark:text-brand-cream">
                                            {code.code}
                                        </p>
                                        <Badge variant={code.isActive ? "default" : "secondary"}>
                                            {code.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                        {code.firstOrderOnly ? <Badge variant="outline">First order</Badge> : null}
                                    </div>
                                    <p className="text-sm text-brand-accent/60 dark:text-white/40">
                                        {code.name || "Untitled discount"}
                                    </p>
                                    <div className="flex flex-wrap gap-2 text-xs text-brand-accent/60 dark:text-white/40">
                                        <span>
                                            {code.type === "PERCENTAGE"
                                                ? `${Number(code.value)}% off`
                                                : `₦${formatMoney(code.value)} off`}
                                        </span>
                                        <span>{describeRule(code)}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-3 text-xs text-brand-accent/50 dark:text-white/40">
                                        <span className="inline-flex items-center gap-1">
                                            <HugeiconsIcon icon={CalendarClock} className="h-3.5 w-3.5" />
                                            {code.startsAt
                                                ? `Starts ${format(new Date(code.startsAt), "PPp")}`
                                                : "Starts immediately"}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <HugeiconsIcon icon={CalendarClock} className="h-3.5 w-3.5" />
                                            {code.endsAt ? `Ends ${format(new Date(code.endsAt), "PPp")}` : "No end date"}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex shrink-0 items-center gap-2">
                                    <Button type="button" variant="ghost" size="sm" onClick={() => setUsageTarget(code)}>
                                        <HugeiconsIcon icon={History} className="mr-2 h-4 w-4" />
                                        Logs
                                    </Button>
                                    <Button type="button" variant="outline" size="sm" disabled={!canManage} onClick={() => startEdit(code)}>
                                        <HugeiconsIcon icon={PencilLine} className="mr-2 h-4 w-4" />
                                        Edit
                                    </Button>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="Delete discount code?"
                description={`Delete ${deleteTarget?.code ?? "this discount code"} permanently?`}
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleDelete}
            />
        </section>
    )
}
