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
    agentType?: string | null
}

interface UseAssistantChatReturn {
    conversations: Conversation[]
    activeChatId: string
    activeAgentType: string | null
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
    regenerate: (slotKey: string) => void
    responseVersions: Map<string, string[]>
    versionCursorMap: Map<string, number>
    navigateVersion: (slotKey: string, dir: "prev" | "next") => void
    isRegenerating: boolean
    isRegeneratingMiddle: boolean
    pendingRegenMap: Map<string, string>
}


interface SendMessageOptions {
    attachments?: FileAttachment[]
    analysis?: boolean
    agentType?: string | null
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

/**
 * Process raw API messages into display messages + version state.
 *
 * Two grouping strategies are combined:
 *  1. slotKey-based: regenerated assistants carry `slotKey = precedingUserMessageId`
 *     in their metadata. These are pulled out first and attached to their original slot,
 *     regardless of where they appear in the createdAt-ordered list.
 *  2. Consecutive fallback: assistants that appear back-to-back with no user in between
 *     (old data before slotKey was introduced) are also grouped as versions.
 */
function processLoadedMessages(raw: Array<{ id: string; role: string; content: any; feedback?: any; slotKey?: string | null }>): {
    messages: AssistantMessage[]
    responseVersions: Map<string, string[]>
    versionCursorMap: Map<string, number>
} {
    // ── Step 1: separate regenerations (have slotKey) from base messages ──────
    const baseRaw = raw.filter((m) => !(m.role === "assistant" && m.slotKey))
    const regenRaw = raw.filter((m) => m.role === "assistant" && m.slotKey)

    // Group regenerations by slotKey, preserving createdAt order (already ordered by API)
    const regensBySlot = new Map<string, typeof raw>()
    for (const msg of regenRaw) {
        const key = msg.slotKey as string
        if (!regensBySlot.has(key)) regensBySlot.set(key, [])
        regensBySlot.get(key)!.push(msg)
    }

    // ── Step 2: walk base messages, attaching regenerations at each user's slot ─
    const allBase = mapApiToAssistantMessages(baseRaw)
    const messages: AssistantMessage[] = []
    const responseVersions = new Map<string, string[]>()
    const versionCursorMap = new Map<string, number>()

    let i = 0
    while (i < allBase.length) {
        const msg = allBase[i]
        if (msg.role === "user") {
            messages.push(msg)
            const slotKey = msg.id

            // Collect immediately following assistants (consecutive fallback for old data)
            const baseAssistants: AssistantMessage[] = []
            let j = i + 1
            while (j < allBase.length && allBase[j].role === "assistant") {
                baseAssistants.push(allBase[j])
                j++
            }

            // Add slotKey-based regenerations for this slot
            const regenMapped = mapApiToAssistantMessages(regensBySlot.get(slotKey) ?? [])
            const allVersions = [...baseAssistants, ...regenMapped]

            if (allVersions.length > 0) {
                messages.push(allVersions[allVersions.length - 1])
                if (allVersions.length > 1) {
                    const texts = allVersions.map((a) =>
                        a.parts.filter((p) => p.type === "text").map((p) => (p as any).text).join("\n")
                    )
                    responseVersions.set(slotKey, texts)
                    versionCursorMap.set(slotKey, texts.length - 1)
                }
            }
            i = j
        } else {
            // Lone assistant at start (shouldn't normally happen)
            messages.push(msg)
            i++
        }
    }

    return { messages, responseVersions, versionCursorMap }
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

// Stable empty map reused whenever no regeneration is in progress, so
// pendingRegenMap never produces a new reference on every streaming chunk.
const EMPTY_REGEN_MAP = new Map<string, string>()

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
    const [loadingConversationId, setLoadingConversationId] = useState<string | null>(null)
    const isLoadingConversation = loadingConversationId === activeChatId
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

    // ── Stable refs for ALL useChat functions ────────────────────────────
    // useChat recreates these on every render (they close over current state).
    // Wrapping in refs prevents every downstream useCallback from being
    // recreated on every streaming token, which is what was breaking memo().
    const setMessagesRef = useRef(setMessages)
    const sendChatMessageRef = useRef(sendChatMessage)
    const sdkRegenerateRef = useRef(sdkRegenerate)
    const addToolOutputRef = useRef(addToolOutput)
    const stopStreamingRef = useRef(stopStreaming)
    setMessagesRef.current = setMessages
    sendChatMessageRef.current = sendChatMessage
    sdkRegenerateRef.current = sdkRegenerate
    addToolOutputRef.current = addToolOutput
    stopStreamingRef.current = stopStreaming

    const [responseVersions, setResponseVersions] = useState<Map<string, string[]>>(new Map())
    const responseVersionsRef = useRef(responseVersions)
    responseVersionsRef.current = responseVersions
    const [versionCursorMap, setVersionCursorMap] = useState<Map<string, number>>(new Map())
    const [isRegeneratingMiddle, setIsRegeneratingMiddle] = useState(false)
    const [currentRegeneratingSlot, setCurrentRegeneratingSlot] = useState<string | null>(null)
    const regeneratingSlotRef = useRef<string | null>(null)
    const wasStreamingRef = useRef(false)
    const sdkMessagesRef = useRef<MappedUIMessage[]>([])
    const wasMiddleRegenRef = useRef(false)
    const isStreamingRef = useRef(false)

    // ── Throttle sdkMessages BEFORE the useMemo chain ──────────────────
    // useChat fires setState on every SSE text-delta chunk (hundreds/sec).
    // This causes the entire hook body to re-render, re-running all useMemos.
    // By throttling here, mapSdkToAssistantMessages only runs ~6 times/sec.
    const latestSdkRef = useRef(sdkMessages)
    latestSdkRef.current = sdkMessages
    const [throttledSdk, setThrottledSdk] = useState(sdkMessages)
    const throttledSdkChatIdRef = useRef(activeChatId)

    useEffect(() => {
        // Always keep the raw ref up to date for post-streaming operations
        sdkMessagesRef.current = sdkMessages
    }, [sdkMessages])

    // Flush throttledSdk whenever the active chat changes so sdkMapped never shows
    // a previous chat's messages while the new chat's loadedMessages are still loading.
    // The throttle effect below only fires on status changes, not activeChatId changes.
    useEffect(() => {
        throttledSdkChatIdRef.current = activeChatId
        setThrottledSdk(latestSdkRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeChatId])

    useEffect(() => {
        const streaming = status === "streaming" || status === "submitted"
        if (!streaming) {
            // Immediately flush final state when not streaming
            throttledSdkChatIdRef.current = activeChatIdRef.current
            setThrottledSdk(latestSdkRef.current)
            return
        }
        // During streaming: use rAF with 150ms minimum gap
        throttledSdkChatIdRef.current = activeChatIdRef.current
        setThrottledSdk(latestSdkRef.current) // immediate first update
        let lastUpdate = performance.now()
        let rafId: number
        const tick = () => {
            const now = performance.now()
            if (now - lastUpdate >= 150) {
                throttledSdkChatIdRef.current = activeChatIdRef.current
                setThrottledSdk(latestSdkRef.current)
                lastUpdate = now
            }
            rafId = requestAnimationFrame(tick)
        }
        rafId = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(rafId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, activeChatId])

    // Live streaming text for the message currently being regenerated (middle messages only).
    // This drives the inline "Regenerating..." view within the original message bubble.
    // Return EMPTY_REGEN_MAP (stable reference) when not regenerating to avoid creating
    // a new Map object on every streaming chunk.
    const pendingRegenMap = useMemo(() => {
        if (!currentRegeneratingSlot || !isRegeneratingMiddle) return EMPTY_REGEN_MAP
        const lastSdk = [...throttledSdk].reverse().find((m) => m.role === "assistant")
        if (!lastSdk) return EMPTY_REGEN_MAP
        const map = new Map<string, string>()
        const text = lastSdk.parts
            .filter((p: any) => p.type === "text")
            .map((p: any) => p.text)
            .join("\n")
        map.set(currentRegeneratingSlot, text)
        return map
    }, [currentRegeneratingSlot, isRegeneratingMiddle, throttledSdk])

    const isStreaming = status === "streaming" || status === "submitted"
    isStreamingRef.current = isStreaming
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
        setMessagesRef.current([])
        setActiveChatIdRaw(newChatId)
    }, [businessId])

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
                    agentType: c.agentType ?? null,
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
    // Only run when streaming ends to avoid cascading re-renders during streaming.
    // Uses throttledSdk (not raw sdkMessages) to avoid running on every chunk.
    useEffect(() => {
        if (isStreaming) return
        if (throttledSdk.length === 0) return

        // Skip when on a sidebar-clicked (already-fetched) chat.
        // throttledSdk may hold stale messages from a prior local chat, and
        // processing their metadata here would incorrectly switch activeChatId back.
        if (fetchedConversations.current.has(activeChatId)) return

        const lastAssistant = [...throttledSdk].reverse().find((m) => m.role === "assistant")
        const backendId = lastAssistant?.metadata?.conversationId
        const backendTitle = lastAssistant?.metadata?.title
        const backendAgentType = lastAssistant?.metadata?.agentType

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

        // Capture agentType so the drawer auto-open works before the page is reloaded.
        // The sync effect runs after streaming ends; activeChatId is still the local ID here.
        if (backendAgentType) {
            setAgentTypeMap((prev) => ({
                ...prev,
                [activeChatId]: backendAgentType,
                [backendId]: backendAgentType,
            }))
        }

        if (syncedConversationRef.current === backendId) return
        if (backendId === activeChatId) return

        syncedConversationRef.current = backendId
        pendingBackendIdRef.current = backendId
    }, [throttledSdk, activeChatId, isStreaming])


    // ── Track agent type per conversation ────────────────────────────────
    const [agentTypeMap, setAgentTypeMap] = useState<Record<string, string | null>>({})

    const activeAgentType = useMemo(() => {
        const conv = conversations.find((c) => c.id === activeChatId)
        if (conv?.agentType) return conv.agentType
        return agentTypeMap[activeChatId] ?? null
    }, [activeChatId, conversations, agentTypeMap])

    // ── Combine SDK messages (live) with loaded messages (historical) ───
    // Uses throttledSdk so this expensive mapping only runs ~6 times/sec during
    // streaming instead of on every SSE text-delta chunk (hundreds/sec).
    const sdkMapped = useMemo(() => {
        if (throttledSdkChatIdRef.current !== activeChatId) return []
        return mapSdkToAssistantMessages(throttledSdk)
    }, [throttledSdk, activeChatId])
    const loadedMessages = loadedMessagesMap[activeChatId] ?? []

    // Combine: historical messages first, then any new SDK messages appended in this session
    const messages = useMemo(() => {
        if (sdkMapped.length === 0) return loadedMessages
        if (loadedMessages.length === 0) return sdkMapped

        // Merge: loadedMessages (history) + sdkMapped (new from this session), deduped by id
        const loadedIds = new Set(loadedMessages.map((m) => m.id))
        const newFromSdk = sdkMapped.filter((m) => !loadedIds.has(m.id))

        if (newFromSdk.length === 0) return loadedMessages

        // Middle-message regeneration: hide the transient SDK response from the list.
        // The captured text will be displayed via the versionInfo override in ChatMessage.
        if (isRegeneratingMiddle && newFromSdk[0]?.role === 'assistant') {
            return loadedMessages
        }

        // Last-assistant regeneration: the SDK produced a new assistant response —
        // replace the last loaded assistant instead of appending.
        const lastLoaded = loadedMessages[loadedMessages.length - 1]
        if (!isRegeneratingMiddle && lastLoaded?.role === 'assistant' && newFromSdk[0]?.role === 'assistant') {
            return [...loadedMessages.slice(0, -1), ...newFromSdk]
        }

        return [...loadedMessages, ...newFromSdk]
    }, [sdkMapped, loadedMessages, isRegeneratingMiddle])

    // Keep a ref to the latest messages so post-streaming effects don't depend on `messages`
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
            // Use latestSdkRef (always current) rather than messagesRef which derives
            // from throttledSdk — the throttle flush is queued as a state update and
            // hasn't committed yet when this effect runs, so messagesRef would be stale.
            return { ...prev, [pendingId]: mapSdkToAssistantMessages(latestSdkRef.current) }
        })
        fetchedConversations.current.add(pendingId)
        localChatIds.current.add(pendingId)
        pendingBackendIdRef.current = null
        setActiveChatIdRaw(pendingId)
    }, [activeChatId, isStreaming])

    // ── Persist streamed messages into loadedMessagesMap ────────────────
    // loadedMessagesMap is only written once per chat (initial fetch or apply-pending).
    // New messages from streaming live in the useChat internal store, which may not
    // survive switching away and back. Writing to loadedMessagesMap here ensures the
    // full history is available after any navigation without re-fetching from the API.
    const prevIsStreamingRef = useRef(false)
    useEffect(() => {
        const was = prevIsStreamingRef.current
        prevIsStreamingRef.current = isStreaming
        if (!was || isStreaming) return  // Only when streaming just ended

        const chatId = activeChatIdRef.current
        // Skip local-only new chats that haven't received a backend ID yet —
        // the apply-pending effect handles those (stores under the server ID).
        if (localChatIds.current.has(chatId) && !fetchedConversations.current.has(chatId)) return

        const latest = latestSdkRef.current
        if (latest.length === 0) return

        const incoming = mapSdkToAssistantMessages(latest)
        setLoadedMessagesMap((prev) => {
            const existing = prev[chatId] ?? []
            const existingIds = new Set(existing.map((m) => m.id))
            const newMessages = incoming.filter((m) => !existingIds.has(m.id))
            if (newMessages.length === 0) return prev

            // If the last stored message and first incoming are both assistant messages,
            // this is an end-of-conversation regeneration — replace rather than append.
            const lastExisting = existing[existing.length - 1]
            if (lastExisting?.role === 'assistant' && newMessages[0]?.role === 'assistant') {
                return { ...prev, [chatId]: [...existing.slice(0, -1), ...newMessages] }
            }

            return { ...prev, [chatId]: [...existing, ...newMessages] }
        })
    }, [isStreaming])

    // ── Update sidebar: add new chats, update title & preview ──────────
    // Only runs when streaming just ended (not on every activeChatId change).
    // Tracking the streaming transition prevents this from firing when the user
    // clicks a different chat — which would wrongly update the clicked chat with
    // the current chat's messages and reset its lastMessageAt to now (→ "Today").
    const prevStreamingForSidebarRef = useRef(false)
    useEffect(() => {
        const wasStreaming = prevStreamingForSidebarRef.current
        prevStreamingForSidebarRef.current = isStreaming

        // Only proceed when streaming just ended
        if (!wasStreaming || isStreaming) return

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
            // Don't touch lastMessageAt/date for existing chats — the API timestamp is correct
            updated[idx] = { ...existing, title: nextTitle, preview: nextPreview }
            return updated
        })
    }, [activeChatId, isStreaming])

    // ── Version state helpers ──────────────────────────────────────────
    const resetVersions = useCallback(() => {
        setResponseVersions(new Map())
        setVersionCursorMap(new Map())
    }, [])

    // ── Queued agent message (sent after React re-renders with new chat ID) ─
    const pendingAgentMessageRef = useRef<{
        text: string
        files: FileUIPart[]
        metadata: { attachments: FileAttachment[]; analysis?: boolean }
    } | null>(null)

    useEffect(() => {
        const pending = pendingAgentMessageRef.current
        if (!pending) return
        pendingAgentMessageRef.current = null
        sendChatMessageRef.current(pending.text
            ? { text: pending.text, files: pending.files.length ? pending.files : undefined, metadata: pending.metadata }
            : { files: pending.files, metadata: pending.metadata }
        )
    }, [activeChatId])

    // ── Send message ───────────────────────────────────────────────────
    const sendMessage = useCallback(
        (text: string, options?: SendMessageOptions) => {
            if (isStreamingRef.current) return
            resetVersions()
            const trimmed = text.trim()
            const attachments = options?.attachments ?? []

            const fileParts: FileUIPart[] = attachments.map((a) => ({
                type: "file", url: a.url, filename: a.name, mediaType: a.fileType,
            }))

            if (!trimmed && fileParts.length === 0) return

            const metadata = { attachments, analysis: options?.analysis }

            // When sending with an agent, create a new conversation for it
            // Queue the message to send after React re-renders with the new ID
            if (options?.agentType) {
                const agentChatId = `chat-${Date.now()}`
                localChatIds.current.add(agentChatId)
                transport.agentType = options.agentType
                setAgentTypeMap((prev) => ({ ...prev, [agentChatId]: options.agentType! }))
                pendingAgentMessageRef.current = { text: trimmed, files: fileParts, metadata }
                setActiveChatIdRaw(agentChatId)
                return
            }

            sendChatMessageRef.current(trimmed
                ? { text: trimmed, files: fileParts.length ? fileParts : undefined, metadata }
                : { files: fileParts, metadata }
            )
        },
        [resetVersions, transport]
    )

    // ── Submit feedback ────────────────────────────────────────────────
    const submitFeedback = useCallback(
        async (messageId: string, rating: "like" | "dislike", reason?: string): Promise<void> => {
            await apiClient.patch(`/assistant/messages/${messageId}/feedback`, { rating, reason })
        },
        []
    )

    // ── Regenerate ────────────────────────────────────────────────────
    const regenerate = useCallback((slotKey: string) => {
        if (isStreamingRef.current) return

        const msgs = messagesRef.current

        // Find the target assistant message for this slotKey
        let targetAssistantIdx = -1
        for (let i = 0; i < msgs.length; i++) {
            if (msgs[i].role !== 'assistant') continue
            const precedingUser = [...msgs].slice(0, i).reverse().find(m => m.role === 'user')
            if (precedingUser?.id === slotKey) { targetAssistantIdx = i; break }
        }
        if (targetAssistantIdx === -1) return
        const targetAssistant = msgs[targetAssistantIdx]

        // Determine if this is the last assistant message in the conversation
        const lastAssistantIdx = [...msgs.entries()].reverse().find(([, m]) => m.role === 'assistant')?.[0] ?? -1
        const isLastAssistant = targetAssistantIdx === lastAssistantIdx

        // Capture current text as version 0 if not yet tracked
        if (!responseVersionsRef.current.has(slotKey)) {
            const currentText = targetAssistant.parts
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
        setCurrentRegeneratingSlot(slotKey)
        if (!isLastAssistant) {
            setIsRegeneratingMiddle(true)
            wasMiddleRegenRef.current = true
        }

        // Seed SDK with history up to and including the target assistant,
        // then sdkRegenerate removes it and re-submits.
        const uiMessages = msgs
            .slice(0, targetAssistantIdx + 1)
            .filter(m => m.role === 'user' || m.role === 'assistant')
            .map(m => ({
                id: m.id,
                role: m.role as 'user' | 'assistant',
                parts: m.parts
                    .filter(p => p.type === 'text')
                    .map(p => ({ type: 'text' as const, text: (p as any).text })),
                metadata: undefined as AssistantMessageMetadata | undefined,
            }))
        setMessagesRef.current(uiMessages)
        transport.isNextRegeneration = true
        transport.regenerationSlotKey = slotKey
        sdkRegenerateRef.current()
    }, [transport])

    // ── Capture new version after streaming ends ───────────────────────
    useEffect(() => {
        if (isStreaming) { wasStreamingRef.current = true; return }
        if (!wasStreamingRef.current) return
        wasStreamingRef.current = false

        const slotKey = regeneratingSlotRef.current
        if (!slotKey) return
        regeneratingSlotRef.current = null

        // Read directly from SDK messages (not merged) to get the new assistant text
        const lastSdkAssistant = [...sdkMessagesRef.current].reverse().find(m => m.role === 'assistant')
        if (!lastSdkAssistant) {
            wasMiddleRegenRef.current = false
            setIsRegeneratingMiddle(false)
            setCurrentRegeneratingSlot(null)
            return
        }

        const newText = lastSdkAssistant.parts
            .filter((p: any) => p.type === 'text')
            .map((p: any) => p.text)
            .join('\n')

        const existingVersions = responseVersionsRef.current.get(slotKey) ?? []
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

        // For middle-message regeneration, clear the transient SDK messages
        // so they don't bleed into the merged view after isRegeneratingMiddle is cleared
        const wasMiddle = wasMiddleRegenRef.current
        wasMiddleRegenRef.current = false
        if (wasMiddle) setMessagesRef.current([])
        setIsRegeneratingMiddle(false)
        setCurrentRegeneratingSlot(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isStreaming])

    // ── Navigate version ───────────────────────────────────────────────
    const navigateVersion = useCallback((slotKey: string, dir: "prev" | "next") => {
        setVersionCursorMap(prev => {
            const versions = responseVersionsRef.current.get(slotKey) ?? []
            const current = prev.get(slotKey) ?? (versions.length - 1)
            const next = dir === 'prev' ? Math.max(0, current - 1) : Math.min(versions.length - 1, current + 1)
            const newMap = new Map(prev)
            newMap.set(slotKey, next)
            return newMap
        })
    }, [])

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
        setLoadingConversationId(id)

        apiClient
            .get<{
                conversationId: string
                agentType?: string | null
                messages: Array<{ id: string; role: string; content: any; feedback?: any; slotKey?: string | null }>
            }>(`/assistant/conversations/${id}`)
            .then((data) => {
                // Always store the fetched data — no navigation guard here.
                // The spinner is gated by loadingConversationId === activeChatId,
                // so showing data for a "wrong" chat is impossible.
                if (data.agentType) {
                    setAgentTypeMap((prev) => ({ ...prev, [id]: data.agentType ?? null }))
                }
                const { messages: mapped, responseVersions: loadedVersions, versionCursorMap: loadedCursors } =
                    processLoadedMessages(data.messages)
                setLoadedMessagesMap((prev) => ({ ...prev, [id]: mapped }))
                if (loadedVersions.size > 0) {
                    setResponseVersions((prev) => {
                        const newMap = new Map(prev)
                        loadedVersions.forEach((v, k) => newMap.set(k, v))
                        return newMap
                    })
                    setVersionCursorMap((prev) => {
                        const newMap = new Map(prev)
                        loadedCursors.forEach((c, k) => newMap.set(k, c))
                        return newMap
                    })
                }
            })
            .catch(() => {
                fetchedConversations.current.delete(id)
            })
            .finally(() => {
                // Use functional update so we only clear the loading ID for *this* fetch,
                // not for a different chat's in-flight request.
                setLoadingConversationId((prev) => (prev === id ? null : prev))
            })
    }, [])

    // ── Switch conversation ────────────────────────────────────────────
    const setActiveChatId = useCallback((id: string) => {
        syncedConversationRef.current = null
        pendingBackendIdRef.current = null
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
            addToolOutputRef.current({ tool: tool as any, toolCallId, output, state: "output-available" })
            void apiClient.post("/assistant/tool-results", {
                conversationId: activeChatIdRef.current, toolCallId, toolName: tool, output,
            }).catch(() => toast.error("Failed to save your response."))
        },
        []
    )

    return {
        conversations,
        activeChatId,
        activeAgentType,
        // messages is already throttled via throttledSdk upstream —
        // no need for a separate displayMessages layer.
        messages,
        isStreaming,
        isWaitingForResponse,
        isLoadingConversation,
        isLoadingConversations,
        sendMessage,
        startNewChat,
        setActiveChatId,
        addToolResult,
        stop: useCallback(() => { stopStreamingRef.current() }, []),
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
        isRegenerating: currentRegeneratingSlot !== null,
        isRegeneratingMiddle,
        pendingRegenMap,
    }
}
