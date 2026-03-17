"use client"

import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import { useChat } from "@ai-sdk/react"
import type { FileUIPart, UIMessage } from "ai"
import type {
    Conversation,
    AssistantMessage,
    AssistantMessagePart,
    FileAttachment,
} from "../types"
import { apiClient } from "@/app/lib/api-client"
import { AssistantChatTransport } from "../lib/assistant-chat-transport"
import { useBusiness } from "@/app/components/BusinessProvider"
import { toast } from "sonner"

interface AssistantMessageMetadata {
    attachments?: FileAttachment[]
    analysis?: boolean
    conversationId?: string
    title?: string
}

interface UseAssistantChatReturn {
    conversations: Conversation[]
    activeChatId: string
    messages: AssistantMessage[]
    isStreaming: boolean
    isWaitingForResponse: boolean
    isLoadingConversation: boolean
    isLoadingConversations: boolean
    sendMessage: (text: string, options?: SendMessageOptions) => void
    startNewChat: () => void
    setActiveChatId: (id: string) => void
    addToolResult: (args: { toolCallId: string; tool: string; output: unknown }) => void
    stop: () => void
    renameConversation: (id: string, title: string) => Promise<void>
    pinConversation: (id: string, pinned: boolean) => Promise<void>
    archiveConversation: (id: string) => Promise<void>
    unarchiveConversation: (id: string) => Promise<void>
    deleteConversation: (id: string) => Promise<void>
    fetchConversations: (filter?: 'active' | 'archived') => Promise<void>
    submitFeedback: (messageId: string, rating: "like" | "dislike", reason?: string) => Promise<void>
    regenerate: () => void
    responseVersions: Map<string, string[]>
    versionCursorMap: Map<string, number>
    navigateVersion: (slotKey: string, dir: "prev" | "next") => void
}

interface SendMessageOptions {
    attachments?: FileAttachment[]
    analysis?: boolean
}

type MappedUIMessage = UIMessage<AssistantMessageMetadata>

function getFirstUserText(msgs: AssistantMessage[]): string {
    const first = msgs.find((m) => m.role === "user")
    if (!first) return ""
    return first.parts
        .filter((p) => p.type === "text")
        .map((p) => (p as { text: string }).text)
        .join("")
        .slice(0, 50)
}

function getLastUserText(msgs: AssistantMessage[]): string {
    const last = [...msgs].reverse().find((m) => m.role === "user")
    if (!last) return ""
    return last.parts
        .filter((p) => p.type === "text")
        .map((p) => (p as { text: string }).text)
        .join("")
        .slice(0, 120)
}

/** Map raw API messages → domain AssistantMessage[] (for historical display) */
function mapApiToAssistantMessages(
    raw: Array<{ id: string; role: string; content: any; feedback?: any }>
): AssistantMessage[] {
    return raw
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((message) => {
            const parts: AssistantMessagePart[] = []
            const content = message.content

            if (content?.type === "text" && typeof content.text === "string") {
                parts.push({ type: "text", text: content.text })
            } else if (content?.type === "parts" && Array.isArray(content.parts)) {
                content.parts.forEach((part: any) => {
                    if (part.type === "text") {
                        parts.push({ type: "text", text: part.text })
                    }
                    if (part.type === "file") {
                        parts.push({
                            type: "file",
                            file: {
                                id: `${message.id}-file-${parts.length}`,
                                name: part.name || "Attachment",
                                size: part.size || 0,
                                fileType: part.mediaType || "application/octet-stream",
                                url: part.data || part.url,
                            },
                        })
                    }
                    if (part.type === "image") {
                        parts.push({
                            type: "file",
                            file: {
                                id: `${message.id}-img-${parts.length}`,
                                name: "Image",
                                size: 0,
                                fileType: part.mimeType || "image/*",
                                url: part.image || part.url,
                            },
                        })
                    }
                })
            } else if (typeof content === "string") {
                parts.push({ type: "text", text: content })
            }

            return {
                id: message.id,
                role: message.role as "user" | "assistant",
                parts,
                feedback: message.feedback ?? null,
            }
        })
}

/** Map SDK UIMessage[] → domain AssistantMessage[] (for live chat) */
function mapSdkToAssistantMessages(sdkMessages: MappedUIMessage[]): AssistantMessage[] {
    return sdkMessages.map((message) => {
        const parts: AssistantMessagePart[] = []

        message.parts.forEach((part, index) => {
            if (part.type === "text") {
                parts.push({ type: "text", text: part.text })
                return
            }
            if (part.type === "file") {
                const att = message.metadata?.attachments?.find((a) => a.url === part.url)
                parts.push({
                    type: "file",
                    file: {
                        id: `${message.id}-file-${index}`,
                        name: part.filename || att?.name || "Attachment",
                        size: att?.size || 0,
                        fileType: part.mediaType || att?.fileType || "application/octet-stream",
                        url: part.url,
                    },
                })
                return
            }
            if (part.type === "tool-invocation") {
                const tp = part as any
                parts.push({
                    type: `tool-${tp.toolName}`,
                    toolCallId: tp.toolCallId,
                    state:
                        tp.state === "result" ? "output-available"
                            : tp.state === "call" ? "loading"
                                : tp.state === "partial-call" ? "pending"
                                    : tp.state || "loading",
                    input: tp.args || {},
                    output: tp.result,
                } as AssistantMessagePart)
            }
        })

        return {
            id: message.id,
            role: message.role === "assistant" ? "assistant" : "user",
            parts,
        }
    })
}

const INITIAL_CHAT_ID = `chat-${Date.now()}`

export function useAssistantChat(): UseAssistantChatReturn {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id ?? null
    const prevBusinessIdRef = useRef(businessId)

    const [conversations, setConversations] = useState<Conversation[]>([])
    const [activeChatId, setActiveChatIdRaw] = useState(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search)
            const urlId = params.get("conversationId")
            if (urlId) return urlId
        }
        return `chat-${Date.now()}`
    })
    const [isLoadingConversation, setIsLoadingConversation] = useState(false)
    const [isLoadingConversations, setIsLoadingConversations] = useState(false)
    // Historical messages loaded from the API — keyed by conversation ID
    const [loadedMessagesMap, setLoadedMessagesMap] = useState<Record<string, AssistantMessage[]>>({})
    const conversationsLoaded = useRef(false)
    const syncedConversationRef = useRef<string | null>(null)
    const activeChatIdRef = useRef(activeChatId)
    const fetchedConversations = useRef(new Set<string>())
    // Track IDs created locally in this session (via startNewChat or initial)
    const localChatIds = useRef(new Set<string>([INITIAL_CHAT_ID]))
    const pendingBackendIdRef = useRef<string | null>(null)

    useEffect(() => {
        activeChatIdRef.current = activeChatId
    }, [activeChatId])

    const transport = useMemo(() => new AssistantChatTransport(), [])

    const {
        messages: sdkMessages,
        setMessages,
        sendMessage: sendChatMessage,
        regenerate: sdkRegenerate,
        addToolOutput,
        status,
        stop: stopStreaming,
    } = useChat<MappedUIMessage>({
        id: activeChatId,
        transport,
    })

    const [responseVersions, setResponseVersions] = useState<Map<string, string[]>>(new Map())
    const [versionCursorMap, setVersionCursorMap] = useState<Map<string, number>>(new Map())
    const regeneratingSlotRef = useRef<string | null>(null)
    const wasStreamingRef = useRef(false)


    const isStreaming = status === "streaming" || status === "submitted"
    const isWaitingForResponse = status === "submitted"

    // ── Reset all state when business changes ───────────────────────────
    useEffect(() => {
        if (prevBusinessIdRef.current === businessId) return
        prevBusinessIdRef.current = businessId

        // Clear all conversation state for the new business
        setConversations([])
        setLoadedMessagesMap({})
        const newChatId = `chat-${Date.now()}`
        localChatIds.current = new Set([newChatId])
        fetchedConversations.current = new Set()
        syncedConversationRef.current = null
        pendingBackendIdRef.current = null
        conversationsLoaded.current = false
        setMessages([])
        setActiveChatIdRaw(newChatId)
    }, [businessId, setMessages])

    const fetchConversations = useCallback(async (filter: 'active' | 'archived' = 'active') => {
        setIsLoadingConversations(true)
        try {
            const data = await apiClient.get<{
                conversations: Array<{
                    id: string
                    conversationId: string
                    title: string | null
                    updatedAt: string
                    preview: string | null
                    isPinned?: boolean
                    isArchived?: boolean
                }>
                meta: { page: number; limit: number; total: number }
            }>(`/assistant/conversations?filter=${filter}`)

            setConversations(
                data.conversations.map((c: any) => ({
                    id: c.conversationId,
                    title: c.title || "Untitled",
                    date: new Date(c.updatedAt).toLocaleDateString(),
                    preview: c.preview || undefined,
                    isPinned: c.isPinned ?? false,
                    isArchived: c.isArchived ?? false,
                    lastMessageAt: new Date(c.updatedAt),
                    messages: [],
                }))
            )
        } finally {
            setIsLoadingConversations(false)
        }
    }, [])

    // ── Load conversation list on mount ─────────────────────────────────
    useEffect(() => {
        if (conversationsLoaded.current) return
        conversationsLoaded.current = true
        fetchConversations('active')
    }, [businessId, fetchConversations])

    // ── Sync backend conversationId from assistant_start metadata ───────
    // Only run when streaming ends to avoid cascading re-renders during streaming
    useEffect(() => {
        if (isStreaming) return
        if (sdkMessages.length === 0) return

        const lastAssistant = [...sdkMessages].reverse().find((m) => m.role === "assistant")
        const backendId = lastAssistant?.metadata?.conversationId
        const backendTitle = lastAssistant?.metadata?.title

        if (!backendId) return

        if (backendTitle) {
            setConversations((prev) => {
                const idx = prev.findIndex((c) => c.id === activeChatId || c.id === backendId)
                if (idx === -1) return prev
                if (prev[idx].title === backendTitle) return prev
                const updated = [...prev]
                updated[idx] = { ...prev[idx], title: backendTitle }
                return updated
            })
        }

        if (syncedConversationRef.current === backendId) return
        if (backendId === activeChatId) return

        syncedConversationRef.current = backendId
        pendingBackendIdRef.current = backendId
    }, [sdkMessages, activeChatId, isStreaming])

    // ── Combine SDK messages (live) with loaded messages (historical) ───
    const sdkMapped = useMemo(() => mapSdkToAssistantMessages(sdkMessages), [sdkMessages])
    const loadedMessages = loadedMessagesMap[activeChatId] ?? []

    // Combine: historical messages first, then any new SDK messages appended in this session
    const messages = useMemo(() => {
        if (sdkMapped.length === 0) return loadedMessages
        if (loadedMessages.length === 0) return sdkMapped

        // Merge: loadedMessages (history) + sdkMapped (new from this session), deduped by id
        const loadedIds = new Set(loadedMessages.map((m) => m.id))
        const newFromSdk = sdkMapped.filter((m) => !loadedIds.has(m.id))

        if (newFromSdk.length === 0) return loadedMessages

        // Regeneration case: if the new SDK content starts with an assistant message
        // it means the last loaded assistant was regenerated — replace it instead of appending
        const lastLoaded = loadedMessages[loadedMessages.length - 1]
        if (lastLoaded?.role === 'assistant' && newFromSdk[0]?.role === 'assistant') {
            return [...loadedMessages.slice(0, -1), ...newFromSdk]
        }

        return [...loadedMessages, ...newFromSdk]
    }, [sdkMapped, loadedMessages])

    // Keep a ref to the latest messages so the effect below doesn't depend on `messages`
    const messagesRef = useRef(messages)
    useEffect(() => {
        messagesRef.current = messages
    }, [messages])

    // ── Apply pending backend conversationId after streaming ends ───────
    useEffect(() => {
        if (isStreaming) return
        const pendingId = pendingBackendIdRef.current
        if (!pendingId) return
        if (pendingId === activeChatId) {
            pendingBackendIdRef.current = null
            return
        }

        setLoadedMessagesMap((prev) => {
            if (prev[pendingId]) return prev
            return { ...prev, [pendingId]: messagesRef.current }
        })
        fetchedConversations.current.add(pendingId)
        localChatIds.current.add(pendingId)
        pendingBackendIdRef.current = null
        setActiveChatIdRaw(pendingId)
    }, [activeChatId, isStreaming])

    // ── Update sidebar: add new chats, update title & preview ──────────
    // Only runs when streaming state changes or activeChatId changes (NOT on every chunk)
    useEffect(() => {
        const msgs = messagesRef.current
        if (msgs.length === 0) return

        const firstText = getFirstUserText(msgs)
        const lastText = getLastUserText(msgs)
        if (!firstText && !lastText) return

        setConversations((prev) => {
            const idx = prev.findIndex((c) => c.id === activeChatId)

            if (idx === -1) {
                return [{
                    id: activeChatId,
                    title: firstText || "New Conversation",
                    date: "Just now",
                    preview: lastText || undefined,
                    lastMessageAt: new Date(),
                    messages: [],
                }, ...prev]
            }

            const existing = prev[idx]
            const isDefault = !existing.title || existing.title === "New Conversation" || existing.title === "Untitled"
            const nextTitle = isDefault && firstText ? firstText : existing.title
            const nextPreview = lastText || existing.preview

            if (nextTitle === existing.title && nextPreview === existing.preview) return prev

            const updated = [...prev]
            updated[idx] = { ...existing, title: nextTitle, preview: nextPreview, date: "Just now", lastMessageAt: new Date() }
            return updated
        })
    }, [activeChatId, isStreaming])

    // ── Version state helpers ──────────────────────────────────────────
    const resetVersions = useCallback(() => {
        setResponseVersions(new Map())
        setVersionCursorMap(new Map())
    }, [])

    // ── Send message ───────────────────────────────────────────────────
    const sendMessage = useCallback(
        (text: string, options?: SendMessageOptions) => {
            if (isStreaming) return
            resetVersions()
            const trimmed = text.trim()
            const attachments = options?.attachments ?? []

            const fileParts: FileUIPart[] = attachments.map((a) => ({
                type: "file", url: a.url, filename: a.name, mediaType: a.fileType,
            }))

            if (!trimmed && fileParts.length === 0) return

            const metadata = { attachments, analysis: options?.analysis }
            sendChatMessage(trimmed
                ? { text: trimmed, files: fileParts.length ? fileParts : undefined, metadata }
                : { files: fileParts, metadata }
            )
        },
        [isStreaming, sendChatMessage, resetVersions]
    )

    // ── Submit feedback ────────────────────────────────────────────────
    const submitFeedback = useCallback(
        async (messageId: string, rating: "like" | "dislike", reason?: string): Promise<void> => {
            await apiClient.patch(`/assistant/messages/${messageId}/feedback`, { rating, reason })
        },
        []
    )

    // ── Regenerate ────────────────────────────────────────────────────
    const regenerate = useCallback(() => {
        if (isStreaming) return

        const msgs = messagesRef.current
        const reversedMsgs = [...msgs].reverse()
        const lastAssistantMsg = reversedMsgs.find(m => m.role === 'assistant')
        const lastUserMsg = reversedMsgs.find(m => m.role === 'user')
        if (!lastAssistantMsg || !lastUserMsg) return

        const slotKey = lastUserMsg.id

        if (!responseVersions.has(slotKey)) {
            const currentText = lastAssistantMsg.parts
                .filter(p => p.type === 'text')
                .map(p => (p as any).text)
                .join('\n')
            setResponseVersions(prev => {
                const newMap = new Map(prev)
                newMap.set(slotKey, [currentText])
                return newMap
            })
            setVersionCursorMap(prev => {
                const newMap = new Map(prev)
                newMap.set(slotKey, 0)
                return newMap
            })
        }

        regeneratingSlotRef.current = slotKey

        // Always seed the SDK with the full current history so sdkRegenerate has
        // the right messages regardless of whether this is a fresh or loaded session.
        // sdkRegenerate will then drop the last assistant and re-submit.
        const uiMessages = msgs
            .filter(m => m.role === 'user' || m.role === 'assistant')
            .map(m => ({
                id: m.id,
                role: m.role as 'user' | 'assistant',
                parts: m.parts
                    .filter(p => p.type === 'text')
                    .map(p => ({ type: 'text' as const, text: (p as any).text })),
                metadata: undefined as AssistantMessageMetadata | undefined,
            }))
        setMessages(uiMessages)
        sdkRegenerate()
    }, [isStreaming, responseVersions, sdkRegenerate, setMessages])

    // ── Capture new version after streaming ends ───────────────────────
    useEffect(() => {
        if (isStreaming) { wasStreamingRef.current = true; return }
        if (!wasStreamingRef.current) return
        wasStreamingRef.current = false

        const slotKey = regeneratingSlotRef.current
        if (!slotKey) return
        regeneratingSlotRef.current = null

        const newLastAssistant = [...messagesRef.current].reverse().find(m => m.role === 'assistant')
        if (!newLastAssistant) return

        const newText = newLastAssistant.parts
            .filter(p => p.type === 'text')
            .map(p => (p as any).text)
            .join('\n')

        const existingVersions = responseVersions.get(slotKey) ?? []
        const newVersionIndex = existingVersions.length

        setResponseVersions(prev => {
            const existing = prev.get(slotKey) ?? []
            const newMap = new Map(prev)
            newMap.set(slotKey, [...existing, newText])
            return newMap
        })
        setVersionCursorMap(prev => {
            const newMap = new Map(prev)
            newMap.set(slotKey, newVersionIndex)
            return newMap
        })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isStreaming])

    // ── Navigate version ───────────────────────────────────────────────
    const navigateVersion = useCallback((slotKey: string, dir: "prev" | "next") => {
        setVersionCursorMap(prev => {
            const versions = responseVersions.get(slotKey) ?? []
            const current = prev.get(slotKey) ?? (versions.length - 1)
            const next = dir === 'prev' ? Math.max(0, current - 1) : Math.min(versions.length - 1, current + 1)
            const newMap = new Map(prev)
            newMap.set(slotKey, next)
            return newMap
        })
    }, [responseVersions])

    // ── New chat ───────────────────────────────────────────────────────
    const startNewChat = useCallback(() => {
        syncedConversationRef.current = null
        const newId = `chat-${Date.now()}`
        localChatIds.current.add(newId)
        setActiveChatIdRaw(newId)
    }, [])

    // ── Fetch conversation messages from API ─────────────────────────────
    const fetchMessages = useCallback((id: string) => {
        if (fetchedConversations.current.has(id)) return
        fetchedConversations.current.add(id)
        setIsLoadingConversation(true)

        apiClient
            .get<{
                conversationId: string
                messages: Array<{ id: string; role: string; content: any }>
            }>(`/assistant/conversations/${id}`)
            .then((data) => {
                if (activeChatIdRef.current !== id) return
                const mapped = mapApiToAssistantMessages(data.messages)
                setLoadedMessagesMap((prev) => ({ ...prev, [id]: mapped }))
            })
            .catch(() => {
                fetchedConversations.current.delete(id)
            })
            .finally(() => {
                setIsLoadingConversation(false)
            })
    }, [])

    // ── Switch conversation ────────────────────────────────────────────
    const setActiveChatId = useCallback((id: string) => {
        syncedConversationRef.current = null
        setActiveChatIdRaw(id)

        // If it's a locally-created chat or already fetched, nothing to do
        if (localChatIds.current.has(id) || fetchedConversations.current.has(id)) {
            return
        }

        // Otherwise fetch messages from the API
        fetchMessages(id)
    }, [fetchMessages])

    // ── On mount: if activeChatId from URL is not local, fetch its messages ─
    // This handles page refresh with a conversationId in the URL
    useEffect(() => {
        const id = activeChatIdRef.current
        if (!localChatIds.current.has(id) && !fetchedConversations.current.has(id)) {
            fetchMessages(id)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // ── Conversation management ────────────────────────────────────────
    const renameConversation = useCallback(async (id: string, title: string) => {
        await apiClient.patch(`/assistant/conversations/${id}`, { title })
        setConversations((prev) =>
            prev.map((c) => (c.id === id ? { ...c, title } : c))
        )
    }, [])

    const pinConversation = useCallback(async (id: string, pinned: boolean) => {
        await apiClient.patch(`/assistant/conversations/${id}`, { isPinned: pinned })
        setConversations((prev) =>
            prev.map((c) => (c.id === id ? { ...c, isPinned: pinned } : c))
        )
    }, [])

    const archiveConversation = useCallback(async (id: string) => {
        await apiClient.patch(`/assistant/conversations/${id}`, { isArchived: true })
        setConversations((prev) => prev.filter((c) => c.id !== id))
        if (activeChatIdRef.current === id) {
            const newId = `chat-${Date.now()}`
            localChatIds.current.add(newId)
            setActiveChatIdRaw(newId)
        }
    }, [])

    const unarchiveConversation = useCallback(async (id: string) => {
        await apiClient.patch(`/assistant/conversations/${id}`, { isArchived: false })
        // After unarchiving, we usually want it to reappear in the active list
        // but since we've filtered the active list, we might want to refetch or
        // manually add it back if we had its data.
        // For simplicity, let's just remove it from the 'archived' view if that's where we are
        setConversations((prev) => prev.filter((c) => c.id !== id))
    }, [])

    const deleteConversation = useCallback(async (id: string) => {
        await apiClient.delete(`/assistant/conversations/${id}`)
        setConversations((prev) => prev.filter((c) => c.id !== id))
        if (activeChatIdRef.current === id) {
            const newId = `chat-${Date.now()}`
            localChatIds.current.add(newId)
            setActiveChatIdRaw(newId)
        }
    }, [])

    // ── Add tool result ────────────────────────────────────────────────
    const addToolResult = useCallback(
        ({ toolCallId, tool, output }: { toolCallId: string; tool: string; output: unknown }) => {
            addToolOutput({ tool: tool as any, toolCallId, output, state: "output-available" })
            void apiClient.post("/assistant/tool-results", {
                conversationId: activeChatId, toolCallId, toolName: tool, output,
            }).catch(() => toast.error("Failed to save your response."))
        },
        [activeChatId, addToolOutput]
    )

    return {
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
        stop: stopStreaming,
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
    }
}
