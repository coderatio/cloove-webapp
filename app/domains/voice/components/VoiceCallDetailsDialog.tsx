"use client"

import type { ReactNode } from "react"
import { Bot, PhoneIncoming, PhoneOutgoing, UserRound } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/app/components/ui/base-dialog"
import { cn, formatPhoneNumber } from "@/app/lib/utils"
import type { VoiceCall } from "@/app/domains/voice/hooks/useVoice"
import {
    CallStatusBadge,
    formatCallDuration,
    humanizeCallValue,
} from "@/app/domains/voice/components/VoiceCallLabels"

interface VoiceCallDetailsDialogProps {
    call: VoiceCall | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function VoiceCallDetailsDialog({ call, open, onOpenChange }: VoiceCallDetailsDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
                <div className="flex max-h-[min(85vh,720px)] flex-col bg-white dark:bg-transparent">
                    <DialogHeader className="shrink-0 space-y-0 p-0 px-8 pt-8 pb-4">
                        <DialogTitle className="text-xl font-semibold tracking-tight">
                            Call details
                        </DialogTitle>
                    </DialogHeader>

                    {call ? (
                        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-8 pb-8">
                            <CallHeaderSummary call={call} />

                            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-3xl border border-slate-200/70 bg-slate-50/80 px-5 py-4 dark:border-white/10 dark:bg-white/[0.04] sm:grid-cols-4">
                                <CallDataRow label="Status">
                                    <CallStatusBadge status={call.status} />
                                </CallDataRow>
                                <CallDataRow label="Duration">
                                    <span className="font-mono text-sm tabular-nums text-slate-900 dark:text-slate-100">
                                        {formatCallDuration(call.durationSeconds)}
                                    </span>
                                </CallDataRow>
                                <CallDataRow
                                    label="Resolution"
                                    value={humanizeCallValue(call.resolution)}
                                />
                                <CallDataRow
                                    label="Transfer"
                                    value={humanizeCallValue(call.transferStatus)}
                                />
                            </dl>

                            {call.summary ? (
                                <CallSection title="Summary">
                                    <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
                                        {call.summary}
                                    </p>
                                </CallSection>
                            ) : null}

                            {call.recordingUrl ? (
                                <CallSection title="Recording">
                                    <div className="rounded-full border border-slate-200/70 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                                        <audio
                                            controls
                                            preload="metadata"
                                            className="block w-full"
                                            src={call.recordingUrl}
                                        />
                                    </div>
                                </CallSection>
                            ) : null}

                            <CallSection title="Transcript">
                                {(call.turns ?? []).length === 0 ? (
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        No transcript captured yet.
                                    </p>
                                ) : (
                                    <div className="rounded-[2rem] border border-slate-200/70 bg-slate-50/60 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                                        <div className="mb-3 flex items-center justify-between gap-3 rounded-[1.25rem] border border-slate-200/80 bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                    Conversation flow
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    Styled for quick scanning, speaker separation, and clean readback.
                                                </p>
                                            </div>
                                            <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
                                                {(call.turns ?? []).length} turns
                                            </span>
                                        </div>

                                        <div className="space-y-3">
                                            {(call.turns ?? []).map((turn) => {
                                                const isAI =
                                                    turn.speaker === "assistant" ||
                                                    turn.speaker === "agent" ||
                                                    turn.speaker === "ai"
                                                const SpeakerIcon = isAI ? Bot : UserRound
                                                return (
                                                    <div
                                                        key={turn.id}
                                                        className={cn("flex", isAI ? "justify-start" : "justify-end")}
                                                    >
                                                        <div
                                                            className={cn(
                                                                "w-full max-w-[92%] rounded-[1.5rem] border px-4 py-3 shadow-[0_1px_0_rgba(15,23,42,0.03)]",
                                                                isAI
                                                                    ? "border-emerald-100/80 bg-linear-to-br from-emerald-50 via-white to-emerald-50/60 dark:border-emerald-500/15 dark:from-emerald-500/[0.08] dark:via-slate-950 dark:to-emerald-500/[0.03]"
                                                                    : "border-slate-200/80 bg-white dark:border-white/10 dark:bg-slate-950/40"
                                                            )}
                                                        >
                                                            <div className="flex items-center justify-between gap-3">
                                                                <div className="flex min-w-0 items-center gap-2.5">
                                                                    <span
                                                                        className={cn(
                                                                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                                                                            isAI
                                                                                ? "border-emerald-200 bg-emerald-100/80 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                                                                                : "border-slate-200 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300"
                                                                        )}
                                                                    >
                                                                        <SpeakerIcon className="h-4 w-4" />
                                                                    </span>
                                                                    <div className="min-w-0">
                                                                        <p
                                                                            className={cn(
                                                                                "truncate text-[11px] font-semibold uppercase tracking-[0.12em]",
                                                                                isAI
                                                                                    ? "text-emerald-700 dark:text-emerald-300"
                                                                                    : "text-slate-500 dark:text-slate-400"
                                                                            )}
                                                                        >
                                                                            {getSpeakerLabel(turn.speaker, isAI)}
                                                                        </p>
                                                                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                                                            {humanizeCallValue(turn.source) || "Voice stream"}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <span className="shrink-0 rounded-full bg-black/[0.035] px-2.5 py-1 font-mono text-[11px] text-slate-500 dark:bg-white/[0.05] dark:text-slate-400">
                                                                    {formatTranscriptTurnTime(turn.createdAt)}
                                                                </span>
                                                            </div>

                                                            <p className="mt-3 text-[15px] leading-7 text-slate-700 dark:text-slate-200">
                                                                {turn.transcript || turn.promptText || "—"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </CallSection>
                        </div>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    )
}

function CallDataRow({
    label,
    value,
    children,
}: {
    label: string
    value?: string
    children?: ReactNode
}) {
    return (
        <div className="min-w-0">
            <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                {children ??
                    (value && value.length > 0 ? (
                        value
                    ) : (
                        <span className="text-slate-400 dark:text-slate-500">—</span>
                    ))}
            </dd>
        </div>
    )
}

function CallSection({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section>
            <h3 className="mb-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
            {children}
        </section>
    )
}

function CallHeaderSummary({ call }: { call: VoiceCall }) {
    const isOutbound = call.direction.toLowerCase().includes("outbound")
    const DirectionIcon = isOutbound ? PhoneOutgoing : PhoneIncoming
    const formattedDate = new Date(call.createdAt).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    })

    return (
        <div className="flex items-start gap-3">
            <div
                className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                    isOutbound
                        ? "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300"
                        : "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300"
                )}
                aria-hidden
            >
                <DirectionIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <p className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
                        {call.customerName || "Unknown caller"}
                    </p>
                    {call.customerPhone ? (
                        <p className="font-mono text-[13px] tabular-nums text-slate-600 dark:text-slate-400">
                            {formatPhoneNumber(call.customerPhone)}
                        </p>
                    ) : null}
                </div>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="capitalize">{call.direction.replace(/_/g, " ")}</span>
                    <span aria-hidden className="mx-1.5 text-slate-300 dark:text-slate-600">
                        ·
                    </span>
                    <span>{formattedDate}</span>
                </p>
            </div>
        </div>
    )
}

function getSpeakerLabel(speaker: string, isAI: boolean) {
    if (isAI) return "AI Agent"
    const normalized = speaker?.trim()
    if (!normalized) return "Caller"
    if (normalized.toLowerCase() === "user") return "Caller"
    return normalized
}

function formatTranscriptTurnTime(value: string) {
    return new Date(value).toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
    })
}
