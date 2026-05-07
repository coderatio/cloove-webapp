"use client"

import * as React from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { cn } from "@/app/lib/utils"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/app/components/ui/select"

export interface TabItem {
    id: string
    label: string
    icon: React.ElementType
}

interface PersistedTabsProps {
    tabs: TabItem[]
    activeTab: string
    onChange: (id: string) => void
    defaultTab?: string
    queryParamName?: string
    className?: string
    orientation?: "horizontal" | "vertical"
    compact?: boolean
}

/**
 * A reusable tab navigation component that persists the active tab to the URL.
 */
export function PersistedTabs({
    tabs,
    activeTab,
    onChange,
    defaultTab,
    queryParamName = "tab",
    className,
    orientation = "horizontal",
    compact = false,
}: PersistedTabsProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Sync state with URL on mount and when searchParams change
    React.useEffect(() => {
        const tabParam = searchParams.get(queryParamName)
        if (tabParam && tabParam !== activeTab && tabs.some(t => t.id === tabParam)) {
            onChange(tabParam)
        } else if (!tabParam && defaultTab && activeTab !== defaultTab) {
            onChange(defaultTab)
        }
    }, [searchParams, queryParamName, tabs, onChange, activeTab, defaultTab])

    const handleTabClick = (id: string) => {
        if (id === activeTab) return
        onChange(id)

        // Update URL search params
        const params = new URLSearchParams(searchParams.toString())
        params.set(queryParamName, id)

        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }

    return (
        <div
            className={cn(
                orientation === "vertical" ? "w-full" : "w-full overflow-x-auto pb-2 no-scrollbar",
                className
            )}
        >
            {orientation === "vertical" && (
                <div className="mb-3 lg:hidden">
                    <Select
                        value={activeTab}
                        onValueChange={handleTabClick}
                    >
                        <SelectTrigger className="h-14 w-full rounded-2xl px-4 text-sm font-medium">
                            <SelectValue placeholder="Select settings tab" />
                        </SelectTrigger>
                        <SelectContent className="rounded-3xl">
                            {tabs.map((tab) => (
                                <SelectItem key={tab.id} value={tab.id}>
                                    {tab.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
            <div
                className={cn(
                    "p-1 bg-brand-deep/5 dark:bg-white/5 rounded-2xl",
                    orientation === "vertical"
                        ? "hidden w-full flex-col gap-1.5 lg:flex"
                        : "flex w-max min-w-0 items-center gap-2"
                )}
            >
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabClick(tab.id)}
                        className={cn(
                            "relative cursor-pointer flex items-center rounded-xl text-sm font-medium transition-all duration-200",
                            orientation === "vertical"
                                ? cn(
                                    "w-full justify-start",
                                    compact ? "gap-2 px-3 py-2" : "gap-2.5 px-4 py-2.5"
                                )
                                : "gap-2 whitespace-nowrap px-6 py-2.5",
                            activeTab === tab.id
                                ? "text-brand-deep dark:text-slate-100"
                                : "text-brand-deep/60 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-white/10"
                        )}
                    >
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="active-tab-indicator"
                                className="absolute inset-0 bg-white dark:bg-slate-800/90 rounded-xl shadow-sm"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <tab.icon className={cn("relative z-10", compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
                        <span className="relative z-10">{tab.label}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}
