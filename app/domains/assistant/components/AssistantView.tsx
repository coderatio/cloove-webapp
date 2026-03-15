"use client"

import { useState, useEffect, useRef, type ReactElement } from "react"
import { motion } from "framer-motion"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, Menu } from "lucide-react"
import { toast } from "sonner"
import { PageTransition } from "@/app/components/layout/page-transition"
import { useAssistantChat } from "../hooks/useAssistantChat"
import { ChatMessageList } from "./ChatMessageList"
import { ChatInput } from "./ChatInput"
import { ChatHistorySidebar } from "./ChatHistorySidebar"
import { ChatHistoryDrawer } from "./ChatHistoryDrawer"
import { ChatWelcome } from "./ChatWelcome"
import { useMobileNav } from "@/app/components/providers/mobile-nav-provider"

export function AssistantView(): ReactElement {
    const router = useRouter()
    const searchParams = useSearchParams()
    const {
        conversations,
        activeChatId,
        messages,
        isStreaming,
        isWaitingForResponse,
        isLoadingConversation,
        sendMessage,
        startNewChat,
        setActiveChatId,
        addToolResult,
        stop,
        renameConversation,
        pinConversation,
        archiveConversation,
        deleteConversation,
    } = useAssistantChat()

    const { isMenuOpen } = useMobileNav()

    const [isHistoryOpen, setIsHistoryOpen] = useState(false)
    const initializedFromUrl = useRef(false)
    const lastPushedId = useRef<string | null>(null)

    const activeChat = conversations.find((c) => c.id === activeChatId)
    const hasMessages = messages.length > 0

    const handleSuggestionSelect = (prompt: string) => {
        sendMessage(prompt)
    }

    const handleRename = async (id: string, title: string) => {
        try { await renameConversation(id, title) }
        catch { toast.error("Failed to rename conversation") }
    }

    const handlePin = async (id: string, pinned: boolean) => {
        try { await pinConversation(id, pinned) }
        catch { toast.error("Failed to update pin") }
    }

    const handleArchive = async (id: string) => {
        try { await archiveConversation(id) }
        catch { toast.error("Failed to archive conversation") }
    }

    const handleDelete = async (id: string) => {
        try { await deleteConversation(id) }
        catch { toast.error("Failed to delete conversation") }
    }

    const handleRegenerate = async () => {

        const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')
        if (!lastUserMessage) return

        // Extract text content from the last user message
        const lastPrompt = lastUserMessage.parts
            .filter(p => p.type === 'text')
            .map(p => (p as any).text)
            .join('\n')

        if (lastPrompt) {
            sendMessage(lastPrompt)
        }
    }

    const handleAction = (action: string, messageId: string) => {
        const msg = messages.find(m => m.id === messageId)
        if (!msg) return

        const textContent = msg.parts
            .filter(p => p.type === 'text')
            .map(p => (p as any).text)
            .join('\n')

        if (action === 'create-proposal') {
            sendMessage(`Based on the information above, create a formal business proposal:\n\n${textContent.slice(0, 500)}...`)
        } else if (action === 'create-invoice') {
            sendMessage(`Can you help me create an invoice based on these details?\n\n${textContent.slice(0, 500)}...`)
        }
    }


    // Write activeChatId to URL (one-way: state → URL)

    useEffect(() => {
        if (lastPushedId.current === activeChatId) return
        lastPushedId.current = activeChatId

        const params = new URLSearchParams(searchParams.toString())
        if (params.get("conversationId") !== activeChatId) {
            params.set("conversationId", activeChatId)
            router.replace(`?${params.toString()}`, { scroll: false })
        }
    }, [activeChatId, router, searchParams])

    return (
        <PageTransition>
            <div className="flex flex-col lg:flex-row h-dvh md:h-[calc(100vh-100px)] relative md:pt-0 max-w-7xl mx-auto md:px-4">
                {/* Desktop Sidebar */}
                <ChatHistorySidebar
                    conversations={conversations}
                    activeChatId={activeChatId}
                    onSelectChat={setActiveChatId}
                    onNewChat={startNewChat}
                    onRename={handleRename}
                    onPin={handlePin}
                    onArchive={handleArchive}
                    onDelete={handleDelete}
                />

                {/* Main Chat Container */}
                <div className="flex-1 flex flex-col h-full min-w-0 lg:pl-8">
                    {/* Mobile Header */}
                    <div className="lg:hidden fixed top-0 left-0 right-0 z-30 md:sticky md:top-0 md:z-20 flex items-center gap-3 px-4 py-3 md:px-0 bg-white/90 dark:bg-black/90 md:bg-transparent md:dark:bg-transparent md:backdrop-blur-none backdrop-blur-xl border-b border-brand-deep/10 dark:border-white/10 md:border-b-0">
                        <button
                            type="button"
                            onClick={() => setIsHistoryOpen(true)}
                            className="h-9 w-9 rounded-full flex items-center justify-center border border-brand-deep/10 dark:border-white/10"
                            aria-label="Open chat history"
                        >
                            <Menu className="h-4 w-4 text-brand-deep dark:text-brand-cream" />
                        </button>
                        <h1 className="flex-1 min-w-0 text-sm font-serif font-medium text-brand-deep dark:text-brand-cream truncate">
                            {activeChat?.title || "New Conversation"}
                        </h1>
                    </div>

                    {/* Desktop Header */}
                    <div className="hidden lg:flex shrink-0 items-center justify-between py-6 lg:py-0 lg:mb-6 mt-8 lg:mt-8">
                        <div className="flex-1 min-w-0">
                            <motion.h1
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35, ease: "easeOut" }}
                                className="font-serif text-[clamp(1.5rem,1.25rem+1vw,2.1rem)] font-medium text-brand-deep dark:text-brand-cream truncate"
                            >
                                <span className="bg-linear-to-r from-brand-deep via-brand-green to-brand-gold bg-clip-text text-transparent dark:from-brand-cream dark:via-brand-gold dark:to-brand-green">
                                    {activeChat?.title || "New Conversation"}
                                </span>
                            </motion.h1>
                        </div>
                    </div>

                    {/* Mobile Drawer */}
                    <ChatHistoryDrawer
                        conversations={conversations}
                        activeChatId={activeChatId}
                        open={isHistoryOpen}
                        onOpenChange={setIsHistoryOpen}
                        onSelectChat={setActiveChatId}
                        onNewChat={startNewChat}
                        onRename={handleRename}
                        onPin={handlePin}
                        onArchive={handleArchive}
                        onDelete={handleDelete}
                    />

                    {/* Chat Area */}
                    {isLoadingConversation ? (
                        <div className="flex-1 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-brand-gold" />
                        </div>
                    ) : hasMessages ? (
                        <ChatMessageList
                            messages={messages}
                            isStreaming={isStreaming}
                            isWaitingForResponse={isWaitingForResponse}
                            addToolResult={addToolResult}
                            onSuggestionSelect={handleSuggestionSelect}
                            onRegenerate={handleRegenerate}
                            onAction={handleAction}
                            className="flex-1 overflow-y-auto space-y-6 pb-44 md:pb-0 scrollbar-hide px-1 pt-14 md:pt-0"
                        />

                    ) : (
                        <ChatWelcome onSuggestionSelect={handleSuggestionSelect} />
                    )}

                    {/* Input Area */}
                    {!isMenuOpen && (
                        <div className="fixed bottom-6 left-4 right-4 z-20 md:sticky md:bottom-8 border-t-0 md:w-full">
                            <ChatInput
                                onSend={sendMessage}
                                disabled={isStreaming}
                                isStreaming={isStreaming}
                                onStop={stop}
                            />
                        </div>
                    )}
                </div>
            </div>
        </PageTransition>
    )
}
