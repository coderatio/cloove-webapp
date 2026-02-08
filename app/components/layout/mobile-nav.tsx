"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Home, MessageSquare, Package, Users, ShoppingBag, Menu, X } from "lucide-react"
import { cn } from "@/app/lib/utils"

const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/assistant", icon: MessageSquare, label: "Ask AI" },
    { href: "/orders", icon: ShoppingBag, label: "Orders" },
    { href: "/customers", icon: Users, label: "Debtors" },
    { href: "/inventory", icon: Package, label: "Stock" },
]

export function MobileNav() {
    const pathname = usePathname()
    const isAssistantPage = pathname === "/assistant"
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    // Zen Mode for Assistant Page
    if (isAssistantPage && !isMenuOpen) {
        return (
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="fixed top-6 right-6 z-50 md:hidden"
            >
                <button
                    onClick={() => setIsMenuOpen(true)}
                    className="h-12 w-12 rounded-full bg-brand-deep border border-brand-gold/20 shadow-xl flex items-center justify-center text-brand-gold hover:scale-105 transition-transform"
                >
                    <Menu className="h-6 w-6" />
                </button>
            </motion.div>
        )
    }

    return (
        <AnimatePresence>
            {(isMenuOpen || !isAssistantPage) && (
                <nav className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
                    {/* Close button for Zen Mode overlay */}
                    {isAssistantPage && (
                        <div className="absolute -top-12 right-0 flex justify-end">
                            <button
                                onClick={() => setIsMenuOpen(false)}
                                className="h-10 w-10 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center mb-2"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    )}

                    <div className="flex items-center justify-around rounded-[24px] border border-white/10 bg-brand-deep/95 px-2 py-4 backdrop-blur-3xl shadow-2xl">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => isAssistantPage && setIsMenuOpen(false)}
                                    className={cn(
                                        "relative flex flex-col items-center justify-center gap-1.5 px-3 py-1 outline-none transition-colors",
                                        isActive ? "text-brand-gold" : "text-brand-cream/50 hover:text-brand-cream/80"
                                    )}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="mobile-nav-pill"
                                            className="absolute -inset-x-2 -inset-y-2 rounded-2xl bg-white/5"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <div className="relative z-10">
                                        <item.icon className={cn("h-6 w-6", isActive && "fill-current/20")} strokeWidth={isActive ? 2.5 : 2} />
                                    </div>
                                    <span className="relative z-10 text-[10px] font-medium tracking-wide">{item.label}</span>

                                    {isActive && (
                                        <motion.div
                                            layoutId="mobile-nav-dot"
                                            className="absolute -bottom-1 w-1 h-1 rounded-full bg-brand-gold"
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                </Link>
                            )
                        })}
                    </div>
                </nav>
            )}
        </AnimatePresence>
    )
}
