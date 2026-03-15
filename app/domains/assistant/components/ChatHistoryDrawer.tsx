"use client"

import { useState, type ReactElement } from "react"
import { Plus, MessageSquare, Pin, MoreHorizontal, Pencil, PinOff, Archive, Trash2 } from "lucide-react"
import { cn } from "@/app/lib/utils"
import { Button } from "@/app/components/ui/button"
import {
    Drawer,
    DrawerContent,
    DrawerTitle,
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
    onDelete: (id: string) => Promise<void>
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
    onDelete,
}: ChatHistoryDrawerProps): ReactElement {
    const [renamingId, setRenamingId] = useState<string | null>(null)

    // Sort: pinned first, then by date
    const sorted = [...conversations].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1
        if (!a.isPinned && b.isPinned) return 1
        return 0
    })

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="max-h-[80vh]">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-8">
                        <DrawerTitle>Chat History</DrawerTitle>
                        <Button
                            size="sm"
                            onClick={() => {
                                onNewChat()
                                onOpenChange(false)
                            }}
                            className="rounded-full bg-brand-deep text-brand-cream font-bold transition-all duration-300 dark:bg-brand-cream dark:text-brand-deep"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            New
                        </Button>
                    </div>
                    <div className="space-y-2 overflow-y-auto max-h-[50vh] pr-2">
                        {sorted.map((conv) => (
                            <div
                                key={conv.id}
                                className={cn(
                                    "w-full text-left p-4 rounded-2xl transition-all duration-200 h-auto flex items-center gap-3",
                                    activeChatId === conv.id
                                        ? "bg-brand-deep/10 border border-brand-deep/20"
                                        : "bg-white/40 dark:bg-white/5 border border-transparent"
                                )}
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        onSelectChat(conv.id)
                                        onOpenChange(false)
                                    }}
                                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                                >
                                    {conv.isPinned ? (
                                        <Pin className="w-4 h-4 shrink-0 text-brand-gold" />
                                    ) : (
                                        <MessageSquare
                                            className={cn(
                                                "w-4 h-4 shrink-0",
                                                activeChatId === conv.id
                                                    ? "text-brand-deep"
                                                    : "text-brand-accent/30 dark:text-brand-cream/30"
                                            )}
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        {renamingId === conv.id ? (
                                            <input
                                                autoFocus
                                                defaultValue={conv.title}
                                                className="text-sm font-medium w-full bg-transparent border-b border-brand-green outline-none text-brand-deep dark:text-brand-cream"
                                                maxLength={100}
                                                onBlur={(e) => {
                                                    const val = e.target.value.trim()
                                                    setRenamingId(null)
                                                    if (val && val !== conv.title) onRename(conv.id, val)
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") (e.target as HTMLInputElement).blur()
                                                    if (e.key === "Escape") setRenamingId(null)
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        ) : (
                                            <p
                                                className={cn(
                                                    "text-sm font-medium truncate",
                                                    activeChatId === conv.id
                                                        ? "text-brand-deep"
                                                        : "text-brand-deep dark:text-brand-cream"
                                                )}
                                            >
                                                {conv.title}
                                            </p>
                                        )}
                                        <p className="text-[10px] text-brand-accent/40 dark:text-brand-cream/30">
                                            {conv.date}
                                        </p>
                                    </div>
                                </button>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            type="button"
                                            className="h-7 w-7 rounded-xl flex items-center justify-center hover:bg-brand-deep/10 dark:hover:bg-white/10 shrink-0"
                                        >
                                            <MoreHorizontal className="h-3.5 w-3.5 text-brand-accent/60 dark:text-brand-cream/60" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-44 rounded-xl">
                                        <DropdownMenuItem onClick={() => setRenamingId(conv.id)} className="gap-2 text-xs rounded-lg">
                                            <Pencil className="h-3.5 w-3.5" />
                                            Rename
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onPin(conv.id, !conv.isPinned)} className="gap-2 text-xs rounded-lg">
                                            {conv.isPinned ? <><PinOff className="h-3.5 w-3.5" /> Unpin</> : <><Pin className="h-3.5 w-3.5" /> Pin</>}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onArchive(conv.id)} className="gap-2 text-xs rounded-lg">
                                            <Archive className="h-3.5 w-3.5" />
                                            Archive
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => onDelete(conv.id)}
                                            className="gap-2 text-xs rounded-lg text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ))}
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
