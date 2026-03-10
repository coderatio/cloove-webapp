"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
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
import { useBusiness } from "@/app/components/BusinessProvider"
import { formatCurrency } from "@/app/lib/formatters"
import type { Debt } from "../hooks/useDebts"

interface RecordRepaymentDrawerProps {
    debt: Debt | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (amount: number) => Promise<void>
    isSubmitting: boolean
}

export function RecordRepaymentDrawer({
    debt,
    open,
    onOpenChange,
    onSubmit,
    isSubmitting,
}: RecordRepaymentDrawerProps) {
    const { activeBusiness } = useBusiness()
    const currencyCode = activeBusiness?.currency ?? "NGN"
    const currencySymbol = activeBusiness?.currency === "USD" ? "$" : activeBusiness?.currency === "GHS" ? "GH₵" : "₦"
    const [amount, setAmount] = React.useState(0)

    React.useEffect(() => {
        if (open && debt) {
            setAmount(debt.remainingAmount)
        }
    }, [open, debt])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await onSubmit(amount)
    }

    const maxAmount = debt?.remainingAmount ?? 0

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent>
                <DrawerStickyHeader>
                    <DrawerTitle>Record Payment</DrawerTitle>
                    <DrawerDescription>
                        Record a repayment from {debt?.customerName ?? "this customer"}.
                    </DrawerDescription>
                </DrawerStickyHeader>

                <DrawerBody>
                    <form id="record-repayment-form" onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-6">
                        {debt && (
                            <div className="p-4 rounded-2xl bg-brand-deep/2 dark:bg-white/5 border border-brand-deep/5 dark:border-white/5 space-y-2">
                                <p className="text-sm font-medium text-brand-deep dark:text-brand-cream">
                                    {debt.customerName}
                                </p>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-brand-accent/40 dark:text-brand-cream/40">Outstanding Balance</span>
                                    <span className="font-serif font-medium text-rose-500">
                                        {formatCurrency(debt.remainingAmount, { currency: currencyCode })}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1 block">
                                Payment Amount
                            </label>
                            <MoneyInput
                                autoFocus
                                value={amount}
                                onChange={setAmount}
                                currencySymbol={currencySymbol}
                                placeholder="0.00"
                                max={maxAmount}
                                className="h-14 rounded-2xl"
                                required
                            />
                            <p className="text-xs text-brand-accent/40 dark:text-brand-cream/40 ml-1">
                                Maximum: {formatCurrency(maxAmount, { currency: currencyCode })}
                            </p>
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
                            form="record-repayment-form"
                            disabled={isSubmitting || amount <= 0}
                            className="flex-1 rounded-2xl h-14 bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold shadow-xl"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                "Record Payment"
                            )}
                        </Button>
                    </div>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}
