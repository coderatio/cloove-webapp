"use client"

import * as React from "react"
import {
    Drawer,
    DrawerContent,
    DrawerTitle,
    DrawerDescription,
    DrawerBody,
    DrawerStickyHeader,
} from "@/app/components/ui/drawer"
import { Button } from "@/app/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { PlusSignIcon as Plus, Delete02Icon as Trash2, Loading03Icon as Loader2, PencilIcon as Pencil, CheckIcon as Check, Cancel01Icon as X, RulerIcon as Ruler } from "@hugeicons/core-free-icons"
import { useUnits, type Unit } from "@/app/hooks/useUnits"
import { ConfirmDialog } from "@/app/components/shared/ConfirmDialog"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/app/lib/utils"
import { GlassCard } from "@/app/components/ui/glass-card"

interface ManageUnitsDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ManageUnitsDrawer({ open, onOpenChange }: ManageUnitsDrawerProps) {
    const { units, createUnit, updateUnit, deleteUnit, isLoading } = useUnits()
    const [newLabel, setNewLabel] = React.useState("")
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [deleteTarget, setDeleteTarget] = React.useState<Unit | null>(null)
    const [editingId, setEditingId] = React.useState<string | null>(null)
    const [editValue, setEditValue] = React.useState("")

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newLabel.trim()) return
        setIsSubmitting(true)
        try {
            await createUnit({ label: newLabel.trim() })
            setNewLabel("")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleUpdate = async (id: string) => {
        if (!editValue.trim()) return
        setIsSubmitting(true)
        try {
            await updateUnit({ id, data: { label: editValue.trim() } })
            setEditingId(null)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        setIsSubmitting(true)
        try {
            await deleteUnit(id)
            setDeleteTarget(null)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
            <Drawer open={open} onOpenChange={onOpenChange}>
                <DrawerContent className="max-w-md h-[85vh]">
                    <DrawerStickyHeader className="text-left px-4 sm:px-8">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-8 h-8 rounded-lg bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                                <HugeiconsIcon icon={Ruler} className="w-4 h-4" />
                            </div>
                            <DrawerTitle className="text-xl font-serif font-medium">Units of Measure</DrawerTitle>
                        </div>
                        <DrawerDescription className="text-sm">Used across products and supplies. Add the units your business sells or stocks in.</DrawerDescription>
                    </DrawerStickyHeader>
                    <DrawerBody className="px-4 sm:px-8 pb-12 overflow-y-auto">
                        <form onSubmit={handleAdd} className="space-y-3 mb-8">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40 ml-1">
                                Add New Unit
                            </label>
                            <div className="flex gap-2">
                                <input
                                    autoFocus
                                    value={newLabel}
                                    onChange={(e) => setNewLabel(e.target.value)}
                                    placeholder="e.g. Tray, Keg, Yard"
                                    className="flex-1 px-5 py-3.5 rounded-2xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 text-brand-deep dark:text-brand-cream text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/20 transition-all font-sans"
                                />
                                <Button
                                    type="submit"
                                    disabled={isSubmitting || !newLabel.trim()}
                                    className="rounded-2xl h-[50px] px-6 bg-brand-deep text-brand-gold dark:bg-brand-gold-700 dark:text-white shadow-lg hover:scale-[1.02] transition-all"
                                >
                                    {isSubmitting ? <HugeiconsIcon icon={Loader2} className="h-4 w-4 animate-spin" /> : <HugeiconsIcon icon={Plus} className="h-4 w-4" />}
                                    <span className="hidden sm:inline ml-1 uppercase tracking-widest text-[10px] font-bold">Add</span>
                                </Button>
                            </div>
                        </form>

                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40 ml-1">
                                Existing Units
                            </h4>

                            {isLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-16 w-full rounded-2xl bg-brand-deep/5 dark:bg-white/5 animate-pulse" />
                                    ))}
                                </div>
                            ) : (
                                <ul className="space-y-3">
                                    <AnimatePresence mode="popLayout">
                                        {units.map((u) => (
                                            <motion.li
                                                key={u.id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <GlassCard className={cn(
                                                    "flex items-center justify-between p-4 bg-white/50 dark:bg-white/5 border-brand-deep/5 dark:border-white/5 transition-all group",
                                                    editingId === u.id ? "ring-2 ring-brand-gold/30 border-brand-gold/20" : "hover:border-brand-gold/30"
                                                )}>
                                                    {editingId === u.id ? (
                                                        <div className="flex-1 flex items-center gap-2 mr-2">
                                                            <input
                                                                autoFocus
                                                                value={editValue}
                                                                onChange={(e) => setEditValue(e.target.value)}
                                                                className="flex-1 bg-transparent border-none text-sm font-medium text-brand-deep dark:text-brand-cream focus:outline-none"
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleUpdate(u.id)
                                                                    if (e.key === 'Escape') setEditingId(null)
                                                                }}
                                                            />
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={() => handleUpdate(u.id)}
                                                                    disabled={isSubmitting || !editValue.trim()}
                                                                    className="p-1.5 cursor-pointer rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                                                                >
                                                                    {isSubmitting ? <HugeiconsIcon icon={Loader2} className="w-3.5 h-3.5 animate-spin" /> : <HugeiconsIcon icon={Check} className="w-3.5 h-3.5" />}
                                                                </button>
                                                                <button
                                                                    onClick={() => setEditingId(null)}
                                                                    className="p-1.5 cursor-pointer rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                                                                >
                                                                    <HugeiconsIcon icon={X} className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <span className="text-sm font-medium text-brand-deep dark:text-brand-cream font-sans truncate">
                                                                    {u.label}
                                                                </span>
                                                                <span className="shrink-0 rounded-md bg-brand-deep/5 dark:bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-brand-deep/50 dark:text-brand-cream/50">
                                                                    {u.code}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1 opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 transition-opacity">
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 rounded-xl w-8 p-0 text-brand-deep/40 dark:text-brand-cream/40 hover:text-brand-gold dark:hover:text-brand-gold hover:bg-brand-gold/5"
                                                                    onClick={() => {
                                                                        setEditingId(u.id)
                                                                        setEditValue(u.label)
                                                                    }}
                                                                >
                                                                    <HugeiconsIcon icon={Pencil} className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 rounded-xl p-0 text-rose-500/50 hover:text-rose-600 hover:bg-rose-500/10"
                                                                    onClick={() => setDeleteTarget(u)}
                                                                >
                                                                    <HugeiconsIcon icon={Trash2} className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        </>
                                                    )}
                                                </GlassCard>
                                            </motion.li>
                                        ))}
                                    </AnimatePresence>
                                </ul>
                            )}
                            {!isLoading && units.length === 0 && (
                                <div className="py-20 text-center space-y-3">
                                    <div className="w-12 h-12 rounded-full bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center mx-auto opacity-40">
                                        <HugeiconsIcon icon={Ruler} className="w-6 h-6" />
                                    </div>
                                    <p className="text-xs font-medium text-brand-accent/30 dark:text-brand-cream/40 uppercase tracking-widest italic">
                                        No units defined yet.
                                    </p>
                                </div>
                            )}
                        </div>
                    </DrawerBody>
                </DrawerContent>
            </Drawer>
            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(o) => !o && setDeleteTarget(null)}
                onConfirm={() => {
                    deleteTarget && handleDelete(deleteTarget.id)
                }}
                isLoading={isSubmitting}
                title="Delete unit?"
                description={deleteTarget ? `"${deleteTarget.label}" will be removed from the list. Products and supplies already using it keep their value.` : ''}
                confirmText="Delete"
                variant="destructive"
            />
        </>
    )
}
