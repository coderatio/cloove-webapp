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
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Textarea } from "@/app/components/ui/textarea"
import { Label } from "@/app/components/ui/label"
import { Calendar } from "@/app/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover"
import { SearchableSelect } from "@/app/components/ui/searchable-select"
import { MoneyInput } from "@/app/components/ui/money-input"
import { CalendarIcon, Clock, Link2, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/app/lib/utils"
import { PaymentLink } from "./PaymentLinkTypes"

interface CreatePaymentLinkDrawerProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (data: { id?: string; title: string; description: string; amount: number; expiresIn: string; customDate?: Date; customTime: string }) => Promise<void>
    isPending: boolean
    currencySymbol: string
    editingLink?: PaymentLink | null
}

export function CreatePaymentLinkDrawer({
    isOpen,
    onOpenChange,
    onSubmit,
    isPending,
    currencySymbol,
    editingLink
}: CreatePaymentLinkDrawerProps) {
    const [title, setTitle] = React.useState("")
    const [description, setDescription] = React.useState("")
    const [amount, setAmount] = React.useState(0)
    const [expiresIn, setExpiresIn] = React.useState("24h")
    const [customDate, setCustomDate] = React.useState<Date | undefined>(undefined)
    const [customTime, setCustomTime] = React.useState("23:59")

    // Reset or pre-fill form when drawer opens or editingLink changes
    React.useEffect(() => {
        if (isOpen) {
            if (editingLink) {
                setTitle(editingLink.title || "")
                setDescription(editingLink.description || "")
                setAmount(editingLink.amount || 0)
                setExpiresIn(editingLink.expiresAt ? "custom" : "never")
                if (editingLink.expiresAt) {
                    const expiry = new Date(editingLink.expiresAt)
                    const normalizedExpiry = new Date(expiry)
                    normalizedExpiry.setHours(0, 0, 0, 0)
                    setCustomDate(normalizedExpiry)
                    setCustomTime(`${expiry.getHours().toString().padStart(2, '0')}:${expiry.getMinutes().toString().padStart(2, '0')}`)
                } else {
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    setCustomDate(today)
                    setCustomTime("23:59")
                }
            } else {
                // Default states for new link
                setTitle("")
                setDescription("")
                setAmount(0)
                setExpiresIn("24h")
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                setCustomDate(today)
                setCustomTime("23:59")
            }
        }
    }, [isOpen, editingLink])

    const handleSubmit = async () => {
        await onSubmit({
            id: editingLink?.id,
            title,
            description,
            amount,
            expiresIn,
            customDate,
            customTime
        })
    }

    return (
        <Drawer open={isOpen} onOpenChange={onOpenChange}>
            <DrawerContent>
                <DrawerStickyHeader>
                    <DrawerTitle>{editingLink ? "Edit Payment Link" : "Create Payment Link"}</DrawerTitle>
                    <DrawerDescription>
                        {editingLink
                            ? "Update the details of your payment link."
                            : "Create a payment link to receive funds into your wallet."}
                    </DrawerDescription>
                </DrawerStickyHeader>
                <DrawerBody className="pb-8">
                    <div className="space-y-10 py-6">
                        <div className="space-y-2.5">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 px-1">
                                Link Title
                            </Label>
                            <div className="relative group">
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Service Invoice, Product Payment"
                                    className="h-14 sm:h-14 rounded-2xl text-base px-6 bg-white/50 dark:bg-white/5 border-brand-deep/10 dark:border-white/10 focus-visible:ring-brand-gold/20 focus-visible:border-brand-gold/30 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 px-1">
                                Payment Amount
                            </Label>
                            <MoneyInput
                                value={amount}
                                onChange={setAmount}
                                currencySymbol={currencySymbol}
                                placeholder="0.00"
                            />
                        </div>

                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between px-1">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40">
                                    Description
                                </Label>
                                <span className="text-[10px] font-medium text-brand-accent/20 dark:text-brand-cream/20">Optional</span>
                            </div>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Briefly describe what this payment is for..."
                                className="min-h-[100px] rounded-2xl p-4 bg-white/40 dark:bg-white/5 border-brand-accent/5 dark:border-white/5 focus-visible:ring-brand-gold/20 resize-none text-base"
                            />
                        </div>

                        <div className="space-y-2.5">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 px-1">
                                Link Expiration
                            </Label>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-brand-deep/5 dark:bg-white/5 p-1 rounded-[20px] border border-brand-deep/5 dark:border-white/5">
                                {[
                                    { label: "1h", value: "1h" },
                                    { label: "24h", value: "24h" },
                                    { label: "7d", value: "7d" },
                                    { label: "30d", value: "30d" },
                                    { label: "Never", value: "never" },
                                    { label: "Custom", value: "custom" },
                                ].map((opt) => (
                                    <Button
                                        key={opt.value}
                                        type="button"
                                        variant={expiresIn === opt.value ? "base" : "ghost"}
                                        onClick={() => setExpiresIn(opt.value)}
                                        className={cn(
                                            "h-10 rounded-[14px] text-[11px] font-bold uppercase tracking-wider transition-all duration-300",
                                            expiresIn === opt.value
                                                ? "bg-brand-deep text-brand-gold shadow-lg dark:bg-brand-gold dark:text-brand-deep"
                                                : "text-brand-accent/60 dark:text-brand-cream/60 hover:bg-white/50 dark:hover:bg-white/5"
                                        )}
                                    >
                                        {opt.label}
                                    </Button>
                                ))}
                            </div>

                            {expiresIn === "custom" && (
                                <div className="mt-6 pt-6 border-t border-brand-deep/5 dark:border-white/5 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 px-1">
                                            Expiry Date
                                        </Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "w-full h-14 rounded-2xl justify-start text-left font-medium bg-white/50 dark:bg-white/5 border-brand-deep/10 dark:border-white/10 px-6 transition-all hover:bg-white/60 dark:hover:bg-white/10",
                                                        !customDate && "text-brand-accent/30 dark:text-brand-cream/30"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-3 h-4 w-4 opacity-40 shrink-0" />
                                                    <span className="truncate">
                                                        {customDate ? format(customDate, "PPP") : "Pick a date"}
                                                    </span>
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden border-none shadow-2xl" align="center">
                                                <Calendar
                                                    mode="single"
                                                    selected={customDate}
                                                    onSelect={setCustomDate}
                                                    autoFocus
                                                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 px-1">
                                            Expiry Time
                                        </Label>
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <SearchableSelect
                                                    options={Array.from({ length: 24 }).map((_, i) => ({
                                                        label: i.toString().padStart(2, '0'),
                                                        value: i.toString().padStart(2, '0')
                                                    }))}
                                                    value={customTime.split(":")[0]}
                                                    onChange={(hour) => setCustomTime(`${hour}:${customTime.split(":")[1]}`)}
                                                    placeholder="HR"
                                                    triggerClassName="h-14 rounded-2xl pl-12 pr-10 bg-white/50 dark:bg-white/5 border-brand-deep/10 dark:border-white/10 text-base font-medium"
                                                    renderTrigger={(val) => (
                                                        <Button
                                                            variant="outline"
                                                            className="w-full h-14 rounded-2xl justify-between pl-12 pr-4 bg-white/50 dark:bg-white/5 border-brand-deep/10 dark:border-white/10 text-base font-medium relative group"
                                                        >
                                                            <Clock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-accent/30 dark:text-brand-cream/30 pointer-events-none group-focus:text-brand-gold/60 transition-colors" />
                                                            <span className="text-brand-deep dark:text-brand-cream">{val || "00"}</span>
                                                            <span className="text-[10px] font-bold text-brand-accent/20 dark:text-brand-cream/20">HR</span>
                                                        </Button>
                                                    )}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <SearchableSelect
                                                    options={["00", "15", "30", "45", "59"].map(min => ({
                                                        label: min,
                                                        value: min
                                                    }))}
                                                    value={customTime.split(":")[1]}
                                                    onChange={(min) => setCustomTime(`${customTime.split(":")[0]}:${min}`)}
                                                    placeholder="MIN"
                                                    triggerClassName="h-14 rounded-2xl px-6 bg-white/50 dark:bg-white/5 border-brand-deep/10 dark:border-white/10 text-base font-medium"
                                                    renderTrigger={(val) => (
                                                        <Button
                                                            variant="outline"
                                                            className="w-full h-14 rounded-2xl justify-between px-6 bg-white/50 dark:bg-white/5 border-brand-deep/10 dark:border-white/10 text-base font-medium relative"
                                                        >
                                                            <span className="text-brand-deep dark:text-brand-cream">{val || "59"}</span>
                                                            <span className="text-[10px] font-bold text-brand-accent/20 dark:text-brand-cream/20">MIN</span>
                                                        </Button>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </DrawerBody>
                <DrawerFooter>
                    <Button
                        onClick={handleSubmit}
                        disabled={!title.trim() || amount <= 0 || isPending}
                        className="w-full h-14 rounded-2xl bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep hover:bg-brand-deep/90 dark:hover:bg-brand-gold/90 font-semibold text-base gap-2"
                    >
                        {isPending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Link2 className="w-5 h-5" />
                        )}
                        {editingLink ? "Update Payment Link" : "Create Payment Link"}
                    </Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}
