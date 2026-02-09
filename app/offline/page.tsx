"use client"

import { GlassCard } from "@/app/components/ui/glass-card"
import { Button } from "@/app/components/ui/button"
import { WifiOff, RefreshCw, Home } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

export default function OfflinePage() {
    return (
        <div className="min-h-screen bg-brand-deep flex items-center justify-center p-6 selection:bg-brand-gold/20">
            <div className="max-w-md w-full space-y-8 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="relative inline-block mb-8">
                        <div className="absolute inset-0 bg-brand-gold/20 blur-3xl rounded-full" />
                        <div className="relative h-24 w-24 rounded-full bg-brand-gold/10 flex items-center justify-center border border-brand-gold/20">
                            <WifiOff className="w-10 h-10 text-brand-gold" />
                        </div>
                    </div>

                    <h1 className="font-serif text-3xl text-brand-gold mb-3">Quietly Disconnected</h1>
                    <p className="text-brand-cream/60 leading-relaxed mb-8">
                        It seems you've stepped away from the network. Don't worry, your data is safe and Cloove is waiting for your return.
                    </p>

                    <GlassCard className="p-6 border-white/10 bg-white/5 backdrop-blur-md mb-8">
                        <p className="text-xs text-brand-cream/40 uppercase tracking-widest font-medium mb-4">Quick Actions</p>
                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                onClick={() => window.location.reload()}
                                variant="outline"
                                className="h-12 border-white/10 hover:bg-white/5 text-brand-cream text-xs"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Retry
                            </Button>
                            <Link href="/">
                                <Button className="w-full h-12 bg-brand-gold text-brand-deep font-bold text-xs shadow-lg hover:scale-[1.02] active:scale-95 transition-all">
                                    <Home className="w-4 h-4 mr-2" />
                                    Home
                                </Button>
                            </Link>
                        </div>
                    </GlassCard>

                    <p className="text-[10px] text-brand-cream/20 uppercase tracking-[0.4em]">
                        Calm Intelligence &bull; Offline Mode
                    </p>
                </motion.div>
            </div>
        </div>
    )
}
