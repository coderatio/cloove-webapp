"use client"

import { motion } from "framer-motion"
import type { FlowFieldDraft } from "./FlowsTab"

// ─── Field type badges ───────────────────────────────────────────

function FieldTypeBadge({ kind }: { kind: FlowFieldDraft["kind"] }) {
    const badges: Record<FlowFieldDraft["kind"], { label: string; className: string }> = {
        text: { label: "Text", className: "bg-white/10 text-white/50" },
        number: { label: "123", className: "bg-amber-500/20 text-amber-300" },
        textarea: { label: "Aa", className: "bg-blue-500/20 text-blue-300" },
        dropdown: { label: "▼", className: "bg-purple-500/20 text-purple-300" },
        checkbox: { label: "☑", className: "bg-emerald-500/20 text-emerald-300" },
    }
    const badge = badges[kind]
    return (
        <span className={`rounded px-1.5 py-[1px] text-[10px] font-medium leading-tight ${badge.className}`}>
            {badge.label}
        </span>
    )
}

// ─── Helper text line ────────────────────────────────────────────

function HelperText({ text }: { text: string }) {
    if (!text.trim()) return null
    return (
        <p className="mt-1 text-[11px] leading-relaxed text-white/35 italic">
            {text.trim()}
        </p>
    )
}

// ─── Number input ────────────────────────────────────────────────

function NumberInputPreview() {
    return (
        <div className="flex items-center rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
            <span className="text-sm text-white/25">0</span>
            <div className="ml-auto flex items-center gap-1">
                <span className="rounded bg-amber-500/10 px-1.5 py-[1px] text-[10px] font-medium text-amber-400/70">
                    digits only
                </span>
            </div>
        </div>
    )
}

// ─── Text input ──────────────────────────────────────────────────

function TextInputPreview() {
    return (
        <div className="h-[42px] rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
            <div className="h-2.5 w-2/3 rounded bg-white/10" />
        </div>
    )
}

// ─── Textarea ────────────────────────────────────────────────────

function TextareaPreview() {
    return (
        <div className="space-y-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
            <div className="h-2 w-full rounded bg-white/10" />
            <div className="h-2 w-3/4 rounded bg-white/10" />
            <div className="h-2 w-1/2 rounded bg-white/8" />
            <div className="flex items-center justify-between pt-0.5">
                <span className="text-[10px] text-white/25">multi-line</span>
                <span className="text-[10px] text-white/20">↲</span>
            </div>
        </div>
    )
}

// ─── Dropdown ────────────────────────────────────────────────────

function DropdownPreview({ field }: { field: FlowFieldDraft }) {
    const options = field.optionsText
        ?.split("\n")
        .map((line) => line.trim())
        .filter(Boolean) ?? []

    const parsed = options.map((line) => {
        const [id, ...rest] = line.split(":")
        return { id: id.trim(), label: rest.join(":").trim() || id.trim() }
    })

    if (parsed.length === 0) {
        return (
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
                <span className="text-sm text-white/25">Select an option...</span>
                <svg className="h-4 w-4 text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>
        )
    }

    return (
        <div className="space-y-0.5">
            {/* Selected value preview */}
            <div className="flex items-center justify-between rounded-lg rounded-b-none border border-b-0 border-white/10 bg-white/8 px-3 py-2.5">
                <span className="text-sm text-white/50">{parsed[0].label}</span>
                <svg className="h-4 w-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>
            {/* Dropdown list */}
            <div className="divide-y divide-white/5 rounded-lg rounded-t-none border border-white/10 bg-white/[0.04]">
                {parsed.map((opt, i) => (
                    <div
                        key={opt.id}
                        className={`flex items-center gap-2 px-3 py-2 ${
                            i === 0 ? "bg-white/5" : ""
                        }`}
                    >
                        {i === 0 && (
                            <svg className="h-3 w-3 shrink-0 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                        <span className={`text-sm ${i === 0 ? "text-white/70" : "text-white/40"}`}>
                            {opt.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── Checkbox group ──────────────────────────────────────────────

function CheckboxPreview({ field }: { field: FlowFieldDraft }) {
    const options = (field.optionsText
        ?.split("\n")
        .map((line) => line.trim())
        .filter(Boolean) ?? []).map((line) => {
        const [id, ...rest] = line.split(":")
        return { id: id.trim(), label: rest.join(":").trim() || id.trim() }
    })

    if (options.length === 0) {
        return (
            <div className="space-y-2">
                <div className="flex items-center gap-2.5 opacity-30">
                    <div className="h-4 w-4 rounded border border-white/20" />
                    <span className="text-sm text-white/60">Option 1</span>
                </div>
                <div className="flex items-center gap-2.5 opacity-20">
                    <div className="h-4 w-4 rounded border border-white/20" />
                    <span className="text-sm text-white/60">Option 2</span>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-1.5">
            {options.slice(0, 4).map((opt, i) => (
                <div key={opt.id} className="flex items-center gap-2.5">
                    <div
                        className={`flex h-4 w-4 items-center justify-center rounded border ${
                            i === 0
                                ? "border-emerald-400/50 bg-emerald-400/15"
                                : "border-white/20 bg-white/5"
                        }`}
                    >
                        {i === 0 && (
                            <svg className="h-2.5 w-2.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </div>
                    <span className={`text-sm ${i === 0 ? "text-white/70" : "text-white/40"}`}>
                        {opt.label}
                    </span>
                </div>
            ))}
            {options.length > 4 && (
                <p className="text-[10px] text-white/25">+{options.length - 4} more options</p>
            )}
            <p className="pt-0.5 text-[10px] text-white/25">select all that apply</p>
        </div>
    )
}

// ─── Field label ─────────────────────────────────────────────────

function renderFieldLabel(field: FlowFieldDraft) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white/80">
                {field.label || "Field label"}
                {field.required && <span className="ml-1 text-xs text-red-400">*</span>}
            </span>
            <FieldTypeBadge kind={field.kind} />
        </div>
    )
}

// ─── Field preview dispatch ──────────────────────────────────────

function renderFieldPreview(field: FlowFieldDraft) {
    switch (field.kind) {
        case "number":
            return <NumberInputPreview />
        case "textarea":
            return <TextareaPreview />
        case "dropdown":
            return <DropdownPreview field={field} />
        case "checkbox":
            return <CheckboxPreview field={field} />
        default:
            return <TextInputPreview />
    }
}

// ─── Main component ──────────────────────────────────────────────

interface FlowPhonePreviewProps {
    title: string
    introText: string
    ctaText: string
    fields: FlowFieldDraft[]
}

export function FlowPhonePreview({ title, introText, ctaText, fields }: FlowPhonePreviewProps) {
    const validFields = fields.filter((f) => f.label.trim())
    const hasContent = title.trim() || introText.trim() || validFields.length > 0

    return (
        <div className="mx-auto flex h-full w-full max-w-[360px] justify-center">
            <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[2.75rem] border-[6px] border-slate-800 bg-[#0f1726] shadow-[0_30px_80px_rgba(10,15,30,0.45)] ring-1 ring-white/10 dark:border-slate-700"
            >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(22,163,74,0.08),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_20%)]" />

                <div className="relative flex items-center justify-between px-6 pb-2 pt-5">
                    <span className="text-xs font-semibold text-white/65">9:41</span>
                    <div className="flex items-center gap-1.5">
                        <div className="h-2.5 w-4 rounded-full border border-white/30" />
                        <svg className="h-3 w-3 text-white/30" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
                        </svg>
                    </div>
                </div>

                <div className="relative border-b border-white/6 px-4 py-3">
                    <div className="grid grid-cols-[20px_1fr_20px] items-center gap-3">
                        <svg className="h-5 w-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.1} d="M15 19l-7-7 7-7" />
                        </svg>
                        <div className="text-center">
                            <p className="text-sm font-semibold text-white/92">Flow</p>
                            <p className="text-[10px] uppercase text-emerald-300/65">WhatsApp preview</p>
                        </div>
                        <svg className="h-5 w-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                    </div>
                </div>

                <div className="relative min-h-0 flex-1 overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_10%),radial-gradient(circle_at_20%_0%,rgba(34,197,94,0.08),transparent_20%)] px-4 pb-3 pt-4">
                    <motion.div
                        layout
                        className="flex h-full min-h-0 flex-col overflow-hidden rounded-[1.75rem] border border-white/8 bg-[linear-gradient(180deg,rgba(19,29,45,0.96),rgba(13,20,34,0.98))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                    >
                        {hasContent ? (
                            <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
                                <div className="rounded-[1.35rem] border border-emerald-400/10 bg-white/[0.035] px-4 py-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="space-y-1">
                                            <p className="text-[10px] uppercase text-emerald-300/70">
                                                Interactive form
                                            </p>
                                            <h3 className="text-lg font-semibold leading-tight text-white">
                                                {title.trim() || "Untitled flow"}
                                            </h3>
                                        </div>
                                        <div className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-medium text-white/55">
                                            {validFields.length} field{validFields.length === 1 ? "" : "s"}
                                        </div>
                                    </div>
                                    {introText.trim() ? (
                                        <p className="mt-2 text-sm leading-relaxed text-white/60">
                                            {introText.trim()}
                                        </p>
                                    ) : (
                                        <p className="mt-2 text-sm leading-relaxed text-white/35">
                                            Add intro text to explain what the customer should complete here.
                                        </p>
                                    )}
                                </div>

                                {validFields.length > 0 ? (
                                    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1">
                                        {validFields.map((field, index) => (
                                            <motion.div
                                                key={field.id || index}
                                                layout
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.18, delay: index * 0.02 }}
                                                className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] px-3.5 py-3"
                                            >
                                                <div className="space-y-1.5">
                                                    {renderFieldLabel(field)}
                                                    <HelperText text={field.helperText} />
                                                    <div className="mt-1.5">{renderFieldPreview(field)}</div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-[1.35rem] border border-dashed border-white/10 bg-white/[0.025] px-4 py-7 text-center">
                                        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                                            <svg className="h-5 w-5 text-white/35" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 10h16M4 14h16M4 18h10" />
                                            </svg>
                                        </div>
                                        <p className="mt-3 text-sm font-medium text-white/55">No form fields yet</p>
                                        <p className="mx-auto mt-1 max-w-[220px] text-xs leading-relaxed text-white/30">
                                            Add customer fields on the left and they will appear here in order.
                                        </p>
                                    </div>
                                )}

                                <div className="pt-1">
                                    <div className="flex h-12 w-full items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#f7faf8,#d7eee3)] text-sm font-semibold text-slate-900 shadow-[0_12px_24px_rgba(11,61,46,0.18)]">
                                        {ctaText.trim() || "Submit"}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex h-full min-h-0 flex-col items-center justify-center gap-4 px-5 text-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] border border-white/10 bg-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                                    <svg className="h-7 w-7 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M4 6h16M4 10h16M4 14h16M4 18h10" />
                                    </svg>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-base font-semibold text-white/58">Start building your flow</p>
                                    <p className="mx-auto max-w-[230px] text-sm leading-relaxed text-white/32">
                                        Add a title, intro, and form fields on the left to see a realistic WhatsApp flow preview here.
                                    </p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>

                <div className="relative flex shrink-0 justify-center border-t border-white/6 bg-[#0f1726]/95 pb-4 pt-2 backdrop-blur-sm">
                    <div className="h-1.5 w-28 rounded-full bg-white/18" />
                </div>
            </motion.div>
        </div>
    )
}
