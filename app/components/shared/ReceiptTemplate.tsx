"use client"

import * as React from "react"
import { formatCurrency } from "@/app/lib/formatters"
import { cn } from "@/app/lib/utils"

interface ReceiptItem {
    productName: string
    quantity: number
    price: number
    total: number
}

export interface ReceiptData {
    businessName: string
    businessAddress?: string
    businessPhone?: string
    orderId: string
    shortCode?: string
    date: string
    customerName?: string
    items: ReceiptItem[]
    subtotal: number
    discountAmount?: number
    totalAmount: number
    amountPaid: number
    remainingAmount: number
    paymentMethod?: string
    currency: string
}

interface ReceiptTemplateProps {
    data: ReceiptData
    className?: string
}

export const ReceiptTemplate = React.forwardRef<HTMLDivElement, ReceiptTemplateProps>(
    ({ data, className }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "w-[80mm] p-4 bg-white text-black font-sans text-[12px] leading-tight print:w-[80mm] print:p-2",
                    className
                )}
                style={{ colorScheme: 'light' }}
            >
                {/* Header */}
                <div className="text-center space-y-1 mb-4">
                    <h1 className="text-lg font-bold uppercase">{data.businessName}</h1>
                    {data.businessAddress && <p className="text-[10px]">{data.businessAddress}</p>}
                    {data.businessPhone && <p className="text-[10px]">Tel: {data.businessPhone}</p>}
                </div>

                <div className="border-t border-dashed border-black my-2" />

                {/* Order Meta */}
                <div className="space-y-0.5 mb-4">
                    <div className="flex justify-between">
                        <span>Date:</span>
                        <span>{data.date}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Order ID:</span>
                        <span className="font-mono">{data.shortCode || data.orderId.substring(0, 8)}</span>
                    </div>
                    {data.customerName && (
                        <div className="flex justify-between">
                            <span>Customer:</span>
                            <span className="font-medium">{data.customerName}</span>
                        </div>
                    )}
                </div>

                <div className="border-t border-dashed border-black my-2" />

                {/* Items Table */}
                <table className="w-full mb-4 border-collapse">
                    <thead>
                        <tr className="border-b border-black/20">
                            <th className="text-left font-bold py-1">Item</th>
                            <th className="text-right font-bold py-1 px-2">Qty</th>
                            <th className="text-right font-bold py-1">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.items.map((item, idx) => (
                            <tr key={idx} className="align-top border-b border-dashed border-black/5">
                                <td className="py-2 pr-2">
                                    <div className="font-medium">{item.productName}</div>
                                    <div className="text-[10px] opacity-60">
                                        {formatCurrency(item.price, { currency: data.currency })} each
                                    </div>
                                </td>
                                <td className="text-right py-2 px-2 tabular-nums">{item.quantity}</td>
                                <td className="text-right py-2 font-bold tabular-nums">
                                    {formatCurrency(item.total, { currency: data.currency })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals Section */}
                <div className="space-y-1.5 mb-4">
                    <div className="flex justify-between items-center text-[11px] opacity-80">
                        <span>Items Subtotal:</span>
                        <span className="tabular-nums font-medium">{formatCurrency(data.subtotal, { currency: data.currency })}</span>
                    </div>
                    {data.discountAmount !== undefined && data.discountAmount > 0 && (
                        <div className="flex justify-between items-center text-[11px] text-rose-700 italic">
                            <span>Less: Discount:</span>
                            <span className="tabular-nums">- {formatCurrency(data.discountAmount, { currency: data.currency })}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center py-2 border-y border-black font-bold text-sm">
                        <span>TOTAL:</span>
                        <span className="tabular-nums tracking-tighter">{formatCurrency(data.totalAmount, { currency: data.currency })}</span>
                    </div>
                    <div className="flex justify-between items-center text-emerald-800 font-medium">
                        <span className="text-xs">Paid:</span>
                        <span className="tabular-nums">{formatCurrency(data.amountPaid, { currency: data.currency })}</span>
                    </div>
                    {data.remainingAmount > 0 && (
                        <div className="flex justify-between items-center font-bold text-rose-700 bg-rose-50 px-1 rounded-sm">
                            <span className="text-xs uppercase tracking-tighter">Balance Due:</span>
                            <span className="tabular-nums">{formatCurrency(data.remainingAmount, { currency: data.currency })}</span>
                        </div>
                    )}
                </div>

                <div className="border-t border-dashed border-black my-2" />

                {/* Footer */}
                <div className="text-center space-y-1 mt-4">
                    <p className="font-medium italic">Thank you for your business!</p>
                    <p className="text-[9px] opacity-60">Receipt generated by Cloove</p>
                </div>
            </div>
        )
    }
)

ReceiptTemplate.displayName = "ReceiptTemplate"
