"use client"

import type { ReactElement } from "react"
import { motion } from "framer-motion"
import { File, FileSpreadsheet, FileText, Image } from "lucide-react"
import { cn } from "@/app/lib/utils"
import { Markdown } from "@/app/components/ui/markdown"
import { ToolRenderer } from "./ToolRenderer"
import type {
    AssistantMessage as MessageType,
    AddToolResultFn,
    FileAttachment,
} from "../types"

interface ChatMessageProps {
    message: MessageType
    addToolResult: AddToolResultFn
    isLoading?: boolean
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

export function ChatMessage({ message, addToolResult, isLoading }: ChatMessageProps): ReactElement {
    const isUser = message.role === "user"
    const hasContent = message.parts.some(
        (p) => (p.type === "text" && p.text.trim().length > 0) || p.type === "file" || p.type.startsWith("tool-")
    )

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={cn("flex w-full flex-col", isUser ? "items-end" : "items-start")}
        >
            <div
                className={cn(
                    "text-sm md:text-base leading-relaxed relative overflow-hidden transition-all duration-300",
                    isUser
                        ? "bg-brand-deep text-brand-cream rounded-2xl rounded-br-sm dark:bg-brand-gold dark:text-brand-deep shadow-sm max-w-[85%] md:max-w-[70%] p-5"
                        : "w-full bg-transparent text-brand-deep dark:text-brand-cream px-1"
                )}
            >
                {/* Assistant label */}
                {!isUser && (
                    <div className="mb-2">
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
                                    className={isUser ? "text-brand-cream dark:text-brand-deep prose-invert" : ""}
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
            </div>
        </motion.div>
    )
}
