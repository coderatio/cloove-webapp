"use client"

import { useMemo, useState, useRef, useEffect, type ReactElement } from "react"
import { MessageSquare, Plus, Search, MoreHorizontal, Pencil, Pin, PinOff, Archive, Trash2, Loader2, AlertCircle, Check, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/app/lib/utils"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/app/components/ui/base-dialog"
import type { Conversation } from "../types"

interface ChatHistorySidebarProps {
    conversations: Conversation[]
    activeChatId: string
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

function startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function dayDiff(from: Date, to: Date): number {
    const diffMs = startOfDay(to).getTime() - startOfDay(from).getTime()
    return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

interface ConversationGroup {
    label: string
    items: Conversation[]
}

function groupConversations(conversations: Conversation[]): ConversationGroup[] {
    const now = new Date()
    const pinned: Conversation[] = []
    const today: Conversation[] = []
    const yesterday: Conversation[] = []
    const week: Conversation[] = []
    const older: Conversation[] = []

    for (const conversation of conversations) {
        if (conversation.isPinned) {
            pinned.push(conversation)
            continue
        }
        const diffDays = dayDiff(getConversationDate(conversation), now)
        if (diffDays <= 0) today.push(conversation)
        else if (diffDays === 1) yesterday.push(conversation)
        else if (diffDays <= 7) week.push(conversation)
        else older.push(conversation)
    }

    const groups: ConversationGroup[] = []
    if (pinned.length > 0) groups.push({ label: "Pinned", items: pinned })
    if (today.length > 0) groups.push({ label: "Today", items: today })
    if (yesterday.length > 0) groups.push({ label: "Yesterday", items: yesterday })
    if (week.length > 0) groups.push({ label: "Previous 7 days", items: week })
    if (older.length > 0) groups.push({ label: "Older", items: older })
    return groups
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

interface ConversationItemProps {
    conv: Conversation
    isActive: boolean
    isRenaming: boolean
    onSelect: () => void
    onStartRename: () => void
    onFinishRename: (title: string) => void
    onCancelRename: () => void
    onPin: () => void
    onArchive: () => void
    onUnarchive: (id: string) => void
    onDelete: () => void
}

function ConversationItem({
    conv,
    isActive,
    isRenaming,
    onSelect,
    onStartRename,
    onFinishRename,
    onCancelRename,
    onPin,
    onArchive,
    onUnarchive,
    onDelete,
}: ConversationItemProps) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
        >
            <div
                role="button"
                tabIndex={0}
                onClick={onSelect}
                onKeyDown={(e) => { if (e.key === "Enter") onSelect() }}
                className={cn(
                    "w-full text-left p-3 rounded-2xl transition-all duration-300 group relative border cursor-pointer mb-1",
                    isActive
                        ? "bg-brand-deep/10 border-brand-deep/20 dark:bg-white/10 dark:border-white/15 shadow-sm"
                        : "hover:bg-brand-accent/5 dark:hover:bg-white/5 border-transparent hover:border-brand-deep/5 dark:hover:border-white/5"
                )}
            >
                <div className="flex items-center gap-3 w-full">
                    {!isRenaming && (
                        <div
                            className={cn(
                                "shrink-0 transition-colors duration-200",
                                isActive
                                    ? "text-brand-deep dark:text-brand-cream"
                                    : "text-brand-accent/30 group-hover:text-brand-accent/60 dark:text-brand-cream/30 dark:group-hover:text-brand-cream/70"
                            )}
                        >
                            {conv.isPinned ? (
                                <Pin className="w-4 h-4 text-brand-gold" />
                            ) : (
                                <MessageSquare className="w-4 h-4" />
                            )}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        {isRenaming ? (
                            <div className="w-full">
                                <Input
                                    autoFocus
                                    defaultValue={conv.title}
                                    className="h-9 py-0 px-2 text-sm font-medium w-full bg-white dark:bg-white/5 border-brand-green/30 outline-none text-brand-deep dark:text-brand-cream focus:ring-1 focus:ring-brand-green/40 shadow-sm"
                                    maxLength={100}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") onFinishRename(e.currentTarget.value.trim())
                                        if (e.key === "Escape") onCancelRename()
                                    }}
                                    onBlur={(e) => {
                                        // Optional: save on blur or let buttons handle it
                                        // onFinishRename(e.currentTarget.value.trim())
                                    }}
                                    id={`rename-input-${conv.id}`}
                                />
                            </div>
                        ) : (
                            <p
                                className={cn(
                                    "text-sm font-medium truncate leading-tight",
                                    isActive
                                        ? "text-brand-deep dark:text-brand-cream"
                                        : "text-brand-deep dark:text-brand-cream/80"
                                )}
                            >
                                {conv.title}
                            </p>
                        )}
                        {!isRenaming && (
                            <>
                                {conv.preview && (
                                    <p className="text-xs text-brand-accent/50 dark:text-brand-cream/50 truncate mt-0.5">
                                        {conv.preview}
                                    </p>
                                )}
                                <p className="text-[10px] text-brand-accent/40 dark:text-brand-cream/40 mt-1 font-mono uppercase tracking-tighter">
                                    {formatConversationDate(conv)}
                                </p>
                            </>
                        )}
                    </div>

                    {/* Actions dropdown or Rename buttons */}
                    <div
                        className={cn(
                            "view-actions shrink-0 transition-opacity duration-300",
                            isActive || isRenaming ? "opacity-100" : "opacity-40 group-hover:opacity-100"
                        )}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                    >
                        {isRenaming ? (
                            <div className="flex items-center gap-0.5">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400"
                                    onClick={() => {
                                        const input = document.getElementById(`rename-input-${conv.id}`) as HTMLInputElement
                                        if (input) onFinishRename(input.value.trim())
                                    }}
                                >
                                    <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                                    onClick={onCancelRename}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-xl opacity-40 hover:opacity-100 group-hover:opacity-40 transition-all duration-300 hover:bg-white dark:hover:bg-white/10"
                                    >
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="w-48 bg-white dark:bg-brand-green border-none shadow-xl rounded-2xl p-1 z-50"
                                >
                                    <DropdownMenuItem
                                        onSelect={() => onStartRename()}
                                        className="rounded-xl flex items-center gap-2 text-sm px-3 py-2 cursor-pointer hover:bg-brand-deep/5 dark:hover:bg-white/5 transition-colors"
                                    >
                                        <Pencil className="w-4 h-4" />
                                        Rename
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onSelect={() => onPin()}
                                        className="rounded-xl flex items-center gap-2 text-sm px-3 py-2 cursor-pointer hover:bg-brand-deep/5 dark:hover:bg-white/5 transition-colors"
                                    >
                                        {conv.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                                        {conv.isPinned ? "Unpin" : "Pin"}
                                    </DropdownMenuItem>
                                    {conv.isArchived ? (
                                        <DropdownMenuItem
                                            onSelect={() => onUnarchive(conv.id)}
                                            className="rounded-xl flex items-center gap-2 text-sm px-3 py-2 cursor-pointer hover:bg-brand-deep/5 dark:hover:bg-white/5 transition-colors"
                                        >
                                            <Archive className="w-4 h-4" />
                                            Restore
                                        </DropdownMenuItem>
                                    ) : (
                                        <DropdownMenuItem
                                            onSelect={() => onArchive()}
                                            className="rounded-xl flex items-center gap-2 text-sm px-3 py-2 cursor-pointer hover:bg-brand-deep/5 dark:hover:bg-white/5 transition-colors"
                                        >
                                            <Archive className="w-4 h-4" />
                                            Archive
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator className="my-1 border-brand-accent/5 dark:border-white/5" />
                                    <DropdownMenuItem
                                        onSelect={() => onDelete()}
                                        className="rounded-xl flex items-center gap-2 text-sm px-3 py-2 cursor-pointer text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

export function ChatHistorySidebar({
    conversations,
    activeChatId,
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
}: ChatHistorySidebarProps): ReactElement {
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

    const groupedConversations = useMemo(() => groupConversations(filtered), [filtered])

    const handleDeleteConfirm = async () => {
        if (deleteConfirmId) {
            await onDelete(deleteConfirmId)
            setDeleteConfirmId(null)
        }
    }

    return (
        <div className="hidden lg:flex flex-col w-80 shrink-0 pr-8 border-r border-brand-accent/5 dark:border-white/10 h-full py-4">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
            >
                <Button
                    onClick={onNewChat}
                    className="w-full rounded-2xl bg-brand-deep text-brand-cream hover:bg-brand-deep/90 border border-brand-deep/20 h-12 mb-4 transition-all duration-300 shadow-lg dark:bg-white/10 dark:text-brand-cream dark:hover:bg-white/15 dark:border-white/10"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    New Conversation
                </Button>

                <div className="flex items-center justify-between mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-accent/40 dark:text-brand-cream/40 z-10" />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search library..."
                            className="h-11 rounded-2xl pl-11 bg-white/60 dark:bg-white/5 border-brand-accent/10 dark:border-white/10 dark:text-brand-cream dark:placeholder:text-brand-cream/40 focus:bg-white dark:focus:bg-white/10 transition-all duration-300"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => isArchivedView && onToggleArchived?.()}
                        className={cn(
                            "h-auto py-1 text-xs font-bold tracking-widest uppercase transition-all duration-300 hover:bg-transparent",
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
                            "h-auto py-1 text-xs font-bold tracking-widest uppercase transition-all duration-300 hover:bg-transparent",
                            isArchivedView ? "text-brand-deep dark:text-brand-cream" : "text-brand-accent/30 dark:text-brand-cream/30 hover:text-brand-accent/60"
                        )}
                    >
                        Archived
                    </Button>
                </div>
            </motion.div>

            <div className="flex-1 overflow-y-auto space-y-8 pr-2 scrollbar-hide">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 text-brand-accent/40 dark:text-brand-cream/40">
                        <Loader2 className="h-6 w-6 animate-spin text-brand-gold" />
                        <span className="text-sm font-medium tracking-wide">Retrieving history...</span>
                    </div>
                ) : groupedConversations.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="rounded-3xl border border-dashed border-brand-deep/10 p-10 text-center text-sm text-brand-accent/50 dark:border-white/10 dark:text-brand-cream/50 bg-brand-deep/2 dark:bg-white/2"
                    >
                        <Search className="h-6 w-6 mx-auto mb-3 opacity-20" />
                        No threads found.
                    </motion.div>
                ) : (
                    <AnimatePresence mode="popLayout" initial={false}>
                        {groupedConversations.map((group) => (
                            <div key={group.label} className="space-y-2">
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent/40 dark:text-brand-cream/40 mb-3 ml-2.5">
                                    {group.label}
                                </h3>
                                <div className="space-y-1">
                                    {group.items.map((conv) => (
                                        <ConversationItem
                                            key={conv.id}
                                            conv={conv}
                                            isActive={activeChatId === conv.id}
                                            isRenaming={renamingId === conv.id}
                                            onSelect={() => onSelectChat(conv.id)}
                                            onStartRename={() => setRenamingId(conv.id)}
                                            onFinishRename={async (title) => {
                                                setRenamingId(null)
                                                await onRename(conv.id, title)
                                            }}
                                            onCancelRename={() => setRenamingId(null)}
                                            onPin={() => onPin(conv.id, !conv.isPinned)}
                                            onArchive={() => onArchive(conv.id)}
                                            onUnarchive={onUnarchive}
                                            onDelete={() => setDeleteConfirmId(conv.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* Secured Delete Confirmation Dialog */}
            <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
                <DialogContent className="max-w-md bg-white dark:bg-brand-green border-none shadow-2xl rounded-3xl">
                    <DialogHeader>
                        <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                        <DialogTitle>Delete Conversation?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. All messages in this thread will be permanently removed from your history.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setDeleteConfirmId(null)}
                            className="rounded-xl"
                        >
                            Keep it
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
                        >
                            Delete Permanently
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

