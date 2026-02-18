"use client"

import React, { useState } from "react"
import { Sparkles, Wand2, X, Check, RefreshCw, MessageSquare } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { cn } from "@/app/lib/utils"
import { toast } from "sonner"

interface MagicGeneratorProps {
    isOpen: boolean
    onClose: () => void
    onApply: (content: { heading: string, text: string }) => void
    context?: string
}

export function MagicGenerator({ isOpen, onClose, onApply, context }: MagicGeneratorProps) {
    const [prompt, setPrompt] = useState("")
    const [isGenerating, setIsGenerating] = useState(false)
    const [result, setResult] = useState<{ heading: string, text: string } | null>(null)

    const handleGenerate = () => {
        if (!prompt) return
        setIsGenerating(true)

        // Mocking AI generation logic
        setTimeout(() => {
            setResult({
                heading: "Elevate Your Timeless Style",
                text: "Discover a curated collection where precision meets artisan craftsmanship. Our latest arrivals are designed for those who value elegance in every second."
            })
            setIsGenerating(false)
            toast.success("AI generated a new suggestion!")
        }, 2000)
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-brand-deep/20 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl overflow-hidden relative border border-brand-deep/5"
                    >
                        <div className="p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                                        <Wand2 className="w-4 h-4" />
                                    </div>
                                    <h3 className="font-serif text-xl border-none">Magic Generator</h3>
                                </div>
                                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            {!result ? (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40">What should this section say?</label>
                                        <div className="relative">
                                            <Input
                                                value={prompt}
                                                onChange={(e) => setPrompt(e.target.value)}
                                                placeholder="e.g. A luxury hero section for a watch brand"
                                                className="h-14 pl-5 pr-32 rounded-2xl bg-brand-deep/5 border-transparent focus:bg-white focus:ring-brand-gold/20"
                                                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                                            />
                                            <Button
                                                disabled={!prompt || isGenerating}
                                                onClick={handleGenerate}
                                                className="absolute right-2 top-2 h-10 rounded-xl bg-brand-deep text-brand-gold font-bold px-4"
                                            >
                                                {isGenerating ? (
                                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <Sparkles className="w-3.5 h-3.5 mr-2" />
                                                        Magic
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="bg-brand-deep/[0.02] p-4 rounded-xl border border-brand-deep/5">
                                        <div className="flex items-center gap-2 text-brand-accent/40 mb-2">
                                            <MessageSquare className="w-3 h-3" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Suggestions</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {["Playful tone", "Professional", "Minimalist", "Action-oriented"].map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => setPrompt(curr => curr ? `${curr}, ${s}` : s)}
                                                    className="px-3 py-1.5 rounded-full bg-white border border-brand-deep/5 text-[10px] font-medium hover:border-brand-gold/40 transition-colors"
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="space-y-4 p-6 rounded-[1.5rem] bg-brand-deep/[0.02] border border-brand-gold/20 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <Sparkles className="w-12 h-12 text-brand-gold" />
                                        </div>
                                        <div className="space-y-2 relative z-10">
                                            <h4 className="font-serif text-lg text-brand-deep leading-tight">{result.heading}</h4>
                                            <p className="text-sm text-brand-accent/60 leading-relaxed">{result.text}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => setResult(null)}
                                            className="flex-1 rounded-full h-12 border-brand-deep/10 text-brand-deep font-bold"
                                        >
                                            <RefreshCw className="w-4 h-4 mr-2" />
                                            Regenerate
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                onApply(result)
                                                onClose()
                                            }}
                                            className="flex-1 rounded-full h-12 bg-brand-deep text-brand-gold font-bold shadow-xl hover:scale-105 transition-all"
                                        >
                                            <Check className="w-4 h-4 mr-2" />
                                            Apply Suggested
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
