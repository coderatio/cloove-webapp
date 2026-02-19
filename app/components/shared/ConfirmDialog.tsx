"use client"

import * as React from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/app/components/ui/dialog"
import { Button } from "@/app/components/ui/button"
import { cn } from "@/app/lib/utils"

interface ConfirmDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => Promise<void> | void
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    variant?: "destructive" | "primary"
    isLoading?: boolean
}

export function ConfirmDialog({
    open,
    onOpenChange,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "destructive",
    isLoading = false
}: ConfirmDialogProps) {
    const isDestructive = variant === "destructive"

    const handleConfirm = async () => {
        try {
            await onConfirm()
            onOpenChange(false)
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[400px] p-0 overflow-hidden border-brand-deep/5 dark:border-white/5 bg-white dark:bg-brand-deep-800 backdrop-blur-2xl rounded-3xl! shadow-2xl">
                <div className="p-8 space-y-6">
                    <DialogHeader className="space-y-4">
                        <div className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center mx-auto sm:mx-0 transition-transform duration-500",
                            isDestructive
                                ? "bg-rose-500/10 text-rose-500 dark:bg-rose-500/20"
                                : "bg-brand-gold/10 text-brand-gold dark:bg-brand-gold/20"
                        )}>
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div className="space-y-2 text-center sm:text-left">
                            <DialogTitle className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream">
                                {title}
                            </DialogTitle>
                            <DialogDescription className="text-sm text-brand-deep/60 dark:text-brand-cream/60 leading-relaxed italic">
                                {description}
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                            className="flex-1 h-12 rounded-2xl border-brand-deep/5 dark:border-white/10 text-brand-deep/40 dark:text-brand-cream/40 hover:bg-brand-deep/5 dark:hover:bg-white/5 font-bold uppercase tracking-widest text-[10px] transition-all"
                        >
                            {cancelText}
                        </Button>
                        <Button
                            variant={isDestructive ? "destructive" : "default"}
                            onClick={handleConfirm}
                            disabled={isLoading}
                            className={cn(
                                "flex-1 h-12 rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-xl transition-all",
                                isDestructive
                                    ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20"
                                    : "bg-brand-deep dark:bg-brand-gold text-brand-gold dark:text-brand-deep shadow-brand-deep/20 dark:shadow-brand-gold/20"
                            )}
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmText}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}
