"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Download } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { GlassCard } from "@/app/components/ui/glass-card"
import Image from "next/image"

export function InstallBanner() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const handler = (e: any) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault()
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e)
            
            // Check if user has already dismissed it
            const isDismissed = localStorage.getItem("pwa-banner-dismissed")
            if (!isDismissed) {
                setIsVisible(true)
            }
        }

        window.addEventListener("beforeinstallprompt", handler)

        // Check if already installed
        window.addEventListener("appinstalled", () => {
            setIsVisible(false)
            setDeferredPrompt(null)
        })

        return () => window.removeEventListener("beforeinstallprompt", handler)
    }, [])

    const handleInstall = async () => {
        if (!deferredPrompt) return

        // Show the install prompt
        deferredPrompt.prompt()
        
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice
        
        if (outcome === "accepted") {
            setIsVisible(false)
        }
        
        setDeferredPrompt(null)
    }

    const handleDismiss = () => {
        setIsVisible(false)
        localStorage.setItem("pwa-banner-dismissed", "true")
    }

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-lg"
                >
                    <GlassCard className="p-4 md:p-5 border-brand-green/10 bg-brand-cream/80 dark:bg-brand-deep/80 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                        {/* Decorative background element */}
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-brand-gold/10 rounded-full blur-3xl group-hover:bg-brand-gold/20 transition-colors duration-700" />
                        
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="hidden sm:flex h-12 w-12 rounded-2xl bg-brand-deep dark:bg-brand-gold/10 items-center justify-center flex-shrink-0 shadow-lg overflow-hidden border border-brand-gold/20">
                                <Image 
                                    src="/images/logo-white.png" 
                                    alt="Cloove" 
                                    width={40} 
                                    height={40} 
                                    className="w-7 h-7 object-contain" 
                                />
                            </div>
                            
                            <div className="flex-grow min-w-0">
                                <h3 className="font-serif text-brand-deep dark:text-brand-cream text-base md:text-lg leading-tight">
                                    Install Cloove
                                </h3>
                                <p className="text-brand-deep/60 dark:text-brand-cream/60 text-xs md:text-sm truncate">
                                    Faster access and offline features
                                </p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <Button 
                                    onClick={handleInstall}
                                    className="h-9 md:h-10 bg-brand-deep dark:bg-brand-gold text-white dark:text-brand-deep hover:bg-brand-deep/90 dark:hover:bg-brand-gold/90 px-4 md:px-6 rounded-xl font-medium text-xs md:text-sm"
                                >
                                    <Download className="w-3.5 h-3.5 mr-2" />
                                    Install
                                </Button>
                                
                                <button 
                                    onClick={handleDismiss}
                                    className="h-9 w-9 flex items-center justify-center rounded-xl text-brand-deep/40 dark:text-brand-cream/40 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
