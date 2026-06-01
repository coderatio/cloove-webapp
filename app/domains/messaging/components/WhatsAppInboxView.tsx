"use client"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import {
    ArrowLeft,
    Bot,
    CheckCircle2,
    ClipboardList,
    FileText,
    GitBranch,
    Inbox,
    Loader2,
    MessageSquare,
    MousePointerClick,
    PackageCheck,
    PanelRightClose,
    PanelRightOpen,
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
    type WhatsAppInboxConversation,
    type WhatsAppInboxMessage,
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

function formatMessageDate(dateStr: string) {
    const date = new Date(dateStr)
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)

    if (date.toDateString() === now.toDateString()) return "Today"
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday"
    return date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })
}

function latestConversationActivity(conversation: WhatsAppInboxConversation) {
    return Math.max(
        conversation.last_inbound_at ? new Date(conversation.last_inbound_at).getTime() : 0,
        conversation.last_outbound_at ? new Date(conversation.last_outbound_at).getTime() : 0,
        conversation.updated_at ? new Date(conversation.updated_at).getTime() : 0
    )
}

function latestConversationActivityIso(conversation: WhatsAppInboxConversation) {
    const candidates = [
        conversation.last_inbound_at,
        conversation.last_outbound_at,
        conversation.updated_at,
    ].filter((value): value is string => !!value)

    return candidates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null
}

function getInitial(name: string) {
    return name.charAt(0).toUpperCase()
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === "object" && !Array.isArray(value)
}

function stringValue(value: unknown) {
    return typeof value === "string" ? value : ""
}

function payloadEntries(payload: unknown) {
    if (!isRecord(payload)) return []
    return Object.entries(payload)
        .filter(([, value]) => value !== null && value !== undefined && value !== "")
        .slice(0, 8)
}

function formatPayloadValue(value: unknown): string {
    if (typeof value === "string") return value
    if (typeof value === "number" || typeof value === "boolean") return String(value)
    if (Array.isArray(value)) return value.map(formatPayloadValue).join(", ")
    if (isRecord(value)) return JSON.stringify(value)
    return ""
}

function parseReplyFallback(text: string | null) {
    const match = text?.match(/^(.*)\s+\(([^)]+)\)$/)
    if (!match) return null
    return { title: match[1].trim(), id: match[2].trim() }
}

function ConversationAvatar({
    name,
    mode,
    unreadCount = 0,
    size = "md",
}: {
    name: string
    mode: "ai" | "human"
    unreadCount?: number
    size?: "sm" | "md" | "lg"
}) {
    const sizeClass = size === "lg" ? "h-11 w-11 text-sm" : size === "sm" ? "h-9 w-9 text-xs" : "h-10 w-10 text-sm"
    const modeClass = mode === "human"
        ? "bg-brand-gold/10 text-brand-gold ring-brand-gold/20 dark:bg-brand-gold/15 dark:text-brand-gold-300"
        : "bg-brand-deep/10 text-brand-deep ring-brand-deep/10 dark:bg-brand-gold/10 dark:text-brand-gold-300 dark:ring-brand-gold/15"

    return (
        <div className={`relative flex shrink-0 items-center justify-center rounded-2xl font-semibold ring-1 ${sizeClass} ${modeClass}`}>
            {getInitial(name)}
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-950" />
            {unreadCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-gold px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-950">
                    {unreadCount > 9 ? "9+" : unreadCount}
                </span>
            )}
        </div>
    )
}

function ModePill({ mode }: { mode: "ai" | "human" }) {
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                mode === "human"
                    ? "bg-brand-gold/10 text-brand-gold dark:bg-brand-gold/15 dark:text-brand-gold-300"
                    : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
            }`}
        >
            {mode === "human" ? <UserRound className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
            {mode}
        </span>
    )
}

function MessageContent({ message, isOutbound }: { message: WhatsAppInboxMessage; isOutbound: boolean }) {
    const payload = message.payload
    const payloadType = stringValue(payload?.type)
    const reply = isRecord(payload?.reply) ? payload.reply : null
    const flowData = isRecord(payload?.data) ? payload.data : payloadType === "flow_response" ? payload : null
    const order = isRecord(payload?.order) ? payload.order : null
    const location = isRecord(payload?.location) ? payload.location : null
    const sections = Array.isArray(payload?.sections) ? payload.sections.filter(isRecord) : []
    const buttons = Array.isArray(payload?.buttons) ? payload.buttons.filter(isRecord) : []
    const fallbackReply = parseReplyFallback(message.text)
    const subtleText = isOutbound ? "text-white/70" : "text-muted-foreground"
    const cardClass = isOutbound
        ? "border-brand-gold/20 bg-white/10 text-white"
        : "border-brand-gold/15 bg-white/80 text-foreground dark:bg-white/[0.04]"
    const actionClass = isOutbound
        ? "border-brand-gold/20 bg-brand-gold/10 text-brand-gold-100"
        : "border-brand-gold/15 bg-brand-gold/[0.06] text-foreground"

    if (message.message_type === "template") {
        return (
            <div className={`min-w-64 rounded-[18px] border p-3 ${cardClass}`}>
                <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase">
                    <ClipboardList className="h-3.5 w-3.5" />
                    Template
                </div>
                <p className="text-sm font-medium">{message.template_name || message.template_key || "Template message"}</p>
                {message.text && <p className={`mt-1 text-sm leading-6 ${subtleText}`}>{message.text}</p>}
                {payloadEntries(message.template_variables).length > 0 && (
                    <div className="mt-2 space-y-1 border-t border-current/10 pt-2">
                        {payloadEntries(message.template_variables).map(([key, value]) => (
                            <div key={key} className="flex gap-2 text-[11px]">
                                <span className={subtleText}>{key}</span>
                                <span className="ml-auto max-w-40 truncate font-medium">{formatPayloadValue(value)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )
    }

    if (payloadType === "button_reply" || payloadType === "list_reply" || fallbackReply) {
        const title = stringValue(reply?.title) || fallbackReply?.title || message.text || "Selected option"
        const id = stringValue(reply?.id) || fallbackReply?.id
        return (
            <div className={`min-w-56 rounded-[18px] border p-3 ${cardClass}`}>
                <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase">
                    <MousePointerClick className="h-3.5 w-3.5" />
                    {payloadType === "list_reply" ? "List selection" : "Button selection"}
                </div>
                <p className="text-sm font-medium">{title}</p>
                {id && <p className={`mt-1 break-all font-mono text-[11px] ${subtleText}`}>{id}</p>}
                {stringValue(reply?.description) && (
                    <p className={`mt-1 text-xs leading-5 ${subtleText}`}>{stringValue(reply?.description)}</p>
                )}
            </div>
        )
    }

    if (payloadType === "interactive_button") {
        return (
            <div className={`min-w-64 rounded-[18px] border p-3 ${cardClass}`}>
                <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase">
                    <MousePointerClick className="h-3.5 w-3.5" />
                    Buttons sent
                </div>
                {message.text && <p className="whitespace-pre-wrap text-sm leading-6">{message.text}</p>}
                <div className="mt-2 space-y-1.5">
                    {buttons.map((button, index) => (
                        <div key={`${stringValue(button.id)}-${index}`} className={`rounded-lg border px-2.5 py-1.5 text-xs ${actionClass}`}>
                            <span className="font-medium">{stringValue(button.title) || stringValue(button.text) || "Button"}</span>
                            {stringValue(button.id) && <span className={`ml-2 font-mono text-[10px] ${subtleText}`}>{stringValue(button.id)}</span>}
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (payloadType === "interactive_list" || payloadType === "interactive_product_list") {
        const isProductList = payloadType === "interactive_product_list"
        const visibleSections = sections.slice(0, 3).map((section) => {
            const rows = Array.isArray(section.rows)
                ? section.rows.filter(isRecord)
                : Array.isArray(section.product_items)
                  ? section.product_items.filter(isRecord)
                  : []

            return { section, rows }
        })
        const productCount = visibleSections.reduce((total, section) => total + section.rows.length, 0)

        return (
            <div className={`min-w-72 rounded-[18px] border p-3 ${cardClass}`}>
                <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase">
                    <ClipboardList className="h-3.5 w-3.5" />
                    {isProductList ? "Product list sent" : "List sent"}
                </div>
                {message.text && <p className="whitespace-pre-wrap text-sm leading-6">{message.text}</p>}
                {stringValue(payload?.buttonText) && (
                    <div className={`mt-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${actionClass}`}>
                        {stringValue(payload?.buttonText)}
                    </div>
                )}
                <div className="mt-2 space-y-2">
                    {isProductList ? (
                        <div className={`rounded-lg border px-2.5 py-2 text-xs ${actionClass}`}>
                            <p className="font-medium">
                                {productCount || "Catalog"} {productCount === 1 ? "item" : "items"} included
                            </p>
                            {visibleSections.length > 0 && (
                                <p className={`mt-0.5 ${subtleText}`}>
                                    {visibleSections
                                        .map(({ section, rows }) => {
                                            const title = stringValue(section.title) || "Catalog"
                                            return `${title} (${rows.length})`
                                        })
                                        .join(" · ")}
                                </p>
                            )}
                        </div>
                    ) : (
                        visibleSections.map(({ section, rows }, sectionIndex) => {
                            return (
                                <div key={`${stringValue(section.title)}-${sectionIndex}`} className="space-y-1">
                                    <p className={`text-[10px] font-semibold uppercase ${subtleText}`}>{stringValue(section.title) || "Section"}</p>
                                    {rows.slice(0, 4).map((row, rowIndex) => (
                                        <div key={`${rowIndex}-${formatPayloadValue(row.id)}`} className={`rounded-lg border px-2.5 py-1.5 text-xs ${actionClass}`}>
                                            <span className="font-medium">{stringValue(row.title) || "Item"}</span>
                                            {stringValue(row.description) && <p className={`mt-0.5 text-[11px] ${subtleText}`}>{stringValue(row.description)}</p>}
                                        </div>
                                    ))}
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        )
    }

    if (payloadType === "interactive_flow") {
        return (
            <div className={`min-w-64 rounded-[18px] border p-3 ${cardClass}`}>
                <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase">
                    <GitBranch className="h-3.5 w-3.5" />
                    Flow sent
                </div>
                <p className="text-sm font-medium">{stringValue(payload?.screenName) || "WhatsApp flow"}</p>
                {message.text && <p className={`mt-1 whitespace-pre-wrap text-sm leading-6 ${subtleText}`}>{message.text}</p>}
                <div className={`mt-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${actionClass}`}>
                    {stringValue(payload?.ctaText) || "Continue"}
                </div>
                {stringValue(payload?.flowId) && <p className={`mt-2 break-all font-mono text-[10px] ${subtleText}`}>{stringValue(payload?.flowId)}</p>}
            </div>
        )
    }

    if (payloadType === "interactive_cta_url") {
        return (
            <div className={`min-w-64 rounded-[18px] border p-3 ${cardClass}`}>
                <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase">
                    <MousePointerClick className="h-3.5 w-3.5" />
                    CTA sent
                </div>
                {message.text && <p className="whitespace-pre-wrap text-sm leading-6">{message.text}</p>}
                <div className={`mt-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${actionClass}`}>
                    {stringValue(payload?.displayText) || "Open"}
                </div>
                {stringValue(payload?.url) && <p className={`mt-2 break-all text-[11px] ${subtleText}`}>{stringValue(payload?.url)}</p>}
            </div>
        )
    }

    if (payloadType === "interactive_location_request") {
        return (
            <div className={`min-w-60 rounded-[18px] border p-3 ${cardClass}`}>
                <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase">
                    <FileText className="h-3.5 w-3.5" />
                    Location request sent
                </div>
                <p className="whitespace-pre-wrap text-sm leading-6">{message.text || stringValue(payload?.body) || "Please share your location."}</p>
                <div className={`mt-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${actionClass}`}>
                    Send location
                </div>
            </div>
        )
    }

    if (payloadType === "flow_response" && flowData) {
        return (
            <div className={`min-w-64 rounded-[18px] border p-3 ${cardClass}`}>
                <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase">
                    <GitBranch className="h-3.5 w-3.5" />
                    Flow response
                </div>
                <div className="space-y-1.5">
                    {payloadEntries(flowData).map(([key, value]) => (
                        <div key={key} className="rounded-lg bg-current/[0.04] px-2 py-1.5">
                            <p className={`text-[10px] uppercase ${subtleText}`}>{key.replace(/_/g, " ")}</p>
                            <p className="mt-0.5 break-words text-xs font-medium">{formatPayloadValue(value)}</p>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (payloadType === "order" && order) {
        const items = Array.isArray(order.items) ? order.items : []
        return (
            <div className={`min-w-60 rounded-[18px] border p-3 ${cardClass}`}>
                <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase">
                    <PackageCheck className="h-3.5 w-3.5" />
                    Catalog order
                </div>
                {message.text && <p className="text-sm">{message.text}</p>}
                <p className={`mt-1 text-xs ${subtleText}`}>{items.length} item{items.length === 1 ? "" : "s"} selected</p>
            </div>
        )
    }

    if (payloadType === "location" && location) {
        return (
            <div className={`min-w-60 rounded-[18px] border p-3 ${cardClass}`}>
                <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase">
                    <FileText className="h-3.5 w-3.5" />
                    Location
                </div>
                <p className="text-sm font-medium">{stringValue(location.name) || "Shared location"}</p>
                {stringValue(location.address) && <p className={`mt-1 text-xs ${subtleText}`}>{stringValue(location.address)}</p>}
            </div>
        )
    }

    return <p className="whitespace-pre-wrap text-sm leading-6">{message.text || "(No message text)"}</p>
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

    const activeConversationId = selectedId ?? conversations?.[0]?.id ?? null
    const detail = useWhatsAppConversation(activeConversationId)
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
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [selected?.messages])

    const sortedConversations = [...(conversations ?? [])].sort(
        (a, b) => latestConversationActivity(b) - latestConversationActivity(a)
    )
    const filteredConversations = sortedConversations.filter((conversation) => {
        const query = search.trim().toLowerCase()
        if (!query) return true
        return (
            conversation.customer_name?.toLowerCase().includes(query) ||
            conversation.customer_phone.toLowerCase().includes(query) ||
            conversation.number_label?.toLowerCase().includes(query)
        )
    })
    const unreadConversationCount = conversations?.filter((conversation) => conversation.unread_count > 0).length ?? 0
    const humanConversationCount = conversations?.filter((conversation) => conversation.mode === "human").length ?? 0
    const openConversationCount = conversations?.filter((conversation) => conversation.status === "open").length ?? 0

    const submitMessage = async () => {
        const text = draft.trim()
        if (!activeConversationId || !text) return
        try {
            await sendMessage.mutateAsync({ id: activeConversationId, text })
            setDraft("")
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to send message")
        }
    }

    const submitTemplate = async () => {
        if (!activeConversationId || !selectedTemplate) return
        try {
            const variables = JSON.parse(templateVariables || "{}") as Record<string, unknown>
            await sendTemplate.mutateAsync({
                id: activeConversationId,
                templateKey: selectedTemplate,
                variables,
            })
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Template send failed")
        }
    }

    return (
        <div className="flex h-full min-h-0 overflow-hidden rounded-[32px] border border-brand-gold/15 bg-linear-to-br from-white via-white to-brand-gold/[0.035] shadow-[0_24px_80px_-44px_rgba(15,23,42,0.35)] ring-1 ring-black/[0.02] dark:border-brand-gold/20 dark:from-white/[0.04] dark:via-white/[0.02] dark:to-brand-gold/[0.08]">
            {/* ── Conversation list ──────────────────────────────────── */}
            <section
                className={`flex h-full min-h-0 flex-col overflow-hidden border-r border-brand-gold/10 bg-white/75 transition-all duration-300 dark:bg-slate-950/55 ${
                    selected ? "hidden xl:flex xl:w-[380px]" : "flex-1 xl:w-[380px]"
                }`}
            >
                {/* Header */}
                <div className="shrink-0 border-b border-brand-gold/10 px-4 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-gold/10 text-brand-gold ring-1 ring-brand-gold/15 dark:bg-brand-gold/15 dark:text-brand-gold-300">
                            <Inbox className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-base font-semibold tracking-tight text-foreground">Inbox</h2>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {filteredConversations.length} conversation{filteredConversations.length === 1 ? "" : "s"}
                            </p>
                        </div>
                        <span className="rounded-full border border-brand-gold/15 bg-brand-gold/10 px-2.5 py-1 text-xs font-semibold text-brand-gold dark:bg-brand-gold/15 dark:text-brand-gold-300">
                            {unreadConversationCount} unread
                        </span>
                    </div>
                    {/* Search */}
                    <div className="relative mt-4">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name or number…"
                            aria-label="Search conversations"
                            className="h-11 w-full rounded-2xl border border-border/50 bg-white/80 pl-10 pr-3 text-sm outline-none placeholder:text-muted-foreground/40 transition-colors focus:border-brand-gold/35 focus:bg-white focus:ring-2 focus:ring-brand-gold/10 dark:bg-white/5 dark:focus:bg-white/10"
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
                    <div className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5">
                        {[
                            ["Open", openConversationCount],
                            ["Unread", unreadConversationCount],
                            ["Human", humanConversationCount],
                        ].map(([label, count]) => (
                            <span
                                key={label}
                                className="shrink-0 rounded-full border border-border/50 bg-background/80 px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                            >
                                {label} <span className="text-foreground">{count}</span>
                            </span>
                        ))}
                    </div>
                </div>

                {/* List */}
                <div className="min-h-0 flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="space-y-2 p-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="flex items-start gap-3 rounded-[22px] p-3">
                                    <Skeleton className="h-11 w-11 shrink-0 rounded-2xl" />
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
                        <div className="space-y-1.5 p-2.5">
                            {filteredConversations.map((conversation) => {
                                const isSelected = activeConversationId === conversation.id
                                const lastMsgTime = latestConversationActivityIso(conversation)
                                const customerLabel = conversation.customer_name || conversation.customer_phone
                                return (
                                    <button
                                        key={conversation.id}
                                        type="button"
                                        onClick={() => setSelectedId(conversation.id)}
                                        aria-current={isSelected ? "true" : undefined}
                                        className={`group flex w-full items-start gap-3 rounded-[22px] border px-3 py-3 text-left transition-all duration-200 ${
                                            isSelected
                                                ? "border-brand-gold/30 bg-brand-gold/[0.07] shadow-sm shadow-brand-gold/5"
                                                : "border-transparent hover:border-brand-gold/15 hover:bg-brand-gold/[0.035]"
                                        }`}
                                    >
                                        {/* Avatar */}
                                        <ConversationAvatar
                                            name={customerLabel}
                                            mode={conversation.mode}
                                            unreadCount={conversation.unread_count}
                                            size="lg"
                                        />

                                        {/* Content */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="truncate text-sm font-semibold text-foreground">
                                                    {customerLabel}
                                                </p>
                                                {lastMsgTime && (
                                                    <span className="shrink-0 text-[10px] font-medium text-muted-foreground/60">
                                                        {formatConversationDate(lastMsgTime)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
                                                <span className="truncate">
                                                    {conversation.number_label || "WhatsApp"}
                                                </span>
                                                <span className="text-border">·</span>
                                                <ModePill mode={conversation.mode} />
                                            </div>
                                            <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-muted-foreground/70">
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
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-gold/20 bg-brand-gold/10">
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
            <section className="flex flex-1 flex-col overflow-hidden bg-background/70">
                {!selected ? (
                    <div className="flex h-full items-center justify-center p-8">
                        <div className="max-w-xs space-y-3 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-gold/20 bg-brand-gold/10">
                                <MessageSquare className="h-6 w-6 text-brand-gold/70" />
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
                        <div className="shrink-0 border-b border-brand-gold/10 bg-white/85 px-4 py-3 backdrop-blur dark:bg-slate-950/70">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex min-w-0 flex-1 items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedId(null)}
                                        aria-label="Close conversation"
                                        className="flex h-8 w-8 items-center justify-center rounded-2xl text-muted-foreground/50 transition-colors hover:bg-brand-gold/10 hover:text-brand-gold xl:hidden"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                    </button>
                                    <ConversationAvatar
                                        name={selected.customer_name || selected.customer_phone}
                                        mode={selected.mode}
                                        unreadCount={selected.unread_count}
                                        size="lg"
                                    />
                                    <div className="min-w-0">
                                        <h3 className="truncate text-sm font-semibold leading-tight">
                                            {selected.customer_name || selected.customer_phone}
                                        </h3>
                                        <div className="mt-1 flex min-w-0 items-center gap-1.5">
                                            <ModePill mode={selected.mode} />
                                            <span className="truncate text-[11px] text-muted-foreground/60">
                                                {selected.number_label || selected.customer_phone}
                                            </span>
                                        </div>
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
                                                    className="flex h-9 items-center gap-1.5 rounded-full border border-brand-gold/20 bg-background px-3 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-brand-gold/10 hover:text-brand-deep dark:hover:text-brand-cream"
                                                >
                                                    <UserRound className="h-3.5 w-3.5" />
                                                    <span className="hidden sm:inline">Take over</span>
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        returnToAi.mutate({ id: selected.id })
                                                    }
                                                    className="flex h-9 items-center gap-1.5 rounded-full border border-brand-gold/20 bg-background px-3 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-brand-gold/10 hover:text-brand-deep dark:hover:text-brand-cream"
                                                >
                                                    <Bot className="h-3.5 w-3.5" />
                                                    <span className="hidden sm:inline">AI mode</span>
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    resolveConversation.mutate({ id: selected.id })
                                                }
                                                className="flex h-9 items-center gap-1.5 rounded-full border border-border/50 bg-background px-3 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                                            >
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                <span className="hidden sm:inline">Resolve</span>
                                            </button>
                                        </>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setSidebarOpen((p) => !p)}
                                        aria-label={sidebarOpen ? "Close details panel" : "Open details panel"}
                                        className={`hidden h-9 w-9 items-center justify-center rounded-full border transition-colors xl:flex ${
                                            sidebarOpen
                                                ? "border-brand-gold/20 bg-brand-gold/10 text-brand-gold"
                                                : "border-border/50 bg-background text-muted-foreground hover:bg-brand-gold/10 hover:text-brand-gold"
                                        }`}
                                    >
                                        {sidebarOpen ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ── AI paused banner ──────────────────────── */}
                        {selected.mode === "human" && (
                            <div className="mx-4 mt-3 animate-fade-in rounded-2xl border border-brand-gold/20 bg-brand-gold/[0.07] px-3.5 py-2.5 text-xs leading-5 text-brand-deep dark:bg-brand-gold/10 dark:text-brand-gold-200">
                                <div className="flex items-start gap-2">
                                    <Bot className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                    <span>
                                        AI responses are paused for this conversation.{" "}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                returnToAi.mutate({ id: selected.id })
                                            }
                                            className="font-medium underline underline-offset-2 transition-colors hover:text-brand-gold"
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
                            <div className="min-h-0 space-y-2 overflow-y-auto bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.045),transparent_34%),radial-gradient(circle_at_1px_1px,rgba(11,61,46,0.055)_1px,transparent_0),linear-gradient(180deg,rgba(255,255,255,0.62),rgba(255,255,255,0.24))] bg-[length:auto,22px_22px,auto] px-4 py-4 dark:bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.08),transparent_34%),radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.045)_1px,transparent_0),linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))]">
                                {selected.messages.map((message, idx) => {
                                    const isOutbound = message.direction === "outbound"
                                    const previousMessage = selected.messages[idx - 1]
                                    const currentDate = message.created_at ? new Date(message.created_at).toDateString() : ""
                                    const previousDate = previousMessage?.created_at ? new Date(previousMessage.created_at).toDateString() : ""
                                    const showDateSeparator = !!currentDate && currentDate !== previousDate
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
                                        <div key={message.id} className="space-y-2">
                                            {showDateSeparator ? (
                                                <div className="flex justify-center">
                                                    <span className="rounded-full border border-brand-gold/15 bg-white/85 px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm dark:bg-slate-950/75">
                                                        {message.created_at ? formatMessageDate(message.created_at) : ""}
                                                    </span>
                                                </div>
                                            ) : null}
                                            <div
                                                className={`flex animate-fade-in ${
                                                    isOutbound ? "justify-end" : "justify-start"
                                                }`}
                                                style={{ animationDelay: `${idx * 15}ms` }}
                                            >
                                                <div
                                                    className={`flex max-w-[88%] flex-col sm:max-w-[76%] ${
                                                        isOutbound ? "items-end" : "items-start"
                                                    }`}
                                                >
                                                    {showSender && (
                                                        <span className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/45">
                                                            {message.sender_type === "ai"
                                                                ? "AI Assistant"
                                                                : message.sender_type.charAt(0).toUpperCase() +
                                                                  message.sender_type.slice(1)}
                                                        </span>
                                                    )}
                                                    <div
                                                        className={`relative px-3.5 py-2.5 ${
                                                            isOutbound
                                                                ? "bg-brand-deep text-white shadow-sm shadow-brand-deep/10 ring-1 ring-brand-gold/15"
                                                                : "border border-border/50 bg-white/90 shadow-sm shadow-slate-950/[0.035] dark:bg-white/[0.055]"
                                                        } ${
                                                            isFirst && isOutbound
                                                                ? "rounded-[22px] rounded-br-md"
                                                                : isFirst && !isOutbound
                                                                  ? "rounded-[22px] rounded-bl-md"
                                                                  : isLast && isOutbound
                                                                    ? "rounded-[22px] rounded-tr-md"
                                                                    : isLast && !isOutbound
                                                                      ? "rounded-[22px] rounded-tl-md"
                                                                      : "rounded-[22px]"
                                                        }`}
                                                    >
                                                        <MessageContent message={message} isOutbound={isOutbound} />
                                                    </div>
                                                    <div className="mt-1 flex items-center gap-2 px-1">
                                                        <span
                                                            className={`text-[10px] font-medium ${
                                                                isOutbound
                                                                    ? "text-right"
                                                                    : "text-left"
                                                            } text-muted-foreground/45`}
                                                        >
                                                            {message.created_at
                                                                ? formatMessageTime(message.created_at)
                                                                : ""}
                                                            {isOutbound && message.delivery_status
                                                                ? ` · ${message.delivery_status}`
                                                                : ""}
                                                        </span>
                                                    </div>
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
                                <aside className="min-h-0 overflow-y-auto border-t border-brand-gold/10 bg-white/65 p-3 dark:bg-slate-950/45 xl:border-l xl:border-t-0">
                                    {/* Details card */}
                                    <div className="rounded-[22px] border border-brand-gold/15 bg-background/80 p-3">
                                        <h4 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                                            <span className="h-1.5 w-1.5 rounded-full bg-brand-gold" />
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
                                                                ? "bg-brand-gold/10 text-brand-gold dark:bg-brand-gold/15 dark:text-brand-gold-300"
                                                                : selected.status === "resolved"
                                                                  ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                                                  : "bg-brand-gold/10 text-brand-gold dark:bg-brand-gold/15 dark:text-brand-gold-300"
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
                                                            ? "text-brand-gold dark:text-brand-gold-300"
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
                                                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-brand-gold/20 bg-background/80 px-3 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-brand-gold/10 hover:text-brand-deep dark:hover:text-brand-cream"
                                            >
                                                <UserRound className="h-3.5 w-3.5" />
                                                Assign to me
                                            </button>
                                        )}

                                    {/* Template sender */}
                                    {can("MANAGE_WHATSAPP_CONVERSATIONS") && (
                                        <div className="mt-2.5 rounded-[22px] border border-brand-gold/15 bg-background/80 p-3">
                                            <h4 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                                                <ClipboardList className="h-3.5 w-3.5 text-brand-gold" />
                                                Send template
                                            </h4>
                                            <div className="space-y-2">
                                                <Select
                                                    value={selectedTemplate}
                                                    onValueChange={setSelectedTemplate}
                                                >
                                                    <SelectTrigger className="h-9 rounded-2xl border-brand-gold/15 text-xs focus:ring-brand-gold/20">
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
                                                    className="min-h-0 w-full resize-none rounded-2xl border border-border/40 bg-muted/10 px-2.5 py-1.5 font-mono text-[11px] outline-none placeholder:text-muted-foreground/30 focus:border-brand-gold/30 focus:ring-2 focus:ring-brand-gold/10 dark:bg-white/5"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={submitTemplate}
                                                    disabled={
                                                        sendTemplate.isPending || !selectedTemplate
                                                    }
                                                    className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-brand-deep px-3 py-2 text-[11px] font-medium text-brand-gold-300 transition-opacity hover:opacity-90 disabled:opacity-40 dark:bg-brand-gold-700 dark:text-white"
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
                            <div className="shrink-0 border-t border-brand-gold/10 bg-white/85 px-4 py-3 backdrop-blur dark:bg-slate-950/75">
                                <div className="mx-auto flex max-w-3xl items-end gap-2">
                                    <div className="relative flex-1">
                                        <textarea
                                            value={draft}
                                            onChange={(e) => setDraft(e.target.value)}
                                            placeholder="Type a reply…"
                                            rows={1}
                                            aria-label="Reply message"
                                            className="min-h-[46px] w-full resize-none rounded-2xl border border-border/50 bg-muted/10 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/40 focus:border-brand-gold/30 focus:bg-background focus:ring-2 focus:ring-brand-gold/10 dark:bg-white/5"
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
                                        className="flex h-[46px] w-[46px] shrink-0 items-center justify-center self-center rounded-2xl bg-brand-deep text-brand-gold-300 transition-all hover:opacity-90 disabled:opacity-30 dark:bg-brand-gold-700 dark:text-white"
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
