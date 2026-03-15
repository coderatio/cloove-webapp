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
    onRegenerate: () => void
    onAction: (action: string, messageId: string) => void
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
    className,
}: ChatMessageListProps): ReactElement {
    const chatEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
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
                    return (
                        <ChatMessage
                            key={msg.id}
                            message={msg}
                            addToolResult={addToolResult}
                            isLoading={isLastAssistant && isStreaming}
                            isLast={isLast}
                            onRegenerate={onRegenerate}
                            onAction={onAction}
                        />
                    )
                })}
            </AnimatePresence>

            <div ref={chatEndRef} />
        </div>
    )
}

