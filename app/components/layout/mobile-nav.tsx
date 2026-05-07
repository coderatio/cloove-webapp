"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Menu, X, LogOut, LayoutGrid, Gift, ArrowLeft, ChevronRight } from "lucide-react"
import { cn } from "@/app/lib/utils"
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerTitle,
} from "../ui/drawer"
import { usePermission } from "@/app/hooks/usePermission"
import { useMobileNav } from "../providers/mobile-nav-provider"
import { useAuth } from "../providers/auth-provider"
import { Button } from "../ui/button"
import { toast } from "sonner"
import { useWorkspaceNav } from "@/app/domains/workspace/hooks/useWorkspaceNav"
import { useBusiness } from "../BusinessProvider"

export function MobileNav() {
    const pathname = usePathname()
    const router = useRouter()
    const { logout } = useAuth()
    const isAssistantPage = pathname === "/assistant"
    const { isMenuOpen, setIsMenuOpen } = useMobileNav()
    const [isMoreOpen, setIsMoreOpen] = useState(false)

    const { mobilePrimary, mobileSecondary, mobileMoreItems } = useWorkspaceNav()
    const { features } = useBusiness()

    const handleLogout = () => {
        toast.promise(
            logout(),
            {
                loading: 'Logging out...',
                success: 'Logged out successfully',
                error: 'Failed to logout. Please try again.'
            }
        )
    }
    const [submenuParent, setSubmenuParent] = useState<typeof mobileMoreItems[0] | null>(null)
    const { can, role } = usePermission()

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
                className="fixed top-3 right-4 z-50 md:hidden"
            >
                <button
                    onClick={() => setIsMenuOpen(true)}
                    className="flex size-9 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm active:scale-95"
                >
                    <LayoutGrid className="size-4" />
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

                        <div className="relative flex h-16 w-full items-center rounded-full border border-border bg-background/95 px-2 shadow-lg backdrop-blur">

                            {/* Prominent Assistant Button */}
                            <div className="absolute left-1/2 -top-6 -translate-x-1/2">
                                <Link
                                    href="/assistant"
                                    onClick={() => isAssistantPage && setIsMenuOpen(false)}
                                    className={cn(
                                        "flex h-16 w-16 items-center justify-center rounded-full border border-primary/12 bg-primary text-primary-foreground shadow-md transition-transform active:scale-90",
                                        pathname === "/assistant"
                                            ? "scale-105"
                                            : "hover:scale-105"
                                    )}
                                >
                                    <Sparkles className="h-7 w-7" strokeWidth={2.2} />
                                </Link>
                            </div>

                            {/* Nav Items Split by Assistant Button */}
                            <div className="flex-1 flex justify-between px-4 w-full">
                                {/* Left Side */}
                                <div className="flex gap-6 items-center">
                                    {mobilePrimary.map((item) => {
                                        const isActive =
                                            item.href === "/"
                                                ? pathname === "/"
                                                : pathname === item.href || pathname.startsWith(item.href + "/")
                                        const label = item.id === "overview" ? "Home" : item.label
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={cn(
                                                    "flex flex-col items-center gap-1 transition-colors",
                                                    (item.permission && !can(item.permission)) ? "hidden" : "",
                                                    isActive ? "text-foreground" : "text-muted-foreground"
                                                )}
                                            >
                                                <item.icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                                                <span className="text-[9px] font-bold uppercase tracking-tighter">{label}</span>
                                            </Link>
                                        )
                                    })}
                                </div>

                                {/* Right Side */}
                                <div className="flex gap-6 items-center">
                                    {mobileSecondary.map((item) => {
                                        const isActive = pathname === item.href || pathname.startsWith(item.href)
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={cn(
                                                    "flex flex-col items-center gap-1 transition-colors",
                                                    (item.permission && !can(item.permission)) ? "hidden" : "",
                                                    isActive ? "text-foreground" : "text-muted-foreground"
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
                                        className="flex flex-col items-center gap-1 text-muted-foreground"
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
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => setSubmenuParent(null)}
                                        className="h-10 w-10 rounded-full bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center"
                                    >
                                        <ArrowLeft className="h-6 w-6" />
                                    </Button>
                                    <span>{submenuParent.label}</span>
                                </div>
                            ) : (
                                "Menu"
                            )}
                        </DrawerTitle>
                    </DrawerStickyHeader>
                    <div className="p-6 pb-12 overflow-y-auto max-h-[70vh]">
                        <AnimatePresence mode="wait">
                            {submenuParent ? (
                                <motion.div
                                    key="submenu"
                                    initial={{ opacity: 0, x: 40 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 40 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex flex-col gap-3"
                                >
                                    <Link
                                        href={submenuParent.href}
                                        onClick={() => handleMoreOpenChange(false)}
                                        className={cn(
                                            "flex items-center gap-4 rounded-[20px] p-4 transition-all duration-200 active:scale-95 border",
                                            pathname === submenuParent.href
                                                ? "border-brand-green-200 bg-brand-green-50 text-foreground dark:border-brand-green-800/40 dark:bg-brand-green-950/30 dark:text-brand-cream"
                                                : "border-border bg-zinc-50 text-foreground dark:border-white/5 dark:bg-white/5 dark:text-brand-cream/80"
                                        )}
                                    >
                                        <div className={cn(
                                            "flex h-10 w-10 items-center justify-center rounded-xl",
                                            pathname === submenuParent.href ? "bg-primary text-primary-foreground" : "bg-white shadow-sm dark:bg-white/10"
                                        )}>
                                            <submenuParent.icon className="h-5 w-5" strokeWidth={2} />
                                        </div>
                                        <span className="font-semibold">{submenuParent.label}</span>
                                    </Link>

                                    {submenuParent.children?.map((child) => {
                                        if (child.permission && !can(child.permission)) return null
                                        return (
                                            <Link
                                                key={child.href}
                                                href={child.href}
                                                onClick={() => handleMoreOpenChange(false)}
                                                className={cn(
                                                    "flex items-center gap-4 rounded-[20px] p-4 transition-all duration-200 active:scale-95 border",
                                                    pathname.startsWith(child.href)
                                                        ? "border-brand-green-200 bg-brand-green-50 text-foreground dark:border-brand-green-800/40 dark:bg-brand-green-950/30 dark:text-brand-cream"
                                                        : "border-border bg-zinc-50 text-foreground dark:border-white/5 dark:bg-white/5 dark:text-brand-cream/80"
                                                )}
                                            >
                                                <div className={cn(
                                                    "flex h-10 w-10 items-center justify-center rounded-xl",
                                                    pathname.startsWith(child.href) ? "bg-primary text-primary-foreground" : "bg-white shadow-sm dark:bg-white/10"
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
                                    {role === 'OWNER' && features?.module_referrals !== false && (
                                        <div className="mb-6">
                                            <Link
                                                href="/referrals"
                                                onClick={() => handleMoreOpenChange(false)}
                                                className="flex items-center justify-between p-4 rounded-3xl bg-linear-to-br from-brand-deep to-black text-brand-cream relative overflow-hidden group shadow-xl"
                                            >
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/20 blur-3xl rounded-full -mr-10 -mt-10" />

                                                <div className="relative z-10 flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shrink-0">
                                                        <Gift className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-semibold text-foreground dark:text-brand-cream">Refer & Earn</h4>
                                                        <p className="text-xs text-muted-foreground dark:text-brand-cream/60">Get 10% commission per referral</p>
                                                    </div>
                                                </div>
                                            </Link>
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-3">
                                        {mobileMoreItems.map((item) => {
                                            if (item.permission && !can(item.permission)) {
                                                return null
                                            }
                                            const hasChildren = item.children && item.children.length > 0
                                            return (
                                                <button
                                                    key={item.id}
                                                    onClick={() => {
                                                        if (hasChildren) {
                                                            setSubmenuParent(item)
                                                        } else {
                                                            handleMoreOpenChange(false)
                                                            router.push(item.href)
                                                        }
                                                    }}
                                                    className={cn(
                                                        "flex items-center gap-4 rounded-2xl p-4 transition-all duration-200 active:scale-95 text-left border",
                                                        pathname === item.href
                                                            ? "border-brand-green-200 bg-brand-green-50 text-foreground dark:border-brand-green-800/40 dark:bg-brand-green-950/30 dark:text-brand-cream"
                                                            : "border-border bg-zinc-50 text-foreground dark:border-white/5 dark:bg-white/5 dark:text-brand-cream/80"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "flex h-10 w-10 items-center justify-center rounded-xl shrink-0",
                                                        pathname === item.href ? "bg-primary text-primary-foreground" : "bg-white shadow-sm dark:bg-white/10"
                                                    )}>
                                                        <item.icon className="h-5 w-5" strokeWidth={2} />
                                                    </div>
                                                    <span className="font-semibold flex-1">{item.label}</span>
                                                    {hasChildren && (
                                                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground dark:text-brand-cream/30" />
                                                    )}
                                                </button>
                                            )
                                        })}
                                        <button
                                            onClick={() => {
                                                handleMoreOpenChange(false)
                                                handleLogout()
                                            }}
                                            className="flex items-center gap-4 rounded-2xl p-4 bg-red-50 dark:bg-red-500/10 text-red-600 border border-red-200/50 dark:border-red-500/10 active:scale-95 transition-all"
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
