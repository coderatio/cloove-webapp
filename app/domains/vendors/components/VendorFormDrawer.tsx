"use client"

import * as React from "react"
import { Loader2, Trash2 } from "lucide-react"
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
import type { Vendor, CreateVendorPayload } from "../hooks/useVendors"

interface VendorFormDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    editingVendor: Vendor | null
    onSubmit: (data: CreateVendorPayload) => Promise<void>
    onDelete?: () => void
    isSubmitting: boolean
    isDeleting?: boolean
}

export function VendorFormDrawer({
    open,
    onOpenChange,
    editingVendor,
    onSubmit,
    onDelete,
    isSubmitting,
    isDeleting,
}: VendorFormDrawerProps) {
    const [formData, setFormData] = React.useState({
        name: "",
        phoneNumber: "",
        email: "",
        address: "",
        notes: "",
    })

    React.useEffect(() => {
        if (editingVendor) {
            setFormData({
                name: editingVendor.name,
                phoneNumber: editingVendor.phoneNumber,
                email: editingVendor.email,
                address: editingVendor.address,
                notes: editingVendor.notes,
            })
        } else {
            setFormData({ name: "", phoneNumber: "", email: "", address: "", notes: "" })
        }
    }, [editingVendor, open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await onSubmit({
            name: formData.name.trim(),
            phoneNumber: formData.phoneNumber.trim() || undefined,
            email: formData.email.trim() || undefined,
            address: formData.address.trim() || undefined,
            notes: formData.notes.trim() || undefined,
        })
    }

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent>
                <DrawerStickyHeader>
                    <DrawerTitle>
                        {editingVendor ? "Edit Vendor" : "Add New Vendor"}
                    </DrawerTitle>
                    <DrawerDescription>
                        {editingVendor
                            ? "Update vendor information."
                            : "Add a new supplier to your business."}
                    </DrawerDescription>
                </DrawerStickyHeader>

                <DrawerBody>
                    <form id="vendor-form" onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-6">
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1 block">
                                Vendor Name
                            </label>
                            <input
                                autoFocus
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. ABC Supplies"
                                className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/20 text-brand-deep dark:text-brand-cream"
                                required
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1 block">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                value={formData.phoneNumber}
                                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                placeholder="e.g. 08012345678"
                                className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/20 text-brand-deep dark:text-brand-cream"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1 block">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="e.g. vendor@example.com"
                                className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/20 text-brand-deep dark:text-brand-cream"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1 block">
                                Address
                            </label>
                            <input
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="e.g. 12 Market Road, Lagos"
                                className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/20 text-brand-deep dark:text-brand-cream"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1 block">
                                Notes
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Any additional notes..."
                                rows={3}
                                className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/20 text-brand-deep dark:text-brand-cream resize-none"
                            />
                        </div>

                        {editingVendor && onDelete && (
                            <div className="pt-6 border-t border-brand-deep/5 dark:border-white/5 mt-6">
                                <button
                                    type="button"
                                    disabled={isDeleting}
                                    onClick={onDelete}
                                    className="flex items-center justify-center gap-2 w-full py-4 text-xs font-bold text-rose-500/60 hover:text-rose-500 transition-all uppercase tracking-widest disabled:opacity-50"
                                >
                                    {isDeleting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                    Remove Vendor
                                </button>
                            </div>
                        )}
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
                            form="vendor-form"
                            disabled={isSubmitting}
                            className="flex-1 rounded-2xl h-14 bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold shadow-xl"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : editingVendor ? (
                                "Save Changes"
                            ) : (
                                "Add Vendor"
                            )}
                        </Button>
                    </div>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}
