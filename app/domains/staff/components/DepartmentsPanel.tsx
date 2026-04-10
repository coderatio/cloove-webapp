"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Plus,
    Building2,
    Users,
    Pencil,
    Trash2,
    Loader2,
    Search,
} from "lucide-react"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Textarea } from "@/app/components/ui/textarea"
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
} from "@/app/components/ui/drawer"
import { ConfirmDialog } from "@/app/components/shared/ConfirmDialog"
import { cn } from "@/app/lib/utils"
import { useDepartments, type Department } from "../hooks/useDepartments"
import { usePresetPageCopy } from "@/app/domains/workspace/hooks/usePresetPageCopy"

// ─── Avatar ────────────────────────────────────────────────────────────────────

function DeptAvatar({ name }: { name: string }) {
    const initials = name
        .split(/\s+/)
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase()

    const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
    const gradients = [
        "from-brand-gold/80 to-brand-gold/40",
        "from-brand-accent/70 to-brand-deep/60",
        "from-emerald-600/70 to-teal-700/60",
        "from-amber-500/70 to-orange-600/60",
        "from-brand-deep/70 to-brand-accent/60",
    ]
    const g = gradients[hash % gradients.length]

    return (
        <div
            className={cn(
                "w-10 h-10 rounded-2xl bg-linear-to-br flex items-center justify-center shrink-0",
                "text-white font-serif text-sm font-semibold tracking-wide shadow-md",
                g
            )}
        >
            {initials || <Building2 className="w-4 h-4" />}
        </div>
    )
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function DeptSkeleton() {
    return (
        <div className="animate-pulse rounded-[20px] border border-brand-green/8 dark:border-white/6 bg-brand-cream/40 dark:bg-white/3 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-brand-deep/8 dark:bg-white/8 shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-3.5 w-36 rounded-full bg-brand-deep/8 dark:bg-white/8" />
                <div className="h-3 w-24 rounded-full bg-brand-deep/5 dark:bg-white/5" />
            </div>
            <div className="h-6 w-20 rounded-full bg-brand-deep/5 dark:bg-white/5" />
        </div>
    )
}

// ─── Department Card ───────────────────────────────────────────────────────────

function DeptCard({
    dept,
    index,
    onEdit,
    onDelete,
}: {
    dept: Department
    index: number
    onEdit: () => void
    onDelete: () => void
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ delay: index * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="group relative"
        >
            {/* Gold top accent on hover */}
            <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-brand-gold/0 to-transparent group-hover:via-brand-gold/30 transition-all duration-500 rounded-full" />

            <div
                className={cn(
                    "relative rounded-[20px] border overflow-hidden transition-all duration-400",
                    "bg-brand-cream/50 border-brand-green/8 shadow-[0_3px_16px_rgba(6,44,33,0.03)]",
                    "dark:bg-white/3 dark:border-white/6 dark:shadow-[0_3px_16px_rgba(0,0,0,0.12)]",
                    "backdrop-blur-sm",
                    "hover:shadow-[0_8px_32px_rgba(6,44,33,0.07)] hover:border-brand-green/15",
                    "dark:hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)] dark:hover:border-white/10"
                )}
            >
                {/* Inner glow */}
                <div className="absolute inset-0 bg-linear-to-br from-white/30 via-transparent to-transparent dark:from-white/3 pointer-events-none" />

                <div className="relative flex items-center gap-4 p-4">
                    <DeptAvatar name={dept.name} />

                    <div className="flex-1 min-w-0">
                        <p className="font-serif text-[14px] font-semibold text-brand-deep dark:text-brand-cream leading-snug truncate">
                            {dept.name}
                        </p>
                        {dept.description ? (
                            <p className="text-[12px] text-brand-accent/55 dark:text-brand-cream/40 truncate mt-0.5">
                                {dept.description}
                            </p>
                        ) : (
                            <p className="text-[12px] text-brand-accent/30 dark:text-brand-cream/25 mt-0.5 italic">
                                No description
                            </p>
                        )}
                    </div>

                    {/* Member count pill */}
                    <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-brand-deep/5 dark:bg-white/5 border border-brand-deep/6 dark:border-white/6">
                        <Users className="w-3 h-3 text-brand-accent/50 dark:text-brand-cream/40" />
                        <span className="text-[11px] font-semibold text-brand-accent/70 dark:text-brand-cream/60 tabular-nums">
                            {dept.memberCount}
                        </span>
                        <span className="text-[10px] text-brand-accent/40 dark:text-brand-cream/35 hidden sm:inline">
                            {dept.memberCount === 1 ? "member" : "members"}
                        </span>
                    </div>

                    {/* Actions — visible on hover */}
                    <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-xl text-brand-accent/50 hover:text-brand-deep dark:text-brand-cream/40 dark:hover:text-brand-cream"
                            onClick={onEdit}
                        >
                            <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-xl text-red-400/60 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                            onClick={onDelete}
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

// ─── Empty State ────────────────────────────────────────────────────────────────

function DeptEmptyState({
    onAdd,
    title,
    hint,
    buttonLabel,
}: {
    onAdd: () => void
    title: string
    hint: string
    buttonLabel: string
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="py-12 flex flex-col items-center text-center space-y-4"
        >
            <div className="relative">
                <div className="w-16 h-16 rounded-3xl bg-brand-gold/8 dark:bg-brand-gold/10 border border-brand-gold/15 flex items-center justify-center shadow-inner">
                    <Building2 className="w-7 h-7 text-brand-gold/60" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-xl bg-brand-cream dark:bg-brand-deep border border-brand-gold/20 flex items-center justify-center shadow-sm">
                    <Plus className="w-3 h-3 text-brand-gold" />
                </div>
            </div>
            <div className="space-y-1.5 max-w-xs">
                <h4 className="font-serif text-[15px] font-semibold text-brand-deep dark:text-brand-cream">
                    {title}
                </h4>
                <p className="text-[13px] text-brand-accent/55 dark:text-brand-cream/45 leading-relaxed">
                    {hint}
                </p>
            </div>
            <Button
                size="sm"
                variant="secondary"
                className="rounded-full mt-1"
                onClick={onAdd}
            >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                {buttonLabel}
            </Button>
        </motion.div>
    )
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export function DepartmentsPanel() {
    const pageCopy = usePresetPageCopy()
    const departmentsCopy = pageCopy.departments
    const {
        departments,
        isLoading,
        createDepartment,
        updateDepartment,
        deleteDepartment,
        isCreating,
        isUpdating,
        isDeleting,
    } = useDepartments()

    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [editing, setEditing] = useState<Department | null>(null)
    const [confirmDelete, setConfirmDelete] = useState<Department | null>(null)
    const [search, setSearch] = useState("")

    const [name, setName] = useState("")
    const [description, setDescription] = useState("")

    const isSaving = isCreating || isUpdating
    const showSearch = departments.length > 5

    const filtered = useMemo(() => {
        if (!search.trim()) return departments
        const q = search.toLowerCase()
        return departments.filter(
            (d) =>
                d.name.toLowerCase().includes(q) ||
                d.description?.toLowerCase().includes(q)
        )
    }, [departments, search])

    function openCreate() {
        setEditing(null)
        setName("")
        setDescription("")
        setIsDrawerOpen(true)
    }

    function openEdit(dept: Department) {
        setEditing(dept)
        setName(dept.name)
        setDescription(dept.description ?? "")
        setIsDrawerOpen(true)
    }

    async function handleSave() {
        if (!name.trim()) return
        try {
            if (editing) {
                await updateDepartment(editing.id, { name, description: description || null })
            } else {
                await createDepartment({ name, description: description || undefined })
            }
            setIsDrawerOpen(false)
        } catch {
            // handled by mutation
        }
    }

    async function handleDelete() {
        if (!confirmDelete) return
        try {
            await deleteDepartment(confirmDelete.id)
            setConfirmDelete(null)
        } catch {
            // handled by mutation
        }
    }

    const totalMembers = departments.reduce((s, d) => s + d.memberCount, 0)

    return (
        <>
            {/* ── Section Container ── */}
            <GlassCard className="overflow-hidden border-brand-gold/12 bg-linear-to-br from-white/70 to-brand-gold/2 dark:from-white/6 dark:to-brand-gold/2 p-0">

                {/* Header */}
                <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-brand-deep/5 dark:border-white/6">
                    <div className="flex items-start gap-3.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-gold/12 mt-0.5">
                            <Building2 className="h-4 w-4 text-brand-gold" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <p className="font-serif text-[15px] font-semibold text-brand-deep dark:text-brand-cream">
                                    {departmentsCopy.title}
                                </p>
                                {departments.length > 0 && (
                                    <span className="px-2 py-0.5 rounded-full bg-brand-deep/6 dark:bg-white/8 text-[10px] font-bold text-brand-accent/60 dark:text-brand-cream/50 tabular-nums tracking-wide">
                                        {departments.length}
                                    </span>
                                )}
                            </div>
                            <p className="mt-0.5 text-[12.5px] text-brand-deep/55 dark:text-brand-cream/50 max-w-sm">
                                {departmentsCopy.description}
                                {/* {totalMembers > 0 && (
                                    <span className="ml-1.5 text-brand-gold/70">
                                        {totalMembers} total {totalMembers === 1 ? "member" : "members"}.
                                    </span>
                                )} */}
                            </p>
                        </div>
                    </div>

                    <Button
                        size="sm"
                        variant="secondary"
                        className="rounded-full shrink-0"
                        onClick={openCreate}
                    >
                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                        Add
                    </Button>
                </div>

                {/* Body */}
                <div className="px-6 py-4 space-y-3">
                    {/* Search — only when many departments */}
                    <AnimatePresence>
                        {showSearch && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="relative mb-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-deep/30 dark:text-brand-cream/30 pointer-events-none" />
                                    <Input
                                        className="pl-9 h-9 text-sm rounded-xl bg-brand-deep/3 dark:bg-white/3 border-brand-deep/8 dark:border-white/8"
                                        placeholder="Search departments…"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Content */}
                    {isLoading ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map((i) => <DeptSkeleton key={i} />)}
                        </div>
                    ) : departments.length === 0 ? (
                        <DeptEmptyState
                            onAdd={openCreate}
                            title={departmentsCopy.emptyTitle}
                            hint={departmentsCopy.emptyHint}
                            buttonLabel={departmentsCopy.createFirstButton}
                        />
                    ) : filtered.length === 0 ? (
                        <div className="py-8 text-center">
                            <p className="text-sm text-brand-accent/45 dark:text-brand-cream/40">
                                No departments match <span className="font-medium text-brand-accent/70 dark:text-brand-cream/60">&ldquo;{search}&rdquo;</span>
                            </p>
                        </div>
                    ) : (
                        <AnimatePresence initial={false}>
                            {filtered.map((dept, i) => (
                                <DeptCard
                                    key={dept.id}
                                    dept={dept}
                                    index={i}
                                    onEdit={() => openEdit(dept)}
                                    onDelete={() => setConfirmDelete(dept)}
                                />
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </GlassCard>

            {/* ── Create / Edit Drawer ── */}
            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <DrawerContent>
                    <DrawerStickyHeader>
                        <DrawerTitle>
                            {editing ? "Edit Department" : "New Department"}
                        </DrawerTitle>
                        <DrawerDescription>
                            {editing
                                ? departmentsCopy.editDescription
                                : departmentsCopy.createDescription}
                        </DrawerDescription>
                    </DrawerStickyHeader>

                    <div className="flex-1 overflow-y-auto p-8 space-y-6">
                        {/* Preview avatar */}
                        {name.trim() && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center gap-3"
                            >
                                <DeptAvatar name={name} />
                                <div>
                                    <p className="font-serif text-sm font-semibold text-brand-deep dark:text-brand-cream">{name}</p>
                                    {description && (
                                        <p className="text-xs text-brand-accent/50 dark:text-brand-cream/40 truncate max-w-xs">{description}</p>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Divider */}
                        {name.trim() && <div className="border-t border-brand-deep/6 dark:border-white/6" />}

                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 pl-0.5">
                                    Department Name <span className="text-brand-gold normal-case tracking-normal font-normal">*</span>
                                </label>
                                <Input
                                    placeholder={departmentsCopy.namePlaceholder}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSave()}
                                    autoFocus
                                />
                                <p className="text-[11px] text-brand-accent/40 dark:text-brand-cream/35 pl-0.5">
                                    This name is visible to all staff members.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 pl-0.5">
                                    Description{" "}
                                    <span className="normal-case tracking-normal font-normal text-brand-accent/35 dark:text-brand-cream/30">
                                        (optional)
                                    </span>
                                </label>
                                <Textarea
                                    className={cn(
                                        "w-full min-h-[80px] px-3 py-2.5 text-sm rounded-xl resize-none",
                                        "border border-input bg-transparent",
                                        "placeholder:text-muted-foreground",
                                        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0",
                                        "transition-colors duration-150",
                                        "text-brand-deep dark:text-brand-cream"
                                    )}
                                    placeholder={departmentsCopy.descriptionPlaceholder}
                                    value={description}
                                    maxLength={500}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                                <div className="flex justify-end">
                                    <span className="text-[10px] text-brand-accent/30 dark:text-brand-cream/25 tabular-nums">
                                        {description.length}/500
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DrawerFooter>
                        <Button
                            onClick={handleSave}
                            disabled={!name.trim() || isSaving}
                            className="h-13 rounded-2xl"
                        >
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {editing ? "Save Changes" : "Create Department"}
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>

            {/* ── Delete Confirm ── */}
            <ConfirmDialog
                open={!!confirmDelete}
                onOpenChange={(open) => { if (!open) setConfirmDelete(null) }}
                title={`Delete "${confirmDelete?.name}"?`}
                description={
                    confirmDelete?.memberCount
                        ? `This department has ${confirmDelete.memberCount} ${confirmDelete.memberCount === 1 ? "member" : "members"}. All associations will be removed. This cannot be undone.`
                        : "All member associations will be removed. This cannot be undone."
                }
                confirmText="Delete Department"
                variant="destructive"
                isLoading={isDeleting}
                onConfirm={handleDelete}
            />
        </>
    )
}
