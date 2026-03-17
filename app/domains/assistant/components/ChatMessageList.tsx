"use client"

import { useRef, useEffect, type ReactElement } from "react"
import { AnimatePresence } from "framer-motion"
import { ChatMessage } from "./ChatMessage"
import { ChatWelcome } from "./ChatWelcome"
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
    className?: string
}

export function ChatMessageList({
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
    className,
}: ChatMessageListProps): ReactElement {
    const chatEndRef = useRef<HTMLDivElement>(null)
    const scrollTimer = useRef<ReturnType<typeof setTimeout>>(null)
    // Use a ref so that the scroll effect is NOT triggered by the isRegeneratingMiddle
    // true→false transition itself (which would scroll right after middle-regen completes).
    const isRegeneratingMiddleRef = useRef(isRegeneratingMiddle)
    useEffect(() => {
        isRegeneratingMiddleRef.current = isRegeneratingMiddle
    }, [isRegeneratingMiddle])

    useEffect(() => {
        // Don't scroll to bottom when regenerating a middle message — the user is
        // watching the inline streaming at that message's position, not the bottom.
        if (isRegeneratingMiddleRef.current) return
        // Throttle scroll during streaming to avoid layout thrashing
        if (scrollTimer.current) clearTimeout(scrollTimer.current)
        scrollTimer.current = setTimeout(
            () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }),
            isStreaming ? 150 : 0
        )
    }, [messages, isStreaming])

    // Empty state — show welcome screen
    if (messages.length === 0) {
        return <ChatWelcome onSuggestionSelect={onSuggestionSelect} />
    }

    return (
        <div className={className}>
            <AnimatePresence initial={false}>
                {messages.map((msg, index) => {
                    const isLast = index === messages.length - 1
                    const isLastAssistant = isLast && msg.role === "assistant"

                    // Compute version info for assistant messages
                    let versionInfo: { versions: string[]; currentIndex: number } | undefined
                    let slotKey: string | undefined
                    if (msg.role === "assistant") {
                        // Find the preceding user message
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
                        />
                    )
                })}
            </AnimatePresence>

            <div ref={chatEndRef} />
        </div>
    )
}
