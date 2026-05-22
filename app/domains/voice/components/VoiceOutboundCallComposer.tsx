"use client"

import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Textarea } from "@/app/components/ui/textarea"
import { GlassCard } from "@/app/components/ui/glass-card"
import { formatPhoneNumber } from "@/app/lib/utils"
import { Bookmark, Info, Loader2, Phone, PhoneCall, Sparkles } from "lucide-react"
import type { AiAgentItem, VoiceNumberItem } from "@/app/domains/voice/hooks/useVoice"

const USE_NUMBER_AGENT_VALUE = "__inherit__"

const PURPOSE_PRESETS = [
    {
        id: "follow_up",
        label: "Follow up",
        purpose: "Follow up on an earlier conversation",
        context: "Reference the previous interaction and ask what help is still needed.",
    },
    {
        id: "support",
        label: "Support request",
        purpose: "Resolve a support issue",
        context: "Confirm the issue clearly, provide practical help, and escalate to staff if needed.",
    },
    {
        id: "payment",
        label: "Payment reminder",
        purpose: "Discuss an outstanding payment",
        context: "Stay polite, confirm the balance or order context, and offer a staff handoff if the caller disputes the issue.",
    },
    {
        id: "appointment",
        label: "Appointment",
        purpose: "Confirm or reschedule an appointment",
        context: "Confirm timing and next steps, then transfer to staff if the customer wants to change details.",
    },
]

type CallForm = {
    business_voice_number_id: string
    customer_phone: string
    customer_name: string
    purpose: string
    context: string
    ai_agent_id: string
}

interface VoiceOutboundCallComposerProps {
    form: CallForm
    numbers: VoiceNumberItem[]
    agents?: AiAgentItem[]
    isPending: boolean
    onChange: (updater: (prev: CallForm) => CallForm) => void
    onSubmit: () => void
}

export function VoiceOutboundCallComposer({
    form,
    numbers,
    agents = [],
    isPending,
    onChange,
    onSubmit,
}: VoiceOutboundCallComposerProps) {
    const hasLines = numbers.length > 0
    const activeAgents = agents.filter((agent) => agent.status === "active")

    return (
        <GlassCard className="p-6 space-y-5">
            <div>
                <SectionTitle icon={PhoneCall} title="Start outbound call" />
                <p className="mt-2 text-sm text-muted-foreground">
                    Choose the calling line, tell the AI why it is calling, and give it enough context
                    to handle the conversation well.
                </p>
            </div>

            {!hasLines ? (
                <div className="rounded-3xl border border-dashed border-black/10 px-5 py-10 text-center dark:border-white/10">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400">
                        <Phone className="h-5 w-5" />
                    </div>
                    <p className="mt-4 text-sm font-medium text-foreground">
                        No calling line connected
                    </p>
                    <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
                        Connect a voice number from the overview above before starting outbound AI calls.
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Calling line">
                            <Select
                                value={form.business_voice_number_id || undefined}
                                onValueChange={(value) =>
                                    onChange((prev) => ({ ...prev, business_voice_number_id: value }))
                                }
                            >
                                <SelectTrigger className="rounded-2xl">
                                    <SelectValue placeholder="Select calling line" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl">
                                    {numbers.map((number) => (
                                        <SelectItem key={number.id} value={number.id}>
                                            {number.label || formatPhoneNumber(number.phone_number)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>

                        <Field label="Customer phone number">
                            <Input
                                placeholder="+2348012345678"
                                value={form.customer_phone}
                                onChange={(e) =>
                                    onChange((prev) => ({ ...prev, customer_phone: e.target.value }))
                                }
                            />
                        </Field>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Customer name">
                            <Input
                                placeholder="Ada Okafor"
                                value={form.customer_name}
                                onChange={(e) =>
                                    onChange((prev) => ({ ...prev, customer_name: e.target.value }))
                                }
                            />
                        </Field>

                        <Field label="Call purpose">
                            <Input
                                placeholder="Confirm tomorrow's delivery"
                                value={form.purpose}
                                onChange={(e) =>
                                    onChange((prev) => ({ ...prev, purpose: e.target.value }))
                                }
                            />
                        </Field>
                    </div>

                    {activeAgents.length > 0 && (
                        <Field label="AI agent">
                            <Select
                                value={form.ai_agent_id || USE_NUMBER_AGENT_VALUE}
                                onValueChange={(value) =>
                                    onChange((prev) => ({
                                        ...prev,
                                        ai_agent_id: value === USE_NUMBER_AGENT_VALUE ? "" : value,
                                    }))
                                }
                            >
                                <SelectTrigger className="rounded-2xl">
                                    <SelectValue placeholder="Use the number's agent" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl">
                                    <SelectItem value={USE_NUMBER_AGENT_VALUE}>
                                        <span className="flex items-center gap-2">
                                            <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                                            Use the number's agent
                                        </span>
                                    </SelectItem>
                                    {activeAgents.map((agent) => (
                                        <SelectItem key={agent.id} value={agent.id}>
                                            {agent.name}
                                            {agent.is_default ? " · default" : ""}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[11px] text-muted-foreground">
                                Override the persona for this single call. Only active agents are
                                listed.
                            </p>
                        </Field>
                    )}

                    <div className="space-y-2.5">
                        <div className="flex items-center gap-1.5">
                            <Bookmark className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600 dark:text-slate-400">
                                Quick templates
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {PURPOSE_PRESETS.map((preset) => (
                                <Button
                                    key={preset.id}
                                    type="button"
                                    variant="outline"
                                    className="h-8 rounded-full border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:border-brand-gold/40 hover:bg-brand-gold/[0.06] hover:text-brand-deep dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-200 dark:hover:border-brand-gold/40 dark:hover:bg-brand-gold/[0.08] dark:hover:text-brand-cream"
                                    onClick={() =>
                                        onChange((prev) => ({
                                            ...prev,
                                            purpose: preset.purpose,
                                            context: preset.context,
                                        }))
                                    }
                                >
                                    {preset.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <Field label="AI context">
                        <Textarea
                            placeholder="Share customer details, prior conversation context, or what the AI should avoid saying."
                            value={form.context}
                            onChange={(e) =>
                                onChange((prev) => ({ ...prev, context: e.target.value }))
                            }
                            rows={5}
                        />
                    </Field>

                    <div className="flex items-start gap-2.5 rounded-2xl border border-black/5 bg-slate-50/60 px-4 py-3 text-xs leading-5 text-slate-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300">
                        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400" />
                        <span>
                            The AI will introduce itself, handle the conversation using your configured
                            voice settings, and transfer to staff if needed.
                        </span>
                    </div>
                </>
            )}

            <div className="flex justify-end">
                <Button
                    onClick={onSubmit}
                    disabled={isPending || !hasLines || !form.customer_phone.trim()}
                    className="h-11 rounded-full bg-brand-deep px-6 text-sm font-medium text-brand-gold-300 hover:bg-brand-deep/92 disabled:opacity-50 dark:bg-brand-gold dark:text-brand-deep dark:hover:bg-brand-gold/92"
                >
                    {isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <PhoneCall className="mr-2 h-4 w-4" />
                    )}
                    Queue call
                </Button>
            </div>
        </GlassCard>
    )
}

function SectionTitle({ icon: Icon, title }: { icon: typeof Phone; title: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black/5 dark:bg-white/5">
                <Icon className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold">{title}</h2>
        </div>
    )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <p className="text-sm font-medium">{label}</p>
            {children}
        </div>
    )
}
