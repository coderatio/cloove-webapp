"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Check,
    ArrowRight,
    Copy,
    Link as LinkIcon,
    QrCode,
    Building2,
    ChevronRight,
    ArrowLeft
} from "lucide-react"
import { cn } from "@/app/lib/utils"
import { useIsMobile } from "@/app/hooks/useMediaQuery"
import { Dialog, DialogContent, DialogTitle } from "@/app/components/ui/dialog"
import { Button } from "@/app/components/ui/button"
import {
    Drawer,
    DrawerContent,
    DrawerTitle,
} from "@/app/components/ui/drawer"
import { GlassCard } from "../ui/glass-card"

interface AddMoneyModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    walletData: {
        balance: string
    }
}

type Step = 'options' | 'transfer' | 'link' | 'qrcode'

export function AddMoneyModal({ isOpen, onOpenChange, walletData }: AddMoneyModalProps) {
    const [step, setStep] = useState<Step>('options')
    const [copied, setCopied] = useState(false)
    const isMobile = useIsMobile()

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const resetModal = () => {
        onOpenChange(false)
        setTimeout(() => setStep('options'), 300)
    }

    const ModalContent = () => (
        <div className="flex flex-col w-full h-full bg-brand-cream dark:bg-brand-deep">
            {/* Header Section */}
            <div className="relative p-8 pb-6 shrink-0 bg-brand-cream/50 dark:bg-brand-deep/50 backdrop-blur-md border-b border-brand-deep/5 dark:border-white/5">
                <div className="flex items-center gap-5">
                    {step !== 'options' && (
                        <button
                            onClick={() => setStep('options')}
                            className="p-2.5 rounded-full bg-brand-deep/5 dark:bg-white/5 hover:bg-brand-deep/10 dark:hover:bg-white/10 transition-all active:scale-95 group shrink-0"
                        >
                            <ArrowLeft className="w-5 h-5 text-brand-deep/60 dark:text-brand-cream/60 group-hover:text-brand-deep dark:group-hover:text-brand-cream" />
                        </button>
                    )}
                    <div className="space-y-1 min-w-0">
                        <DialogTitle className="text-2xl font-serif text-brand-deep dark:text-brand-cream leading-tight truncate">
                            {step === 'options' && "Add Money"}
                            {step === 'transfer' && "Bank Transfer"}
                            {step === 'link' && "Payment Link"}
                            {step === 'qrcode' && "QR Code"}
                        </DialogTitle>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                            <p className="text-xs text-brand-accent/60 dark:text-brand-cream/60 font-medium">
                                Balance: <span className="text-brand-deep dark:text-brand-cream font-bold">{walletData.balance}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-6 sm:px-8 pb-12">
                <AnimatePresence mode="wait">
                    {step === 'options' && (
                        <motion.div
                            key="options"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            <p className="text-sm text-brand-accent/60 dark:text-brand-cream/60 mb-6"> Select your preferred way to fund your business wallet. </p>

                            <FundingOption
                                icon={Building2}
                                title="Bank Transfer"
                                description="Push money from any banking app"
                                onClick={() => setStep('transfer')}
                            />
                            <FundingOption
                                icon={LinkIcon}
                                title="Payment Link"
                                description="Share a link for customers to pay"
                                onClick={() => setStep('link')}
                            />
                            <FundingOption
                                icon={QrCode}
                                title="QR Code"
                                description="Instant payment via scan"
                                onClick={() => setStep('qrcode')}
                            />
                        </motion.div>
                    )}

                    {step === 'transfer' && (
                        <motion.div
                            key="transfer"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <GlassCard className="p-6 space-y-6 border-brand-green/10">
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase tracking-widest text-brand-accent/40 font-bold">Bank Name</p>
                                    <p className="text-lg font-serif text-brand-deep dark:text-brand-cream">Wema Bank (Cloove Virtual)</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase tracking-widest text-brand-accent/40 font-bold">Account Number</p>
                                    <div className="flex items-center justify-between">
                                        <p className="text-2xl font-mono font-bold text-brand-deep dark:text-brand-cream tracking-widest">0123456789</p>
                                        <button
                                            onClick={() => handleCopy("0123456789")}
                                            className="p-2 rounded-xl bg-brand-deep/5 dark:bg-white/10 hover:bg-brand-deep/10 text-brand-deep dark:text-brand-gold transition-all"
                                        >
                                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase tracking-widest text-brand-accent/40 font-bold">Account Name</p>
                                    <p className="text-sm font-medium text-brand-deep dark:text-brand-cream">CLVE / ADEBAYO TEXTILES</p>
                                </div>
                            </GlassCard>
                            <div className="p-4 rounded-xl bg-brand-green/5 border border-brand-green/10">
                                <p className="text-xs text-brand-green leading-relaxed"> Transferred funds typically reflect within <span className="font-bold">2-5 minutes</span>. Bank network delays may apply. </p>
                            </div>
                            <Button onClick={resetModal} className="w-full h-14 rounded-2xl bg-brand-deep dark:bg-brand-gold text-brand-gold dark:text-brand-deep font-bold"> Done </Button>
                        </motion.div>
                    )}

                    {step === 'link' && (
                        <motion.div
                            key="link"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <GlassCard className="p-8 text-center space-y-6">
                                <div className="w-16 h-16 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green mx-auto">
                                    <LinkIcon className="w-8 h-8" />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-lg font-serif text-brand-deep dark:text-brand-cream">clove.me/adebayo-textiles</h4>
                                    <p className="text-xs text-brand-accent/60 dark:text-brand-cream/60">Your reusable payment link for easy funding.</p>
                                </div>
                                <Button
                                    onClick={() => handleCopy("https://clove.me/adebayo-textiles")}
                                    className="w-full rounded-full bg-brand-deep dark:bg-brand-gold text-brand-gold dark:text-brand-deep"
                                >
                                    {copied ? "Copied!" : "Copy Link"}
                                </Button>
                            </GlassCard>
                        </motion.div>
                    )}

                    {step === 'qrcode' && (
                        <motion.div
                            key="qrcode"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <GlassCard className="p-8 text-center space-y-6">
                                <div className="w-48 h-48 bg-white p-4 rounded-2xl mx-auto shadow-inner">
                                    <div className="w-full h-full bg-[url('https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=CloveWallet_0123456789')] bg-contain" />
                                </div>
                                <p className="text-xs text-brand-accent/60 dark:text-brand-cream/60 max-w-[200px] mx-auto leading-relaxed"> Customers or staff can scan this code using any banking app to pay you instantly. </p>
                                <Button className="w-full rounded-full border-brand-deep/10"> Save to Gallery </Button>
                            </GlassCard>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )

    if (isMobile) {
        return (
            <Drawer open={isOpen} onOpenChange={onOpenChange}>
                <DrawerContent className="p-0 overflow-hidden outline-none">
                    <ModalContent />
                </DrawerContent>
            </Drawer>
        )
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-brand-cream/95 dark:bg-brand-deep/95 backdrop-blur-2xl border border-white/20 dark:border-white/5 shadow-2xl p-0 overflow-hidden sm:rounded-[40px]">
                <ModalContent />
            </DialogContent>
        </Dialog>
    )
}

function FundingOption({ icon: Icon, title, description, onClick }: { icon: any, title: string, description: string, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-brand-deep/5 dark:border-white/5 hover:border-brand-green/20 dark:hover:border-white/10 transition-all active:scale-[0.98] group"
        >
            <div className="w-12 h-12 rounded-xl bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center text-brand-deep/60 dark:text-brand-cream/60 group-hover:bg-brand-green/10 group-hover:text-brand-green transition-colors">
                <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1 text-left">
                <p className="font-bold font-serif text-brand-deep dark:text-brand-cream">{title}</p>
                <p className="text-[10px] font-medium text-brand-accent/40 dark:text-brand-cream/40 uppercase tracking-wider">{description}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-brand-accent/20 dark:text-white/20 group-hover:text-brand-green transition-colors" />
        </button>
    )
}
