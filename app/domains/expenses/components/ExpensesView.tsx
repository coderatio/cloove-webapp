"use client"

import * as React from "react"
import DataTable, { type Column } from "@/app/components/DataTable"
import { useIsMobile } from "@/app/hooks/useMediaQuery"
import { PageTransition } from "@/app/components/layout/page-transition"
import { ListCard } from "@/app/components/ui/list-card"
import { GlassCard } from "@/app/components/ui/glass-card"
import { HugeiconsIcon } from "@hugeicons/react"
import { BanknoteIcon as Banknote, TradeDownIcon as TrendingDown, CalculatorIcon as Calculator, Delete02Icon as Trash2, Loading03Icon as Loader2, ChevronLeftIcon as ChevronLeft, ChevronRightIcon as ChevronRight, MoreHorizontalIcon as MoreHorizontal, PencilIcon as Pencil, Invoice01Icon as Receipt, Calendar03Icon as CalendarIcon } from "@hugeicons/core-free-icons"
import { cn } from "@/app/lib/utils"
import { ManagementHeader } from "@/app/components/shared/ManagementHeader"
import { useBusiness } from "@/app/components/BusinessProvider"
import { usePresetPageCopy } from "@/app/domains/workspace/hooks/usePresetPageCopy"
import { formatCurrency, formatDate } from "@/app/lib/formatters"
import { CurrencyText } from "@/app/components/shared/CurrencyText"
import { Button } from "@/app/components/ui/button"
import { FilterPopover } from "@/app/components/shared/FilterPopover"
import { TableSearch } from "@/app/components/shared/TableSearch"
import { ConfirmDialog } from "@/app/components/shared/ConfirmDialog"
import { Skeleton } from "@/app/components/ui/skeleton"
import { useExpenses, useExpenseStats, useExpenseBreakdown, type Expense } from "../hooks/useExpenses"
import { ExpenseFormDrawer } from "./ExpenseFormDrawer"
import { EXPENSE_CATEGORIES, getCategoryConfig } from "../utils/categoryColors"
import { Calendar } from "@/app/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/app/components/ui/popover"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerBody,
    DrawerFooter,
    DrawerClose,
} from "@/app/components/ui/drawer"

const PAGE_SIZE = 20
const BREAKDOWN_PREVIEW_LIMIT = 5

export function ExpensesView() {
    const isMobile = useIsMobile()
    const { activeBusiness } = useBusiness()
    const pageCopy = usePresetPageCopy()
    const currencyCode = activeBusiness?.currency ?? "NGN"
    const [search, setSearch] = React.useState("")
    const deferredSearch = React.useDeferredValue(search)
    const [currentPage, setCurrentPage] = React.useState(1)
    const [selectedFilters, setSelectedFilters] = React.useState<string[]>([])
    const [vendorSearch, setVendorSearch] = React.useState("")
    const deferredVendorSearch = React.useDeferredValue(vendorSearch)
    const [isAddOpen, setIsAddOpen] = React.useState(false)
    const [editingItem, setEditingItem] = React.useState<Expense | null>(null)
    const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false)
    const [itemToDelete, setItemToDelete] = React.useState<Expense | null>(null)
    const [isBreakdownDrawerOpen, setIsBreakdownDrawerOpen] = React.useState(false)
    const [breakdownDrawerType, setBreakdownDrawerType] = React.useState<"category" | "vendor">("category")

    const selectedCategory = selectedFilters.length === 1 ? selectedFilters[0] : undefined
    const today = React.useMemo(() => new Date(), [])
    const defaultStartDate = React.useMemo(() => {
        const d = new Date(today.getFullYear(), today.getMonth(), 1)
        return d.toISOString().slice(0, 10)
    }, [today])
    const defaultEndDate = React.useMemo(() => today.toISOString().slice(0, 10), [today])
    const [breakdownStartDate, setBreakdownStartDate] = React.useState(defaultStartDate)
    const [breakdownEndDate, setBreakdownEndDate] = React.useState(defaultEndDate)
    const [hasAutoRangeInitialized, setHasAutoRangeInitialized] = React.useState(false)
    const startDateValue = breakdownStartDate ? new Date(`${breakdownStartDate}T00:00:00`) : undefined
    const endDateValue = breakdownEndDate ? new Date(`${breakdownEndDate}T00:00:00`) : undefined

    const toDateInput = React.useCallback((value: Date) => value.toISOString().slice(0, 10), [])

    const {
        expenses,
        meta,
        isPending,
        error,
        createExpense,
        updateExpense,
        deleteExpense,
        isCreating,
        isUpdating,
        isDeleting,
    } = useExpenses(
        currentPage,
        PAGE_SIZE,
        deferredSearch,
        selectedCategory,
        breakdownStartDate || undefined,
        breakdownEndDate || undefined
    )

    const { data: statsData, isLoading: isStatsLoading } = useExpenseStats()
    const stats = statsData?.data
    const { data: breakdownData, isLoading: isBreakdownLoading } = useExpenseBreakdown(
        breakdownStartDate || undefined,
        breakdownEndDate || undefined,
        deferredVendorSearch
    )
    const breakdown = breakdownData?.data
    const categoryBreakdown = breakdown?.categoryBreakdown ?? []
    const vendorBreakdown = breakdown?.vendorBreakdown ?? []
    const breakdownTotalAmount = breakdown?.totalAmount ?? 0
    const categoryPreview = categoryBreakdown.slice(0, BREAKDOWN_PREVIEW_LIMIT)
    const vendorPreview = vendorBreakdown.slice(0, BREAKDOWN_PREVIEW_LIMIT)
    const categoryOthers = categoryBreakdown.slice(BREAKDOWN_PREVIEW_LIMIT).reduce(
        (acc, item) => ({ amount: acc.amount + item.amount, count: acc.count + item.count }),
        { amount: 0, count: 0 }
    )
    const vendorOthers = vendorBreakdown.slice(BREAKDOWN_PREVIEW_LIMIT).reduce(
        (acc, item) => ({ amount: acc.amount + item.amount, count: acc.count + item.count }),
        { amount: 0, count: 0 }
    )
    const breakdownDrawerItems = breakdownDrawerType === "category" ? categoryBreakdown : vendorBreakdown
    const shouldUseFullHistoryRange = (stats?.totalRecords ?? 0) > 0 && (stats?.totalRecords ?? 0) < 200

    const filterGroups = [
        {
            title: "Category",
            options: EXPENSE_CATEGORIES.map((c) => ({ label: c.label, value: c.value })),
        },
    ]

    React.useEffect(() => {
        setCurrentPage(1)
    }, [deferredSearch, selectedCategory, breakdownStartDate, breakdownEndDate])

    React.useEffect(() => {
        if (!meta?.currentPage) return
        if (meta.currentPage !== currentPage) {
            setCurrentPage(meta.currentPage)
        }
    }, [meta?.currentPage, currentPage])

    React.useEffect(() => {
        if (!stats || hasAutoRangeInitialized) return

        if (shouldUseFullHistoryRange && stats.firstExpenseDate) {
            setBreakdownStartDate(stats.firstExpenseDate)
            setBreakdownEndDate(defaultEndDate)
        } else {
            setBreakdownStartDate(defaultStartDate)
            setBreakdownEndDate(defaultEndDate)
        }

        setHasAutoRangeInitialized(true)
    }, [
        stats,
        shouldUseFullHistoryRange,
        hasAutoRangeInitialized,
        defaultEndDate,
        defaultStartDate,
    ])

    const handleAdd = async (data: any) => {
        await createExpense(data)
        setIsAddOpen(false)
    }

    const handleUpdate = async (data: any) => {
        if (!editingItem) return
        await updateExpense({ id: editingItem.id, data })
        setEditingItem(null)
    }

    const handleDelete = async () => {
        if (!itemToDelete) return
        await deleteExpense(itemToDelete.id)
        setConfirmDeleteOpen(false)
        setItemToDelete(null)
        setEditingItem(null)
    }

    const renderActions = (item: Expense) => (
        <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-brand-deep/5 dark:hover:bg-white/5 rounded-full">
                        <HugeiconsIcon icon={MoreHorizontal} className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2 border-brand-deep/5 dark:border-white/5 shadow-2xl">
                    <DropdownMenuItem
                        onClick={() => setEditingItem(item)}
                        className="rounded-xl flex items-center gap-3 cursor-pointer dark:text-brand-cream dark:focus:bg-white/5"
                    >
                        <div className="h-8 w-8 rounded-full bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center text-brand-accent dark:text-brand-cream">
                            <HugeiconsIcon icon={Pencil} className="w-4 h-4" />
                        </div>
                        <span className="font-medium">Edit</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        disabled={isDeleting}
                        onClick={() => {
                            setItemToDelete(item)
                            setConfirmDeleteOpen(true)
                        }}
                        className="rounded-xl flex items-center gap-3 cursor-pointer text-rose-500 dark:text-rose-400 dark:focus:bg-white/5"
                    >
                        <div className="h-8 w-8 rounded-full bg-rose-500/10 flex items-center justify-center">
                            <HugeiconsIcon icon={Trash2} className="w-4 h-4" />
                        </div>
                        <span className="font-medium">Delete</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )

    const columns: Column<Expense>[] = [
        {
            key: "description",
            header: "Description",
            render: (_value, item) => (
                <span className="font-medium text-brand-deep dark:text-brand-cream">
                    {item.description || "No description"}
                </span>
            ),
        },
        {
            key: "category",
            header: "Category",
            render: (_value, item) => {
                const config = getCategoryConfig(item.category)
                return (
                    <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border", config.color)}>
                        {config.label}
                    </span>
                )
            },
        },
        {
            key: "amount",
            header: "Amount",
            render: (_value, item) => (
                <span className="font-serif font-medium text-brand-deep dark:text-brand-cream">
                    <CurrencyText value={formatCurrency(item.amount, { currency: currencyCode })} />
                </span>
            ),
        },
        {
            key: "date",
            header: "Date",
            render: (_value, item) => (
                <span className="text-brand-accent/60 dark:text-brand-cream/60">
                    {formatDate(item.date, "MMM d, yyyy")}
                </span>
            ),
        },
        {
            key: "actions" as any,
            header: "",
            render: (_value, item) => renderActions(item),
        },
    ]

    const isFormPending = isCreating || isUpdating
    const totalPages = meta?.totalPages ?? 1
    const canPrev = currentPage > 1
    const canNext = currentPage < totalPages

    if (error) {
        return (
            <PageTransition>
                <div className="max-w-6xl mx-auto space-y-8 pb-24">
                    <ManagementHeader
                        title={pageCopy.expenses.title}
                        description={pageCopy.expenses.descriptionShort}
                    />
                    <GlassCard className="p-8 text-center">
                        <p className="text-brand-deep dark:text-brand-cream mb-4">
                            {(error as Error).message}
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => window.location.reload()}
                            className="rounded-2xl dark:border-white/5 dark:text-brand-cream hover:dark:bg-white/5"
                        >
                            Retry
                        </Button>
                    </GlassCard>
                </div>
            </PageTransition>
        )
    }

    return (
        <PageTransition>
            <div className="max-w-6xl mx-auto space-y-8 pb-24">
                <ManagementHeader
                    title={pageCopy.expenses.title}
                    description={pageCopy.expenses.descriptionLong}
                    addButtonLabel="Record Expense"
                    onAddClick={() => setIsAddOpen(true)}
                />

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <GlassCard className="p-5 flex items-center gap-4 relative overflow-hidden group rounded-3xl before:rounded-3xl">
                        <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                            <HugeiconsIcon icon={Banknote} className="w-24 h-24" />
                        </div>
                        <div className="h-12 w-12 rounded-full bg-brand-green/10 dark:bg-brand-green/20 flex items-center justify-center text-brand-deep dark:text-brand-cream">
                            <HugeiconsIcon icon={Banknote} className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-brand-accent/40 dark:text-brand-cream/60 uppercase tracking-widest">
                                This Month
                            </p>
                            {isStatsLoading ? (
                                <Skeleton className="h-8 w-20 mt-1" />
                            ) : (
                                <p className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream">
                                    <CurrencyText value={formatCurrency(stats?.totalThisMonth ?? 0, { currency: currencyCode })} />
                                </p>
                            )}
                        </div>
                    </GlassCard>

                    <GlassCard className="p-5 flex items-center gap-4 relative overflow-hidden group rounded-3xl before:rounded-3xl">
                        <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                            <HugeiconsIcon icon={TrendingDown} className="w-24 h-24" />
                        </div>
                        <div className="h-12 w-12 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                            <HugeiconsIcon icon={TrendingDown} className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-brand-gold/60 dark:text-brand-gold/80 uppercase tracking-widest">
                                Today
                            </p>
                            {isStatsLoading ? (
                                <Skeleton className="h-8 w-16 mt-1" />
                            ) : (
                                <p className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-gold">
                                    <CurrencyText value={formatCurrency(stats?.todaySpending ?? 0, { currency: currencyCode })} />
                                </p>
                            )}
                        </div>
                    </GlassCard>

                    <GlassCard className="p-5 flex items-center gap-4 relative overflow-hidden group rounded-3xl before:rounded-3xl">
                        <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                            <HugeiconsIcon icon={Calculator} className="w-24 h-24" />
                        </div>
                        <div className="h-12 w-12 rounded-full bg-brand-accent/10 flex items-center justify-center text-brand-accent">
                            <HugeiconsIcon icon={Calculator} className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-brand-accent/40 dark:text-brand-cream/40 uppercase tracking-widest">
                                Avg Daily
                            </p>
                            {isStatsLoading ? (
                                <Skeleton className="h-8 w-16 mt-1" />
                            ) : (
                                <p className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream">
                                    <CurrencyText value={formatCurrency(stats?.avgDaily ?? 0, { currency: currencyCode })} />
                                </p>
                            )}
                        </div>
                    </GlassCard>

                    <GlassCard className="p-5 flex items-center gap-4 relative overflow-hidden group rounded-3xl before:rounded-3xl">
                        <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                            <HugeiconsIcon icon={Banknote} className="w-24 h-24" />
                        </div>
                        <div className="h-12 w-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                            <HugeiconsIcon icon={Banknote} className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-indigo-500/60 uppercase tracking-widest">
                                Overall Total
                            </p>
                            {isStatsLoading ? (
                                <Skeleton className="h-8 w-16 mt-1" />
                            ) : (
                                <p className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream">
                                    <CurrencyText value={formatCurrency(stats?.overallTotalExpenses ?? 0, { currency: currencyCode })} />
                                </p>
                            )}
                        </div>
                    </GlassCard>
                </div>

                <div className="space-y-6">
                    <GlassCard className="p-5 sm:p-6 space-y-5 rounded-3xl before:rounded-3xl">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-accent/40 dark:text-brand-cream/40">
                                    Expense Insights
                                </p>
                                <p className="text-sm text-brand-accent/60 dark:text-brand-cream/60 mt-1">
                                    Breakdown by category and vendor/description for a selected period.
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setBreakdownStartDate(defaultStartDate)
                                    setBreakdownEndDate(defaultEndDate)
                                    setVendorSearch("")
                                }}
                                className="rounded-xl w-full sm:w-auto dark:border-white/5 dark:text-brand-cream hover:dark:bg-white/5"
                            >
                                Reset Period
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className={cn(
                                            "h-12 rounded-2xl justify-start text-left font-normal bg-white dark:bg-white/5 border-brand-deep/5 dark:border-white/10 text-brand-deep dark:text-brand-cream px-4",
                                            !startDateValue && "text-brand-accent/40 dark:text-brand-cream/40"
                                        )}
                                    >
                                        <HugeiconsIcon icon={CalendarIcon} className="mr-2 h-4 w-4 opacity-40" />
                                        {startDateValue ? formatDate(startDateValue, "MMM d, yyyy") : "Start date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={startDateValue}
                                        onSelect={(date) => {
                                            if (!date) return
                                            const nextStart = toDateInput(date)
                                            setBreakdownStartDate(nextStart)
                                            if (breakdownEndDate && breakdownEndDate < nextStart) {
                                                setBreakdownEndDate(nextStart)
                                            }
                                        }}
                                        disabled={endDateValue ? { after: endDateValue } : undefined}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className={cn(
                                            "h-12 rounded-2xl justify-start text-left font-normal bg-white dark:bg-white/5 border-brand-deep/5 dark:border-white/10 text-brand-deep dark:text-brand-cream px-4",
                                            !endDateValue && "text-brand-accent/40 dark:text-brand-cream/40"
                                        )}
                                    >
                                        <HugeiconsIcon icon={CalendarIcon} className="mr-2 h-4 w-4 opacity-40" />
                                        {endDateValue ? formatDate(endDateValue, "MMM d, yyyy") : "End date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={endDateValue}
                                        onSelect={(date) => {
                                            if (!date) return
                                            const nextEnd = toDateInput(date)
                                            setBreakdownEndDate(nextEnd)
                                            if (breakdownStartDate && breakdownStartDate > nextEnd) {
                                                setBreakdownStartDate(nextEnd)
                                            }
                                        }}
                                        disabled={startDateValue ? { before: startDateValue } : undefined}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>

                            <input
                                type="text"
                                value={vendorSearch}
                                onChange={(e) => setVendorSearch(e.target.value)}
                                placeholder="Filter vendor/description..."
                                className="h-12 rounded-2xl border border-brand-deep/5 dark:border-white/10 bg-white dark:bg-white/5 px-4 text-sm text-brand-deep dark:text-brand-cream placeholder:text-brand-accent/40 dark:placeholder:text-brand-cream/40 focus:outline-none focus:ring-2 focus:ring-brand-green/20"
                            />
                        </div>

                        {isBreakdownLoading ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <Skeleton className="h-44 rounded-2xl" />
                                <Skeleton className="h-44 rounded-2xl" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div className="rounded-2xl border border-brand-deep/5 dark:border-white/5 p-4 bg-white/70 dark:bg-white/5">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40">
                                            Category Breakdown
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs text-brand-accent/60 dark:text-brand-cream/60">
                                                {breakdown?.totalCount ?? 0} records
                                            </p>
                                            {categoryBreakdown.length > BREAKDOWN_PREVIEW_LIMIT && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setBreakdownDrawerType("category")
                                                        setIsBreakdownDrawerOpen(true)
                                                    }}
                                                    className="h-7 px-2 rounded-lg text-[10px] text-brand-accent/70 dark:text-brand-cream/70"
                                                >
                                                    View all
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {categoryBreakdown.length === 0 ? (
                                            <p className="text-sm text-brand-accent/60 dark:text-brand-cream/60">No category data for this period.</p>
                                        ) : (
                                            categoryPreview.map((item) => {
                                                const category = getCategoryConfig(item.key)
                                                const percent = breakdownTotalAmount > 0 ? Math.round((item.amount / breakdownTotalAmount) * 100) : 0
                                                return (
                                                    <div key={item.key} className="flex items-center gap-3">
                                                        <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-semibold border shrink-0", category.color)}>
                                                            {category.label}
                                                        </span>
                                                        <div className="h-2 flex-1 rounded-full bg-brand-deep/5 dark:bg-white/10 overflow-hidden">
                                                            <div className="h-full bg-brand-gold-700" style={{ width: `${Math.min(percent, 100)}%` }} />
                                                        </div>
                                                        <span className="text-xs text-brand-deep dark:text-brand-cream min-w-[96px] text-right">
                                                            <CurrencyText value={formatCurrency(item.amount, { currency: currencyCode, notation: "compact" })} />
                                                        </span>
                                                    </div>
                                                )
                                            })
                                        )}
                                        {categoryOthers.count > 0 && (
                                            <div className="flex items-center gap-3">
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold border shrink-0 bg-brand-deep/5 dark:bg-white/10 text-brand-accent/70 dark:text-brand-cream/70 border-brand-deep/10 dark:border-white/10">
                                                    Others ({categoryBreakdown.length - BREAKDOWN_PREVIEW_LIMIT})
                                                </span>
                                                <div className="h-2 flex-1 rounded-full bg-brand-deep/5 dark:bg-white/10 overflow-hidden">
                                                    <div
                                                        className="h-full bg-brand-accent/35 dark:bg-brand-cream/35"
                                                        style={{
                                                            width: `${Math.min(
                                                                100,
                                                                breakdownTotalAmount > 0
                                                                    ? Math.round((categoryOthers.amount / breakdownTotalAmount) * 100)
                                                                    : 0
                                                            )}%`,
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-xs text-brand-deep dark:text-brand-cream min-w-[96px] text-right">
                                                    <CurrencyText value={formatCurrency(categoryOthers.amount, { currency: currencyCode, notation: "compact" })} />
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-brand-deep/5 dark:border-white/5 p-4 bg-white/70 dark:bg-white/5">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40">
                                            Vendor / Description
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs text-brand-accent/60 dark:text-brand-cream/60">
                                                Top spenders
                                            </p>
                                            {vendorBreakdown.length > BREAKDOWN_PREVIEW_LIMIT && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setBreakdownDrawerType("vendor")
                                                        setIsBreakdownDrawerOpen(true)
                                                    }}
                                                    className="h-7 px-2 rounded-lg text-[10px] text-brand-accent/70 dark:text-brand-cream/70"
                                                >
                                                    View all
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {vendorBreakdown.length === 0 ? (
                                            <p className="text-sm text-brand-accent/60 dark:text-brand-cream/60">No vendor/description data for this period.</p>
                                        ) : (
                                            vendorPreview.map((item) => {
                                                const percent = breakdownTotalAmount > 0 ? Math.round((item.amount / breakdownTotalAmount) * 100) : 0
                                                return (
                                                    <div key={item.key} className="flex items-center gap-3">
                                                        <span className="text-xs text-brand-deep dark:text-brand-cream truncate flex-1" title={item.key}>
                                                            {item.key}
                                                        </span>
                                                        <span className="text-[10px] text-brand-accent/60 dark:text-brand-cream/60 w-10 text-right">
                                                            {percent}%
                                                        </span>
                                                        <span className="text-xs text-brand-deep dark:text-brand-cream min-w-[96px] text-right">
                                                            <CurrencyText value={formatCurrency(item.amount, { currency: currencyCode, notation: "compact" })} />
                                                        </span>
                                                    </div>
                                                )
                                            })
                                        )}
                                        {vendorOthers.count > 0 && (
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-brand-accent/70 dark:text-brand-cream/70 truncate flex-1">
                                                    Others ({vendorBreakdown.length - BREAKDOWN_PREVIEW_LIMIT})
                                                </span>
                                                <span className="text-[10px] text-brand-accent/60 dark:text-brand-cream/60 w-10 text-right">
                                                    {breakdownTotalAmount > 0 ? Math.round((vendorOthers.amount / breakdownTotalAmount) * 100) : 0}%
                                                </span>
                                                <span className="text-xs text-brand-deep dark:text-brand-cream min-w-[96px] text-right">
                                                    <CurrencyText value={formatCurrency(vendorOthers.amount, { currency: currencyCode, notation: "compact" })} />
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </GlassCard>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-accent/40 dark:text-brand-cream/40 ml-1">
                            Expense Records
                        </p>
                        <div className="flex items-center gap-3 font-sans w-full md:w-auto">
                            <TableSearch
                                value={search}
                                onChange={setSearch}
                                placeholder="Search expenses..."
                                className="flex-1 min-w-0 w-full"
                            />
                            <div className="shrink-0">
                                <FilterPopover
                                    groups={filterGroups}
                                    selectedValues={selectedFilters}
                                    onSelectionChange={(values) => {
                                        const latest = values[values.length - 1]
                                        setSelectedFilters(latest ? [latest] : [])
                                    }}
                                    onClear={() => setSelectedFilters([])}
                                />
                            </div>
                        </div>
                    </div>
                    {(deferredSearch || selectedCategory) && (
                        <div className="flex justify-end">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSearch("")
                                    setSelectedFilters([])
                                }}
                                className="h-8 rounded-xl text-brand-accent/70 dark:text-brand-cream/70"
                            >
                                Clear search & filters
                            </Button>
                        </div>
                    )}
                </div>

                {isPending && !expenses.length ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                        ))}
                    </div>
                ) : expenses.length === 0 ? (
                    <GlassCard className="p-12 text-center">
                        <div className="flex flex-col items-center space-y-4">
                            <div className="w-20 h-20 rounded-3xl bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center">
                                <HugeiconsIcon icon={Banknote} className="w-10 h-10 text-brand-accent/30 dark:text-brand-cream/30" />
                            </div>
                            <h3 className="text-xl font-serif font-medium text-brand-deep dark:text-brand-cream">
                                No Expense Records
                            </h3>
                            <p className="text-sm text-brand-accent/60 dark:text-brand-cream/60 max-w-[300px]">
                                {deferredSearch || selectedFilters.length > 0
                                    ? "No expenses match your search or filters."
                                    : "Record an expense to track your business spending."}
                            </p>
                            {(deferredSearch || selectedFilters.length > 0) && (
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSearch("")
                                        setSelectedFilters([])
                                    }}
                                    className="rounded-2xl dark:border-white/5 dark:text-brand-cream hover:dark:bg-white/5"
                                >
                                    Clear filters
                                </Button>
                            )}
                            {!deferredSearch && selectedFilters.length === 0 && (
                                <Button
                                    onClick={() => setIsAddOpen(true)}
                                    className="rounded-2xl bg-brand-deep text-brand-gold dark:bg-brand-gold-700 dark:text-white hover:bg-brand-deep/90 dark:hover:bg-brand-gold-800 font-semibold"
                                >
                                    <HugeiconsIcon icon={Banknote} className="w-4 h-4 mr-2" />
                                    Record Expense
                                </Button>
                            )}
                        </div>
                    </GlassCard>
                ) : isMobile ? (
                    <div className="space-y-3">
                        {expenses.map((expense, index) => {
                            const config = getCategoryConfig(expense.category)
                            return (
                                <ListCard
                                    key={expense.id}
                                    title={expense.description || "No description"}
                                    subtitle={config.label}
                                    meta={formatDate(expense.date, "MMM d, yyyy")}
                                    icon={Receipt}
                                    iconClassName="text-brand-deep/40 dark:text-brand-cream/40"
                                    value={<CurrencyText value={formatCurrency(expense.amount, { currency: currencyCode })} />}
                                    valueLabel="Amount"
                                    delay={index * 0.05}
                                    actions={renderActions(expense)}
                                    onClick={() => setEditingItem(expense)}
                                />
                            )
                        })}
                    </div>
                ) : (
                    <GlassCard className="overflow-hidden border-brand-deep/5 dark:border-white/5">
                        <DataTable
                            columns={columns}
                            data={expenses}
                            emptyMessage="No expenses found"
                        />
                    </GlassCard>
                )}

                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!canPrev || isPending}
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            className="rounded-xl dark:border-white/5 dark:text-brand-cream hover:dark:bg-white/5"
                        >
                            <HugeiconsIcon icon={ChevronLeft} className="w-4 h-4" />
                            Previous
                        </Button>
                        <span className="text-sm text-brand-accent/60 dark:text-brand-cream/60">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!canNext || isPending}
                            onClick={() => setCurrentPage((p) => p + 1)}
                            className="rounded-xl dark:border-white/5 dark:text-brand-cream hover:dark:bg-white/5"
                        >
                            Next
                            <HugeiconsIcon icon={ChevronRight} className="w-4 h-4" />
                        </Button>
                    </div>
                )}

                <ExpenseFormDrawer
                    open={isAddOpen || !!editingItem}
                    onOpenChange={(open) => {
                        if (!open) {
                            setIsAddOpen(false)
                            setEditingItem(null)
                        }
                    }}
                    editingExpense={editingItem}
                    onSubmit={editingItem ? handleUpdate : handleAdd}
                    onDelete={editingItem ? () => {
                        setItemToDelete(editingItem)
                        setConfirmDeleteOpen(true)
                    } : undefined}
                    isSubmitting={isFormPending}
                    isDeleting={isDeleting}
                />

                <ConfirmDialog
                    open={confirmDeleteOpen}
                    onOpenChange={setConfirmDeleteOpen}
                    onConfirm={handleDelete}
                    title="Delete Expense"
                    description={`Are you sure you want to delete this expense? This action cannot be undone.`}
                    confirmText="Delete Expense"
                    variant="destructive"
                    isLoading={isDeleting}
                />

                <Drawer open={isBreakdownDrawerOpen} onOpenChange={setIsBreakdownDrawerOpen}>
                    <DrawerContent>
                        <DrawerStickyHeader>
                            <DrawerTitle>
                                {breakdownDrawerType === "category" ? "All Categories" : "All Vendors / Descriptions"}
                            </DrawerTitle>
                            <DrawerDescription>
                                {breakdownDrawerItems.length} items in this period
                            </DrawerDescription>
                        </DrawerStickyHeader>
                        <DrawerBody>
                            <div className="max-w-2xl mx-auto w-full space-y-2">
                                {breakdownDrawerItems.map((item) => {
                                    const percent = breakdownTotalAmount > 0 ? Math.round((item.amount / breakdownTotalAmount) * 100) : 0
                                    return (
                                        <div key={`${breakdownDrawerType}-${item.key}`} className="rounded-2xl border border-brand-deep/5 dark:border-white/5 p-3 bg-white/70 dark:bg-white/5 flex items-center gap-3">
                                            {breakdownDrawerType === "category" ? (
                                                <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-semibold border shrink-0", getCategoryConfig(item.key).color)}>
                                                    {getCategoryConfig(item.key).label}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-brand-deep dark:text-brand-cream truncate flex-1" title={item.key}>
                                                    {item.key}
                                                </span>
                                            )}
                                            {breakdownDrawerType === "category" && (
                                                <span className="text-sm text-brand-deep dark:text-brand-cream truncate flex-1" title={item.key}>
                                                    {item.key}
                                                </span>
                                            )}
                                            <span className="text-[10px] text-brand-accent/60 dark:text-brand-cream/60 w-10 text-right">
                                                {percent}%
                                            </span>
                                            <span className="text-xs text-brand-deep dark:text-brand-cream min-w-[110px] text-right">
                                                <CurrencyText value={formatCurrency(item.amount, { currency: currencyCode, notation: "compact" })} />
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </DrawerBody>
                        <DrawerFooter>
                            <DrawerClose asChild>
                                <Button className="h-12 rounded-xl font-semibold">Done</Button>
                            </DrawerClose>
                        </DrawerFooter>
                    </DrawerContent>
                </Drawer>
            </div>
        </PageTransition>
    )
}
