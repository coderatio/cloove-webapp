"use client"

import { useState } from "react"
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/app/components/ui/drawer"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Loader2, Lock } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/app/lib/utils"

interface PinVerificationDrawerProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: (pin: string) => void
    title?: string
    description?: string
    isLoading?: boolean
}

export function PinVerificationDrawer({
    isOpen,
    onOpenChange,
    onSuccess,
    title = "Verify Transaction",
    description = "Please enter your 4-digit transaction PIN to continue.",
    isLoading = false
}: PinVerificationDrawerProps) {
    const [pin, setPin] = useState(["", "", "", ""])

    const handlePinChange = (index: number, value: string) => {
        if (value.length > 1) return // Prevent multiple chars

        const newPin = [...pin]
        newPin[index] = value
        setPin(newPin)

        // Auto-focus next input
        if (value && index < 3) {
            const nextInput = document.getElementById(`pin-${index + 1}`)
            nextInput?.focus()
        }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !pin[index] && index > 0) {
            const prevInput = document.getElementById(`pin-${index - 1}`)
            prevInput?.focus()
        }
    }

    const handleSubmit = () => {
        const fullPin = pin.join("")
        if (fullPin.length !== 4) {
            toast.error("Please enter a complete 4-digit PIN")
            return
        }
        onSuccess(fullPin)
    }

    return (
        <Drawer open={isOpen} onOpenChange={onOpenChange}>
            <DrawerContent>
                <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                        <div className="mx-auto bg-brand-deep/5 dark:bg-white/5 p-3 rounded-full w-fit mb-4">
                            <Lock className="w-6 h-6 text-brand-deep dark:text-brand-cream" />
                        </div>
                        <DrawerTitle className="text-center text-xl font-serif text-brand-deep dark:text-brand-cream">
                            {title}
                        </DrawerTitle>
                        <DrawerDescription className="text-center text-brand-deep/60 dark:text-brand-cream/60">
                            {description}
                        </DrawerDescription>
                    </DrawerHeader>

                    <div className="p-4 space-y-8">
                        <div className="flex justify-center gap-4">
                            {pin.map((digit, index) => (
                                <Input
                                    key={index}
                                    id={`pin-${index}`}
                                    type="password"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handlePinChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className="w-14 h-14 text-center text-2xl font-bold rounded-2xl bg-brand-deep/5 dark:bg-white/5 border-transparent focus:border-brand-gold focus:ring-0 text-brand-deep dark:text-brand-cream"
                                />
                            ))}
                        </div>

                        <Button
                            onClick={handleSubmit}
                            disabled={isLoading || pin.some(d => !d)}
                            className="w-full h-12 bg-brand-deep hover:bg-brand-deep/90 text-brand-cream dark:bg-brand-gold dark:text-brand-deep dark:hover:bg-brand-gold/90 text-base font-medium rounded-xl"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                "Verify PIN"
                            )}
                        </Button>
                    </div>
                    <DrawerFooter className="pt-0 pb-8">
                        <Button variant="ghost" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
