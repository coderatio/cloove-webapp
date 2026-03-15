"use client"

import { useMemo, useState, useRef, useEffect, type ReactElement } from "react"
import { MessageSquare, Plus, Search, MoreHorizontal, Pencil, Pin, PinOff, Archive, Trash2 } from "lucide-react"
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
import type { Conversation } from "../types"

interface ChatHistorySidebarProps {
    conversations: Conversation[]
    activeChatId: string
    onSelectChat: (id: string) => void
    onNewChat: () => void
    onRename: (id: string, title: string) => Promise<void>
    onPin: (id: string, pinned: boolean) => Promise<void>
    onArchive: (id: string) => Promise<void>
    onDelete: (id: string) => Promise<void>
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
    return lastMessage.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function InlineRenameInput({
    initialTitle,
    onSave,
    onCancel,
}: {
    initialTitle: string
    onSave: (title: string) => void
    onCancel: () => void
}) {
    const [value, setValue] = useState(initialTitle)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
    }, [])

    const handleSubmit = () => {
        const trimmed = value.trim()
        if (trimmed && trimmed !== initialTitle) {
            onSave(trimmed)
        } else {
            onCancel()
        }
    }

    return (
        <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleSubmit}
            onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit()
                if (e.key === "Escape") onCancel()
            }}
            className="text-sm font-medium w-full bg-transparent border-b border-brand-green dark:border-brand-gold outline-none text-brand-deep dark:text-brand-cream py-0"
            maxLength={100}
        />
    )
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
    onDelete,
}: {
    conv: Conversation
    isActive: boolean
    isRenaming: boolean
    onSelect: () => void
    onStartRename: () => void
    onFinishRename: (title: string) => void
    onCancelRename: () => void
    onPin: () => void
    onArchive: () => void
    onDelete: () => void
}) {
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onSelect}
            onKeyDown={(e) => { if (e.key === "Enter") onSelect() }}
            className={cn(
                "w-full text-left p-3 rounded-2xl transition-all duration-200 group relative border cursor-pointer",
                isActive
                    ? "bg-brand-deep/10 border-brand-deep/20 dark:bg-white/10 dark:border-white/15"
                    : "hover:bg-brand-accent/5 dark:hover:bg-white/5 border-transparent"
            )}
        >
            <div className="flex items-start gap-3 w-full">
                <div
                    className={cn(
                        "mt-0.5 shrink-0 transition-colors duration-200",
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
                <div className="flex-1 min-w-0 space-y-1">
                    {isRenaming ? (
                        <InlineRenameInput
                            initialTitle={conv.title}
                            onSave={onFinishRename}
                            onCancel={onCancelRename}
                        />
                    ) : (
                        <p
                            className={cn(
                                "text-sm font-medium truncate",
                                isActive
                                    ? "text-brand-deep dark:text-brand-cream"
                                    : "text-brand-deep dark:text-brand-cream/80"
                            )}
                        >
                            {conv.title}
                        </p>
                    )}
                    {conv.preview && !isRenaming && (
                        <p className="text-xs text-brand-accent/50 dark:text-brand-cream/50 truncate">
                            {conv.preview}
                        </p>
                    )}
                    {!isRenaming && (
                        <p className="text-[10px] text-brand-accent/40 dark:text-brand-cream/40">
                            {formatConversationDate(conv)}
                        </p>
                    )}
                </div>

                {/* Actions dropdown — visible on hover or when active */}
                <div
                    className={cn(
                        "shrink-0 transition-opacity duration-200",
                        isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                >
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="h-7 w-7 rounded-xl flex items-center justify-center hover:bg-brand-deep/10 dark:hover:bg-white/10 transition-colors"
                            >
                                <MoreHorizontal className="h-3.5 w-3.5 text-brand-accent/60 dark:text-brand-cream/60" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 rounded-xl">
                            <DropdownMenuItem onClick={onStartRename} className="gap-2 text-xs rounded-lg">
                                <Pencil className="h-3.5 w-3.5" />
                                Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onPin} className="gap-2 text-xs rounded-lg">
                                {conv.isPinned ? (
                                    <>
                                        <PinOff className="h-3.5 w-3.5" />
                                        Unpin
                                    </>
                                ) : (
                                    <>
                                        <Pin className="h-3.5 w-3.5" />
                                        Pin
                                    </>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onArchive} className="gap-2 text-xs rounded-lg">
                                <Archive className="h-3.5 w-3.5" />
                                Archive
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={onDelete}
                                className="gap-2 text-xs rounded-lg text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
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
    onDelete,
}: ChatHistorySidebarProps): ReactElement {
    const [query, setQuery] = useState("")
    const [renamingId, setRenamingId] = useState<string | null>(null)

    const filtered = useMemo(() => {
        const normalized = query.trim().toLowerCase()
        if (!normalized) return conversations
        return conversations.filter((conversation) => {
            const haystack = `${conversation.title} ${conversation.preview ?? ""}`.toLowerCase()
            return haystack.includes(normalized)
        })
    }, [conversations, query])

    const groupedConversations = useMemo(() => groupConversations(filtered), [filtered])

    return (
        <div className="hidden lg:flex flex-col w-80 shrink-0 pr-8 border-r border-brand-accent/5 dark:border-white/10 mt-8 h-full">
            <Button
                onClick={onNewChat}
                className="w-full rounded-2xl bg-brand-deep text-brand-cream hover:bg-brand-deep/90 border border-brand-deep/20 h-12 mb-4 transition-all duration-300 shadow-sm dark:bg-white/10 dark:text-brand-cream dark:hover:bg-white/15 dark:border-white/10"
            >
                <Plus className="w-4 h-4 mr-2" />
                New Chat
            </Button>

            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-accent/40 dark:text-brand-cream/40" />
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search conversations"
                    className="h-11 rounded-2xl pl-10 bg-white/80 dark:bg-white/5 border-brand-deep/10 dark:border-white/10 dark:text-brand-cream dark:placeholder:text-brand-cream/40"
                />
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-hide">
                {groupedConversations.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-brand-deep/10 p-6 text-center text-xs text-brand-accent/50 dark:border-white/10 dark:text-brand-cream/50">
                        No conversations match your search.
                    </div>
                )}
                {groupedConversations.map((group) => (
                    <div key={group.label} className="space-y-1">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 mb-2 ml-2">
                            {group.label}
                        </h3>
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
                                onDelete={() => onDelete(conv.id)}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}
