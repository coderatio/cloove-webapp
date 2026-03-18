"use client"

import { useState, useMemo, useRef, useEffect, type ReactElement } from "react"
import { Check, X, Plus, MessageSquare, Pin, MoreHorizontal, Pencil, PinOff, Archive, Trash2, Loader2, Search, AlertCircle, FileText, Receipt } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/app/lib/utils"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import {
    Drawer,
    DrawerContent,
    DrawerTitle,
    DrawerStickyHeader,
    DrawerBody,
    DrawerFooter,
    DrawerDescription,
} from "@/app/components/ui/drawer"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import type { Conversation } from "../types"

interface ChatHistoryDrawerProps {
    conversations: Conversation[]
    activeChatId: string
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelectChat: (id: string) => void
    onNewChat: () => void
    onRename: (id: string, title: string) => Promise<void>
    onPin: (id: string, pinned: boolean) => Promise<void>
    onArchive: (id: string) => Promise<void>
    onUnarchive: (id: string) => Promise<void>
    onDelete: (id: string) => Promise<void>
    isArchivedView?: boolean
    onToggleArchived?: () => void
    isLoading?: boolean
}

function getConversationDate(conversation: Conversation): Date {
    if (conversation.lastMessageAt instanceof Date) return conversation.lastMessageAt
    const lastMessage = conversation.messages[conversation.messages.length - 1]
    if (lastMessage?.createdAt instanceof Date) return lastMessage.createdAt
    return new Date()
}

function formatConversationDate(conversation: Conversation): string {
    const lastMessage = getConversationDate(conversation)
    return lastMessage.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    })
}

export function ChatHistoryDrawer({
    conversations,
    activeChatId,
    open,
    onOpenChange,
    onSelectChat,
    onNewChat,
    onRename,
    onPin,
    onArchive,
    onUnarchive,
    onDelete,
    isArchivedView,
    onToggleArchived,
    isLoading,
}: ChatHistoryDrawerProps): ReactElement {
    const [query, setQuery] = useState("")
    const [renamingId, setRenamingId] = useState<string | null>(null)
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

    const filtered = useMemo(() => {
        const normalized = query.trim().toLowerCase()
        if (!normalized) return conversations
        return conversations.filter((conversation) => {
            const haystack = `${conversation.title} ${conversation.preview ?? ""}`.toLowerCase()
            return haystack.includes(normalized)
        })
    }, [conversations, query])

    // Sort: pinned first, then by date
    const sorted = useMemo(() => {
        return [...filtered].sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1
            if (!a.isPinned && b.isPinned) return 1
            return 0
        })
    }, [filtered])


    const handleDeleteConfirm = async () => {
        if (deleteConfirmId) {
            await onDelete(deleteConfirmId)
            setDeleteConfirmId(null)
        }
    }

    return (
        <>
            <Drawer open={open} onOpenChange={onOpenChange}>
                <DrawerContent className="max-h-[85vh]">
                    <DrawerStickyHeader className="pb-6">
                        <div className="flex items-center justify-between mb-6">
                            <DrawerTitle className="text-2xl">Chat Library</DrawerTitle>
                            <Button
                                size="sm"
                                onClick={() => {
                                    onNewChat()
                                    onOpenChange(false)
                                }}
                                className="rounded-2xl bg-brand-deep text-brand-cream font-bold px-6 h-10 transition-all duration-300 dark:bg-brand-cream dark:text-brand-deep shadow-lg"
                            >
                                <Plus className="w-5 h-5 mr-1.5" />
                                New
                            </Button>
                        </div>

                        <div className="relative mb-6">
                            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-accent/40 dark:text-brand-cream/40 overflow-hidden z-10" />
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search conversations"
                                className="h-12 rounded-2xl pl-11 bg-white dark:bg-white/5 border-brand-accent/5 dark:border-white/10 dark:text-brand-cream dark:placeholder:text-brand-cream/40 focus:bg-white dark:focus:bg-white/10"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => isArchivedView && onToggleArchived?.()}
                                className={cn(
                                    "h-auto py-1 text-xs font-bold tracking-widest uppercase transition-all duration-300 px-2 hover:bg-transparent",
                                    !isArchivedView ? "text-brand-deep dark:text-brand-cream" : "text-brand-accent/30 dark:text-brand-cream/30 hover:text-brand-accent/60"
                                )}
                            >
                                Active
                            </Button>
                            <div className="h-3 w-px bg-brand-accent/10 dark:bg-white/10" />
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => !isArchivedView && onToggleArchived?.()}
                                className={cn(
                                    "h-auto py-1 text-xs font-bold tracking-widest uppercase transition-all duration-300 px-2 hover:bg-transparent",
                                    isArchivedView ? "text-brand-deep dark:text-brand-cream" : "text-brand-accent/30 dark:text-brand-cream/30 hover:text-brand-accent/60"
                                )}
                            >
                                Archived
                            </Button>
                        </div>
                    </DrawerStickyHeader>

                    <DrawerBody className="pt-2 px-6 pb-12 scrollbar-hide">
                        <div className="space-y-3">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4 text-brand-accent/40 dark:text-brand-cream/40">
                                    <Loader2 className="h-6 w-6 animate-spin text-brand-gold" />
                                    <span className="text-sm font-medium tracking-wide">Syncing history...</span>
                                </div>
                            ) : sorted.length === 0 ? (
                                <div className="rounded-3xl border border-dashed border-brand-deep/10 p-12 text-center text-sm text-brand-accent/50 dark:border-white/10 dark:text-brand-cream/50 bg-brand-deep/2 dark:bg-white/2">
                                    <Search className="h-8 w-8 mx-auto mb-4 opacity-10" />
                                    {query ? "No matches found." : "Your history is empty."}
                                </div>
                            ) : (
                                <AnimatePresence mode="popLayout" initial={false}>
                                    {sorted.map((conv) => (
                                        <motion.div
                                            key={conv.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className={cn(
                                                "w-full p-4 rounded-2xl transition-all duration-300 relative group border",
                                                activeChatId === conv.id
                                                    ? "bg-brand-deep/10 border-brand-deep/20 shadow-sm"
                                                    : "bg-white/60 dark:bg-white/5 border-transparent active:scale-[0.98] transition-transform"
                                            )}
                                        >
                                            <div
                                                role="button"
                                                onClick={() => {
                                                    onSelectChat(conv.id)
                                                    onOpenChange(false)
                                                }}
                                                className="flex items-center gap-4 w-full cursor-pointer"
                                            >
                                                {renamingId !== conv.id && (
                                                    <div
                                                        className={cn(
                                                            "p-2 rounded-xl bg-brand-deep/5 dark:bg-white/5 shrink-0 transition-colors duration-200",
                                                            conv.id === activeChatId ? "text-brand-deep dark:text-brand-cream" : "text-brand-accent/40 dark:text-brand-cream/40"
                                                        )}
                                                    >
                                                        {conv.isPinned ? (
                                                            <Pin className="w-4 h-4 text-brand-gold fill-brand-gold/10" />
                                                        ) : conv.agentType === "proposal" ? (
                                                            <FileText className="w-4 h-4 text-emerald-500" />
                                                        ) : conv.agentType === "invoice" ? (
                                                            <Receipt className="w-4 h-4 text-amber-500" />
                                                        ) : (
                                                            <MessageSquare className="w-4 h-4" />
                                                        )}
                                                    </div>
                                                )}

                                                <div className="flex-1 min-w-0">
                                                    {renamingId === conv.id ? (
                                                        <div className="w-full" onClick={(e) => e.stopPropagation()}>
                                                            <Input
                                                                autoFocus
                                                                defaultValue={conv.title}
                                                                className="h-9 py-0 px-2 text-sm font-medium w-full bg-white dark:bg-white/5 border-brand-green/30 outline-none text-brand-deep dark:text-brand-cream focus:ring-1 focus:ring-brand-green/40 shadow-sm"
                                                                maxLength={100}
                                                                id={`rename-input-mobile-${conv.id}`}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Enter") onRename(conv.id, e.currentTarget.value.trim()).then(() => setRenamingId(null))
                                                                    if (e.key === "Escape") setRenamingId(null)
                                                                }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <p
                                                                className={cn(
                                                                    "font-medium text-base truncate mb-1",
                                                                    conv.id === activeChatId ? "text-brand-deep dark:text-brand-cream" : "text-brand-accent dark:text-brand-cream/90"
                                                                )}
                                                            >
                                                                {conv.title || "New Search"}
                                                            </p>
                                                            <p className="text-xs text-brand-accent/40 dark:text-brand-cream/40 font-medium">
                                                                {formatConversationDate(conv)}
                                                            </p>
                                                        </>
                                                    )}
                                                </div>

                                                <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                                                    {renamingId === conv.id ? (
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-9 w-9 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400"
                                                                onClick={() => {
                                                                    const input = document.getElementById(`rename-input-mobile-${conv.id}`) as HTMLInputElement
                                                                    if (input) onRename(conv.id, input.value.trim()).then(() => setRenamingId(null))
                                                                }}
                                                            >
                                                                <Check className="h-4.5 w-4.5" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-9 w-9 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                                                                onClick={() => setRenamingId(null)}
                                                            >
                                                                <X className="h-4.5 w-4.5" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-10 w-10 -mr-2 opacity-40 hover:opacity-100 transition-opacity active:scale-95 bg-white dark:bg-white/10 shadow-sm rounded-xl"
                                                                >
                                                                    <MoreHorizontal className="h-5 w-5" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent
                                                                align="end"
                                                                className="w-56 bg-white dark:bg-brand-green border-none shadow-2xl rounded-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-200"
                                                            >
                                                                 <DropdownMenuItem
                                                                    onSelect={() => setRenamingId(conv.id)}
                                                                    className="rounded-xl flex items-center gap-3 text-base px-4 py-3 cursor-pointer hover:bg-brand-deep/5 dark:hover:bg-white/5 font-medium transition-colors"
                                                                >
                                                                    <Pencil className="w-4 h-4" />
                                                                    Rename
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onSelect={() => onPin(conv.id, !conv.isPinned)}
                                                                    className="rounded-xl flex items-center gap-3 text-base px-4 py-3 cursor-pointer hover:bg-brand-deep/5 dark:hover:bg-white/5 font-medium transition-colors"
                                                                >
                                                                    {conv.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                                                                    {conv.isPinned ? "Unpin" : "Pin"}
                                                                </DropdownMenuItem>
                                                                {conv.isArchived ? (
                                                                    <DropdownMenuItem
                                                                        onSelect={() => onUnarchive(conv.id)}
                                                                        className="rounded-xl flex items-center gap-3 text-base px-4 py-3 cursor-pointer hover:bg-brand-deep/5 dark:hover:bg-white/5 font-medium transition-colors"
                                                                    >
                                                                        <Archive className="w-4 h-4" />
                                                                        Restore
                                                                    </DropdownMenuItem>
                                                                ) : (
                                                                    <DropdownMenuItem
                                                                        onSelect={() => onArchive(conv.id)}
                                                                        className="rounded-xl flex items-center gap-3 text-base px-4 py-3 cursor-pointer hover:bg-brand-deep/5 dark:hover:bg-white/5 font-medium transition-colors"
                                                                    >
                                                                        <Archive className="w-4 h-4" />
                                                                        Archive
                                                                    </DropdownMenuItem>
                                                                )}
                                                                <DropdownMenuSeparator className="my-1.5 bg-brand-deep/5 dark:bg-white/5" />
                                                                <DropdownMenuItem
                                                                    onSelect={() => setDeleteConfirmId(conv.id)}
                                                                    className="rounded-xl flex items-center gap-3 text-base px-4 py-3 cursor-pointer text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 font-bold transition-colors"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>
                    </DrawerBody>
                </DrawerContent>
            </Drawer>

            {/* Secured Delete Confirmation Drawer (Stacked/Nested) */}
            <Drawer open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
                <DrawerContent className="max-h-[50vh] bg-white dark:bg-brand-green border-none shadow-2xl rounded-t-3xl">
                    <DrawerStickyHeader className="pb-2">
                        <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                        <DrawerTitle className="text-2xl">Delete Permanently?</DrawerTitle>
                        <DrawerDescription className="text-brand-accent/60 dark:text-brand-cream/60 mt-2">
                            This thread and all its messages will be removed forever. This action is irreversible.
                        </DrawerDescription>
                    </DrawerStickyHeader>
                    <DrawerFooter className="gap-3 mt-4 pt-0">
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            className="rounded-2xl h-14 w-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 font-bold text-base"
                        >
                            Confirm Delete
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setDeleteConfirmId(null)}
                            className="rounded-2xl h-14 w-full text-brand-accent/60 dark:text-brand-cream/60 font-medium"
                        >
                            Keep Conversation
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </>
    )
}

