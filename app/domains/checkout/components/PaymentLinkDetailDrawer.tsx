"use client"

import * as React from "react"
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerBody,
    DrawerFooter,
} from "@/app/components/ui/drawer"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Button } from "@/app/components/ui/button"
import { Label } from "@/app/components/ui/label"
import { Copy, XCircle, ExternalLink } from "lucide-react"
import { formatCurrency, formatDate } from "@/app/lib/formatters"
import { cn } from "@/app/lib/utils"
import { PaymentLink, statusConfig, targetTypeConfig } from "./PaymentLinkTypes"

interface PaymentLinkDetailDrawerProps {
    link: PaymentLink | null
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onCopy: () => void
    onCancel: () => void
    origin: string
    currencyCode: string
}

export function PaymentLinkDetailDrawer({
    link,
    isOpen,
    onOpenChange,
    onCopy,
    onCancel,
    origin,
    currencyCode,
}: PaymentLinkDetailDrawerProps) {
    if (!link) return null

    const typeConfig = targetTypeConfig[link.targetType] ?? { label: link.targetType, className: "bg-brand-deep/5 text-brand-accent/60" }
    const status = statusConfig[link.status] ?? statusConfig.ACTIVE

    return (
        <Drawer open={isOpen} onOpenChange={onOpenChange}>
            <DrawerContent>
                <DrawerStickyHeader>
                    <DrawerTitle className="font-serif text-2xl">Link Details</DrawerTitle>
                    <DrawerDescription>View and manage your payment link metadata.</DrawerDescription>
                </DrawerStickyHeader>

                <DrawerBody className="pb-8">
                    <div className="space-y-8 py-6">
                        {/* Status & Amount Overview */}
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className={cn("px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border shadow-sm", status.className)}>
                                {status.label}
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40">
                                    Link Total
                                </p>
                                <p className="text-5xl font-serif font-medium text-brand-deep dark:text-brand-cream">
                                    {link.amount != null ? formatCurrency(link.amount, { currency: currencyCode }) : "\u2014"}
                                </p>
                            </div>
                        </div>

                        {/* General Information */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1">General Information</h3>
                            <GlassCard className="divide-y divide-brand-deep/5 dark:divide-white/5 border-brand-deep/5 rounded-3xl before:rounded-3xl overflow-hidden">
                                <div className="p-5 flex justify-between items-center bg-brand-deep/5 dark:bg-white/5">
                                    <p className="text-sm font-bold text-brand-deep dark:text-brand-cream">{link.title || link.reference}</p>
                                    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap", typeConfig.className)}>
                                        {typeConfig.label}
                                    </span>
                                </div>
                                {link.description && (
                                    <div className="p-5 space-y-1.5">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/30 dark:text-brand-cream/30">Description</p>
                                        <p className="text-sm text-brand-deep/70 dark:text-brand-cream/70 leading-relaxed font-medium">
                                            {link.description}
                                        </p>
                                    </div>
                                )}
                                <div className="p-5 grid grid-cols-2 gap-8">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/30 dark:text-brand-cream/30">Created</p>
                                        <p className="text-sm font-bold text-brand-deep dark:text-brand-cream">
                                            {formatDate(link.createdAt, "MMM d, yyyy")}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/30 dark:text-brand-cream/30">Expires</p>
                                        <p className="text-sm font-bold text-brand-deep dark:text-brand-cream">
                                            {link.expiresAt ? formatDate(link.expiresAt, "MMM d, yyyy") : "Never"}
                                        </p>
                                    </div>
                                </div>
                            </GlassCard>
                        </div>

                        {/* Payment Access */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1">Payment Access</h3>
                            <div className="space-y-3">
                                <div className="p-5 rounded-3xl border border-brand-deep/10 dark:border-white/10 bg-brand-deep/2 dark:bg-white/2 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40">Reference Code</p>
                                        <code className="text-[10px] font-mono font-bold text-brand-gold uppercase tracking-wider">
                                            {link.reference}
                                        </code>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 min-w-0 h-10 rounded-xl bg-brand-deep/5 dark:bg-white/5 border border-brand-deep/5 dark:border-white/5 flex items-center px-4">
                                            <p className="text-[10px] font-mono text-brand-accent/40 dark:text-brand-cream/40 truncate">
                                                {`${origin.replace(/^https?:\/\//, '')}/pay/${link.reference}`}
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => window.open(`${origin}/pay/${link.reference}`, "_blank")}
                                            className="h-10 w-10 p-0 rounded-xl hover:bg-brand-deep/5 dark:hover:bg-white/5 text-brand-accent dark:text-brand-cream group"
                                        >
                                            <ExternalLink className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </DrawerBody>

                <DrawerFooter className="pt-2">
                    <div className="flex flex-col md:flex-row gap-3 max-w-lg mx-auto w-full pb-4">
                        <Button
                            variant="outline"
                            onClick={onCopy}
                            className="flex-1 h-14 sm:h-14 py-4 rounded-2xl border-brand-deep/10 dark:border-white/10 dark:text-brand-cream font-medium gap-2"
                        >
                            <Copy className="w-4 h-4" />
                            Copy Link
                        </Button>
                        {link.status === "ACTIVE" && (
                            <Button
                                variant="destructive"
                                onClick={onCancel}
                                className="flex-1 h-16 sm:h-14 py-4 rounded-2xl bg-rose-500 text-white hover:bg-rose-600 font-bold shadow-xl shadow-rose-500/10 gap-2"
                            >
                                <XCircle className="w-4 h-4" />
                                Cancel Link
                            </Button>
                        )}
                    </div>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}
