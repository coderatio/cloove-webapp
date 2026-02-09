"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ShieldCheck, ScanFace, Check, ArrowRight, Wallet, Shield, Fingerprint, Lock, Star } from "lucide-react"
import { cn } from "@/app/lib/utils"
import { useIsMobile } from "@/app/hooks/useMediaQuery"
import { Dialog, DialogContent, DialogTitle } from "@/app/components/ui/dialog"
import { Button } from "@/app/components/ui/button"
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from "@/app/components/ui/drawer"

interface VerificationModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onComplete: () => void
}

export function VerificationModal({ isOpen, onOpenChange, onComplete }: VerificationModalProps) {
    const [step, setStep] = useState<'intro' | 'bvn' | 'scanning' | 'success'>('intro')
    const [progress, setProgress] = useState(0)
    const [bvn, setBvn] = useState("")

    const startVerification = () => {
        setStep('bvn')
    }

    const handleBvnSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (bvn.length === 11) {
            setStep('scanning')
            // Simulate progress
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval)
                        return 100
                    }
                    return prev + 2
                })
            }, 40)

            // Simulate a 2.5s verification process
            setTimeout(() => {
                setStep('success')
            }, 2500)
        }
    }

    const isMobile = useIsMobile()

    const handleComplete = () => {
        onComplete()
        setTimeout(() => {
            onOpenChange(false)
            // Reset step after closing animation
            setTimeout(() => {
                setStep('intro')
                setProgress(0)
                setBvn("")
            }, 300)
        }, 800)
    }

    const innerContent = (
        <div className="flex flex-col w-full h-full bg-brand-cream dark:bg-brand-deep">
            {/* Visual Header - Holographic Effect */}
            <div className="relative h-56 sm:h-64 bg-brand-deep flex items-center justify-center overflow-hidden shrink-0">
                {/* Mobile Drawer Handle */}
                <div className="absolute top-4 left-0 right-0 z-30 flex justify-center sm:hidden">
                    <div className="h-1.5 w-16 rounded-full bg-white/20 backdrop-blur-sm" />
                </div>

                {/* Animated Glow Blobs */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                        x: [0, 20, 0],
                        y: [0, -20, 0]
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-10 -right-10 w-64 h-64 bg-brand-gold/30 rounded-full blur-[80px]"
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        opacity: [0.2, 0.4, 0.2],
                        x: [0, -30, 0],
                        y: [0, 20, 0]
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -bottom-10 -left-10 w-64 h-64 bg-brand-green/40 rounded-full blur-[80px]"
                />

                {/* Pattern Overlay */}
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none" />

                <AnimatePresence mode="wait">
                    {(step === 'intro' || step === 'bvn') && (
                        <motion.div
                            key="intro-icon"
                            initial={{ scale: 0.8, opacity: 0, x: -20 }}
                            animate={{ scale: 1, opacity: 1, x: 0 }}
                            exit={{ scale: 0.8, opacity: 0, x: 20 }}
                            className="relative z-10"
                        >
                            <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center backdrop-blur-xl border border-white/20 shadow-2xl relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-brand-gold/20 to-transparent rounded-[2.5rem]" />
                                <Wallet className="w-10 h-10 text-brand-gold relative z-10" />
                            </div>
                        </motion.div>
                    )}
                    {step === 'scanning' && (
                        <motion.div
                            key="scanning-icon"
                            initial={{ scale: 0.8, opacity: 0, x: -20 }}
                            animate={{ scale: 1, opacity: 1, x: 0 }}
                            exit={{ scale: 0.8, opacity: 0, x: 20 }}
                            className="relative z-10 w-32 h-32 flex items-center justify-center"
                        >
                            <div className="absolute inset-0 border-2 border-white/10 rounded-full" />
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 border-t-2 border-brand-gold rounded-full"
                            />
                            <Fingerprint className="w-12 h-12 text-brand-gold/80 animate-pulse" />

                            {/* Scan Line */}
                            <motion.div
                                className="absolute left-4 right-4 h-0.5 bg-brand-gold shadow-[0_0_15px_rgba(212,175,55,1)] z-20"
                                animate={{ top: ["20%", "80%", "20%"] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            />
                        </motion.div>
                    )}
                    {step === 'success' && (
                        <motion.div
                            key="success-icon"
                            initial={{ scale: 0, rotate: -180, x: -20 }}
                            animate={{ scale: 1, rotate: 0, x: 0 }}
                            exit={{ scale: 0.8, opacity: 0, x: 20 }}
                            className="relative z-10"
                        >
                            <div className="w-24 h-24 bg-brand-green rounded-full flex items-center justify-center border-8 border-brand-cream shadow-[0_0_40px_rgba(11,61,46,0.5)]">
                                <Check className="w-12 h-12 text-brand-cream stroke-[3px]" />
                            </div>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: [0, 1.5, 0] }}
                                transition={{ duration: 0.8 }}
                                className="absolute inset-0 bg-brand-gold rounded-full blur-xl"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Content Body - Staggered Journey */}
            <div className="px-8 pt-8 pb-12 text-center space-y-8 overflow-y-auto">
                {/* Journey Progress Dots */}
                <div className="flex justify-center gap-3">
                    {['intro', 'bvn', 'scanning', 'success'].map((s, idx) => (
                        <div
                            key={s}
                            className={cn(
                                "h-1.5 rounded-full transition-all duration-500",
                                step === s ? "w-8 bg-brand-gold" : "w-1.5 bg-brand-deep/10 dark:bg-white/10"
                            )}
                        />
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {step === 'intro' && (
                        <motion.div
                            key="intro-content"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="space-y-4">
                                <h3 className="text-4xl font-serif text-brand-deep dark:text-brand-cream font-medium tracking-tight">
                                    Unlock Your <span className="italic text-brand-gold underline decoration-brand-gold/30 underline-offset-8">Wallet</span>
                                </h3>
                                <p className="text-sm md:text-base text-brand-deep/60 dark:text-brand-cream/60 leading-relaxed max-w-xs mx-auto">
                                    Join all merchants who trust <span className="text-brand-deep dark:text-brand-cream font-bold">Cloove</span> for secure payouts.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-left">
                                {[
                                    { icon: Shield, text: "Level 1 Sec" },
                                    { icon: Lock, text: "Data Encrypted" }
                                ].map((feat, i) => (
                                    <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50 dark:bg-white/5 border border-brand-deep/5 dark:border-white/5">
                                        <feat.icon className="w-3.5 h-3.5 text-brand-gold" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-deep/80 dark:text-brand-cream/80">{feat.text}</span>
                                    </div>
                                ))}
                            </div>

                            <Button
                                onClick={startVerification}
                                className="w-full h-14 rounded-2xl bg-brand-deep dark:bg-brand-gold hover:bg-brand-deep/90 dark:hover:bg-brand-gold/90 text-brand-gold dark:text-brand-deep dark:hover:text-brand-deep font-bold text-lg shadow-2xl transition-all group active:scale-95"
                            >
                                Verify My Identity
                                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </motion.div>
                    )}

                    {step === 'bvn' && (
                        <motion.div
                            key="bvn-content"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="space-y-4">
                                <h3 className="text-3xl font-serif text-brand-deep dark:text-brand-cream font-medium tracking-tight">
                                    Level 1 Verification
                                </h3>
                                <p className="text-sm text-brand-deep/60 dark:text-brand-cream/60 leading-relaxed max-w-xs mx-auto">
                                    Enter your 11-digit BVN to verify your basic identity and unlock standard limits.
                                </p>
                            </div>

                            <form onSubmit={handleBvnSubmit} className="space-y-6">
                                <div className="space-y-2 text-left">
                                    <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 px-1">Bank Verification Number (BVN)</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        autoFocus
                                        maxLength={11}
                                        value={bvn}
                                        onChange={(e) => setBvn(e.target.value.replace(/\D/g, ""))}
                                        placeholder="Enter your BVN"
                                        className="w-full h-14 bg-white/50 dark:bg-white/5 border border-brand-deep/10 dark:border-white/10 rounded-2xl px-5 focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none transition-all text-lg font-medium tracking-[0.2em] text-center"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={bvn.length !== 11}
                                    className="w-full h-14 cursor-pointer rounded-2xl bg-brand-deep dark:bg-brand-gold hover:bg-brand-deep/90 dark:hover:bg-brand-gold/90 text-brand-gold dark:text-brand-deep dark:hover:text-brand-deep font-bold text-lg shadow-2xl transition-all group active:scale-95 disabled:opacity-50"
                                >
                                    Proceed
                                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </form>
                            <button
                                onClick={() => setStep('intro')}
                                className="text-xs font-bold cursor-pointer uppercase tracking-widest text-brand-accent/60 dark:text-brand-cream/40 hover:text-brand-gold transition-colors"
                            >
                                Back
                            </button>
                        </motion.div>
                    )}

                    {step === 'scanning' && (
                        <motion.div
                            key="scanning-content"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6 py-4"
                        >
                            <div className="space-y-2">
                                <h3 className="text-xl font-serif text-brand-deep dark:text-brand-cream font-medium tracking-wide">
                                    Verifying BVN
                                </h3>
                                <div className="font-mono text-[10px] text-brand-deep/40 dark:text-brand-cream/40 flex justify-center gap-4">
                                    <span>SEC_LEVEL: 01</span>
                                    <span>SIGNAL: STABLE</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="h-2 w-full bg-brand-deep/5 dark:bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        className="h-full bg-brand-gold shadow-[0_0_10px_rgba(212,175,55,0.5)]"
                                    />
                                </div>
                                <p className="text-xs text-brand-gold font-mono font-bold tracking-[0.2em]">
                                    {Math.floor(progress)}% COMPLETE
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {step === 'success' && (
                        <motion.div
                            key="success-content"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="space-y-3">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-green/10 dark:bg-brand-gold/10 text-brand-green dark:text-brand-gold text-xs font-bold uppercase tracking-widest mb-2"
                                >
                                    <Star className="w-3 h-3 fill-current" />
                                    Level 1 Complete
                                </motion.div>
                                <h3 className="text-3xl font-serif text-brand-deep dark:text-brand-cream font-medium leading-tight">
                                    Identity <span className="italic text-brand-gold underline decoration-brand-gold/30 underline-offset-4">Verified</span>
                                </h3>
                                <p className="text-sm md:text-base text-brand-deep/60 dark:text-brand-cream/60 leading-relaxed">
                                    Your basic identity has been confirmed. To unlock <span className="text-brand-deep dark:text-brand-cream font-bold">higher transaction limits</span> and more features, complete higher levels of verification under <span className="text-brand-gold font-bold">Settings</span>.
                                </p>
                            </div>

                            <Button
                                onClick={handleComplete}
                                className="w-full h-14 rounded-2xl bg-brand-green hover:bg-brand-green/90 text-brand-cream font-bold text-lg shadow-xl shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95"
                            >
                                Done
                            </Button>
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
                    <div className="sr-only">
                        <DrawerTitle>Verify Identity</DrawerTitle>
                    </div>
                    {innerContent}
                </DrawerContent>
            </Drawer>
        )
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-brand-cream/95 dark:bg-brand-deep/95 backdrop-blur-2xl border border-white/20 dark:border-white/5 shadow-2xl p-0 overflow-hidden sm:rounded-[40px] transition-all duration-500">
                <DialogTitle className="sr-only">Verify Identity</DialogTitle>
                {innerContent}
            </DialogContent>
        </Dialog>
    )
}
