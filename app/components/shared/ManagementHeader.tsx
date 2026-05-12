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
        <div className={cn("space-y-5", className)}>
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <h1 className="mb-2 text-3xl font-semibold tracking-tight text-foreground md:text-[2.5rem]">
                        {title}
                    </h1>
                    {description && (
                        <p className="max-w-2xl text-base text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>
                {(extraActions || (addButtonLabel && onAddClick)) && (
                    <div className={cn(
                        "items-center gap-3",
                        mobileFloatingAction && isMobile ? "mt-4 md:mt-0 w-full block" : "flex"
                    )}>
                        {extraActions}
                        {addButtonLabel && onAddClick && (
                            <Button
                                onClick={onAddClick}
                                className={cn(
                                    "h-11 rounded-full px-5 font-semibold text-white shadow-sm transition-colors hover:text-white [&_svg]:text-white",
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
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <Search className="w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-foreground" />
                        </div>
                        <input
                            type="text"
                            value={searchValue}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="w-full rounded-2xl border border-border bg-background pl-10 pr-4 py-3 text-foreground transition-all placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/15"
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
        </div>
    )
}
