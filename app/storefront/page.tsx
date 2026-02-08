"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { GlassCard } from "../components/ui/glass-card"
import { Button } from "../components/ui/button"
import Link from "next/link"
import { Copy, ExternalLink, QrCode, Share2, Eye, ShoppingCart, TrendingUp } from "lucide-react"
import { useBusiness } from "../components/BusinessProvider"
import { toast } from "sonner"

export default function StorefrontOverview() {
    const { currentStore } = useBusiness()
    const [isCopied, setIsCopied] = useState(false)

    // Mock data based on current store
    const storeSlug = currentStore.id === '1' ? 'adebayo-textiles' :
        currentStore.id === '2' ? 'adebayo-ikeja' : 'adebayo-abuja'

    const storeUrl = `clooveai.com/b/${storeSlug}`

    const handleCopy = () => {
        navigator.clipboard.writeText(`https://${storeUrl}`)
        setIsCopied(true)
        toast.success("Store link copied to clipboard")
        setTimeout(() => setIsCopied(false), 2000)
    }

    return (
        <div className="space-y-6">
            {/* Quick Actions Card */}
            <GlassCard className="p-6 md:p-8 flex flex-col md:flex-row items-end justify-between gap-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-brand-green/5 to-transparent dark:from-brand-gold/5 pointer-events-none" />

                <div className="flex-1 w-full space-y-4 relative z-10">
                    <div>
                        <h2 className="text-sm font-bold uppercase tracking-widest text-brand-accent/60 dark:text-brand-cream/60 mb-2">
                            Your Public Store Link
                        </h2>
                        <div className="flex items-center gap-3 p-1 rounded-2xl bg-white/50 dark:bg-black/20 border border-brand-deep/5 dark:border-white/5 backdrop-blur-sm">
                            <div className="px-4 py-2 flex-1 font-mono text-sm md:text-base text-brand-deep dark:text-brand-cream truncate">
                                {storeUrl}
                            </div>
                            <Button
                                size="sm"
                                onClick={handleCopy}
                                className="h-9 px-4 rounded-xl bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep dark:hover:bg-brand-gold/90 dark:hover:text-brand-deep font-bold shadow-lg hover:scale-105 transition-all"
                            >
                                {isCopied ? "Copied!" : "Copy"}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto relative z-10">
                    <Button variant="outline" className="flex-1 md:flex-none border-brand-accent/10 hover:bg-white/40 dark:border-white/10 dark:hover:bg-white/5 h-12 rounded-xl group/btn">
                        <QrCode className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                        QR Code
                    </Button>
                    <a
                        href={`https://${storeUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 md:flex-none"
                    >
                        <Button variant="outline" className="w-full border-brand-accent/10 hover:bg-white/40 dark:border-white/10 dark:hover:bg-white/5 h-12 rounded-xl group/btn">
                            <ExternalLink className="w-4 h-4 mr-2 group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5 transition-transform" />
                            Visit Store
                        </Button>
                    </a>
                </div>
            </GlassCard>

            {/* Performance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <GlassCard className="p-5 flex flex-col justify-between h-32 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Eye className="w-16 h-16" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">Store Views (Today)</p>
                    <div className="space-y-1">
                        <p className="text-3xl font-serif text-brand-deep dark:text-brand-cream">128</p>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-brand-green dark:text-emerald-400">
                            <TrendingUp className="w-3 h-3" />
                            <span>+12% vs yesterday</span>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="p-5 flex flex-col justify-between h-32 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 border-brand-gold/20">
                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-brand-gold">
                        <ShoppingCart className="w-16 h-16" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-brand-gold/60">Active Carts</p>
                    <div className="space-y-1">
                        <p className="text-3xl font-serif text-brand-deep dark:text-brand-cream">5</p>
                        <p className="text-xs text-brand-accent/40 dark:text-white/40">
                            Potential sales: <span className="text-brand-deep dark:text-brand-cream font-bold">₦42,500</span>
                        </p>
                    </div>
                </GlassCard>

                <GlassCard className="p-5 flex flex-col justify-between h-32 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Share2 className="w-16 h-16" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">Share Rate</p>
                    <div className="space-y-1">
                        <p className="text-3xl font-serif text-brand-deep dark:text-brand-cream">8.4%</p>
                        <p className="text-xs text-brand-accent/40 dark:text-white/40">
                            Customers sharing products
                        </p>
                    </div>
                </GlassCard>
            </div>

            {/* Setup Progress */}
            <div className="pt-4">
                <GlassCard className="p-6 md:p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-serif text-xl font-medium text-brand-deep dark:text-brand-cream">Storefront Setup</h3>
                            <p className="text-sm text-brand-accent/60 dark:text-brand-cream/60">Complete these steps to optimize your sales channel.</p>
                        </div>
                        <div className="h-12 w-12 rounded-full border-4 border-brand-gold/20 flex items-center justify-center text-xs font-bold text-brand-gold">
                            65%
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-green/5 dark:bg-emerald-400/10 border border-brand-green/10 dark:border-emerald-400/20">
                            <div className="h-5 w-5 rounded-full bg-brand-green/20 dark:bg-emerald-400/20 flex items-center justify-center text-brand-green dark:text-emerald-400 text-[10px] font-bold">✓</div>
                            <span className="text-sm font-medium text-brand-deep dark:text-emerald-400/80 line-through opacity-60 dark:opacity-80">Create your store URL</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-green/5 dark:bg-emerald-400/10 border border-brand-green/10 dark:border-emerald-400/20">
                            <div className="h-5 w-5 rounded-full bg-brand-green/20 dark:bg-emerald-400/20 flex items-center justify-center text-brand-green dark:text-emerald-400 text-[10px] font-bold">✓</div>
                            <span className="text-sm font-medium text-brand-deep dark:text-emerald-400/80 line-through opacity-60 dark:opacity-80">Add first 5 products</span>
                        </div>
                        <Link href="/storefront/customization" className="block">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-cream/40 dark:bg-white/5 border border-brand-deep/5 hover:bg-brand-cream/60 dark:hover:bg-emerald-400/5 dark:hover:border-emerald-400/20 transition-all cursor-pointer group">
                                <div className="h-5 w-5 rounded-full border border-brand-deep/20 dark:border-white/40 group-hover:border-brand-deep/40 dark:group-hover:border-emerald-400 transition-colors" />
                                <span className="text-sm font-medium text-brand-deep dark:text-brand-cream group-hover:dark:text-white transition-colors">Add a store logo and cover image</span>
                                <Button size="sm" variant="ghost" className="ml-auto text-xs h-7 text-brand-deep dark:text-emerald-400 font-bold hover:bg-brand-deep/5 dark:hover:bg-emerald-400/10">Start</Button>
                            </div>
                        </Link>
                        <Link href="/storefront/pages?action=edit&slug=about" className="block">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-cream/40 dark:bg-white/5 border border-brand-deep/5 hover:bg-brand-cream/60 dark:hover:bg-emerald-400/5 dark:hover:border-emerald-400/20 transition-all cursor-pointer group">
                                <div className="h-5 w-5 rounded-full border border-brand-deep/20 dark:border-white/40 group-hover:border-brand-deep/40 dark:group-hover:border-emerald-400 transition-colors" />
                                <span className="text-sm font-medium text-brand-deep dark:text-brand-cream group-hover:dark:text-white transition-colors">Configure "About Us" page</span>
                                <Button size="sm" variant="ghost" className="ml-auto text-xs h-7 text-brand-deep dark:text-emerald-400 font-bold hover:bg-brand-deep/5 dark:hover:bg-emerald-400/10">Start</Button>
                            </div>
                        </Link>
                    </div>
                </GlassCard>
            </div>
        </div>
    )
}
