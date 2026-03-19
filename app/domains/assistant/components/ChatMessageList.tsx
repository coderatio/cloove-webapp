"use client"

import { useRef, useEffect, memo, type ReactElement } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ChatMessage } from "./ChatMessage"
import { ChatWelcome } from "./ChatWelcome"
import { cn } from "@/app/lib/utils"
import type { AssistantMessage, AddToolResultFn } from "../types"

interface ChatMessageListProps {
    messages: AssistantMessage[]
    isStreaming: boolean
    isWaitingForResponse: boolean
    addToolResult: AddToolResultFn
    onSuggestionSelect: (prompt: string) => void
    onRegenerate: (slotKey: string) => void
    onFeedback: (messageId: string, rating: "like" | "dislike", reason?: string) => void
    responseVersions: Map<string, string[]>
    versionCursorMap: Map<string, number>
    onNavigateVersion: (slotKey: string, dir: "prev" | "next") => void
    isRegeneratingMiddle: boolean
    pendingRegenMap: Map<string, string>
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
    onFeedback,
    responseVersions,
    versionCursorMap,
    onNavigateVersion,
    isRegeneratingMiddle,
    pendingRegenMap,
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
                            onRegenerate={slotKey ? () => onRegenerate(slotKey!) : undefined}
                            onFeedback={onFeedback}
                            versionInfo={versionInfo}
                            onNavigateVersion={slotKey ? (dir) => onNavigateVersion(slotKey!, dir) : undefined}
                            pendingRegenText={slotKey ? pendingRegenMap.get(slotKey) : undefined}
                        />
                    )
                })
            ) : (
                <AnimatePresence initial={false}>
                    {messages.map((msg, index) => {
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
                                onRegenerate={slotKey ? () => onRegenerate(slotKey!) : undefined}
                                onFeedback={onFeedback}
                                versionInfo={versionInfo}
                                onNavigateVersion={slotKey ? (dir) => onNavigateVersion(slotKey!, dir) : undefined}
                                pendingRegenText={slotKey ? pendingRegenMap.get(slotKey) : undefined}
                            />
                        )
                    })}
                </AnimatePresence>
            )}

            {/* Waiting indicator */}
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
        </div>
    )
})
