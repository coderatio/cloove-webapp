"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { HugeiconsIcon } from "@hugeicons/react"
import { SparklesIcon as Sparkles, Menu01Icon as Menu, Cancel01Icon as X, Logout01Icon as LogOut, LayoutGridIcon as LayoutGrid, GiftIcon as Gift, ArrowLeft01Icon as ArrowLeft, ChevronRightIcon as ChevronRight, Settings02Icon as Settings } from "@hugeicons/core-free-icons"
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
import { toast } from "sonner"
import { useWorkspaceNav } from "@/app/domains/workspace/hooks/useWorkspaceNav"
import { useBusiness } from "../BusinessProvider"
import { findMiniAppByNavItemId, findMiniAppByPathname, resolveMiniAppItems, isMiniAppItemActive } from "./mini-apps"
import type { ResolvedNavItem } from "@/app/domains/workspace/nav/build-nav-model"
import type { IconSvgElement } from "@hugeicons/react"

/** A drawer submenu entry — covers both nav children and mini-app sub-tabs. */
type MoreSubItem = { id?: string; href: string; label: string; icon: IconSvgElement; permission?: string }

/** A single tab in the floating bottom bar. */
function NavTab({ icon, label, active, href, onClick, hidden }: {
    icon: IconSvgElement
    label: string
    active: boolean
    href?: string
    onClick?: () => void
    hidden?: boolean
}) {
    const inner = (
        <>
            <HugeiconsIcon
                icon={icon}
                className={cn("h-[22px] w-[22px] transition-colors", active ? "text-primary dark:text-brand-gold-300" : "text-muted-foreground")}
                strokeWidth={active ? 2.3 : 1.8}
            />
            <span className={cn(
                "max-w-[60px] truncate text-[10px] font-medium leading-none tracking-tight transition-colors",
                active ? "text-primary dark:text-brand-gold-300" : "text-muted-foreground"
            )}>
                {label}
            </span>
        </>
    )
    const cls = cn(
        "flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 transition-transform active:scale-90",
        hidden && "hidden"
    )
    return href
        ? <Link href={href} className={cls}>{inner}</Link>
        : <button type="button" onClick={onClick} className={cls}>{inner}</button>
}

/** A single row in the menu drawer (iOS grouped-list style). */
function MenuRow({ icon, label, active, hasChildren, href, onClick, destructive, onNavigate }: {
    icon: IconSvgElement
    label: string
    active?: boolean
    hasChildren?: boolean
    href?: string
    onClick?: () => void
    destructive?: boolean
    onNavigate?: () => void
}) {
    const inner = (
        <>
            <span className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] transition-colors",
                destructive
                    ? "bg-red-500/10 text-red-600 dark:text-red-400"
                    : active
                        ? "bg-primary text-primary-foreground dark:bg-brand-gold-700 dark:text-white"
                        : "bg-primary/10 text-primary dark:bg-brand-gold/12 dark:text-brand-gold-300"
            )}>
                <HugeiconsIcon icon={icon} className="h-[18px] w-[18px]" strokeWidth={2} />
            </span>
            <span className={cn(
                "flex-1 truncate text-[15px] font-medium",
                destructive ? "text-red-600 dark:text-red-400" : active ? "text-primary dark:text-brand-gold-300" : "text-foreground"
            )}>
                {label}
            </span>
            {hasChildren && <HugeiconsIcon icon={ChevronRight} className="h-4 w-4 shrink-0 text-muted-foreground/40" />}
        </>
    )
    const cls = cn(
        "flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors active:bg-foreground/[0.05]",
        active && !destructive && "bg-primary/[0.06] dark:bg-brand-gold/[0.07]"
    )
    return href
        ? <Link href={href} onClick={onNavigate} className={cls}>{inner}</Link>
        : <button type="button" onClick={onClick} className={cls}>{inner}</button>
}

const SECTION_CARD = "overflow-hidden rounded-2xl border border-border/60 bg-zinc-50/80 divide-y divide-border/50 dark:border-white/[0.06] dark:bg-white/[0.03] dark:divide-white/[0.05]"
const SECTION_HEADER = "px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/80 dark:text-brand-cream/45"

export function MobileNav() {
    const pathname = usePathname()
    const { logout } = useAuth()
    const isAssistantPage = pathname === "/assistant"
    const { isMenuOpen, setIsMenuOpen } = useMobileNav()
    const [isMoreOpen, setIsMoreOpen] = useState(false)
    const [submenuParent, setSubmenuParent] = useState<ResolvedNavItem | null>(null)

    const { mobilePrimary, mobileSecondary, navGroups } = useWorkspaceNav()
    const { features } = useBusiness()
    const searchParams = useSearchParams()
    const { can, role } = usePermission()

    // Resolve a parent's drill-down items: mini-app sub-tabs if the item maps to a
    // mini app (WhatsApp, Voice, Sales, Developer), otherwise its plain nav children.
    const getSubmenuItems = (parent: ResolvedNavItem): MoreSubItem[] => {
        const miniApp = findMiniAppByNavItemId(parent.id)
        if (miniApp) {
            return resolveMiniAppItems(miniApp, navGroups).filter((i) => !i.permission || can(i.permission))
        }
        return (parent.children ?? []).filter((c) => !c.permission || can(c.permission))
    }

    const handleLogout = () => {
        toast.promise(logout(), {
            loading: "Logging out...",
            success: "Logged out successfully",
            error: "Failed to logout. Please try again.",
        })
    }

    const handleMoreOpenChange = (open: boolean) => {
        setIsMoreOpen(open)
        if (!open) setSubmenuParent(null)
    }

    const closeDrawer = () => handleMoreOpenChange(false)

    // The parent whose submenu the current route lives under (active mini app or
    // a parent with an active child) — so opening the drawer lands on it directly.
    const findActiveParent = (): ResolvedNavItem | null => {
        const allItems = navGroups.flatMap((g) => g.items)
        const miniApp = findMiniAppByPathname(pathname)
        if (miniApp) {
            const item = allItems.find((i) => i.id === miniApp.navItemId)
            if (item) return item
        }
        for (const item of allItems) {
            if (findMiniAppByNavItemId(item.id)) continue // mini apps handled above
            const childActive = (item.children ?? []).some(
                (c) => pathname === c.href || pathname.startsWith(c.href + "/")
            )
            if (childActive) return item
        }
        return null
    }

    const openMore = () => {
        setSubmenuParent(findActiveParent())
        setIsMoreOpen(true)
    }

    // Zen Mode for Assistant Page — collapsed launcher
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
                    <HugeiconsIcon icon={LayoutGrid} className="size-4" />
                </button>
            </motion.div>
        )
    }

    return (
        <>
            <AnimatePresence>
                {(isMenuOpen || !isAssistantPage) && (
                    <motion.nav
                        initial={{ y: 80, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 80, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 380, damping: 34 }}
                        className="fixed inset-x-0 bottom-0 z-50 md:hidden"
                    >
                        {/* Close button for Zen Mode overlay */}
                        {isAssistantPage && (
                            <div className="absolute -top-14 right-4 flex justify-end">
                                <button
                                    onClick={() => setIsMenuOpen(false)}
                                    className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-transform active:scale-90"
                                >
                                    <HugeiconsIcon icon={X} className="h-5 w-5" />
                                </button>
                            </div>
                        )}

                        <div className="relative border-t border-border/60 bg-background/85 backdrop-blur-xl">
                            {/* Elevated Assistant action */}
                            <Link
                                href="/assistant"
                                onClick={() => isAssistantPage && setIsMenuOpen(false)}
                                aria-label="Assistant"
                                className={cn(
                                    "absolute left-1/2 -top-5 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-background transition-transform active:scale-90 dark:bg-brand-gold-700 dark:text-white dark:shadow-brand-gold-700/30",
                                    isAssistantPage ? "scale-105" : "hover:scale-105"
                                )}
                            >
                                <HugeiconsIcon icon={Sparkles} className="h-6 w-6" strokeWidth={2.2} />
                            </Link>

                            <div className="mx-auto flex max-w-md items-stretch px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                                {/* Left cluster */}
                                <div className="flex flex-1 items-center justify-evenly">
                                    {mobilePrimary.map((item) => {
                                        const active = item.href === "/"
                                            ? pathname === "/"
                                            : pathname === item.href || pathname.startsWith(item.href + "/")
                                        return (
                                            <NavTab
                                                key={item.href}
                                                icon={item.icon}
                                                href={item.href}
                                                label={item.id === "overview" ? "Home" : item.label}
                                                active={active}
                                                hidden={!!(item.permission && !can(item.permission))}
                                            />
                                        )
                                    })}
                                </div>

                                {/* Spacer reserving room for the elevated Assistant */}
                                <div className="w-16 shrink-0" aria-hidden />

                                {/* Right cluster */}
                                <div className="flex flex-1 items-center justify-evenly">
                                    {mobileSecondary.map((item) => {
                                        const active = pathname === item.href || pathname.startsWith(item.href)
                                        return (
                                            <NavTab
                                                key={item.href}
                                                icon={item.icon}
                                                href={item.href}
                                                label={item.label}
                                                active={active}
                                                hidden={!!(item.permission && !can(item.permission))}
                                            />
                                        )
                                    })}
                                    <NavTab
                                        icon={Menu}
                                        label="More"
                                        active={isMoreOpen}
                                        onClick={openMore}
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.nav>
                )}
            </AnimatePresence>

            {/* Menu Drawer */}
            <Drawer open={isMoreOpen} onOpenChange={handleMoreOpenChange}>
                <DrawerContent>
                    <DrawerStickyHeader>
                        <DrawerTitle>
                            {submenuParent ? (
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setSubmenuParent(null)}
                                        aria-label="Back"
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground/5 text-foreground transition-colors active:scale-90 dark:bg-white/5"
                                    >
                                        <HugeiconsIcon icon={ArrowLeft} className="h-5 w-5" />
                                    </button>
                                    <span className="truncate">{submenuParent.label}</span>
                                </div>
                            ) : (
                                "Menu"
                            )}
                        </DrawerTitle>
                    </DrawerStickyHeader>

                    <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                        <AnimatePresence mode="wait" initial={false}>
                            {submenuParent ? (
                                <motion.div
                                    key="submenu"
                                    initial={{ opacity: 0, x: 32 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 32 }}
                                    transition={{ duration: 0.18 }}
                                >
                                    <div className={SECTION_CARD}>
                                        {getSubmenuItems(submenuParent).map((child) => (
                                            <MenuRow
                                                key={child.href}
                                                href={child.href}
                                                icon={child.icon}
                                                label={child.label}
                                                active={isMiniAppItemActive(child.href, pathname, searchParams)}
                                                onNavigate={closeDrawer}
                                            />
                                        ))}
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="main"
                                    initial={{ opacity: 0, x: -32 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -32 }}
                                    transition={{ duration: 0.18 }}
                                >
                                    {/* Refer & Earn */}
                                    {role === "OWNER" && features?.module_referrals !== false && (
                                        <Link
                                            href="/referrals"
                                            onClick={closeDrawer}
                                            className="relative mb-5 flex items-center gap-4 overflow-hidden rounded-2xl bg-linear-to-br from-brand-deep to-black p-4 text-brand-cream shadow-lg transition-transform active:scale-[0.98]"
                                        >
                                            <div className="absolute -mr-10 -mt-10 top-0 right-0 h-32 w-32 rounded-full bg-brand-gold/20 blur-3xl" />
                                            <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                                                <HugeiconsIcon icon={Gift} className="h-6 w-6" />
                                            </div>
                                            <div className="relative z-10 flex-1">
                                                <h4 className="text-base font-semibold text-brand-cream">Refer & Earn</h4>
                                                <p className="text-xs text-brand-cream/60">Get 10% commission per referral</p>
                                            </div>
                                            <HugeiconsIcon icon={ChevronRight} className="relative z-10 h-5 w-5 shrink-0 text-brand-cream/40" />
                                        </Link>
                                    )}

                                    {/* Grouped nav sections */}
                                    {navGroups.map((group) => {
                                        const items = group.items.filter((i) => !i.permission || can(i.permission))
                                        if (items.length === 0) return null
                                        return (
                                            <section key={group.label} className="mb-5">
                                                <h3 className={SECTION_HEADER}>{group.label}</h3>
                                                <div className={SECTION_CARD}>
                                                    {items.map((item) => {
                                                        const hasChildren = getSubmenuItems(item).length > 0
                                                        const active = isMiniAppItemActive(item.href, pathname, searchParams)
                                                        return hasChildren ? (
                                                            <MenuRow
                                                                key={item.id}
                                                                icon={item.icon}
                                                                label={item.label}
                                                                active={active}
                                                                hasChildren
                                                                onClick={() => setSubmenuParent(item)}
                                                            />
                                                        ) : (
                                                            <MenuRow
                                                                key={item.id}
                                                                href={item.href}
                                                                icon={item.icon}
                                                                label={item.label}
                                                                active={active}
                                                                onNavigate={closeDrawer}
                                                            />
                                                        )
                                                    })}
                                                </div>
                                            </section>
                                        )
                                    })}

                                    {/* Account */}
                                    <section className="mb-2">
                                        <h3 className={SECTION_HEADER}>Account</h3>
                                        <div className={SECTION_CARD}>
                                            <MenuRow
                                                href="/settings"
                                                icon={Settings}
                                                label="Settings"
                                                active={pathname === "/settings" || pathname.startsWith("/settings/")}
                                                hasChildren
                                                onNavigate={closeDrawer}
                                            />
                                            <MenuRow
                                                icon={LogOut}
                                                label="Sign out"
                                                destructive
                                                onClick={() => {
                                                    closeDrawer()
                                                    handleLogout()
                                                }}
                                            />
                                        </div>
                                    </section>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </DrawerContent>
            </Drawer>
        </>
    )
}
