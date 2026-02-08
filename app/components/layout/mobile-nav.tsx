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
            <div className="flex items-center justify-around rounded-2xl border border-brand-green/10 bg-brand-deep/90 px-2 py-3 backdrop-blur-xl shadow-2xl">
                {navItems.map((item) => {
                    const isActive = pathname === item.href

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "relative flex flex-col items-center justify-center gap-1 px-3 py-1 outline-none transition-colors",
                                isActive ? "text-white dark:text-white" : "text-white/50 hover:text-white/80"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="mobile-nav-pill"
                                    className="absolute inset-0 rounded-xl bg-white/10 dark:bg-white/20"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <item.icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
