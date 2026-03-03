"use client"

import * as React from "react"
import {
    Drawer,
    DrawerContent,
    DrawerTitle,
    DrawerDescription,
    DrawerHeader,
    DrawerBody,
    DrawerClose,
    DrawerStickyHeader,
} from "@/app/components/ui/drawer"
import { Button } from "@/app/components/ui/button"
import { Plus, Trash2, Loader2, Pencil, Check, X, Tag } from "lucide-react"
import { useProductCategories, type ProductCategoryRow } from "../hooks/useProductCategories"
import { ConfirmDialog } from "@/app/components/shared/ConfirmDialog"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/app/lib/utils"
import { GlassCard } from "@/app/components/ui/glass-card"

interface ManageCategoriesDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ManageCategoriesDrawer({ open, onOpenChange }: ManageCategoriesDrawerProps) {
    const { categories, createCategory, updateCategory, deleteCategory, isLoading } = useProductCategories()
    const [newName, setNewName] = React.useState("")
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [deleteTarget, setDeleteTarget] = React.useState<ProductCategoryRow | null>(null)
    const [editingId, setEditingId] = React.useState<string | null>(null)
    const [editValue, setEditValue] = React.useState("")

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newName.trim()) return
        setIsSubmitting(true)
        try {
            await createCategory({ name: newName.trim() })
            setNewName("")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleUpdate = async (id: string) => {
        if (!editValue.trim()) return
        setIsSubmitting(true)
        try {
            await updateCategory({ id, data: { name: editValue.trim() } })
            setEditingId(null)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        setIsSubmitting(true)
        try {
            await deleteCategory(id)
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
                                <Tag className="w-4 h-4" />
                            </div>
                            <DrawerTitle className="text-xl font-serif font-medium">Product Categories</DrawerTitle>
                        </div>
                        <DrawerDescription className="text-sm">Organize your offerings with elegant categorizations.</DrawerDescription>
                    </DrawerStickyHeader>
                    <DrawerBody className="px-4 sm:px-8 pb-12 overflow-y-auto">
                        <form onSubmit={handleAdd} className="space-y-3 mb-8">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40 ml-1">
                                Create New Category
                            </label>
                            <div className="flex gap-2">
                                <input
                                    autoFocus
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="e.g. Handmade Lace"
                                    className="flex-1 px-5 py-3.5 rounded-2xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 text-brand-deep dark:text-brand-cream text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/20 transition-all font-sans"
                                />
                                <Button
                                    type="submit"
                                    disabled={isSubmitting || !newName.trim()}
                                    className="rounded-2xl h-[50px] px-6 bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep shadow-lg hover:scale-[1.02] transition-all"
                                >
                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                    <span className="hidden sm:inline ml-1 uppercase tracking-widest text-[10px] font-bold">Add</span>
                                </Button>
                            </div>
                        </form>

                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40 ml-1">
                                Existing Categories
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
                                        {categories.map((c) => (
                                            <motion.li
                                                key={c.id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <GlassCard className={cn(
                                                    "flex items-center justify-between p-4 bg-white/50 dark:bg-white/5 border-brand-deep/5 dark:border-white/5 transition-all group",
                                                    editingId === c.id ? "ring-2 ring-brand-gold/30 border-brand-gold/20" : "hover:border-brand-gold/30"
                                                )}>
                                                    {editingId === c.id ? (
                                                        <div className="flex-1 flex items-center gap-2 mr-2">
                                                            <input
                                                                autoFocus
                                                                value={editValue}
                                                                onChange={(e) => setEditValue(e.target.value)}
                                                                className="flex-1 bg-transparent border-none text-sm font-medium text-brand-deep dark:text-brand-cream focus:outline-none"
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleUpdate(c.id)
                                                                    if (e.key === 'Escape') setEditingId(null)
                                                                }}
                                                            />
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={() => handleUpdate(c.id)}
                                                                    disabled={isSubmitting || !editValue.trim()}
                                                                    className="p-1.5 cursor-pointer rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                                                                >
                                                                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                                                </button>
                                                                <button
                                                                    onClick={() => setEditingId(null)}
                                                                    className="p-1.5 cursor-pointer rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                                                                >
                                                                    <X className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <span className="text-sm font-medium text-brand-deep dark:text-brand-cream font-sans">
                                                                {c.name}
                                                            </span>
                                                            <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 rounded-xl w-8 p-0 text-brand-deep/40 dark:text-brand-cream/40 hover:text-brand-gold dark:hover:text-brand-gold hover:bg-brand-gold/5"
                                                                    onClick={() => {
                                                                        setEditingId(c.id)
                                                                        setEditValue(c.name)
                                                                    }}
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 rounded-xl p-0 text-rose-500/50 hover:text-rose-600 hover:bg-rose-500/10"
                                                                    onClick={() => setDeleteTarget(c)}
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
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
                            {!isLoading && categories.length === 0 && (
                                <div className="py-20 text-center space-y-3">
                                    <div className="w-12 h-12 rounded-full bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center mx-auto opacity-40">
                                        <Tag className="w-6 h-6" />
                                    </div>
                                    <p className="text-xs font-medium text-brand-accent/30 dark:text-brand-cream/40 uppercase tracking-widest italic">
                                        No categories defined yet.
                                    </p>
                                </div>
                            )}
                        </div>
                    </DrawerBody>
                </DrawerContent>
            </Drawer>
            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                onConfirm={() => {
                    deleteTarget && handleDelete(deleteTarget.id)
                }}
                isLoading={isSubmitting}
                title="Delete category?"
                description={deleteTarget ? `"${deleteTarget.name}" will be removed. Products in this category will have no category.` : ''}
                confirmText="Delete"
                variant="destructive"
            />
        </>
    )
}
