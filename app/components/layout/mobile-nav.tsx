"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Home, MessageSquare, Package, Users, ShoppingBag, Menu, X, Settings, LogOut, Bell, HelpCircle, LayoutGrid, Banknote, ShieldCheck } from "lucide-react"
import { cn } from "@/app/lib/utils"
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerTitle,
} from "../ui/drawer"

const mainNavItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/orders", icon: ShoppingBag, label: "Orders" },
]

const secondaryNavItems = [
    { href: "/finance", icon: Banknote, label: "Finance" },
]

const moreItems = [
    { href: "/customers", icon: Users, label: "Customers" },
    { href: "/stores", icon: LayoutGrid, label: "Manage Stores" },
    { href: "/inventory", icon: Package, label: "Inventory" },
    { href: "/staff", icon: ShieldCheck, label: "Staff Management" },
    { href: "/notifications", icon: Bell, label: "Notifications" },
    { href: "/settings", icon: Settings, label: "Settings" },
    { href: "/help", icon: HelpCircle, label: "Help & Support" },
]

export function MobileNav() {
    const pathname = usePathname()
    const isAssistantPage = pathname === "/assistant"
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isMoreOpen, setIsMoreOpen] = useState(false)

    // Zen Mode for Assistant Page
    if (isAssistantPage && !isMenuOpen) {
        return (
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="fixed bottom-6 right-6 z-50 md:hidden"
            >
                <button
                    onClick={() => setIsMenuOpen(true)}
                    className="h-14 w-14 rounded-full bg-brand-deep border border-brand-gold/20 shadow-[0_8px_32px_rgba(182,143,76,0.3)] flex items-center justify-center text-brand-gold hover:scale-110 transition-transform active:scale-95"
                >
                    <Menu className="h-7 w-7" />
                </button>
            </motion.div>
        )
    }

    return (
        <>
            <AnimatePresence>
                {(isMenuOpen || !isAssistantPage) && (
                    <nav className="fixed bottom-6 left-6 right-6 z-50 md:hidden">
                        {/* Close button for Zen Mode overlay */}
                        {isAssistantPage && (
                            <div className="absolute -top-14 right-0 flex justify-end">
                                <button
                                    onClick={() => setIsMenuOpen(false)}
                                    className="h-10 w-10 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center mb-2 active:scale-90 transition-transform"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        )}

                        <div className="relative h-16 w-full flex items-center px-2 rounded-[28px] border border-white/10 bg-brand-deep/95 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">

                            {/* Prominent Assistant Button */}
                            <div className="absolute left-1/2 -top-6 -translate-x-1/2">
                                <Link
                                    href="/assistant"
                                    onClick={() => isAssistantPage && setIsMenuOpen(false)}
                                    className={cn(
                                        "flex h-16 w-16 items-center justify-center rounded-full shadow-2xl transition-all active:scale-90 ring-4 ring-brand-deep/50",
                                        pathname === "/assistant"
                                            ? "bg-brand-gold text-brand-deep scale-110"
                                            : "bg-brand-gold text-brand-deep hover:scale-105"
                                    )}
                                >
                                    <MessageSquare className="h-7 w-7 fill-current/10" strokeWidth={2.5} />
                                    {/* Pulse effect if on other pages */}
                                    {pathname !== "/assistant" && (
                                        <div className="absolute inset-0 rounded-full bg-brand-gold animate-ping opacity-20 pointer-events-none" />
                                    )}
                                </Link>
                            </div>

                            {/* Nav Items Split by Assistant Button */}
                            <div className="flex-1 flex justify-between px-4 w-full">
                                {/* Left Side */}
                                <div className="flex gap-6 items-center">
                                    {mainNavItems.map((item) => {
                                        const isActive = pathname === item.href
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={cn(
                                                    "flex flex-col items-center gap-1 transition-colors",
                                                    isActive ? "text-brand-gold" : "text-white/40"
                                                )}
                                            >
                                                <item.icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                                                <span className="text-[9px] font-bold uppercase tracking-tighter Otros">{item.label}</span>
                                            </Link>
                                        )
                                    })}
                                </div>

                                {/* Right Side */}
                                <div className="flex gap-6 items-center">
                                    {secondaryNavItems.map((item) => {
                                        const isActive = pathname === item.href
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={cn(
                                                    "flex flex-col items-center gap-1 transition-colors",
                                                    isActive ? "text-brand-gold" : "text-white/40"
                                                )}
                                            >
                                                <item.icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                                                <span className="text-[9px] font-bold uppercase tracking-tighter">{item.label}</span>
                                            </Link>
                                        )
                                    })}

                                    {/* More Menu Switcher */}
                                    <button
                                        onClick={() => setIsMoreOpen(true)}
                                        className="flex flex-col items-center gap-1 text-white/40"
                                    >
                                        <Menu className="h-5 w-5" />
                                        <span className="text-[9px] font-bold uppercase tracking-tighter">More</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </nav>
                )}
            </AnimatePresence>

            {/* More Menu Drawer */}
            <Drawer open={isMoreOpen} onOpenChange={setIsMoreOpen}>
                <DrawerContent>
                    <DrawerStickyHeader>
                        <DrawerTitle>Menu</DrawerTitle>
                    </DrawerStickyHeader>
                    <div className="p-6 pb-12">
                        <div className="grid grid-cols-2 gap-4">
                            {[...mainNavItems, ...secondaryNavItems, ...moreItems].map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsMoreOpen(false)}
                                    className={cn(
                                        "flex items-center gap-4 rounded-2xl p-4 transition-all duration-200 active:scale-95",
                                        pathname === item.href
                                            ? "bg-brand-gold/10 text-brand-gold ring-1 ring-brand-gold/30"
                                            : "bg-zinc-50 dark:bg-white/5 text-brand-deep dark:text-brand-cream/80"
                                    )}
                                >
                                    <div className={cn(
                                        "flex h-10 w-10 items-center justify-center rounded-xl",
                                        pathname === item.href ? "bg-brand-gold text-brand-deep" : "bg-white dark:bg-white/10 shadow-sm"
                                    )}>
                                        <item.icon className="h-5 w-5" strokeWidth={2} />
                                    </div>
                                    <span className="font-semibold">{item.label}</span>
                                </Link>
                            ))}
                            <button
                                className="flex items-center gap-4 rounded-2xl p-4 bg-red-50 dark:bg-red-500/10 text-red-600 active:scale-95 transition-all"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-white/10 shadow-sm">
                                    <LogOut className="h-5 w-5" />
                                </div>
                                <span className="font-semibold">Sign Out</span>
                            </button>
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>
        </>
    )
}
