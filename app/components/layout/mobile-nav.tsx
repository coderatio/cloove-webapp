"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Home, MessageSquare, Package, Users, ShoppingBag } from "lucide-react"
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

    return (
        <nav className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
            <div className="flex items-center justify-around rounded-[24px] border border-white/10 bg-brand-deep/95 px-2 py-4 backdrop-blur-3xl shadow-2xl">
                {navItems.map((item) => {
                    const isActive = pathname === item.href

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
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
    )
}
