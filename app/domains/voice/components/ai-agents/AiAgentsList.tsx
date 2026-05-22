"use client"

import { useState } from "react"
import {
    BadgeCheck,
    Brain,
    Copy,
    MoreVertical,
    Pause,
    Phone,
    Play,
    Plus,
    Sparkles,
    Star,
    Trash2,
    Wrench,
} from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { GlassCard } from "@/app/components/ui/glass-card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import { Skeleton } from "@/app/components/ui/skeleton"
import { cn } from "@/app/lib/utils"
import {
    useDeleteVoiceAiAgent,
    useDuplicateVoiceAiAgent,
    useSetDefaultVoiceAiAgent,
    useUpdateVoiceAiAgent,
    useVoiceAiAgents,
    type AiAgentItem,
} from "@/app/domains/voice/hooks/useVoice"
import { AiAgentEditor } from "@/app/domains/voice/components/ai-agents/AiAgentEditor"

export function AiAgentsList() {
    const { data, isLoading } = useVoiceAiAgents()
    const agents = data ?? []
    const setDefault = useSetDefaultVoiceAiAgent()
    const duplicate = useDuplicateVoiceAiAgent()
    const destroy = useDeleteVoiceAiAgent()
    const update = useUpdateVoiceAiAgent()
    const [editorOpen, setEditorOpen] = useState(false)
    const [editing, setEditing] = useState<AiAgentItem | null>(null)

    const openCreate = () => {
        setEditing(null)
        setEditorOpen(true)
    }

    const openEdit = (agent: AiAgentItem) => {
        setEditing(agent)
        setEditorOpen(true)
    }

    return (
        <GlassCard className="rounded-[2rem] border-black/5 p-5 space-y-5 dark:border-white/10">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black/5 dark:bg-white/5">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <h2 className="text-lg font-semibold">AI agents</h2>
                    </div>
                    <p className="mt-2 max-w-md text-sm text-muted-foreground">
                        Each AI agent answers calls with its own persona, tone, and tool set. Link agents to numbers to control who picks up.
                    </p>
                </div>
                <Button
                    type="button"
                    onClick={openCreate}
                    className="h-10 rounded-full bg-brand-deep px-3 text-sm font-medium text-brand-gold-300 shadow-sm hover:bg-brand-deep/92 hover:text-brand-gold-200 dark:bg-brand-gold dark:text-brand-deep dark:hover:bg-brand-gold/92 dark:hover:text-brand-deep sm:px-4"
                >
                    <Plus className="h-4 w-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">New agent</span>
                </Button>
            </div>

            {isLoading ? (
                <div className="grid gap-3 sm:grid-cols-2">
                    <Skeleton className="h-32 rounded-2xl" />
                    <Skeleton className="h-32 rounded-2xl" />
                </div>
            ) : agents.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-black/10 p-8 text-center dark:border-white/10">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
                        <Brain className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="mt-4 text-sm font-medium">No AI agents yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Create your first agent to start answering calls with AI.
                    </p>
                    <Button onClick={openCreate} className="mt-4 rounded-full">
                        <Plus className="mr-1.5 h-4 w-4" />
                        Create agent
                    </Button>
                </div>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                    {agents.map((agent) => (
                        <AgentCard
                            key={agent.id}
                            agent={agent}
                            onEdit={() => openEdit(agent)}
                            onSetDefault={() => setDefault.mutate(agent.id)}
                            onDuplicate={() => duplicate.mutate({ id: agent.id })}
                            onSetStatus={(status) =>
                                update.mutate({ id: agent.id, payload: { status } })
                            }
                            onDelete={() => {
                                if (window.confirm(`Delete "${agent.name}"? This cannot be undone.`)) {
                                    destroy.mutate(agent.id)
                                }
                            }}
                        />
                    ))}
                </div>
            )}

            <AiAgentEditor open={editorOpen} onOpenChange={setEditorOpen} agent={editing} />
        </GlassCard>
    )
}

function AgentCard({
    agent,
    onEdit,
    onSetDefault,
    onDuplicate,
    onSetStatus,
    onDelete,
}: {
    agent: AiAgentItem
    onEdit: () => void
    onSetDefault: () => void
    onDuplicate: () => void
    onSetStatus: (status: "active" | "paused" | "draft") => void
    onDelete: () => void
}) {
    const statusTone =
        agent.status === "active"
            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
            : agent.status === "draft"
                ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                : "bg-black/10 text-muted-foreground"

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onEdit}
            onKeyDown={(e) => {
                if (e.target !== e.currentTarget) return
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    onEdit()
                }
            }}
            className="group relative flex cursor-pointer flex-col gap-3 rounded-2xl border border-black/5 bg-black/3 p-4 text-left transition-colors hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 dark:border-white/5 dark:bg-white/3"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-semibold">{agent.name}</h3>
                        {agent.is_default && (
                            <span
                                title="Default agent"
                                className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400"
                            >
                                <Star className="h-3 w-3" />
                                Default
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">
                        {agent.agent_profile} • {agent.tone} • {agent.language}
                    </p>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            className="rounded-full p-1.5 opacity-0 transition-opacity hover:bg-black/10 group-hover:opacity-100 dark:hover:bg-white/10"
                        >
                            <MoreVertical className="h-4 w-4" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-2xl"
                    >
                        {agent.status !== "active" && (
                            <DropdownMenuItem onSelect={() => onSetStatus("active")}>
                                <Play className="mr-2 h-4 w-4" />
                                Activate
                            </DropdownMenuItem>
                        )}
                        {agent.status === "active" && (
                            <DropdownMenuItem onSelect={() => onSetStatus("paused")}>
                                <Pause className="mr-2 h-4 w-4" />
                                Pause
                            </DropdownMenuItem>
                        )}
                        {!agent.is_default && (
                            <DropdownMenuItem onSelect={onSetDefault}>
                                <Star className="mr-2 h-4 w-4" />
                                Set as default
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onSelect={onDuplicate}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                        </DropdownMenuItem>
                        {!agent.is_default && (
                            <DropdownMenuItem
                                onSelect={onDelete}
                                className="text-rose-600 focus:text-rose-600"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={cn("rounded-full px-2 py-0.5 font-medium uppercase tracking-wide", statusTone)}>
                    {agent.status}
                </span>
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Wrench className="h-3 w-3" />
                    {agent.enabled_tools.length} tools
                </span>
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {agent.linked_number_count} numbers
                </span>
                {agent.behaviour_flags?.ai_enabled === false && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-medium text-rose-700 dark:text-rose-400">
                        Paused
                    </span>
                )}
                {agent.behaviour_flags?.recording_enabled && (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <BadgeCheck className="h-3 w-3" />
                        Recording
                    </span>
                )}
            </div>

            {agent.status !== "active" && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation()
                        onSetStatus("active")
                    }}
                    className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-deep px-3 py-1 text-xs font-medium text-brand-gold-300 shadow-sm hover:bg-brand-deep/92 dark:bg-brand-gold dark:text-brand-deep dark:hover:bg-brand-gold/92"
                >
                    <Play className="h-3 w-3" />
                    Activate agent
                </button>
            )}

            {agent.status === "active" &&
                agent.linked_number_count === 0 &&
                !agent.is_default && (
                    <p className="text-[11px] leading-4 text-amber-700 dark:text-amber-400">
                        Active but not answering any numbers — link it under the Numbers tab or
                        mark this agent as the default.
                    </p>
                )}
        </div>
    )
}
