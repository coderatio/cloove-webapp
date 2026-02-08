"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
    Home,
    MessageSquare,
    Package,
    Users,
    ShoppingBag,
    ChevronRight,
    ChevronLeft,
    Moon,
    Sun
} from "lucide-react"
import { cn } from "@/app/lib/utils"
import { useTheme } from "next-themes"
import { StoreSwitcher } from "../shared/store-switcher"
import { Button } from "../ui/button"

const navItems = [
    { href: "/", icon: Home, label: "Overview" },
    { href: "/assistant", icon: MessageSquare, label: "Assistant" },
    { href: "/orders", icon: ShoppingBag, label: "Orders" },
    { href: "/customers", icon: Users, label: "Customers" },
    { href: "/inventory", icon: Package, label: "Inventory" },
]

interface SidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (value: boolean) => void;
}

export function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
    const pathname = usePathname()
    const { theme, setTheme } = useTheme()

    return (
        <motion.aside
            initial={false}
            animate={{ width: isCollapsed ? 80 : 280 }}
            className="fixed left-4 top-4 bottom-4 z-40 hidden md:flex flex-col rounded-[20px] bg-brand-deep dark:bg-[#021a12] shadow-2xl overflow-hidden transition-all duration-300"
        >
            {/* Background Texture/Gradient for depth */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/20 blur-[80px] rounded-full mix-blend-overlay" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-green/10 blur-[60px] rounded-full" />
            </div>

            <div className="relative z-10 flex flex-col h-full text-brand-cream">
                {/* Header */}
                <div className={cn("flex items-center p-6 mb-2", isCollapsed ? "justify-center" : "justify-between")}>
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-gold to-brand-gold/80 text-brand-deep shadow-lg shadow-brand-gold/10">
                            <span className="font-serif text-xl font-bold">C</span>
                        </div>
                        <AnimatePresence>
                            {!isCollapsed && (
                                <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="font-serif text-2xl font-medium tracking-tight whitespace-nowrap text-brand-cream"
                                >
                                    Cloove
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Store Switcher */}
                <div className={cn("px-4 pb-8 transition-all", isCollapsed && "px-2")}>
                    <StoreSwitcher isCollapsed={isCollapsed} />
                </div>

                {/* Nav Items */}
                <nav className="flex-1 space-y-2 px-4">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "group relative flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-white/10 text-brand-gold shadow-sm backdrop-blur-sm"
                                        : "text-brand-cream/70 hover:text-brand-cream hover:bg-white/5"
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        "h-5 w-5 shrink-0 transition-colors",
                                        isActive ? "text-brand-gold" : "text-brand-cream/70 group-hover:text-brand-cream"
                                    )}
                                />

                                <AnimatePresence mode="wait">
                                    {!isCollapsed && (
                                        <motion.span
                                            initial={{ opacity: 0, x: -5 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -5 }}
                                            className="whitespace-nowrap"
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>

                                {isActive && !isCollapsed && (
                                    <motion.div
                                        layoutId="sidebar-active"
                                        className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-brand-gold rounded-r-full"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </Link>
                        )
                    })}
                </nav>

                {/* Footer */}
                <div className="mt-auto p-4 border-t border-white/10 space-y-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "w-full justify-start text-brand-cream/70 hover:text-brand-cream hover:bg-white/5",
                            isCollapsed && "justify-center px-0"
                        )}
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    >
                        {theme === "dark" ? <Sun className="h-5 w-5 shrink-0" /> : <Moon className="h-5 w-5 shrink-0" />}
                        {!isCollapsed && <span className="ml-3">Theme</span>}
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "w-full justify-start text-brand-cream/70 hover:text-brand-cream hover:bg-white/5",
                            isCollapsed && "justify-center px-0"
                        )}
                        onClick={() => setIsCollapsed(!isCollapsed)}
                    >
                        {isCollapsed ? <ChevronRight className="h-5 w-5 shrink-0" /> : <ChevronLeft className="h-5 w-5 shrink-0" />}
                        {!isCollapsed && <span className="ml-3">Collapse</span>}
                    </Button>

                    <div className={cn(
                        "mt-4 flex items-center gap-3 rounded-xl bg-black/20 p-2 border border-white/5",
                        isCollapsed && "justify-center p-1 bg-transparent border-0"
                    )}>
                        <div className="h-8 w-8 rounded-full bg-brand-gold text-brand-deep flex items-center justify-center font-bold text-xs shadow-md">
                            AO
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-xs font-semibold truncate text-brand-cream">Amaka Okoro</span>
                                <span className="text-[10px] text-brand-cream/60 truncate">Owner</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.aside>
    )
}
