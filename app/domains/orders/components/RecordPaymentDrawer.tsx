"use client"

import React, { useState, useEffect } from 'react'
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerClose
} from "@/app/components/ui/drawer"
import { Button } from '@/app/components/ui/button'
import { MoneyInput } from '@/app/components/ui/money-input'
import { Label } from '@/app/components/ui/label'
import { Order } from '../types'
import { formatCurrency } from '@/app/lib/formatters'
import { CurrencyText } from '@/app/components/shared/CurrencyText'
import { Check, Loader2, Wallet, Banknote, CreditCard, Receipt, CheckCircle2 } from 'lucide-react'
import { GlassCard } from '@/app/components/ui/glass-card'
import { cn } from '@/app/lib/utils'
import { useBusiness } from '@/app/components/BusinessProvider'
import { useLayoutPresetId } from "@/app/domains/workspace/hooks/usePresetPageCopy"

interface RecordPaymentDrawerProps {
    order: Order | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: (amount: number, method: string) => Promise<void>
    isSubmitting: boolean
}

export function RecordPaymentDrawer({
    order,
    open,
    onOpenChange,
    onSuccess,
    isSubmitting
}: RecordPaymentDrawerProps) {
    const { currency: currencySymbol } = useBusiness()
    const layoutPresetId = useLayoutPresetId()
    const [amount, setAmount] = useState<number>(0)
    const [method, setMethod] = useState<string>("CASH")
    const recordLabel = layoutPresetId === "school" ? "Fee Record" : "Order"

    const totalAmount = order ? Number(order.totalAmount) : 0
    const alreadyPaid = order ? Number(order.amountPaid) : 0
    const remainingBalance = totalAmount - alreadyPaid

    const newBalance = Math.max(0, remainingBalance - amount)

    useEffect(() => {
        if (open && order) {
            setAmount(remainingBalance)
            setMethod("CASH")
        }
    }, [open, order, remainingBalance])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (amount <= 0) return
        await onSuccess(amount, method)
        onOpenChange(false)
    }

    if (!order) return null

    const paymentMethods = [
        { value: 'CASH', label: 'Cash', icon: Banknote },
        { value: 'TRANSFER', label: 'Bank Transfer', icon: Wallet },
        { value: 'POS', label: 'POS Terminal', icon: CreditCard },
    ]

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent>
                <DrawerStickyHeader>
                    <DrawerTitle>Record Payment</DrawerTitle>
                    <DrawerDescription>
                        {`Record a partial or full payment for ${recordLabel} #${order.shortCode || order.id.substring(0, 6)}`}
                    </DrawerDescription>
                </DrawerStickyHeader>

                <div className="p-6 md:p-8 max-w-lg mx-auto w-full space-y-8 overflow-y-auto max-h-[70vh]">
                    {/* Summary Card */}
                    <GlassCard className="p-6 space-y-4 bg-brand-deep/5 dark:bg-white/5 border-none rounded-3xl before:rounded-3xl">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-brand-accent/60 dark:text-brand-cream/60">Total amount</span>
                            <span className="font-bold text-brand-deep dark:text-brand-cream">
                                <CurrencyText value={formatCurrency(totalAmount, { currency: order.currency || 'NGN' })} />
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-brand-accent/60 dark:text-brand-cream/60">Previously Paid</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                <CurrencyText value={formatCurrency(alreadyPaid, { currency: order.currency || 'NGN' })} />
                            </span>
                        </div>
                        <div className="pt-3 border-t border-brand-deep/5 dark:border-white/10 flex justify-between items-center">
                            <span className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40">Outstanding Balance</span>
                            <span className="text-xl font-bold text-brand-deep dark:text-brand-cream">
                                <CurrencyText value={formatCurrency(remainingBalance, { currency: order.currency || 'NGN' })} />
                            </span>
                        </div>
                    </GlassCard>

                    <form id="record-payment-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <Label className="block mb-3 text-[10px] font-bold uppercase tracking-widest text-brand-accent/60 dark:text-brand-cream/60">Payment Amount</Label>
                            <div className="relative">
                                <MoneyInput
                                    value={amount}
                                    onChange={setAmount}
                                    className="h-14 rounded-2xl text-lg font-bold bg-white dark:bg-[#021a12] border-brand-deep/10 focus:ring-brand-gold focus:border-brand-gold"
                                    placeholder="0.00"
                                    max={remainingBalance}
                                    currencySymbol={currencySymbol}
                                    required
                                />
                                {amount > 0 && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-brand-green/10 text-brand-green text-[10px] font-bold px-2 py-1 rounded-full z-10">
                                        -{((amount / remainingBalance) * 100).toFixed(0)}%
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="block mb-3 text-[10px] font-bold uppercase tracking-widest text-brand-accent/60 dark:text-brand-cream/60">Payment Method</Label>
                            <div className="grid grid-cols-3 gap-3">
                                {paymentMethods.map((m) => {
                                    const Icon = m.icon
                                    const isSelected = method === m.value
                                    return (
                                        <Button
                                            key={m.value}
                                            type="button"
                                            variant="ghost"
                                            onClick={() => setMethod(m.value)}
                                            className={cn(
                                                "flex flex-col items-center justify-center gap-2 p-4 h-auto rounded-2xl border transition-all duration-300 relative",
                                                isSelected
                                                    ? "bg-brand-gold/10 border-brand-gold text-brand-gold scale-105 shadow-lg"
                                                    : "bg-white dark:bg-[#021a12] border-brand-deep/5 dark:border-white/5 text-brand-accent/60 hover:border-brand-deep/20"
                                            )}
                                        >
                                            <Icon className="w-5 h-5" />
                                            <span className="text-[10px] font-bold uppercase">{m.label}</span>
                                            {isSelected && (
                                                <div className="absolute top-2 right-2">
                                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                </div>
                                            )}
                                        </Button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* New Balance Preview */}
                        <div className="p-4 rounded-2xl bg-brand-gold/5 border border-brand-gold/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                                    <Receipt className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-medium text-brand-accent/60">Remaining balance after payment</span>
                            </div>
                            <span className={cn(
                                "font-bold font-serif",
                                newBalance === 0 ? "text-brand-green" : "text-brand-deep dark:text-brand-cream"
                            )}>
                                <CurrencyText value={formatCurrency(newBalance, { currency: order.currency || 'NGN' })} />
                            </span>
                        </div>
                    </form>
                </div>

                <div className="p-6 md:p-8 pt-0 max-w-lg mx-auto w-full">
                    <Button
                        form="record-payment-form"
                        type="submit"
                        disabled={isSubmitting || amount <= 0}
                        className="w-full h-14 rounded-2xl bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        ) : (
                            <Check className="w-5 h-5 mr-2" />
                        )}
                        {amount >= remainingBalance ? "Record Full Payment" : "Record Partial Payment"}
                    </Button>
                    <DrawerClose asChild>
                        <Button variant="ghost" className="w-full mt-2 rounded-xl text-brand-accent/60">
                            Cancel
                        </Button>
                    </DrawerClose>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
