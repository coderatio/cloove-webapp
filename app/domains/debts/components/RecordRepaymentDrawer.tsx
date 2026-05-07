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
import { CurrencyText } from "@/app/components/shared/CurrencyText"
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
                            <div className="space-y-2 rounded-2xl border border-border bg-muted/30 p-4">
                                <p className="text-sm font-medium text-foreground">
                                    {debt.customerName}
                                </p>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">Outstanding Balance</span>
                                    <span className="font-medium text-rose-500">
                                        <CurrencyText value={formatCurrency(debt.remainingAmount, { currency: currencyCode })} />
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <label className="ml-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
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
                            <p className="ml-1 text-xs text-muted-foreground">
                                Maximum: <CurrencyText value={formatCurrency(maxAmount, { currency: currencyCode })} />
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
                                className="h-14 flex-1 rounded-2xl"
                            >
                                Cancel
                            </Button>
                        </DrawerClose>
                        <Button
                            type="submit"
                            form="record-repayment-form"
                            disabled={isSubmitting || amount <= 0}
                            className="h-14 flex-1 rounded-2xl font-semibold shadow-sm"
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
