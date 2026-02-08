"use client"

import { useState, useRef, useEffect } from 'react'
import { PageTransition } from '../components/layout/page-transition'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Bot, User, ArrowUp } from 'lucide-react'
import { cn } from '../lib/utils'
import { Button } from '../components/ui/button'
import { GlassCard } from '../components/ui/glass-card'

const initialMessages = [
    {
        id: 1,
        role: 'assistant' as const,
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
        content: "You've made ₦127,800 this week from 34 orders. That's a 23% increase from last week. Wednesday was your substantial day."
    },
]

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
                content: "I'm checking your latest data..."
            }
            setMessages(prev => [...prev, aiMsg])
        }, 1000)
    }

    return (
        <PageTransition>
            <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] relative md:pt-0">

                {/* Header - Minimalist */}
                <div className="flex-shrink-0 mb-6 text-center md:text-left mt-8 md:mt-0">
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
                                    "max-w-[85%] md:max-w-[70%] text-sm md:text-base leading-relaxed p-5 rounded-2xl shadow-sm relative overflow-hidden group transition-all",
                                    msg.role === 'user'
                                        ? "bg-brand-deep text-brand-cream rounded-br-sm dark:bg-brand-gold dark:text-brand-deep"
                                        : "bg-white/80 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 text-brand-deep dark:text-brand-cream rounded-bl-sm"
                                )}>
                                    {/* Icon Indicator */}
                                    <div className={cn(
                                        "absolute top-4 w-6 h-6 rounded-full flex items-center justify-center opacity-50",
                                        msg.role === 'user' ? "right-4 bg-white/10" : "left-4 bg-brand-deep/5 dark:bg-white/10"
                                    )}>
                                        {msg.role === 'assistant' ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                                    </div>

                                    <div className={cn("relative z-10", msg.role === 'assistant' ? "pl-8" : "pr-8")}>
                                        {msg.content}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    <div ref={chatEndRef} />
                </div>

                {/* Input Area - Floating Glass */}
                <div className="pt-4 sticky bottom-0 z-20">
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
