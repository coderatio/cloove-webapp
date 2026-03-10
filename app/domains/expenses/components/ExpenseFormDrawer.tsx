"use client"

import * as React from "react"
import { Loader2, Trash2, CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/app/components/ui/button"
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerClose,
    DrawerBody,
    DrawerFooter,
} from "@/app/components/ui/drawer"
import { MoneyInput } from "@/app/components/ui/money-input"
import { SearchableSelect } from "@/app/components/ui/searchable-select"
import { Calendar } from "@/app/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/app/components/ui/popover"
import { useBusiness } from "@/app/components/BusinessProvider"
import { cn } from "@/app/lib/utils"
import { EXPENSE_CATEGORIES } from "../utils/categoryColors"
import type { Expense, CreateExpensePayload } from "../hooks/useExpenses"

interface ExpenseFormDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    editingExpense: Expense | null
    onSubmit: (data: CreateExpensePayload) => Promise<void>
    onDelete?: () => void
    isSubmitting: boolean
    isDeleting?: boolean
}

export function ExpenseFormDrawer({
    open,
    onOpenChange,
    editingExpense,
    onSubmit,
    onDelete,
    isSubmitting,
    isDeleting,
}: ExpenseFormDrawerProps) {
    const { activeBusiness } = useBusiness()
    const currencySymbol = activeBusiness?.currency === "USD" ? "$" : activeBusiness?.currency === "GHS" ? "GH₵" : "₦"

    const [amount, setAmount] = React.useState(0)
    const [category, setCategory] = React.useState("OTHER")
    const [description, setDescription] = React.useState("")
    const [date, setDate] = React.useState<Date | undefined>(new Date())

    React.useEffect(() => {
        if (editingExpense) {
            setAmount(editingExpense.amount)
            setCategory(editingExpense.category)
            setDescription(editingExpense.description)
            setDate(editingExpense.date ? new Date(editingExpense.date) : new Date())
        } else {
            setAmount(0)
            setCategory("OTHER")
            setDescription("")
            setDate(new Date())
        }
    }, [editingExpense, open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await onSubmit({
            amount,
            category,
            description: description.trim() || undefined,
            date: date ? format(date, "yyyy-MM-dd") : undefined,
        })
    }

    const categoryOptions = React.useMemo(
        () => EXPENSE_CATEGORIES.map((cat) => ({ label: cat.label, value: cat.value })),
        []
    )

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent>
                <DrawerStickyHeader>
                    <DrawerTitle>
                        {editingExpense ? "Edit Expense" : "Record Expense"}
                    </DrawerTitle>
                    <DrawerDescription>
                        {editingExpense
                            ? "Update expense details."
                            : "Record a new business expense."}
                    </DrawerDescription>
                </DrawerStickyHeader>

                <DrawerBody>
                    <form id="expense-form" onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-6">
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1 block">
                                Amount
                            </label>
                            <MoneyInput
                                autoFocus
                                value={amount}
                                onChange={setAmount}
                                currencySymbol={currencySymbol}
                                placeholder="0.00"
                                className="h-14 rounded-2xl"
                                required
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1 block">
                                Category
                            </label>
                            <SearchableSelect
                                options={categoryOptions}
                                value={category}
                                onChange={setCategory}
                                placeholder="Select category..."
                                searchPlaceholder="Search categories..."
                                triggerClassName="w-full h-14 rounded-2xl bg-white dark:bg-white/5 border-brand-deep/5 dark:border-white/10 text-brand-deep dark:text-brand-cream px-6"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1 block">
                                Description
                            </label>
                            <input
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="e.g. Monthly office rent"
                                className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/20 text-brand-deep dark:text-brand-cream"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1 block">
                                Date
                            </label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className={cn(
                                            "w-full h-14 rounded-2xl justify-start text-left font-normal bg-white dark:bg-white/5 border-brand-deep/5 dark:border-white/10 text-brand-deep dark:text-brand-cream px-6",
                                            !date && "text-brand-accent/40 dark:text-brand-cream/40"
                                        )}
                                    >
                                        <CalendarIcon className="mr-3 h-4 w-4 opacity-40" />
                                        {date ? format(date, "MMM d, yyyy") : "Select date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {editingExpense && onDelete && (
                            <div className="pt-6 border-t border-brand-deep/5 dark:border-white/5 mt-6">
                                <button
                                    type="button"
                                    disabled={isDeleting}
                                    onClick={onDelete}
                                    className="flex items-center justify-center gap-2 w-full py-4 text-xs font-bold text-rose-500/60 hover:text-rose-500 transition-all uppercase tracking-widest disabled:opacity-50"
                                >
                                    {isDeleting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                    Delete Expense
                                </button>
                            </div>
                        )}
                    </form>
                </DrawerBody>

                <DrawerFooter>
                    <div className="flex gap-4 max-w-lg mx-auto w-full">
                        <DrawerClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1 rounded-2xl h-14 border-brand-deep/5 dark:border-white/5 dark:text-brand-cream"
                            >
                                Cancel
                            </Button>
                        </DrawerClose>
                        <Button
                            type="submit"
                            form="expense-form"
                            disabled={isSubmitting}
                            className="flex-1 rounded-2xl h-14 bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold shadow-xl"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : editingExpense ? (
                                "Save Changes"
                            ) : (
                                "Record Expense"
                            )}
                        </Button>
                    </div>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}
