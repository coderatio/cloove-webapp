"use client"

import { useEffect, useRef, useState, type ReactElement } from "react"
import {
    ArrowUp,
    File,
    FileSpreadsheet,
    FileText,
    Image,
    Loader2,
    Paperclip,
    Sparkles,
    Square,
    X,
} from "lucide-react"
import { cn } from "@/app/lib/utils"
import { Button } from "@/app/components/ui/button"
import { GlassCard } from "@/app/components/ui/glass-card"
import { uploadService } from "@/app/lib/upload/upload-service"
import { toast } from "sonner"
import type { FileAttachment } from "../types"

const MAX_ATTACHMENTS = 3
const MAX_FILE_SIZE_MB = 10
const MAX_TEXTAREA_HEIGHT = 180
const ANALYSIS_HINT = "Please analyze the attached files."
const ACCEPTED_EXTENSIONS = ["pdf", "csv", "xlsx", "xls", "png", "jpg", "jpeg", "gif", "webp"]

interface SendOptions {
    attachments?: FileAttachment[]
    analysis?: boolean
}

interface ChatInputProps {
    onSend: (text: string, options?: SendOptions) => void
    disabled?: boolean
    isStreaming?: boolean
    onStop?: () => void
    className?: string
}

function formatFileSize(size: number): string {
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function getFileExtension(filename: string): string {
    return filename.split(".").pop()?.toLowerCase() || ""
}

function isFileAccepted(file: File): boolean {
    if (file.type.startsWith("image/")) return true
    return ACCEPTED_EXTENSIONS.includes(getFileExtension(file.name))
}

function getFileIcon(file: File): ReactElement {
    const ext = getFileExtension(file.name)
    if (file.type.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) {
        return <Image className="h-4 w-4" />
    }
    if (["csv", "xlsx", "xls"].includes(ext)) {
        return <FileSpreadsheet className="h-4 w-4" />
    }
    if (ext === "pdf") {
        return <FileText className="h-4 w-4" />
    }
    return <File className="h-4 w-4" />
}

function getAnalysisLabel(isAllowed: boolean, isEnabled: boolean): string {
    if (!isAllowed) return "Analyze"
    if (isEnabled) return "Analyze on"
    return "Analyze off"
}

export function ChatInput({ onSend, disabled = false, isStreaming = false, onStop, className }: ChatInputProps): ReactElement {
    const [input, setInput] = useState("")
    const [files, setFiles] = useState<File[]>([])
    const [analysisEnabled, setAnalysisEnabled] = useState(true)
    const [isUploading, setIsUploading] = useState(false)
    const inputRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const canSend = (input.trim().length > 0 || files.length > 0) && !disabled && !isUploading
    const analysisAllowed = files.length > 0 && !disabled && !isUploading

    function handleSubmit(e: React.FormEvent): void {
        e.preventDefault()
        if (!canSend) return

        void sendMessageWithUploads()
    }

    function handleKeyDown(e: React.KeyboardEvent): void {
        if (e.key !== "Enter" || e.shiftKey) return
        e.preventDefault()
        handleSubmit(e)
    }

    async function sendMessageWithUploads(): Promise<void> {
        setIsUploading(true)
        try {
            const trimmed = input.trim()
            const attachments = await uploadFiles()
            const hint = attachments.length > 0 && analysisEnabled ? ANALYSIS_HINT : ""
            const messageText = [trimmed, hint].filter(Boolean).join("\n\n")

            if (!messageText && attachments.length === 0) return

            onSend(messageText, {
                attachments: attachments.length > 0 ? attachments : undefined,
                analysis: attachments.length > 0 ? analysisEnabled : undefined,
            })
            setInput("")
            setFiles([])
            setAnalysisEnabled(true)
            if (fileInputRef.current) fileInputRef.current.value = ""
        } catch (error) {
            toast.error("Failed to upload files. Please try again.")
        } finally {
            setIsUploading(false)
        }
    }

    async function uploadFiles(): Promise<FileAttachment[]> {
        if (files.length === 0) return []

        const uploads = await Promise.all(
            files.map(async (file, index) => {
                const url = await uploadService.uploadFile(file)
                return {
                    id: `${Date.now()}-${index}-${file.name}`,
                    name: file.name,
                    size: file.size,
                    fileType: file.type,
                    url,
                }
            })
        )
        return uploads
    }

    function addFiles(selected: FileList | File[]): void {
        const incoming = Array.from(selected)
        const nextFiles = [...files]

        for (const file of incoming) {
            if (nextFiles.length >= MAX_ATTACHMENTS) {
                toast.error(`You can upload up to ${MAX_ATTACHMENTS} files.`)
                break
            }
            if (!isFileAccepted(file)) {
                toast.error("Unsupported file type. Upload images, PDF, CSV, or Excel.")
                continue
            }
            if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
                toast.error(`File too large. Max size is ${MAX_FILE_SIZE_MB}MB.`)
                continue
            }
            const isDuplicate = nextFiles.some((existing) => existing.name === file.name && existing.size === file.size)
            if (isDuplicate) continue
            nextFiles.push(file)
        }

        setFiles(nextFiles)
    }

    function handleFileInput(e: React.ChangeEvent<HTMLInputElement>): void {
        if (!e.target.files?.length) return
        addFiles(e.target.files)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    function removeFile(index: number): void {
        setFiles((prev) => prev.filter((_, i) => i !== index))
    }

    function triggerFilePicker(): void {
        if (disabled || isUploading) return
        fileInputRef.current?.click()
    }

    useEffect(() => {
        if (!inputRef.current) return
        inputRef.current.style.height = "auto"
        inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`
    }, [input])

    useEffect(() => {
        if (files.length === 0) setAnalysisEnabled(true)
    }, [files.length])

    return (
        <div className={cn("w-full", className)}>
            <GlassCard className="rounded-[28px] border border-brand-deep/10 dark:border-white/10 bg-white/90 dark:bg-black/40 shadow-[0_12px_30px_rgba(16,24,40,0.08)] backdrop-blur-xl">
                <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-3 sm:p-4">
                    {files.length > 0 && (
                        <div className="flex flex-wrap gap-2 px-1">
                            {files.map((file, index) => (
                                <div
                                    key={`${file.name}-${file.size}`}
                                    className="inline-flex items-center gap-2 rounded-full border border-brand-deep/10 bg-brand-deep/5 px-3 py-1.5 text-xs font-medium text-brand-deep dark:border-white/10 dark:bg-white/5 dark:text-brand-cream"
                                >
                                    <span className="text-brand-deep/70 dark:text-brand-cream/70">
                                        {getFileIcon(file)}
                                    </span>
                                    <span className="max-w-[160px] truncate">{file.name}</span>
                                    <span className="text-[10px] text-brand-accent/40 dark:text-brand-cream/40">
                                        {formatFileSize(file.size)}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => removeFile(index)}
                                        className="rounded-full p-1 text-brand-accent/40 hover:text-brand-deep dark:text-brand-cream/40 dark:hover:text-brand-cream"
                                        aria-label={`Remove ${file.name}`}
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex items-end gap-2 rounded-full border border-transparent bg-white/80 px-2.5 py-1.5 shadow-[0_4px_12px_rgba(15,23,42,0.06)] dark:bg-white/5">
                        <button
                            type="button"
                            onClick={triggerFilePicker}
                            className={cn(
                                "h-10 w-10 rounded-full border transition-all duration-200 flex items-center justify-center",
                                disabled || isUploading
                                    ? "border-brand-deep/10 bg-brand-deep/5 text-brand-deep/30 dark:border-white/10 dark:bg-white/5 dark:text-brand-cream/30"
                                    : "border-brand-deep/15 bg-brand-deep/5 text-brand-deep hover:bg-brand-deep/10 hover:border-brand-gold/40 dark:border-white/10 dark:bg-white/5 dark:text-brand-cream dark:hover:bg-white/10"
                            )}
                            aria-label="Attach files"
                        >
                            <Paperclip className="h-4 w-4" />
                        </button>

                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask anything"
                            rows={1}
                            className={cn(
                                "flex-1 bg-transparent border-none outline-none focus:ring-0 resize-none",
                                "text-brand-deep dark:text-brand-cream",
                                "placeholder:text-brand-deep/40 dark:placeholder:text-brand-cream/40",
                                "min-h-[44px] max-h-[180px] py-2.5 text-[15px] leading-relaxed",
                                "overflow-hidden scrollbar-hide"
                            )}
                        />

                        {isStreaming ? (
                            <Button
                                size="icon"
                                type="button"
                                onClick={onStop}
                                className="h-10 w-10 rounded-full transition-all duration-300 shrink-0 mb-0.5 bg-red-500 text-white hover:bg-red-600 shadow-md"
                                aria-label="Stop generating"
                            >
                                <Square className="h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                size="icon"
                                type="submit"
                                disabled={!canSend}
                                className={cn(
                                    "h-10 w-10 rounded-full transition-all duration-300 shrink-0 mb-0.5",
                                    canSend
                                        ? "bg-brand-gold text-brand-deep hover:bg-brand-gold/90 shadow-md"
                                        : "bg-zinc-100 text-zinc-400 dark:bg-white/10 dark:text-white/30"
                                )}
                            >
                                {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] text-brand-accent/40 dark:text-brand-cream/40">
                            {files.length > 0
                                ? `${files.length}/${MAX_ATTACHMENTS} files attached`
                                : "Attach up to 3 files (PDF, CSV, Excel, images)"}
                        </span>
                        {files.length > 0 && (
                            <button
                                type="button"
                                onClick={() => analysisAllowed && setAnalysisEnabled((prev) => !prev)}
                                className={cn(
                                    "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold transition-all",
                                    analysisAllowed && analysisEnabled
                                        ? "border-brand-gold/40 bg-brand-gold/10 text-brand-deep"
                                        : "border-brand-deep/10 bg-brand-deep/5 text-brand-accent/50 dark:border-white/10 dark:bg-white/5 dark:text-brand-cream/50",
                                    !analysisAllowed && "cursor-not-allowed"
                                )}
                                aria-pressed={analysisAllowed && analysisEnabled}
                            >
                                <Sparkles className="h-3 w-3" />
                                {getAnalysisLabel(analysisAllowed, analysisEnabled)}
                            </button>
                        )}
                    </div>
                </form>
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*,.pdf,.csv,.xlsx,.xls"
                    onChange={handleFileInput}
                    disabled={disabled || isUploading}
                />
            </GlassCard>
        </div>
    )
}
