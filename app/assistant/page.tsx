"use client"

import { useState, useRef, useEffect } from 'react'
import { PageTransition } from '../components/layout/page-transition'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, Bot, User } from 'lucide-react'
import { cn } from '../lib/utils'
import { Button } from '../components/ui/button'

const initialMessages = [
    {
        id: 1,
        role: 'assistant' as const,
        content: "Hi! I'm here to help you understand your business. Ask me anything."
    },
    {
        id: 2,
        role: 'user' as const,
        content: "How are my sales this week?"
    },
    {
        id: 3,
        role: 'assistant' as const,
        content: "You made ₦127,800 this week from 34 orders. That's 23% more than last week! Wednesday was your busiest day."
    },
]

export default function AssistantPage() {
    const [messages, setMessages] = useState(initialMessages)
    const [input, setInput] = useState('')
    const isDesktop = useMediaQuery("(min-width: 768px)")
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
                content: "I'm analyzing your data... (This is a premium demo response)"
            }
            setMessages(prev => [...prev, aiMsg])
        }, 1000)
    }

    return (
        <PageTransition>
            <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-100px)]">
                <header className="mb-4 flex-shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight">
                                Business Assistant
                            </h1>
                            <p className="text-sm text-muted-foreground">Powered by Cloove AI</p>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-hidden relative rounded-2xl border border-white/20 bg-white/40 dark:bg-black/20 backdrop-blur-md shadow-inner flex flex-col">
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        <AnimatePresence initial={false}>
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ type: "spring", bounce: 0.4 }}
                                    className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}
                                >
                                    <div className={cn(
                                        "max-w-[85%] md:max-w-[70%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm flex gap-3",
                                        msg.role === 'user'
                                            ? "bg-emerald-600 text-white rounded-br-sm"
                                            : "bg-white dark:bg-zinc-800 text-foreground rounded-bl-sm border border-border/50"
                                    )}>
                                        {/* Icons inside bubbles */}
                                        {msg.role === 'assistant' ? (
                                            <Bot className="h-5 w-5 shrink-0 mt-0.5 text-indigo-500" />
                                        ) : (
                                            <User className="h-5 w-5 shrink-0 mt-0.5 text-white/80" />
                                        )}
                                        <div>
                                            {msg.content}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        <div ref={chatEndRef} />
                    </div>

                    <div className="p-4 bg-white/60 dark:bg-black/40 border-t border-white/10 backdrop-blur-xl">
                        <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask about sales, debts, or inventory..."
                                    className="w-full h-12 rounded-xl border border-border/50 bg-background/50 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-sm"
                                />
                            </div>
                            <Button
                                size="icon"
                                type="submit"
                                className={cn(
                                    "h-12 w-12 rounded-xl transition-all shadow-lg",
                                    input.trim()
                                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                                        : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                                )}
                                disabled={!input.trim()}
                            >
                                <Send className="h-5 w-5" />
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </PageTransition>
    )
}
