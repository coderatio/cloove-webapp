"use client"

import * as React from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { cn } from "@/app/lib/utils"

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
    className
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
        <div className={cn("w-full overflow-x-auto pb-2 no-scrollbar", className)}>
            <div className="flex items-center gap-2 p-1 bg-brand-deep/5 dark:bg-white/5 rounded-2xl w-max min-w-0">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabClick(tab.id)}
                        className={cn(
                            "relative cursor-pointer flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap",
                            activeTab === tab.id
                                ? "text-brand-deep dark:text-brand-gold"
                                : "text-brand-deep/60 dark:text-brand-cream/60 hover:bg-white/50 dark:hover:bg-white/5"
                        )}
                    >
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="active-tab-indicator"
                                className="absolute inset-0 bg-white dark:bg-white/10 rounded-xl shadow-sm"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <tab.icon className="relative z-10 w-4 h-4" />
                        <span className="relative z-10">{tab.label}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}
