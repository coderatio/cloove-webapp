"use client"

import * as React from "react"
import { Loader2, CalendarIcon } from "lucide-react"
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
import { useCustomers } from "@/app/domains/customers/hooks/useCustomers"
import type { CreateDebtPayload } from "../hooks/useDebts"

interface AddDebtDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (data: CreateDebtPayload) => Promise<void>
    isSubmitting: boolean
}

export function AddDebtDrawer({
    open,
    onOpenChange,
    onSubmit,
    isSubmitting,
}: AddDebtDrawerProps) {
    const { activeBusiness } = useBusiness()
    const currencySymbol = activeBusiness?.currency === "USD" ? "$" : activeBusiness?.currency === "GHS" ? "GH₵" : "₦"

    const { customers } = useCustomers(1, 50)

    const [customerId, setCustomerId] = React.useState("")
    const [amount, setAmount] = React.useState(0)
    const [dueAt, setDueAt] = React.useState<Date | undefined>(undefined)
    const [notes, setNotes] = React.useState("")

    React.useEffect(() => {
        if (open) {
            setCustomerId("")
            setAmount(0)
            setDueAt(undefined)
            setNotes("")
        }
    }, [open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await onSubmit({
            customerId,
            amount,
            dueAt: dueAt ? format(dueAt, "yyyy-MM-dd") : undefined,
            notes: notes.trim() || undefined,
        })
    }

    const customerOptions = React.useMemo(
        () =>
            customers.map((c) => ({
                label: c.name + (c.phoneNumber ? ` (${c.phoneNumber})` : ""),
                value: c.id,
            })),
        [customers]
    )

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent>
                <DrawerStickyHeader>
                    <DrawerTitle>Record Debt</DrawerTitle>
                    <DrawerDescription>
                        Record a new debt owed by a customer.
                    </DrawerDescription>
                </DrawerStickyHeader>

                <DrawerBody>
                    <form id="add-debt-form" onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-6">
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1 block">
                                Customer
                            </label>
                            <SearchableSelect
                                options={customerOptions}
                                value={customerId}
                                onChange={setCustomerId}
                                placeholder="Select customer..."
                                searchPlaceholder="Search customers..."
                                triggerClassName="w-full h-[54px] rounded-2xl bg-white dark:bg-white/5 border-brand-deep/5 dark:border-white/10 text-brand-deep dark:text-brand-cream"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1 block">
                                Amount Owed
                            </label>
                            <MoneyInput
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
                                Due Date
                            </label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className={cn(
                                            "w-full h-[54px] rounded-2xl justify-start text-left font-normal bg-white dark:bg-white/5 border-brand-deep/5 dark:border-white/10 text-brand-deep dark:text-brand-cream",
                                            !dueAt && "text-brand-accent/40 dark:text-brand-cream/40"
                                        )}
                                    >
                                        <CalendarIcon className="mr-3 h-4 w-4 opacity-40" />
                                        {dueAt ? format(dueAt, "MMM d, yyyy") : "Select due date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={dueAt}
                                        onSelect={setDueAt}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1 block">
                                Notes
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Any additional notes..."
                                rows={3}
                                className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/20 text-brand-deep dark:text-brand-cream resize-none"
                            />
                        </div>
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
                            form="add-debt-form"
                            disabled={isSubmitting || !customerId}
                            className="flex-1 rounded-2xl h-14 bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold shadow-xl"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                "Record Debt"
                            )}
                        </Button>
                    </div>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}
