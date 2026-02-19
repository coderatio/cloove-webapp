"use client"

import * as React from "react"
import {
    Package,
    Store,
    Tag,
    BarChart3,
    Eye,
    ExternalLink,
    MapPin,
    Layers,
    Boxes
} from "lucide-react"
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerBody
} from "@/app/components/ui/drawer"
import { GlassCard } from "@/app/components/ui/glass-card"
import { cn } from "@/app/lib/utils"
import { motion } from "framer-motion"

interface ProductViewDrawerProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    item: any
}

export function ProductViewDrawer({ isOpen, onOpenChange, item }: ProductViewDrawerProps) {
    if (!item) return null

    const raw = item.raw
    const images = raw?.images || []
    const variants = raw?.variants || raw?.product_variants || []
    const stores = raw?.stores || []

    return (
        <Drawer open={isOpen} onOpenChange={onOpenChange}>
            <DrawerContent className="max-w-2xl h-[92vh]">
                <DrawerHeader className="border-b border-brand-deep/5 dark:border-white/5 space-y-4 pb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                                <Package className="w-5 h-5" />
                            </div>
                            <div>
                                <DrawerTitle className="text-3xl font-serif font-medium text-brand-deep dark:text-brand-cream">
                                    {item.product}
                                </DrawerTitle>
                                <DrawerDescription className="flex items-center gap-2 mt-1">
                                    <Tag className="w-3 h-3" />
                                    {item.category}
                                </DrawerDescription>
                            </div>
                        </div>
                        <div className={cn(
                            "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest",
                            item.status === 'In Stock'
                                ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                                : "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400"
                        )}>
                            {item.status}
                        </div>
                    </div>
                </DrawerHeader>

                <DrawerBody className="p-0 overflow-y-auto bg-brand-cream/30 dark:bg-brand-deep/10">
                    <div className="p-8 space-y-8">
                        {/* Image Gallery */}
                        {images.length > 0 && (
                            <div className="grid grid-cols-4 gap-4">
                                {images.map((img: any, i: number) => (
                                    <div key={i} className={cn(
                                        "relative rounded-2xl overflow-hidden border border-brand-deep/5 dark:border-white/5 group",
                                        i === 0 ? "col-span-4 aspect-21/9" : "aspect-square"
                                    )}>
                                        <img
                                            src={img.url}
                                            alt={item.product}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-linear-to-t from-brand-deep/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                ))}
                            </div>
                        )}
                        {/* Product Description */}
                        {raw?.description && (
                            <div className="space-y-4">
                                <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40">
                                    <BarChart3 className="w-3 h-3" />
                                    About this Product
                                </h3>
                                <div className="p-6 rounded-3xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/5">
                                    <p className="text-sm leading-relaxed text-brand-deep/70 dark:text-brand-cream/70 italic font-serif">
                                        "{raw.description}"
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Core Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            <GlassCard className="p-5 flex flex-col gap-2 bg-white/50 dark:bg-white/5 border-none">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40">Base Price</span>
                                <span className="text-2xl font-serif text-brand-deep dark:text-brand-gold">{item.price}</span>
                            </GlassCard>
                            <GlassCard className="p-5 flex flex-col gap-2 bg-white/50 dark:bg-white/5 border-none">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40">Total Stock</span>
                                <span className="text-2xl font-serif text-brand-deep dark:text-brand-cream">{item.stock} Units</span>
                            </GlassCard>
                            <GlassCard className="p-5 flex flex-col gap-2 bg-white/50 dark:bg-white/5 border-none col-span-2 lg:col-span-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40">Variants</span>
                                <span className="text-2xl font-serif text-brand-deep dark:text-brand-cream">{item.variantsCount} Total</span>
                            </GlassCard>
                        </div>

                        {/* Store Breakdown */}
                        <div className="space-y-4">
                            <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40">
                                <MapPin className="w-3 h-3" />
                                Store Allocation
                            </h3>
                            <div className="grid gap-3">
                                {Object.entries(item.storeBreakdown || {}).map(([storeName, count]: [string, any]) => (
                                    <div key={storeName} className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-brand-deep dark:bg-white/10 flex items-center justify-center text-white/60">
                                                <Store className="w-4 h-4" />
                                            </div>
                                            <span className="text-sm font-medium text-brand-deep dark:text-brand-cream">{storeName}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-32 h-1.5 bg-brand-deep/5 dark:bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(count / item.stock) * 100}%` }}
                                                    className="h-full bg-brand-gold"
                                                />
                                            </div>
                                            <span className="text-sm font-bold text-brand-deep dark:text-brand-cream">{count}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Variants Details */}
                        <div className="space-y-4">
                            <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40">
                                <Layers className="w-3 h-3" />
                                Variant Configuration
                            </h3>
                            <div className="grid gap-4">
                                {variants.map((v: any, i: number) => (
                                    <div key={i} className="group p-6 rounded-3xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-all hover:border-brand-gold/30">
                                        <div className="space-y-1.5">
                                            <span className="text-xs font-bold text-brand-deep/40 dark:text-brand-cream/40 uppercase tracking-widest leading-none">
                                                {v.sku || 'No SKU'}
                                            </span>
                                            <p className="text-lg font-serif text-brand-deep dark:text-brand-cream">
                                                {v.name || 'Standard'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40">Price</p>
                                                <p className="text-sm font-bold text-brand-gold">{item.price}</p>
                                            </div>
                                            <div className="h-8 w-px bg-brand-deep/5 dark:border-white/5" />
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40">Total Stock</p>
                                                <p className="text-sm font-bold text-brand-deep dark:text-brand-cream">{v.stockQuantity || 0} Units</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </DrawerBody>
            </DrawerContent>
        </Drawer>
    )
}
