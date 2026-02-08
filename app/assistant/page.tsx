"use client"

import { useState, useRef, useEffect } from 'react'
import { PageTransition } from '../components/layout/page-transition'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Bot, User, ArrowUp } from 'lucide-react'
import { cn } from '../lib/utils'
import { Button } from '../components/ui/button'
import { GlassCard } from '../components/ui/glass-card'
import { Markdown } from '../components/ui/markdown'

const initialMessages = [
    {
        id: 1,
        role: 'assistant' as const,
        title: "Assistant",
        content: "Hello. I'm analysing your store's performance. How can I help you today?"
    },
    {
        id: 2,
        role: 'user' as const,
        content: "How are my sales this week?"
    },
    {
        id: 3,
        role: 'assistant' as const,
        title: "Weekly Performance",
        content: "You've made ₦127,800 this week from 34 orders. That's a 23% increase from last week. Wednesday was your substantial day."
    },
]

// Helper to simulate smart title generation
const getSmartTitle = (content: string) => {
    if (content.toLowerCase().includes("checking") || content.toLowerCase().includes("analysing")) return "System Status"
    if (content.toLowerCase().includes("sales") || content.includes("₦")) return "Sales Report"
    if (content.toLowerCase().includes("stock") || content.toLowerCase().includes("inventory")) return "Inventory Update"
    if (content.toLowerCase().includes("debt") || content.toLowerCase().includes("owing")) return "Debtor Analysis"
    // Fallback to first 3 words
    return content.split(' ').slice(0, 3).join(' ') + "..."
}

export default function AssistantPage() {
    const [messages, setMessages] = useState(initialMessages)
    const [input, setInput] = useState('')
    const chatEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return

        const userMsg = { id: Date.now(), role: 'user' as const, content: input }
        setMessages(prev => [...prev, userMsg])
        setInput('')

        // Mock AI response delay
        setTimeout(() => {
            const aiMsg = {
                id: Date.now() + 1,
                role: 'assistant' as const,
                title: "Processing Data",
                content: "I'm checking your latest data..."
            }
            setMessages(prev => [...prev, aiMsg])
        }, 1000)
    }

    return (
        <PageTransition>
            {/* Mobile: Full height (100dvh). Desktop: Calculated height. */}
            <div className="flex flex-col h-[100dvh] md:h-[calc(100vh-100px)] relative md:pt-0 pb-20 md:pb-0 max-w-5xl mx-auto">

                {/* Header - Minimalist (Hidden on Mobile) */}
                <div className="flex-shrink-0 mb-6 text-center md:text-left mt-8 md:mt-0 hidden md:block">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-gold/10 text-brand-gold text-xs font-medium mb-3 border border-brand-gold/20">
                        <Sparkles className="w-3 h-3" />
                        <span>Cloove Intelligence</span>
                    </div>
                    <h1 className="font-serif text-3xl md:text-4xl font-medium text-brand-deep dark:text-brand-cream">
                        Assistant
                    </h1>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto space-y-6 pb-4 scrollbar-hide">
                    <AnimatePresence initial={false}>
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}
                            >
                                <div className={cn(
                                    "text-sm md:text-base leading-relaxed relative overflow-hidden transition-all",
                                    msg.role === 'user'
                                        ? "bg-brand-deep text-brand-cream rounded-2xl rounded-br-sm dark:bg-brand-gold dark:text-brand-deep shadow-sm max-w-[85%] md:max-w-[70%] p-5"
                                        : "w-full bg-transparent text-brand-deep dark:text-brand-cream px-1"
                                )}>
                                    {/* User Icon Indicator */}
                                    {/* {msg.role === 'user' && (
                                        <div className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center opacity-50 bg-white/10">
                                            <User className="w-3 h-3" />
                                        </div>
                                    )} */}

                                    {/* Assistant Title - Dynamic Gradient */}
                                    {msg.role === 'assistant' && (
                                        <div className="mb-2">
                                            <span className="block text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-brand-deep to-brand-green dark:from-brand-green dark:to-brand-cream bg-clip-text text-transparent w-fit">
                                                {(msg as any).title || getSmartTitle(msg.content)}
                                            </span>
                                        </div>
                                    )}

                                    <div className={cn("relative z-10", msg.role === 'user' ? "pr-8" : "")}>
                                        <Markdown
                                            content={msg.content}
                                            className={msg.role === 'user' ? "text-brand-cream dark:text-brand-deep prose-invert" : ""}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    <div ref={chatEndRef} />
                </div>

                {/* Input Area - Floating Glass */}
                <div className="fixed bottom-4 left-4 right-4 z-20 md:sticky md:bottom-8 border-t-0 md:border-t-0 md:w-full">
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
        </PageTransition>
    )
}
