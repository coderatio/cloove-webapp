"use client"

import * as React from "react"
import { CheckCircle2, Clock, XCircle, ArrowDownRight, ArrowUpRight } from "lucide-react"
import { cn } from "@/app/lib/utils"
import { CurrencyDisplay } from "@/app/components/shared/CurrencyDisplay"
import { formatCurrency } from "@/app/lib/formatters"
import type { FinanceTransactionRow } from "@/app/domains/finance/hooks/useFinance"

interface TransactionReceiptProps {
    transaction: FinanceTransactionRow
    currencyCode: string
    businessName?: string
    className?: string
}

export const TransactionReceipt = React.forwardRef<HTMLDivElement, TransactionReceiptProps>(
    ({ transaction, currencyCode, businessName = "Cloove Business", className }, ref) => {
        const tx = transaction
        const status = tx.status
        const isCredit = tx.type === "Credit"

        return (
            <div
                ref={ref}
                className={cn(
                    "w-[480px] bg-brand-cream text-brand-deep font-sans p-0 overflow-hidden shadow-2xl",
                    className
                )}
                style={{ colorScheme: 'light' }}
            >
                {/* Header Section */}
                <div className="bg-brand-deep p-10 pb-16 text-center relative overflow-hidden">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 left-0 w-full h-full opacity-10">
                        <div className="absolute top-[-50px] left-[-50px] w-48 h-48 rounded-full border-20 border-brand-gold" />
                        <div className="absolute bottom-[-50px] right-[-50px] w-64 h-64 rounded-full border border-brand-gold" />
                    </div>

                    <div className="flex flex-col items-center gap-2 mb-2 relative z-10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/images/logo-white.png" alt="Cloove" className="h-8 w-8 object-contain" />
                        <h1 className="text-brand-gold font-serif text-3xl font-bold">Cloove</h1>
                    </div>
                    <p className="text-brand-cream/60 text-[10px] font-bold uppercase tracking-[0.3em] relative z-10">
                        Transaction Receipt
                    </p>
                </div>

                {/* Main Card (Pulling up into header) */}
                <div className="px-6 -mt-10 relative z-20">
                    <div className="bg-white rounded-4xl p-8 shadow-xl space-y-8">
                        {/* Status Icon & Label */}
                        <div className="flex flex-col items-center gap-4">
                            <div className={cn(
                                "h-20 w-20 rounded-3xl flex items-center justify-center shadow-lg transform rotate-3",
                                status === "Cleared" ? "bg-emerald-500 text-white shadow-emerald-500/20" :
                                    status === "Failed" ? "bg-rose-500 text-white shadow-rose-500/20" :
                                        "bg-amber-500 text-white shadow-amber-500/20"
                            )}>
                                {status === "Cleared" ? <CheckCircle2 className="w-10 h-10" /> :
                                    status === "Failed" ? <XCircle className="w-10 h-10" /> :
                                        <Clock className="w-10 h-10" />}
                            </div>
                            <div className="text-center">
                                <div className={cn(
                                    "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5 mb-2",
                                    isCredit ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                )}>
                                    {isCredit ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                                    {isCredit ? "Inbound Payment" : "Outbound Transfer"}
                                </div>
                                <h2 className="text-4xl font-serif font-bold text-brand-deep">
                                    <CurrencyDisplay value={tx.amount} currency={currencyCode} />
                                </h2>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-dashed border-brand-deep/10" />

                        {/* Details List */}
                        <div className="space-y-5">
                            <DetailRow label="Status" value={status === "Cleared" ? "Successful" : status} statusColor={
                                status === "Cleared" ? "emerald" : status === "Failed" ? "rose" : "amber"
                            } />
                            <DetailRow label="Transaction Type" value={tx.method} />
                            <DetailRow label="Reference ID" value={tx.reference} isMono />
                            <DetailRow label="Date & Time" value={tx.fullDate || tx.date} />

                            {tx.withdrawal ? (
                                <>
                                    <DetailRow label="Bank Name" value={tx.withdrawal.bankName} />
                                    <DetailRow label="Account Number" value={tx.withdrawal.accountNumber} isMono />
                                    <DetailRow label="Account Name" value={tx.withdrawal.accountName} />
                                </>
                            ) : tx.sale ? (
                                <>
                                    <DetailRow label="Customer" value={tx.sale.customerName || "Walking Customer"} />
                                    <DetailRow label="Sale Reference" value={`#${tx.sale.shortCode}`} isMono />
                                    <DetailRow label="Sale Total" value={formatCurrency(tx.sale.totalAmount, { currency: currencyCode })} />
                                    <DetailRow label="Business" value={businessName} />
                                </>
                            ) : (
                                <>
                                    {tx.customer && <DetailRow label="Customer" value={tx.customer} />}
                                    <DetailRow label="Business" value={businessName} />
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-10 text-center space-y-2 opacity-60">
                    <p className="text-[11px] italic font-medium">Thank you for your business!</p>
                    <p className="text-[9px] font-bold uppercase tracking-widest">
                        clooveai.com
                    </p>
                </div>
            </div>
        )
    }
)

function DetailRow({ label, value, isMono = false, statusColor }: { label: string; value: string; isMono?: boolean; statusColor?: "emerald" | "rose" | "amber" }) {
    return (
        <div className="space-y-1">
            <p className="text-[10px] font-bold text-brand-accent/40 uppercase tracking-widest">
                {label}
            </p>
            <p className={cn(
                "text-xs font-medium text-brand-deep",
                isMono && "font-mono text-[11px]",
                statusColor === "emerald" && "text-emerald-600 font-bold",
                statusColor === "rose" && "text-rose-600 font-bold",
                statusColor === "amber" && "text-amber-600 font-bold",
            )}>
                {value}
            </p>
        </div>
    )
}

TransactionReceipt.displayName = "TransactionReceipt"
