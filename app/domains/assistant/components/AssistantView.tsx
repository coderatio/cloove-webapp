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
        isLoadingConversations,
        sendMessage,
        startNewChat,
        setActiveChatId,
        addToolResult,
        stop,
        renameConversation,
        pinConversation,
        archiveConversation,
        unarchiveConversation,
        deleteConversation,
        fetchConversations,
        submitFeedback,
        regenerate,
        responseVersions,
        versionCursorMap,
        navigateVersion,
    } = useAssistantChat()

    const { isMenuOpen } = useMobileNav()

    const [isHistoryOpen, setIsHistoryOpen] = useState(false)
    const [isViewingArchived, setIsViewingArchived] = useState(false)
    const initializedFromUrl = useRef(false)
    const lastPushedId = useRef<string | null>(null)

    const activeChat = conversations.find((c) => c.id === activeChatId)
    const hasMessages = messages.length > 0

    const handleSuggestionSelect = (prompt: string) => {
        sendMessage(prompt)
    }

    const handleRename = async (id: string, title: string) => {
        const tid = toast.loading("Renaming conversation...")
        try {
            await renameConversation(id, title)
            toast.success("Conversation renamed", { id: tid })
        } catch (error) {
            console.error("Rename error:", error)
            toast.error("Failed to rename conversation", { id: tid })
        }
    }

    const handlePin = async (id: string, pinned: boolean) => {
        const tid = toast.loading(pinned ? "Pinning conversation..." : "Unpinning conversation...")
        try {
            await pinConversation(id, pinned)
            toast.success(pinned ? "Conversation pinned" : "Conversation unpinned", { id: tid })
        } catch (error) {
            console.error("Pin error:", error)
            toast.error("Failed to update pin", { id: tid })
        }
    }

    const handleArchive = async (id: string) => {
        const tid = toast.loading("Archiving conversation...")
        try {
            await archiveConversation(id)
            toast.success("Conversation archived", { id: tid })
        } catch (error) {
            console.error("Archive error:", error)
            toast.error("Failed to archive conversation", { id: tid })
        }
    }

    const handleUnarchive = async (id: string) => {
        const tid = toast.loading("Restoring conversation...")
        try {
            await unarchiveConversation(id)
            toast.success("Conversation restored", { id: tid })
        } catch (error) {
            console.error("Unarchive error:", error)
            toast.error("Failed to restore conversation", { id: tid })
        }
    }

    const handleToggleArchived = async () => {
        const next = !isViewingArchived
        setIsViewingArchived(next)
        await fetchConversations(next ? 'archived' : 'active')
    }

    const handleDelete = async (id: string) => {
        const tid = toast.loading("Deleting conversation...")
        try {
            await deleteConversation(id)
            toast.success("Conversation deleted", { id: tid })
        } catch (error) {
            console.error("Delete error:", error)
            toast.error("Failed to delete conversation", { id: tid })
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
            <div className="flex flex-col lg:flex-row h-dvh relative md:pt-0">
                {/* Desktop Sidebar */}
                <ChatHistorySidebar
                    conversations={conversations}
                    activeChatId={activeChatId}
                    isLoading={isLoadingConversations}
                    onSelectChat={setActiveChatId}
                    onNewChat={startNewChat}
                    onRename={handleRename}
                    onPin={handlePin}
                    onArchive={handleArchive}
                    onUnarchive={handleUnarchive}
                    onDelete={handleDelete}
                    isArchivedView={isViewingArchived}
                    onToggleArchived={handleToggleArchived}
                />

                {/* Main Chat Container */}
                <div className="flex-1 flex flex-col h-full min-w-0 lg:pb-0 overflow-hidden">
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
                    <div className="hidden lg:flex shrink-0 items-center justify-between py-6 lg:py-0 lg:mb-6 mt-3 px-4 md:pl-0 lg:px-6">
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
                        isLoading={isLoadingConversations}
                        open={isHistoryOpen}
                        onOpenChange={setIsHistoryOpen}
                        onSelectChat={setActiveChatId}
                        onNewChat={startNewChat}
                        onRename={handleRename}
                        onPin={handlePin}
                        onArchive={handleArchive}
                        onUnarchive={handleUnarchive}
                        onDelete={handleDelete}
                        isArchivedView={isViewingArchived}
                        onToggleArchived={handleToggleArchived}
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
                            onRegenerate={regenerate}
                            onAction={handleAction}
                            onFeedback={submitFeedback}
                            responseVersions={responseVersions}
                            versionCursorMap={versionCursorMap}
                            onNavigateVersion={navigateVersion}
                            className="flex-1 overflow-y-auto space-y-6 pb-40 md:pb-6 scrollbar-hide px-4 md:pl-0 lg:px-6 pt-16 md:pt-0"
                        />

                    ) : (
                        <div className="px-8 lg:px-12 flex-1 flex flex-col">
                            <ChatWelcome onSuggestionSelect={handleSuggestionSelect} />
                        </div>
                    )}

                    {/* Input Area */}
                    {!isMenuOpen && (
                        <div className="fixed bottom-6 lg:bottom-4 left-4 right-4 z-20 md:sticky md:pr-8 lg:relative lg:w-full lg:pr-10">
                            <ChatInput
                                onSend={sendMessage}
                                disabled={isStreaming}
                                isStreaming={isStreaming}
                                onStop={stop}
                                focusTrigger={activeChatId}
                            />
                        </div>
                    )}
                </div>
            </div>
        </PageTransition>
    )
}
