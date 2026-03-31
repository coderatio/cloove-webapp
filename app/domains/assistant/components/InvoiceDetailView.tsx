"use client"

import { useState, type ReactElement } from "react"
import { CreditCard, Download, Loader2, Plus, Trash2 } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Markdown } from "@/app/components/ui/markdown"
import { DocumentEditor } from "@/app/components/ui/document-editor"
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
import { useDocumentDraft } from "../hooks/useDocumentDraft"
import type { LineItem } from "../types"
import { CurrencyText } from "@/app/components/shared/CurrencyText"

interface InvoiceDetailViewProps {
    draftId: string
    clientName: string
    lineItems: LineItem[]
    totalAmount: number
    currency: string
    streamingNotes: string
    isStreaming: boolean
    onClose?: () => void
    open: boolean
    onOpenChange: (open: boolean) => void
}

function formatMoney(amount: number, currency: string): string {
    const symbol = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency
    return `${symbol}${amount.toLocaleString()}`
}

export function InvoiceDetailView({
    draftId,
    clientName,
    lineItems: initialLineItems,
    currency,
    streamingNotes,
    isStreaming,
    open,
    onOpenChange,
}: InvoiceDetailViewProps): ReactElement {
    const { isSaving, isGeneratingPdf, updateLineItems, updateContent, generatePdf } = useDocumentDraft(draftId)
    const [items, setItems] = useState<LineItem[]>(initialLineItems)
    const [notesHtml, setNotesHtml] = useState("")

    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

    const handleItemChange = (index: number, field: keyof LineItem, value: string | number) => {
        const updated = items.map((item, i) => {
            if (i !== index) return item
            return { ...item, [field]: field === 'description' ? value : Number(value) || 0 }
        })
        setItems(updated)
        updateLineItems(updated)
    }

    const handleAddItem = () => {
        const updated = [...items, { description: '', quantity: 1, unitPrice: 0 }]
        setItems(updated)
        updateLineItems(updated)
    }

    const handleRemoveItem = (index: number) => {
        const updated = items.filter((_, i) => i !== index)
        setItems(updated)
        updateLineItems(updated)
    }

    const handleNotesChange = (html: string) => {
        setNotesHtml(html)
        updateContent(html)
    }

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent>
                <VisuallyHidden>
                    <DrawerTitle>Invoice for {clientName}</DrawerTitle>
                    <DrawerDescription>Invoice details for {clientName}</DrawerDescription>
                </VisuallyHidden>
                <DrawerStickyHeader>
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="h-10 w-10 rounded-xl bg-brand-gold/20 flex items-center justify-center text-brand-gold shrink-0">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-lg font-serif font-semibold text-brand-deep dark:text-brand-cream truncate">
                                    Invoice
                                </h2>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] uppercase tracking-widest text-brand-gold font-bold">
                                        Draft
                                    </span>
                                    <span className="text-[10px] text-brand-deep/40 dark:text-brand-cream/40">
                                        • {clientName}
                                    </span>
                                </div>
                            </div>
                        </div>
                        {isSaving && (
                            <span className="text-[10px] text-brand-deep/40 dark:text-brand-cream/40 shrink-0">
                                Saving…
                            </span>
                        )}
                    </div>
                </DrawerStickyHeader>

                <DrawerBody>
                    {/* Line items table */}
                    <div className="rounded-2xl border border-brand-gold/10 overflow-hidden mb-4">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-brand-gold/5">
                                <tr>
                                    <th className="p-3 text-brand-deep/50 dark:text-brand-cream/50 font-bold uppercase tracking-wider">Item</th>
                                    <th className="p-3 text-brand-deep/50 dark:text-brand-cream/50 font-bold uppercase tracking-wider text-center w-16">Qty</th>
                                    <th className="p-3 text-brand-deep/50 dark:text-brand-cream/50 font-bold uppercase tracking-wider text-right w-28">Unit Price</th>
                                    <th className="p-3 text-brand-deep/50 dark:text-brand-cream/50 font-bold uppercase tracking-wider text-right w-24">Total</th>
                                    <th className="p-3 w-8"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-gold/5">
                                {items.map((item, i) => (
                                    <tr key={i}>
                                        <td className="p-2">
                                            <input
                                                type="text"
                                                value={item.description}
                                                onChange={(e) => handleItemChange(i, 'description', e.target.value)}
                                                placeholder="Item description"
                                                className="w-full bg-transparent text-brand-deep dark:text-brand-cream placeholder-brand-deep/30 dark:placeholder-brand-cream/30 outline-none text-xs"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(i, 'quantity', e.target.value)}
                                                min={0}
                                                className="w-full bg-transparent text-brand-deep/70 dark:text-brand-cream/70 text-center outline-none text-xs"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                value={item.unitPrice}
                                                onChange={(e) => handleItemChange(i, 'unitPrice', e.target.value)}
                                                min={0}
                                                className="w-full bg-transparent text-brand-deep/70 dark:text-brand-cream/70 text-right outline-none font-mono text-xs"
                                            />
                                        </td>
                                        <td className="p-3 text-right font-mono font-medium text-brand-gold text-xs">
                                            <CurrencyText value={formatMoney(item.quantity * item.unitPrice, currency)} />
                                        </td>
                                        <td className="p-2 text-right">
                                            <button
                                                onClick={() => handleRemoveItem(i)}
                                                className="text-brand-deep/20 hover:text-red-400 transition-colors"
                                                aria-label="Remove item"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="px-3 py-2 border-t border-brand-gold/5">
                            <button
                                onClick={handleAddItem}
                                className="flex items-center gap-1.5 text-xs text-brand-gold/60 hover:text-brand-gold transition-colors"
                            >
                                <Plus className="w-3 h-3" />
                                Add item
                            </button>
                        </div>
                    </div>

                    {/* Totals */}
                    <div className="space-y-2 text-sm mb-6">
                        <div className="flex justify-between text-brand-deep/60 dark:text-brand-cream/60">
                            <span>Subtotal</span>
                            <span className="font-mono">
                                <CurrencyText value={formatMoney(subtotal, currency)} />
                            </span>
                        </div>
                        <div className="flex justify-between font-bold text-brand-deep dark:text-brand-cream text-base">
                            <span>Total</span>
                            <span className="font-mono text-brand-gold">
                                <CurrencyText value={formatMoney(subtotal, currency)} />
                            </span>
                        </div>
                    </div>

                    {/* Notes section */}
                    <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-brand-gold">Notes</p>
                        {isStreaming && streamingNotes ? (
                            <div className="p-3 rounded-xl bg-brand-gold/5 border border-brand-gold/10">
                                <Markdown content={streamingNotes} streaming />
                            </div>
                        ) : (
                            <DocumentEditor
                                content={notesHtml}
                                onChange={handleNotesChange}
                                placeholder="Add notes or payment terms…"
                            />
                        )}
                    </div>
                </DrawerBody>

                <DrawerFooter>
                    <div className="flex items-center gap-3">
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={generatePdf}
                            disabled={isStreaming || isGeneratingPdf}
                            className="border border-brand-gold/20 text-brand-gold hover:bg-brand-gold/5"
                        >
                            {isGeneratingPdf ? (
                                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                            ) : (
                                <Download className="w-3.5 h-3.5 mr-2" />
                            )}
                            Generate PDF
                        </Button>
                    </div>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}
