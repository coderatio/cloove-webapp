"use client"

import { useState } from "react"
import { Button } from "@/app/components/ui/button"
import { ConfirmDialog } from "@/app/components/shared/ConfirmDialog"
import { Input } from "@/app/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Switch } from "@/app/components/ui/switch"
import { cn, formatPhoneNumber } from "@/app/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import { CallIcon as Phone, CallOutgoing02Icon as PhoneForwarded, PlusSignIcon as Plus, UserAdd01Icon as UserPlus } from "@hugeicons/core-free-icons"
import type { VoiceTransferTarget } from "@/app/domains/voice/hooks/useVoice"

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

type TransferForm = {
    label: string
    roleLabel: string
    phoneNumber: string
    priority: number
    isFallback: boolean
}

interface VoiceTransferTargetsFormProps {
    targets: VoiceTransferTarget[]
    form: TransferForm
    isCreatePending: boolean
    isDeletePending?: boolean
    onFormChange: (updater: (prev: TransferForm) => TransferForm) => void
    onCreate: () => void
    onDelete: (id: string) => Promise<void> | void
}

export function VoiceTransferTargetsForm({
    targets,
    form,
    isCreatePending,
    isDeletePending = false,
    onFormChange,
    onCreate,
    onDelete,
}: VoiceTransferTargetsFormProps) {
    const [targetToRemove, setTargetToRemove] = useState<VoiceTransferTarget | null>(null)

    return (
        <>
            <div className="space-y-6">
                <GlassCard className="p-6 space-y-5">
                    <div className="flex items-start justify-between gap-4">
                        <SectionHeader
                            icon={PhoneForwarded}
                            title="Transfer targets"
                            description="Choose who receives escalated calls when the AI needs a human handoff."
                        />
                        {targets.length > 0 ? (
                            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-white/5 dark:text-slate-300">
                                {targets.length} {targets.length === 1 ? "target" : "targets"}
                            </span>
                        ) : null}
                    </div>

                    {targets.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <div className="space-y-2">
                            {targets.map((target) => (
                                <TargetRow
                                    key={target.id}
                                    target={target}
                                    onRemove={() => setTargetToRemove(target)}
                                />
                            ))}
                        </div>
                    )}
                </GlassCard>

                <GlassCard className="p-6 space-y-5">
                    <SectionHeader
                        icon={UserPlus}
                        title="Add a target"
                        description="Connect a new staff member to handle live transfers."
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                        <FormField label="Staff name">
                            <Input
                                placeholder="Jane Ibrahim"
                                value={form.label}
                                onChange={(e) => onFormChange((prev) => ({ ...prev, label: e.target.value }))}
                            />
                        </FormField>

                        <FormField label="Role">
                            <Select
                                value={form.roleLabel}
                                onValueChange={(value) => onFormChange((prev) => ({ ...prev, role_label: value }))}
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
                        </FormField>

                        <FormField label="Phone number">
                            <Input
                                placeholder="+2348012345678"
                                value={form.phoneNumber}
                                onChange={(e) =>
                                    onFormChange((prev) => ({ ...prev, phone_number: e.target.value }))
                                }
                            />
                        </FormField>

                        <FormField label="Routing order">
                            <Select
                                value={String(form.priority)}
                                onValueChange={(value) =>
                                    onFormChange((prev) => ({ ...prev, priority: Number(value) }))
                                }
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
                        </FormField>
                    </div>

                    <ToggleRow
                        label="Use as fallback if primary transfer fails"
                        description="Cloove will route here only when the primary target is unreachable."
                        checked={form.isFallback}
                        onCheckedChange={(value) =>
                            onFormChange((prev) => ({ ...prev, is_fallback: value }))
                        }
                    />

                    <div className="flex justify-end pt-1">
                        <Button
                            onClick={onCreate}
                            disabled={isCreatePending || !form.label.trim() || !form.phoneNumber.trim()}
                            className="h-10 rounded-full bg-brand-deep px-5 text-sm font-medium text-brand-gold-300 hover:bg-brand-deep/92 dark:bg-brand-gold-700 dark:text-white dark:hover:bg-brand-gold-800"
                        >
                            <HugeiconsIcon icon={Plus} className="mr-1.5 h-4 w-4" />
                            Add target
                        </Button>
                    </div>
                </GlassCard>
            </div>

            <ConfirmDialog
                open={!!targetToRemove}
                onOpenChange={(open) => !open && setTargetToRemove(null)}
                onConfirm={async () => {
                    if (!targetToRemove) return
                    await onDelete(targetToRemove.id)
                }}
                title={targetToRemove ? `Remove ${targetToRemove.label}?` : "Remove transfer target?"}
                description="This person will no longer receive live call transfers from the AI. You can add them again at any time."
                confirmText="Remove"
                isLoading={isDeletePending}
            />
        </>
    )
}

function TargetRow({
    target,
    onRemove,
}: {
    target: VoiceTransferTarget
    onRemove: () => void
}) {
    const initials = getInitials(target.label)
    return (
        <div
            className={cn(
                "group relative flex items-center gap-3.5 overflow-hidden rounded-2xl border bg-white px-4 py-3 transition-colors dark:bg-slate-950/40",
                "before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:rounded-r-full",
                target.isFallback
                    ? "border-amber-200/70 hover:border-amber-300 before:bg-amber-500 dark:border-amber-500/20 dark:hover:border-amber-500/40"
                    : "border-slate-200/80 hover:border-slate-200 before:bg-transparent dark:border-white/10 dark:hover:border-white/15"
            )}
        >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-green-50 text-[13px] font-semibold text-brand-green dark:bg-brand-green-950/40 dark:text-emerald-400">
                {initials}
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <p className="truncate text-[15px] font-semibold text-slate-900 dark:text-slate-100">
                        {target.label}
                    </p>
                    {target.isFallback ? <FallbackChip /> : null}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                    <span>{humanizeRole(target.roleLabel)}</span>
                    <span aria-hidden className="text-slate-300 dark:text-slate-600">·</span>
                    <span className="font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        {formatPhoneNumber(target.phoneNumber)}
                    </span>
                </div>
            </div>

            <PriorityChip priority={target.priority} />

            <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="h-8 rounded-xl px-2.5 text-[13px] font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
            >
                Remove
            </Button>
        </div>
    )
}

function PriorityChip({ priority }: { priority: number }) {
    const label = priority === 0 ? "Primary" : priority === 1 ? "Secondary" : "Backup"
    const className =
        priority === 0
            ? "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20"
            : priority === 1
                ? "bg-sky-50 text-sky-700 ring-sky-100 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/20"
                : "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-white/5 dark:text-slate-300 dark:ring-white/10"
    return (
        <span
            className={cn(
                "inline-flex shrink-0 items-center rounded-xl px-2 py-0.5 text-[12px] font-medium ring-1 ring-inset",
                className
            )}
        >
            {label}
        </span>
    )
}

function FallbackChip() {
    return (
        <span className="inline-flex shrink-0 items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
            Fallback
        </span>
    )
}

function EmptyState() {
    return (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/40 px-6 py-10 text-center dark:border-white/10 dark:bg-white/[0.02]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400">
                <HugeiconsIcon icon={PhoneForwarded} className="h-5 w-5" />
            </div>
            <p className="mt-4 text-sm font-medium text-slate-800 dark:text-slate-100">
                No transfer targets yet
            </p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                Add a staff member below so the AI can hand off live calls when a human is needed.
            </p>
        </div>
    )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                {label}
            </label>
            {children}
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
    description?: string
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-black/5 dark:bg-white/5">
                <HugeiconsIcon icon={Icon} className="h-5 w-5" />
            </div>
            <div className="min-w-0">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
                {description ? (
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>
                ) : null}
            </div>
        </div>
    )
}

function getInitials(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return "?"
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function humanizeRole(role: string | null | undefined) {
    if (!role) return "Staff"
    return role.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
}

function ToggleRow({
    label,
    description,
    checked,
    onCheckedChange,
}: {
    label: string
    description?: string
    checked: boolean
    onCheckedChange: (value: boolean) => void
}) {
    return (
        <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/40 px-4 py-3 dark:border-white/10 dark:bg-white/[0.02]">
            <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
                {description ? (
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>
                ) : null}
            </div>
            <Switch checked={checked} onCheckedChange={onCheckedChange} />
        </label>
    )
}
