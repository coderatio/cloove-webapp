"use client"

import { useState } from "react"
import { Button } from "@/app/components/ui/button"
import { GlassCard } from "@/app/components/ui/glass-card"
import {
    Building2,
    MoreVertical,
    CheckCircle2,
    Trash2,
    Star,
    Plus,
    Loader2,
    Lock,
    X,
    AlertCircle,
    ArrowLeft
} from "lucide-react"
import {
    usePayoutAccounts,
    useDeletePayoutAccount,
    useSetDefaultPayoutAccount
} from "../hooks/useFinance"
import { AddPayoutAccountForm } from "./AddPayoutAccountForm"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/app/components/ui/dropdown-menu"
import { Input } from "@/app/components/ui/input"
import { cn } from "@/app/lib/utils"

interface PayoutAccountsManagerProps {
    onClose?: () => void
    showBackButton?: boolean
}

export function PayoutAccountsManager({
    onClose,
    showBackButton = true
}: PayoutAccountsManagerProps) {
    const { payoutAccounts: accounts, isLoading } = usePayoutAccounts()
    const deleteAccount = useDeletePayoutAccount()
    const setDefaultAccount = useSetDefaultPayoutAccount()

    const [isAdding, setIsAdding] = useState(false)
    const [confirmAction, setConfirmAction] = useState<{ id: string, type: 'delete' | 'default' } | null>(null)
    const [pin, setPin] = useState('')

    const handleAction = async () => {
        if (!confirmAction || pin.length !== 4) return

        if (confirmAction.type === 'delete') {
            deleteAccount.mutate({ id: confirmAction.id, pin }, {
                onSuccess: () => {
                    setConfirmAction(null)
                    setPin('')
                }
            })
        } else {
            setDefaultAccount.mutate({ id: confirmAction.id, pin }, {
                onSuccess: () => {
                    setConfirmAction(null)
                    setPin('')
                }
            })
        }
    }

    if (isAdding) {
        return (
            <div className="space-y-6">
                <AddPayoutAccountForm
                    onSuccess={() => setIsAdding(false)}
                    onCancel={() => setIsAdding(false)}
                />
            </div>
        )
    }

    const isLimitReached = accounts.length >= 3

    return (
        <div className="space-y-6 relative min-h-[400px]">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    {showBackButton && onClose && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="h-8 w-8 rounded-full bg-brand-deep/5 dark:bg-white/5 hover:bg-brand-deep/10 dark:hover:bg-white/10"
                        >
                            <ArrowLeft className="w-4 h-4 text-brand-deep/60 dark:text-brand-cream/60" />
                        </Button>
                    )}
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-accent/40 dark:text-brand-cream/80 pl-1">
                        Payout Accounts
                    </span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    disabled={isLimitReached}
                    onClick={() => setIsAdding(true)}
                    className={cn(
                        "rounded-full gap-2 border transition-all",
                        isLimitReached
                            ? "bg-brand-deep/5 text-brand-deep/20 border-transparent cursor-not-allowed"
                            : "bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20 border-brand-gold/20"
                    )}
                >
                    <Plus className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                        {isLimitReached ? "Limit Reached" : "Add New"}
                    </span>
                </Button>
            </div>

            {isLimitReached && !isAdding && (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-brand-gold/5 border border-brand-gold/10 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="w-3.5 h-3.5 text-brand-gold-900 dark:text-brand-gold" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-brand-gold-900 dark:text-brand-gold">
                        Maximum of 3 payout accounts reached.
                    </p>
                </div>
            )}

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                    <Loader2 className="w-10 h-10 animate-spin text-brand-gold/40" />
                    <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-brand-accent/40">Securing your vault...</p>
                </div>
            ) : accounts.length === 0 ? (
                <GlassCard className="p-12 flex flex-col items-center justify-center text-center space-y-4 bg-brand-deep/2 dark:bg-white/2 border-dashed border-brand-deep/10 dark:border-white/10">
                    <div className="w-16 h-16 rounded-3xl bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-brand-deep/20 dark:text-white/20" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-brand-deep dark:text-brand-cream">No payout accounts found</p>
                        <p className="text-xs text-brand-accent/40 dark:text-white/30 max-w-[200px]">Add a bank account to start receiving your business settlements.</p>
                    </div>
                    <Button
                        onClick={() => setIsAdding(true)}
                        className="mt-2 bg-brand-deep text-brand-gold dark:bg-brand-gold-400 dark:text-brand-deep font-bold rounded-xl shadow-lg!"
                    >
                        Add First Account
                    </Button>
                </GlassCard>
            ) : (
                <div className="space-y-3">
                    {accounts.map((account) => (
                        <GlassCard
                            key={account.id}
                            className={cn(
                                "group p-4 flex items-center justify-between border-brand-deep/5 hover:border-brand-gold/30 transition-all duration-500",
                                account.isDefault && "bg-brand-gold/3 border-brand-gold/20 shadow-[0_8px_30px_rgb(182,143,76,0.05)]"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                                    account.isDefault ? "bg-brand-gold-200 text-brand-deep" : "bg-brand-deep/5 dark:bg-white/5 text-brand-deep/40 dark:text-brand-cream/40"
                                )}>
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-brand-deep dark:text-brand-cream uppercase tracking-tight">{account.bankName}</p>
                                        {account.isDefault && (
                                            <span className="text-[9px] font-black bg-brand-gold-100 text-brand-deep px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Default</span>
                                        )}
                                    </div>
                                    <p className="text-xs font-mono text-brand-accent/60 dark:text-white/40">{account.accountNumber}</p>
                                    <p className="text-[10px] text-brand-accent/40 dark:text-brand-cream/80 uppercase tracking-widest">{account.accountName}</p>
                                </div>
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-brand-deep/5 dark:hover:bg-white/5">
                                        <MoreVertical className="w-4 h-4 text-brand-deep/40 dark:text-white/40" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 bg-white/90 dark:bg-brand-deep/90 backdrop-blur-xl border-brand-accent/10 rounded-2xl p-1 shadow-2xl">
                                    {!account.isDefault && (
                                        <DropdownMenuItem
                                            onClick={() => setConfirmAction({ id: account.id, type: 'default' })}
                                            className="gap-2 p-3 focus:bg-brand-gold/10 focus:text-brand-gold rounded-xl cursor-pointer"
                                        >
                                            <Star className="w-4 h-4" />
                                            <span className="text-xs font-bold uppercase tracking-wider">Set as Default</span>
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                        onClick={() => setConfirmAction({ id: account.id, type: 'delete' })}
                                        className="gap-2 p-3 focus:bg-rose-500/10 focus:text-rose-500 rounded-xl cursor-pointer text-rose-500"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Remove Account</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </GlassCard>
                    ))}
                </div>
            )}

            {/* PIN Confirmation Dialog Overlay */}
            {confirmAction && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-300">
                    <div className="absolute inset-0 bg-white/60 dark:bg-brand-deep/80 backdrop-blur-md rounded-3xl" onClick={() => setConfirmAction(null)} />
                    <GlassCard className="relative w-full max-w-xs p-6 shadow-2xl border-brand-deep/10 bg-white dark:bg-brand-deep">
                        <div className="text-center space-y-4">
                            <div className={cn(
                                "mx-auto w-12 h-12 rounded-2xl flex items-center justify-center mb-2",
                                confirmAction.type === 'delete' ? "bg-rose-500/10 text-rose-500" : "bg-brand-gold/10 text-brand-gold"
                            )}>
                                {confirmAction.type === 'delete' ? <Trash2 className="w-6 h-6" /> : <Star className="w-6 h-6" />}
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-bold text-brand-deep dark:text-brand-cream uppercase tracking-wider">
                                    {confirmAction.type === 'delete' ? 'Remove Account?' : 'Set as Default?'}
                                </h4>
                                <p className="text-[10px] text-brand-accent/40 dark:text-white/30 uppercase tracking-widest">
                                    Enter your 4-digit PIN to confirm this action.
                                </p>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-deep/20 dark:text-white/20" />
                                <Input
                                    type="password"
                                    inputMode="numeric"
                                    maxLength={4}
                                    autoFocus
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                    placeholder="••••"
                                    className="h-12 bg-brand-deep/5 dark:bg-white/5 border-transparent rounded-xl text-center pl-10 tracking-[1em] font-mono focus:ring-brand-gold/30"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    onClick={() => { setConfirmAction(null); setPin(""); }}
                                    className="flex-1 rounded-xl h-11 text-brand-deep/40 dark:text-white/40 uppercase text-[10px] font-black tracking-widest"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    disabled={pin.length !== 4 || deleteAccount.isPending || setDefaultAccount.isPending}
                                    onClick={handleAction}
                                    className={cn(
                                        "flex-1 rounded-xl h-11 font-black uppercase text-[10px] tracking-widest",
                                        confirmAction.type === 'delete' ? "bg-rose-600 text-white" : "bg-brand-gold dark:bg-brand-gold-400 dark:text-brand-deep shadow-lg"
                                    )}
                                >
                                    {(deleteAccount.isPending || setDefaultAccount.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                                </Button>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    )
}
