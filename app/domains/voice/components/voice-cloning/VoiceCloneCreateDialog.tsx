"use client"

import * as React from "react"
import { Loader2, Upload, X, Check } from "lucide-react"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/app/components/ui/base-dialog"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { cn } from "@/app/lib/utils"
import { uploadService } from "@/app/lib/upload/upload-service"
import { useCreateVoiceClone } from "@/app/domains/voice/hooks/useVoice"
import { VoiceSampleRecorder } from "./VoiceSampleRecorder"

type CloneProvider = "elevenlabs" | "cartesia"

const PROVIDER_OPTIONS: Array<{
    id: CloneProvider
    label: string
    hint: string
}> = [
    { id: "elevenlabs", label: "ElevenLabs", hint: "Instant clone, highly natural" },
    { id: "cartesia", label: "Cartesia", hint: "Fast, low-latency clone" },
]

const ACCEPTED_AUDIO = ["audio/mpeg", "audio/mp4", "audio/wav", "audio/ogg", "audio/webm", "audio/flac"]
const MAX_SAMPLE_MB = 25

interface VoiceCloneCreateDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function VoiceCloneCreateDialog({ open, onOpenChange }: VoiceCloneCreateDialogProps) {
    const createClone = useCreateVoiceClone()

    const [name, setName] = React.useState("")
    const [provider, setProvider] = React.useState<CloneProvider>("elevenlabs")
    const [recordedFile, setRecordedFile] = React.useState<File | null>(null)
    const [uploadedFiles, setUploadedFiles] = React.useState<File[]>([])
    const [consent, setConsent] = React.useState(false)
    const [submitting, setSubmitting] = React.useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const reset = () => {
        setName("")
        setProvider("elevenlabs")
        setRecordedFile(null)
        setUploadedFiles([])
        setConsent(false)
        setSubmitting(false)
    }

    const handleOpenChange = (next: boolean) => {
        if (!next) reset()
        onOpenChange(next)
    }

    const handleFilePick = (event: React.ChangeEvent<HTMLInputElement>) => {
        const picked = Array.from(event.target.files ?? [])
        for (const file of picked) {
            if (!ACCEPTED_AUDIO.includes(file.type)) {
                toast.error(`Unsupported file: ${file.name}`)
                continue
            }
            if (file.size > MAX_SAMPLE_MB * 1024 * 1024) {
                toast.error(`${file.name} is larger than ${MAX_SAMPLE_MB}MB`)
                continue
            }
            setUploadedFiles((prev) => [...prev, file])
        }
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const samples = React.useMemo(
        () => [...(recordedFile ? [recordedFile] : []), ...uploadedFiles],
        [recordedFile, uploadedFiles]
    )

    const canSubmit = name.trim().length >= 2 && samples.length > 0 && consent && !submitting

    const handleSubmit = async () => {
        if (!canSubmit) return
        setSubmitting(true)
        try {
            const urls: string[] = []
            for (const file of samples) {
                urls.push(await uploadService.uploadFile(file))
            }
            await createClone.mutateAsync({
                name: name.trim(),
                tts_provider: provider,
                sample_urls: urls,
                consent_accepted: consent,
            })
            handleOpenChange(false)
        } catch (error) {
            toast.error((error as Error)?.message ?? "Could not upload voice samples")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Clone a voice</DialogTitle>
                    <DialogDescription className="text-sm">
                        Record or upload a clean sample of the voice you want your AI agent to use.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 space-y-6 overflow-y-auto px-8 py-3">
                    <div className="space-y-2">
                        <Label htmlFor="clone-name">Voice name</Label>
                        <Input
                            id="clone-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Founder's voice"
                            maxLength={120}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Provider</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {PROVIDER_OPTIONS.map((option) => {
                                const active = provider === option.id
                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => setProvider(option.id)}
                                        title={option.hint}
                                        className={cn(
                                            "rounded-2xl border p-3 text-left transition-all duration-300",
                                            active
                                                ? "border-brand-green bg-brand-green/[0.06] shadow-sm dark:border-brand-gold/40 dark:bg-brand-gold/[0.06]"
                                                : "border-brand-deep/10 hover:border-brand-green/40 hover:bg-brand-green/[0.03] dark:border-white/10 dark:hover:border-brand-gold/30"
                                        )}
                                    >
                                        <p
                                            className={cn(
                                                "text-sm font-medium",
                                                active
                                                    ? "text-brand-deep dark:text-brand-cream"
                                                    : "text-foreground"
                                            )}
                                        >
                                            {option.label}
                                        </p>
                                        <p className="mt-0.5 text-[11px] leading-tight text-brand-accent/60 dark:text-brand-cream/45">
                                            {option.hint}
                                        </p>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label>Voice sample</Label>
                        <VoiceSampleRecorder onSample={setRecordedFile} disabled={submitting} />

                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={submitting}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-brand-deep/15 py-3 text-sm text-brand-accent/70 transition-all duration-300 hover:border-brand-green/40 hover:bg-brand-green/[0.03] hover:text-brand-deep dark:border-white/15 dark:text-brand-cream/60 dark:hover:border-brand-gold/30"
                        >
                            <Upload className="h-4 w-4" /> Upload audio file(s)
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept={ACCEPTED_AUDIO.join(",")}
                            multiple
                            className="hidden"
                            onChange={handleFilePick}
                        />

                        {uploadedFiles.length > 0 && (
                            <ul className="space-y-1.5">
                                {uploadedFiles.map((file, index) => (
                                    <li
                                        key={`${file.name}-${index}`}
                                        className="flex items-center justify-between rounded-xl border border-brand-deep/5 bg-brand-deep/[0.03] px-3 py-2 text-xs dark:border-white/5 dark:bg-white/[0.03]"
                                    >
                                        <span className="truncate text-foreground">{file.name}</span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
                                            }
                                            className="text-brand-accent/50 transition-colors hover:text-rose-500"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <label className="flex cursor-pointer items-start gap-2.5 rounded-2xl border border-brand-gold/15 bg-brand-gold/[0.05] p-3.5">
                        <span
                            className={cn(
                                "mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-md border transition-colors duration-200",
                                consent
                                    ? "border-brand-green bg-brand-green text-white dark:border-brand-gold dark:bg-brand-gold"
                                    : "border-brand-deep/25 dark:border-white/25"
                            )}
                        >
                            {consent && <Check className="h-3 w-3" strokeWidth={3} />}
                        </span>
                        <input
                            type="checkbox"
                            checked={consent}
                            onChange={(e) => setConsent(e.target.checked)}
                            className="sr-only"
                        />
                        <span className="text-xs leading-relaxed text-brand-accent/70 dark:text-brand-cream/55">
                            I confirm I own this voice or have explicit permission to clone it, and that its
                            use complies with applicable laws.
                        </span>
                    </label>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={!canSubmit}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create clone
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
