"use client"

import { useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { useSearchParams } from "next/navigation"
import {
    Archive,
    Bot,
    CheckCircle2,
    ChevronDown,
    ClipboardList,
    GitBranch,
    Info,
    Loader2,
    MessageSquare,
    PanelsTopLeft,
    PencilLine,
    Plus,
    Search,
    UserRound,
    X,
} from "lucide-react"
import { ManagementHeader } from "@/app/components/shared/ManagementHeader"
import { Button } from "@/app/components/ui/button"
import { Textarea } from "@/app/components/ui/textarea"
import { Input } from "@/app/components/ui/input"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Badge } from "@/app/components/ui/badge"
import { Skeleton } from "@/app/components/ui/skeleton"
import { Pagination } from "@/app/components/shared/Pagination"
import {
    SideSheet,
    SideSheetContent,
    SideSheetStickyHeader,
    SideSheetBody,
    SideSheetTitle,
    SideSheetDescription,
    SideSheetFooter,
} from "@/app/components/ui/side-sheet"
import { formatPhoneNumber } from "@/app/lib/utils"
import { useAuth } from "@/app/components/providers/auth-provider"
import { usePermission } from "@/app/hooks/usePermission"
import { useDebounce } from "@/app/hooks/useDebounce"
import { WhatsAppSettings } from "@/app/domains/messaging/components/WhatsAppSettings"
import { FlowsTab } from "@/app/domains/messaging/components/FlowsTab"
import { useWhatsAppNumbers } from "@/app/domains/messaging/hooks/useWhatsAppSettings"
import {
    useArchiveWhatsAppTemplate,
    useAssignConversation,
    useCreateWhatsAppTemplate,
    usePublishWhatsAppTemplate,
    useResolveConversation,
    useReturnConversationToAi,
    useSendConversationMessage,
    useSendConversationTemplate,
    useTakeOverConversation,
    useTestSendTemplate,
    useUpdateWhatsAppTemplate,
    useWhatsAppConversation,
    useWhatsAppConversations,
    useWhatsAppFlows,
    useWhatsAppOverview,
    useWhatsAppTemplateStatsForNumber,
    useWhatsAppTemplates,
    type WhatsAppTemplateSummary,
    type WhatsAppFlowSummary,
} from "@/app/domains/messaging/hooks/useWhatsAppInbox"

type WhatsAppTab = "overview" | "templates" | "flows" | "connections" | "automation"

const TAB_COPY: Record<WhatsAppTab, { title: string; description: string }> = {
    overview: {
        title: "WhatsApp",
        description: "Operational visibility across inbox activity, AI coverage, and connected numbers.",
    },
    templates: {
        title: "Templates",
        description: "Build approval-safe templates with buttons, linked flows, and Meta readiness checks.",
    },
    flows: {
        title: "Flows",
        description: "Published WhatsApp flows available for template CTA buttons and guided customer actions.",
    },
    connections: {
        title: "Connections",
        description: "Business number setup, Meta onboarding, webhook health, and connection recovery.",
    },
    automation: {
        title: "Automation",
        description: "AI behavior, welcome and fallback copy, business context, and notification rules.",
    },
}

const VALID_TABS: WhatsAppTab[] = ["overview", "templates", "flows", "connections", "automation"]

const TEMPLATE_LANGUAGE_OPTIONS = [
    { value: "en", label: "English" },
    { value: "en_US", label: "English (US)" },
    { value: "en_GB", label: "English (UK)" },
] as const

function isValidTab(value: string | null): value is WhatsAppTab {
    return value !== null && VALID_TABS.includes(value as WhatsAppTab)
}

function formatWhatsAppNumberLabel(number: {
    display_name?: string | null
    display_phone_number?: string | null
    phone_number?: string | null
}) {
    const name = number.display_name?.trim() || "WhatsApp number"
    const rawPhone = number.display_phone_number?.trim() || number.phone_number?.trim() || null
    const phone =
        formatPhoneNumber(rawPhone, { spaced: true }) ||
        rawPhone
    return phone ? `${name} (${phone})` : name
}

function buildTemplateKey(name: string) {
    return name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
}

function extractTemplatePlaceholders(body: string) {
    return Array.from(body.matchAll(/{{\s*([a-zA-Z0-9_]+)\s*}}/g)).map((match) => match[1])
}

type TemplateButtonDraft = {
    type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER" | "FLOW"
    text: string
    url?: string
    phone_number?: string
    flow_id?: string
    flow_action?: "navigate" | "data_exchange"
    navigate_screen?: string
}

type TemplateVariableDraft = {
    key: string
    label: string
    required: boolean
    example: string
}

function parseTemplateComponents(components: Array<Record<string, unknown>> | null | undefined) {
    const header = components?.find((component) => component.type === "HEADER")
    const footer = components?.find((component) => component.type === "FOOTER")
    const buttons = components?.find((component) => component.type === "BUTTONS")

    return {
        headerText: typeof header?.text === "string" ? header.text : "",
        footerText: typeof footer?.text === "string" ? footer.text : "",
        buttons: Array.isArray(buttons?.buttons)
            ? buttons.buttons.map((button) => ({
                type: String(button.type || "QUICK_REPLY").toUpperCase() as TemplateButtonDraft["type"],
                text: typeof button.text === "string" ? button.text : "",
                url: typeof button.url === "string" ? button.url : "",
                phone_number: typeof button.phone_number === "string" ? button.phone_number : "",
                flow_id: typeof button.flow_id === "string" ? button.flow_id : "",
                flow_action:
                    button.flow_action === "data_exchange" ? "data_exchange" : "navigate",
                navigate_screen: typeof button.navigate_screen === "string" ? button.navigate_screen : "",
            }))
            : [],
    }
}

function buildLocalTemplateReadiness(input: {
    body: string
    language: string
    variables: TemplateVariableDraft[]
    headerText: string
    footerText: string
    buttons: TemplateButtonDraft[]
}) {
    const errors: string[] = []
    const warnings: string[] = []
    const body = input.body.trim()
    const placeholders = Array.from(body.matchAll(/{{\s*([a-zA-Z0-9_]+)\s*}}/g)).map((match) => match[1])
    const variableKeys = new Set(input.variables.map((variable) => variable.key.trim()).filter(Boolean))

    if (!body) errors.push("Template body is required.")
    if (body.length > 1024) errors.push("Body should stay within 1024 characters.")
    if (input.headerText.trim().length > 60) errors.push("Header text should be 60 characters or fewer.")
    if (input.footerText.trim().length > 60) errors.push("Footer text should be 60 characters or fewer.")
    if (input.language.trim().toLowerCase() !== "en") {
        warnings.push("Use English for initial Meta review submissions.")
    }

    placeholders.forEach((placeholder) => {
        if (!variableKeys.has(placeholder)) {
            errors.push(`Missing variable row for ${placeholder}.`)
        }
    })

    input.variables.forEach((variable) => {
        if (!variable.key.trim()) {
            errors.push("Every variable row needs a key.")
        }
        if (!variable.example.trim()) {
            errors.push(`Variable ${variable.key || "row"} needs an example value.`)
        }
    })

    if (input.buttons.length > 3) {
        errors.push("Use at most 3 buttons.")
    }

    const ctaButtons = input.buttons.filter((button) => button.type !== "QUICK_REPLY")
    if (ctaButtons.length > 1) {
        errors.push("Use only one CTA button type per template.")
    }
    if (ctaButtons.length > 0 && input.buttons.some((button) => button.type === "QUICK_REPLY")) {
        errors.push("Do not mix quick replies with CTA buttons.")
    }

    input.buttons.forEach((button) => {
        if (!button.text.trim()) errors.push("Each button needs text.")
        if (button.text.trim().length > 25) errors.push(`Button "${button.text}" should be 25 characters or fewer.`)
        if (button.type === "URL" && !button.url?.trim()) errors.push(`Button "${button.text}" needs a URL.`)
        if (button.type === "PHONE_NUMBER" && !button.phone_number?.trim()) errors.push(`Button "${button.text}" needs a phone number.`)
        if (button.type === "FLOW" && !button.flow_id?.trim()) errors.push(`Button "${button.text}" needs a published flow.`)
    })

    return {
        isReady: errors.length === 0,
        errors,
        warnings,
    }
}

export function WhatsAppAppView() {
    const searchParams = useSearchParams()
    const tabParam = searchParams.get("tab")
    const activeTab: WhatsAppTab = isValidTab(tabParam) ? tabParam : "overview"
    const tabCopy = TAB_COPY[activeTab]

    return (
        <div className="mx-auto max-w-7xl space-y-6 pb-20">
            <ManagementHeader
                title={tabCopy.title}
                description={tabCopy.description}
            />

            {activeTab === "overview" && <OverviewTab />}
            {activeTab === "templates" && <TemplatesTab />}
            {activeTab === "flows" && <FlowsTab />}
            {activeTab === "connections" && (
                <WhatsAppSettings initialTab="connections" allowedTabs={["connections"]} />
            )}
            {activeTab === "automation" && (
                <WhatsAppSettings initialTab="general" allowedTabs={["general", "notifications", "ai"]} />
            )}
        </div>
    )
}

export function WhatsAppInboxPageView() {
    return (
        <div className="mx-auto h-[calc(100svh-2rem)] max-w-[1540px] overflow-hidden">
            <InboxTab />
        </div>
    )
}

function OverviewTab() {
    const { data, isLoading } = useWhatsAppOverview()

    const metrics = [
        { label: "Open chats", value: data?.openConversations ?? 0 },
        { label: "Human takeover", value: data?.humanManagedConversations ?? 0 },
        { label: "AI managed", value: data?.aiManagedConversations ?? 0 },
        { label: "Unread", value: data?.unreadMessages ?? 0 },
        { label: "Connected numbers", value: data?.connectedNumbers ?? 0 },
    ]

    return (
        <div className="space-y-10">
            {/* Metrics bar */}
            <section>
                <div className="mb-4 flex items-center gap-2">
                    <div className="h-1 w-6 rounded-full bg-brand-deep/20 dark:bg-brand-gold-700/40" />
                    <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                        At a glance
                    </h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, index) => (
                            <GlassCard key={index} className="p-5">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="mt-3 h-10 w-16 rounded-xl" />
                            </GlassCard>
                        ))
                    ) : (
                        metrics.map((metric) => (
                            <GlassCard key={metric.label} className="p-5">
                                <p className="text-sm text-muted-foreground">{metric.label}</p>
                                <p className="mt-2 text-3xl font-semibold tabular-nums">
                                    {metric.value}
                                </p>
                            </GlassCard>
                        ))
                    )}
                </div>
            </section>

            {/* Recent activity */}
            <section>
                <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-muted/30">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-foreground">Recent activity</h2>
                        <p className="text-xs text-muted-foreground">Latest WhatsApp interactions across all numbers</p>
                    </div>
                </div>
                <GlassCard className="divide-y divide-border/40 overflow-hidden p-0">
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, index) => (
                            <div key={index} className="px-5 py-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2.5">
                                        <Skeleton className="h-2 w-2 rounded-full" />
                                        <Skeleton className="h-4 w-28" />
                                    </div>
                                    <Skeleton className="h-3 w-16" />
                                </div>
                                <Skeleton className="mt-3 h-4 w-full" />
                                <Skeleton className="mt-2 h-4 w-3/4" />
                            </div>
                        ))
                    ) : data?.recentMessages?.length ? data.recentMessages.map((message) => (
                        <div key={message.id} className="px-5 py-4 transition-colors hover:bg-muted/20">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2.5">
                                    <div className={`h-2 w-2 rounded-full ${message.sender_type === "customer"
                                        ? "bg-emerald-500"
                                        : message.sender_type === "ai"
                                            ? "bg-blue-500"
                                            : "bg-amber-500"
                                        }`} />
                                    <p className="text-sm font-medium">
                                        {message.sender_type === "customer"
                                            ? "Customer"
                                            : message.sender_type === "ai"
                                                ? "AI Assistant"
                                                : message.sender_type.charAt(0).toUpperCase() + message.sender_type.slice(1)}
                                    </p>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {message.created_at
                                        ? formatDistanceToNow(new Date(message.created_at), { addSuffix: true })
                                        : "just now"}
                                </span>
                            </div>
                            <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-muted-foreground">
                                {message.text || "No preview available."}
                            </p>
                        </div>
                    )) : (
                        <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
                            <MessageSquare className="h-6 w-6 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">No WhatsApp activity yet.</p>
                        </div>
                    )}
                </GlassCard>
            </section>
        </div>
    )
}

function InboxTab() {
    const { user } = useAuth()
    const { can } = usePermission()
    const { data: conversations, isLoading } = useWhatsAppConversations()
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [search, setSearch] = useState("")
    const [draft, setDraft] = useState("")
    const [selectedTemplate, setSelectedTemplate] = useState<string>("")
    const [templateVariables, setTemplateVariables] = useState("{}")
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
        <div className="h-full min-h-0 overflow-hidden rounded-2xl border border-border/50 bg-background/90 shadow-sm">
            <div className="grid h-full min-h-0 xl:grid-cols-[360px_minmax(0,1fr)]">
                {/* Conversation list */}
                <section className="flex h-full min-h-0 flex-col overflow-hidden border-b border-border/50 bg-muted/[0.08] xl:border-b-0 xl:border-r">
                    <div className="shrink-0 border-b border-border/40 px-4 py-3.5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-muted/30">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold">Inbox</h3>
                            <p className="text-xs text-muted-foreground">
                                {filteredConversations.length} conversation{filteredConversations.length !== 1 ? "s" : ""}
                            </p>
                        </div>
                    </div>
                    <div className="relative mt-3">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by customer or number"
                            className="pl-9"
                        />
                    </div>
                    </div>
                    <div className="min-h-0 flex-1 space-y-0 overflow-y-auto">
                    {isLoading ? (
                        <div className="space-y-2 px-3 py-3">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div key={index} className="rounded-xl border border-border/40 p-3.5">
                                    <div className="flex items-start gap-3">
                                        <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                                        <div className="min-w-0 flex-1 space-y-2">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-20" />
                                        </div>
                                    </div>
                                    <Skeleton className="mt-2.5 h-3 w-full" />
                                </div>
                            ))}
                        </div>
                    ) : filteredConversations.length ? (
                        <div>
                            {filteredConversations.map((conversation) => {
                                const isSelected = selectedId === conversation.id
                                const initial = (conversation.customer_name || conversation.customer_phone).charAt(0).toUpperCase()
                                return (
                                    <button
                                        key={conversation.id}
                                        type="button"
                                        onClick={() => setSelectedId(conversation.id)}
                                        className={`w-full border-b border-border/35 px-4 py-3 text-left transition-colors ${isSelected
                                            ? "bg-brand-deep/[0.07]"
                                            : "bg-transparent hover:bg-muted/35"
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Avatar circle */}
                                            <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${conversation.mode === "human"
                                                ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                                                : "bg-brand-deep/10 text-brand-deep/70 dark:bg-brand-gold-700/20 dark:text-brand-gold-300"
                                                }`}>
                                                {initial}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="truncate text-sm font-medium">
                                                        {conversation.customer_name || conversation.customer_phone}
                                                    </p>
                                                    {conversation.unread_count > 0 && (
                                                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-deep px-1.5 text-[11px] font-semibold text-white dark:bg-brand-gold-600 dark:text-brand-deep-900">
                                                            {conversation.unread_count > 99 ? "99+" : conversation.unread_count}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span className="truncate">{conversation.number_label || "WhatsApp number"}</span>
                                                    <span className="text-border">·</span>
                                                    <span className={`capitalize ${conversation.mode === "human"
                                                        ? "text-amber-600 dark:text-amber-400"
                                                        : "text-emerald-600 dark:text-emerald-400"
                                                        }`}>
                                                        {conversation.mode}
                                                    </span>
                                                </div>
                                                <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted-foreground">
                                                    {conversation.last_customer_message || conversation.context_summary || "No context yet."}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                )
                            })
                            }
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/60 bg-muted/30">
                                <MessageSquare className="h-6 w-6 text-muted-foreground/50" />
                            </div>
                            <p className="text-sm font-medium text-foreground">No conversations yet</p>
                            <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
                                Incoming WhatsApp messages from your customers will appear here.
                            </p>
                        </div>
                    )}
                    </div>
                </section>

                {/* Message detail */}
                <section className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
                {!selected ? (
                    <div className="flex h-full items-center justify-center p-8 text-center">
                        <div className="max-w-xs space-y-3">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-border/60 bg-muted/30">
                                <MessageSquare className="h-6 w-6 text-muted-foreground/50" />
                            </div>
                            <p className="text-sm font-medium text-foreground">Select a conversation</p>
                            <p className="text-xs leading-relaxed text-muted-foreground">
                                Choose a conversation from the left to review messages, take over from AI, or reply as a human.
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Conversation header */}
                        <div className="shrink-0 border-b border-border/40 px-5 py-3.5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex min-w-0 flex-1 items-center gap-3">
                                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${selected.mode === "human"
                                        ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                                        : "bg-brand-deep/10 text-brand-deep/70 dark:bg-brand-gold-700/20 dark:text-brand-gold-300"
                                        }`}>
                                        {(selected.customer_name || selected.customer_phone).charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="truncate text-base font-semibold">
                                            {selected.customer_name || selected.customer_phone}
                                        </h3>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {selected.customer_phone}
                                            {selected.number_label ? <span> · {selected.number_label}</span> : null}
                                        </p>
                                    </div>
                                </div>
                                {can("MANAGE_WHATSAPP_CONVERSATIONS") && (
                                    <div className="flex shrink-0 flex-wrap gap-1.5">
                                        {selected.mode === "ai" ? (
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="rounded-full text-xs"
                                                onClick={() => takeover.mutate({ id: selected.id })}
                                            >
                                                <UserRound className="mr-1.5 h-3.5 w-3.5" />
                                                Take over
                                            </Button>
                                        ) : (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="rounded-full text-xs"
                                                onClick={() => returnToAi.mutate({ id: selected.id })}
                                            >
                                                <Bot className="mr-1.5 h-3.5 w-3.5" />
                                                Return to AI
                                            </Button>
                                        )}
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="rounded-full text-xs"
                                            onClick={() => resolveConversation.mutate({ id: selected.id })}
                                        >
                                            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                                            Resolve
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* AI paused banner */}
                        {selected.mode === "human" && (
                            <div className="mx-5 mt-4 rounded-xl border border-amber-200/60 bg-amber-50/70 px-4 py-3 text-sm leading-6 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/8 dark:text-amber-200">
                                <div className="flex items-start gap-2.5">
                                    <Bot className="mt-0.5 h-4 w-4 shrink-0" />
                                    <span>AI is paused for this conversation until a human returns it to AI.</span>
                                </div>
                            </div>
                        )}

                        {/* Messages + sidebar */}
                        <div className="grid min-h-0 flex-1 overflow-hidden xl:grid-cols-[minmax(0,1fr)_300px]">
                            {/* Messages */}
                            <div className="min-h-0 space-y-2 overflow-y-auto px-5 py-4">
                                {selected.messages.map((message, idx) => {
                                    const isOutbound = message.direction === "outbound"
                                    const showAvatar = idx === 0 || selected.messages[idx - 1]?.sender_type !== message.sender_type
                                    return (
                                        <div
                                            key={message.id}
                                            className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}
                                        >
                                            <div
                                                className={`max-w-[80%] space-y-1 ${isOutbound ? "items-end" : "items-start"
                                                    }`}
                                            >
                                                {showAvatar && (
                                                    <p className="px-1 text-[11px] font-medium uppercase text-muted-foreground/60">
                                                        {message.sender_type === "customer"
                                                            ? selected.customer_name || "Customer"
                                                            : message.sender_type === "ai"
                                                                ? "AI Assistant"
                                                                : message.sender_type.charAt(0).toUpperCase() + message.sender_type.slice(1)}
                                                    </p>
                                                )}
                                                <div
                                                    className={`rounded-2xl px-4 py-2.5 shadow-sm ${isOutbound
                                                        ? "bg-brand-deep text-white"
                                                        : "border border-border/40 bg-muted/25"
                                                        }`}
                                                >
                                                    <p className="text-sm leading-6">
                                                        {message.text || "(No message text)"}
                                                    </p>
                                                </div>
                                                <p className={`px-1 text-[11px] text-muted-foreground/50 ${isOutbound ? "text-right" : "text-left"}`}>
                                                    {message.delivery_status}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                                {detail.isLoading && (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                    </div>
                                )}
                            </div>

                            {/* Sidebar info */}
                            <aside className="min-h-0 space-y-3 overflow-y-auto border-t border-border/40 bg-muted/[0.12] p-4 xl:border-l xl:border-t-0">
                                {/* Details */}
                                <div className="rounded-xl border border-border/40 bg-background/70 p-3.5">
                                    <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Details
                                    </h4>
                                    <dl className="space-y-3 text-sm">
                                        <div className="flex items-center justify-between gap-3">
                                            <dt className="text-xs text-muted-foreground">Status</dt>
                                            <dd>
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${selected.status === "open" || selected.status === "pending_customer"
                                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                                                    : selected.status === "resolved"
                                                        ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                                        : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                                                    }`}>
                                                    {(selected.status === "open" || selected.status === "pending_customer") && (
                                                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                                    )}
                                                    {selected.status.replace("_", " ")}
                                                </span>
                                            </dd>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 border-t border-border/20 pt-3">
                                            <dt className="text-xs text-muted-foreground">Mode</dt>
                                            <dd className={`text-xs font-medium capitalize ${selected.mode === "human"
                                                ? "text-amber-600 dark:text-amber-400"
                                                : "text-emerald-600 dark:text-emerald-400"
                                                }`}>{selected.mode}</dd>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 border-t border-border/20 pt-3">
                                            <dt className="text-xs text-muted-foreground">Assigned</dt>
                                            <dd className="text-xs font-medium">{selected.assigned_to_name || "Unassigned"}</dd>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 border-t border-border/20 pt-3">
                                            <dt className="text-xs text-muted-foreground">Unread</dt>
                                            <dd className={`text-xs font-medium ${selected.unread_count > 0 ? "text-foreground" : "text-muted-foreground"
                                                }`}>{selected.unread_count}</dd>
                                        </div>
                                    </dl>
                                </div>

                                {/* Quick assign */}
                                {can("MANAGE_WHATSAPP_CONVERSATIONS") && selected.assigned_to_user_id !== user?.id && user?.id && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="w-full rounded-full text-xs"
                                        onClick={() => assignConversation.mutate({ id: selected.id, userId: user.id })}
                                    >
                                        <UserRound className="mr-1.5 h-3.5 w-3.5" />
                                        Assign to me
                                    </Button>
                                )}

                                {can("MANAGE_WHATSAPP_CONVERSATIONS") && (
                                    <div className="rounded-xl border border-border/40 bg-background/70 p-3.5">
                                        <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                                            <ClipboardList className="h-3.5 w-3.5" />
                                            Send approved template
                                        </h4>
                                        <div className="space-y-3">
                                            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select template" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {sendableTemplates.length ? sendableTemplates.map((template) => (
                                                        <SelectItem key={template.key} value={template.key}>
                                                            {template.name}
                                                        </SelectItem>
                                                    )) : (
                                                        <SelectItem value="__none__" disabled>
                                                            No templates available
                                                        </SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <Textarea
                                                value={templateVariables}
                                                onChange={(e) => setTemplateVariables(e.target.value)}
                                                rows={5}
                                                placeholder='{"customer_name":"Amina"}'
                                                className="resize-none font-mono text-xs"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="w-full rounded-full"
                                                onClick={submitTemplate}
                                                disabled={sendTemplate.isPending || !selectedTemplate}
                                            >
                                                {sendTemplate.isPending ? (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                ) : null}
                                                Send template
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </aside>
                        </div>

                        {/* Reply forms */}
                        {can("MANAGE_WHATSAPP_CONVERSATIONS") && (
                            <div className="shrink-0 border-t border-border/40 bg-background/95 px-5 py-3.5">
                                <div className="grid gap-3">
                                    <div className="space-y-2.5">
                                        <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-deep/50 dark:bg-brand-gold-600/50" />
                                            Reply as human
                                        </label>
                                        <div className="relative">
                                            <Textarea
                                                value={draft}
                                                onChange={(e) => setDraft(e.target.value)}
                                                placeholder="Type a reply…"
                                                rows={2}
                                                className="resize-none pr-12"
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" && !e.shiftKey) {
                                                        e.preventDefault()
                                                        submitMessage()
                                                    }
                                                }}
                                            />
                                            <Button
                                                type="button"
                                                size="icon"
                                                className="absolute bottom-2 right-2 h-8 w-8 rounded-full"
                                                onClick={submitMessage}
                                                disabled={sendMessage.isPending || !draft.trim()}
                                            >
                                                {sendMessage.isPending ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <MessageSquare className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
                </section>
            </div>
        </div>
    )
}

function TemplatesTab() {
    const [page, setPage] = useState(1)
    const [status, setStatus] = useState<"all" | "draft" | "published" | "archived">("all")
    const [search, setSearch] = useState("")
    const debouncedSearch = useDebounce(search, 300)
    const { data: numbers } = useWhatsAppNumbers()
    const [selectedNumberId, setSelectedNumberId] = useState("")
    const { data: flows } = useWhatsAppFlows(selectedNumberId || null)
    const templatesQuery = useWhatsAppTemplates({
        businessWhatsappNumberId: selectedNumberId || null,
        page,
        limit: 8,
        search: debouncedSearch,
        status,
    })
    const stats = useWhatsAppTemplateStatsForNumber(selectedNumberId || null)
    const createTemplate = useCreateWhatsAppTemplate()
    const updateTemplate = useUpdateWhatsAppTemplate()
    const publishTemplate = usePublishWhatsAppTemplate()
    const archiveTemplate = useArchiveWhatsAppTemplate()
    const sendTemplate = useTestSendTemplate()
    const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplateSummary | null>(null)
    const [templateNameInput, setTemplateNameInput] = useState("")
    const [templateCategoryInput, setTemplateCategoryInput] = useState<"utility" | "marketing" | "authentication">("utility")
    const [templateLanguageInput, setTemplateLanguageInput] = useState("en")
    const [templateHeaderTextInput, setTemplateHeaderTextInput] = useState("")
    const [templateFooterTextInput, setTemplateFooterTextInput] = useState("")
    const [templateContentInput, setTemplateContentInput] = useState("")
    const [templateVariableInput, setTemplateVariableInput] = useState("[]")
    const [templateButtonInput, setTemplateButtonInput] = useState("[]")
    const [phone, setPhone] = useState("")
    const [customerName, setCustomerName] = useState("")
    const [templateKey, setTemplateKey] = useState("")
    const [variablesJson, setVariablesJson] = useState("{}")
    const [showTestSend, setShowTestSend] = useState(true)
    const [sheetOpen, setSheetOpen] = useState(false)

    const templates = templatesQuery.data?.data ?? []
    const templateMeta = templatesQuery.data?.meta
    const publishedFlows = (flows?.data ?? []).filter(
        (flow: WhatsAppFlowSummary) => flow.status === "PUBLISHED" && flow.is_active
    )

    useEffect(() => {
        if (!selectedNumberId && numbers?.[0]?.id) {
            setSelectedNumberId(numbers[0].id)
        }
    }, [numbers, selectedNumberId])

    useEffect(() => {
        setPage(1)
    }, [debouncedSearch, status])

    const resetForm = () => {
        setEditingTemplate(null)
        setTemplateNameInput("")
        setTemplateCategoryInput("utility")
        setTemplateLanguageInput("en")
        setTemplateHeaderTextInput("")
        setTemplateFooterTextInput("")
        setTemplateContentInput("")
        setTemplateVariableInput("[]")
        setTemplateButtonInput("[]")
    }

    const handleNewClick = () => {
        resetForm()
        setSheetOpen(true)
    }

    const startEditing = (template: WhatsAppTemplateSummary) => {
        setEditingTemplate(template)
        setTemplateNameInput(template.name)
        setTemplateCategoryInput(template.category)
        setTemplateLanguageInput(template.language || "en")
        setTemplateContentInput(template.content)
        setTemplateVariableInput(JSON.stringify(template.variables ?? [], null, 2))
        const parsed = parseTemplateComponents(template.components)
        setTemplateHeaderTextInput(parsed.headerText)
        setTemplateFooterTextInput(parsed.footerText)
        setTemplateButtonInput(JSON.stringify(parsed.buttons, null, 2))
        setSheetOpen(true)
    }

    // Parse variable rows from the JSON string
    const variableRows: Array<{ key: string; required: boolean }> = (() => {
        try {
            const parsed = JSON.parse(templateVariableInput || "[]")
            if (Array.isArray(parsed)) {
                return parsed.map((v: Record<string, unknown>) => ({
                    key: typeof v.key === "string" ? v.key : "",
                    required: v.required === true,
                }))
            }
        } catch { /* ignore parse errors */ }
        return []
    })()

    const buttonRows: TemplateButtonDraft[] = (() => {
        try {
            const parsed = JSON.parse(templateButtonInput || "[]")
            if (Array.isArray(parsed)) {
                return parsed.map((button) => ({
                    type: String(button?.type || "QUICK_REPLY").toUpperCase() as TemplateButtonDraft["type"],
                    text: typeof button?.text === "string" ? button.text : "",
                    url: typeof button?.url === "string" ? button.url : "",
                    phone_number: typeof button?.phone_number === "string" ? button.phone_number : "",
                    flow_id: typeof button?.flow_id === "string" ? button.flow_id : "",
                    flow_action: button?.flow_action === "data_exchange" ? "data_exchange" : "navigate",
                    navigate_screen: typeof button?.navigate_screen === "string" ? button.navigate_screen : "",
                }))
            }
        } catch { /* ignore parse errors */ }
        return []
    })()

    const updateVariableRows = (rows: Array<{ key: string; required: boolean }>) => {
        setTemplateVariableInput(JSON.stringify(rows, null, 2))
    }

    const updateButtonRows = (rows: TemplateButtonDraft[]) => {
        setTemplateButtonInput(JSON.stringify(rows, null, 2))
    }

    const addVariableRow = () => {
        updateVariableRows([...variableRows, { key: "", required: false }])
    }

    const removeVariableRow = (index: number) => {
        const next = variableRows.filter((_, i) => i !== index)
        updateVariableRows(next)
    }

    const updateVariableKey = (index: number, key: string) => {
        const next = variableRows.map((v, i) => (i === index ? { ...v, key } : v))
        updateVariableRows(next)
    }

    const toggleVariableRequired = (index: number) => {
        const next = variableRows.map((v, i) => (i === index ? { ...v, required: !v.required } : v))
        updateVariableRows(next)
    }

    const addButtonRow = () => {
        updateButtonRows([...buttonRows, { type: "QUICK_REPLY", text: "" }])
    }

    const removeButtonRow = (index: number) => {
        updateButtonRows(buttonRows.filter((_, i) => i !== index))
    }

    const updateButtonField = (
        index: number,
        field: keyof TemplateButtonDraft,
        value: string
    ) => {
        updateButtonRows(
            buttonRows.map((button, i) => (i === index ? { ...button, [field]: value } : button))
        )
    }

    const generatedTemplateKey = buildTemplateKey(templateNameInput)

    useEffect(() => {
        const placeholders = extractTemplatePlaceholders(templateContentInput)
        if (!placeholders.length) return

        const existingKeys = new Set(
            variableRows.map((variable) => variable.key.trim()).filter(Boolean)
        )
        const missingKeys = placeholders.filter((placeholder) => !existingKeys.has(placeholder))

        if (!missingKeys.length) return

        updateVariableRows([
            ...variableRows,
            ...missingKeys.map((key) => ({ key, required: false })),
        ])
    }, [templateContentInput, variableRows])

    const submitTemplateForm = async () => {
        try {
            const placeholders = new Set(extractTemplatePlaceholders(templateContentInput))
            const variables = (
                JSON.parse(templateVariableInput || "[]") as Array<{ key: string; required?: boolean }>
            ).filter((variable) => variable.key?.trim() && placeholders.has(variable.key.trim()))
            const buttons = JSON.parse(templateButtonInput || "[]") as Array<Record<string, unknown>>
            const sampleVariables = variables.reduce<Record<string, string>>((acc, variable) => {
                if (variable.key) {
                    acc[variable.key] = `Example ${variable.key.replace(/_/g, " ")}`
                }
                return acc
            }, {})
            if (editingTemplate) {
                await updateTemplate.mutateAsync({
                    id: editingTemplate.id,
                    businessWhatsappNumberId: selectedNumberId,
                    key: editingTemplate.key,
                    name: templateNameInput,
                    category: templateCategoryInput,
                    language: templateLanguageInput,
                    content: templateContentInput,
                    headerText: templateHeaderTextInput,
                    footerText: templateFooterTextInput,
                    buttons,
                    sampleVariables,
                    variables,
                })
                toast.success("Template updated")
            } else {
                await createTemplate.mutateAsync({
                    businessWhatsappNumberId: selectedNumberId,
                    key: generatedTemplateKey,
                    name: templateNameInput,
                    category: templateCategoryInput,
                    language: templateLanguageInput,
                    content: templateContentInput,
                    headerText: templateHeaderTextInput,
                    footerText: templateFooterTextInput,
                    buttons,
                    sampleVariables,
                    variables,
                })
                toast.success("Template created")
            }
            resetForm()
            setSheetOpen(false)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to save template")
        }
    }

    const submit = async () => {
        try {
            await sendTemplate.mutateAsync({
                businessWhatsappNumberId: selectedNumberId,
                phone,
                customerName,
                templateKey,
                variables: JSON.parse(variablesJson || "{}"),
            })
            toast.success("Template sent")
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to send template")
        }
    }

    const metricCards = [
        { label: "Total", value: stats.data?.total ?? 0 },
        { label: "Draft", value: stats.data?.draft ?? 0 },
        { label: "Published", value: stats.data?.published ?? 0 },
        { label: "Archived", value: stats.data?.archived ?? 0 },
        { label: "Sendable", value: stats.data?.sendable ?? 0 },
    ]

    const noNumberSelected = !selectedNumberId

    return (
        <div className="space-y-10">
            {/* Metrics */}
            <section>
                <div className="mb-4 flex items-center gap-2">
                    <div className="h-1 w-6 rounded-full bg-brand-deep/20 dark:bg-brand-gold-700/40" />
                    <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                        Template stats
                    </h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    {stats.isLoading ? Array.from({ length: 5 }).map((_, index) => (
                        <GlassCard key={index} className="p-5">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="mt-3 h-10 w-16 rounded-xl" />
                        </GlassCard>
                    )) : metricCards.map((card) => (
                        <GlassCard key={card.label} className="p-5">
                            <p className="text-sm text-muted-foreground">{card.label}</p>
                            <p className="mt-2 text-3xl font-semibold tabular-nums">{card.value}</p>
                        </GlassCard>
                    ))}
                </div>
            </section>

            {/* Templates list + actions */}
            <div className="grid gap-8 xl:grid-cols-[1.3fr_0.5fr]">
                {/* Templates list */}
                <section>
                    <div className="mb-5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-muted/30">
                                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold text-foreground">Business templates</h2>
                                <p className="text-xs text-muted-foreground">Create, publish, archive, and send templates</p>
                            </div>
                        </div>
                        <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={handleNewClick}>
                            <Plus className="mr-1.5 h-3.5 w-3.5" />
                            New
                        </Button>
                    </div>

                    {/* Filters */}
                    <GlassCard className="mb-4 p-4">
                        <div className="flex flex-col gap-3 lg:flex-row">
                            <Select value={selectedNumberId} onValueChange={setSelectedNumberId}>
                                <SelectTrigger className="w-full lg:w-64">
                                    <SelectValue placeholder="Select WhatsApp number" />
                                </SelectTrigger>
                                <SelectContent>
                                    {numbers?.map((number) => (
                                        <SelectItem key={number.id} value={number.id}>
                                            {formatWhatsAppNumberLabel(number)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search templates"
                                    className="pl-9"
                                />
                            </div>
                            <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
                                <SelectTrigger className="w-full lg:w-44">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All statuses</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="published">Published</SelectItem>
                                    <SelectItem value="archived">Archived</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </GlassCard>

                    {/* Template items */}
                    <div className="space-y-3">
                        {noNumberSelected ? (
                            <GlassCard className="flex flex-col items-center gap-3 px-5 py-12 text-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/60 bg-muted/30">
                                    <ClipboardList className="h-6 w-6 text-muted-foreground/50" />
                                </div>
                                <p className="text-sm font-medium text-foreground">Select a WhatsApp number</p>
                                <p className="max-w-sm text-xs text-muted-foreground">
                                    Choose a connected number above to view and manage its message templates.
                                </p>
                            </GlassCard>
                        ) : templatesQuery.isLoading ? (
                            <div className="space-y-3">
                                {Array.from({ length: 4 }).map((_, index) => (
                                    <GlassCard key={index} className="p-5">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="space-y-2">
                                                <Skeleton className="h-5 w-44" />
                                                <Skeleton className="h-3 w-28" />
                                            </div>
                                            <div className="flex gap-2">
                                                <Skeleton className="h-8 w-16 rounded-full" />
                                                <Skeleton className="h-8 w-20 rounded-full" />
                                            </div>
                                        </div>
                                        <Skeleton className="mt-3 h-4 w-3/4" />
                                    </GlassCard>
                                ))}
                            </div>
                        ) : templates.length ? templates.map((template) => (
                            <GlassCard key={template.id} className="p-5 transition-colors hover:bg-muted/10">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="min-w-0 flex-1 space-y-1.5">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-medium text-foreground">{template.name}</p>
                                            <Badge
                                                variant={template.status === "published" ? "default" : "secondary"}
                                                className="rounded-full font-normal capitalize"
                                            >
                                                {template.status}
                                            </Badge>
                                            {template.can_send ? (
                                                <Badge variant="secondary" className="rounded-full border-emerald-200 bg-emerald-50 font-normal text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300">
                                                    Sendable
                                                </Badge>
                                            ) : null}
                                            <Badge variant="outline" className="rounded-full capitalize">
                                                {template.category}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            <span className="font-mono">{template.key}</span>
                                            <span className="ml-3">Lang: {template.language}</span>
                                            {template.meta_status && template.meta_status !== "approved" ? (
                                                <span className="ml-3">
                                                    Meta: {template.meta_status}
                                                </span>
                                            ) : null}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 flex-wrap gap-1.5">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="rounded-full text-xs"
                                            onClick={() => startEditing(template)}
                                        >
                                            <PencilLine className="mr-1.5 h-3.5 w-3.5" />
                                            Edit
                                        </Button>
                                        {template.status !== "published" ? (
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="rounded-full text-xs"
                                                onClick={async () => {
                                                    try {
                                                        await publishTemplate.mutateAsync({
                                                            id: template.id,
                                                            businessWhatsappNumberId: selectedNumberId,
                                                        })
                                                        toast.success("Template published")
                                                    } catch (error) {
                                                        toast.error(error instanceof Error ? error.message : "Failed to publish template")
                                                    }
                                                }}
                                                disabled={publishTemplate.isPending}
                                            >
                                                Publish
                                            </Button>
                                        ) : null}
                                        {template.status !== "archived" ? (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="rounded-full text-xs text-muted-foreground hover:text-foreground"
                                                onClick={async () => {
                                                    try {
                                                        await archiveTemplate.mutateAsync({
                                                            id: template.id,
                                                            businessWhatsappNumberId: selectedNumberId,
                                                        })
                                                        toast.success("Template archived")
                                                    } catch (error) {
                                                        toast.error(error instanceof Error ? error.message : "Failed to archive template")
                                                    }
                                                }}
                                                disabled={archiveTemplate.isPending}
                                            >
                                                <Archive className="mr-1.5 h-3.5 w-3.5" />
                                                Archive
                                            </Button>
                                        ) : null}
                                    </div>
                                </div>
                                <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
                                    {template.content}
                                </p>
                                {template.meta_readiness?.errors?.length ? (
                                    <div className="mt-3 rounded-xl border border-amber-200/60 bg-amber-50/70 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                                        {template.meta_readiness.errors[0]}
                                    </div>
                                ) : null}
                            </GlassCard>
                        )) : (
                            <GlassCard className="flex flex-col items-center gap-3 px-5 py-12 text-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/60 bg-muted/30">
                                    <ClipboardList className="h-6 w-6 text-muted-foreground/50" />
                                </div>
                                <p className="text-sm font-medium text-foreground">No templates found</p>
                                <p className="max-w-sm text-xs text-muted-foreground">
                                    {search || status !== "all"
                                        ? "Try adjusting your search or filter."
                                        : "Create your first template to get started."}
                                </p>
                            </GlassCard>
                        )}
                    </div>

                    {templateMeta && templateMeta.totalPages > 1 && (
                        <Pagination
                            currentPage={templateMeta.page}
                            totalPages={templateMeta.totalPages}
                            onPageChange={setPage}
                            isLoading={templatesQuery.isLoading}
                            className="mt-4 px-0"
                        />
                    )}
                </section>

                {/* Sidebar: Test send */}
                <aside className="space-y-6">
                    {/* Test send */}
                    <GlassCard className="p-5">
                        <button
                            type="button"
                            onClick={() => setShowTestSend((prev) => !prev)}
                            className="flex w-full items-center justify-between gap-3"
                        >
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 bg-muted/30">
                                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                                <h3 className="text-sm font-semibold">Test / proactive send</h3>
                            </div>
                            <ChevronDown
                                className={`h-4 w-4 text-muted-foreground transition-transform ${showTestSend ? "rotate-180" : ""}`}
                            />
                        </button>
                        {showTestSend && (
                            <div className="mt-5 space-y-4 border-t border-border/40 pt-5">
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                        Phone number
                                    </label>
                                    <Input
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="+2348012345678"
                                        disabled={noNumberSelected}
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                        Customer name
                                    </label>
                                    <Input
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        placeholder="Amina (optional)"
                                        disabled={noNumberSelected}
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                        Template
                                    </label>
                                    <Select value={templateKey} onValueChange={setTemplateKey}>
                                        <SelectTrigger disabled={noNumberSelected}>
                                            <SelectValue placeholder="Select template" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {templates
                                                .filter((t) => t.can_send && t.status === "published")
                                                .map((t) => (
                                                    <SelectItem key={t.key} value={t.key}>
                                                        {t.name}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                        Variables (JSON)
                                    </label>
                                    <Textarea
                                        value={variablesJson}
                                        onChange={(e) => setVariablesJson(e.target.value)}
                                        rows={4}
                                        placeholder='{"customer_name":"Amina"}'
                                        className="font-mono text-xs"
                                        disabled={noNumberSelected}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    className="w-full rounded-full"
                                    onClick={submit}
                                    disabled={sendTemplate.isPending || noNumberSelected || !templateKey || !phone}
                                >
                                    {sendTemplate.isPending ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : null}
                                    Send template
                                </Button>
                            </div>
                        )}
                    </GlassCard>
                </aside>
            </div>

            {/* Template form side sheet */}
            <SideSheet open={sheetOpen} onOpenChange={(open) => { if (!open) resetForm(); setSheetOpen(open) }}>
                <SideSheetContent>
                    <SideSheetStickyHeader>
                        <SideSheetTitle>
                            {editingTemplate ? "Edit template" : "New template"}
                        </SideSheetTitle>
                        <SideSheetDescription>
                            {editingTemplate
                                ? "Update your WhatsApp message template — key cannot be changed after creation."
                                : "Create a new WhatsApp message template with variables and Meta-ready formatting."}
                        </SideSheetDescription>
                    </SideSheetStickyHeader>
                    <SideSheetBody>
                        <div className="space-y-5">
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                    Template name
                                </label>
                                <Input
                                    value={templateNameInput}
                                    onChange={(e) => setTemplateNameInput(e.target.value)}
                                    placeholder="Order Confirmation"
                                    disabled={noNumberSelected}
                                />
                                {!editingTemplate && generatedTemplateKey ? (
                                    <p className="mt-1.5 text-xs text-muted-foreground/70">
                                        Internal key: <code className="rounded bg-muted/60 px-1 font-mono text-[11px]">{generatedTemplateKey}</code>
                                    </p>
                                ) : null}
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                        Category
                                    </label>
                                    <Select value={templateCategoryInput} onValueChange={(value) => setTemplateCategoryInput(value as typeof templateCategoryInput)}>
                                        <SelectTrigger disabled={noNumberSelected}>
                                            <SelectValue placeholder="Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="utility">Utility</SelectItem>
                                            <SelectItem value="marketing">Marketing</SelectItem>
                                            <SelectItem value="authentication">Authentication</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                        Language
                                    </label>
                                    <Select value={templateLanguageInput} onValueChange={setTemplateLanguageInput}>
                                        <SelectTrigger disabled={noNumberSelected}>
                                            <SelectValue placeholder="Select language" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TEMPLATE_LANGUAGE_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                    Header text
                                </label>
                                <Input
                                    value={templateHeaderTextInput}
                                    onChange={(e) => setTemplateHeaderTextInput(e.target.value)}
                                    placeholder="Order update"
                                    disabled={noNumberSelected}
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                    Message body
                                </label>
                                <Textarea
                                    value={templateContentInput}
                                    onChange={(e) => setTemplateContentInput(e.target.value)}
                                    rows={5}
                                    placeholder="Hi {{customer_name}}, your order has been confirmed!"
                                    className="font-mono text-sm"
                                    disabled={noNumberSelected}
                                />
                                <p className="mt-1.5 grid grid-cols-[14px_minmax(0,1fr)] items-start gap-x-1.5 text-xs leading-relaxed text-muted-foreground/70">
                                    <Info className="mt-0.5 h-3 w-3 shrink-0" />
                                    <span>
                                        Use <code className="rounded bg-muted/60 px-1 font-mono text-[11px]">{`{{variable_name}}`}</code> for placeholders. The same name must exist as a variable key below.
                                    </span>
                                </p>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                    Footer text
                                </label>
                                <Input
                                    value={templateFooterTextInput}
                                    onChange={(e) => setTemplateFooterTextInput(e.target.value)}
                                    placeholder="Reply STOP to opt out"
                                    disabled={noNumberSelected}
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                    Variables
                                </label>
                                <p className="mb-2.5 grid grid-cols-[14px_minmax(0,1fr)] items-start gap-x-1.5 text-xs leading-relaxed text-muted-foreground/70">
                                    <Info className="mt-0.5 h-3 w-3 shrink-0" />
                                    <span>
                                        Each variable you use in the message body must be listed here. Toggle <strong>Required</strong> for variables that must always be provided.
                                    </span>
                                </p>
                                <div className="space-y-2">
                                    {variableRows.length === 0 && !noNumberSelected && (
                                        <p className="py-2 text-center text-xs text-muted-foreground/50">
                                            No variables yet — add one below.
                                        </p>
                                    )}
                                    {variableRows.map((variable, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <Input
                                                value={variable.key}
                                                onChange={(e) => updateVariableKey(index, e.target.value)}
                                                placeholder="variable_name"
                                                className="flex-1 font-mono text-sm"
                                                disabled={noNumberSelected}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => toggleVariableRequired(index)}
                                                disabled={noNumberSelected}
                                                aria-label={variable.required ? "Mark as optional" : "Mark as required"}
                                                className={`flex h-10 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors ${variable.required
                                                    ? "border-brand-deep/30 bg-brand-deep/[0.06] text-brand-deep dark:border-brand-gold-600/30 dark:bg-brand-gold-600/10 dark:text-brand-gold-300"
                                                    : "border-border/60 text-muted-foreground hover:border-border"
                                                    }`}
                                            >
                                                <CheckCircle2 className={`h-3.5 w-3.5 ${variable.required ? "opacity-100" : "opacity-30"
                                                    }`} />
                                                Required
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => removeVariableRow(index)}
                                                disabled={noNumberSelected}
                                                aria-label="Remove variable"
                                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/60 text-muted-foreground/50 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                {!noNumberSelected && (
                                    <button
                                        type="button"
                                        onClick={addVariableRow}
                                        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/60 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        Add variable
                                    </button>
                                )}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                    Buttons
                                </label>
                                <div className="space-y-3">
                                    {buttonRows.length ? buttonRows.map((button, index) => (
                                        <div key={index} className="rounded-xl border border-border/40 p-3">
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <Select
                                                    value={button.type}
                                                    onValueChange={(value) =>
                                                        updateButtonField(index, "type", value)
                                                    }
                                                >
                                                    <SelectTrigger disabled={noNumberSelected}>
                                                        <SelectValue placeholder="Button type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="QUICK_REPLY">Quick reply</SelectItem>
                                                        <SelectItem value="URL">URL</SelectItem>
                                                        <SelectItem value="PHONE_NUMBER">Phone number</SelectItem>
                                                        <SelectItem value="FLOW">Flow</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Input
                                                    value={button.text}
                                                    onChange={(e) =>
                                                        updateButtonField(index, "text", e.target.value)
                                                    }
                                                    placeholder="Button text"
                                                    disabled={noNumberSelected}
                                                />
                                                {button.type === "URL" ? (
                                                    <Input
                                                        value={button.url || ""}
                                                        onChange={(e) =>
                                                            updateButtonField(index, "url", e.target.value)
                                                        }
                                                        placeholder="https://example.com"
                                                        className="sm:col-span-2"
                                                        disabled={noNumberSelected}
                                                    />
                                                ) : null}
                                                {button.type === "PHONE_NUMBER" ? (
                                                    <Input
                                                        value={button.phone_number || ""}
                                                        onChange={(e) =>
                                                            updateButtonField(index, "phone_number", e.target.value)
                                                        }
                                                        placeholder="+2348012345678"
                                                        className="sm:col-span-2"
                                                        disabled={noNumberSelected}
                                                    />
                                                ) : null}
                                                {button.type === "FLOW" ? (
                                                    <>
                                                        <Select
                                                            value={button.flow_id || ""}
                                                            onValueChange={(value) =>
                                                                updateButtonField(index, "flow_id", value)
                                                            }
                                                        >
                                                            <SelectTrigger className="sm:col-span-2" disabled={noNumberSelected}>
                                                                <SelectValue placeholder="Select business flow" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {publishedFlows.map((flow) => (
                                                                    <SelectItem key={flow.id} value={flow.id}>
                                                                        {flow.display_name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <Input
                                                            value={button.navigate_screen || ""}
                                                            onChange={(e) =>
                                                                updateButtonField(index, "navigate_screen", e.target.value)
                                                            }
                                                            placeholder="Screen id (optional)"
                                                            className="sm:col-span-2"
                                                            disabled={noNumberSelected}
                                                        />
                                                    </>
                                                ) : null}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeButtonRow(index)}
                                                disabled={noNumberSelected}
                                                className="mt-3 text-xs font-medium text-red-600 dark:text-red-400"
                                            >
                                                Remove button
                                            </button>
                                        </div>
                                    )) : (
                                        <p className="text-xs text-muted-foreground/70">
                                            No buttons added. Add only the CTA you actually need.
                                        </p>
                                    )}
                                    <button
                                        type="button"
                                        onClick={addButtonRow}
                                        disabled={noNumberSelected}
                                        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/60 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        Add button
                                    </button>
                                </div>
                            </div>
                            <div className={`rounded-2xl border px-4 py-3 text-sm ${buildLocalTemplateReadiness({
                                body: templateContentInput,
                                language: templateLanguageInput,
                                variables: variableRows.map((variable) => ({
                                    key: variable.key,
                                    label: variable.key,
                                    required: variable.required,
                                    example: variable.key ? `Example ${variable.key}` : "",
                                })),
                                headerText: templateHeaderTextInput,
                                footerText: templateFooterTextInput,
                                buttons: (() => {
                                    try {
                                        return JSON.parse(templateButtonInput || "[]") as TemplateButtonDraft[]
                                    } catch {
                                        return []
                                    }
                                })(),
                            }).isReady
                                ? "border-emerald-200/60 bg-emerald-50/60 dark:border-emerald-500/20 dark:bg-emerald-500/10"
                                : "border-amber-200/60 bg-amber-50/70 dark:border-amber-500/20 dark:bg-amber-500/10"
                                }`}>
                                <p className="font-medium text-foreground">Template review guidance</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Keep templates in English, provide matching variables, avoid mixing quick replies with CTA buttons, and only link flow buttons to published flows.
                                </p>
                            </div>
                        </div>
                    </SideSheetBody>
                    <SideSheetFooter>
                        <Button
                            type="button"
                            className="w-full rounded-full"
                            size="lg"
                            onClick={submitTemplateForm}
                            disabled={
                                createTemplate.isPending ||
                                updateTemplate.isPending ||
                                noNumberSelected ||
                                (!editingTemplate && !generatedTemplateKey) ||
                                !templateNameInput.trim() ||
                                !templateContentInput.trim()
                            }
                        >
                            {createTemplate.isPending || updateTemplate.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            {editingTemplate ? "Save changes" : "Create template"}
                        </Button>
                    </SideSheetFooter>
                </SideSheetContent>
            </SideSheet>
        </div>
    )
}

function LoadingCard({ label }: { label: string }) {
    return (
        <GlassCard className="flex items-center gap-3 p-5">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="text-sm text-muted-foreground">{label}</p>
        </GlassCard>
    )
}

function LoadingRows() {
    return (
        <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-20 animate-pulse rounded-2xl bg-muted/40" />
            ))}
        </div>
    )
}
