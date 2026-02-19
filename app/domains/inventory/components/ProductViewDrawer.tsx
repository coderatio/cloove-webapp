"use client"

import * as React from "react"
import Image from "next/image"
import {
    Package,
    Store,
    Tag,
    BarChart3,
    Eye,
    ExternalLink,
    MapPin,
    Layers,
    Boxes,
    X,
    Pencil,
    Trash2
} from "lucide-react"
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerBody,
    DrawerClose,
    DrawerStickyHeader,
    DrawerFooter
} from "@/app/components/ui/drawer"
import { Button } from "@/app/components/ui/button"
import { GlassCard } from "@/app/components/ui/glass-card"
import { cn } from "@/app/lib/utils"
import { motion } from "framer-motion"
import { formatCurrency } from "@/app/lib/formatters"
import { InventoryItem, ProductImage, ProductVariant } from "../types"

interface ProductViewDrawerProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    item: InventoryItem | null
    onEdit?: (item: InventoryItem) => void
    onDelete?: (item: InventoryItem) => void
}

export function ProductViewDrawer({ isOpen, onOpenChange, item, onEdit, onDelete }: ProductViewDrawerProps) {
    const [activeImageIndex, setActiveImageIndex] = React.useState(0)

    // Reset index when item changes
    React.useEffect(() => {
        setActiveImageIndex(0)
    }, [item?.id])

    if (!item) return null

    const raw = item.raw
    const images = raw?.images || []
    const variants = raw?.variants || raw?.product_variants || []
    const stores = raw?.stores || []

    const activeImage = images[activeImageIndex] || images[0]

    return (
        <Drawer open={isOpen} onOpenChange={onOpenChange}>
            <DrawerContent className="max-w-2xl h-[92vh]">
                <DrawerStickyHeader className="pb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center text-brand-gold shrink-0">
                            <Package className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <DrawerTitle className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream leading-tight truncate">
                                {item.product}
                            </DrawerTitle>
                            <div className="flex items-center gap-3 mt-1.5">
                                <DrawerDescription className="flex items-center gap-2">
                                    <Tag className="w-3 h-3" />
                                    {item.category}
                                </DrawerDescription>
                                <div className={cn(
                                    "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border",
                                    item.status === 'In Stock'
                                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30"
                                        : "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30"
                                )}>
                                    {item.status}
                                </div>
                            </div>
                        </div>
                    </div>
                </DrawerStickyHeader>

                <DrawerBody className="p-0 overflow-y-auto bg-brand-cream/30 dark:bg-brand-deep/10">
                    <div className="p-8 space-y-8">
                        {/* Image Gallery */}
                        {images.length > 0 && (
                            <div className="space-y-4">
                                <div className="relative aspect-video rounded-3xl overflow-hidden border border-brand-deep/5 dark:border-white/5 bg-white/50 dark:bg-white/5 group">
                                    <Image
                                        key={activeImageIndex}
                                        src={activeImage.url}
                                        alt={item.product}
                                        fill
                                        className="object-cover transition-all duration-700 group-hover:scale-105"
                                        priority
                                    />
                                    <div className="absolute inset-0 bg-linear-to-t from-brand-deep/20 to-transparent pointer-events-none" />
                                </div>

                                {images.length > 1 && (
                                    <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                        {images.map((img: ProductImage, i: number) => (
                                            <button
                                                key={i}
                                                onClick={() => setActiveImageIndex(i)}
                                                className={cn(
                                                    "relative w-20 h-20 rounded-2xl border-2 transition-all duration-300 overflow-hidden shrink-0",
                                                    i === activeImageIndex
                                                        ? "border-brand-gold ring-4 ring-brand-gold/10"
                                                        : "border-transparent opacity-60 hover:opacity-100 hover:border-brand-gold/30"
                                                )}
                                            >
                                                <Image
                                                    src={img.url}
                                                    alt={`${item.product} thumbnail ${i + 1}`}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                )}
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
                                {Object.entries(item.storeBreakdown || {}).map(([storeName, count]: [string, number]) => (
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
                                {variants.map((v: ProductVariant, i: number) => {
                                    const stockQuantity = (v.inventories || (v as any).variant_inventories || [])
                                        .reduce((sum: number, inv: any) => sum + (Number(inv.stockQuantity || inv.stock_quantity) || 0), 0)

                                    return (
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
                                                    <p className="text-sm font-bold text-brand-gold">{v.price ? formatCurrency(v.price) : item.price}</p>
                                                </div>
                                                <div className="h-8 w-px bg-brand-deep/5 dark:border-white/5" />
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40">Total Stock</p>
                                                    <p className="text-sm font-bold text-brand-deep dark:text-brand-cream">{stockQuantity} Units</p>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </DrawerBody>
                <DrawerFooter className="flex flex-row gap-3 pt-4">
                    <Button
                        variant="ghost"
                        className="flex-1 h-12 rounded-full border border-brand-deep/5 text-rose-500 hover:bg-rose-500/5 hover:text-rose-600 transition-colors uppercase tracking-widest text-[10px] font-bold"
                        onClick={() => {
                            onDelete?.(item)
                            onOpenChange(false)
                        }}
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                    </Button>
                    <Button
                        className="flex-2 h-12 rounded-full bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep shadow-lg hover:scale-[1.02] transition-all uppercase tracking-widest text-[10px] font-bold"
                        onClick={() => {
                            onEdit?.(item)
                            onOpenChange(false)
                        }}
                    >
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit Product
                    </Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}
