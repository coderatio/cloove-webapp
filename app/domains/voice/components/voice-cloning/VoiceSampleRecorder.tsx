"use client"

import * as React from "react"
import { Mic, Square, Trash2, Play, Pause } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/app/components/ui/button"
import { cn } from "@/app/lib/utils"

interface VoiceSampleRecorderProps {
    /** Fired whenever a recording finishes (or is cleared, with null). */
    onSample: (file: File | null) => void
    disabled?: boolean
}

function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, "0")}`
}

/**
 * In-browser microphone recorder. Captures a single take with MediaRecorder,
 * lets the user preview it, and hands the resulting File up via `onSample`.
 * The parent uploads it (via the shared upload service) on submit.
 */
export function VoiceSampleRecorder({ onSample, disabled }: VoiceSampleRecorderProps) {
    const [isRecording, setIsRecording] = React.useState(false)
    const [elapsed, setElapsed] = React.useState(0)
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
    const [isPlaying, setIsPlaying] = React.useState(false)

    const recorderRef = React.useRef<MediaRecorder | null>(null)
    const chunksRef = React.useRef<BlobPart[]>([])
    const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null)
    const audioRef = React.useRef<HTMLAudioElement | null>(null)

    React.useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
            if (previewUrl) URL.revokeObjectURL(previewUrl)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mimeType = MediaRecorder.isTypeSupported("audio/webm")
                ? "audio/webm"
                : "audio/mp4"
            const recorder = new MediaRecorder(stream, { mimeType })
            chunksRef.current = []

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) chunksRef.current.push(event.data)
            }
            recorder.onstop = () => {
                stream.getTracks().forEach((track) => track.stop())
                const blob = new Blob(chunksRef.current, { type: mimeType })
                const ext = mimeType === "audio/webm" ? "webm" : "m4a"
                const file = new File([blob], `voice-sample-${Date.now()}.${ext}`, { type: mimeType })
                if (previewUrl) URL.revokeObjectURL(previewUrl)
                setPreviewUrl(URL.createObjectURL(blob))
                onSample(file)
            }

            recorder.start()
            recorderRef.current = recorder
            setIsRecording(true)
            setElapsed(0)
            timerRef.current = setInterval(() => setElapsed((prev) => prev + 1), 1000)
        } catch {
            toast.error("Microphone access denied. Allow mic access or upload a file instead.")
        }
    }

    const stopRecording = () => {
        recorderRef.current?.stop()
        recorderRef.current = null
        setIsRecording(false)
        if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
        }
    }

    const clearRecording = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
        setElapsed(0)
        setIsPlaying(false)
        onSample(null)
    }

    const togglePlayback = () => {
        if (!audioRef.current) return
        if (isPlaying) audioRef.current.pause()
        else void audioRef.current.play()
    }

    return (
        <div className="rounded-2xl border border-brand-deep/8 bg-brand-deep/[0.02] p-4 dark:border-white/8 dark:bg-white/[0.02]">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div
                        className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300",
                            isRecording
                                ? "bg-rose-500/15 text-rose-500"
                                : "bg-brand-gold/10 text-brand-gold"
                        )}
                    >
                        <Mic className={cn("h-5 w-5", isRecording && "animate-pulse")} />
                    </div>
                    <div className="text-sm">
                        <p className="font-medium text-foreground">
                            {isRecording ? "Recording…" : previewUrl ? "Recorded sample" : "Record a sample"}
                        </p>
                        <p className="text-xs text-brand-accent/60 dark:text-brand-cream/45">
                            {isRecording
                                ? formatDuration(elapsed)
                                : previewUrl
                                  ? `${formatDuration(elapsed)} captured`
                                  : "Speak naturally for 30–60 seconds"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {previewUrl && !isRecording && (
                        <>
                            <Button type="button" variant="ghost" size="icon" onClick={togglePlayback}>
                                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </Button>
                            <Button type="button" variant="ghost" size="icon" onClick={clearRecording}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                    {isRecording ? (
                        <Button type="button" variant="destructive" size="sm" onClick={stopRecording}>
                            <Square className="mr-1.5 h-3.5 w-3.5" /> Stop
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={startRecording}
                            disabled={disabled}
                        >
                            <Mic className="mr-1.5 h-3.5 w-3.5" /> {previewUrl ? "Re-record" : "Record"}
                        </Button>
                    )}
                </div>
            </div>

            {previewUrl && (
                <audio
                    ref={audioRef}
                    src={previewUrl}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                />
            )}
        </div>
    )
}
