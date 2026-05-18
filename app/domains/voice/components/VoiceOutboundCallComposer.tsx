"use client"

import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Textarea } from "@/app/components/ui/textarea"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Loader2, Phone, PhoneCall } from "lucide-react"
import type { VoiceNumberItem } from "@/app/domains/voice/hooks/useVoice"

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
}

interface VoiceOutboundCallComposerProps {
    form: CallForm
    numbers: VoiceNumberItem[]
    isPending: boolean
    onChange: (updater: (prev: CallForm) => CallForm) => void
    onSubmit: () => void
}

export function VoiceOutboundCallComposer({
    form,
    numbers,
    isPending,
    onChange,
    onSubmit,
}: VoiceOutboundCallComposerProps) {
    const hasLines = numbers.length > 0

    return (
        <GlassCard className="p-6 space-y-5">
            <SectionTitle icon={Phone} title="Start outbound call" />
            <p className="text-sm text-muted-foreground">
                Choose the calling line, tell the AI why it is calling, and give it enough context
                to handle the conversation well.
            </p>

            {!hasLines ? (
                <div className="rounded-2xl border border-dashed border-black/10 px-4 py-8 text-center text-sm text-muted-foreground dark:border-white/10">
                    Connect a voice number before starting outbound AI calls.
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
                                            {number.label || number.phone_number}
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

                    <div className="space-y-3">
                        <p className="text-sm font-medium">Quick templates</p>
                        <div className="flex flex-wrap gap-2">
                            {PURPOSE_PRESETS.map((preset) => (
                                <Button
                                    key={preset.id}
                                    type="button"
                                    variant="outline"
                                    className="h-8 rounded-full px-3 text-xs"
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

                    <div className="rounded-2xl border border-black/5 px-4 py-3 text-sm text-muted-foreground dark:border-white/10">
                        The AI will introduce itself, handle the conversation using your configured
                        voice settings, and transfer to staff if needed.
                    </div>
                </>
            )}

            <Button
                onClick={onSubmit}
                disabled={isPending || !hasLines || !form.customer_phone.trim()}
                className="rounded-full"
            >
                {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <PhoneCall className="mr-2 h-4 w-4" />
                )}
                Queue call
            </Button>
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
