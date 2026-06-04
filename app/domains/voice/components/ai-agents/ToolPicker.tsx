"use client"

import { useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ChevronDownIcon as ChevronDown, ChevronRightIcon as ChevronRight, CheckListIcon as ListChecks, Search01Icon as Search, Wrench01Icon as Wrench } from "@hugeicons/core-free-icons"
import { Input } from "@/app/components/ui/input"
import { Button } from "@/app/components/ui/button"
import { Switch } from "@/app/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/app/components/ui/select"
import { Skeleton } from "@/app/components/ui/skeleton"
import { cn } from "@/app/lib/utils"
import { useVoiceTools, type VoiceToolDefinitionItem } from "@/app/domains/voice/hooks/useVoice"

interface ToolPickerProps {
    selected: string[]
    onChange: (next: string[]) => void
}

/**
 * Group + filter + select voice tools. The catalog is fetched once and cached
 * by `useVoiceTools` — no need to memoize at the page level.
 *
 * - Category accordions with bulk-select toggle per group
 * - Per-tool description tooltip rendered inline (no native title attribute
 *   so it works on touch)
 * - Optional preset dropdown that bulk-applies a curated tool list
 *
 * Template-driven preset application lives in the parent editor so it can run
 * once per user action without re-firing on remount and clobbering edits.
 */
export function ToolPicker({ selected, onChange }: ToolPickerProps) {
    const { data, isLoading } = useVoiceTools()
    const [query, setQuery] = useState("")
    const [expandedCategory, setExpandedCategory] = useState<string | null>("catalog")

    const selectedSet = useMemo(() => new Set(selected), [selected])
    const totalTools = data?.tools.length ?? 0

    const groupedTools = useMemo(() => {
        const tools = data?.tools ?? []
        const filtered = query
            ? tools.filter(
                  (t) =>
                      t.displayName.toLowerCase().includes(query.toLowerCase()) ||
                      t.name.toLowerCase().includes(query.toLowerCase()) ||
                      (t.description ?? "").toLowerCase().includes(query.toLowerCase())
              )
            : tools
        const groups = new Map<string, VoiceToolDefinitionItem[]>()
        for (const tool of filtered) {
            const key = tool.category || "other"
            if (!groups.has(key)) groups.set(key, [])
            groups.get(key)!.push(tool)
        }
        return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b))
    }, [data?.tools, query])

    const toggle = (name: string) => {
        if (selectedSet.has(name)) onChange(selected.filter((n) => n !== name))
        else onChange([...selected, name])
    }

    const toggleGroup = (toolNames: string[]) => {
        const allSelected = toolNames.every((n) => selectedSet.has(n))
        if (allSelected) onChange(selected.filter((n) => !toolNames.includes(n)))
        else onChange(Array.from(new Set([...selected, ...toolNames])))
    }

    const applyPreset = (presetKey: string) => {
        const preset = data?.presets.find((p) => p.key === presetKey)
        if (preset) onChange(preset.tools)
    }

    if (isLoading) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-10 w-full rounded-2xl" />
                <Skeleton className="h-32 w-full rounded-2xl" />
                <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-brand-deep/5 bg-brand-deep/[0.025] px-4 py-3 dark:border-white/10 dark:bg-white/[0.035]">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-gold/10 text-brand-gold dark:bg-brand-gold/15 dark:text-brand-gold-300">
                            <HugeiconsIcon icon={Wrench} className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-brand-deep dark:text-brand-cream">
                                Choose what this agent can do
                            </p>
                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                Enable only the actions this agent should perform during calls. Presets are a quick
                                starting point and can be adjusted below.
                            </p>
                        </div>
                    </div>
                    <div className="hidden shrink-0 rounded-full border border-brand-deep/5 bg-white/70 px-3 py-1 text-xs font-medium text-muted-foreground dark:border-white/10 dark:bg-white/5 sm:block">
                        {selected.length}/{totalTools} enabled
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <HugeiconsIcon icon={Search} className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search tools..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="rounded-2xl border-brand-deep/8 bg-white/70 pl-9 dark:border-white/10 dark:bg-white/5"
                    />
                </div>
                {(data?.presets.length ?? 0) > 0 && (
                    <Select onValueChange={applyPreset}>
                        <SelectTrigger className="w-full rounded-2xl border-brand-deep/8 bg-white/70 text-brand-deep shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-brand-cream sm:w-72 [&>span]:flex-1 [&>span]:text-left">
                            <HugeiconsIcon icon={ListChecks} className="mr-2 h-4 w-4 shrink-0" />
                            <SelectValue placeholder="Apply preset" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                            {(data?.presets ?? []).map((preset) => (
                                <SelectItem key={preset.key} value={preset.key}>
                                    <span className="font-medium">{preset.label}</span>
                                    <span className="ml-2 text-xs text-muted-foreground">
                                        {preset.tools.length} tools
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>

            <div className="space-y-3">
                {groupedTools.map(([category, tools]) => {
                    const names = tools.map((t) => t.name)
                    const selectedInGroup = names.filter((n) => selectedSet.has(n)).length
                    const allSelected = selectedInGroup === names.length
                    const expanded = expandedCategory === category

                    return (
                        <div
                            key={category}
                            className="overflow-hidden rounded-2xl border border-brand-deep/5 bg-brand-deep/[0.025] dark:border-white/10 dark:bg-white/[0.035]"
                        >
                            <div className="flex items-center justify-between gap-3 px-4 py-3">
                                <button
                                    type="button"
                                    onClick={() => setExpandedCategory(expanded ? null : category)}
                                    className="flex min-w-0 items-center gap-3 text-left"
                                >
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/80 text-brand-deep/70 dark:bg-white/5 dark:text-brand-cream/70">
                                        {expanded ? (
                                            <HugeiconsIcon icon={ChevronDown} className="h-4 w-4" />
                                        ) : (
                                            <HugeiconsIcon icon={ChevronRight} className="h-4 w-4" />
                                        )}
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block text-sm font-semibold capitalize text-brand-deep dark:text-brand-cream">
                                            {category.replace(/_/g, " ")}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {selectedInGroup} of {names.length} enabled
                                        </span>
                                    </span>
                                </button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleGroup(names)}
                                    className="rounded-full px-3 text-xs text-muted-foreground hover:text-brand-deep dark:hover:text-brand-cream"
                                >
                                    {allSelected ? "Clear group" : "Select all"}
                                </Button>
                            </div>
                            {expanded && (
                                <ul className="border-t border-brand-deep/5 bg-white/55 dark:border-white/10 dark:bg-white/[0.025]">
                                    {tools.map((tool, index) => {
                                        const active = selectedSet.has(tool.name)
                                        return (
                                        <li
                                            key={tool.name}
                                            className={cn(
                                                "flex items-start gap-4 px-4 py-3.5 transition-colors",
                                                index > 0 && "border-t border-brand-deep/5 dark:border-white/8",
                                                active && "bg-brand-green/[0.035] dark:bg-brand-gold/[0.045]"
                                            )}
                                        >
                                            <Switch
                                                checked={active}
                                                onCheckedChange={() => toggle(tool.name)}
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-sm font-semibold text-brand-deep dark:text-brand-cream">
                                                        {tool.displayName}
                                                    </p>
                                                    {tool.requiredPlanTier && (
                                                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
                                                            {tool.requiredPlanTier}
                                                        </span>
                                                    )}
                                                </div>
                                                {tool.description && (
                                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                                        {tool.description}
                                                    </p>
                                                )}
                                                <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/60">
                                                    {tool.name}
                                                </p>
                                            </div>
                                        </li>
                                    )})}
                                </ul>
                            )}
                        </div>
                    )
                })}
                {groupedTools.length === 0 && (
                    <div
                        className={cn(
                            "rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground"
                        )}
                    >
                        No tools matched your search.
                    </div>
                )}
            </div>
        </div>
    )
}
