"use client"

import { useState } from "react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog"

interface SetSalesPinDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (pin: string) => Promise<void>
    staffName: string
}

export function SetSalesPinDialog({ open, onOpenChange, onSubmit, staffName }: SetSalesPinDialogProps) {
    const [pin, setPin] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async () => {
        if (!/^\d{4}$/.test(pin)) return
        setIsSubmitting(true)
        try {
            await onSubmit(pin)
            setPin("")
            onOpenChange(false)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-[24px] sm:rounded-[28px]">
                <DialogHeader>
                    <DialogTitle>Set Sales PIN</DialogTitle>
                    <DialogDescription>
                        Set a 4-digit PIN for {staffName}.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <Input
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        inputMode="numeric"
                        placeholder="Enter 4-digit PIN"
                    />
                    <Button
                        className="w-full h-12 rounded-2xl"
                        disabled={isSubmitting || !/^\d{4}$/.test(pin)}
                        onClick={() => void handleSubmit()}
                    >
                        Save PIN
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
