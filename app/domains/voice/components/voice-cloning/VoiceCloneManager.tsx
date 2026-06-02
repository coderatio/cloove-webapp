"use client"

import * as React from "react"
import { Plus, Mic, Trash2, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
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
    openai: "OpenAI",
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
    const clonesQuery = useVoiceClones()
    const deleteClone = useDeleteVoiceClone()
    const [dialogOpen, setDialogOpen] = React.useState(false)

    const clones = clonesQuery.data ?? []

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
                    <Plus className="mr-1.5 h-4 w-4" /> New clone
                </Button>
            </div>

            {clonesQuery.isLoading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                </div>
            ) : clones.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-brand-deep/12 py-16 text-center dark:border-white/12">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gold/10 text-brand-gold">
                        <Mic className="h-6 w-6" />
                    </div>
                    <p className="font-medium text-foreground">No cloned voices yet</p>
                    <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                        Record or upload a sample to create a custom voice for your agents.
                    </p>
                    <Button className="mt-4" variant="outline" onClick={() => setDialogOpen(true)}>
                        <Plus className="mr-1.5 h-4 w-4" /> Clone a voice
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
                                        <AlertCircle className="h-3 w-3" /> {clone.errorMessage}
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
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </li>
                    ))}
                </ul>
            )}

            <VoiceCloneCreateDialog open={dialogOpen} onOpenChange={setDialogOpen} />
        </div>
    )
}
