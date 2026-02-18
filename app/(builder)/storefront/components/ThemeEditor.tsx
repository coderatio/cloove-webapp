"use client"

import React from "react"
import { Palette, Type, Image as ImageIcon, Check } from "lucide-react"
import { cn } from "@/app/lib/utils"
import { StorefrontConfig } from "../../../domains/storefront/types"
import { Label } from "@/app/components/ui/label"
import { Button } from "@/app/components/ui/button"

interface ThemeEditorProps {
    config: StorefrontConfig['theme']
    onUpdate: (updates: Partial<StorefrontConfig['theme']>) => void
}

const BRAND_COLORS = [
    { name: 'Emerald', hex: '#10b981' },
    { name: 'Ocean', hex: '#0ea5e9' },
    { name: 'Violet', hex: '#8b5cf6' },
    { name: 'Deep', hex: '#101828' },
    { name: 'Gold', hex: '#FFD700' },
    { name: 'Crimson', hex: '#e11d48' },
]

export function ThemeEditor({ config, onUpdate }: ThemeEditorProps) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-4">
                <div className="flex items-center gap-2 opacity-40">
                    <Palette className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Color Palette</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    {BRAND_COLORS.map((color) => (
                        <button
                            key={color.hex}
                            onClick={() => onUpdate({ primaryColor: color.hex })}
                            className={cn(
                                "group relative aspect-square rounded-2xl flex items-center justify-center transition-all",
                                config.primaryColor === color.hex
                                    ? "ring-2 ring-brand-green ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 shadow-lg scale-105"
                                    : "hover:scale-105"
                            )}
                            style={{ backgroundColor: color.hex }}
                        >
                            {config.primaryColor === color.hex && (
                                <Check className="w-4 h-4 text-white" />
                            )}
                            <div className="absolute -bottom-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                <span className="text-[8px] font-bold uppercase tracking-widest bg-brand-deep text-white px-2 py-0.5 rounded-full">
                                    {color.name}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-2 opacity-40">
                    <Type className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Typography</span>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-brand-accent/40">Heading Font</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {['Serif', 'Sans', 'Display'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => onUpdate({ fontHeading: f.toLowerCase() })}
                                    className={cn(
                                        "h-10 rounded-xl text-xs font-bold border transition-all",
                                        config.fontHeading === f.toLowerCase()
                                            ? "bg-brand-deep text-brand-gold border-transparent shadow-md"
                                            : "bg-brand-deep/5 border-transparent text-brand-deep/60 hover:bg-brand-deep/10"
                                    )}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-2 opacity-40">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Brand Assets</span>
                </div>

                <div className="p-6 rounded-3xl border-2 border-dashed border-brand-deep/5 bg-brand-deep/5 hover:border-brand-green/20 transition-all flex flex-col items-center justify-center gap-3 text-center group cursor-pointer">
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-white/5 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <ImageIcon className="w-6 h-6 text-brand-accent/40" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-brand-deep dark:text-brand-cream">Upload Logo</p>
                        <p className="text-[9px] text-brand-accent/40 uppercase tracking-widest">PNG, SVG (Max 2MB)</p>
                    </div>
                </div>
            </div>

            <div className="pt-4">
                <Button className="w-full rounded-full h-12 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none font-bold">
                    <Check className="w-4 h-4 mr-2" />
                    Save Theme
                </Button>
            </div>
        </div>
    )
}
