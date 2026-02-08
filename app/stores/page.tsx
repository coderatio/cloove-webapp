"use client"

import { motion } from "framer-motion"
import { PageTransition } from "../components/layout/page-transition"
import { GlassCard } from "../components/ui/glass-card"
import { useStore } from "../components/StoreProvider"
import {
    MapPin,
    Plus,
    Settings2,
    Store as StoreIcon,
    ChevronRight,
    Search
} from "lucide-react"
import { Button } from "../components/ui/button"
import { cn } from "../lib/utils"

export default function StoresPage() {
    const { stores } = useStore()

    // Filter out the virtual "All Stores" for management
    const actualStores = stores.filter(s => s.id !== 'all-stores')

    return (
        <PageTransition>
            <div className="max-w-4xl mx-auto space-y-8 pb-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="font-serif text-3xl md:text-5xl font-medium text-brand-deep dark:text-brand-cream mb-2">
                            Manage Stores
                        </h1>
                        <p className="text-brand-accent/60 dark:text-brand-cream/60 max-w-lg">
                            Add, edit, and organize your business locations. Each store maintains its own inventory and staff.
                        </p>
                    </div>
                    <Button className="rounded-full bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep hover:scale-105 transition-all shadow-lg">
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Store
                    </Button>
                </div>

                {/* Search & Filter - Minimalist */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Search className="w-4 h-4 text-brand-accent/40 group-focus-within:text-brand-green transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search locations..."
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/40 dark:bg-white/5 border border-brand-deep/5 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green/30 transition-all placeholder:text-brand-accent/30"
                    />
                </div>

                {/* Stores Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {actualStores.map((store, index) => (
                        <motion.div
                            key={store.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <GlassCard className="p-6 h-full group hover:shadow-2xl transition-all duration-500 border-l-4 border-l-brand-green">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-brand-green/10 flex items-center justify-center text-brand-green group-hover:scale-110 transition-transform">
                                            <StoreIcon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-serif font-medium text-brand-deep dark:text-brand-cream">
                                                {store.name}
                                            </h3>
                                            <div className="flex items-center gap-1.5 text-xs text-brand-accent/60 dark:text-brand-cream/60">
                                                <MapPin className="w-3 h-3" />
                                                <span>{store.location || "Location not set"}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {store.isDefault && (
                                        <span className="px-3 py-1 bg-brand-gold/10 text-brand-gold text-[10px] font-bold uppercase tracking-widest rounded-full border border-brand-gold/20">
                                            Primary
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-sm py-2 border-b border-brand-accent/5">
                                        <span className="text-brand-accent/60 dark:text-brand-cream/40">Active Staff</span>
                                        <span className="font-semibold text-brand-deep dark:text-brand-cream">4 members</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm py-2 border-b border-brand-accent/5">
                                        <span className="text-brand-accent/60 dark:text-brand-cream/40">Inventory Value</span>
                                        <span className="font-semibold text-brand-deep dark:text-brand-cream">₦12.4M</span>
                                    </div>
                                </div>

                                <div className="mt-8 flex items-center gap-3">
                                    <Button variant="outline" className="flex-1 rounded-xl border-brand-accent/10 hover:bg-brand-accent/5 dark:border-white/10 dark:hover:bg-white/5 transition-all text-sm font-semibold">
                                        <Settings2 className="w-4 h-4 mr-2" />
                                        Settings
                                    </Button>
                                    <Button variant="ghost" className="rounded-xl hover:bg-brand-green/5 text-brand-green dark:hover:bg-brand-gold/5 dark:text-brand-gold p-2">
                                        <ChevronRight className="w-5 h-5" />
                                    </Button>
                                </div>
                            </GlassCard>
                        </motion.div>
                    ))}

                    {/* Add More Shadow/Empty State */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: actualStores.length * 0.1 }}
                        className="cursor-pointer group"
                    >
                        <div className="h-full min-h-[220px] rounded-[30px] border-2 border-dashed border-brand-accent/10 dark:border-white/10 flex flex-col items-center justify-center gap-4 hover:border-brand-green/40 dark:hover:border-brand-gold/40 hover:bg-white/40 dark:hover:bg-white/5 transition-all group-active:scale-[0.98]">
                            <div className="w-12 h-12 rounded-full bg-brand-accent/5 dark:bg-white/5 flex items-center justify-center text-brand-accent/40 group-hover:bg-brand-green/10 group-hover:text-brand-green transition-all">
                                <Plus className="w-6 h-6" />
                            </div>
                            <span className="text-brand-accent/40 dark:text-white/40 font-medium group-hover:text-brand-deep dark:group-hover:text-brand-cream transition-colors">
                                Add Another Branch
                            </span>
                        </div>
                    </motion.div>
                </div>
            </div>
        </PageTransition>
    )
}
