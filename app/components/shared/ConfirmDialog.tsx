"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon as AlertTriangle, Loading03Icon as Loader2 } from "@hugeicons/core-free-icons"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/app/components/ui/base-dialog"
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
    isLoading = false,
}: ConfirmDialogProps) {
    const isDestructive = variant === "destructive"

    const handleOpenChange = (next: boolean) => {
        if (isLoading) return
        onOpenChange(next)
    }

    const handleConfirm = async () => {
        try {
            await onConfirm()
            onOpenChange(false)
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className="max-w-[420px] gap-0 overflow-hidden p-0 rounded-3xl"
                hideClose={isLoading}
            >
                <div className="bg-white px-8 pt-8 pb-6 dark:bg-transparent">
                    <DialogHeader className="space-y-4 p-0">
                        <div className="flex items-start gap-4">
                            <div
                                className={cn(
                                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                                    isDestructive
                                        ? "bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-400"
                                        : "bg-brand-gold/10 text-brand-gold dark:bg-brand-gold/15",
                                )}
                                aria-hidden
                            >
                                <HugeiconsIcon icon={AlertTriangle} className="h-5 w-5" strokeWidth={2} />
                            </div>

                            <div className="min-w-0 space-y-1.5 pt-0.5">
                                <DialogTitle className="text-xl font-semibold leading-snug tracking-tight">
                                    {title}
                                </DialogTitle>
                                <DialogDescription className="text-sm leading-relaxed">
                                    {description}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <DialogFooter className="flex-col! gap-2.5 border-t border-brand-deep/10 bg-surface-alt px-8 py-4 dark:border-white/10 dark:bg-white/[0.03] sm:flex-row! sm:justify-end max-sm:[&>button]:w-full">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={isLoading}
                        className="h-10 rounded-xl border-brand-deep/12 bg-white px-5 font-medium text-brand-deep/80 shadow-sm hover:bg-brand-deep/4 hover:text-brand-deep dark:border-white/12 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08] dark:hover:text-slate-50"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        type="button"
                        variant="default"
                        onClick={() => void handleConfirm()}
                        disabled={isLoading}
                        className={cn(
                            "h-10 min-w-30 rounded-xl px-5 font-medium shadow-sm",
                            isDestructive
                                ? "bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500"
                                : "bg-brand-deep text-brand-gold hover:bg-brand-deep/90 dark:bg-brand-gold-700 dark:text-white dark:hover:bg-brand-gold-800",
                        )}
                    >
                        {isLoading ? (
                            <HugeiconsIcon icon={Loader2} className="h-4 w-4 animate-spin" />
                        ) : (
                            confirmText
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
