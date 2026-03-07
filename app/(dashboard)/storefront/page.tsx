"use client"

import { useState } from "react"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Button } from "@/app/components/ui/button"
import Link from "next/link"
import { Copy, ExternalLink, QrCode, Share2, Eye, ShoppingCart, X } from "lucide-react"
import { useStorefront } from "@/app/domains/storefront/hooks/useStorefront"
import { useStorefrontPages } from "@/app/domains/storefront/hooks/useStorefrontPages"
import { useStorefrontTheme } from "@/app/domains/storefront/hooks/useStorefrontTheme"
import { useProductCount } from "@/app/domains/storefront/hooks/useProductCount"
import { QRCodeDisplay } from "@/app/components/ui/qr-code-display"
import { toast } from "sonner"

export default function StorefrontOverview() {
    const [isCopied, setIsCopied] = useState(false)
    const [showQrModal, setShowQrModal] = useState(false)
    const { data: storefront, isLoading, error } = useStorefront()
    const { data: pages = [] } = useStorefrontPages()
    const { data: theme } = useStorefrontTheme()
    const { data: productCount = 0 } = useProductCount()

    const displayUrl = storefront?.url ?? ''
    const hasStoreUrl = !!storefront?.slug
    const hasLogo = !!(theme && (theme as Record<string, unknown>).logoUrl)
    const hasEnoughProducts = productCount >= 5
    const pageSlugs = pages.map((p) => p.slug)
    const hasAboutPage = pageSlugs.some((s) => s.toLowerCase() === 'about' || s.toLowerCase() === 'about-us')
    const hasAnyPage = pages.length > 0

    const checklistSteps = [
        { done: hasStoreUrl, label: 'Create your store URL', href: '/storefront/settings' },
        { done: hasEnoughProducts, label: 'Add first 5 products', href: '/inventory' },
        { done: hasLogo, label: 'Add a store logo and cover image', href: '/storefront/customization' },
        { done: hasAboutPage || hasAnyPage, label: 'Configure "About Us" page', href: '/storefront/pages' },
    ]
    const completedCount = checklistSteps.filter((s) => s.done).length
    const progressPct = checklistSteps.length ? Math.round((completedCount / checklistSteps.length) * 100) : 0

    const handleCopy = () => {
        if (!displayUrl) return
        navigator.clipboard.writeText(displayUrl)
        setIsCopied(true)
        toast.success("Store link copied to clipboard")
        setTimeout(() => setIsCopied(false), 2000)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[200px]">
                <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (error || !storefront) {
        return (
            <div className="rounded-2xl border border-brand-deep/10 dark:border-white/10 bg-brand-cream/50 dark:bg-black/20 p-8 text-center">
                <p className="text-brand-deep/70 dark:text-brand-cream/70">
                    {(error as Error)?.message ?? 'Storefront not found. Set up your store link first.'}
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Quick Actions Card */}
            <GlassCard className="p-6 md:p-8 flex flex-col md:flex-row items-end justify-between gap-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-linear-to-r from-brand-green/5 to-transparent dark:from-brand-gold/5 pointer-events-none" />

                <div className="flex-1 w-full space-y-4 relative z-10">
                    <div>
                        <h2 className="text-sm font-bold uppercase tracking-widest text-brand-accent/60 dark:text-brand-cream/60 mb-2">
                            Your Public Store Link
                        </h2>
                        <div className="flex items-center gap-3 p-1 rounded-2xl bg-white/50 dark:bg-black/20 border border-brand-deep/5 dark:border-white/5 backdrop-blur-sm">
                            <div className="px-4 py-2 flex-1 font-mono text-sm md:text-base text-brand-deep dark:text-brand-cream truncate">
                                {displayUrl}
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
                    <Button
                        variant="outline"
                        className="flex-1 md:flex-none border-brand-accent/10 hover:bg-white/40 dark:border-white/10 dark:hover:bg-white/5 h-12 rounded-xl group/btn"
                        onClick={() => setShowQrModal(true)}
                    >
                        <QrCode className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                        QR Code
                    </Button>
                    <a
                        href={displayUrl}
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

            {/* Performance Stats — placeholders until analytics API exists */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <GlassCard className="p-5 flex flex-col justify-between h-32 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Eye className="w-16 h-16" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">Store Views (Today)</p>
                    <div className="space-y-1">
                        <p className="text-3xl font-serif text-brand-deep dark:text-brand-cream">—</p>
                        <p className="text-xs text-brand-accent/60 dark:text-white/40">Connect analytics to see views</p>
                    </div>
                </GlassCard>

                <GlassCard className="p-5 flex flex-col justify-between h-32 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 border-brand-gold/20">
                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-brand-gold">
                        <ShoppingCart className="w-16 h-16" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-brand-gold/60">Active Carts</p>
                    <div className="space-y-1">
                        <p className="text-3xl font-serif text-brand-deep dark:text-brand-cream">—</p>
                        <p className="text-xs text-brand-accent/60 dark:text-white/40">Coming soon</p>
                    </div>
                </GlassCard>

                <GlassCard className="p-5 flex flex-col justify-between h-32 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Share2 className="w-16 h-16" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">Share Rate</p>
                    <div className="space-y-1">
                        <p className="text-3xl font-serif text-brand-deep dark:text-brand-cream">—</p>
                        <p className="text-xs text-brand-accent/60 dark:text-white/40">Coming soon</p>
                    </div>
                </GlassCard>
            </div>

            {/* Setup Progress — dynamic checklist */}
            <div className="pt-4">
                <GlassCard className="p-6 md:p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-serif text-xl font-medium text-brand-deep dark:text-brand-cream">Storefront Setup</h3>
                            <p className="text-sm text-brand-accent/60 dark:text-brand-cream/60">Complete these steps to optimize your sales channel.</p>
                        </div>
                        <div className="h-12 w-12 rounded-full border-4 border-brand-gold/20 flex items-center justify-center text-xs font-bold text-brand-gold">
                            {progressPct}%
                        </div>
                    </div>

                    <div className="space-y-3">
                        {checklistSteps.map((step) => (
                            <Link key={step.label} href={step.href} className="block">
                                <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group ${
                                    step.done
                                        ? 'bg-brand-green/5 dark:bg-emerald-400/10 border-brand-green/10 dark:border-emerald-400/20'
                                        : 'bg-brand-cream/40 dark:bg-white/5 border-brand-deep/5 hover:bg-brand-cream/60 dark:hover:bg-emerald-400/5 dark:hover:border-emerald-400/20'
                                }`}>
                                    {step.done ? (
                                        <div className="h-5 w-5 rounded-full bg-brand-green/20 dark:bg-emerald-400/20 flex items-center justify-center text-brand-green dark:text-emerald-400 text-[10px] font-bold">✓</div>
                                    ) : (
                                        <div className="h-5 w-5 rounded-full border border-brand-deep/20 dark:border-white/40 group-hover:border-brand-deep/40 dark:group-hover:border-emerald-400 transition-colors" />
                                    )}
                                    <span className={`text-sm font-medium ${step.done ? 'text-brand-deep dark:text-emerald-400/80 line-through opacity-60 dark:opacity-80' : 'text-brand-deep dark:text-brand-cream group-hover:dark:text-white transition-colors'}`}>
                                        {step.label}
                                    </span>
                                    {!step.done && (
                                        <Button size="sm" variant="ghost" className="ml-auto text-xs h-7 text-brand-deep dark:text-emerald-400 font-bold hover:bg-brand-deep/5 dark:hover:bg-emerald-400/10">Start</Button>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                </GlassCard>
            </div>

            {/* QR Code modal */}
            {showQrModal && displayUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowQrModal(false)}>
                    <div className="relative rounded-2xl bg-brand-cream dark:bg-brand-deep/95 p-6 shadow-xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-serif text-lg text-brand-deep dark:text-brand-cream">Store QR Code</h3>
                            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9" onClick={() => setShowQrModal(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="flex justify-center">
                            <QRCodeDisplay value={displayUrl} size={256} withCard />
                        </div>
                        <p className="mt-3 text-center text-xs text-brand-accent/60 dark:text-white/40 truncate">{displayUrl}</p>
                    </div>
                </div>
            )}
        </div>
    )
}
