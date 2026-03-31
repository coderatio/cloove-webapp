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
import type { PayableApi } from "../hooks/useVendors"

interface PaySupplierDrawerProps {
    payable: PayableApi | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (amount: number) => Promise<void>
    isSubmitting: boolean
}

export function PaySupplierDrawer({
    payable,
    open,
    onOpenChange,
    onSubmit,
    isSubmitting,
}: PaySupplierDrawerProps) {
    const { activeBusiness } = useBusiness()
    const currencyCode = activeBusiness?.currency ?? "NGN"
    const currencySymbol = activeBusiness?.currency === "USD" ? "$" : activeBusiness?.currency === "GHS" ? "GH₵" : "₦"
    const [amount, setAmount] = React.useState(0)

    React.useEffect(() => {
        if (open && payable) {
            setAmount(payable.remainingAmount)
        }
    }, [open, payable])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await onSubmit(amount)
    }

    const maxAmount = payable?.remainingAmount ?? 0

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent>
                <DrawerStickyHeader>
                    <DrawerTitle>Pay Supplier</DrawerTitle>
                    <DrawerDescription>
                        Record a payment against this payable.
                    </DrawerDescription>
                </DrawerStickyHeader>

                <DrawerBody>
                    <form id="pay-supplier-form" onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-6">
                        {payable && (
                            <div className="p-4 rounded-2xl bg-brand-deep/2 dark:bg-white/5 border border-brand-deep/5 dark:border-white/5 space-y-2">
                                <p className="text-sm text-brand-accent/60 dark:text-brand-cream/60">
                                    {payable.description || "Payable"}
                                </p>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-brand-accent/40 dark:text-brand-cream/40">Outstanding</span>
                                    <span className="font-serif font-medium text-rose-500">
                                        <CurrencyText value={formatCurrency(payable.remainingAmount, { currency: currencyCode })} />
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
                                className="flex-1 rounded-2xl h-14 border-brand-deep/5 dark:border-white/5 dark:text-brand-cream"
                            >
                                Cancel
                            </Button>
                        </DrawerClose>
                        <Button
                            type="submit"
                            form="pay-supplier-form"
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
