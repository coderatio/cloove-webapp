"use client"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import {
    Bot,
    CheckCircle2,
    ClipboardList,
    Inbox,
    Loader2,
    MessageSquare,
    MoreHorizontal,
    Search,
    SendHorizonal,
    UserRound,
    X,
} from "lucide-react"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Skeleton } from "@/app/components/ui/skeleton"
import { useAuth } from "@/app/components/providers/auth-provider"
import { usePermission } from "@/app/hooks/usePermission"
import {
    useAssignConversation,
    useResolveConversation,
    useReturnConversationToAi,
    useSendConversationMessage,
    useSendConversationTemplate,
    useTakeOverConversation,
    useWhatsAppConversation,
    useWhatsAppConversations,
    useWhatsAppTemplates,
} from "@/app/domains/messaging/hooks/useWhatsAppInbox"

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatMessageTime(dateStr: string) {
    const date = new Date(dateStr)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function formatConversationDate(dateStr: string) {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / 86400000)
    if (days === 0) return formatMessageTime(dateStr)
    if (days === 1) return "Yesterday"
    if (days < 7) return date.toLocaleDateString([], { weekday: "short" })
    return date.toLocaleDateString([], { month: "short", day: "numeric" })
}

function getInitial(name: string) {
    return name.charAt(0).toUpperCase()
}

// ─── The Inbox Tab ──────────────────────────────────────────────────────────

function InboxTab() {
    const { user } = useAuth()
    const { can } = usePermission()
    const { data: conversations, isLoading } = useWhatsAppConversations()
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [search, setSearch] = useState("")
    const [draft, setDraft] = useState("")
    const [selectedTemplate, setSelectedTemplate] = useState<string>("")
    const [templateVariables, setTemplateVariables] = useState("{}")
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const detail = useWhatsAppConversation(selectedId)
    const selected = detail.data
    const templates = useWhatsAppTemplates({
        page: 1,
        limit: 100,
        status: "published",
        businessWhatsappNumberId: selected?.business_whatsapp_number_id ?? null,
    })
    const takeover = useTakeOverConversation()
    const returnToAi = useReturnConversationToAi()
    const resolveConversation = useResolveConversation()
    const assignConversation = useAssignConversation()
    const sendMessage = useSendConversationMessage()
    const sendTemplate = useSendConversationTemplate()
    const sendableTemplates = (templates.data?.data ?? []).filter((template) => template.can_send)

    useEffect(() => {
        if (!selectedId && conversations?.[0]?.id) {
            setSelectedId(conversations[0].id)
        }
    }, [conversations, selectedId])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [selected?.messages])

    const filteredConversations = (conversations ?? []).filter((conversation) => {
        const query = search.trim().toLowerCase()
        if (!query) return true
        return (
            conversation.customer_name?.toLowerCase().includes(query) ||
            conversation.customer_phone.toLowerCase().includes(query) ||
            conversation.number_label?.toLowerCase().includes(query)
        )
    })

    const submitMessage = async () => {
        const text = draft.trim()
        if (!selectedId || !text) return
        try {
            await sendMessage.mutateAsync({ id: selectedId, text })
            setDraft("")
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to send message")
        }
    }

    const submitTemplate = async () => {
        if (!selectedId || !selectedTemplate) return
        try {
            const variables = JSON.parse(templateVariables || "{}") as Record<string, unknown>
            await sendTemplate.mutateAsync({
                id: selectedId,
                templateKey: selectedTemplate,
                variables,
            })
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Template send failed")
        }
    }

    return (
        <div className="flex h-full min-h-0 overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm">
            {/* ── Conversation list ──────────────────────────────────── */}
            <section
                className={`flex h-full min-h-0 flex-col overflow-hidden border-r border-border/40 bg-muted/[0.06] transition-all duration-300 ${
                    selected ? "hidden xl:flex xl:w-[340px]" : "flex-1 xl:w-[340px]"
                }`}
            >
                {/* Header */}
                <div className="shrink-0 border-b border-border/30 px-3 py-3">
                    <div className="flex items-center gap-2.5 px-1">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-deep/10">
                            <Inbox className="h-3.5 w-3.5 text-brand-deep/70" />
                        </div>
                        <h2 className="text-sm font-semibold tracking-tight">Inbox</h2>
                        <span className="ml-auto text-[11px] font-medium text-muted-foreground/60">
                            {filteredConversations.length}
                        </span>
                    </div>
                    {/* Search */}
                    <div className="relative mt-2.5">
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name or number…"
                            aria-label="Search conversations"
                            className="h-8 w-full rounded-lg border border-border/40 bg-white/60 pl-8 pr-2.5 text-xs outline-none placeholder:text-muted-foreground/40 focus:border-brand-deep/20 focus:bg-white dark:bg-white/5 dark:focus:bg-white/10"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                                aria-label="Clear search"
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                </div>

                {/* List */}
                <div className="min-h-0 flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="space-y-1 p-2">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="flex items-start gap-2.5 rounded-xl p-2.5">
                                    <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                                    <div className="min-w-0 flex-1 space-y-1.5 pt-0.5">
                                        <div className="flex items-center justify-between gap-2">
                                            <Skeleton className="h-3.5 w-28" />
                                            <Skeleton className="h-2.5 w-12" />
                                        </div>
                                        <Skeleton className="h-2.5 w-20" />
                                        <Skeleton className="h-3 w-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredConversations.length ? (
                        <div className="py-1">
                            {filteredConversations.map((conversation) => {
                                const isSelected = selectedId === conversation.id
                                const initial = getInitial(
                                    conversation.customer_name || conversation.customer_phone
                                )
                                const isHuman = conversation.mode === "human"
                                const lastMsgTime =
                                    conversation.last_inbound_at || conversation.last_outbound_at
                                return (
                                    <button
                                        key={conversation.id}
                                        type="button"
                                        onClick={() => setSelectedId(conversation.id)}
                                        aria-current={isSelected ? "true" : undefined}
                                        className={`group flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-all duration-150 ${
                                            isSelected
                                                ? "bg-brand-deep/[0.06]"
                                                : "hover:bg-muted/30"
                                        }`}
                                    >
                                        {/* Avatar */}
                                        <div
                                            className={`relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                                                isHuman
                                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                                                    : "bg-brand-deep/10 text-brand-deep/70 dark:bg-brand-gold-700/20 dark:text-brand-gold-300"
                                            }`}
                                        >
                                            {initial}
                                            {conversation.unread_count > 0 && (
                                                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-deep px-1 text-[9px] font-bold text-white ring-2 ring-background dark:bg-brand-gold-600 dark:text-brand-deep-900">
                                                    {conversation.unread_count > 9
                                                        ? "9+"
                                                        : conversation.unread_count}
                                                </span>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="truncate text-sm font-medium">
                                                    {conversation.customer_name ||
                                                        conversation.customer_phone}
                                                </p>
                                                {lastMsgTime && (
                                                    <span className="shrink-0 text-[10px] font-medium text-muted-foreground/50">
                                                        {formatConversationDate(lastMsgTime)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
                                                <span className="truncate">
                                                    {conversation.number_label || "WhatsApp"}
                                                </span>
                                                <span className="text-border">·</span>
                                                <span
                                                    className={`font-medium ${
                                                        isHuman
                                                            ? "text-amber-600 dark:text-amber-400"
                                                            : "text-emerald-600 dark:text-emerald-400"
                                                    }`}
                                                >
                                                    {conversation.mode}
                                                </span>
                                            </div>
                                            <p className="mt-0.5 line-clamp-1 text-[12px] leading-5 text-muted-foreground/70">
                                                {conversation.last_customer_message ||
                                                    conversation.context_summary ||
                                                    "No messages yet"}
                                            </p>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/50 bg-muted/20">
                                <MessageSquare className="h-5 w-5 text-muted-foreground/40" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-foreground">
                                    No conversations yet
                                </p>
                                <p className="mt-1 max-w-56 text-xs leading-relaxed text-muted-foreground/60">
                                    Incoming messages from your customers will appear here.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* ── Message detail ─────────────────────────────────────── */}
            <section className="flex flex-1 flex-col overflow-hidden bg-background">
                {!selected ? (
                    <div className="flex h-full items-center justify-center p-8">
                        <div className="max-w-xs space-y-3 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border/50 bg-muted/20">
                                <MessageSquare className="h-6 w-6 text-muted-foreground/30" />
                            </div>
                            <p className="text-base font-semibold text-foreground">
                                Select a conversation
                            </p>
                            <p className="text-sm leading-relaxed text-muted-foreground/60">
                                Choose a conversation from the sidebar to review messages, take over
                                from AI, or reply as a human.
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* ── Conversation header ──────────────────── */}
                        <div className="shrink-0 border-b border-border/30 bg-background/95 px-4 py-2.5">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex min-w-0 flex-1 items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedId(null)}
                                        aria-label="Close conversation"
                                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-muted/40 hover:text-muted-foreground xl:hidden"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                    <div
                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                                            selected.mode === "human"
                                                ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                                                : "bg-brand-deep/10 text-brand-deep/70 dark:bg-brand-gold-700/20 dark:text-brand-gold-300"
                                        }`}
                                    >
                                        {getInitial(
                                            selected.customer_name || selected.customer_phone
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="truncate text-sm font-semibold leading-tight">
                                            {selected.customer_name || selected.customer_phone}
                                        </h3>
                                        <p className="truncate text-[11px] text-muted-foreground/60">
                                            {selected.customer_phone}
                                            {selected.number_label && (
                                                <>
                                                    {" "}
                                                    <span className="text-border/50">·</span>{" "}
                                                    {selected.number_label}
                                                </>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                    {can("MANAGE_WHATSAPP_CONVERSATIONS") && (
                                        <>
                                            {selected.mode === "ai" ? (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        takeover.mutate({ id: selected.id })
                                                    }
                                                    className="flex h-8 items-center gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                                                >
                                                    <UserRound className="h-3.5 w-3.5" />
                                                    Take over
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        returnToAi.mutate({ id: selected.id })
                                                    }
                                                    className="flex h-8 items-center gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                                                >
                                                    <Bot className="h-3.5 w-3.5" />
                                                    AI mode
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    resolveConversation.mutate({ id: selected.id })
                                                }
                                                className="flex h-8 items-center gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                                            >
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                Resolve
                                            </button>
                                        </>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setSidebarOpen((p) => !p)}
                                        aria-label={sidebarOpen ? "Close details panel" : "Open details panel"}
                                        className={`hidden h-8 w-8 items-center justify-center rounded-lg border border-border/50 transition-colors xl:flex ${
                                            sidebarOpen
                                                ? "bg-brand-deep/10 text-brand-deep/70"
                                                : "bg-background text-muted-foreground hover:bg-muted/40"
                                        }`}
                                    >
                                        <MoreHorizontal className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ── AI paused banner ──────────────────────── */}
                        {selected.mode === "human" && (
                            <div className="mx-4 mt-3 animate-fade-in rounded-xl border border-amber-200/50 bg-amber-50/80 px-3.5 py-2.5 text-xs leading-5 text-amber-800 dark:border-amber-500/15 dark:bg-amber-500/8 dark:text-amber-200/80">
                                <div className="flex items-start gap-2">
                                    <Bot className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                    <span>
                                        AI responses are paused for this conversation.{" "}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                returnToAi.mutate({ id: selected.id })
                                            }
                                            className="font-medium underline underline-offset-2 transition-colors hover:text-amber-900 dark:hover:text-amber-100"
                                        >
                                            Resume AI
                                        </button>
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* ── Messages + sidebar ────────────────────── */}
                        <div
                            className={`grid min-h-0 flex-1 overflow-hidden transition-all duration-300 ${
                                sidebarOpen
                                    ? "xl:grid-cols-[minmax(0,1fr)_280px]"
                                    : "xl:grid-cols-[minmax(0,1fr)]"
                            }`}
                        >
                            {/* Messages */}
                            <div className="min-h-0 space-y-1 overflow-y-auto px-4 py-4">
                                {selected.messages.map((message, idx) => {
                                    const isOutbound = message.direction === "outbound"
                                    const isFirst =
                                        idx === 0 ||
                                        selected.messages[idx - 1]?.sender_type !==
                                            message.sender_type
                                    const isLast =
                                        idx === selected.messages.length - 1 ||
                                        selected.messages[idx + 1]?.sender_type !==
                                            message.sender_type
                                    const showSender =
                                        isFirst && message.sender_type !== "customer"
                                    return (
                                        <div
                                            key={message.id}
                                            className={`flex animate-fade-in ${
                                                isOutbound ? "justify-end" : "justify-start"
                                            }`}
                                            style={{ animationDelay: `${idx * 15}ms` }}
                                        >
                                            <div
                                                className={`flex max-w-[80%] flex-col ${
                                                    isOutbound ? "items-end" : "items-start"
                                                }`}
                                            >
                                                {showSender && (
                                                    <span className="mb-0.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/40">
                                                        {message.sender_type === "ai"
                                                            ? "AI Assistant"
                                                            : message.sender_type.charAt(0).toUpperCase() +
                                                              message.sender_type.slice(1)}
                                                    </span>
                                                )}
                                                <div
                                                    className={`relative px-3.5 py-2 ${
                                                        isOutbound
                                                            ? "bg-brand-deep text-white shadow-sm"
                                                            : "border border-border/40 bg-muted/20"
                                                    } ${
                                                        isFirst && isOutbound
                                                            ? "rounded-2xl rounded-br-md"
                                                            : isFirst && !isOutbound
                                                              ? "rounded-2xl rounded-bl-md"
                                                              : isLast && isOutbound
                                                                ? "rounded-2xl rounded-tr-md"
                                                                : isLast && !isOutbound
                                                                  ? "rounded-2xl rounded-tl-md"
                                                                  : "rounded-2xl"
                                                    }`}
                                                >
                                                    <p className="text-sm leading-6">
                                                        {message.text || "(No message text)"}
                                                    </p>
                                                </div>
                                                <div className="mt-0.5 flex items-center gap-2 px-1">
                                                    <span
                                                        className={`text-[10px] font-medium ${
                                                            isOutbound
                                                                ? "text-right"
                                                                : "text-left"
                                                        } text-muted-foreground/40`}
                                                    >
                                                        {message.created_at
                                                            ? formatMessageTime(message.created_at)
                                                            : ""}
                                                        {message.delivery_status &&
                                                            ` · ${message.delivery_status}`}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                                {detail.isLoading && (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/50" />
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* ── Sidebar ────────────────────────────── */}
                            {sidebarOpen && (
                                <aside className="min-h-0 overflow-y-auto border-t border-border/30 bg-muted/[0.04] p-3 xl:border-l xl:border-t-0">
                                    {/* Details card */}
                                    <div className="rounded-xl border border-border/40 bg-background/80 p-3">
                                        <h4 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                                            <span className="h-1.5 w-1.5 rounded-full bg-brand-deep/40" />
                                            Details
                                        </h4>
                                        <dl className="space-y-2 text-xs">
                                            <div className="flex items-center justify-between gap-2">
                                                <dt className="text-muted-foreground/60">Status</dt>
                                                <dd>
                                                    <span
                                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                                            selected.status === "open" ||
                                                            selected.status === "pending_customer"
                                                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                                                                : selected.status === "resolved"
                                                                  ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                                                  : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                                                        }`}
                                                    >
                                                        {(selected.status === "open" ||
                                                            selected.status ===
                                                                "pending_customer") && (
                                                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                                        )}
                                                        {selected.status.replace("_", " ")}
                                                    </span>
                                                </dd>
                                            </div>
                                            <div className="flex items-center justify-between gap-2 border-t border-border/15 pt-2">
                                                <dt className="text-muted-foreground/60">Mode</dt>
                                                <dd
                                                    className={`text-xs font-medium capitalize ${
                                                        selected.mode === "human"
                                                            ? "text-amber-600 dark:text-amber-400"
                                                            : "text-emerald-600 dark:text-emerald-400"
                                                    }`}
                                                >
                                                    {selected.mode}
                                                </dd>
                                            </div>
                                            <div className="flex items-center justify-between gap-2 border-t border-border/15 pt-2">
                                                <dt className="text-muted-foreground/60">
                                                    Assigned
                                                </dt>
                                                <dd className="text-xs font-medium text-muted-foreground/80">
                                                    {selected.assigned_to_name || "Unassigned"}
                                                </dd>
                                            </div>
                                            <div className="flex items-center justify-between gap-2 border-t border-border/15 pt-2">
                                                <dt className="text-muted-foreground/60">Unread</dt>
                                                <dd
                                                    className={`text-xs font-medium ${
                                                        selected.unread_count > 0
                                                            ? "text-foreground"
                                                            : "text-muted-foreground/50"
                                                    }`}
                                                >
                                                    {selected.unread_count}
                                                </dd>
                                            </div>
                                        </dl>
                                    </div>

                                    {/* Assign to me */}
                                    {can("MANAGE_WHATSAPP_CONVERSATIONS") &&
                                        selected.assigned_to_user_id !== user?.id &&
                                        user?.id && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    assignConversation.mutate({
                                                        id: selected.id,
                                                        userId: user.id,
                                                    })
                                                }
                                                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border/40 bg-background/80 px-3 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground"
                                            >
                                                <UserRound className="h-3.5 w-3.5" />
                                                Assign to me
                                            </button>
                                        )}

                                    {/* Template sender */}
                                    {can("MANAGE_WHATSAPP_CONVERSATIONS") && (
                                        <div className="mt-2.5 rounded-xl border border-border/40 bg-background/80 p-3">
                                            <h4 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                                                <ClipboardList className="h-3.5 w-3.5" />
                                                Send template
                                            </h4>
                                            <div className="space-y-2">
                                                <Select
                                                    value={selectedTemplate}
                                                    onValueChange={setSelectedTemplate}
                                                >
                                                    <SelectTrigger className="h-8 rounded-lg text-xs">
                                                        <SelectValue placeholder="Select template" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {sendableTemplates.length ? (
                                                            sendableTemplates.map((template) => (
                                                                <SelectItem
                                                                    key={template.key}
                                                                    value={template.key}
                                                                >
                                                                    {template.name}
                                                                </SelectItem>
                                                            ))
                                                        ) : (
                                                            <SelectItem
                                                                value="__none__"
                                                                disabled
                                                            >
                                                                No templates available
                                                            </SelectItem>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <textarea
                                                    value={templateVariables}
                                                    onChange={(e) =>
                                                        setTemplateVariables(e.target.value)
                                                    }
                                                    rows={3}
                                                    placeholder='{"customer_name":"Amina"}'
                                                    aria-label="Template variables"
                                                    className="min-h-0 w-full resize-none rounded-lg border border-border/40 bg-muted/10 px-2.5 py-1.5 font-mono text-[11px] outline-none placeholder:text-muted-foreground/30 focus:border-brand-deep/20 dark:bg-white/5"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={submitTemplate}
                                                    disabled={
                                                        sendTemplate.isPending || !selectedTemplate
                                                    }
                                                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-deep px-3 py-1.5 text-[11px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                                                >
                                                    {sendTemplate.isPending ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <SendHorizonal className="h-3 w-3" />
                                                    )}
                                                    Send template
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </aside>
                            )}
                        </div>

                        {/* ── Reply form ─────────────────────────────── */}
                        {can("MANAGE_WHATSAPP_CONVERSATIONS") && (
                            <div className="shrink-0 border-t border-border/30 bg-background/98 px-4 py-3">
                                <div className="mx-auto flex max-w-3xl items-end gap-2">
                                    <div className="relative flex-1">
                                        <textarea
                                            value={draft}
                                            onChange={(e) => setDraft(e.target.value)}
                                            placeholder="Type a reply…"
                                            rows={1}
                                            aria-label="Reply message"
                                            className="min-h-[44px] w-full resize-none rounded-xl border border-border/50 bg-muted/10 px-3.5 py-3 text-sm outline-none placeholder:text-muted-foreground/40 focus:border-brand-deep/20 focus:bg-background dark:bg-white/5"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && !e.shiftKey) {
                                                    e.preventDefault()
                                                    submitMessage()
                                                }
                                            }}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={submitMessage}
                                        disabled={sendMessage.isPending || !draft.trim()}
                                        className="flex h-[44px] w-[44px] shrink-0 items-center justify-center self-center rounded-xl bg-brand-deep text-white transition-all hover:opacity-90 disabled:opacity-30"
                                    >
                                        {sendMessage.isPending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <SendHorizonal className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </section>
        </div>
    )
}

// ─── Public export ───────────────────────────────────────────────────────────

export function WhatsAppInboxPageView() {
    return (
        <div className="mx-auto h-[calc(100svh-2rem)] max-w-[1540px] overflow-hidden">
            <InboxTab />
        </div>
    )
}
