"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { GlassCard } from "../../components/ui/glass-card"
import { Button } from "../../components/ui/button"
import { Upload, Check, Palette, Smartphone, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/app/lib/utils"

const themeColors = [
    { name: 'Forest', bg: 'bg-[#062C21]', border: 'border-[#062C21]' },
    { name: 'Midnight', bg: 'bg-[#0F172A]', border: 'border-[#0F172A]' },
    { name: 'Berry', bg: 'bg-[#4A044E]', border: 'border-[#4A044E]' },
    { name: 'Ocean', bg: 'bg-[#1E3A8A]', border: 'border-[#1E3A8A]' },
    { name: 'Chocolate', bg: 'bg-[#431407]', border: 'border-[#431407]' },
    { name: 'Charcoal', bg: 'bg-[#18181B]', border: 'border-[#18181B]' },
]

export default function StorefrontCustomization() {
    const [selectedColor, setSelectedColor] = useState('Forest')
    const [logo, setLogo] = useState<string | null>(null)

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Editor Panel */}
            <div className="flex-1 space-y-8">
                {/* Brand Identity */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-brand-green/10 text-brand-green dark:bg-emerald-400/10 dark:text-emerald-400">
                            <Palette className="w-5 h-5" />
                        </div>
                        <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream">Brand Identity</h2>
                    </div>

                    <GlassCard className="p-6 space-y-6">
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">Brand Logo</label>
                            <div className="flex items-center gap-6">
                                <div className="h-24 w-24 rounded-2xl border-2 border-dashed border-brand-accent/20 dark:border-white/20 flex items-center justify-center bg-brand-accent/5 dark:bg-white/5 relative overflow-hidden group">
                                    {logo ? (
                                        <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xs text-brand-accent/40 dark:text-white/40 font-medium group-hover:text-brand-green dark:group-hover:text-emerald-400 transition-colors">Upload</span>
                                    )}
                                    {logo && (
                                        <button
                                            onClick={() => setLogo(null)}
                                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm text-brand-deep/80 dark:text-brand-cream/80 max-w-xs">
                                        Upload your business logo. Recommended size: 512x512px (PNG or JPG).
                                    </p>
                                    <Button variant="outline" className="rounded-xl h-9 text-xs border-brand-accent/10 dark:border-white/10">
                                        <Upload className="w-3 h-3 mr-2" />
                                        Choose File
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-brand-deep/5 dark:border-white/5">
                            <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/40">Theme Color</label>
                            <div className="flex flex-wrap gap-3">
                                {themeColors.map((color) => (
                                    <button
                                        key={color.name}
                                        onClick={() => setSelectedColor(color.name)}
                                        className={cn(
                                            "w-12 h-12 rounded-full relative transition-all hover:scale-110",
                                            color.bg,
                                            selectedColor === color.name && "ring-4 ring-brand-green/20 dark:ring-white/20 scale-110"
                                        )}
                                        title={color.name}
                                    >
                                        {selectedColor === color.name && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Check className="w-5 h-5 text-white stroke-[3px]" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-brand-accent/60 dark:text-brand-cream/60 pt-2">
                                This color will be used for buttons, links, and highlights on your storefront.
                            </p>
                        </div>
                    </GlassCard>
                </section>



                <div className="flex justify-end pt-4">
                    <Button
                        onClick={() => toast.success("Storefront theme updated successfully")}
                        className="rounded-full bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep dark:hover:bg-brand-gold/90 dark:hover:text-brand-deep font-bold px-8 h-12 shadow-xl hover:scale-105 transition-all"
                    >
                        Save Changes
                    </Button>
                </div>
            </div>

            {/* Mobile Preview */}
            <div className="w-full lg:w-[380px] shrink-0 sticky top-8">
                <div className="flex items-center gap-2 mb-4 justify-center lg:justify-start">
                    <div className="p-2 rounded-lg bg-brand-gold/10 text-brand-gold">
                        <Smartphone className="w-5 h-5" />
                    </div>
                    <h2 className="font-serif text-lg text-brand-deep dark:text-brand-cream">Live Preview</h2>
                    <Button variant="ghost" size="icon" className="ml-auto rounded-full w-8 h-8 text-brand-accent/40 hover:text-brand-deep dark:hover:text-brand-cream">
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>

                <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-900 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl">
                    <div className="h-[32px] w-[3px] bg-gray-800 absolute -left-[17px] top-[72px] rounded-l-lg"></div>
                    <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[124px] rounded-l-lg"></div>
                    <div className="h-[64px] w-[3px] bg-gray-800 absolute -right-[17px] top-[142px] rounded-r-lg"></div>
                    <div className="rounded-[2rem] overflow-hidden w-full h-full bg-[#f8f9fa] dark:bg-[#1a1a1a] relative">
                        {/* Mock Store Content */}
                        <div className="h-full overflow-y-auto no-scrollbar">
                            {/* Header */}
                            <div className="p-6 pb-4 bg-white dark:bg-black/40 sticky top-0 z-10 backdrop-blur-md border-b border-black/5">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center font-serif font-bold text-xs text-gray-500">
                                            L
                                        </div>
                                        <span className="font-bold text-sm text-gray-900 dark:text-white">Adebayo</span>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                                        <div className="w-4 h-4 rounded-full bg-black/20" />
                                    </div>
                                </div>
                                <div className="h-8 w-full bg-gray-100 dark:bg-white/5 rounded-lg flex items-center px-3 gap-2">
                                    <div className="w-3 h-3 rounded-full bg-gray-300" />
                                    <div className="h-2 w-24 bg-gray-300 rounded-full opacity-50" />
                                </div>
                            </div>

                            {/* Hero Banner with Selected Color */}
                            <div className={cn("m-4 p-6 rounded-2xl text-white relative overflow-hidden transition-colors duration-500",
                                themeColors.find(c => c.name === selectedColor)?.bg || 'bg-[#062C21]'
                            )}>
                                <div className="relative z-10">
                                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">New Arrivals</p>
                                    <h3 className="font-serif text-xl mb-3">Summer Collection</h3>
                                    <div className="h-8 px-4 rounded-full bg-white/20 backdrop-blur-sm inline-flex items-center text-xs font-bold">
                                        Shop Now
                                    </div>
                                </div>
                                <div className="absolute -right-4 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                            </div>

                            {/* Product Grid */}
                            <div className="p-4 pt-0 grid grid-cols-2 gap-3">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="bg-white dark:bg-white/5 rounded-xl p-3 shadow-sm space-y-2">
                                        <div className="aspect-square rounded-lg bg-gray-100 dark:bg-white/5 relative mb-2" />
                                        <div className="h-2 w-16 bg-gray-200 dark:bg-white/10 rounded-full" />
                                        <div className="h-2 w-10 bg-gray-200 dark:bg-white/10 rounded-full opacity-60" />
                                        <div className={cn("h-8 w-full rounded-lg mt-2 flex items-center justify-center text-[10px] font-bold text-white transition-colors duration-500",
                                            themeColors.find(c => c.name === selectedColor)?.bg || 'bg-[#062C21]'
                                        )}>
                                            Add to Cart
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <p className="text-center text-xs text-brand-accent/40 dark:text-white/30 mt-6 font-medium">
                    This is how your store looks on mobile devices.
                </p>
            </div>
        </div>
    )
}
