"use client"

import * as React from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { X } from "lucide-react"
import { cn } from "@/app/lib/utils"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerTitle,
    DrawerTrigger,
} from "@/app/components/ui/drawer"

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
    /** Title shown at the top of the mobile side sheet (vertical orientation only). */
    mobileSheetTitle?: string
}

/**
 * A reusable tab navigation component that persists the active tab to the URL.
 *
 * - `horizontal` orientation: scrollable pill row (unchanged).
 * - `vertical` orientation:
 *    - `lg+`: vertical list in a sticky side rail.
 *    - `<lg`: floating action button that opens a right-side sheet with the tab list.
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
    mobileSheetTitle = "Menu",
}: PersistedTabsProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [sheetOpen, setSheetOpen] = React.useState(false)

    React.useEffect(() => {
        const tabParam = searchParams.get(queryParamName)
        if (tabParam && tabParam !== activeTab && tabs.some((t) => t.id === tabParam)) {
            onChange(tabParam)
        } else if (!tabParam && defaultTab && activeTab !== defaultTab) {
            onChange(defaultTab)
        }
    }, [searchParams, queryParamName, tabs, onChange, activeTab, defaultTab])

    const handleTabClick = (id: string) => {
        if (id === activeTab) {
            setSheetOpen(false)
            return
        }
        onChange(id)
        setSheetOpen(false)

        const params = new URLSearchParams(searchParams.toString())
        params.set(queryParamName, id)
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }

    const activeTabItem = tabs.find((t) => t.id === activeTab)
    const ActiveIcon = activeTabItem?.icon

    return (
        <>
            {orientation === "vertical" && (
                <Drawer open={sheetOpen} onOpenChange={setSheetOpen}>
                    <DrawerTrigger asChild>
                        <motion.button
                            type="button"
                            initial={{ scale: 0, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                            className="fixed bottom-28 right-6 z-40 inline-flex h-12 max-w-[70vw] items-center gap-2 rounded-full bg-brand-deep px-5 text-sm font-semibold text-brand-cream shadow-xl shadow-brand-deep/20 transition-colors active:scale-95 lg:hidden dark:bg-brand-gold-700 dark:text-white"
                            aria-label={`Open ${mobileSheetTitle.toLowerCase()}`}
                        >
                            {ActiveIcon && <ActiveIcon className="h-4 w-4 shrink-0" />}
                            <span className="truncate">
                                {activeTabItem?.label ?? mobileSheetTitle}
                            </span>
                        </motion.button>
                    </DrawerTrigger>
                    <DrawerContent className="lg:hidden">
                        <div className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-slate-200 dark:bg-white/10" />
                        <div className="flex items-center justify-between border-b border-border px-5 pb-4 pt-3">
                            <DrawerTitle className="font-sans text-base font-semibold tracking-normal text-foreground">
                                {mobileSheetTitle}
                            </DrawerTitle>
                            <DrawerClose asChild>
                                <button
                                    type="button"
                                    className="rounded-full bg-slate-100 p-2 text-slate-600 transition-colors hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                                    aria-label="Close menu"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </DrawerClose>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="flex flex-col gap-1.5 rounded-2xl bg-brand-deep/5 p-1 dark:bg-white/5">
                                {tabs.map((tab) => {
                                    const isActive = activeTab === tab.id
                                    return (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => handleTabClick(tab.id)}
                                            className={cn(
                                                "relative flex w-full cursor-pointer items-center justify-start gap-2.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                                                isActive
                                                    ? "bg-white text-brand-deep shadow-sm dark:bg-slate-800/90 dark:text-slate-100"
                                                    : "text-brand-deep/60 hover:bg-white/50 dark:text-slate-300 dark:hover:bg-white/10"
                                            )}
                                            aria-current={isActive ? "page" : undefined}
                                        >
                                            <tab.icon className="h-4 w-4 shrink-0" />
                                            <span>{tab.label}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </DrawerContent>
                </Drawer>
            )}

            <div
                className={cn(
                    orientation === "vertical"
                        ? "hidden w-full lg:block"
                        : "w-full overflow-x-auto pb-2 no-scrollbar",
                    className
                )}
            >
                <div
                    className={cn(
                        "p-1 bg-brand-deep/5 dark:bg-white/5 rounded-2xl",
                        orientation === "vertical"
                            ? "flex w-full flex-col gap-1.5"
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
        </>
    )
}
