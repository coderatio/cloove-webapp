"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Home, Sparkles, Package, Users, ShoppingBag, Menu, X, Settings, LogOut, Bell, HelpCircle, LayoutGrid, Banknote, ShieldCheck, Gift, Activity, Link2, ArrowLeft, ChevronRight } from "lucide-react"
import { cn } from "@/app/lib/utils"
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerTitle,
} from "../ui/drawer"
import { usePermission } from "@/app/hooks/usePermission"

interface MobileNavItem {
    href: string
    icon: any
    label: string
    permission?: string
    children?: MobileNavItem[]
}

const mainNavItems: MobileNavItem[] = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/orders", icon: ShoppingBag, label: "Orders", permission: 'VIEW_SALES' },
]

const secondaryNavItems: MobileNavItem[] = [
    { href: "/activity", icon: Activity, label: "Activity", permission: 'VIEW_DASHBOARD' },
    { href: "/finance", icon: Banknote, label: "Finance", permission: 'VIEW_FINANCIALS' },
]

const moreItems: MobileNavItem[] = [
    { href: "/customers", icon: Users, label: "Customers", permission: 'VIEW_CUSTOMERS' },
    { href: "/stores", icon: LayoutGrid, label: "Stores", permission: 'MANAGE_STAFF' },
    { href: "/inventory", icon: Package, label: "Inventory", permission: 'MANAGE_PRODUCTS' },
    { href: "/finance", icon: Banknote, label: "Finance", permission: 'VIEW_FINANCIALS', children: [
        { href: "/finance/payment-links", icon: Link2, label: "Payment Links", permission: 'VIEW_FINANCIALS' },
    ] },
    { href: "/staff", icon: ShieldCheck, label: "Staff", permission: 'MANAGE_STAFF' },
    { href: "/storefront", icon: ShoppingBag, label: "Storefront", permission: 'MANAGE_STAFF' },
]

export function MobileNav() {
    const pathname = usePathname()
    const router = useRouter()
    const isAssistantPage = pathname === "/assistant"
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isMoreOpen, setIsMoreOpen] = useState(false)
    const [submenuParent, setSubmenuParent] = useState<MobileNavItem | null>(null)
    const { can } = usePermission()

    const handleMoreOpenChange = (open: boolean) => {
        setIsMoreOpen(open)
        if (!open) setSubmenuParent(null)
    }

    // Zen Mode for Assistant Page
    if (isAssistantPage && !isMenuOpen) {
        return (
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="fixed top-6 left-6 z-50 md:hidden"
            >
                <button
                    onClick={() => setIsMenuOpen(true)}
                    className="h-12 w-12 rounded-full bg-brand-deep/80 backdrop-blur-xl border border-brand-gold/20 shadow-xl flex items-center justify-center text-brand-gold active:scale-95"
                >
                    <Menu className="h-6 w-6" />
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
                                    <Sparkles className="h-7 w-7 fill-current/10" strokeWidth={2.5} />
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
                                                    (item as any).permission && !can((item as any).permission) ? "hidden" : "",
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
                                                    (item as any).permission && !can((item as any).permission) ? "hidden" : "",
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
            <Drawer open={isMoreOpen} onOpenChange={handleMoreOpenChange}>
                <DrawerContent>
                    <DrawerStickyHeader>
                        <DrawerTitle>
                            {submenuParent ? (
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setSubmenuParent(null)}
                                        className="h-8 w-8 rounded-lg bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                    </button>
                                    <span>{submenuParent.label}</span>
                                </div>
                            ) : (
                                "Menu"
                            )}
                        </DrawerTitle>
                    </DrawerStickyHeader>
                    <div className="p-6 pb-12">
                        <AnimatePresence mode="wait">
                            {submenuParent ? (
                                <motion.div
                                    key="submenu"
                                    initial={{ opacity: 0, x: 40 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 40 }}
                                    transition={{ duration: 0.2 }}
                                    className="grid grid-cols-2 gap-4"
                                >
                                    {/* Parent item itself */}
                                    <Link
                                        href={submenuParent.href}
                                        onClick={() => handleMoreOpenChange(false)}
                                        className={cn(
                                            "flex items-center gap-4 rounded-2xl p-4 transition-all duration-200 active:scale-95",
                                            pathname === submenuParent.href
                                                ? "bg-brand-gold/10 text-brand-gold ring-1 ring-brand-gold/30"
                                                : "bg-zinc-50 dark:bg-white/5 text-brand-deep dark:text-brand-cream/80"
                                        )}
                                    >
                                        <div className={cn(
                                            "flex h-10 w-10 items-center justify-center rounded-xl",
                                            pathname === submenuParent.href ? "bg-brand-gold text-brand-deep" : "bg-white dark:bg-white/10 shadow-sm"
                                        )}>
                                            <submenuParent.icon className="h-5 w-5" strokeWidth={2} />
                                        </div>
                                        <span className="font-semibold">{submenuParent.label}</span>
                                    </Link>

                                    {/* Children */}
                                    {submenuParent.children?.map((child) => {
                                        if (child.permission && !can(child.permission)) return null
                                        return (
                                            <Link
                                                key={child.href}
                                                href={child.href}
                                                onClick={() => handleMoreOpenChange(false)}
                                                className={cn(
                                                    "flex items-center gap-4 rounded-2xl p-4 transition-all duration-200 active:scale-95",
                                                    pathname.startsWith(child.href)
                                                        ? "bg-brand-gold/10 text-brand-gold ring-1 ring-brand-gold/30"
                                                        : "bg-zinc-50 dark:bg-white/5 text-brand-deep dark:text-brand-cream/80"
                                                )}
                                            >
                                                <div className={cn(
                                                    "flex h-10 w-10 items-center justify-center rounded-xl",
                                                    pathname.startsWith(child.href) ? "bg-brand-gold text-brand-deep" : "bg-white dark:bg-white/10 shadow-sm"
                                                )}>
                                                    <child.icon className="h-5 w-5" strokeWidth={2} />
                                                </div>
                                                <span className="font-semibold">{child.label}</span>
                                            </Link>
                                        )
                                    })}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="main"
                                    initial={{ opacity: 0, x: -40 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -40 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="mb-6">
                                        <Link
                                            href="/referrals"
                                            onClick={() => handleMoreOpenChange(false)}
                                            className="flex items-center justify-between p-4 rounded-3xl bg-linear-to-br from-brand-deep to-black text-brand-cream relative overflow-hidden group shadow-xl"
                                        >
                                            {/* Background Effect */}
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/20 blur-3xl rounded-full -mr-10 -mt-10" />

                                            <div className="relative z-10 flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-2xl bg-brand-gold flex items-center justify-center shadow-lg text-brand-deep shrink-0">
                                                    <Gift className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <h4 className="font-serif text-lg font-medium text-brand-gold">Refer & Earn</h4>
                                                    <p className="text-xs text-brand-cream/60">Get 10% commission per referral</p>
                                                </div>
                                            </div>
                                        </Link>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[...mainNavItems, ...moreItems].map((item) => {
                                            if (item.permission && !can(item.permission)) {
                                                return null
                                            }
                                            const hasChildren = item.children && item.children.length > 0
                                            return (
                                                <button
                                                    key={item.href}
                                                    onClick={() => {
                                                        if (hasChildren) {
                                                            setSubmenuParent(item)
                                                        } else {
                                                            handleMoreOpenChange(false)
                                                            router.push(item.href)
                                                        }
                                                    }}
                                                    className={cn(
                                                        "flex items-center gap-4 rounded-2xl p-4 transition-all duration-200 active:scale-95 text-left",
                                                        pathname === item.href
                                                            ? "bg-brand-gold/10 text-brand-gold ring-1 ring-brand-gold/30"
                                                            : "bg-zinc-50 dark:bg-white/5 text-brand-deep dark:text-brand-cream/80"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "flex h-10 w-10 items-center justify-center rounded-xl shrink-0",
                                                        pathname === item.href ? "bg-brand-gold text-brand-deep" : "bg-white dark:bg-white/10 shadow-sm"
                                                    )}>
                                                        <item.icon className="h-5 w-5" strokeWidth={2} />
                                                    </div>
                                                    <span className="font-semibold flex-1">{item.label}</span>
                                                    {hasChildren && (
                                                        <ChevronRight className="h-4 w-4 text-brand-accent/30 dark:text-brand-cream/30 shrink-0" />
                                                    )}
                                                </button>
                                            )
                                        })}
                                        <button
                                            className="flex items-center gap-4 rounded-2xl p-4 bg-red-50 dark:bg-red-500/10 text-red-600 active:scale-95 transition-all"
                                        >
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-white/10 shadow-sm">
                                                <LogOut className="h-5 w-5" />
                                            </div>
                                            <span className="font-semibold">Sign Out</span>
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </DrawerContent>
            </Drawer>
        </>
    )
}
