"use client"

import { useState } from "react"
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
    Sun,
    LogOut,
    UserCircle
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

export function Sidebar() {
    const pathname = usePathname()
    const { theme, setTheme } = useTheme()
    const [isCollapsed, setIsCollapsed] = useState(false)

    // Use a layout effect or similar to check persisted state in real app, 
    // but state is fine for now

    return (
        <motion.aside
            initial={false}
            animate={{ width: isCollapsed ? 80 : 280 }}
            className="fixed left-4 top-4 bottom-4 z-40 hidden md:flex flex-col rounded-2xl border border-white/20 bg-white/80 dark:bg-black/40 backdrop-blur-xl shadow-xl"
        >
            {/* Header */}
            <div className={cn("flex items-center p-4", isCollapsed ? "justify-center" : "justify-between gap-4")}>
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-950 text-emerald-100 shadow-inner">
                        <span className="font-serif text-xl font-bold">C</span>
                    </div>
                    {!isCollapsed && (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="font-serif text-xl font-semibold tracking-tight whitespace-nowrap"
                        >
                            Cloove
                        </motion.span>
                    )}
                </div>
            </div>

            {/* Store Switcher */}
            <div className="px-3 pb-6">
                <StoreSwitcher isCollapsed={isCollapsed} />
            </div>

            {/* Nav Items */}
            <nav className="flex-1 space-y-2 px-3">
                {navItems.map((item) => {
                    const isActive = pathname === item.href

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-900/20",
                                isActive
                                    ? "bg-emerald-900/5 text-emerald-900 dark:bg-emerald-400/10 dark:text-emerald-100"
                                    : "text-muted-foreground"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-emerald-700 dark:text-emerald-400")} />
                            {!isCollapsed && (
                                <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="whitespace-nowrap"
                                >
                                    {item.label}
                                </motion.span>
                            )}

                            {/* Tooltip for collapsed state could go here */}
                        </Link>
                    )
                })}
            </nav>

            {/* Footer Actions */}
            <div className="border-t border-border/40 p-3 space-y-2">
                <Button
                    variant="ghost"
                    size="icon"
                    className="w-full justify-start px-2 hover:bg-transparent"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                    <div className={cn("flex items-center justify-center rounded-lg p-2 transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-900/20", isCollapsed ? "w-10" : "w-auto")}>
                        {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </div>
                    {!isCollapsed && <span className="ml-2 text-sm font-medium">Toggle Theme</span>}
                </Button>

                <Button
                    variant="ghost"
                    className={cn("w-full justify-start px-2 gap-3", isCollapsed && "justify-center")}
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                    {!isCollapsed && <span>Collapse</span>}
                </Button>

                <div className={cn("mt-4 flex items-center gap-3 rounded-xl bg-black/5 dark:bg-white/5 p-2", isCollapsed && "justify-center p-0 bg-transparent")}>
                    <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-medium text-xs">
                        AO
                    </div>
                    {!isCollapsed && (
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-xs font-semibold truncate">Amaka Okoro</span>
                            <span className="text-[10px] text-muted-foreground truncate">Owner</span>
                        </div>
                    )}
                </div>
            </div>
        </motion.aside>
    )
}
