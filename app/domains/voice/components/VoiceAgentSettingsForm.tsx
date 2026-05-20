"use client"

import { startTransition, useEffect, useState } from "react"
import { Accordion } from "@base-ui/react/accordion"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Switch } from "@/app/components/ui/switch"
import { Textarea } from "@/app/components/ui/textarea"
import { GlassCard } from "@/app/components/ui/glass-card"
import { VoiceScheduleBuilder } from "@/app/domains/voice/components/VoiceScheduleBuilder"
import {
    CalendarClock,
    ChevronDown,
    Loader2,
    MessageSquare,
    ShieldCheck,
    SlidersHorizontal,
    UserCircle2,
} from "lucide-react"
import { cn } from "@/app/lib/utils"

const accordionTriggerClass =
    "flex w-full items-center gap-3 px-5 py-4 text-left text-sm font-semibold text-brand-deep transition-colors hover:bg-black/5 dark:text-brand-cream dark:hover:bg-white/5 data-panel-open:bg-black/5 dark:data-panel-open:bg-white/5"
const accordionTriggerIconClass =
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-black/5 text-slate-600 dark:bg-white/5 dark:text-slate-300"
const accordionPanelClass =
    "overflow-hidden transition-[height] duration-300 ease-out motion-reduce:duration-[0.01ms]"
const accordionItemClass = "border-t border-brand-deep/5 dark:border-white/5 first:border-t-0"

type SettingsForm = {
    display_name: string
    greeting_message: string
    fallback_message: string
    voicemail_message: string
    language: string
    tone: string
    ai_enabled: boolean
    recording_enabled: boolean
    transcription_enabled: boolean
    human_handoff_enabled: boolean
    after_hours_enabled: boolean
    disclosure_enabled: boolean
    business_info: string
    ai_instructions: string
    restricted_topics: string
    operating_hours: string
}

interface VoiceAgentSettingsFormProps {
    settings: SettingsForm
    businessDisplayName: string
    languageOptions: Array<{ value: string; label: string }>
    toneOptions: Array<{ value: string; label: string }>
    greetingPresets: Array<{ id: string; label: string; build: (name: string) => string }>
    fallbackPresets: Array<{ id: string; label: string; text: string }>
    isPending: boolean
    onChange: (updater: (prev: SettingsForm) => SettingsForm) => void
    onSubmit: () => void
}

export function VoiceAgentSettingsForm({
    settings,
    businessDisplayName,
    languageOptions,
    toneOptions,
    greetingPresets,
    fallbackPresets,
    isPending,
    onChange,
    onSubmit,
}: VoiceAgentSettingsFormProps) {
    const [openSections, setOpenSections] = useState<string[]>(["identity", "prompts"])
    const [availabilityReady, setAvailabilityReady] = useState(false)
    const availabilityOpen = openSections.includes("availability")

    useEffect(() => {
        if (!availabilityOpen || availabilityReady) return
        startTransition(() => {
            setAvailabilityReady(true)
        })
    }, [availabilityOpen, availabilityReady])

    return (
        <GlassCard className="p-0 overflow-hidden">
            <div className="flex items-center gap-3 border-b border-brand-deep/5 px-6 py-5 dark:border-white/5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-green-50 text-brand-green dark:bg-brand-green-950/40 dark:text-emerald-400">
                    <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream">
                        Agent settings
                    </h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        Configure how the voice assistant speaks, responds, and behaves during calls.
                    </p>
                </div>
            </div>

            <Accordion.Root
                value={openSections}
                onValueChange={(value) => setOpenSections(Array.isArray(value) ? value : [value])}
                className="bg-transparent"
            >
                <Accordion.Item value="identity" className={accordionItemClass}>
                    <Accordion.Header>
                        <Accordion.Trigger className={accordionTriggerClass}>
                            <span className={accordionTriggerIconClass}>
                                <UserCircle2 className="h-4 w-4" />
                            </span>
                            <span className="flex-1">Identity and language</span>
                            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 data-panel-open:rotate-180" />
                        </Accordion.Trigger>
                    </Accordion.Header>
                    <Accordion.Panel className={cn("px-5 pb-5", accordionPanelClass)}>
                        <div className="space-y-4 pt-2">
                            <div className="grid gap-4 md:grid-cols-2">
                                <Field label="Display name">
                                    <Input
                                        placeholder="Cloove Support"
                                        value={settings.display_name}
                                        onChange={(e) =>
                                            onChange((prev) => ({ ...prev, display_name: e.target.value }))
                                        }
                                    />
                                </Field>
                                <Field label="Language">
                                    <Select
                                        value={settings.language}
                                        onValueChange={(value) =>
                                            onChange((prev) => ({ ...prev, language: value }))
                                        }
                                    >
                                        <SelectTrigger className="rounded-2xl">
                                            <SelectValue placeholder="Select language" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl">
                                            {languageOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>
                            </div>
                            <Field label="Conversation tone">
                                <Select
                                    value={settings.tone}
                                    onValueChange={(value) =>
                                        onChange((prev) => ({ ...prev, tone: value }))
                                    }
                                >
                                    <SelectTrigger className="rounded-2xl">
                                        <SelectValue placeholder="Select tone" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        {toneOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Field>
                        </div>
                    </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="prompts" className={accordionItemClass}>
                    <Accordion.Header>
                        <Accordion.Trigger className={accordionTriggerClass}>
                            <span className={accordionTriggerIconClass}>
                                <MessageSquare className="h-4 w-4" />
                            </span>
                            <span className="flex-1">Call prompts</span>
                            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 data-panel-open:rotate-180" />
                        </Accordion.Trigger>
                    </Accordion.Header>
                    <Accordion.Panel className={cn("px-5 pb-5", accordionPanelClass)}>
                        <div className="space-y-5 pt-2">
                            <Field label="Greeting">
                                <div className="space-y-3">
                                    <div className="flex flex-wrap gap-2">
                                        {greetingPresets.map((preset) => (
                                            <Button
                                                key={preset.id}
                                                type="button"
                                                variant="outline"
                                                className="h-8 rounded-full px-3 text-xs"
                                                onClick={() =>
                                                    onChange((prev) => ({
                                                        ...prev,
                                                        greeting_message: preset.build(businessDisplayName),
                                                    }))
                                                }
                                            >
                                                {preset.label}
                                            </Button>
                                        ))}
                                    </div>
                                    <Textarea
                                        placeholder="How the AI should welcome callers"
                                        value={settings.greeting_message}
                                        onChange={(e) =>
                                            onChange((prev) => ({
                                                ...prev,
                                                greeting_message: e.target.value,
                                            }))
                                        }
                                        rows={3}
                                    />
                                </div>
                            </Field>

                            <Field label="Fallback response">
                                <div className="space-y-3">
                                    <div className="flex flex-wrap gap-2">
                                        {fallbackPresets.map((preset) => (
                                            <Button
                                                key={preset.id}
                                                type="button"
                                                variant="outline"
                                                className="h-8 rounded-full px-3 text-xs"
                                                onClick={() =>
                                                    onChange((prev) => ({
                                                        ...prev,
                                                        fallback_message: preset.text,
                                                    }))
                                                }
                                            >
                                                {preset.label}
                                            </Button>
                                        ))}
                                    </div>
                                    <Textarea
                                        placeholder="What the AI should say when it needs the caller to repeat or wait"
                                        value={settings.fallback_message}
                                        onChange={(e) =>
                                            onChange((prev) => ({
                                                ...prev,
                                                fallback_message: e.target.value,
                                            }))
                                        }
                                        rows={3}
                                    />
                                </div>
                            </Field>
                        </div>
                    </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="availability" className={accordionItemClass}>
                    <Accordion.Header>
                        <Accordion.Trigger className={accordionTriggerClass}>
                            <span className={accordionTriggerIconClass}>
                                <CalendarClock className="h-4 w-4" />
                            </span>
                            <span className="flex-1">Availability</span>
                            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 data-panel-open:rotate-180" />
                        </Accordion.Trigger>
                    </Accordion.Header>
                    <Accordion.Panel className={cn("px-5 pb-5", accordionPanelClass)}>
                        <div className="space-y-4 pt-2">
                            {availabilityReady ? (
                                <VoiceScheduleBuilder
                                    value={settings.operating_hours}
                                    onChange={(value) =>
                                        onChange((prev) => ({ ...prev, operating_hours: value }))
                                    }
                                />
                            ) : (
                                <div className="rounded-2xl border border-black/5 px-4 py-3 text-sm text-muted-foreground dark:border-white/10">
                                    Loading availability...
                                </div>
                            )}
                        </div>
                    </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="automation" className={accordionItemClass}>
                    <Accordion.Header>
                        <Accordion.Trigger className={accordionTriggerClass}>
                            <span className={accordionTriggerIconClass}>
                                <SlidersHorizontal className="h-4 w-4" />
                            </span>
                            <span className="flex-1">Automation controls</span>
                            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 data-panel-open:rotate-180" />
                        </Accordion.Trigger>
                    </Accordion.Header>
                    <Accordion.Panel className={cn("px-5 pb-5", accordionPanelClass)}>
                        <div className="grid gap-3 pt-2 md:grid-cols-2">
                            <ToggleRow
                                label="AI enabled"
                                description="Let the AI assistant answer and respond on calls."
                                checked={settings.ai_enabled}
                                onCheckedChange={(value) =>
                                    onChange((prev) => ({ ...prev, ai_enabled: value }))
                                }
                            />
                            <ToggleRow
                                label="Record calls"
                                description="Save audio recordings for later review."
                                checked={settings.recording_enabled}
                                onCheckedChange={(value) =>
                                    onChange((prev) => ({ ...prev, recording_enabled: value }))
                                }
                            />
                            <ToggleRow
                                label="Transcribe calls"
                                description="Generate written transcripts of conversations."
                                checked={settings.transcription_enabled}
                                onCheckedChange={(value) =>
                                    onChange((prev) => ({ ...prev, transcription_enabled: value }))
                                }
                            />
                            <ToggleRow
                                label="Human handoff"
                                description="Allow the AI to transfer callers to a staff member."
                                checked={settings.human_handoff_enabled}
                                onCheckedChange={(value) =>
                                    onChange((prev) => ({ ...prev, human_handoff_enabled: value }))
                                }
                            />
                            <ToggleRow
                                label="After-hours behavior"
                                description="Use after-hours messaging outside operating windows."
                                checked={settings.after_hours_enabled}
                                onCheckedChange={(value) =>
                                    onChange((prev) => ({ ...prev, after_hours_enabled: value }))
                                }
                            />
                            <ToggleRow
                                label="Recording disclosure"
                                description="Announce that the call is being recorded."
                                checked={settings.disclosure_enabled}
                                onCheckedChange={(value) =>
                                    onChange((prev) => ({ ...prev, disclosure_enabled: value }))
                                }
                            />
                        </div>
                    </Accordion.Panel>
                </Accordion.Item>
            </Accordion.Root>

            <div className="flex items-center justify-end border-t border-brand-deep/5 px-6 py-5 dark:border-white/5">
                <Button
                    onClick={onSubmit}
                    disabled={isPending}
                    className="h-10 rounded-full bg-brand-deep px-6 text-sm font-medium text-brand-gold-300 hover:bg-brand-deep/92 dark:bg-brand-gold dark:text-brand-deep dark:hover:bg-brand-gold/92"
                >
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save settings
                </Button>
            </div>
        </GlassCard>
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
        <label className="flex items-start justify-between gap-3 rounded-2xl border border-black/5 px-4 py-3 transition-colors hover:border-black/10 dark:border-white/10 dark:hover:border-white/15">
            <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{label}</p>
                {description ? (
                    <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        {description}
                    </p>
                ) : null}
            </div>
            <Switch checked={checked} onCheckedChange={onCheckedChange} />
        </label>
    )
}
