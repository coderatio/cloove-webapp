"use client"

import { useState } from "react"
import { Clipboard, Copy, Eye, EyeOff, Loader2, Lock, ShieldCheck } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/app/components/ui/base-dialog"
import { apiClient } from "@/app/lib/api-client"
import { toast } from "sonner"

interface RevealedExtra {
    label: string
    value: string
    copyLabel?: string
}

interface PasswordConfirmDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    title?: string
    description?: string
    /** When set, the dialog switches to "reveal" mode showing this value after password verification */
    revealedValue?: string | null
    /** Optional secondary value shown alongside the main revealed value (e.g. public key) */
    revealedExtra?: RevealedExtra
    revealTitle?: string
    revealDescription?: string
}

export function PasswordConfirmDialog({
    open,
    onOpenChange,
    onSuccess,
    title = "Confirm your password",
    description = "Enter your account password to view this secret.",
    revealedValue,
    revealedExtra,
    revealTitle = "Secret revealed",
    revealDescription = "Copy this secret now. It will not be shown again after you close this dialog.",
}: PasswordConfirmDialogProps) {
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isVerifying, setIsVerifying] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    function reset() {
        setPassword("")
        setShowPassword(false)
        setError(null)
        setCopied(false)
    }

    async function handleSubmit() {
        if (!password.trim()) {
            setError("Password is required")
            return
        }

        setIsVerifying(true)
        setError(null)

        try {
            await apiClient.post("/security/verify-password", { password: password.trim() })
            toast.success("Identity verified")
            onSuccess()
            reset()
        } catch (err: any) {
            setError(err.message || "Incorrect password")
        } finally {
            setIsVerifying(false)
        }
    }

    async function copyValue() {
        if (!revealedValue) return
        try {
            await navigator.clipboard.writeText(revealedValue)
            setCopied(true)
            toast.success("Copied to clipboard")
        } catch {
            toast.error("Failed to copy")
        }
    }

    async function copyExtra() {
        if (!revealedExtra) return
        try {
            await navigator.clipboard.writeText(revealedExtra.value)
            toast.success("Copied to clipboard")
        } catch {
            toast.error("Failed to copy")
        }
    }

    function handleClose() {
        reset()
        onOpenChange(false)
    }

    const showReveal = revealedValue !== undefined && revealedValue !== null

    return (
        <Dialog open={open} onOpenChange={(next) => { if (!next) handleClose(); else onOpenChange(next) }}>
            <DialogContent className="max-w-md gap-0 p-0">
                {showReveal ? (
                    <>
                        <DialogHeader className="px-6 pt-6 pb-3 sm:px-7 sm:pt-7">
                            <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
                                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                                {revealTitle}
                            </DialogTitle>
                            <DialogDescription className="mt-2 text-sm leading-6">
                                {revealDescription}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 px-6 py-4 sm:px-7">
                            {revealedExtra && (
                                <div className="rounded-3xl border border-brand-deep/6 bg-white/50 p-4 dark:border-white/8 dark:bg-white/[0.025]">
                                    <p className="text-xs font-semibold text-muted-foreground mb-2">{revealedExtra.label}</p>
                                    <code className="block break-all rounded-2xl bg-background p-3 text-xs font-mono leading-relaxed">
                                        {revealedExtra.value}
                                    </code>
                                    <Button
                                        className="mt-3 h-10 rounded-2xl px-4"
                                        variant="outline"
                                        onClick={() => void copyExtra()}
                                    >
                                        <Copy className="mr-2 h-4 w-4" />
                                        {revealedExtra.copyLabel ?? "Copy"}
                                    </Button>
                                </div>
                            )}
                            <div className="rounded-3xl border border-amber-500/25 bg-amber-500/8 p-4">
                                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-2">Secret key</p>
                                <code className="block break-all rounded-2xl bg-background p-3 text-xs font-mono leading-relaxed">
                                    {revealedValue}
                                </code>
                                <Button
                                    className="mt-3 h-10 rounded-2xl px-4"
                                    variant="outline"
                                    onClick={() => void copyValue()}
                                >
                                    {copied ? (
                                        <><Clipboard className="mr-2 h-4 w-4" /> Copied</>
                                    ) : (
                                        <><Copy className="mr-2 h-4 w-4" /> Copy secret</>
                                    )}
                                </Button>
                            </div>
                        </div>
                        <DialogFooter className="border-t border-brand-deep/6 px-6 pt-3 pb-6 dark:border-white/8 sm:px-7">
                            <Button
                                className="h-10 rounded-2xl px-5"
                                onClick={handleClose}
                            >
                                Done
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        <DialogHeader className="px-6 pt-6 pb-3 sm:px-7 sm:pt-7">
                            <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
                                <Lock className="h-5 w-5 text-muted-foreground" />
                                {title}
                            </DialogTitle>
                            <DialogDescription className="mt-2 text-sm leading-6">
                                {description}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="px-6 py-4 sm:px-7">
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setError(null) }}
                                    placeholder="Enter your password"
                                    className="h-11 rounded-xl pr-10 text-sm"
                                    autoFocus
                                    onKeyDown={(e) => { if (e.key === "Enter") void handleSubmit() }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {error && (
                                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
                            )}
                        </div>
                        <DialogFooter className="border-t border-brand-deep/6 px-6 pt-3 pb-6 dark:border-white/8 sm:px-7">
                            <Button
                                variant="outline"
                                className="h-10 rounded-2xl px-5"
                                onClick={handleClose}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="h-10 rounded-2xl px-5"
                                disabled={isVerifying || !password.trim()}
                                onClick={() => void handleSubmit()}
                            >
                                {isVerifying ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                )}
                                Confirm
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
