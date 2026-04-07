"use client"

import * as React from "react"
import DataTable, { type Column } from "@/app/components/DataTable"
import { useIsMobile } from "@/app/hooks/useMediaQuery"
import { PageTransition } from "@/app/components/layout/page-transition"
import { ListCard } from "@/app/components/ui/list-card"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Banknote, TrendingDown, Calculator, Tag, Trash2, Loader2, ChevronLeft, ChevronRight, MoreHorizontal, Pencil, Receipt } from "lucide-react"
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
import { useExpenses, useExpenseStats, type Expense } from "../hooks/useExpenses"
import { ExpenseFormDrawer } from "./ExpenseFormDrawer"
import { EXPENSE_CATEGORIES, getCategoryConfig } from "../utils/categoryColors"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"

const PAGE_SIZE = 20

export function ExpensesView() {
    const isMobile = useIsMobile()
    const { activeBusiness } = useBusiness()
    const pageCopy = usePresetPageCopy()
    const currencyCode = activeBusiness?.currency ?? "NGN"
    const [search, setSearch] = React.useState("")
    const deferredSearch = React.useDeferredValue(search)
    const [currentPage, setCurrentPage] = React.useState(1)
    const [selectedFilters, setSelectedFilters] = React.useState<string[]>([])
    const [isAddOpen, setIsAddOpen] = React.useState(false)
    const [editingItem, setEditingItem] = React.useState<Expense | null>(null)
    const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false)
    const [itemToDelete, setItemToDelete] = React.useState<Expense | null>(null)

    const selectedCategory = selectedFilters.length === 1 ? selectedFilters[0] : undefined

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
    } = useExpenses(currentPage, PAGE_SIZE, deferredSearch, selectedCategory)

    const { data: statsData, isLoading: isStatsLoading } = useExpenseStats()
    const stats = statsData?.data

    const filterGroups = [
        {
            title: "Category",
            options: EXPENSE_CATEGORIES.map((c) => ({ label: c.label, value: c.value })),
        },
    ]

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
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2 border-brand-deep/5 dark:border-white/5 shadow-2xl">
                    <DropdownMenuItem
                        onClick={() => setEditingItem(item)}
                        className="rounded-xl flex items-center gap-3 cursor-pointer dark:text-brand-cream dark:focus:bg-white/5"
                    >
                        <div className="h-8 w-8 rounded-full bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center text-brand-accent dark:text-brand-cream">
                            <Pencil className="w-4 h-4" />
                        </div>
                        <span className="font-medium">Edit</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => {
                            setItemToDelete(item)
                            setConfirmDeleteOpen(true)
                        }}
                        className="rounded-xl flex items-center gap-3 cursor-pointer text-rose-500 dark:text-rose-400 dark:focus:bg-white/5"
                    >
                        <div className="h-8 w-8 rounded-full bg-rose-500/10 flex items-center justify-center">
                            <Trash2 className="w-4 h-4" />
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
                <div className="max-w-5xl mx-auto space-y-8 pb-24">
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
            <div className="max-w-5xl mx-auto space-y-8 pb-24">
                <ManagementHeader
                    title={pageCopy.expenses.title}
                    description={pageCopy.expenses.descriptionLong}
                    addButtonLabel="Record Expense"
                    onAddClick={() => setIsAddOpen(true)}
                />

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <GlassCard className="p-5 flex items-center gap-4 relative overflow-hidden group rounded-3xl before:rounded-3xl">
                        <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Banknote className="w-24 h-24" />
                        </div>
                        <div className="h-12 w-12 rounded-full bg-brand-green/10 dark:bg-brand-green/20 flex items-center justify-center text-brand-deep dark:text-brand-cream">
                            <Banknote className="h-6 w-6" />
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
                            <TrendingDown className="w-24 h-24" />
                        </div>
                        <div className="h-12 w-12 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                            <TrendingDown className="h-6 w-6" />
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
                            <Calculator className="w-24 h-24" />
                        </div>
                        <div className="h-12 w-12 rounded-full bg-brand-accent/10 flex items-center justify-center text-brand-accent">
                            <Calculator className="h-6 w-6" />
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
                            <Tag className="w-24 h-24" />
                        </div>
                        <div className="h-12 w-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                            <Tag className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-indigo-500/60 uppercase tracking-widest">
                                Top Category
                            </p>
                            {isStatsLoading ? (
                                <Skeleton className="h-8 w-16 mt-1" />
                            ) : (
                                <p className="text-lg font-serif font-medium text-brand-deep dark:text-brand-cream">
                                    {stats?.topCategory ? getCategoryConfig(stats.topCategory).label : "None"}
                                </p>
                            )}
                        </div>
                    </GlassCard>
                </div>

                <div className="space-y-6">
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
                                    onSelectionChange={setSelectedFilters}
                                    onClear={() => setSelectedFilters([])}
                                />
                            </div>
                        </div>
                    </div>
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
                                <Banknote className="w-10 h-10 text-brand-accent/30 dark:text-brand-cream/30" />
                            </div>
                            <h3 className="text-xl font-serif font-medium text-brand-deep dark:text-brand-cream">
                                No Expense Records
                            </h3>
                            <p className="text-sm text-brand-accent/60 dark:text-brand-cream/60 max-w-[300px]">
                                {deferredSearch || selectedFilters.length > 0
                                    ? "No expenses match your search or filters."
                                    : "Record an expense to track your business spending."}
                            </p>
                            {!deferredSearch && selectedFilters.length === 0 && (
                                <Button
                                    onClick={() => setIsAddOpen(true)}
                                    className="rounded-2xl bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep hover:bg-brand-deep/90 dark:hover:bg-brand-gold/90 font-semibold"
                                >
                                    <Banknote className="w-4 h-4 mr-2" />
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
                            <ChevronLeft className="w-4 h-4" />
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
                            <ChevronRight className="w-4 h-4" />
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
                />
            </div>
        </PageTransition>
    )
}
