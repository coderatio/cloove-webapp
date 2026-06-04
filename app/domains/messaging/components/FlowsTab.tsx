"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArchiveIcon as Archive, CopyIcon as Copy, GitBranchIcon as GitBranch, PencilEdit01Icon as PencilLine, PlusSignIcon as Plus, Search01Icon as Search } from "@hugeicons/core-free-icons"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Badge } from "@/app/components/ui/badge"
import { Skeleton } from "@/app/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { useWhatsAppNumbers } from "@/app/domains/messaging/hooks/useWhatsAppSettings"
import {
    useArchiveWhatsAppFlow,
    useDuplicateWhatsAppFlow,
    usePublishWhatsAppFlow,
    useWhatsAppFlows,
    useWhatsAppFlowStats,
} from "@/app/domains/messaging/hooks/useWhatsAppInbox"
import { formatPhoneNumber } from "@/app/lib/utils"

// ─── Shared Types ────────────────────────────────────────────────

export type FlowFieldKind = "text" | "number" | "textarea" | "dropdown" | "checkbox"

export type FlowFieldDraft = {
    id: string
    kind: FlowFieldKind
    label: string
    name: string
    required: boolean
    helperText: string
    optionsText: string
}

// ─── Helpers ─────────────────────────────────────────────────────

export function formatWhatsAppNumberLabel(number: {
    display_name?: string | null
    display_phone_number?: string | null
    phone_number?: string | null
}) {
    const rawPhone = number.display_phone_number?.trim() || number.phone_number?.trim() || null
    const phone = formatPhoneNumber(rawPhone, { spaced: true }) || rawPhone
    return phone ? `${number.display_name || "WhatsApp number"} (${phone})` : number.display_name || "WhatsApp number"
}

export function createFlowFieldDraft(kind: FlowFieldKind = "text"): FlowFieldDraft {
    return {
        id: `field_${Math.random().toString(36).slice(2, 10)}`,
        kind,
        label: "",
        name: "",
        required: false,
        helperText: "",
        optionsText: "",
    }
}

export function slugifyFlowFieldName(value: string) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
}

function parseFlowOptions(optionsText: string) {
    return optionsText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const [left, ...rest] = line.split(":")
            const id = left.trim()
            const title = rest.join(":").trim() || left.trim()
            return { id, title }
        })
}

export function buildFlowJsonFromDraft(input: {
    key: string
    title: string
    ctaText: string
    introText?: string
    fields: FlowFieldDraft[]
}) {
    const screenId = slugifyFlowFieldName(input.key).toUpperCase() || "CUSTOM_FLOW"
    const fieldChildren = input.fields
        .filter((field) => field.label.trim() && field.name.trim())
        .map((field) => {
            const base = {
                label: field.label.trim(),
                name: field.name.trim(),
                required: field.required,
            } as Record<string, unknown>

            if (field.helperText.trim()) {
                base["helper-text"] = field.helperText.trim()
            }

            if (field.kind === "textarea") {
                return { type: "TextArea", ...base }
            }
            if (field.kind === "number") {
                return { type: "TextInput", "input-type": "number", ...base }
            }
            if (field.kind === "dropdown") {
                return {
                    type: "Dropdown",
                    "data-source": parseFlowOptions(field.optionsText),
                    ...base,
                }
            }
            if (field.kind === "checkbox") {
                return {
                    type: "CheckboxGroup",
                    "data-source": parseFlowOptions(field.optionsText),
                    ...base,
                }
            }
            return { type: "TextInput", ...base }
        })

    const payload = input.fields
        .filter((field) => field.label.trim() && field.name.trim())
        .reduce<Record<string, string>>(
            (acc, field) => {
                acc[field.name.trim()] = `\${form.${field.name.trim()}}`
                return acc
            },
            {
                flow: screenId,
                business_id: "${data.business_id}",
                customer_phone: "${data.customer_phone}",
            }
        )

    return {
        version: "7.1",
        screens: [
            {
                id: screenId,
                title: input.title.trim() || "Business flow",
                terminal: true,
                success: true,
                data: {
                    business_id: { type: "string", __example__: "business_1" },
                    customer_phone: { type: "string", __example__: "+2348000000000" },
                },
                layout: {
                    type: "SingleColumnLayout",
                    children: [
                        {
                            type: "Form",
                            name: `${slugifyFlowFieldName(input.key)}_form`,
                            children: [
                                { type: "TextHeading", text: input.title.trim() || "Business flow" },
                                ...(input.introText?.trim()
                                    ? [{ type: "TextBody", text: input.introText.trim() }]
                                    : []),
                                ...fieldChildren,
                                {
                                    type: "Footer",
                                    label: input.ctaText.trim() || "Submit",
                                    "on-click-action": {
                                        name: "complete",
                                        payload,
                                    },
                                },
                            ],
                        },
                    ],
                },
            },
        ],
    }
}

export function parseFlowJsonToDraft(flowJson: Record<string, unknown> | null | undefined) {
    const screen = Array.isArray(flowJson?.screens) ? flowJson.screens[0] as Record<string, any> : null
    const form = Array.isArray(screen?.layout?.children)
        ? screen.layout.children.find((child: any) => child?.type === "Form")
        : null
    const children = Array.isArray(form?.children) ? form.children : []
    const intro = children.find((child: any) => child?.type === "TextBody")
    const footer = children.find((child: any) => child?.type === "Footer")
    const fields = children
        .filter((child: any) =>
            ["TextInput", "TextArea", "Dropdown", "CheckboxGroup"].includes(String(child?.type || ""))
        )
        .map((child: any) => {
            const kind: FlowFieldKind =
                child.type === "TextArea"
                    ? "textarea"
                    : child.type === "Dropdown"
                        ? "dropdown"
                        : child.type === "CheckboxGroup"
                            ? "checkbox"
                            : child["input-type"] === "number"
                                ? "number"
                                : "text"

            const optionsText = Array.isArray(child["data-source"])
                ? child["data-source"].map((item: any) => `${item.id}: ${item.title}`).join("\n")
                : ""

            return {
                id: `field_${Math.random().toString(36).slice(2, 10)}`,
                kind,
                label: String(child.label || ""),
                name: String(child.name || ""),
                required: Boolean(child.required),
                helperText: String(child["helper-text"] || ""),
                optionsText,
            } satisfies FlowFieldDraft
        })

    return {
        title: String(screen?.title || ""),
        introText: String(intro?.text || ""),
        ctaText: String(footer?.label || ""),
        fields: fields.length ? fields : [createFlowFieldDraft("text")],
        headingText: String(children.find((child: any) => child?.type === "TextHeading")?.text || ""),
    }
}

// ─── FlowsTab Component ──────────────────────────────────────────

export function FlowsTab() {
    const router = useRouter()

    const [selectedNumberId, setSelectedNumberId] = useState("")
    const [search, setSearch] = useState("")

    const { data: numbers } = useWhatsAppNumbers()
    const { data: flowResults, isLoading } = useWhatsAppFlows(selectedNumberId || null)
    const stats = useWhatsAppFlowStats(selectedNumberId || null)
    const publishFlow = usePublishWhatsAppFlow()
    const archiveFlow = useArchiveWhatsAppFlow()
    const duplicateFlow = useDuplicateWhatsAppFlow()

    const flows = flowResults?.data ?? []
    const filteredFlows = flows.filter((flow) => {
        const query = search.trim().toLowerCase()
        if (!query) return true
        return (
            flow.display_name.toLowerCase().includes(query) ||
            flow.key.toLowerCase().includes(query) ||
            flow.name.toLowerCase().includes(query)
        )
    })

    const metricCards = [
        { label: "Total", value: stats.data?.total ?? 0 },
        { label: "Draft", value: stats.data?.draft ?? 0 },
        { label: "Published", value: stats.data?.published ?? 0 },
        { label: "Archived", value: stats.data?.archived ?? 0 },
    ]

    // Set default number
    useEffect(() => {
        if (!selectedNumberId && numbers?.[0]?.id) {
            setSelectedNumberId(numbers[0].id)
        }
    }, [numbers, selectedNumberId])

    return (
        <div className="space-y-8">
            {/* Toolbar */}
            <GlassCard className="p-4">
                <div className="flex flex-col gap-3 lg:flex-row">
                    <Select value={selectedNumberId} onValueChange={setSelectedNumberId}>
                        <SelectTrigger className="w-full lg:w-72">
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
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search flows..."
                            className="pl-9"
                        />
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => router.push(`/whatsapp/flows/new?numberId=${selectedNumberId}`)}
                    >
                        <HugeiconsIcon icon={Plus} className="mr-1.5 h-3.5 w-3.5" />
                        New flow
                    </Button>
                </div>
            </GlassCard>

            {/* Stats bar */}
            <section>
                <div className="mb-4 flex items-center gap-2">
                    <div className="h-1 w-6 rounded-full bg-brand-deep/20 dark:bg-brand-gold-700/40" />
                    <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                        Flow library
                    </h2>
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                    {(stats.isLoading
                        ? Array.from<{ label: string; value: number }>({ length: 4 }).fill({ label: "", value: 0 })
                        : metricCards
                    ).map((card, i) => (
                        <GlassCard key={`${card.label}-${i}`} className="p-4">
                            {stats.isLoading ? (
                                <>
                                    <Skeleton className="h-4 w-16" />
                                    <Skeleton className="mt-2 h-8 w-12 rounded-xl" />
                                </>
                            ) : (
                                <>
                                    <p className="text-xs text-muted-foreground/70 uppercase tracking-wider">
                                        {card.label}
                                    </p>
                                    <p className="mt-1.5 text-2xl font-semibold tabular-nums">
                                        {card.value}
                                    </p>
                                </>
                            )}
                        </GlassCard>
                    ))}
                </div>
            </section>

            {/* List view */}
            <section>
                <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-muted/30">
                        <HugeiconsIcon icon={GitBranch} className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-foreground">Available flows</h2>
                        <p className="text-xs text-muted-foreground">
                            Published flows can be linked from template CTA buttons.
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    {!selectedNumberId ? (
                        <GlassCard className="flex flex-col items-center gap-3 px-5 py-12 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/60 bg-muted/30">
                                <HugeiconsIcon icon={GitBranch} className="h-6 w-6 text-muted-foreground/50" />
                            </div>
                            <p className="text-sm font-medium text-foreground">Select a WhatsApp number</p>
                            <p className="max-w-sm text-xs text-muted-foreground">
                                Choose a connected number to view its business-owned flows.
                            </p>
                        </GlassCard>
                    ) : isLoading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <GlassCard key={i} className="p-5">
                                <Skeleton className="h-5 w-44" />
                                <Skeleton className="mt-3 h-4 w-full" />
                                <Skeleton className="mt-2 h-4 w-2/3" />
                            </GlassCard>
                        ))
                    ) : filteredFlows.length > 0 ? (
                        filteredFlows.map((flow) => (
                            <GlassCard key={flow.id} className="p-5 hover:border-foreground/10 transition-colors">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="space-y-1.5 min-w-0">
                                        <div className="flex items-center gap-2.5">
                                            <h3 className="font-medium text-foreground truncate">
                                                {flow.display_name}
                                            </h3>
                                            <Badge
                                                variant={flow.status === "PUBLISHED" ? "emerald" : flow.status === "DRAFT" ? "warning" : "default"}
                                                className="rounded-full font-normal shrink-0"
                                            >
                                                {flow.status.toLowerCase()}
                                            </Badge>
                                            {flow.meta_status && flow.meta_status !== "APPROVED" && (
                                                <Badge variant="outline" className="rounded-full font-normal shrink-0">
                                                    Meta: {flow.meta_status}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground/70 font-mono">
                                            {flow.key}
                                        </p>
                                        {flow.description && (
                                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                                                {flow.description}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <Badge variant="outline" className="rounded-full text-xs">
                                            {flow.cta_text}
                                        </Badge>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="rounded-full text-xs"
                                            onClick={() => router.push(`/whatsapp/flows/${flow.id}?numberId=${selectedNumberId}`)}
                                        >
                                            <HugeiconsIcon icon={PencilLine} className="mr-1.5 h-3.5 w-3.5" />
                                            Edit
                                        </Button>
                                        {flow.status !== "PUBLISHED" && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="rounded-full text-xs"
                                                onClick={async () => {
                                                    try {
                                                        await publishFlow.mutateAsync({
                                                            id: flow.id,
                                                            businessWhatsappNumberId: selectedNumberId,
                                                        })
                                                        toast.success("Flow published")
                                                    } catch (error) {
                                                        toast.error(error instanceof Error ? error.message : "Failed to publish")
                                                    }
                                                }}
                                            >
                                                Publish
                                            </Button>
                                        )}
                                        {flow.is_active && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="rounded-full text-xs text-muted-foreground hover:text-foreground"
                                                onClick={async () => {
                                                    try {
                                                        await archiveFlow.mutateAsync({
                                                            id: flow.id,
                                                            businessWhatsappNumberId: selectedNumberId,
                                                        })
                                                        toast.success("Flow archived")
                                                    } catch (error) {
                                                        toast.error(error instanceof Error ? error.message : "Failed to archive")
                                                    }
                                                }}
                                            >
                                                <HugeiconsIcon icon={Archive} className="mr-1.5 h-3.5 w-3.5" />
                                                Archive
                                            </Button>
                                        )}

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="rounded-full text-xs text-muted-foreground hover:text-foreground"
                                            disabled={duplicateFlow.isPending}
                                            onClick={async () => {
                                                try {
                                                    await duplicateFlow.mutateAsync({
                                                        flow,
                                                        businessWhatsappNumberId: selectedNumberId,
                                                    })
                                                    toast.success(`"${flow.display_name}" duplicated`)
                                                } catch (error) {
                                                    toast.error(error instanceof Error ? error.message : "Failed to duplicate flow")
                                                }
                                            }}
                                        >
                                            <HugeiconsIcon icon={Copy} className="mr-1.5 h-3.5 w-3.5" />
                                            Duplicate
                                        </Button>
                                    </div>
                                </div>
                            </GlassCard>
                        ))
                    ) : (
                        <GlassCard className="flex flex-col items-center gap-3 px-5 py-12 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/60 bg-muted/30">
                                <HugeiconsIcon icon={GitBranch} className="h-6 w-6 text-muted-foreground/50" />
                            </div>
                            <p className="text-sm font-medium text-foreground">No flows yet</p>
                            <p className="max-w-sm text-xs text-muted-foreground">
                                {search.trim()
                                    ? "No flows match your search. Try different keywords."
                                    : "Create your first WhatsApp flow to collect customer responses directly in chat."}
                            </p>
                            {!search.trim() && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="mt-1 rounded-full"
                                    onClick={() => router.push(`/whatsapp/flows/new?numberId=${selectedNumberId}`)}
                                >
                                    <HugeiconsIcon icon={Plus} className="mr-1.5 h-3.5 w-3.5" />
                                    Create flow
                                </Button>
                            )}
                        </GlassCard>
                    )}
                </div>
            </section>
        </div>
    )
}
