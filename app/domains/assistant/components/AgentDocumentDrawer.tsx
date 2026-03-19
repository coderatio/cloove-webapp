import { memo, useCallback, useEffect, useState } from "react"
import { FileText, Receipt, Copy, Check, Download } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { cn } from "@/app/lib/utils"
import { Button } from "@/app/components/ui/button"
import { Streamdown } from "streamdown"
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
    // Agent documents are never streamed anymore — they arrive complete.
    // finalContent is set once when the drawer opens or streaming ends.
    const [finalContent, setFinalContent] = useState("")
    const [copied, setCopied] = useState(false)
    const Icon = agent.iconType === "proposal" ? FileText : Receipt

    useEffect(() => {
        if (!open) return
        if (!isStreaming) {
            setFinalContent(getContent())
        }
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
                    ) : finalContent ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            <Streamdown mode="static">{finalContent}</Streamdown>
                        </div>
                    ) : (
                        <p className="text-sm text-brand-deep/40 dark:text-brand-cream/40">No content available.</p>
                    )}
                </DrawerBody>

                <DrawerFooter className="flex-row gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopy}
                        disabled={isStreaming || !finalContent}
                        className="gap-1.5 rounded-xl"
                    >
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        Copy
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportMarkdown}
                        disabled={isStreaming || !finalContent}
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
