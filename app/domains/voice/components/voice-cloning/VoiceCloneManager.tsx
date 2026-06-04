"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { PlusSignIcon as Plus, Mic01Icon as Mic, Delete02Icon as Trash2, Loading03Icon as Loader2, AlertCircleIcon as AlertCircle, ChevronRightIcon as ChevronRight } from "@hugeicons/core-free-icons"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { GlassCard } from "@/app/components/ui/glass-card"
import { useFeature } from "@/app/hooks/useFeature"
import {
    useVoiceClones,
    useDeleteVoiceClone,
    type VoiceCloneItem,
    type VoiceCloneStatus,
} from "@/app/domains/voice/hooks/useVoice"
import { VoiceCloneCreateDialog } from "./VoiceCloneCreateDialog"

const PROVIDER_LABELS: Record<VoiceCloneItem["ttsProvider"], string> = {
    elevenlabs: "ElevenLabs",
    cartesia: "Cartesia",
}

function StatusBadge({ status }: { status: VoiceCloneStatus }) {
    switch (status) {
        case "ready":
            return <Badge variant="success">Ready</Badge>
        case "processing":
            return <Badge variant="warning">Processing</Badge>
        case "failed":
            return <Badge variant="destructive">Failed</Badge>
        default:
            return <Badge variant="outline">Pending</Badge>
    }
}

export function VoiceCloneManager() {
    const hasVoiceCloning = useFeature("hasVoiceCloning")
    const clonesQuery = useVoiceClones({ enabled: hasVoiceCloning })
    const deleteClone = useDeleteVoiceClone()
    const [dialogOpen, setDialogOpen] = React.useState(false)

    const clones = clonesQuery.data ?? []

    if (!hasVoiceCloning) {
        return (
            <GlassCard className="mx-auto max-w-3xl border-brand-gold/20 p-8 md:p-10">
                <div className="space-y-4 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-gold/10 text-brand-gold">
                        <HugeiconsIcon icon={Mic} className="h-7 w-7" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="font-serif text-2xl text-brand-deep dark:text-brand-cream">
                            Voice Cloning is a paid add-on
                        </h2>
                        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-brand-deep/60 dark:text-brand-cream/60">
                            Activate the Voice Cloning add-on in Billing to clone your own voice and use
                            custom voices across your AI voice agents.
                        </p>
                    </div>
                    <Button
                        asChild
                        className="h-auto min-h-14 rounded-[1.4rem] bg-brand-deep px-5 py-3 text-brand-gold-300 shadow-[0_18px_40px_rgba(11,61,46,0.18)] transition-all hover:-translate-y-0.5 hover:bg-brand-deep/92 hover:text-brand-gold-200 dark:bg-brand-gold-700 dark:text-white dark:hover:bg-brand-gold-800"
                    >
                        <a
                            href="/settings?tab=billing&addon=voice_cloning"
                            className="inline-flex items-center gap-4"
                        >
                            <span className="text-left">
                                <span className="block text-base font-semibold leading-none">
                                    Unlock Voice Cloning in Billing
                                </span>
                                <span className="mt-1 block text-xs font-medium uppercase tracking-[0.18em] text-brand-gold-300/75 dark:text-brand-deep/70">
                                    Business add-on
                                </span>
                            </span>
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gold-300/15 text-brand-gold-300 dark:bg-brand-deep/10 dark:text-brand-deep">
                                <HugeiconsIcon icon={ChevronRight} className="h-4 w-4" />
                            </span>
                        </a>
                    </Button>
                </div>
            </GlassCard>
        )
    }

    return (
        <div className="max-w-3xl space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="font-serif text-2xl font-medium text-foreground">Voice cloning</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Clone a voice once and select it for any AI agent from the voice picker.
                    </p>
                </div>
                <Button onClick={() => setDialogOpen(true)}>
                    <HugeiconsIcon icon={Plus} className="mr-1.5 h-4 w-4" /> New clone
                </Button>
            </div>

            {clonesQuery.isLoading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground">
                    <HugeiconsIcon icon={Loader2} className="h-5 w-5 animate-spin" />
                </div>
            ) : clones.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-brand-deep/12 py-16 text-center dark:border-white/12">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gold/10 text-brand-gold">
                        <HugeiconsIcon icon={Mic} className="h-6 w-6" />
                    </div>
                    <p className="font-medium text-foreground">No cloned voices yet</p>
                    <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                        Record or upload a sample to create a custom voice for your agents.
                    </p>
                    <Button className="mt-4" variant="outline" onClick={() => setDialogOpen(true)}>
                        <HugeiconsIcon icon={Plus} className="mr-1.5 h-4 w-4" /> Clone a voice
                    </Button>
                </div>
            ) : (
                <ul className="space-y-3">
                    {clones.map((clone) => (
                        <li
                            key={clone.id}
                            className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4"
                        >
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="truncate font-medium text-foreground">{clone.name}</p>
                                    <StatusBadge status={clone.status} />
                                </div>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    {PROVIDER_LABELS[clone.ttsProvider]}
                                </p>
                                {clone.status === "failed" && clone.errorMessage && (
                                    <p className="mt-1 flex items-center gap-1 text-xs text-rose-500">
                                        <HugeiconsIcon icon={AlertCircle} className="h-3 w-3" /> {clone.errorMessage}
                                    </p>
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteClone.mutate(clone.id)}
                                disabled={deleteClone.isPending}
                                aria-label="Delete voice clone"
                            >
                                <HugeiconsIcon icon={Trash2} className="h-4 w-4" />
                            </Button>
                        </li>
                    ))}
                </ul>
            )}

            <VoiceCloneCreateDialog open={dialogOpen} onOpenChange={setDialogOpen} />
        </div>
    )
}
