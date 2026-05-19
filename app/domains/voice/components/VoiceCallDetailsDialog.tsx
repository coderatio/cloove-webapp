"use client"

import type { ReactNode } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/app/components/ui/base-dialog"
import type { VoiceCall } from "@/app/domains/voice/hooks/useVoice"
import {
    CallDirectionLabel,
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
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                                <span className="font-medium text-slate-900 dark:text-slate-100">
                                    {call.customer_name || "Unknown caller"}
                                </span>
                                {call.customer_phone ? (
                                    <>
                                        <span aria-hidden className="text-slate-300 dark:text-slate-600">
                                            ·
                                        </span>
                                        <span className="font-mono text-[13px] tabular-nums text-slate-600 dark:text-slate-300">
                                            {call.customer_phone}
                                        </span>
                                    </>
                                ) : null}
                                <span aria-hidden className="text-slate-300 dark:text-slate-600">
                                    ·
                                </span>
                                <CallDirectionLabel direction={call.direction} />
                                <span aria-hidden className="text-slate-300 dark:text-slate-600">
                                    ·
                                </span>
                                <span className="text-slate-500 dark:text-slate-400">
                                    {new Date(call.created_at).toLocaleString(undefined, {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                        hour: "numeric",
                                        minute: "2-digit",
                                    })}
                                </span>
                            </div>

                            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl border border-slate-200/70 bg-slate-50/80 px-5 py-4 dark:border-white/10 dark:bg-white/[0.04] sm:grid-cols-4">
                                <CallDataRow label="Status">
                                    <CallStatusBadge status={call.status} />
                                </CallDataRow>
                                <CallDataRow label="Duration">
                                    <span className="font-mono text-sm tabular-nums text-slate-900 dark:text-slate-100">
                                        {formatCallDuration(call.duration_seconds)}
                                    </span>
                                </CallDataRow>
                                <CallDataRow
                                    label="Resolution"
                                    value={humanizeCallValue(call.resolution)}
                                />
                                <CallDataRow
                                    label="Transfer"
                                    value={humanizeCallValue(call.transfer_status)}
                                />
                            </dl>

                            {call.summary ? (
                                <CallSection title="Summary">
                                    <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
                                        {call.summary}
                                    </p>
                                </CallSection>
                            ) : null}

                            {call.recording_url ? (
                                <CallSection title="Recording">
                                    <audio controls className="w-full" src={call.recording_url} />
                                </CallSection>
                            ) : null}

                            <CallSection title="Transcript">
                                {(call.turns ?? []).length === 0 ? (
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        No transcript captured yet.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {(call.turns ?? []).map((turn) => (
                                            <div
                                                key={turn.id}
                                                className="rounded-lg bg-slate-50 px-4 py-3 dark:bg-white/[0.03]"
                                            >
                                                <div className="text-xs font-medium capitalize text-slate-500 dark:text-slate-400">
                                                    {turn.speaker}
                                                </div>
                                                <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-200">
                                                    {turn.transcript || turn.prompt_text || "—"}
                                                </p>
                                            </div>
                                        ))}
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
