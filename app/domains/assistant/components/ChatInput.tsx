"use client"

import { useEffect, useRef, useState, type ReactElement } from "react"
import {
    ArrowUp,
    Camera,
    File,
    FileSpreadsheet,
    FileText,
    Image,
    Loader2,
    Plus,
    Sparkles,
    Square,
    Upload,
    X,
} from "lucide-react"
import { cn } from "@/app/lib/utils"
import { Button } from "@/app/components/ui/button"
import { GlassCard } from "@/app/components/ui/glass-card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import { CameraDialog } from "./CameraDialog"
import { AgentSelector } from "./AgentSelector"
import { uploadService } from "@/app/lib/upload/upload-service"
import { toast } from "sonner"
import type { FileAttachment } from "../types"
import type { AgentDefinition } from "../lib/agent-config"

const MAX_ATTACHMENTS = 3
const MAX_FILE_SIZE_MB = 10
const MAX_TEXTAREA_HEIGHT = 180
const ANALYSIS_HINT = "Please analyze the attached files."
const ACCEPTED_EXTENSIONS = ["pdf", "csv", "xlsx", "xls", "png", "jpg", "jpeg", "gif", "webp"]

interface SendOptions {
    attachments?: FileAttachment[]
    analysis?: boolean
    agentType?: string | null
}

interface ChatInputProps {
    onSend: (text: string, options?: SendOptions) => void
    disabled?: boolean
    isStreaming?: boolean
    onStop?: () => void
    className?: string
    focusTrigger?: string | null
    /** When true, suppress auto-focus on streaming completion (regeneration in progress) */
    isRegenerating?: boolean
    /** When set, the input is in agent mode and should not show the agent selector */
    activeAgentType?: string | null
    /** Callback when the input container height changes */
    onHeightChange?: (height: number) => void
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

export function ChatInput({ onSend, disabled = false, isStreaming = false, onStop, className, focusTrigger, isRegenerating = false, activeAgentType, onHeightChange }: ChatInputProps): ReactElement {
    const [input, setInput] = useState("")
    const [files, setFiles] = useState<File[]>([])
    const [previews, setPreviews] = useState<Record<string, string>>({})
    const [analysisEnabled, setAnalysisEnabled] = useState(true)
    const [isUploading, setIsUploading] = useState(false)
    const [cameraOpen, setCameraOpen] = useState(false)
    const [selectedAgent, setSelectedAgent] = useState<AgentDefinition | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const canSend = (input.trim().length > 0 || files.length > 0) && !disabled && !isUploading
    const analysisAllowed = files.length > 0 && !disabled && !isUploading

    // Report height changes to parent
    useEffect(() => {
        if (!containerRef.current || !onHeightChange) return

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                onHeightChange(entry.contentRect.height)
            }
        })

        observer.observe(containerRef.current)
        return () => observer.disconnect()
    }, [onHeightChange])

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
                agentType: selectedAgent?.id ?? undefined,
            })
            setInput("")
            setFiles([])
            setAnalysisEnabled(true)
            setSelectedAgent(null)
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
        const fileToRemove = files[index]
        setFiles((prev) => prev.filter((_, i) => i !== index))
        
        // Cleanup preview URL if it exists
        const previewUrl = previews[fileToRemove.name]
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl)
            setPreviews(prev => {
                const next = { ...prev }
                delete next[fileToRemove.name]
                return next
            })
        }
    }

    useEffect(() => {
        // Generate previews for images
        files.forEach(file => {
            if (file.type.startsWith("image/") && !previews[file.name]) {
                const url = URL.createObjectURL(file)
                setPreviews(prev => ({ ...prev, [file.name]: url }))
            }
        })

        return () => {
            // No need to cleanup here as we cleanup on removal
        }
    }, [files, previews])

    // Final cleanup on unmount
    useEffect(() => {
        return () => {
            Object.values(previews).forEach(URL.revokeObjectURL)
        }
    }, [])

    function triggerFilePicker(): void {
        if (disabled || isUploading) return
        fileInputRef.current?.click()
    }

    function triggerCamera(): void {
        if (disabled || isUploading) return
        setCameraOpen(true)
    }

    useEffect(() => {
        if (!inputRef.current) return
        inputRef.current.style.height = "auto"
        inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`
    }, [input])

    useEffect(() => {
        if (files.length === 0) setAnalysisEnabled(true)
    }, [files.length])
    
    // Use a ref so that the isRegenerating true→false transition (which happens
    // after the capture effect clears it) does NOT itself re-trigger the focus.
    // Only focusTrigger / disabled / isStreaming changes should re-evaluate focus.
    const isRegeneratingRef = useRef(isRegenerating)
    useEffect(() => {
        isRegeneratingRef.current = isRegenerating
    }, [isRegenerating])

    useEffect(() => {
        if (!disabled && !isStreaming && !isRegeneratingRef.current) {
            inputRef.current?.focus()
        }
    }, [focusTrigger, disabled, isStreaming])

    // Determine effective agent: either from parent (existing agent chat) or local selection
    const effectiveAgent = activeAgentType ? null : selectedAgent
    const showAgentSelector = !activeAgentType

    return (
        <div className={cn("w-full", className)} ref={containerRef}>
            <GlassCard className={cn(
                "rounded-[28px] border bg-white/90 dark:bg-black/40 shadow-[0_12px_30px_rgba(16,24,40,0.08)] backdrop-blur-xl transition-all duration-500",
                effectiveAgent
                    ? cn(effectiveAgent.colors.border, effectiveAgent.colors.glow, "shadow-lg")
                    : "border-brand-deep/10 dark:border-white/10"
            )}>
                <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-3 sm:p-4">
                    {/* Agent Selector — only shown in regular chat mode */}
                    {showAgentSelector && (
                        <AgentSelector
                            selectedAgent={selectedAgent}
                            onSelect={setSelectedAgent}
                            disabled={disabled || isUploading}
                        />
                    )}

                    {/* Active agent badge — shown when in agent mode */}
                    {activeAgentType && (
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-brand-deep/5 dark:bg-white/5 text-brand-deep/60 dark:text-brand-cream/60 border border-brand-deep/10 dark:border-white/10">
                                <Sparkles className="w-3 h-3" />
                                Agent mode — refine your document
                            </span>
                        </div>
                    )}

                    {files.length > 0 && (
                        <div className="flex flex-nowrap gap-2 px-1 overflow-x-auto scrollbar-hide pb-0.5">
                            {files.map((file, index) => {
                                const isImage = file.type.startsWith("image/")
                                const preview = previews[file.name]

                                return (
                                    <div
                                        key={`${file.name}-${file.size}`}
                                        className="group relative flex items-center shrink-0 h-14 pl-2 pr-4 gap-2.5 rounded-full border border-brand-deep/10 bg-white/50 dark:bg-black/20 dark:border-white/10 backdrop-blur-md transition-all hover:border-brand-gold/40 hover:bg-white/80 dark:hover:bg-black/40 shadow-sm"
                                    >
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full overflow-hidden bg-brand-deep/5 dark:bg-white/15 text-brand-deep/60 dark:text-brand-cream/60 shadow-inner shrink-0 border border-black/5 dark:border-white/5">
                                            {isImage && preview ? (
                                                <img src={preview} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                getFileIcon(file)
                                            )}
                                        </div>
                                        <div className="flex flex-col min-w-0 max-w-[90px] sm:max-w-[110px]">
                                            <span className="truncate text-[11px] font-bold text-brand-deep dark:text-brand-cream leading-tight">
                                                {file.name}
                                            </span>
                                            <span className="text-[9px] font-medium text-brand-accent/50 dark:text-brand-cream/40 px-1 py-0.5 rounded bg-brand-deep/5 dark:bg-white/5 w-fit">
                                                {formatFileSize(file.size)}
                                            </span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            type="button"
                                            onClick={() => removeFile(index)}
                                            className="h-5 w-5 rounded-full text-brand-accent/40 hover:text-red-500 hover:bg-red-50 dark:text-brand-cream/30 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-colors"
                                            aria-label={`Remove ${file.name}`}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    <div className="flex items-end gap-2 rounded-full border border-transparent bg-white/80 px-2.5 py-1.5 shadow-[0_4px_12px_rgba(15,23,42,0.06)] dark:bg-white/5">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    asChild
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "h-10 w-10 rounded-full border transition-all duration-200 flex items-center justify-center shrink-0 p-0",
                                        disabled || isUploading || files.length >= MAX_ATTACHMENTS
                                            ? "border-brand-deep/5 bg-brand-deep/2 text-brand-deep/20 cursor-not-allowed dark:border-white/5 dark:bg-white/2 dark:text-brand-cream/20"
                                            : "border-brand-deep/15 bg-brand-deep/5 text-brand-deep hover:bg-brand-deep/10 hover:border-brand-gold/40 dark:border-white/10 dark:bg-white/5 dark:text-brand-cream dark:hover:bg-white/10"
                                    )}
                                    disabled={disabled || isUploading || files.length >= MAX_ATTACHMENTS}
                                >
                                    <button type="button" aria-label="Attach files">
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-56 p-2 rounded-2xl shadow-xl backdrop-blur-xl border-brand-green/10 dark:border-brand-gold/10">
                                <div className="p-1 space-y-1">
                                    <DropdownMenuItem className="p-0 bg-transparent focus:bg-transparent" onSelect={triggerCamera}>
                                        <Button 
                                            variant="ghost" 
                                            className="w-full justify-start gap-4 h-auto py-3 px-4 rounded-xl hover:bg-brand-green/5 dark:hover:bg-brand-gold/5"
                                        >
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gold/10 text-brand-gold shrink-0">
                                                <Camera className="h-5 w-5" />
                                            </div>
                                            <div className="flex flex-col items-start overflow-hidden">
                                                <span className="font-medium text-[15px]">Open Camera</span>
                                                <span className="text-[11px] text-brand-accent/40 dark:text-brand-cream/40 truncate">Take a photo of a document</span>
                                            </div>
                                        </Button>
                                    </DropdownMenuItem>
                                    
                                    <DropdownMenuItem className="p-0 bg-transparent focus:bg-transparent" onSelect={triggerFilePicker}>
                                        <Button 
                                            variant="ghost" 
                                            className="w-full justify-start gap-4 h-auto py-3 px-4 rounded-xl hover:bg-brand-green/5 dark:hover:bg-brand-gold/5"
                                        >
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-deep/5 text-brand-deep dark:bg-white/5 dark:text-brand-cream shrink-0">
                                                <Upload className="h-5 w-5" />
                                            </div>
                                            <div className="flex flex-col items-start overflow-hidden">
                                                <span className="font-medium text-[15px]">Upload File</span>
                                                <span className="text-[11px] text-brand-accent/40 dark:text-brand-cream/40 truncate">PDF, Excel, CSV, or Image</span>
                                            </div>
                                        </Button>
                                    </DropdownMenuItem>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={effectiveAgent?.placeholder ?? "Ask anything"}
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
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => analysisAllowed && setAnalysisEnabled((prev) => !prev)}
                                className={cn(
                                    "inline-flex items-center gap-2 rounded-full border h-7 px-3 text-[11px] font-semibold transition-all hover:bg-transparent",
                                    analysisAllowed && analysisEnabled
                                        ? "border-brand-gold/40 bg-brand-gold/10 text-brand-deep dark:text-brand-gold hover:bg-brand-gold/20"
                                        : "border-brand-deep/10 bg-brand-deep/5 text-brand-accent/50 dark:border-white/10 dark:bg-white/5 dark:text-brand-cream/50 hover:bg-brand-deep/10",
                                    !analysisAllowed && "cursor-not-allowed opacity-50"
                                )}
                                aria-pressed={analysisAllowed && analysisEnabled}
                                disabled={!analysisAllowed}
                            >
                                <Sparkles className="h-3 w-3" />
                                {getAnalysisLabel(analysisAllowed, analysisEnabled)}
                            </Button>
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
 
                <CameraDialog 
                    open={cameraOpen}
                    onOpenChange={setCameraOpen}
                    onCapture={(file) => addFiles([file])}
                />
            </GlassCard>
        </div>
    )
}
