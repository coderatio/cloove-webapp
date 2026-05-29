"use client"

import * as React from "react"
import { Search, Plus } from "lucide-react"
import { Button } from "../ui/button"
import { cn } from "../../lib/utils"
import { FilterPopover, FilterGroup } from "./FilterPopover"
import { useIsMobile } from "@/app/hooks/useMediaQuery"

interface ManagementHeaderProps {
    title: string
    description?: string
    searchValue?: string
    onSearchChange?: (value: string) => void
    searchPlaceholder?: string
    filterGroups?: FilterGroup[]
    selectedFilterValues?: string[]
    onFilterSelectionChange?: (values: string[]) => void
    onFilterClear?: () => void
    addButtonLabel?: string
    onAddClick?: () => void
    extraActions?: React.ReactNode
    className?: string
    mobileFloatingAction?: boolean
}

export function ManagementHeader({
    title,
    description,
    searchValue,
    onSearchChange,
    searchPlaceholder = "Search...",
    filterGroups,
    selectedFilterValues = [],
    onFilterSelectionChange,
    onFilterClear,
    addButtonLabel,
    onAddClick,
    extraActions,
    className,
    mobileFloatingAction = false
}: ManagementHeaderProps) {
    const isMobile = useIsMobile()
    return (
        <header
            className={cn(
                "rounded-[1.75rem] border border-brand-deep/5 bg-white/72 px-4 py-4 shadow-sm shadow-brand-deep/[0.025] backdrop-blur dark:border-white/8 dark:bg-white/[0.035] sm:px-5",
                className
            )}
        >
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div className="min-w-0">
                    <h1 className="text-2xl font-semibold leading-none tracking-tight text-foreground md:text-[2rem]">
                        {title}
                    </h1>
                    {description && (
                        <p className="mt-1.5 max-w-3xl text-sm leading-5 text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>
                {(extraActions || (addButtonLabel && onAddClick)) && (
                    <div className={cn(
                        "shrink-0 items-center gap-2",
                        mobileFloatingAction && isMobile ? "w-full block md:w-auto" : "flex"
                    )}>
                        {extraActions}
                        {addButtonLabel && onAddClick && (
                            <Button
                                onClick={onAddClick}
                                className={cn(
                                    "h-9 rounded-full px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:text-white [&_svg]:text-white",
                                    mobileFloatingAction && isMobile && "fixed top-15 right-6 z-50 h-14 w-14 p-0 md:static md:h-12 md:w-auto md:px-6 md:rounded-full shadow-2xl md:shadow-lg"
                                )}
                            >
                                <Plus className={cn("mr-2 h-4 w-4", mobileFloatingAction && isMobile && "m-0 h-6 w-6 md:mr-2 md:h-4 md:w-4")} />
                                <span className={cn(mobileFloatingAction && isMobile && "hidden md:inline")}>{addButtonLabel}</span>
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {searchValue !== undefined && onSearchChange && (
                <div className="mt-4 flex flex-col gap-2 border-t border-brand-deep/5 pt-4 dark:border-white/8 sm:flex-row sm:items-center">
                    <div className="relative flex-1 group">
                        <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
                            <Search className="h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-foreground" />
                        </div>
                        <input
                            type="text"
                            value={searchValue}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="h-10 w-full rounded-2xl border border-brand-deep/8 bg-white/80 px-4 pl-10 text-sm text-foreground shadow-sm shadow-brand-deep/[0.02] transition-all placeholder:text-muted-foreground focus:border-brand-deep/20 focus:outline-none focus:ring-2 focus:ring-brand-gold/15 dark:border-white/10 dark:bg-white/[0.04]"
                        />
                    </div>
                    {filterGroups && onFilterSelectionChange && onFilterClear && (
                        <FilterPopover
                            groups={filterGroups}
                            selectedValues={selectedFilterValues}
                            onSelectionChange={onFilterSelectionChange}
                            onClear={onFilterClear}
                        />
                    )}
                </div>
            )}
        </header>
    )
}
