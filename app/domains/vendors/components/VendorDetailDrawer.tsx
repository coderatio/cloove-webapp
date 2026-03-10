"use client"

import * as React from "react"
import { Loader2, Phone, Mail, MapPin, FileText, Plus, Banknote } from "lucide-react"
import { cn } from "@/app/lib/utils"
import { Button } from "@/app/components/ui/button"
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
import { useBusiness } from "@/app/components/BusinessProvider"
import { formatCurrency, formatDate } from "@/app/lib/formatters"
import { useVendorPayables, type Vendor, type PayableApi } from "../hooks/useVendors"

interface VendorDetailDrawerProps {
    vendor: Vendor | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onEdit: (vendor: Vendor) => void
    onRecordPayable: (vendor: Vendor) => void
    onPayPayable: (payable: PayableApi) => void
}

const statusConfig: Record<string, { label: string; className: string }> = {
    PENDING: { label: "Pending", className: "bg-brand-gold/10 text-brand-gold border-brand-gold/20" },
    PARTIAL: { label: "Partial", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
    PAID: { label: "Paid", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
}

export function VendorDetailDrawer({
    vendor,
    open,
    onOpenChange,
    onEdit,
    onRecordPayable,
    onPayPayable,
}: VendorDetailDrawerProps) {
    const { activeBusiness } = useBusiness()
    const currencyCode = activeBusiness?.currency ?? "NGN"
    const { data: payablesData, isLoading: isLoadingPayables } = useVendorPayables(vendor?.id ?? "")
    const payables = payablesData?.data ?? []

    if (!vendor) return null

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent>
                <DrawerStickyHeader>
                    <DrawerTitle>{vendor.name}</DrawerTitle>
                    <DrawerDescription>Vendor details and payable history</DrawerDescription>
                </DrawerStickyHeader>

                <DrawerBody>
                    <div className="space-y-6">
                        {/* Contact Info */}
                        <GlassCard className="p-5 space-y-4 rounded-3xl">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40">
                                Contact Information
                            </p>
                            <div className="space-y-3">
                                {vendor.phoneNumber && (
                                    <a href={`tel:${vendor.phoneNumber}`} className="flex items-center gap-3 text-sm text-brand-deep dark:text-brand-cream hover:text-brand-green transition-colors">
                                        <div className="h-8 w-8 rounded-full bg-brand-green/10 flex items-center justify-center">
                                            <Phone className="w-4 h-4 text-brand-green" />
                                        </div>
                                        {vendor.phoneNumber}
                                    </a>
                                )}
                                {vendor.email && (
                                    <a href={`mailto:${vendor.email}`} className="flex items-center gap-3 text-sm text-brand-deep dark:text-brand-cream hover:text-brand-green transition-colors">
                                        <div className="h-8 w-8 rounded-full bg-brand-gold/10 flex items-center justify-center">
                                            <Mail className="w-4 h-4 text-brand-gold" />
                                        </div>
                                        {vendor.email}
                                    </a>
                                )}
                                {vendor.address && (
                                    <div className="flex items-center gap-3 text-sm text-brand-deep dark:text-brand-cream">
                                        <div className="h-8 w-8 rounded-full bg-brand-accent/10 flex items-center justify-center">
                                            <MapPin className="w-4 h-4 text-brand-accent" />
                                        </div>
                                        {vendor.address}
                                    </div>
                                )}
                                {vendor.notes && (
                                    <div className="flex items-start gap-3 text-sm text-brand-accent/60 dark:text-brand-cream/60">
                                        <div className="h-8 w-8 rounded-full bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center shrink-0">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        {vendor.notes}
                                    </div>
                                )}
                            </div>
                        </GlassCard>

                        {/* Outstanding Summary */}
                        <GlassCard className={cn(
                            "p-5 flex items-center justify-between rounded-3xl",
                            vendor.outstanding > 0 && "border-rose-500/20 bg-rose-500/5"
                        )}>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500/60">
                                    Outstanding Balance
                                </p>
                                <p className={cn(
                                    "text-2xl font-serif font-medium",
                                    vendor.outstanding > 0 ? "text-rose-500" : "text-brand-deep dark:text-brand-cream"
                                )}>
                                    {formatCurrency(vendor.outstanding, { currency: currencyCode })}
                                </p>
                            </div>
                            <Button
                                onClick={() => onRecordPayable(vendor)}
                                className="rounded-2xl bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Record Payable
                            </Button>
                        </GlassCard>

                        {/* Payables History */}
                        <div className="space-y-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1">
                                Payable History
                            </p>
                            {isLoadingPayables ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-5 h-5 animate-spin text-brand-accent/40" />
                                </div>
                            ) : payables.length === 0 ? (
                                <GlassCard className="p-6 text-center rounded-3xl">
                                    <p className="text-sm text-brand-accent/40 dark:text-brand-cream/40">
                                        No payables recorded yet.
                                    </p>
                                </GlassCard>
                            ) : (
                                payables.map((payable) => {
                                    const config = statusConfig[payable.status] ?? statusConfig.PENDING
                                    return (
                                        <GlassCard key={payable.id} className="p-4 space-y-3 rounded-3xl">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-medium text-brand-deep dark:text-brand-cream">
                                                        {payable.description || "Payable"}
                                                    </p>
                                                    <p className="text-xs text-brand-accent/40 dark:text-brand-cream/40 mt-0.5">
                                                        {formatDate(payable.createdAt, "MMM d, yyyy")}
                                                        {payable.dueAt && ` · Due ${formatDate(payable.dueAt, "MMM d, yyyy")}`}
                                                    </p>
                                                </div>
                                                <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border", config.className)}>
                                                    {config.label}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4 text-sm">
                                                    <span className="text-brand-accent/60 dark:text-brand-cream/60">
                                                        Total: <span className="font-serif font-medium text-brand-deep dark:text-brand-cream">{formatCurrency(payable.amount, { currency: currencyCode })}</span>
                                                    </span>
                                                    {payable.remainingAmount > 0 && payable.remainingAmount < payable.amount && (
                                                        <span className="text-rose-500">
                                                            Remaining: <span className="font-serif font-medium">{formatCurrency(payable.remainingAmount, { currency: currencyCode })}</span>
                                                        </span>
                                                    )}
                                                </div>
                                                {payable.status !== "PAID" && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => onPayPayable(payable)}
                                                        className="rounded-xl text-xs border-brand-green/20 text-brand-green hover:bg-brand-green/10"
                                                    >
                                                        <Banknote className="w-3 h-3 mr-1" />
                                                        Pay
                                                    </Button>
                                                )}
                                            </div>
                                        </GlassCard>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </DrawerBody>

                <DrawerFooter>
                    <div className="flex gap-3 max-w-lg mx-auto w-full">
                        <Button
                            variant="outline"
                            onClick={() => {
                                onOpenChange(false)
                                onEdit(vendor)
                            }}
                            className="flex-1 rounded-2xl h-14 border-brand-deep/5 dark:border-white/5 dark:text-brand-cream"
                        >
                            Edit Vendor
                        </Button>
                        <Button
                            onClick={() => onRecordPayable(vendor)}
                            className="flex-1 rounded-2xl h-14 bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold shadow-xl"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Record Payable
                        </Button>
                    </div>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}
