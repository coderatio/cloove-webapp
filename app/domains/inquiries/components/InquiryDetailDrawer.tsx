"use client"

import { useState } from "react"
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose,
} from "@/app/components/ui/drawer"
import { Button } from "@/app/components/ui/button"
import { Textarea } from "@/app/components/ui/textarea"
import { Label } from "@/app/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/app/components/ui/select"
import type {
    ConsultationInquiry,
    InquiryStatus,
} from "@/app/domains/inquiries/hooks/useInquiries"

interface InquiryDetailDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    inquiry: ConsultationInquiry
    submitting: boolean
    onUpdateStatus: (status: InquiryStatus, notes: string | null) => Promise<void> | void
}

export function InquiryDetailDrawer({
    open,
    onOpenChange,
    inquiry,
    submitting,
    onUpdateStatus,
}: InquiryDetailDrawerProps) {
    const [status, setStatus] = useState<InquiryStatus>(inquiry.status)
    const [notes, setNotes] = useState("")

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="max-h-[90vh]">
                <DrawerStickyHeader>
                    <DrawerTitle className="font-serif text-2xl text-brand-deep dark:text-brand-cream">
                        {inquiry.topic}
                    </DrawerTitle>
                    <DrawerDescription>
                        Captured {new Date(inquiry.createdAt).toLocaleString()} via {inquiry.source}
                    </DrawerDescription>
                </DrawerStickyHeader>

                <div className="overflow-y-auto px-6 py-6 space-y-6">
                    <section className="space-y-1">
                        <p className="text-[10px] uppercase tracking-widest text-brand-accent/50 dark:text-brand-cream/40">
                            Customer
                        </p>
                        <p className="text-base font-medium text-brand-deep dark:text-brand-cream">
                            {inquiry.customerName ?? "Unknown"}
                        </p>
                        {inquiry.customerPhone && (
                            <p className="text-sm text-brand-accent/70 dark:text-brand-cream/60">
                                {inquiry.customerPhone}
                            </p>
                        )}
                    </section>

                    {inquiry.serviceName && (
                        <section className="space-y-1">
                            <p className="text-[10px] uppercase tracking-widest text-brand-accent/50 dark:text-brand-cream/40">
                                Service
                            </p>
                            <p className="text-base text-brand-deep dark:text-brand-cream">
                                {inquiry.serviceName}
                            </p>
                        </section>
                    )}

                    {inquiry.preferredContactWindow && (
                        <section className="space-y-1">
                            <p className="text-[10px] uppercase tracking-widest text-brand-accent/50 dark:text-brand-cream/40">
                                Preferred contact window
                            </p>
                            <p className="text-base text-brand-deep dark:text-brand-cream">
                                {inquiry.preferredContactWindow}
                            </p>
                        </section>
                    )}

                    {inquiry.message && (
                        <section className="space-y-1">
                            <p className="text-[10px] uppercase tracking-widest text-brand-accent/50 dark:text-brand-cream/40">
                                Customer message
                            </p>
                            <p className="text-sm whitespace-pre-wrap text-brand-deep dark:text-brand-cream/90">
                                {inquiry.message}
                            </p>
                        </section>
                    )}

                    <section className="space-y-2">
                        <Label>Status</Label>
                        <Select
                            value={status}
                            onValueChange={(value) => setStatus(value as InquiryStatus)}
                        >
                            <SelectTrigger className="h-12 rounded-xl bg-white/50 dark:bg-white/5 border-brand-deep/10 dark:border-white/10">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="qualifying">Qualifying</SelectItem>
                                <SelectItem value="scheduled">Scheduled</SelectItem>
                                <SelectItem value="won">Won</SelectItem>
                                <SelectItem value="lost">Lost</SelectItem>
                            </SelectContent>
                        </Select>
                    </section>

                    <section className="space-y-2">
                        <Label htmlFor="inquiry-notes">Internal notes (optional)</Label>
                        <Textarea
                            id="inquiry-notes"
                            value={notes}
                            onChange={(event) => setNotes(event.target.value)}
                            rows={4}
                            placeholder="Anything the team should know"
                        />
                    </section>
                </div>

                <DrawerFooter>
                    <DrawerClose asChild>
                        <Button variant="outline">Close</Button>
                    </DrawerClose>
                    <Button
                        onClick={() => onUpdateStatus(status, notes.trim() || null)}
                        disabled={submitting}
                        className="bg-brand-deep text-brand-gold-300 dark:bg-brand-gold-700 dark:text-white"
                    >
                        {submitting ? "Saving..." : "Save"}
                    </Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}
