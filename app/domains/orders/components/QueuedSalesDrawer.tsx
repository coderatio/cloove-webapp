"use client"

import { motion, AnimatePresence } from 'framer-motion'
import {
    X,
    Layers,
    Trash2,
    ArrowRight,
    Clock,
    ShoppingBag
} from 'lucide-react'
import { GlassCard } from '@/app/components/ui/glass-card'
import { CurrencyText } from '@/app/components/shared/CurrencyText'
import { Button } from '@/app/components/ui/button'
import { QueuedSale } from '../hooks/useQueuedSales'

interface QueuedSalesDrawerProps {
    isOpen: boolean
    onClose: () => void
    sales: QueuedSale[]
    onRecall: (sale: QueuedSale) => void
    onRemove: (id: string) => void
}

export function QueuedSalesDrawer({
    isOpen,
    onClose,
    sales,
    onRecall,
    onRemove
}: QueuedSalesDrawerProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-brand-deep/60 backdrop-blur-sm z-100"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full md:w-[480px] bg-brand-cream dark:bg-brand-deep shadow-2xl z-101 flex flex-col border-l border-brand-accent/10 dark:border-white/5"
                    >
                        <header className="p-6 border-b border-brand-accent/5 dark:border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                                    <Layers className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="font-serif text-2xl text-brand-deep dark:text-brand-cream">Parked Sales</h2>
                                    <p className="text-[10px] uppercase tracking-[0.2em] text-brand-accent/40 dark:text-brand-cream/40 font-bold">
                                        {sales.length} Sales currently queued
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="h-12 w-12 rounded-2xl hover:bg-rose-500/10 text-brand-accent/40 dark:text-brand-cream/60 hover:text-rose-500 transition-all"
                            >
                                <X className="h-6 w-6" />
                            </Button>
                        </header>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            {sales.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                    <div className="h-20 w-20 rounded-full border-2 border-dashed border-brand-accent/20 flex items-center justify-center mb-4">
                                        <ShoppingBag className="h-8 w-8" />
                                    </div>
                                    <p className="font-medium">No sales parked yet</p>
                                    <p className="text-xs">Parked sales will appear here for later retrieval</p>
                                </div>
                            ) : (
                                sales.map((sale) => (
                                    <motion.div
                                        key={sale.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <GlassCard className="p-5 space-y-4 group hover:border-brand-gold/30 transition-all duration-500 bg-white/40 dark:bg-white/5">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-brand-accent/40 dark:text-brand-cream/40">
                                                        <Clock className="h-3 w-3" />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest leading-none">
                                                            {new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <h3 className="font-serif text-xl text-brand-deep dark:text-brand-cream truncate max-w-[200px]">
                                                        {sale.customer ? sale.customer.name : 'Walk-in Customer'}
                                                    </h3>
                                                </div>
                                                <p className="font-sans font-black text-xl text-brand-gold">
                                                    <CurrencyText value={`₦${sale.total.toLocaleString()}`} />
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                                                {sale.items.slice(0, 3).map((item, idx) => (
                                                    <span
                                                        key={`${sale.id}-item-${idx}`}
                                                        className="px-2.5 py-1 rounded-lg bg-brand-deep/5 dark:bg-white/5 border border-brand-accent/5 text-[10px] font-bold text-brand-accent/60 dark:text-brand-cream/60 whitespace-nowrap"
                                                    >
                                                        {item.quantity}x {item.product.split(' (')[0]}
                                                    </span>
                                                ))}
                                                {sale.items.length > 3 && (
                                                    <span className="text-[10px] font-bold text-brand-accent/30 dark:text-brand-cream/30">
                                                        +{sale.items.length - 3} more
                                                    </span>
                                                )}
                                            </div>

                                            <div className="pt-4 border-t border-brand-accent/5 dark:border-white/5 flex gap-3">
                                                <Button
                                                    onClick={() => onRecall(sale)}
                                                    className="flex-1 h-12 rounded-2xl bg-brand-deep dark:bg-brand-accent text-brand-gold hover:scale-[1.02] active:scale-95 transition-all text-xs font-black uppercase tracking-widest border border-brand-gold/20"
                                                >
                                                    Recall Sale
                                                    <ArrowRight className="ml-2 h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => onRemove(sale.id)}
                                                    className="h-12 w-12 rounded-2xl hover:bg-rose-500/10 text-rose-500/40 dark:text-rose-300 hover:text-rose-500 transition-all border border-brand-accent/5"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        </GlassCard>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {sales.length > 0 && (
                            <div className="p-6 border-t border-brand-accent/5 dark:border-white/5">
                                <p className="text-[10px] text-center text-brand-accent/40 dark:text-brand-cream/40 font-medium">
                                    Click recall to restore this sale to your active cart.
                                </p>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
