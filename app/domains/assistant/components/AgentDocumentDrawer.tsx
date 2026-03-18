import { memo, useCallback, useEffect, useState } from "react"
import { FileText, Receipt, Copy, Check, Download } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { cn } from "@/app/lib/utils"
import { Button } from "@/app/components/ui/button"
import { Markdown } from "@/app/components/ui/markdown"
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerBody,
    DrawerFooter,
    DrawerTitle,
} from "@/app/components/ui/drawer"
import type { AgentDefinition } from "../lib/agent-config"

interface AgentDocumentDrawerProps {
    agent: AgentDefinition
    /** Stable callback — reads from a ref, never changes reference */
    getContent: () => string
    isStreaming: boolean
    open: boolean
    onOpenChange: (open: boolean) => void
}

export const AgentDocumentDrawer = memo(function AgentDocumentDrawer({
    agent,
    getContent,
    isStreaming,
    open,
    onOpenChange,
}: AgentDocumentDrawerProps) {
    // streamingText: plain pre-formatted text shown while streaming (no markdown parsing).
    // finalContent: rendered with full ReactMarkdown after streaming ends.
    const [streamingText, setStreamingText] = useState("")
    const [finalContent, setFinalContent] = useState("")
    const [copied, setCopied] = useState(false)
    const Icon = agent.iconType === "proposal" ? FileText : Receipt

    useEffect(() => {
        if (!open) return

        if (!isStreaming) {
            // Streaming ended (or historical doc): render full Markdown once.
            // ReactMarkdown does a single expensive parse here, which is fine.
            setFinalContent(getContent())
            setStreamingText("")
            return
        }

        // Streaming active: poll at 150ms intervals and show as plain pre-formatted text.
        // Avoids ReactMarkdown's AST parse (50-100ms for 16K chars) that would block the
        // main thread. The throttled messages from useAssistantChat already batch updates
        // to 100ms intervals, so polling at 150ms matches that cadence.
        const update = () => setStreamingText(getContent())
        update()
        const id = setInterval(update, 150)
        return () => clearInterval(id)
    }, [open, isStreaming, getContent])

    const handleCopy = useCallback(() => {
        const text = getContent()
        if (!text) return
        navigator.clipboard.writeText(text)
        setCopied(true)
        toast.success("Copied to clipboard")
        setTimeout(() => setCopied(false), 2000)
    }, [getContent])

    const handleExportMarkdown = useCallback(() => {
        const text = getContent()
        if (!text) return
        const blob = new Blob([text], { type: "text/markdown" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${agent.id}-${Date.now()}.md`
        a.click()
        URL.revokeObjectURL(url)
        toast.success("Exported as Markdown")
    }, [getContent, agent.id])

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent>
                <DrawerStickyHeader>
                    <div className="flex items-center gap-3">
                        <div className={cn("flex items-center justify-center h-9 w-9 rounded-xl shrink-0", agent.colors.bg)}>
                            <Icon className={cn("h-4 w-4", agent.colors.text)} />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <DrawerTitle className="text-xl">{agent.name}</DrawerTitle>
                            <div className="mt-0.5">
                                {isStreaming ? (
                                    <motion.span
                                        animate={{ opacity: [0.5, 1, 0.5] }}
                                        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                                        className={cn("text-xs font-medium", agent.colors.text)}
                                    >
                                        Generating…
                                    </motion.span>
                                ) : (
                                    <span className={cn("text-xs font-medium", agent.colors.text)}>
                                        Complete
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </DrawerStickyHeader>

                <DrawerBody>
                    {isStreaming ? (
                        // Pre-formatted plain text during streaming.
                        // This is a single text-node update — no AST parsing, no React
                        // child reconciliation. Fast even for 16K+ character documents.
                        streamingText ? (
                            <pre className="text-sm text-brand-deep/80 dark:text-brand-cream/80 whitespace-pre-wrap font-sans leading-relaxed break-words">
                                {streamingText}
                            </pre>
                        ) : (
                            <div className="flex items-center gap-2 py-4 text-brand-deep/40 dark:text-brand-cream/40">
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="h-1.5 w-1.5 rounded-full bg-current"
                                        animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                                    />
                                ))}
                            </div>
                        )
                    ) : finalContent ? (
                        // Full Markdown rendered once after streaming completes.
                        <Markdown content={finalContent} />
                    ) : (
                        <p className="text-sm text-brand-deep/40 dark:text-brand-cream/40">No content available.</p>
                    )}
                </DrawerBody>

                <DrawerFooter className="flex-row gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopy}
                        disabled={isStreaming || (!streamingText && !finalContent)}
                        className="gap-1.5 rounded-xl"
                    >
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        Copy
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportMarkdown}
                        disabled={isStreaming || (!streamingText && !finalContent)}
                        className="gap-1.5 rounded-xl"
                    >
                        <Download className="h-3.5 w-3.5" />
                        Export Markdown
                    </Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}, (prev, next) => {
    // Skip parent-triggered re-renders unless streaming status, open state, or agent changes.
    // Content is pulled by getContent() from a ref — never changes reference.
    return (
        prev.open === next.open &&
        prev.isStreaming === next.isStreaming &&
        prev.agent === next.agent &&
        prev.getContent === next.getContent &&
        prev.onOpenChange === next.onOpenChange
    )
})
