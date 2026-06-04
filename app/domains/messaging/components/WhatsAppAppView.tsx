"use client"

import { useState } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { useSearchParams } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon as AlertTriangle, ArchiveIcon as Archive, BotIcon as Bot, CheckmarkCircle02Icon as CheckCircle2, ChevronDownIcon as ChevronDown, ClipboardListIcon as ClipboardList, CopyIcon as Copy, InformationCircleIcon as Info, Key01Icon as KeyRound, Loading03Icon as Loader2, LockIcon as Lock, Message01Icon as MessageSquare, PencilEdit01Icon as PencilLine, CallIcon as Phone, PlusSignIcon as Plus, RefreshIcon as RefreshCw, Search01Icon as Search, SecurityCheckIcon as ShieldCheck, UserIcon as UserRound, Wifi01Icon as Wifi, Cancel01Icon as X } from "@hugeicons/core-free-icons"
import { ManagementHeader } from "@/app/components/shared/ManagementHeader"
import { ConfirmDialog } from "@/app/components/shared/ConfirmDialog"
import { PasswordConfirmDialog } from "@/app/components/shared/PasswordConfirmDialog"
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
import { useDebounce } from "@/app/hooks/useDebounce"
import { usePermission } from "@/app/hooks/usePermission"
import { WhatsAppSettings } from "@/app/domains/messaging/components/WhatsAppSettings"
import { FlowsTab } from "@/app/domains/messaging/components/FlowsTab"
import { useWhatsAppNumbers } from "@/app/domains/messaging/hooks/useWhatsAppSettings"
import {
    useArchiveWhatsAppTemplate,
    useCreateWhatsAppTemplate,
    usePublishWhatsAppTemplate,
    useTestSendTemplate,
    useUpdateWhatsAppTemplate,
    useWhatsAppConversations,
    useWhatsAppFlows,
    useWhatsAppOverview,
    useWhatsAppOtps,
    useWhatsAppTemplateStatsForNumber,
    useWhatsAppTemplates,
    type WhatsAppOtpCandidate,
    type WhatsAppTemplateSummary,
    type WhatsAppFlowSummary,
} from "@/app/domains/messaging/hooks/useWhatsAppInbox"

type WhatsAppTab = "overview" | "otps" | "templates" | "flows" | "connections" | "automation"

const TAB_COPY: Record<WhatsAppTab, { title: string; description: string }> = {
    overview: {
        title: "WhatsApp",
        description: "Operational visibility across inbox activity, AI coverage, and connected numbers.",
    },
    otps: {
        title: "OTPs",
        description: "Password-protected recovery view for recent OTPs received by connected numbers.",
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

const VALID_TABS: WhatsAppTab[] = ["overview", "otps", "templates", "flows", "connections", "automation"]

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

function normalizeTemplateVariables(value: unknown) {
    if (!Array.isArray(value)) return []

    return value
        .map((variable) => ({
            key: typeof variable?.key === "string" ? variable.key.trim() : "",
            required: variable?.required === true,
        }))
        .filter((variable) => variable.key)
}

function normalizeTemplateButtons(value: unknown) {
    if (!Array.isArray(value)) return []

    return value
        .map((button) => ({
            type: String(button?.type || "QUICK_REPLY").toUpperCase(),
            text: typeof button?.text === "string" ? button.text.trim() : "",
            url: typeof button?.url === "string" ? button.url.trim() : "",
            phone_number: typeof button?.phone_number === "string" ? button.phone_number.trim() : "",
            flow_id: typeof button?.flow_id === "string" ? button.flow_id.trim() : "",
            flow_action: button?.flow_action === "data_exchange" ? "data_exchange" : "navigate",
            navigate_screen: typeof button?.navigate_screen === "string" ? button.navigate_screen.trim() : "",
        }))
        .filter((button) => button.text)
}

function templateFormSnapshot(input: {
    numberId: string
    name: string
    category: string
    language: string
    headerText: string
    footerText: string
    content: string
    variables: unknown
    buttons: unknown
}) {
    return JSON.stringify({
        numberId: input.numberId,
        name: input.name.trim(),
        category: input.category,
        language: input.language.trim().toLowerCase(),
        headerText: input.headerText.trim(),
        footerText: input.footerText.trim(),
        content: input.content.trim(),
        variables: normalizeTemplateVariables(input.variables),
        buttons: normalizeTemplateButtons(input.buttons),
    })
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
    const { can } = usePermission()
    const tabParam = searchParams.get("tab")
    const requestedTab: WhatsAppTab = isValidTab(tabParam) ? tabParam : "overview"
    const activeTab: WhatsAppTab = requestedTab === "otps" && !can("VIEW_WHATSAPP_OTPS")
        ? "overview"
        : requestedTab
    const tabCopy = TAB_COPY[activeTab]

    return (
        <div className="mx-auto max-w-7xl space-y-6 pb-20">
            <ManagementHeader
                title={tabCopy.title}
                description={tabCopy.description}
            />

            {activeTab === "overview" && <OverviewTab />}
            {activeTab === "otps" && <OtpsTab />}
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

function OverviewTab() {
    const { data, isLoading } = useWhatsAppOverview()
    const conversations = useWhatsAppConversations()
    const numbers = useWhatsAppNumbers()
    const isOverviewLoading = isLoading || conversations.isLoading || numbers.isLoading
    const conversationRows = conversations.data ?? []
    const numberRows = numbers.data ?? []
    const activeNumbers = numberRows.filter((number) => number.status === "active")
    const attentionConversations = conversationRows.filter((conversation) =>
        conversation.unread_count > 0 ||
        conversation.mode === "human" ||
        conversation.status === "pending_customer"
    )
    const recentConversations = [...conversationRows]
        .sort((a, b) => {
            const aTime = new Date(a.updated_at || a.last_inbound_at || a.last_outbound_at || 0).getTime()
            const bTime = new Date(b.updated_at || b.last_inbound_at || b.last_outbound_at || 0).getTime()
            return bTime - aTime
        })
        .slice(0, 4)
    const aiCoverage = data?.openConversations
        ? Math.round(((data.aiManagedConversations ?? 0) / data.openConversations) * 100)
        : 0
    const unhealthyNumbers = numberRows.filter((number) =>
        ["failed", "suspended"].includes(number.status)
    )

    const metrics = [
        {
            label: "Open chats",
            value: data?.openConversations ?? 0,
            icon: MessageSquare,
            detail: `${attentionConversations.length} need attention`,
        },
        {
            label: "AI coverage",
            value: `${aiCoverage}%`,
            icon: Bot,
            detail: `${data?.aiManagedConversations ?? 0} handled by AI`,
        },
        {
            label: "Human takeover",
            value: data?.humanManagedConversations ?? 0,
            icon: UserRound,
            detail: "Active staff-managed chats",
        },
        {
            label: "Unread",
            value: data?.unreadMessages ?? 0,
            icon: AlertTriangle,
            detail: "Customer messages pending",
        },
    ]

    return (
        <div className="space-y-6">
            <section className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
                <GlassCard className="border-brand-gold/15 bg-linear-to-br from-white via-white to-brand-gold/[0.045] p-5 md:p-6 dark:border-brand-gold/20 dark:from-white/[0.04] dark:via-white/[0.02] dark:to-brand-gold/[0.08]">
                    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                        <div>
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-brand-gold">
                                <HugeiconsIcon icon={ShieldCheck} className="h-4 w-4" />
                                Command center
                            </div>
                            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                                WhatsApp is handling customer conversations.
                            </h2>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                                Monitor handoffs, unread messages, number health, and automation coverage without exposing raw webhook or button payloads.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button asChild variant="outline" size="sm" className="rounded-full border-brand-gold/25 hover:bg-brand-gold/10 hover:text-brand-deep dark:hover:text-brand-cream">
                                <Link href="/whatsapp?tab=connections">
                                    <HugeiconsIcon icon={Wifi} className="mr-2 h-4 w-4" />
                                    Connections
                                </Link>
                            </Button>
                            <Button asChild size="sm" className="rounded-full bg-brand-deep text-brand-gold-300 hover:bg-brand-deep/92 dark:bg-brand-gold-700 dark:text-white dark:hover:bg-brand-gold-800">
                                <Link href="/whatsapp?tab=automation">
                                    <HugeiconsIcon icon={Bot} className="mr-2 h-4 w-4" />
                                    Automation
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {isOverviewLoading ? (
                            Array.from({ length: 4 }).map((_, index) => (
                                <div key={index} className="rounded-[22px] border border-border/70 bg-muted/20 p-4">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="mt-4 h-8 w-16 rounded-xl" />
                                    <Skeleton className="mt-3 h-3 w-28" />
                                </div>
                            ))
                        ) : (
                            metrics.map((metric) => {
                                const Icon = metric.icon
                                return (
                                    <div key={metric.label} className="rounded-[22px] border border-border/70 bg-background/75 p-4 transition-colors hover:border-brand-gold/25 hover:bg-brand-gold/[0.035] dark:hover:border-brand-gold/25 dark:hover:bg-brand-gold/[0.06]">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="text-sm text-muted-foreground">{metric.label}</p>
                                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-gold/10 text-brand-gold dark:bg-brand-gold/15 dark:text-brand-gold-300">
                                                <HugeiconsIcon icon={Icon} className="h-4 w-4" />
                                            </span>
                                        </div>
                                        <p className="mt-3 text-3xl font-semibold tabular-nums text-foreground">
                                            {metric.value}
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">{metric.detail}</p>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </GlassCard>

                <GlassCard className="p-5">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-sm font-semibold text-foreground">Number health</h2>
                            <p className="mt-1 text-xs text-muted-foreground">Connected sender readiness</p>
                        </div>
                        <Badge
                            variant={unhealthyNumbers.length ? "outline" : "secondary"}
                            className="rounded-full border-brand-gold/20 bg-brand-gold/10 text-brand-gold dark:bg-brand-gold/15 dark:text-brand-gold-300"
                        >
                            {activeNumbers.length}/{numberRows.length || data?.connectedNumbers || 0} active
                        </Badge>
                    </div>

                    <div className="mt-5 space-y-3">
                        {isOverviewLoading ? (
                            Array.from({ length: 3 }).map((_, index) => (
                                <div key={index} className="rounded-2xl border border-border/70 p-3">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="mt-2 h-3 w-24" />
                                </div>
                            ))
                        ) : numberRows.length ? (
                            numberRows.slice(0, 3).map((number) => {
                                const isActive = number.status === "active"
                                return (
                                    <div key={number.id} className="rounded-2xl border border-border/70 bg-background/70 p-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-foreground">
                                                    {number.display_name || number.verified_name || "WhatsApp number"}
                                                </p>
                                                <p className="mt-1 truncate text-xs text-muted-foreground">
                                                    {formatPhoneNumber(number.display_phone_number || number.phone_number, { spaced: true }) || number.phone_number}
                                                </p>
                                            </div>
                                            <Badge
                                                variant={isActive ? "secondary" : "outline"}
                                                className={
                                                    isActive
                                                        ? "shrink-0 rounded-full bg-brand-gold/10 text-brand-gold dark:bg-brand-gold/15 dark:text-brand-gold-300"
                                                        : "shrink-0 rounded-full capitalize"
                                                }
                                            >
                                                {number.status}
                                            </Badge>
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <div className="rounded-2xl border border-dashed border-border p-5 text-center">
                                <HugeiconsIcon icon={Phone} className="mx-auto h-5 w-5 text-muted-foreground/50" />
                                <p className="mt-2 text-sm text-muted-foreground">No WhatsApp number connected.</p>
                            </div>
                        )}
                    </div>
                </GlassCard>
            </section>

            <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                <GlassCard className="p-5">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-sm font-semibold text-foreground">Needs attention</h2>
                            <p className="mt-1 text-xs text-muted-foreground">Unread, handoff, or customer-waiting conversations</p>
                        </div>
                        <Badge variant="outline" className="rounded-full">
                            {attentionConversations.length}
                        </Badge>
                    </div>

                    <div className="mt-5 space-y-3">
                        {isOverviewLoading ? (
                            Array.from({ length: 3 }).map((_, index) => (
                                <div key={index} className="rounded-[22px] border border-border/70 p-4">
                                    <Skeleton className="h-4 w-36" />
                                    <Skeleton className="mt-3 h-3 w-full" />
                                </div>
                            ))
                        ) : attentionConversations.length ? (
                            attentionConversations.slice(0, 4).map((conversation) => (
                                <ConversationSignalCard key={conversation.id} conversation={conversation} />
                            ))
                        ) : (
                            <div className="rounded-[22px] border border-brand-gold/20 bg-brand-gold/[0.06] p-5 text-sm text-brand-deep dark:border-brand-gold/20 dark:bg-brand-gold/10 dark:text-brand-gold-200">
                                No conversations currently need staff attention.
                            </div>
                        )}
                    </div>
                </GlassCard>

                <GlassCard className="p-5">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-sm font-semibold text-foreground">Conversation queue</h2>
                            <p className="mt-1 text-xs text-muted-foreground">Sanitized customer context, not raw webhook activity</p>
                        </div>
                        <Button asChild variant="outline" size="sm" className="rounded-full border-brand-gold/25 hover:bg-brand-gold/10 hover:text-brand-deep dark:hover:text-brand-cream">
                            <Link href="/whatsapp/inbox">
                                Open inbox
                            </Link>
                        </Button>
                    </div>

                    <div className="mt-5 space-y-3">
                        {isOverviewLoading ? (
                            Array.from({ length: 4 }).map((_, index) => (
                                <div key={index} className="rounded-[22px] border border-border/70 p-4">
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="mt-3 h-3 w-full" />
                                </div>
                            ))
                        ) : recentConversations.length ? (
                            recentConversations.map((conversation) => (
                                <ConversationSignalCard key={conversation.id} conversation={conversation} compact />
                            ))
                        ) : (
                            <div className="flex flex-col items-center gap-2 rounded-[22px] border border-dashed border-border px-5 py-10 text-center">
                                <HugeiconsIcon icon={MessageSquare} className="h-6 w-6 text-muted-foreground/40" />
                                <p className="text-sm text-muted-foreground">No open WhatsApp conversations yet.</p>
                            </div>
                        )}
                    </div>
                </GlassCard>
            </section>
        </div>
    )
}

function ConversationSignalCard({
    conversation,
    compact = false,
}: {
    conversation: {
        customer_name: string | null
        customer_phone: string
        mode: "ai" | "human"
        status: "open" | "pending_customer" | "resolved" | "closed"
        unread_count: number
        last_customer_message: string | null
        last_ai_reply: string | null
        number_label: string | null
        updated_at: string | null
        last_inbound_at: string | null
        last_outbound_at: string | null
    }
    compact?: boolean
}) {
    const customer = conversation.customer_name || formatPhoneNumber(conversation.customer_phone, { spaced: true }) || "Customer"
    const preview = conversation.last_customer_message || conversation.last_ai_reply || "No recent message summary available."
    const timestamp = conversation.updated_at || conversation.last_inbound_at || conversation.last_outbound_at
    const modeLabel = conversation.mode === "human" ? "Human" : "AI"
    const statusLabel = conversation.status.replace("_", " ")

    return (
        <div className="rounded-[22px] border border-border/70 bg-background/70 p-4 transition-colors hover:border-brand-gold/25 hover:bg-brand-gold/[0.035] dark:hover:border-brand-gold/25 dark:hover:bg-brand-gold/[0.06]">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">{customer}</p>
                        {conversation.unread_count > 0 ? (
                            <Badge variant="outline" className="rounded-full border-brand-gold/25 bg-brand-gold/10 text-[10px] text-brand-gold dark:bg-brand-gold/15 dark:text-brand-gold-300">
                                {conversation.unread_count} unread
                            </Badge>
                        ) : null}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                        {preview}
                    </p>
                </div>
                <Badge
                    variant={conversation.mode === "ai" ? "secondary" : "outline"}
                    className={
                        conversation.mode === "ai"
                            ? "shrink-0 rounded-full bg-brand-gold/10 text-brand-gold dark:bg-brand-gold/15 dark:text-brand-gold-300"
                            : "shrink-0 rounded-full"
                    }
                >
                    {modeLabel}
                </Badge>
            </div>
            {!compact ? (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="capitalize">{statusLabel}</span>
                    {conversation.number_label ? (
                        <>
                            <span>•</span>
                            <span>{conversation.number_label}</span>
                        </>
                    ) : null}
                    {timestamp ? (
                        <>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(timestamp), { addSuffix: true })}</span>
                        </>
                    ) : null}
                </div>
            ) : null}
        </div>
    )
}

function OtpsTab() {
    const [verified, setVerified] = useState(false)
    const [passwordOpen, setPasswordOpen] = useState(false)
    const otps = useWhatsAppOtps(verified)

    const needsPassword =
        otps.error &&
        typeof otps.error === "object" &&
        "statusCode" in otps.error &&
        (otps.error as { statusCode?: number }).statusCode === 403

    const unlocked = verified && !needsPassword

    async function copyCode(code: string) {
        try {
            await navigator.clipboard.writeText(code)
            toast.success("OTP copied")
        } catch {
            toast.error("Failed to copy OTP")
        }
    }

    return (
        <section className="space-y-5">
            <PasswordConfirmDialog
                open={passwordOpen}
                onOpenChange={setPasswordOpen}
                onSuccess={() => {
                    setVerified(true)
                    setPasswordOpen(false)
                    void otps.refetch()
                }}
                title="Confirm to view OTPs"
                description="Enter your password to view recent OTPs received by connected WhatsApp numbers."
            />

            {!unlocked ? (
                <GlassCard className="flex flex-col items-center gap-4 px-6 py-12 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border/60 bg-muted/20">
                        <HugeiconsIcon icon={Lock} className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold">Password required</h2>
                        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                            OTPs are sensitive. Confirm your account password to unlock recent
                            codes for this session.
                        </p>
                    </div>
                    <Button className="h-10 rounded-xl px-5" onClick={() => setPasswordOpen(true)}>
                        <HugeiconsIcon icon={KeyRound} className="mr-2 h-4 w-4" />
                        View OTPs
                    </Button>
                </GlassCard>
            ) : (
                <GlassCard className="overflow-hidden p-0">
                    <div className="flex flex-col gap-3 border-b border-border/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-sm font-semibold">Recent OTPs</h2>
                            <p className="mt-1 text-xs text-muted-foreground">
                                OTP candidates received in the last 24 hours.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            className="h-9 rounded-xl px-3 text-xs"
                            onClick={() => void otps.refetch()}
                            disabled={otps.isFetching}
                        >
                            <HugeiconsIcon icon={RefreshCw} className={`mr-2 h-3.5 w-3.5 ${otps.isFetching ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                    </div>

                    {otps.isLoading ? (
                        <div className="space-y-3 px-5 py-6">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <Skeleton key={index} className="h-16 rounded-xl" />
                            ))}
                        </div>
                    ) : otps.data?.length ? (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] text-left text-sm">
                                <thead className="border-b border-border/40 bg-muted/20 text-[11px] uppercase tracking-wide text-muted-foreground">
                                    <tr>
                                        <th className="px-5 py-3">Code</th>
                                        <th className="px-5 py-3">Connected number</th>
                                        <th className="px-5 py-3">Sender</th>
                                        <th className="px-5 py-3">Received</th>
                                        <th className="px-5 py-3">Expires</th>
                                        <th className="px-5 py-3">Preview</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/35">
                                    {otps.data.map((otp) => (
                                        <OtpRow
                                            key={otp.id}
                                            otp={otp}
                                            onCopy={() => void copyCode(otp.code)}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-muted/20">
                                <HugeiconsIcon icon={KeyRound} className="h-5 w-5 text-muted-foreground/40" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">No recent OTPs</p>
                                <p className="mt-1 text-xs leading-6 text-muted-foreground">
                                    OTP-like inbound messages from connected numbers will appear here
                                    for 24 hours.
                                </p>
                            </div>
                        </div>
                    )}
                </GlassCard>
            )}
        </section>
    )
}

function OtpRow({ otp, onCopy }: { otp: WhatsAppOtpCandidate; onCopy: () => void }) {
    const receivedAt = new Date(otp.received_at)
    const expiresAt = new Date(otp.expires_at)
    const sender = otp.customer_name
        ? `${otp.customer_name} (${formatPhoneNumber(otp.sender_phone, { spaced: true }) || otp.sender_phone})`
        : formatPhoneNumber(otp.sender_phone, { spaced: true }) || otp.sender_phone

    return (
        <tr className="transition-colors hover:bg-muted/15">
            <td className="px-5 py-4">
                <div className="flex items-center gap-2">
                    <code className="rounded-lg bg-muted/40 px-2.5 py-1.5 text-sm font-semibold tracking-wide">
                        {otp.code}
                    </code>
                    <button
                        type="button"
                        onClick={onCopy}
                        aria-label="Copy OTP"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 text-muted-foreground transition-colors hover:bg-muted/35 hover:text-foreground"
                    >
                        <HugeiconsIcon icon={Copy} className="h-3.5 w-3.5" />
                    </button>
                </div>
            </td>
            <td className="px-5 py-4 text-sm text-foreground">
                {otp.number_label || "Connected number"}
            </td>
            <td className="px-5 py-4 text-sm text-muted-foreground">{sender}</td>
            <td className="px-5 py-4 text-sm text-muted-foreground">
                {formatDistanceToNow(receivedAt, { addSuffix: true })}
            </td>
            <td className="px-5 py-4">
                <Badge
                    variant="outline"
                    className="rounded-full border-emerald-200 text-emerald-700"
                >
                    {formatDistanceToNow(expiresAt, { addSuffix: true })}
                </Badge>
            </td>
            <td className="max-w-xs px-5 py-4">
                <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                    {otp.text_preview}
                </p>
            </td>
        </tr>
    )
}

function TemplatesTab() {
    const [page, setPage] = useState(1)
    const [status, setStatus] = useState<"all" | "draft" | "published" | "archived">("all")
    const [search, setSearch] = useState("")
    const debouncedSearch = useDebounce(search, 300)
    const { data: numbers } = useWhatsAppNumbers()
    const [selectedNumberId, setSelectedNumberId] = useState("")
    const [templateNumberIdInput, setTemplateNumberIdInput] = useState("")
    const activeNumberId = selectedNumberId || numbers?.[0]?.id || ""
    const { data: flows } = useWhatsAppFlows(templateNumberIdInput || activeNumberId || null)
    const templatesQuery = useWhatsAppTemplates({
        businessWhatsappNumberId: activeNumberId || null,
        page,
        limit: 8,
        search: debouncedSearch,
        status,
    })
    const stats = useWhatsAppTemplateStatsForNumber(activeNumberId || null)
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
    const [templateToPublish, setTemplateToPublish] = useState<WhatsAppTemplateSummary | null>(null)

    const templates = templatesQuery.data?.data ?? []
    const templateMeta = templatesQuery.data?.meta
    const publishedFlows = (flows?.data ?? []).filter(
        (flow: WhatsAppFlowSummary) => flow.status === "PUBLISHED" && flow.is_active
    )

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
        setTemplateNumberIdInput(activeNumberId)
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
        setTemplateNumberIdInput(template.business_whatsapp_number_id || activeNumberId)
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

    const currentTemplateFormSnapshot = templateFormSnapshot({
        numberId: templateNumberIdInput,
        name: templateNameInput,
        category: templateCategoryInput,
        language: templateLanguageInput,
        headerText: templateHeaderTextInput,
        footerText: templateFooterTextInput,
        content: templateContentInput,
        variables: variableRows,
        buttons: buttonRows,
    })
    const initialTemplateFormSnapshot = editingTemplate
        ? templateFormSnapshot({
            numberId: editingTemplate.business_whatsapp_number_id || activeNumberId,
            name: editingTemplate.name,
            category: editingTemplate.category,
            language: editingTemplate.language || "en",
            headerText: parseTemplateComponents(editingTemplate.components).headerText,
            footerText: parseTemplateComponents(editingTemplate.components).footerText,
            content: editingTemplate.content,
            variables: editingTemplate.variables ?? [],
            buttons: parseTemplateComponents(editingTemplate.components).buttons,
        })
        : null
    const hasTemplateFormChanges =
        !editingTemplate || currentTemplateFormSnapshot !== initialTemplateFormSnapshot

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

    const updateTemplateContent = (content: string) => {
        setTemplateContentInput(content)

        const placeholders = extractTemplatePlaceholders(content)
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
    }

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
                    businessWhatsappNumberId: templateNumberIdInput,
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
                    businessWhatsappNumberId: templateNumberIdInput,
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
            setSelectedNumberId(templateNumberIdInput)
            resetForm()
            setSheetOpen(false)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to save template")
        }
    }

    const submit = async () => {
        try {
            await sendTemplate.mutateAsync({
                businessWhatsappNumberId: activeNumberId,
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

    const confirmPublishTemplate = async () => {
        if (!templateToPublish) return

        try {
            await publishTemplate.mutateAsync({
                id: templateToPublish.id,
                businessWhatsappNumberId: activeNumberId,
            })
            toast.success(templateToPublish.status === "published" ? "Template pushed to Meta" : "Template published")
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to publish template")
            throw error
        }
    }

    const metricCards = [
        { label: "Total", value: stats.data?.total ?? 0 },
        { label: "Draft", value: stats.data?.draft ?? 0 },
        { label: "Published", value: stats.data?.published ?? 0 },
        { label: "Archived", value: stats.data?.archived ?? 0 },
        { label: "Sendable", value: stats.data?.sendable ?? 0 },
    ]

    const noNumberSelected = !activeNumberId
    const noTemplateNumberSelected = !templateNumberIdInput
    const canChangeTemplateNumber = !editingTemplate || editingTemplate.status !== "published"
    const isPendingMetaTemplate = editingTemplate?.meta_status === "pending"

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
                                <HugeiconsIcon icon={ClipboardList} className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold text-foreground">Business templates</h2>
                                <p className="text-xs text-muted-foreground">Create, publish, archive, and send templates</p>
                            </div>
                        </div>
                        <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={handleNewClick}>
                            <HugeiconsIcon icon={Plus} className="mr-1.5 h-3.5 w-3.5" />
                            New
                        </Button>
                    </div>

                    {/* Filters */}
                    <GlassCard className="mb-4 p-4">
                        <div className="flex flex-col gap-3 lg:flex-row">
                            <Select value={activeNumberId} onValueChange={setSelectedNumberId}>
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
                                <HugeiconsIcon icon={Search} className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value)
                                        setPage(1)
                                    }}
                                    placeholder="Search templates"
                                    className="pl-9"
                                />
                            </div>
                            <Select
                                value={status}
                                onValueChange={(value) => {
                                    setStatus(value as typeof status)
                                    setPage(1)
                                }}
                            >
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
                                    <HugeiconsIcon icon={ClipboardList} className="h-6 w-6 text-muted-foreground/50" />
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
                                            <HugeiconsIcon icon={PencilLine} className="mr-1.5 h-3.5 w-3.5" />
                                            Edit
                                        </Button>
                                        {template.status !== "published" || !template.meta_template_name ? (
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="rounded-full text-xs"
                                                onClick={() => setTemplateToPublish(template)}
                                                disabled={publishTemplate.isPending}
                                            >
                                                {template.status === "published" ? "Push to Meta" : "Publish"}
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
                                                            businessWhatsappNumberId: activeNumberId,
                                                        })
                                                        toast.success("Template archived")
                                                    } catch (error) {
                                                        toast.error(error instanceof Error ? error.message : "Failed to archive template")
                                                    }
                                                }}
                                                disabled={archiveTemplate.isPending}
                                            >
                                                <HugeiconsIcon icon={Archive} className="mr-1.5 h-3.5 w-3.5" />
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
                                    <HugeiconsIcon icon={ClipboardList} className="h-6 w-6 text-muted-foreground/50" />
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
                                    <HugeiconsIcon icon={MessageSquare} className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                                <h3 className="text-sm font-semibold">Test / proactive send</h3>
                            </div>
                            <HugeiconsIcon icon={ChevronDown}
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
                                        <HugeiconsIcon icon={Loader2} className="mr-2 h-4 w-4 animate-spin" />
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
                            {isPendingMetaTemplate ? (
                                <div className="rounded-2xl border border-amber-200/70 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-100">
                                    <p className="font-medium text-foreground">Meta review is pending</p>
                                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                        This version has already been submitted to Meta and is waiting for review. If you save changes, the template returns to draft and must be published again as a new Meta submission.
                                    </p>
                                </div>
                            ) : null}
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                    Linked WhatsApp number
                                </label>
                                <Select
                                    value={templateNumberIdInput}
                                    onValueChange={setTemplateNumberIdInput}
                                    disabled={!canChangeTemplateNumber}
                                >
                                    <SelectTrigger>
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
                                {!canChangeTemplateNumber ? (
                                    <p className="mt-1.5 text-xs text-muted-foreground/70">
                                        Published templates keep their linked number.
                                    </p>
                                ) : null}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                    Template name
                                </label>
                                <Input
                                    value={templateNameInput}
                                    onChange={(e) => setTemplateNameInput(e.target.value)}
                                    placeholder="Order Confirmation"
                                    disabled={noTemplateNumberSelected}
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
                                        <SelectTrigger disabled={noTemplateNumberSelected}>
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
                                        <SelectTrigger disabled={noTemplateNumberSelected}>
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
                                    disabled={noTemplateNumberSelected}
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                    Message body
                                </label>
                                <Textarea
                                    value={templateContentInput}
                                    onChange={(e) => updateTemplateContent(e.target.value)}
                                    rows={5}
                                    placeholder="Hi {{customer_name}}, your order has been confirmed!"
                                    className="font-mono text-sm"
                                    disabled={noTemplateNumberSelected}
                                />
                                <p className="mt-1.5 grid grid-cols-[14px_minmax(0,1fr)] items-start gap-x-1.5 text-xs leading-relaxed text-muted-foreground/70">
                                    <HugeiconsIcon icon={Info} className="mt-0.5 h-3 w-3 shrink-0" />
                                    <span>
                                        Use <code className="rounded bg-muted/60 px-1 font-mono text-[11px]">{`{{variable_name}}`}</code> for placeholders. Cloove converts them to Meta&apos;s numbered format when publishing.
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
                                    disabled={noTemplateNumberSelected}
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                    Variables
                                </label>
                                <p className="mb-2.5 grid grid-cols-[14px_minmax(0,1fr)] items-start gap-x-1.5 text-xs leading-relaxed text-muted-foreground/70">
                                    <HugeiconsIcon icon={Info} className="mt-0.5 h-3 w-3 shrink-0" />
                                    <span>
                                        Each variable you use in the message body must be listed here. Toggle <strong>Required</strong> for variables that must always be provided.
                                    </span>
                                </p>
                                <div className="space-y-2">
                                    {variableRows.length === 0 && !noTemplateNumberSelected && (
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
                                                disabled={noTemplateNumberSelected}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => toggleVariableRequired(index)}
                                                disabled={noTemplateNumberSelected}
                                                aria-label={variable.required ? "Mark as optional" : "Mark as required"}
                                                className={`flex h-10 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors ${variable.required
                                                    ? "border-brand-deep/30 bg-brand-deep/[0.06] text-brand-deep dark:border-brand-gold-600/30 dark:bg-brand-gold-600/10 dark:text-brand-gold-300"
                                                    : "border-border/60 text-muted-foreground hover:border-border"
                                                    }`}
                                            >
                                                <HugeiconsIcon icon={CheckCircle2} className={`h-3.5 w-3.5 ${variable.required ? "opacity-100" : "opacity-30"
                                                    }`} />
                                                Required
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => removeVariableRow(index)}
                                                disabled={noTemplateNumberSelected}
                                                aria-label="Remove variable"
                                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/60 text-muted-foreground/50 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                                            >
                                                <HugeiconsIcon icon={X} className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                {!noTemplateNumberSelected && (
                                    <button
                                        type="button"
                                        onClick={addVariableRow}
                                        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/60 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                                    >
                                        <HugeiconsIcon icon={Plus} className="h-3.5 w-3.5" />
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
                                                    <SelectTrigger disabled={noTemplateNumberSelected}>
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
                                                    disabled={noTemplateNumberSelected}
                                                />
                                                {button.type === "URL" ? (
                                                    <Input
                                                        value={button.url || ""}
                                                        onChange={(e) =>
                                                            updateButtonField(index, "url", e.target.value)
                                                        }
                                                        placeholder="https://example.com"
                                                        className="sm:col-span-2"
                                                        disabled={noTemplateNumberSelected}
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
                                                        disabled={noTemplateNumberSelected}
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
                                                            <SelectTrigger className="sm:col-span-2" disabled={noTemplateNumberSelected}>
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
                                                            disabled={noTemplateNumberSelected}
                                                        />
                                                    </>
                                                ) : null}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeButtonRow(index)}
                                                disabled={noTemplateNumberSelected}
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
                                        disabled={noTemplateNumberSelected}
                                        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/60 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                                    >
                                        <HugeiconsIcon icon={Plus} className="h-3.5 w-3.5" />
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
                                noTemplateNumberSelected ||
                                (editingTemplate && !hasTemplateFormChanges) ||
                                (!editingTemplate && !generatedTemplateKey) ||
                                !templateNameInput.trim() ||
                                !templateContentInput.trim()
                            }
                        >
                            {createTemplate.isPending || updateTemplate.isPending ? (
                                <HugeiconsIcon icon={Loader2} className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            {editingTemplate ? "Save changes" : "Create template"}
                        </Button>
                    </SideSheetFooter>
                </SideSheetContent>
            </SideSheet>
            <ConfirmDialog
                open={!!templateToPublish}
                onOpenChange={(open) => {
                    if (!open) setTemplateToPublish(null)
                }}
                onConfirm={confirmPublishTemplate}
                title={templateToPublish?.status === "published" ? "Push template to Meta?" : "Publish template?"}
                description={
                    templateToPublish?.status === "published"
                        ? `This will submit "${templateToPublish.name}" to Meta for review. It can only be sent after Meta approves it.`
                        : `This will submit "${templateToPublish?.name ?? "this template"}" to Meta for review and lock its linked WhatsApp number after publishing.`
                }
                confirmText={templateToPublish?.status === "published" ? "Push to Meta" : "Publish"}
                variant="primary"
                isLoading={publishTemplate.isPending}
            />
        </div>
    )
}
