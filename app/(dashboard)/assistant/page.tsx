"use client"

import { useState, useRef, useEffect } from 'react'
import { PageTransition } from '@/app/components/layout/page-transition'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Bot, User, ArrowUp, History, Plus, MessageSquare, Search } from 'lucide-react'
import { cn } from '@/app/lib/utils'
import { Button } from '@/app/components/ui/button'
import { GlassCard } from '@/app/components/ui/glass-card'
import { Markdown } from '@/app/components/ui/markdown'
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerTrigger,
} from "@/app/components/ui/drawer"
import { useChat, type UIMessage as AIMessage } from '@ai-sdk/react'
import { type UIMessagePart, type UIDataTypes, type UITools } from 'ai'

// Conversation metadata interface
interface Conversation {
    id: string;
    title: string;
    date: string;
    messages: (Omit<AIMessage, 'parts'> & { parts: UIMessagePart<UIDataTypes, UITools>[], createdAt?: Date })[];
}

const mockToolParts: UIMessagePart<UIDataTypes, UITools>[] = [
    {
        type: 'tool-listInventory',
        toolCallId: 'inventory-1',
        state: 'output-available',
        input: { category: 'Beverages' },
        output: [
            { id: 1, name: 'Coca Cola 50cl', stock: 24, price: 300 },
            { id: 2, name: 'Pepsi 50cl', stock: 12, price: 250 },
            { id: 3, name: 'Fanta 50cl', stock: 0, price: 250 },
        ]
    }
]

const defaultConversations: Conversation[] = [
    {
        id: 'weekly-performance-1',
        title: "Weekly Performance",
        date: "Today",
        messages: [
            {
                id: 'm1',
                role: 'assistant',
                createdAt: new Date(),
                parts: [
                    { type: 'text', text: "Hello. I've analysed your store's performance. Recent inventory check shows some items are out of stock." },
                    ...mockToolParts
                ]
            },
            {
                id: 'm2',
                role: 'user',
                parts: [{ type: 'text', text: "Which items are out of stock?" }],
                createdAt: new Date()
            }
        ]
    }
]

// Tool Rendering Components
const ToolRenderer = ({ part, addToolResult }: {
    part: UIMessagePart<UIDataTypes, UITools>,
    addToolResult: (args: {
        toolCallId: string;
        tool: string;
        state?: 'output-available';
        output: any;
    } | {
        state: 'output-error';
        tool: string;
        toolCallId: string;
        errorText: string;
    }) => void
}) => {
    if (part.type === 'tool-listInventory' && part.state === 'output-available') {
        const items = part.output as any[];
        return (
            <div className="mt-4 overflow-hidden rounded-2xl border border-brand-accent/10 bg-white/50 dark:bg-black/20 backdrop-blur-sm">
                <table className="w-full text-left text-xs">
                    <thead className="bg-brand-accent/5">
                        <tr>
                            <th className="p-3 text-brand-deep/40 dark:text-brand-cream/40 font-bold uppercase tracking-wider">Product</th>
                            <th className="p-3 text-brand-deep/40 dark:text-brand-cream/40 font-bold uppercase tracking-wider">Stock</th>
                            <th className="p-3 text-brand-deep/40 dark:text-brand-cream/40 font-bold uppercase tracking-wider text-right">Price</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-accent/5">
                        {items.map((item) => (
                            <tr key={item.id} className="hover:bg-brand-accent/5 transition-colors">
                                <td className="p-3 font-medium text-brand-deep dark:text-brand-cream">{item.name}</td>
                                <td className="p-3">
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-full text-[10px] font-bold",
                                        item.stock > 0 ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                                    )}>
                                        {item.stock > 0 ? `${item.stock} in stock` : 'Out of stock'}
                                    </span>
                                </td>
                                <td className="p-3 text-right font-mono text-brand-gold">₦{item.price}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    if (part.type === 'tool-requestApproval') {
        return (
            <GlassCard className="mt-4 border-brand-gold/20 bg-brand-gold/5 overflow-hidden">
                <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-8 w-8 rounded-full bg-brand-gold/20 flex items-center justify-center text-brand-gold">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <h4 className="text-sm font-serif font-medium text-brand-gold">Approval Required</h4>
                    </div>
                    <p className="text-xs text-brand-deep/60 dark:text-brand-cream/60 leading-relaxed mb-4">
                        {(part.input as any)?.message || "Please confirm this action."}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            className="flex-1 bg-brand-gold text-brand-deep font-bold hover:bg-brand-gold/90"
                            onClick={() => addToolResult({
                                toolCallId: part.toolCallId,
                                tool: 'requestApproval',
                                output: { approved: true }
                            })}
                            disabled={part.state === 'output-available'}
                        >
                            Approve
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="flex-1 border border-brand-accent/10 text-brand-deep dark:text-brand-cream"
                            onClick={() => addToolResult({
                                toolCallId: part.toolCallId,
                                tool: 'requestApproval',
                                output: { approved: false }
                            })}
                            disabled={part.state === 'output-available'}
                        >
                            Decline
                        </Button>
                    </div>
                </div>
            </GlassCard>
        );
    }

    return null;
}

export default function AssistantPage() {
    const [conversations, setConversations] = useState<Conversation[]>(defaultConversations)
    const [activeChatId, setActiveChatId] = useState('weekly-performance-1')
    const [isHistoryOpen, setIsHistoryOpen] = useState(false)
    const chatEndRef = useRef<HTMLDivElement>(null)

    // Using Vercel AI SDK useChat
    const { messages, addToolResult, sendMessage } = useChat({
        messages: conversations.find(c => c.id === activeChatId)?.messages || [],
        id: activeChatId,
    })

    const [input, setInput] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return

        const text = input
        setInput('')

        await sendMessage({ text })
    }

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const activeChat = conversations.find(c => c.id === activeChatId) || conversations[0]

    const startNewChat = () => {
        const newId = Date.now().toString()
        const newChat: Conversation = {
            id: newId,
            title: "New Conversation",
            date: "Just now",
            messages: []
        }
        setConversations(prev => [newChat, ...prev])
        setActiveChatId(newId)
        setIsHistoryOpen(false)
    }

    return (
        <PageTransition>
            <div className="flex flex-col md:flex-row h-[100dvh] md:h-[calc(100vh-100px)] relative md:pt-0 max-w-7xl mx-auto md:px-4">

                {/* Desktop History Sidebar */}
                <div className="hidden md:flex flex-col w-72 shrink-0 pr-8 border-r border-brand-accent/5 mt-8 h-full">
                    <Button
                        onClick={startNewChat}
                        className="w-full rounded-2xl bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20 border border-brand-gold/20 h-12 mb-8"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Chat
                    </Button>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 mb-4 ml-2">Recent History</h3>
                        {conversations.map((conv) => (
                            <button
                                key={conv.id}
                                onClick={() => setActiveChatId(conv.id)}
                                className={cn(
                                    "w-full text-left p-4 rounded-2xl transition-all group relative overflow-hidden",
                                    activeChatId === conv.id
                                        ? "bg-brand-gold/10 border border-brand-gold/20"
                                        : "hover:bg-brand-accent/5 border border-transparent"
                                )}
                            >
                                <div className="flex items-start gap-3 relative z-10">
                                    <div className={cn(
                                        "mt-0.5 shrink-0",
                                        activeChatId === conv.id ? "text-brand-gold" : "text-brand-accent/30 group-hover:text-brand-accent/60"
                                    )}>
                                        <MessageSquare className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn(
                                            "text-sm font-medium truncate mb-1",
                                            activeChatId === conv.id ? "text-brand-gold" : "text-brand-deep dark:text-brand-cream/80"
                                        )}>
                                            {conv.title}
                                        </p>
                                        <p className="text-[10px] text-brand-accent/40">{conv.date}</p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Chat Container */}
                <div className="flex-1 flex flex-col h-full min-w-0 md:pl-8">
                    {/* Top Bar (Desktop Only) */}
                    <div className="hidden md:flex flex-shrink-0 items-center justify-between py-6 md:py-0 md:mb-6 mt-8 md:mt-8">
                        <div className="flex-1 min-w-0">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-gold/10 text-brand-gold text-xs font-medium mb-2 border border-brand-gold/20">
                                <Sparkles className="w-3 h-3" />
                                <span>Cloove Intelligence</span>
                            </div>
                            <h1 className="font-serif text-2xl md:text-3xl font-medium text-brand-deep dark:text-brand-cream truncate">
                                {activeChat.title}
                            </h1>
                        </div>
                    </div>

                    {/* Mobile History Drawer Trigger - Floating Top Right */}
                    <div className="md:hidden fixed top-6 right-6 z-30">
                        <Drawer open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                            <DrawerTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-brand-accent/10 shadow-lg">
                                    <History className="h-5 w-5 text-brand-deep dark:text-brand-cream" />
                                </Button>
                            </DrawerTrigger>
                            <DrawerContent className="max-h-[80vh]">
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-8">
                                        <DrawerTitle>Chat History</DrawerTitle>
                                        <Button
                                            size="sm"
                                            onClick={startNewChat}
                                            className="rounded-full bg-brand-gold text-brand-deep font-bold"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            New
                                        </Button>
                                    </div>
                                    <div className="space-y-3 overflow-y-auto max-h-[50vh] pr-2">
                                        {conversations.map((conv) => (
                                            <button
                                                key={conv.id}
                                                onClick={() => {
                                                    setActiveChatId(conv.id)
                                                    setIsHistoryOpen(false)
                                                }}
                                                className={cn(
                                                    "w-full text-left p-4 rounded-2xl transition-all",
                                                    activeChatId === conv.id
                                                        ? "bg-brand-gold/10 border border-brand-gold/20"
                                                        : "bg-white/40 dark:bg-white/5 border border-transparent"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <MessageSquare className={cn("w-4 h-4", activeChatId === conv.id ? "text-brand-gold" : "text-brand-accent/30")} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className={cn("text-sm font-medium truncate", activeChatId === conv.id ? "text-brand-gold" : "text-brand-deep dark:text-brand-cream")}>{conv.title}</p>
                                                        <p className="text-[10px] text-brand-accent/40">{conv.date}</p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </DrawerContent>
                        </Drawer>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto space-y-6 pb-24 md:pb-32 scrollbar-hide px-1 pt-24 md:pt-0">
                        <AnimatePresence initial={false}>
                            {messages.map((msg: AIMessage) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className={cn("flex w-full flex-col", msg.role === 'user' ? "items-end" : "items-start")}
                                >
                                    <div className={cn(
                                        "text-sm md:text-base leading-relaxed relative overflow-hidden transition-all",
                                        msg.role === 'user'
                                            ? "bg-brand-deep text-brand-cream rounded-2xl rounded-br-sm dark:bg-brand-gold dark:text-brand-deep shadow-sm max-w-[85%] md:max-w-[70%] p-5"
                                            : "w-full bg-transparent text-brand-deep dark:text-brand-cream px-1"
                                    )}>
                                        {msg.role === 'assistant' && (
                                            <div className="mb-2">
                                                <span className="block text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-brand-deep to-brand-green dark:from-brand-green dark:to-brand-cream bg-clip-text text-transparent w-fit">
                                                    Cloove AI
                                                </span>
                                            </div>
                                        )}

                                        <div className={cn("relative z-10", msg.role === 'user' ? "pr-2" : "")}>
                                            {msg.parts.map((part: UIMessagePart<UIDataTypes, UITools>, partIndex: number) => {
                                                if (part.type === 'text') {
                                                    return (
                                                        <Markdown
                                                            key={partIndex}
                                                            content={part.text}
                                                            className={msg.role === 'user' ? "text-brand-cream dark:text-brand-deep prose-invert" : ""}
                                                        />
                                                    );
                                                }
                                                if (part.type.startsWith('tool-')) {
                                                    return (
                                                        <ToolRenderer
                                                            key={partIndex}
                                                            part={part}
                                                            addToolResult={addToolResult}
                                                        />
                                                    );
                                                }
                                                return null;
                                            })}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Area - Floating Glass */}
                    <div className="fixed bottom-6 left-4 right-4 z-20 md:sticky md:bottom-8 border-t-0 md:w-full">
                        <GlassCard className="p-2 flex items-center gap-2 rounded-full border-brand-deep/5 dark:border-white/10 bg-white/60 dark:bg-black/40 shadow-xl backdrop-blur-xl">
                            <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2 pl-4">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask about your business..."
                                    className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-brand-deep dark:text-brand-cream placeholder:text-brand-deep/40 dark:placeholder:text-brand-cream/40 h-10 text-base"
                                />
                                <Button
                                    size="icon"
                                    type="submit"
                                    className={cn(
                                        "h-10 w-10 rounded-full transition-all shrink-0",
                                        input.trim()
                                            ? "bg-brand-deep text-brand-gold hover:bg-brand-deep/90 dark:bg-brand-gold dark:text-brand-deep"
                                            : "bg-zinc-100 text-zinc-400 dark:bg-white/10 dark:text-white/40"
                                    )}
                                    disabled={!input.trim()}
                                >
                                    <ArrowUp className="h-5 w-5" />
                                </Button>
                            </form>
                        </GlassCard>
                    </div>
                </div>
            </div>
        </PageTransition>
    )
}
