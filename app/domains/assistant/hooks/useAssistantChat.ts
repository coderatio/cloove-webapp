"use client"

import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import { useChat } from "@ai-sdk/react"
import type { FileUIPart, UIMessage } from "ai"
import type {
    Conversation,
    AssistantMessage,
    AssistantMessagePart,
    FileAttachment,
    FilePart,
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
    fetchConversations: (
        filter?: 'active' | 'archived',
        options?: { silent?: boolean }
    ) => Promise<void>
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

export interface UseAssistantChatOptions {
    /** Which list the sidebar is showing — used to silently refetch after a stream completes */
    sidebarListFilter?: 'active' | 'archived'
}

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

/** Hydrate useChat from API-shaped assistant messages (inverse of mapSdkToAssistantMessages). */
function assistantMessagesToMappedUiMessages(messages: AssistantMessage[]): MappedUIMessage[] {
    return messages.map((message) => {
        const parts: MappedUIMessage["parts"] = []

        for (const part of message.parts) {
            if (part.type === "text") {
                parts.push({ type: "text", text: part.text })
                continue
            }
            if (part.type === "file") {
                parts.push({
                    type: "file",
                    url: part.file.url,
                    filename: part.file.name,
                    mediaType: part.file.fileType,
                })
                continue
            }
            if (part.type.startsWith("tool-")) {
                const toolName = part.type.slice("tool-".length)
                const st = part.state
                const sdkState =
                    st === "output-available" || st === "output-error"
                        ? "result"
                        : st === "loading"
                          ? "call"
                          : st === "pending"
                            ? "partial-call"
                            : "call"
                parts.push({
                    type: "tool-invocation",
                    toolCallId: part.toolCallId,
                    toolName,
                    state: sdkState,
                    args: part.input,
                    result: part.output,
                } as unknown as MappedUIMessage["parts"][number])
            }
        }

        const fileParts = message.parts.filter((p): p is FilePart => p.type === "file")
        const metadata: AssistantMessageMetadata | undefined =
            message.role === "user" && fileParts.length > 0
                ? {
                      attachments: fileParts.map((p, i) => ({
                          id: `${message.id}-att-${i}`,
                          name: p.file.name,
                          size: p.file.size,
                          fileType: p.file.fileType,
                          url: p.file.url,
                      })),
                  }
                : undefined

        return {
            id: message.id,
            role: message.role,
            parts,
            metadata,
        }
    })
}

// Stable empty map reused whenever no regeneration is in progress, so
// pendingRegenMap never produces a new reference on every streaming chunk.
const EMPTY_REGEN_MAP = new Map<string, string>()

export function useAssistantChat(options?: UseAssistantChatOptions): UseAssistantChatReturn {
    const { activeBusiness } = useBusiness()
    const sidebarListFilterRef = useRef<'active' | 'archived'>('active')
    sidebarListFilterRef.current = options?.sidebarListFilter ?? 'active'
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
    const loadingConversationIdRef = useRef<string | null>(null)
    useEffect(() => {
        loadingConversationIdRef.current = loadingConversationId
    }, [loadingConversationId])
    const isLoadingConversation = loadingConversationId === activeChatId
    const [isLoadingConversations, setIsLoadingConversations] = useState(false)
    const conversationsLoaded = useRef(false)
    const syncedConversationRef = useRef<string | null>(null)
    const activeChatIdRef = useRef(activeChatId)
    activeChatIdRef.current = activeChatId

    const patchActiveChatId = useCallback((id: string) => {
        activeChatIdRef.current = id
        setActiveChatIdRaw(id)
    }, [])

    const fetchedConversations = useRef(new Set<string>())
    // Track local drafts only (new chats not yet confirmed persisted by backend).
    const localChatIds = useRef<Set<string>>(new Set())
    const pendingBackendIdRef = useRef<string | null>(null)
    /** During middle regeneration, list shows this snapshot so transient SDK output stays hidden. */
    const middleRegenSnapshotRef = useRef<AssistantMessage[] | null>(null)

    useEffect(() => {
        middleRegenSnapshotRef.current = null
    }, [activeChatId])

    // Seed only true draft chat IDs (no conversationId in URL on first load).
    useEffect(() => {
        if (typeof window === "undefined") return
        const params = new URLSearchParams(window.location.search)
        const urlId = params.get("conversationId")
        if (!urlId) localChatIds.current.add(activeChatIdRef.current)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

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

    // When not streaming, sdkMessages can change without status/activeChatId changing (e.g. GET
    // hydrates useChat via setMessages). The effect above would never run → throttledSdk stays
    // stale and the UI shows an empty welcome view.
    useEffect(() => {
        if (status === "streaming" || status === "submitted") return
        throttledSdkChatIdRef.current = activeChatId
        setThrottledSdk(sdkMessages)
    }, [sdkMessages, activeChatId, status])

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
        const newChatId = `chat-${Date.now()}`
        localChatIds.current = new Set([newChatId])
        fetchedConversations.current = new Set()
        syncedConversationRef.current = null
        pendingBackendIdRef.current = null
        conversationsLoaded.current = false
        setMessagesRef.current([])
        patchActiveChatId(newChatId)
    }, [businessId, patchActiveChatId])

    const fetchConversations = useCallback(
        async (filter: 'active' | 'archived' = 'active', opts?: { silent?: boolean }) => {
            if (!opts?.silent) setIsLoadingConversations(true)
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
                if (!opts?.silent) setIsLoadingConversations(false)
            }
        },
        []
    )

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

    // Single source: useChat store, hydrated from GET /conversations/:id when opening a thread.
    const messages = useMemo(() => {
        if (isRegeneratingMiddle && middleRegenSnapshotRef.current?.length) {
            return middleRegenSnapshotRef.current
        }
        return sdkMapped
    }, [sdkMapped, activeChatId, isRegeneratingMiddle])

    // Keep a ref to the latest messages so post-streaming effects don't depend on `messages`
    const messagesRef = useRef(messages)
    useEffect(() => {
        messagesRef.current = messages
    }, [messages])

    const fetchMessages = useCallback((id: string) => {
        if (loadingConversationIdRef.current === id) return

        setLoadingConversationId(id)

        apiClient
            .get<{
                conversationId: string
                agentType?: string | null
                messages: Array<{ id: string; role: string; content: any; feedback?: any; slotKey?: string | null }>
            }>(`/assistant/conversations/${id}`)
            .then((data) => {
                if (activeChatIdRef.current !== id) return

                fetchedConversations.current.add(id)

                if (data.agentType) {
                    setAgentTypeMap((prev) => ({ ...prev, [id]: data.agentType ?? null }))
                }
                const { messages: mapped, responseVersions: loadedVersions, versionCursorMap: loadedCursors } =
                    processLoadedMessages(data.messages)

                setResponseVersions(new Map(loadedVersions))
                setVersionCursorMap(new Map(loadedCursors))

                setMessagesRef.current(assistantMessagesToMappedUiMessages(mapped))
                middleRegenSnapshotRef.current = null
            })
            .catch(() => {
                fetchedConversations.current.delete(id)
            })
            .finally(() => {
                setLoadingConversationId((prev) => (prev === id ? null : prev))
            })
    }, [])

    const setActiveChatId = useCallback(
        (id: string) => {
            syncedConversationRef.current = null
            pendingBackendIdRef.current = null
            patchActiveChatId(id)
            fetchMessages(id)
        },
        [fetchMessages, patchActiveChatId]
    )

    // ── On mount: if conversationId exists in URL, fetch its messages ─
    useEffect(() => {
        if (typeof window === "undefined") return
        const params = new URLSearchParams(window.location.search)
        const urlId = params.get("conversationId")
        if (urlId) fetchMessages(urlId)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // ── After first reply: switch to server conversation id and load messages from API ─
    useEffect(() => {
        if (isStreaming) return
        const pendingId = pendingBackendIdRef.current
        if (!pendingId) return
        if (pendingId === activeChatId) {
            localChatIds.current.delete(activeChatId)
            pendingBackendIdRef.current = null
            return
        }

        const localId = activeChatId
        localChatIds.current.delete(localId)
        pendingBackendIdRef.current = null
        patchActiveChatId(pendingId)
        // useChat resets per id; hydrate from the just-finished stream so we never flash empty
        // if GET /conversations/:id briefly lags behind persistence.
        const fromSdk = mapSdkToAssistantMessages(latestSdkRef.current)
        if (fromSdk.length > 0) {
            setMessagesRef.current(assistantMessagesToMappedUiMessages(fromSdk))
        }
        fetchMessages(pendingId)
    }, [activeChatId, isStreaming, fetchMessages, patchActiveChatId])

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

    // ── Refetch sidebar list when a stream completes (canonical titles/previews from API) ─
    const prevStreamingForListRefetchRef = useRef(false)
    useEffect(() => {
        const wasStreaming = prevStreamingForListRefetchRef.current
        prevStreamingForListRefetchRef.current = isStreaming

        if (!wasStreaming || isStreaming) return

        const filter = sidebarListFilterRef.current
        void fetchConversations(filter, { silent: true }).catch(() => {})
    }, [isStreaming, fetchConversations])

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
                patchActiveChatId(agentChatId)
                return
            }

            sendChatMessageRef.current(trimmed
                ? { text: trimmed, files: fileParts.length ? fileParts : undefined, metadata }
                : { files: fileParts, metadata }
            )
        },
        [resetVersions, transport, patchActiveChatId]
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
            middleRegenSnapshotRef.current = msgs.map((m) => ({ ...m, parts: [...m.parts] }))
            setIsRegeneratingMiddle(true)
            wasMiddleRegenRef.current = true
        } else {
            middleRegenSnapshotRef.current = null
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
            middleRegenSnapshotRef.current = null
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

        const wasMiddle = wasMiddleRegenRef.current
        wasMiddleRegenRef.current = false
        if (wasMiddle) middleRegenSnapshotRef.current = null
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
        patchActiveChatId(newId)
    }, [patchActiveChatId])

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
            patchActiveChatId(newId)
        }
    }, [patchActiveChatId])

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
            patchActiveChatId(newId)
        }
    }, [patchActiveChatId])

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
