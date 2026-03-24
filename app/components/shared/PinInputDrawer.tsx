"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerBody,
} from "@/app/components/ui/drawer"
import { AlertCircle, Delete, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface PinInputDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    /** Called with the entered PIN. Throw to display an error message. */
    onSubmit: (pin: string) => Promise<void>
    title?: string
    description?: string
}

const PIN_LENGTH = 4

export function PinInputDrawer({
    open,
    onOpenChange,
    onSubmit,
    title = "Enter PIN",
    description = "Enter your 4-digit transaction PIN to continue.",
}: PinInputDrawerProps) {
    const [pin, setPin] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (open) {
            setPin("")
            setError(null)
        }
    }, [open])

    const handleKeyPress = useCallback((digit: string) => {
        if (isSubmitting) return
        setPin((prev) => {
            if (prev.length < PIN_LENGTH) {
                setError(null)
                return prev + digit
            }
            return prev
        })
    }, [isSubmitting])

    const handleDelete = useCallback(() => {
        if (isSubmitting) return
        setPin((prev) => prev.slice(0, -1))
        setError(null)
    }, [isSubmitting])

    useEffect(() => {
        if (pin.length !== PIN_LENGTH || isSubmitting) return
        const run = async () => {
            setIsSubmitting(true)
            setError(null)
            try {
                await onSubmit(pin)
                onOpenChange(false)
            } catch (err: any) {
                setError(err?.message ?? "Something went wrong. Please try again.")
                setPin("")
            } finally {
                setIsSubmitting(false)
            }
        }
        run()
    }, [pin])

    const keypadDigits = ["1", "2", "3", "4", "5", "6", "7", "8", "9"]

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="bg-brand-cream dark:bg-brand-deep rounded-t-[42px] max-w-2xl mx-auto overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-brand-gold to-transparent opacity-30" />

                <DrawerStickyHeader className="pb-2 border-b-0 space-y-0">
                    <DrawerTitle className="text-xl font-serif font-medium text-center text-brand-deep dark:text-brand-cream tracking-tight">
                        {title}
                    </DrawerTitle>
                </DrawerStickyHeader>

                <DrawerBody className="p-0 flex flex-col items-center">
                    <div className="w-full px-8 pt-2 pb-6 text-center">
                        <DrawerDescription className="text-sm font-medium text-brand-deep/40 dark:text-brand-cream/40 max-w-[280px] mx-auto leading-relaxed">
                            {description}
                        </DrawerDescription>
                    </div>

                    {/* PIN dots */}
                    <div className="flex flex-col items-center gap-6 mt-4 mb-8">
                        <motion.div
                            animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
                            transition={{ duration: 0.4 }}
                            className="flex gap-4"
                        >
                            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                                <div key={i} className="relative size-16">
                                    <div className={`absolute inset-0 rounded-2xl border-2 transition-all duration-300 ${
                                        pin.length === i
                                            ? "border-brand-gold ring-4 ring-brand-gold/5 bg-white dark:bg-white/5"
                                            : pin.length > i
                                            ? "border-brand-deep dark:border-brand-cream/60 bg-brand-deep/5 dark:bg-white/5"
                                            : "border-brand-deep/5 dark:border-white/5 bg-transparent"
                                    }`} />
                                    <AnimatePresence mode="popLayout">
                                        {pin[i] && (
                                            <motion.div
                                                initial={{ scale: 0, opacity: 0, y: 10 }}
                                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                                exit={{ scale: 0, opacity: 0 }}
                                                className="absolute inset-0 flex items-center justify-center"
                                            >
                                                <div className="size-3 rounded-full bg-brand-deep dark:bg-brand-cream shadow-sm" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </motion.div>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ 
                                        opacity: 1, 
                                        y: 0, 
                                        scale: 1,
                                        x: [0, -6, 6, -6, 6, 0] 
                                    }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ 
                                        x: { duration: 0.4, ease: "easeInOut" },
                                        opacity: { duration: 0.2 },
                                        y: { duration: 0.2 }
                                    }}
                                    className="flex items-start gap-3 text-red-600 dark:text-red-400 text-[11px] font-semibold tracking-wide bg-red-500/5 dark:bg-red-500/10 px-6 py-4 rounded-[24px] border border-red-500/20 backdrop-blur-xl max-w-[340px] text-left shadow-2xl shadow-red-500/10"
                                >
                                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 opacity-80" />
                                    <span className="leading-relaxed">{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Keypad */}
                    <div className="relative w-full px-8 pb-12 max-w-sm">
                        <div className="grid grid-cols-3 gap-3">
                            {keypadDigits.map((digit) => (
                                <KeypadButton
                                    key={digit}
                                    value={digit}
                                    onClick={() => handleKeyPress(digit)}
                                    disabled={isSubmitting}
                                />
                            ))}
                            <div className="pointer-events-none opacity-0 p-6" />
                            <KeypadButton
                                value="0"
                                onClick={() => handleKeyPress("0")}
                                disabled={isSubmitting}
                            />
                            <button
                                onClick={handleDelete}
                                disabled={isSubmitting || pin.length === 0}
                                className="flex items-center justify-center p-6 rounded-3xl text-brand-deep/40 dark:text-brand-cream/40 hover:text-brand-deep dark:hover:text-brand-cream hover:bg-brand-deep/5 dark:hover:bg-white/5 transition-all active:scale-90 disabled:opacity-10"
                            >
                                <Delete className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Loading overlay on keypad */}
                        <AnimatePresence>
                            {isSubmitting && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute inset-0 rounded-3xl bg-brand-cream/80 dark:bg-brand-deep/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3"
                                >
                                    <Loader2 className="w-8 h-8 animate-spin text-brand-gold" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40">
                                        Processing...
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </DrawerBody>
            </DrawerContent>
        </Drawer>
    )
}

interface KeypadButtonProps {
    value: string
    onClick: () => void
    disabled?: boolean
}

function KeypadButton({ value, onClick, disabled }: KeypadButtonProps) {
    return (
        <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onClick}
            disabled={disabled}
            className="flex flex-col items-center justify-center p-6 rounded-[28px] bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/5 shadow-sm hover:border-brand-gold/40 hover:bg-brand-gold/5 transition-all disabled:opacity-20"
        >
            <span className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream">
                {value}
            </span>
            <span className="text-[10px] font-bold opacity-20 dark:opacity-40 uppercase tracking-widest mt-0.5">
                {getSubtext(value)}
            </span>
        </motion.button>
    )
}

function getSubtext(digit: string) {
    const map: Record<string, string> = {
        "2": "abc", "3": "def", "4": "ghi", "5": "jkl",
        "6": "mno", "7": "pqrs", "8": "tuv", "9": "wxyz", "0": "+",
    }
    return map[digit] ?? ""
}
