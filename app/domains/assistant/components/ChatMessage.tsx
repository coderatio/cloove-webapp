import { useState, useCallback, memo, type ReactElement } from "react"

import { motion } from "framer-motion"
import {
    File,
    FileSpreadsheet,
    FileText,
    Image,
    Copy,
    RotateCcw,
    ThumbsUp,
    ThumbsDown,
    Download,
    MoreHorizontal,
    Check,
    FileCode,
    FileType,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/app/lib/utils"
import { Markdown } from "@/app/components/ui/markdown"
import { ToolRenderer } from "./ToolRenderer"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import { Button } from "@/app/components/ui/button"
import type {
    AssistantMessage as MessageType,
    AddToolResultFn,
    FileAttachment,
} from "../types"

interface ChatMessageProps {
    message: MessageType
    addToolResult: AddToolResultFn
    isLoading?: boolean
    isLast?: boolean
    onRegenerate?: () => void
    onAction?: (action: string, messageId: string) => void
}

function formatFileSize(size: number): string {
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(file: FileAttachment): ReactElement {
    const ext = file.name.split(".").pop()?.toLowerCase()
    if (file.fileType.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp"].includes(ext || "")) {
        return <Image className="h-4 w-4" />
    }
    if (["csv", "xlsx", "xls"].includes(ext || "")) {
        return <FileSpreadsheet className="h-4 w-4" />
    }
    if (ext === "pdf") {
        return <FileText className="h-4 w-4" />
    }
    return <File className="h-4 w-4" />
}

export const ChatMessage = memo(function ChatMessage({
    message,
    addToolResult,
    isLoading,
    isLast,
    onRegenerate,
    onAction,
}: ChatMessageProps): ReactElement {
    const isUser = message.role === "user"
    const [copied, setCopied] = useState(false)
    const [feedback, setFeedback] = useState<"up" | "down" | null>(null)

    const hasContent = message.parts.some(
        (p) => (p.type === "text" && p.text.trim().length > 0) || p.type === "file" || p.type.startsWith("tool-")
    )

    const textContent = message.parts
        .filter((p) => p.type === "text")
        .map((p) => (p as any).text)
        .join("\n")

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(textContent)
        setCopied(true)
        toast.success("Copied to clipboard")
        setTimeout(() => setCopied(false), 2000)
    }, [textContent])

    const handleExport = (type: "pdf" | "md") => {
        if (type === "md") {
            const blob = new Blob([textContent], { type: "text/markdown" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `message-${message.id}.md`
            a.click()
            URL.revokeObjectURL(url)
            toast.success("Exported as Markdown")
        } else {
            toast.info("PDF export coming soon!")
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={cn("flex w-full flex-col group", isUser ? "items-end" : "items-start")}
        >
            <div
                className={cn(
                    "text-sm md:text-base leading-relaxed relative transition-colors duration-300",
                    isUser
                        ? "overflow-hidden bg-linear-to-br from-brand-deep to-brand-accent/90 text-brand-cream rounded-[22px] rounded-br-[4px] border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.08)] max-w-[85%] md:max-w-[75%] px-5 py-4"
                        : "w-full bg-transparent text-brand-deep dark:text-brand-cream px-1"
                )}
            >
                {isUser && (
                    <div className="absolute inset-0 bg-linear-to-tr from-white/5 to-transparent pointer-events-none" />
                )}
                {/* Assistant label */}
                {!isUser && (
                    <div className="mb-2 flex items-center justify-between">
                        <span className="block text-xs font-bold uppercase tracking-wider bg-linear-to-r from-brand-deep to-brand-green dark:from-brand-green dark:to-brand-cream bg-clip-text text-transparent w-fit">
                            Cloove AI
                        </span>
                    </div>
                )}

                {/* Typing indicator when loading with no content */}
                {!isUser && isLoading && !hasContent && (
                    <div className="flex items-center gap-1.5 py-1">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                className="h-1.5 w-1.5 rounded-full bg-brand-green/60"
                                animate={{
                                    y: [0, -4, 0],
                                    opacity: [0.4, 1, 0.4],
                                }}
                                transition={{
                                    duration: 0.8,
                                    repeat: Infinity,
                                    delay: i * 0.15,
                                    ease: "easeInOut",
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Message parts */}
                <div className={cn("relative z-10", isUser ? "pr-2" : "")}>
                    {message.parts.map((part, partIndex) => {
                        if (part.type === "text") {
                            return (
                                <Markdown
                                    key={partIndex}
                                    content={part.text}
                                    className={isUser ? "text-brand-cream prose-invert font-bold prose-strong:text-white prose-a:text-brand-gold prose-table:border-white/15 prose-th:bg-white/10 prose-td:border-white/[0.08]" : ""}
                                    streaming={!!isLoading}
                                />
                            )
                        }
                        if (part.type === "file") {
                            return (
                                <a
                                    key={part.file.id}
                                    href={part.file.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={cn(
                                        "mt-2 inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-medium transition-colors",
                                        isUser
                                            ? "border-white/20 bg-white/10 text-brand-cream hover:bg-white/15"
                                            : "border-brand-deep/10 bg-brand-deep/5 text-brand-deep hover:bg-brand-deep/10 dark:border-white/10 dark:bg-white/5 dark:text-brand-cream dark:hover:bg-white/10"
                                    )}
                                >
                                    <span className="text-brand-cream/80 dark:text-brand-cream/70">
                                        {getFileIcon(part.file)}
                                    </span>
                                    <span className="max-w-[200px] truncate">{part.file.name}</span>
                                    <span className={cn("text-[10px]", isUser ? "text-brand-cream/60" : "text-brand-accent/50 dark:text-brand-cream/50")}>
                                        {formatFileSize(part.file.size)}
                                    </span>
                                </a>
                            )
                        }
                        if (part.type.startsWith("tool-")) {
                            return (
                                <ToolRenderer
                                    key={partIndex}
                                    part={part}
                                    addToolResult={addToolResult}
                                />
                            )
                        }
                        return null
                    })}
                </div>

                {/* Action Toolbar (Assistant only) */}
                {!isUser && hasContent && !isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-1 mt-3 px-1"
                    >
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleCopy}
                            className="h-8 w-8 rounded-lg hover:bg-brand-deep/5 dark:hover:bg-white/5 text-brand-deep/40 dark:text-brand-cream/40 transition-colors"
                            title="Copy"
                        >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setFeedback(feedback === "up" ? null : "up")}
                            className={cn(
                                "h-8 w-8 rounded-lg hover:bg-brand-deep/5 dark:hover:bg-white/5 text-brand-deep/40 dark:text-brand-cream/40 transition-colors",
                                feedback === "up" && "text-emerald-500 bg-emerald-500/5 select-none"
                            )}
                            title="Helpful"
                        >
                            <ThumbsUp className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setFeedback(feedback === "down" ? null : "down")}
                            className={cn(
                                "h-8 w-8 rounded-lg hover:bg-brand-deep/5 dark:hover:bg-white/5 text-brand-deep/40 dark:text-brand-cream/40 transition-colors",
                                feedback === "down" && "text-rose-500 bg-rose-500/5 select-none"
                            )}
                            title="Not helpful"
                        >
                            <ThumbsDown className="w-3.5 h-3.5" />
                        </Button>

                        {isLast && onRegenerate && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onRegenerate}
                                className="h-8 w-8 rounded-lg hover:bg-brand-deep/5 dark:hover:bg-white/5 text-brand-deep/40 dark:text-brand-cream/40 transition-colors"
                                title="Regenerate"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                            </Button>
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg hover:bg-brand-deep/5 dark:hover:bg-white/5 text-brand-deep/40 dark:text-brand-cream/40 transition-colors"
                                    title="More actions"
                                >
                                    <MoreHorizontal className="w-3.5 h-3.5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48 rounded-xl bg-white/80 dark:bg-black/80 backdrop-blur-xl border-brand-deep/5">
                                <DropdownMenuItem onClick={() => handleExport("md")} className="gap-2 focus:bg-brand-deep/5 dark:focus:bg-white/5 rounded-lg cursor-pointer">
                                    <FileCode className="w-4 h-4" />
                                    <span>Export as Markdown</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExport("pdf")} className="gap-2 focus:bg-brand-deep/5 dark:focus:bg-white/5 rounded-lg cursor-pointer">
                                    <FileType className="w-4 h-4" />
                                    <span>Export as PDF</span>
                                </DropdownMenuItem>
                                {onAction && (
                                    <>
                                        <div className="h-px bg-brand-deep/5 dark:bg-white/5 my-1" />
                                        <DropdownMenuItem onClick={() => onAction("create-proposal", message.id)} className="gap-2 focus:bg-brand-deep/5 dark:focus:bg-white/5 rounded-lg cursor-pointer">
                                            <FileText className="w-4 h-4 text-brand-green" />
                                            <span>Create Proposal</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onAction("create-invoice", message.id)} className="gap-2 focus:bg-brand-deep/5 dark:focus:bg-white/5 rounded-lg cursor-pointer">
                                            <span className="font-bold text-xs text-brand-gold w-4 text-center">₦</span>
                                            <span>Create Invoice</span>
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </motion.div>
                )}
            </div>
        </motion.div>
    )
}, (prev, next) => {
    if (prev.isLoading !== next.isLoading) return false
    if (prev.isLast !== next.isLast) return false
    if (prev.message.id !== next.message.id) return false
    if (prev.message.parts.length !== next.message.parts.length) return false
    // For the streaming message, compare the last part's text
    const lp = prev.message.parts[prev.message.parts.length - 1]
    const ln = next.message.parts[next.message.parts.length - 1]
    if (lp?.type !== ln?.type) return false
    if (lp?.type === "text" && ln?.type === "text") {
        return (lp as any).text === (ln as any).text
    }
    if (lp?.type?.startsWith("tool-") && ln?.type?.startsWith("tool-")) {
        return (lp as any).state === (ln as any).state
    }
    return true
})

