"use client"

import { useRef, useEffect, useState, useCallback, memo, type ReactElement } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ChatMessage } from "./ChatMessage"
import { ChatWelcome } from "./ChatWelcome"
import { AgentDocumentDrawer } from "./AgentDocumentDrawer"
import { getAgentById } from "../lib/agent-config"
import type { AssistantMessage, AddToolResultFn } from "../types"

interface ChatMessageListProps {
    messages: AssistantMessage[]
    isStreaming: boolean
    isWaitingForResponse: boolean
    addToolResult: AddToolResultFn
    onSuggestionSelect: (prompt: string) => void
    onRegenerate: (slotKey: string) => void
    onAction: (action: string, messageId: string) => void
    onFeedback: (messageId: string, rating: "like" | "dislike", reason?: string) => void
    responseVersions: Map<string, string[]>
    versionCursorMap: Map<string, number>
    onNavigateVersion: (slotKey: string, dir: "prev" | "next") => void
    isRegeneratingMiddle: boolean
    pendingRegenMap: Map<string, string>
    agentType?: string | null
    className?: string
    bottomPadding?: number
}

export const ChatMessageList = memo(function ChatMessageList({
    messages,
    isStreaming,
    isWaitingForResponse,
    addToolResult,
    onSuggestionSelect,
    onRegenerate,
    onAction,
    onFeedback,
    responseVersions,
    versionCursorMap,
    onNavigateVersion,
    isRegeneratingMiddle,
    pendingRegenMap,
    agentType,
    className,
    bottomPadding,
}: ChatMessageListProps): ReactElement {
    const chatEndRef = useRef<HTMLDivElement>(null)
    const scrollTimer = useRef<ReturnType<typeof setTimeout>>(null)
    const isRegeneratingMiddleRef = useRef(isRegeneratingMiddle)
    useEffect(() => {
        isRegeneratingMiddleRef.current = isRegeneratingMiddle
    }, [isRegeneratingMiddle])

    useEffect(() => {
        if (isRegeneratingMiddleRef.current) return
        if (scrollTimer.current) clearTimeout(scrollTimer.current)
        scrollTimer.current = setTimeout(
            () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }),
            isStreaming ? 300 : 0
        )
    }, [messages, isStreaming])

    // ── Agent drawer state ───────────────────────────────────────────────
    const [agentDrawerOpen, setAgentDrawerOpen] = useState(false)
    const [agentDrawerMessageId, setAgentDrawerMessageId] = useState<string | null>(null)

    // Keep refs so the stable getAgentContent callback can read latest values.
    // Updated during render (not in useEffect) so that when the drawer's effect fires
    // and calls getContent(), the refs already hold the current values.
    const messagesRef = useRef(messages)
    messagesRef.current = messages

    const agentDrawerMessageIdRef = useRef<string | null>(agentDrawerMessageId)
    agentDrawerMessageIdRef.current = agentDrawerMessageId

    // Stable callback — no deps means it never changes reference, so AgentDocumentDrawer
    // memo comparator always sees the same function and skips re-rendering from the parent.
    const getAgentContent = useCallback(() => {
        const id = agentDrawerMessageIdRef.current
        if (!id) return ""
        const msg = messagesRef.current.find((m) => m.id === id)
        if (!msg) return ""
        return msg.parts
            .filter((p) => p.type === "text")
            .map((p) => (p as any).text)
            .join("\n")
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Auto-open drawer when streaming ends and the content is a document.
    // We wait until streaming finishes so we can reliably detect document vs question.
    // Short replies (clarifying questions) never trigger the drawer.
    const prevStreamingRef = useRef(false)
    useEffect(() => {
        const wasStreaming = prevStreamingRef.current
        prevStreamingRef.current = isStreaming

        if (!agentType) return
        // Only trigger on streaming end (was streaming → not streaming)
        if (!wasStreaming || isStreaming) return

        const lastMsg = messages[messages.length - 1]
        if (lastMsg?.role !== "assistant") return
        const text = lastMsg.parts
            .filter((p) => p.type === "text")
            .map((p) => (p as any).text)
            .join("\n")
        const isDocument = /^#{1,2}\s/m.test(text)
        if (isDocument) {
            setAgentDrawerMessageId(lastMsg.id)
            setAgentDrawerOpen(true)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [agentType, isStreaming, messages])

    // isStreaming is stable per-chunk (only changes state: false→streaming→false),
    // so this doesn't cause AgentDocumentDrawer to re-render on every chunk.
    const lastMsgId = messages[messages.length - 1]?.id
    const isStreamingDrawer = isStreaming && agentDrawerMessageId === lastMsgId

    const agentDef = agentType ? getAgentById(agentType) : null

    // Empty state — show welcome screen (but not while waiting for first response)
    if (messages.length === 0 && !isWaitingForResponse) {
        return <ChatWelcome onSuggestionSelect={onSuggestionSelect} />
    }

    return (
        <div 
            className={className}
            style={{ 
                paddingBottom: bottomPadding ? `${bottomPadding}px` : undefined 
            }}
        >
            {/* Skip AnimatePresence during streaming — its reconciliation
                of all children on every throttle tick is expensive. */}
            {isStreaming ? (
                messages.map((msg, index) => {
                    const isLast = index === messages.length - 1
                    const isLastAssistant = isLast && msg.role === "assistant"

                    let versionInfo: { versions: string[]; currentIndex: number } | undefined
                    let slotKey: string | undefined
                    if (msg.role === "assistant") {
                        const precedingUserMsg = [...messages].slice(0, index).reverse().find(m => m.role === 'user')
                        if (precedingUserMsg) {
                            slotKey = precedingUserMsg.id
                            const versions = responseVersions.get(slotKey) ?? []
                            if (versions.length > 0) {
                                const currentIndex = versionCursorMap.get(slotKey) ?? (versions.length - 1)
                                versionInfo = { versions, currentIndex }
                            }
                        }
                    }

                    return (
                        <ChatMessage
                            key={msg.id}
                            message={msg}
                            addToolResult={addToolResult}
                            isLoading={isLastAssistant && isStreaming}
                            isLast={isLast}
                            onRegenerate={slotKey ? () => onRegenerate(slotKey) : undefined}
                            onAction={onAction}
                            onFeedback={onFeedback}
                            versionInfo={versionInfo}
                            onNavigateVersion={slotKey ? (dir) => onNavigateVersion(slotKey!, dir) : undefined}
                            pendingRegenText={slotKey ? pendingRegenMap.get(slotKey) : undefined}
                            agentType={agentType}
                            onOpenAgentDrawer={() => {
                                setAgentDrawerMessageId(msg.id)
                                setAgentDrawerOpen(true)
                            }}
                        />
                    )
                })
            ) : (
            <AnimatePresence initial={false}>
                {messages.map((msg, index) => {
                    const isLast = index === messages.length - 1
                    const isLastAssistant = isLast && msg.role === "assistant"

                    // Compute version info for assistant messages
                    let versionInfo: { versions: string[]; currentIndex: number } | undefined
                    let slotKey: string | undefined
                    if (msg.role === "assistant") {
                        const precedingUserMsg = [...messages].slice(0, index).reverse().find(m => m.role === 'user')
                        if (precedingUserMsg) {
                            slotKey = precedingUserMsg.id
                            const versions = responseVersions.get(slotKey) ?? []
                            if (versions.length > 0) {
                                const currentIndex = versionCursorMap.get(slotKey) ?? (versions.length - 1)
                                versionInfo = { versions, currentIndex }
                            }
                        }
                    }

                    return (
                        <ChatMessage
                            key={msg.id}
                            message={msg}
                            addToolResult={addToolResult}
                            isLoading={isLastAssistant && isStreaming}
                            isLast={isLast}
                            onRegenerate={slotKey ? () => onRegenerate(slotKey) : undefined}
                            onAction={onAction}
                            onFeedback={onFeedback}
                            versionInfo={versionInfo}
                            onNavigateVersion={slotKey ? (dir) => onNavigateVersion(slotKey!, dir) : undefined}
                            pendingRegenText={slotKey ? pendingRegenMap.get(slotKey) : undefined}
                            agentType={agentType}
                            onOpenAgentDrawer={() => {
                                setAgentDrawerMessageId(msg.id)
                                setAgentDrawerOpen(true)
                            }}
                        />
                    )
                })}
            </AnimatePresence>
            )}

            {/* Waiting indicator — shown while awaiting first assistant token,
                or when messages haven't populated yet but a response is pending */}
            {isWaitingForResponse && (messages.length === 0 || messages[messages.length - 1]?.role === "user") && (
                <div className="flex items-start gap-3 py-4">
                    <div className="rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-brand-deep/5 dark:border-white/10 px-5 py-3">
                        <div className="mb-2">
                            <span className="block text-xs font-bold uppercase tracking-wider bg-linear-to-r from-brand-deep to-brand-green dark:from-brand-green dark:to-brand-cream bg-clip-text text-transparent w-fit">
                                Cloove AI
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 py-1">
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={i}
                                    className="h-1.5 w-1.5 rounded-full bg-brand-green/60"
                                    animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                                    transition={{
                                        duration: 0.8,
                                        repeat: Infinity,
                                        delay: i * 0.15,
                                        ease: "easeInOut",
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div ref={chatEndRef} />

            {/* Agent document drawer — rendered once, memo'd to skip re-renders on every chunk */}
            {agentDef && (
                <AgentDocumentDrawer
                    agent={agentDef}
                    getContent={getAgentContent}
                    isStreaming={isStreamingDrawer}
                    open={agentDrawerOpen}
                    onOpenChange={setAgentDrawerOpen}
                />
            )}
        </div>
    )
})
