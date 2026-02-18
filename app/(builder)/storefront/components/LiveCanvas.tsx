"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GripVertical, Trash2, Copy, EyeOff, Sparkles } from "lucide-react"
import { cn } from "@/app/lib/utils"
import { StorefrontSection, SectionType } from "../../../domains/storefront/types"
import { Button } from "@/app/components/ui/button"

interface LiveCanvasProps {
    sections: StorefrontSection[]
    selectedSectionId: string | null
    onSelectSection: (id: string) => void
    onRemoveSection: (id: string) => void
    onDuplicateSection: (id: string) => void
    onToggleVisibility: (id: string) => void
}

export function LiveCanvas({
    sections,
    selectedSectionId,
    onSelectSection,
    onRemoveSection,
    onDuplicateSection,
    onToggleVisibility
}: LiveCanvasProps) {
    return (
        <div className="max-w-4xl mx-auto min-h-[calc(100vh-8rem)] bg-white dark:bg-black shadow-2xl ring-1 ring-black/5 flex flex-col transition-all duration-500 rounded-sm">
            <AnimatePresence initial={false}>
                {sections.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-6"
                    >
                        <div className="w-24 h-24 rounded-3xl bg-brand-green/5 flex items-center justify-center text-brand-green">
                            <Sparkles className="w-10 h-10 animate-pulse" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="font-serif text-3xl text-brand-deep dark:text-brand-cream">Start Your Story</h2>
                            <p className="text-brand-accent/60 dark:text-brand-cream/60 max-w-xs mx-auto text-sm leading-relaxed">
                                Use the library on the left or the AI assistant to begin building your storefront.
                            </p>
                        </div>
                    </motion.div>
                ) : (
                    <div className="divide-y divide-brand-deep/5 dark:divide-white/5">
                        {sections.map((section, index) => (
                            <CanvasSectionItem
                                key={section.id}
                                section={section}
                                isSelected={selectedSectionId === section.id}
                                onSelect={() => onSelectSection(section.id)}
                                onRemove={() => onRemoveSection(section.id)}
                                onDuplicate={() => onDuplicateSection(section.id)}
                                onToggleVisibility={() => onToggleVisibility(section.id)}
                            />
                        ))}
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

function CanvasSectionItem({
    section,
    isSelected,
    onSelect,
    onRemove,
    onDuplicate,
    onToggleVisibility
}: {
    section: StorefrontSection
    isSelected: boolean
    onSelect: () => void
    onRemove: () => void
    onDuplicate: () => void
    onToggleVisibility: () => void
}) {
    const isVisible = section.settings.isVisible !== false

    return (
        <div
            onClick={onSelect}
            className={cn(
                "group relative transition-all duration-300 cursor-pointer",
                isSelected ? "ring-2 ring-brand-green ring-inset z-10" : "hover:bg-brand-deep/5",
                !isVisible && "opacity-40 grayscale"
            )}
        >
            {/* Section Controls Toolbar */}
            <AnimatePresence>
                {isSelected && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute -top-12 right-0 flex items-center bg-brand-deep text-white rounded-lg shadow-xl p-1 z-30"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" onClick={onToggleVisibility}>
                            <EyeOff className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" onClick={onDuplicate}>
                            <Copy className="w-4 h-4" />
                        </Button>
                        <div className="w-px h-4 bg-white/20 mx-1" />
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-400 hover:text-rose-300" onClick={onRemove}>
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Drag Handle */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-brand-accent/20 cursor-grab active:cursor-grabbing">
                <GripVertical className="w-4 h-4" />
            </div>

            {/* Content Renderer Shell */}
            <div className="py-12 px-8">
                <SectionPreviewPlaceholder type={section.type} content={section.content} />
            </div>

            {/* AI Badge */}
            {section.settings.aiSuggested && (
                <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2 py-1 rounded-full bg-brand-gold/20 text-brand-gold text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm">
                    <Sparkles className="w-3 h-3" />
                    AI Generated
                </div>
            )}
        </div>
    )
}

function SectionPreviewPlaceholder({ type, content }: { type: SectionType, content: any }) {
    // This will eventually be replaced by actual section components
    return (
        <div className="space-y-4 max-w-2xl mx-auto">
            <h2 className="font-serif text-3xl text-brand-deep dark:text-brand-cream tracking-tight">
                {content.heading || `${type.charAt(0).toUpperCase() + type.slice(1)} Section`}
            </h2>
            <p className="text-brand-accent/60 dark:text-brand-cream/60 leading-relaxed">
                {content.text || "Edit this section to add your own content and personality."}
            </p>
            {type === 'hero' && (
                <div className="flex gap-4 pt-4">
                    <div className="h-12 px-8 rounded-full bg-brand-deep text-brand-gold flex items-center justify-center font-bold text-sm">
                        Primary Action
                    </div>
                </div>
            )}
            {type === 'features' && (
                <div className="grid grid-cols-3 gap-6 pt-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="space-y-2">
                            <div className="w-10 h-10 rounded-xl bg-brand-deep/5" />
                            <div className="h-2 w-20 bg-brand-deep/10 rounded-full" />
                            <div className="h-2 w-16 bg-brand-deep/5 rounded-full" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
