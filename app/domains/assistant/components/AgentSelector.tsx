"use client"

import { type ReactElement } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FileText, Receipt, X } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/app/lib/utils"
import { AGENTS, type AgentDefinition } from "../lib/agent-config"

interface AgentSelectorProps {
    selectedAgent: AgentDefinition | null
    onSelect: (agent: AgentDefinition | null) => void
    disabled?: boolean
}

function AgentIcon({ type, className }: { type: AgentDefinition["iconType"]; className?: string }) {
    switch (type) {
        case "proposal":
            return <FileText className={className} />
        case "invoice":
            return <Receipt className={className} />
    }
}

export function AgentSelector({ selectedAgent, onSelect, disabled }: AgentSelectorProps): ReactElement {
    return (
        <div className="flex items-center gap-2 flex-wrap">
            <AnimatePresence mode="popLayout">
                {AGENTS.map((agent) => {
                    const isSelected = selectedAgent?.id === agent.id
                    return (
                        <motion.button
                            key={agent.id}
                            type="button"
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            disabled={disabled}
                            onClick={() => toast.info("Coming soon", { description: `${agent.name} is not available yet. Check back soon!` })}
                            className={cn(
                                "inline-flex cursor-pointer items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-300 border",
                                "disabled:opacity-40 disabled:cursor-not-allowed",
                                isSelected
                                    ? cn(agent.colors.bg, agent.colors.border, agent.colors.text, "shadow-md", agent.colors.glow)
                                    : cn(
                                        "bg-brand-deep/5 dark:bg-white/5 border-brand-deep/10 dark:border-white/10",
                                        "text-brand-deep/60 dark:text-brand-cream/60",
                                        "hover:bg-brand-deep/10 dark:hover:bg-white/10",
                                        "hover:border-brand-deep/20 dark:hover:border-white/20"
                                    )
                            )}
                        >
                            <AgentIcon type={agent.iconType} className="w-3.5 h-3.5" />
                            <span>{agent.shortName}</span>
                            {isSelected && (
                                <X className="w-3 h-3 ml-0.5 opacity-60" />
                            )}
                        </motion.button>
                    )
                })}
            </AnimatePresence>
        </div>
    )
}
