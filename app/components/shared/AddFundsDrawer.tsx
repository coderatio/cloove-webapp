"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    ShieldCheck,
    Lock,
    Copy,
    Check,
    Share2,
    QrCode,
    ChevronRight,
    Building2,
    AlertCircle,
    ArrowRight,
    ArrowLeft,
    Link2,
} from "lucide-react"
import { cn } from "@/app/lib/utils"
import { Button } from "@/app/components/ui/button"
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerBody,
} from "@/app/components/ui/drawer"
import { GlassCard } from "@/app/components/ui/glass-card"
import { VisuallyHidden } from "@/app/components/ui/visually-hidden"
import { Skeleton } from "@/app/components/ui/skeleton"
import { useDepositAccounts, useWalletBalance, type DepositAccount } from "@/app/domains/finance/hooks/useFinance"
import { CurrencyDisplay } from "@/app/components/shared/CurrencyDisplay"
import { useCreateWalletPaymentLink, useWalletPaymentLink } from "@/app/domains/checkout/hooks/usePaymentLinks"
import { useBusiness } from "@/app/components/BusinessProvider"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

type DrawerView = 'method-select' | 'bank-transfer' | 'payment-link' | 'qr-code'

interface AddFundsDrawerProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    currencyCode: string
}

const viewTitles: Record<DrawerView, string> = {
    'method-select': 'Add Funds',
    'bank-transfer': 'Bank Transfer',
    'payment-link': 'Payment Link',
    'qr-code': 'QR Code',
}

export function AddFundsDrawer({ isOpen, onOpenChange, currencyCode }: AddFundsDrawerProps) {
    const { depositData, isLoading } = useDepositAccounts()
    const { wallet } = useWalletBalance()
    const { activeBusiness } = useBusiness()
    const router = useRouter()
    const [showQr, setShowQr] = React.useState<string | null>(null)
    const [activeView, setActiveView] = React.useState<DrawerView>('method-select')

    // Reset view when drawer opens
    React.useEffect(() => {
        if (isOpen) {
            setActiveView('method-select')
        }
    }, [isOpen])

    const isEligible = depositData?.isEligible ?? false
    const verificationLevel = depositData?.verificationLevel ?? 0
    const accounts = depositData?.accounts ?? []

    const handleStartVerification = () => {
        onOpenChange(false)
        setTimeout(() => router.push("/settings?tab=verification"), 300)
    }

    const showBackButton = activeView !== 'method-select' && isEligible && accounts.length > 0

    return (
        <Drawer open={isOpen} onOpenChange={onOpenChange}>
            <DrawerContent className="max-h-[92vh]">
                <VisuallyHidden>
                    <DrawerDescription>Add funds to your business wallet</DrawerDescription>
                </VisuallyHidden>
                <DrawerStickyHeader className="border-b border-brand-deep/5 dark:border-white/5">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                            {showBackButton && (
                                <button
                                    onClick={() => setActiveView('method-select')}
                                    className="h-9 w-9 rounded-xl bg-brand-deep/5 dark:bg-white/5 hover:bg-brand-deep/10 dark:hover:bg-white/10 flex items-center justify-center transition-all"
                                >
                                    <ArrowLeft className="w-4 h-4 text-brand-deep dark:text-brand-cream" />
                                </button>
                            )}
                            <div className="space-y-1">
                                <DrawerTitle className="text-xl font-serif text-brand-deep dark:text-brand-cream">
                                    {viewTitles[activeView]}
                                </DrawerTitle>
                                {wallet && (
                                    <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                                        <p className="text-xs text-brand-accent/60 dark:text-brand-cream/60 font-medium">
                                            Balance:{" "}
                                            <span className="text-brand-deep dark:text-brand-cream font-bold">
                                                <CurrencyDisplay value={wallet.balance} currency={currencyCode} />
                                            </span>
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </DrawerStickyHeader>

                <DrawerBody className="pb-12 pt-6">
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-4 max-w-md mx-auto"
                            >
                                <Skeleton className="h-6 w-48 mx-auto" />
                                <Skeleton className="h-40 w-full rounded-3xl" />
                                <Skeleton className="h-40 w-full rounded-3xl" />
                            </motion.div>
                        ) : !isEligible ? (
                            <VerificationRequiredView
                                verificationLevel={verificationLevel}
                                onStartVerification={handleStartVerification}
                            />
                        ) : accounts.length === 0 ? (
                            <NoAccountsView onStartVerification={handleStartVerification} />
                        ) : activeView === 'method-select' ? (
                            <MethodSelectView onSelect={setActiveView} />
                        ) : activeView === 'bank-transfer' ? (
                            <DepositAccountsView
                                accounts={accounts}
                                currencyCode={currencyCode}
                                showQr={showQr}
                                onToggleQr={setShowQr}
                            />
                        ) : activeView === 'payment-link' ? (
                            <PaymentLinkView businessName={activeBusiness?.name ?? 'Business'} />
                        ) : activeView === 'qr-code' ? (
                            <QrCodeView accounts={accounts} />
                        ) : null}
                    </AnimatePresence>
                </DrawerBody>
            </DrawerContent>
        </Drawer>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Method Selection View
// ─────────────────────────────────────────────────────────────────────────────

const methods = [
    {
        view: 'bank-transfer' as DrawerView,
        icon: Building2,
        title: 'Bank Transfer',
        description: 'Transfer from any bank account',
    },
    {
        view: 'payment-link' as DrawerView,
        icon: Link2,
        title: 'Payment Link',
        description: 'Share a link to receive payment',
    },
    {
        view: 'qr-code' as DrawerView,
        icon: QrCode,
        title: 'QR Code',
        description: 'Scan to pay with any banking app',
    },
]

function MethodSelectView({ onSelect }: { onSelect: (view: DrawerView) => void }) {
    return (
        <motion.div
            key="method-select"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-4 max-w-md mx-auto"
        >
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent/40 dark:text-brand-cream/40 px-1">
                Choose a Method
            </p>

            <div className="space-y-3">
                {methods.map((method, i) => (
                    <motion.div
                        key={method.view}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                    >
                        <GlassCard
                            className="p-5 cursor-pointer hover:bg-brand-deep/3 dark:hover:bg-white/3 active:scale-[0.98] transition-all border-brand-deep/5 dark:border-white/5"
                            onClick={() => onSelect(method.view)}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 flex items-center justify-center shrink-0">
                                    <method.icon className="w-6 h-6 text-brand-gold" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-base font-serif font-medium text-brand-deep dark:text-brand-cream">
                                        {method.title}
                                    </p>
                                    <p className="text-sm text-brand-accent/60 dark:text-brand-cream/60">
                                        {method.description}
                                    </p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-brand-accent/30 dark:text-brand-cream/30 shrink-0" />
                            </div>
                        </GlassCard>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Payment Link View
// ─────────────────────────────────────────────────────────────────────────────

function PaymentLinkView({ businessName }: { businessName: string }) {
    const { data: walletLink, isLoading: isLoadingLink } = useWalletPaymentLink()
    const createWalletLink = useCreateWalletPaymentLink()
    const [slug, setSlug] = React.useState('')
    const [copied, setCopied] = React.useState(false)

    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const previewUrl = `${origin}/pay/${slug}`

    const linkUrl = walletLink ? `${origin}/pay/${walletLink.reference}` : null

    const handleCreate = async () => {
        if (!slug.trim()) {
            toast.error('Please enter a link name')
            return
        }

        try {
            await createWalletLink.mutateAsync({
                slug: slug.trim(),
                title: businessName,
            })
        } catch {
            // Error is handled by the hook's onError
        }
    }

    const handleCopy = () => {
        if (!linkUrl) return
        navigator.clipboard.writeText(linkUrl)
        setCopied(true)
        toast.success('Payment link copied')
        setTimeout(() => setCopied(false), 2000)
    }

    const handleShare = async () => {
        if (!linkUrl) return
        if (navigator.share) {
            try {
                await navigator.share({ title: 'Payment Link', url: linkUrl })
            } catch {
                handleCopy()
            }
        } else {
            handleCopy()
        }
    }

    // Loading state
    if (isLoadingLink) {
        return (
            <motion.div
                key="payment-link-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4 max-w-md mx-auto"
            >
                <Skeleton className="h-6 w-48 mx-auto" />
                <Skeleton className="h-40 w-full rounded-3xl" />
            </motion.div>
        )
    }

    // Link exists — show it
    if (walletLink && linkUrl) {
        return (
            <motion.div
                key="payment-link-existing"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="flex flex-col items-center text-center max-w-md mx-auto space-y-6"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                    className="w-20 h-20 rounded-3xl bg-brand-green/10 flex items-center justify-center"
                >
                    <Link2 className="w-10 h-10 text-brand-green" />
                </motion.div>

                <div className="space-y-2">
                    <h3 className="text-xl font-serif font-medium text-brand-deep dark:text-brand-cream">
                        Your Payment Link
                    </h3>
                    <p className="text-sm text-brand-accent/60 dark:text-brand-cream/60">
                        Share this link to receive payments
                    </p>
                </div>

                <div className="w-full bg-brand-deep/5 dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 rounded-2xl p-3 break-all text-sm text-brand-deep/70 dark:text-white/70 font-mono">
                    {linkUrl}
                </div>

                <div className="flex gap-3 w-full">
                    <Button
                        onClick={handleCopy}
                        className="flex-1 h-12 rounded-2xl bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep hover:bg-brand-deep/90 dark:hover:bg-brand-gold/90 font-semibold gap-2"
                    >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? "Copied" : "Copy"}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleShare}
                        className="flex-1 h-12 rounded-2xl font-semibold gap-2"
                    >
                        <Share2 className="w-4 h-4" />
                        Share
                    </Button>
                </div>
            </motion.div>
        )
    }

    // No link — show creation form
    return (
        <motion.div
            key="payment-link-form"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-6 max-w-md mx-auto"
        >
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent/40 dark:text-brand-cream/40 px-1">
                Create Payment Link
            </p>

            <GlassCard className="p-6 space-y-5 border-brand-deep/5 dark:border-white/5">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-deep dark:text-brand-cream">
                        Link Name
                    </label>
                    <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        placeholder="my-business"
                        className="w-full h-12 rounded-2xl bg-brand-deep/5 dark:bg-white/5 border border-brand-deep/10 dark:border-white/10 px-4 text-brand-deep dark:text-brand-cream placeholder:text-brand-accent/30 dark:placeholder:text-brand-cream/30 focus:outline-none focus:ring-2 focus:ring-brand-gold/30 transition-all"
                    />
                    <p className="text-xs text-brand-accent/50 dark:text-brand-cream/50">
                        Choose a unique name for your payment link
                    </p>
                </div>

                {slug && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="overflow-hidden"
                    >
                        <div className="bg-brand-deep/5 dark:bg-white/5 rounded-2xl p-3 break-all text-sm font-mono text-brand-accent/60 dark:text-brand-cream/60">
                            {previewUrl}
                        </div>
                    </motion.div>
                )}

                <Button
                    onClick={handleCreate}
                    disabled={!slug.trim() || createWalletLink.isPending}
                    className="w-full h-14 rounded-2xl bg-brand-gold text-brand-deep font-bold text-base shadow-xl shadow-brand-gold/20 hover:bg-brand-gold/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {createWalletLink.isPending ? 'Creating...' : 'Create Payment Link'}
                </Button>
            </GlassCard>
        </motion.div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// QR Code View
// ─────────────────────────────────────────────────────────────────────────────

function QrCodeView({ accounts }: { accounts: DepositAccount[] }) {
    const accountsWithQr = accounts.filter(a => a.qrCodeUrl)

    if (accountsWithQr.length === 0) {
        return (
            <motion.div
                key="qr-empty"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="flex flex-col items-center text-center max-w-md mx-auto space-y-6 py-8"
            >
                <div className="w-20 h-20 rounded-3xl bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center">
                    <QrCode className="w-10 h-10 text-brand-accent/30 dark:text-brand-cream/30" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-serif font-medium text-brand-deep dark:text-brand-cream">
                        No QR Codes Available
                    </h3>
                    <p className="text-sm text-brand-accent/60 dark:text-brand-cream/60 leading-relaxed max-w-[280px] mx-auto">
                        QR code payments are not yet available for your deposit accounts. Try bank transfer instead.
                    </p>
                </div>
            </motion.div>
        )
    }

    return (
        <motion.div
            key="qr-codes"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-6 max-w-md mx-auto"
        >
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent/40 dark:text-brand-cream/40 px-1">
                Scan to Pay
            </p>

            <div className="space-y-4">
                {accountsWithQr.map((account, index) => (
                    <motion.div
                        key={account.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <GlassCard className="p-6 space-y-5 border-brand-deep/5 dark:border-white/5">
                            {/* Bank Name Header */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-brand-accent/40 dark:text-brand-cream/60" />
                                </div>
                                <p className="text-base font-serif font-medium text-brand-deep dark:text-brand-cream">
                                    {account.bankName}
                                </p>
                            </div>

                            {/* Large QR Code */}
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-56 h-56 bg-white p-4 rounded-3xl shadow-inner">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={account.qrCodeUrl}
                                        alt={`QR Code for ${account.bankName}`}
                                        className="w-full h-full"
                                    />
                                </div>

                                {/* Account Number */}
                                <p className="text-lg font-mono font-bold text-brand-deep dark:text-brand-cream tracking-widest">
                                    {account.accountNumber}
                                </p>

                                <p className="text-xs text-brand-accent/50 dark:text-brand-cream/50 text-center">
                                    Scan with any banking app to pay instantly
                                </p>
                            </div>
                        </GlassCard>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Verification Required State
// ─────────────────────────────────────────────────────────────────────────────

function VerificationRequiredView({
    verificationLevel,
    onStartVerification,
}: {
    verificationLevel: number
    onStartVerification: () => void
}) {
    const benefits = [
        "Dedicated bank account for your business",
        "Receive bank transfers directly",
        "QR code payments from any banking app",
    ]

    return (
        <motion.div
            key="verification"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex flex-col items-center text-center max-w-md mx-auto space-y-8"
        >
            {/* Shield Icon */}
            <div className="relative">
                <div className="w-24 h-24 rounded-3xl bg-brand-gold/10 flex items-center justify-center">
                    <ShieldCheck className="w-12 h-12 text-brand-gold" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-brand-deep dark:bg-brand-cream flex items-center justify-center shadow-lg">
                    <Lock className="w-5 h-5 text-brand-gold dark:text-brand-deep" />
                </div>
            </div>

            {/* Heading */}
            <div className="space-y-3">
                <h3 className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream">
                    Verification Required
                </h3>
                <p className="text-sm text-brand-accent/60 dark:text-brand-cream/60 leading-relaxed max-w-[300px] mx-auto">
                    Complete Level 1 verification to unlock your deposit account and start receiving funds.
                </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full space-y-2">
                <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-brand-accent/40 dark:text-brand-cream/40 uppercase tracking-widest">
                        Level {verificationLevel} of 3
                    </span>
                    <span className="text-brand-gold font-medium">
                        {Math.round((verificationLevel / 3) * 100)}%
                    </span>
                </div>
                <div className="h-2 rounded-full bg-brand-deep/5 dark:bg-white/5 overflow-hidden">
                    <motion.div
                        className="h-full rounded-full bg-linear-to-r from-brand-gold/60 to-brand-gold"
                        initial={{ width: 0 }}
                        animate={{ width: `${(verificationLevel / 3) * 100}%` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                    />
                </div>
            </div>

            {/* Benefits */}
            <GlassCard className="w-full p-6 space-y-4 border-brand-gold/10 bg-brand-gold/2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent/40 dark:text-brand-cream/40">
                    What Level 1 Unlocks
                </p>
                <div className="space-y-3">
                    {benefits.map((benefit, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + i * 0.1 }}
                            className="flex items-start gap-3"
                        >
                            <div className="w-5 h-5 rounded-md bg-brand-gold/10 flex items-center justify-center shrink-0 mt-0.5">
                                <Check className="w-3 h-3 text-brand-gold" />
                            </div>
                            <p className="text-sm text-brand-deep/80 dark:text-brand-cream/80 text-left leading-snug">
                                {benefit}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </GlassCard>

            {/* CTA */}
            <Button
                onClick={onStartVerification}
                className="w-full h-14 rounded-2xl bg-brand-gold text-brand-deep font-bold text-base shadow-xl shadow-brand-gold/20 hover:bg-brand-gold/90 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
                Start Verification
                <ArrowRight className="w-5 h-5" />
            </Button>
        </motion.div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// No Accounts (verified but no deposit account found — edge case)
// ─────────────────────────────────────────────────────────────────────────────

function NoAccountsView({ onStartVerification }: { onStartVerification: () => void }) {
    return (
        <motion.div
            key="no-accounts"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex flex-col items-center text-center max-w-md mx-auto space-y-6 py-8"
        >
            <div className="w-20 h-20 rounded-3xl bg-amber-500/10 flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-amber-500" />
            </div>
            <div className="space-y-2">
                <h3 className="text-xl font-serif font-medium text-brand-deep dark:text-brand-cream">
                    No Deposit Account
                </h3>
                <p className="text-sm text-brand-accent/60 dark:text-brand-cream/60 leading-relaxed max-w-[280px] mx-auto">
                    Your verification is complete but no deposit account was created. Please contact support or retry verification.
                </p>
            </div>
            <Button
                onClick={onStartVerification}
                variant="outline"
                className="h-12 rounded-2xl border-brand-deep/10 dark:border-white/10 px-6"
            >
                Go to Settings
                <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
        </motion.div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Deposit Accounts List (verified + accounts exist)
// ─────────────────────────────────────────────────────────────────────────────

function DepositAccountsView({
    accounts,
    currencyCode,
    showQr,
    onToggleQr,
}: {
    accounts: DepositAccount[]
    currencyCode: string
    showQr: string | null
    onToggleQr: (id: string | null) => void
}) {
    return (
        <motion.div
            key="accounts"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-6 max-w-md mx-auto"
        >
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent/40 dark:text-brand-cream/40 px-1">
                Your Deposit Accounts
            </p>

            <div className="space-y-4">
                {accounts.map((account, index) => (
                    <DepositAccountCard
                        key={account.id}
                        account={account}
                        index={index}
                        showQr={showQr === account.id}
                        onToggleQr={() =>
                            onToggleQr(showQr === account.id ? null : account.id)
                        }
                    />
                ))}
            </div>

            {/* Info Banner */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="p-4 rounded-2xl bg-brand-green/5 dark:bg-brand-gold/5 border border-brand-green/10 dark:border-brand-gold/10"
            >
                <p className="text-xs text-brand-green dark:text-brand-gold/80 leading-relaxed text-center">
                    Transferred funds typically reflect within{" "}
                    <span className="font-bold">2-5 minutes</span>. Bank network delays may apply.
                </p>
            </motion.div>
        </motion.div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Individual Account Card
// ─────────────────────────────────────────────────────────────────────────────

function DepositAccountCard({
    account,
    index,
    showQr,
    onToggleQr,
}: {
    account: DepositAccount
    index: number
    showQr: boolean
    onToggleQr: () => void
}) {
    const [copiedField, setCopiedField] = React.useState<string | null>(null)

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text)
        setCopiedField(field)
        toast.success(`${field} copied to clipboard`)
        setTimeout(() => setCopiedField(null), 2000)
    }

    const handleShare = async () => {
        const shareText = `Bank: ${account.bankName}\nAccount Number: ${account.accountNumber}\nAccount Name: ${account.accountName}`

        if (navigator.share) {
            try {
                await navigator.share({
                    title: "Bank Transfer Details",
                    text: shareText,
                })
            } catch {
                // User cancelled or share API failed — fallback to copy
                navigator.clipboard.writeText(shareText)
                toast.success("Account details copied to clipboard")
            }
        } else {
            navigator.clipboard.writeText(shareText)
            toast.success("Account details copied to clipboard")
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
        >
            <GlassCard className="p-6 space-y-5 border-brand-green/10 dark:border-brand-gold/10 bg-white/50 dark:bg-white/2">
                {/* Bank Name */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-brand-accent/40 dark:text-brand-cream/60" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40">
                                Bank Name
                            </p>
                            <p className="text-base font-serif font-medium text-brand-deep dark:text-brand-cream">
                                {account.bankName}
                            </p>
                        </div>
                    </div>
                    {account.provider && (
                        <span className="text-[9px] px-2 py-1 rounded-full bg-brand-deep/5 dark:bg-white/5 text-brand-accent/40 dark:text-brand-cream/40 font-bold uppercase tracking-wider">
                            {account.provider}
                        </span>
                    )}
                </div>

                {/* Account Number */}
                <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40">
                        Account Number
                    </p>
                    <div className="flex items-center justify-between">
                        <p className="text-2xl font-mono font-bold text-brand-deep dark:text-brand-cream tracking-widest">
                            {account.accountNumber}
                        </p>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopy(account.accountNumber, "Account number")}
                            className="h-9 w-9 rounded-xl bg-brand-deep/5 dark:bg-white/5 hover:bg-brand-deep/10 dark:hover:bg-white/10 transition-all"
                        >
                            {copiedField === "Account number" ? (
                                <Check className="w-4 h-4 text-brand-green" />
                            ) : (
                                <Copy className="w-4 h-4" />
                            )}
                        </Button>
                    </div>
                </div>

                {/* Account Name */}
                <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40">
                        Account Name
                    </p>
                    <p className="text-sm font-medium text-brand-deep dark:text-brand-cream">
                        {account.accountName}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2 border-t border-brand-deep/5 dark:border-white/5">
                    <Button
                        variant="ghost"
                        onClick={() => handleCopy(
                            `${account.bankName} | ${account.accountNumber} | ${account.accountName}`,
                            "Details"
                        )}
                        className="flex-1 h-10 rounded-xl bg-brand-deep/5 dark:bg-white/5 hover:bg-brand-deep/10 dark:hover:bg-white/10 text-xs font-bold uppercase tracking-wider"
                    >
                        {copiedField === "Details" ? (
                            <Check className="w-3.5 h-3.5 mr-2 text-brand-green" />
                        ) : (
                            <Copy className="w-3.5 h-3.5 mr-2" />
                        )}
                        Copy All
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={handleShare}
                        className="flex-1 h-10 rounded-xl bg-brand-deep/5 dark:bg-white/5 hover:bg-brand-deep/10 dark:hover:bg-white/10 text-xs font-bold uppercase tracking-wider"
                    >
                        <Share2 className="w-3.5 h-3.5 mr-2" />
                        Share
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={onToggleQr}
                        className={cn(
                            "h-10 w-10 rounded-xl transition-all",
                            showQr
                                ? "bg-brand-gold/10 text-brand-gold"
                                : "bg-brand-deep/5 dark:bg-white/5 hover:bg-brand-deep/10 dark:hover:bg-white/10"
                        )}
                    >
                        <QrCode className="w-4 h-4" />
                    </Button>
                </div>

                {/* QR Code (expandable) */}
                <AnimatePresence>
                    {showQr && account.qrCodeUrl && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-4 border-t border-brand-deep/5 dark:border-white/5 flex flex-col items-center gap-3">
                                <div className="w-44 h-44 bg-white p-3 rounded-2xl shadow-inner">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={account.qrCodeUrl}
                                        alt="QR Code for bank transfer"
                                        className="w-full h-full"
                                    />
                                </div>
                                <p className="text-[10px] text-brand-accent/40 dark:text-brand-cream/40 text-center max-w-[200px] leading-relaxed">
                                    Scan with any banking app to pay instantly
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </GlassCard>
        </motion.div>
    )
}
