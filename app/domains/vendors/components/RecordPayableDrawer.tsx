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
import { Calendar } from "@/app/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/app/components/ui/popover"
import { useBusiness } from "@/app/components/BusinessProvider"
import { cn } from "@/app/lib/utils"
import type { Vendor, CreatePayablePayload } from "../hooks/useVendors"

interface RecordPayableDrawerProps {
    vendor: Vendor | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (data: CreatePayablePayload) => Promise<void>
    isSubmitting: boolean
}

export function RecordPayableDrawer({
    vendor,
    open,
    onOpenChange,
    onSubmit,
    isSubmitting,
}: RecordPayableDrawerProps) {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const { currency } = useBusiness()

    const [amount, setAmount] = React.useState(0)
    const [description, setDescription] = React.useState("")
    const [dueAt, setDueAt] = React.useState<Date | undefined>(undefined)

    React.useEffect(() => {
        if (open) {
            setAmount(0)
            setDescription("")
            setDueAt(undefined)
            setTimeout(() => {
                inputRef.current?.focus()
            }, 100)
        }
    }, [open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await onSubmit({
            amount,
            description: description.trim() || undefined,
            dueAt: dueAt ? format(dueAt, "yyyy-MM-dd") : undefined,
        })
    }

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent>
                <DrawerStickyHeader>
                    <DrawerTitle>Record Payable</DrawerTitle>
                    <DrawerDescription>
                        Record a new amount owed to {vendor?.name ?? "this vendor"}.
                    </DrawerDescription>
                </DrawerStickyHeader>

                <DrawerBody>
                    <form id="payable-form" onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-6">
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1 block">
                                Amount
                            </label>
                            <MoneyInput
                                ref={inputRef}
                                value={amount}
                                onChange={setAmount}
                                currencySymbol={currency}
                                placeholder="0.00"
                                className="h-14 rounded-2xl"
                                required
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1 block">
                                Description
                            </label>
                            <input
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="e.g. Raw materials delivery"
                                className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/20 text-brand-deep dark:text-brand-cream"
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
                            form="payable-form"
                            disabled={isSubmitting}
                            className="flex-1 rounded-2xl h-14 bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold shadow-xl"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                "Record Payable"
                            )}
                        </Button>
                    </div>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}
