"use client"

import { type ReactElement } from "react"
import { CreditCard, Download } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerBody,
    DrawerFooter,
    DrawerTitle,
    DrawerDescription,
} from "@/app/components/ui/drawer"
import { VisuallyHidden } from "@/app/components/ui/visually-hidden"
import type { InvoicePart } from "../types"

interface InvoiceDetailViewProps {
    invoice: InvoicePart
    open: boolean
    onOpenChange: (open: boolean) => void
    onGeneratePdf?: () => void
}

export function InvoiceDetailView({ invoice, open, onOpenChange, onGeneratePdf }: InvoiceDetailViewProps): ReactElement {
    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent>
                <VisuallyHidden>
                    <DrawerTitle>{invoice.invoiceNumber}</DrawerTitle>
                    <DrawerDescription>Invoice details for {invoice.customerName}</DrawerDescription>
                </VisuallyHidden>
                <DrawerStickyHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-brand-gold/20 flex items-center justify-center text-brand-gold shrink-0">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg font-serif font-semibold text-brand-deep dark:text-brand-cream truncate">
                                {invoice.invoiceNumber}
                            </h2>
                            <span className="text-[10px] uppercase tracking-widest text-brand-gold font-bold">
                                {invoice.status}
                            </span>
                        </div>
                    </div>
                </DrawerStickyHeader>

                <DrawerBody>
                    <div className="space-y-4 mb-6">
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-bold uppercase tracking-wider text-brand-deep/50 dark:text-brand-cream/50">Customer</span>
                            <span className="font-medium text-brand-deep dark:text-brand-cream">{invoice.customerName}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-bold uppercase tracking-wider text-brand-deep/50 dark:text-brand-cream/50">Due Date</span>
                            <span className="font-medium text-brand-deep dark:text-brand-cream">{invoice.dueDate}</span>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-brand-gold/10 overflow-hidden">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-brand-gold/5">
                                <tr>
                                    <th className="p-3 text-brand-deep/50 dark:text-brand-cream/50 font-bold uppercase tracking-wider">Item</th>
                                    <th className="p-3 text-brand-deep/50 dark:text-brand-cream/50 font-bold uppercase tracking-wider text-center">Qty</th>
                                    <th className="p-3 text-brand-deep/50 dark:text-brand-cream/50 font-bold uppercase tracking-wider text-right">Unit Price</th>
                                    <th className="p-3 text-brand-deep/50 dark:text-brand-cream/50 font-bold uppercase tracking-wider text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-gold/5">
                                {invoice.items.map((item, i) => (
                                    <tr key={i}>
                                        <td className="p-3 text-brand-deep dark:text-brand-cream">{item.description}</td>
                                        <td className="p-3 text-center text-brand-deep/70 dark:text-brand-cream/70">{item.quantity}</td>
                                        <td className="p-3 text-right font-mono text-brand-deep/70 dark:text-brand-cream/70">₦{item.unitPrice.toLocaleString()}</td>
                                        <td className="p-3 text-right font-mono font-medium text-brand-gold">₦{(item.quantity * item.unitPrice).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                        <div className="flex justify-between text-brand-deep/60 dark:text-brand-cream/60">
                            <span>Subtotal</span>
                            <span className="font-mono">₦{invoice.subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold text-brand-deep dark:text-brand-cream text-base">
                            <span>Total</span>
                            <span className="font-mono text-brand-gold">₦{invoice.total.toLocaleString()}</span>
                        </div>
                    </div>

                    {invoice.notes && (
                        <div className="mt-6 p-3 rounded-xl bg-brand-gold/5 border border-brand-gold/10">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-brand-gold mb-1">Notes</p>
                            <p className="text-xs text-brand-deep/70 dark:text-brand-cream/70 leading-relaxed">{invoice.notes}</p>
                        </div>
                    )}
                </DrawerBody>

                <DrawerFooter>
                    <div className="flex gap-3">
                        {onGeneratePdf && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={onGeneratePdf}
                                className="border border-brand-gold/20 text-brand-gold hover:bg-brand-gold/5"
                            >
                                <Download className="w-3.5 h-3.5 mr-2" />
                                Export PDF
                            </Button>
                        )}
                    </div>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}
