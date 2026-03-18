import { memo } from "react"
import { FileText, Receipt, ExternalLink } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/app/lib/utils"
import { Button } from "@/app/components/ui/button"
import type { AgentDefinition } from "../lib/agent-config"

interface AgentDocumentCardProps {
    agent: AgentDefinition
    isStreaming: boolean
    onOpen: () => void
}

export const AgentDocumentCard = memo(function AgentDocumentCard({
    agent,
    isStreaming,
    onOpen,
}: AgentDocumentCardProps) {
    const Icon = agent.iconType === "proposal" ? FileText : Receipt

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={cn(
                "inline-flex items-center gap-3 rounded-2xl border px-4 py-3 mt-1",
                "bg-white/60 dark:bg-black/30 backdrop-blur-sm",
                agent.colors.border
            )}
        >
            {/* Icon */}
            <div className={cn("flex items-center justify-center h-9 w-9 rounded-xl shrink-0", agent.colors.bg)}>
                <Icon className={cn("h-4 w-4", agent.colors.text)} />
            </div>

            {/* Label + status */}
            <div className="flex flex-col min-w-0">
                <span className={cn("text-sm font-semibold leading-none", agent.colors.text)}>
                    {agent.shortName}
                </span>
                <span className="text-xs text-brand-deep/50 dark:text-brand-cream/50 mt-0.5 leading-none">
                    {isStreaming ? (
                        <span className="inline-flex items-center gap-1">
                            <motion.span
                                animate={{ opacity: [0.4, 1, 0.4] }}
                                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                Generating...
                            </motion.span>
                        </span>
                    ) : (
                        "Document ready"
                    )}
                </span>
            </div>

            {/* Open button */}
            <Button
                variant="ghost"
                size="sm"
                onClick={onOpen}
                className={cn(
                    "h-7 px-2.5 rounded-lg text-xs font-medium gap-1 shrink-0",
                    agent.colors.text,
                    agent.colors.bg,
                    agent.colors.bgHover,
                )}
            >
                <ExternalLink className="h-3 w-3" />
                Open
            </Button>
        </motion.div>
    )
})
