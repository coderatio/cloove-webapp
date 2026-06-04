'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { ChevronRightIcon as ChevronRight, Settings01Icon as Settings, Logout01Icon as LogOut, GiftIcon as Gift, PanelLeftIcon as PanelLeft, Sun01Icon as Sun, MoonIcon as Moon, ChevronLeftIcon as ChevronLeft } from "@hugeicons/core-free-icons"
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { cn } from '@/app/lib/utils'
import { useWorkspaceNav } from '@/app/domains/workspace/hooks/useWorkspaceNav'
import { usePermission } from '@/app/hooks/usePermission'
import { useAuth } from '@/app/components/providers/auth-provider'
import { useBusiness } from '@/app/components/BusinessProvider'
import { BusinessSwitcher } from '@/app/components/shared/BusinessSwitcher'
import { Button } from '@/app/components/ui/button'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/app/components/ui/tooltip'
import {
    findMiniAppByNavItemId,
    findMiniAppByPathname,
    findMiniAppById,
    isMiniAppItemActive,
    resolveMiniAppItems,
    type MiniAppDef,
    type MiniAppItem,
} from './mini-apps'

interface SidebarProps {
    isCollapsed: boolean
    setIsCollapsed: (value: boolean) => void
}

const SIDEBAR_WIDTH = 260
const SIDEBAR_COLLAPSED_WIDTH = 72

function useCollapsedSettled(isCollapsed: boolean) {
    const [settled, setSettled] = useState(false)
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        if (isCollapsed) {
            timeoutRef.current = setTimeout(() => setSettled(true), 250)
        } else {
            setSettled(false)
        }
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
        }
    }, [isCollapsed])

    return settled
}

function getInitials(name: string) {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
}

export function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
    const pathname = usePathname()
    const { theme, setTheme, resolvedTheme } = useTheme()
    const isDark = resolvedTheme === 'dark'
    const collapsedSettled = useCollapsedSettled(isCollapsed)
    const { navGroups } = useWorkspaceNav()
    const { can, role } = usePermission()
    const { user, logout } = useAuth()
    const { features } = useBusiness()
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const [activeMiniAppId, setActiveMiniAppId] = useState<string | null>(null)

    // Track last visited sub-route per mini app so re-entering preserves the route
    const lastMiniAppPaths = useRef<Map<string, string>>(new Map())

    const router = useRouter()
    const searchParams = useSearchParams()

    // Auto-detect mini app from route
    useEffect(() => {
        const detected = findMiniAppByPathname(pathname)
        setActiveMiniAppId((prev) => {
            // Don't override if user manually exited mini app
            if (prev && !detected) return null
            if (detected && prev !== detected.id) return detected.id
            return prev
        })
    }, [pathname])

    // Save current route whenever it changes within a mini app
    useEffect(() => {
        if (activeMiniAppId && pathname) {
            const searchStr = searchParams.toString()
            const fullPath = searchStr ? `${pathname}?${searchStr}` : pathname
            lastMiniAppPaths.current.set(activeMiniAppId, fullPath)
        }
    }, [pathname, searchParams, activeMiniAppId])

    const activeMiniApp = activeMiniAppId ? findMiniAppById(activeMiniAppId) : null

    // Compute mini app items, resolving nav-child items from the preset-aware nav tree
    const miniAppItems = useMemo(() => {
        if (!activeMiniApp) return []
        return resolveMiniAppItems(activeMiniApp, navGroups).filter(
            (item) => !item.permission || can(item.permission)
        )
    }, [activeMiniApp, navGroups, can])

    const launchMiniApp = useCallback((navItemId: string, href: string) => {
        const miniApp = findMiniAppByNavItemId(navItemId)
        if (miniApp) {
            setActiveMiniAppId(miniApp.id)
            // Navigate to the last visited sub-route if available, otherwise use default href
            const savedPath = lastMiniAppPaths.current.get(miniApp.id)
            router.push(savedPath || href)
        }
    }, [router])

    const [expandedItems, setExpandedItems] = useState<Set<string>>(() => {
        const expanded = new Set<string>()
        for (const group of navGroups) {
            for (const item of group.items) {
                const isActive =
                    pathname === item.href ||
                    item.children?.some((child) => pathname.startsWith(child.href))
                if (isActive && item.children?.length) expanded.add(item.href)
            }
        }
        return expanded
    })

    useEffect(() => {
        const next = new Set<string>()
        for (const group of navGroups) {
            for (const item of group.items) {
                const isActive =
                    pathname === item.href ||
                    item.children?.some((child) => pathname.startsWith(child.href))
                if (isActive && item.children?.length) next.add(item.href)
            }
        }
        setExpandedItems((prev) => {
            if (prev.size === next.size && [...next].every((href) => prev.has(href))) {
                return prev
            }
            return next
        })
    }, [pathname, navGroups])

    const toggleExpanded = useCallback((href: string) => {
        setExpandedItems((prev) => {
            const next = new Set(prev)
            if (next.has(href)) next.delete(href)
            else next.add(href)
            return next
        })
    }, [])

    const handleLogout = useCallback(() => {
        toast.promise(logout(), {
            loading: 'Logging out...',
            success: 'Logged out successfully',
            error: 'Failed to logout. Please try again.',
        })
    }, [logout])

    const userInitials = user?.fullName ? getInitials(user.fullName) : '??'

    return (
        <motion.aside
            initial={false}
            animate={{ width: isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={cn(
                'fixed inset-y-0 left-0 z-40 hidden flex-col border-r md:flex',
                isDark
                    ? 'border-border/50 bg-background/95 backdrop-blur-xl'
                    : 'border-border/40 bg-white/95 backdrop-blur-xl'
            )}
        >
            <div className="flex h-full flex-col">
                {/* Header */}
                <Header
                    isCollapsed={isCollapsed}
                    isDark={isDark}
                    onToggle={() => setIsCollapsed(!isCollapsed)}
                />

                {/* Business Switcher */}
                <div className={cn('px-3 pb-4', isCollapsed && 'px-2')}>
                    <BusinessSwitcher isCollapsed={isCollapsed} />
                </div>

                {/* Navigation */}
                {activeMiniApp ? (
                    <MiniAppPanel
                        miniApp={activeMiniApp}
                        items={miniAppItems}
                        pathname={pathname}
                        searchParams={searchParams}
                        onBack={() => {
                            // Save current route before exiting so re-entering preserves it
                            const searchStr = searchParams.toString()
                            const currentPath = searchStr ? `${pathname}?${searchStr}` : pathname
                            if (activeMiniAppId) {
                                lastMiniAppPaths.current.set(activeMiniAppId, currentPath)
                            }
                            setActiveMiniAppId(null)
                        }}
                        isCollapsed={isCollapsed}
                    />
                ) : (
                    <nav className="flex-1 overflow-y-auto px-3 py-2">
                        {navGroups.map((group, groupIndex) => (
                            <NavGroup
                                key={group.key}
                                group={group}
                                isCollapsed={isCollapsed}
                                collapsedSettled={collapsedSettled}
                                pathname={pathname}
                                expandedItems={expandedItems}
                                onToggleExpand={toggleExpanded}
                                can={can}
                                isLast={groupIndex === navGroups.length - 1}
                                onLaunchMiniApp={launchMiniApp}
                            />
                        ))}
                    </nav>
                )}

                {/* Footer */}
                <Footer
                    isCollapsed={isCollapsed}
                    pathname={pathname}
                    role={role}
                    features={features}
                    userInitials={userInitials}
                    userName={user?.fullName}
                    isMenuOpen={isMenuOpen}
                    setIsMenuOpen={setIsMenuOpen}
                    theme={theme}
                    setTheme={setTheme}
                    onLogout={handleLogout}
                />
            </div>
        </motion.aside>
    )
}

// Header Component
interface HeaderProps {
    isCollapsed: boolean
    isDark: boolean
    onToggle: () => void
}

function Header({ isCollapsed, isDark, onToggle }: HeaderProps) {
    return (
        <div className={cn(
            "flex items-center p-3",
            isCollapsed ? "justify-center" : "justify-between"
        )}>
            <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
                <div className="relative h-8 w-8 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
                    <Image
                        src={isDark ? '/images/logo-white.png' : '/images/logo-green.png'}
                        alt="Cloove"
                        fill
                        className="object-contain p-1"
                    />
                </div>
                <AnimatePresence mode="wait">
                    {!isCollapsed && (
                        <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.15 }}
                            className="whitespace-nowrap text-base font-semibold text-foreground"
                        >
                            Cloove
                        </motion.span>
                    )}
                </AnimatePresence>
            </Link>

            <AnimatePresence mode="wait">
                {!isCollapsed ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                    >
                        <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onToggle}
                                    className="h-7 w-7 shrink-0 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                                >
                                    <HugeiconsIcon icon={PanelLeft} className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">Collapse</TooltipContent>
                        </Tooltip>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute -right-3 top-3"
                    >
                        <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onToggle}
                                    className="h-6 w-6 shrink-0 rounded-full bg-background border border-border shadow-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                                >
                                    <HugeiconsIcon icon={PanelLeft} className="h-3 w-3" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">Expand</TooltipContent>
                        </Tooltip>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// NavGroup Component
interface NavGroupProps {
    group: {
        key: string
        label: string
        items: Array<{
            id?: string
            href: string
            label: string
            icon: IconSvgElement
            children?: Array<{
                href: string
                label: string
                icon: IconSvgElement
                permission?: string
            }>
        }>
    }
    isCollapsed: boolean
    collapsedSettled: boolean
    pathname: string
    expandedItems: Set<string>
    onToggleExpand: (href: string) => void
    can: (permission: string) => boolean
    isLast: boolean
    onLaunchMiniApp?: (navItemId: string, href: string) => void
}

function NavGroup({
    group,
    isCollapsed,
    collapsedSettled,
    pathname,
    expandedItems,
    onToggleExpand,
    can,
    isLast,
    onLaunchMiniApp,
}: NavGroupProps) {
    const filteredItems = group.items
    if (filteredItems.length === 0) return null

    return (
        <div className={cn('mb-4', isLast && 'mb-0')}>
            <AnimatePresence mode="wait">
                {!isCollapsed && (
                    <motion.h3
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-2 px-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60"
                    >
                        {group.label}
                    </motion.h3>
                )}
            </AnimatePresence>
            <div className="space-y-0.5">
                {filteredItems.map((item) => (
                    <NavItem
                        key={item.href}
                        item={item}
                        isCollapsed={isCollapsed}
                        collapsedSettled={collapsedSettled}
                        pathname={pathname}
                        isExpanded={expandedItems.has(item.href)}
                        onToggleExpand={onToggleExpand}
                        can={can}
                        onLaunchMiniApp={onLaunchMiniApp}
                    />
                ))}
            </div>
        </div>
    )
}

// NavItem Component
interface NavItemProps {
    item: {
        id?: string
        href: string
        label: string
        icon: IconSvgElement
        children?: Array<{
            href: string
            label: string
            icon: IconSvgElement
            permission?: string
        }>
    }
    isCollapsed: boolean
    collapsedSettled: boolean
    pathname: string
    isExpanded: boolean
    onToggleExpand: (href: string) => void
    can: (permission: string) => boolean
    onLaunchMiniApp?: (navItemId: string, href: string) => void
}

function NavItem({
    item,
    isCollapsed,
    collapsedSettled,
    pathname,
    isExpanded,
    onToggleExpand,
    can,
    onLaunchMiniApp,
}: NavItemProps) {
    const isActive = pathname === item.href
    const isChildActive = item.children?.some((child) => pathname.startsWith(child.href))
    const hasChildren = item.children && item.children.length > 0
    const filteredChildren = item.children?.filter(
        (child) => !child.permission || can(child.permission)
    )

    const miniApp = onLaunchMiniApp ? findMiniAppByNavItemId(item.id ?? "") : undefined

    const Icon = item.icon

    const handleClick = (e: React.MouseEvent) => {
        if (miniApp) {
            e.preventDefault()
            onLaunchMiniApp!(item.id!, item.href)
        }
    }

    return (
        <div>
            <Tooltip delayDuration={collapsedSettled ? 200 : 99999}>
                <TooltipTrigger asChild>
                    <div
                        className={cn(
                            'group relative flex items-center rounded-xl transition-all duration-200',
                            isCollapsed ? 'h-10 w-10 justify-center mx-auto' : 'px-3 py-2',
                            isActive || isChildActive
                                ? 'bg-primary/10 text-primary dark:bg-brand-gold/12 dark:text-brand-gold-300'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-white/7 dark:hover:text-brand-cream'
                        )}
                    >
                        <Link
                            href={item.href}
                            onClick={handleClick}
                            className={cn(
                                'flex items-center gap-3',
                                isCollapsed ? 'justify-center' : 'flex-1 min-w-0'
                            )}
                        >
                            <HugeiconsIcon icon={Icon}
                                className={cn(
                                    'shrink-0 transition-colors',
                                    isCollapsed ? 'h-[18px] w-[18px]' : 'h-[18px] w-[18px]',
                                    isActive || isChildActive
                                        ? 'text-primary dark:text-brand-gold-300'
                                        : 'text-muted-foreground group-hover:text-foreground dark:group-hover:text-brand-cream'
                                )}
                            />
                            <AnimatePresence mode="wait">
                                {!isCollapsed && (
                                    <motion.span
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: 'auto' }}
                                        exit={{ opacity: 0, width: 0 }}
                                        className="whitespace-nowrap text-sm font-medium overflow-hidden"
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </Link>

                        {hasChildren && !miniApp && !isCollapsed && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    onToggleExpand(item.href)
                                }}
                                className="ml-auto p-1 rounded-md text-muted-foreground hover:bg-background/50 transition-colors"
                            >
                                <HugeiconsIcon icon={ChevronRight}
                                    className={cn(
                                        'h-3.5 w-3.5 transition-transform duration-200',
                                        isExpanded && 'rotate-90'
                                    )}
                                />
                            </button>
                        )}

                        {(isActive || isChildActive) && (
                            <motion.div
                                layoutId="activeIndicator"
                                className={cn(
                                    'absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary',
                                    'dark:bg-brand-gold-700',
                                    isCollapsed && 'hidden'
                                )}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                        )}
                    </div>
                </TooltipTrigger>
                {isCollapsed && collapsedSettled && (
                    <TooltipContent side="right" className="flex flex-col gap-1">
                        <span className="font-medium">{item.label}</span>
                        {!miniApp && filteredChildren && filteredChildren.length > 0 && (
                            <>
                                <div className="my-1 h-px bg-border" />
                                {filteredChildren.map((child) => (
                                    <Link
                                        key={child.href}
                                        href={child.href}
                                        className={cn(
                                            'text-xs transition-colors hover:text-foreground',
                                            pathname.startsWith(child.href)
                                                ? 'font-medium text-foreground'
                                                : 'text-muted-foreground'
                                        )}
                                    >
                                        {child.label}
                                    </Link>
                                ))}
                            </>
                        )}
                    </TooltipContent>
                )}
            </Tooltip>

            {/* Submenu */}
            {!miniApp && (
                <AnimatePresence initial={false}>
                    {hasChildren && !isCollapsed && isExpanded && filteredChildren && filteredChildren.length > 0 && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                            className="overflow-hidden"
                        >
                            <div className="relative ml-4 mt-1 space-y-0.5 border-l border-border/50 pl-4 py-1">
                                {filteredChildren.map((child) => {
                                    const ChildIcon = child.icon
                                    const isChildItemActive =
                                        pathname === child.href || pathname.startsWith(child.href)
                                    return (
                                        <Link
                                            key={child.href}
                                            href={child.href}
                                            className={cn(
                                                'group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors',
                                                isChildItemActive
                                                    ? 'text-foreground font-medium'
                                                    : 'text-muted-foreground hover:text-foreground'
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    'h-1.5 w-1.5 rounded-full transition-colors',
                                                    isChildItemActive
                                                        ? 'bg-primary'
                                                        : 'bg-border group-hover:bg-muted-foreground/50'
                                                )}
                                            />
                                            <HugeiconsIcon icon={ChildIcon} className="h-3.5 w-3.5 shrink-0" />
                                            <span className="truncate">{child.label}</span>
                                        </Link>
                                    )
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        </div>
    )
}

// MiniAppPanel Component
interface MiniAppPanelProps {
    miniApp: MiniAppDef
    items: MiniAppItem[]
    pathname: string
    searchParams: URLSearchParams
    onBack: () => void
    isCollapsed: boolean
}

function MiniAppPanel({ miniApp, items, pathname, searchParams, onBack, isCollapsed }: MiniAppPanelProps) {
    const resolvedItems = items.length > 0 ? items : miniApp.items

    if (isCollapsed) {
        return (
            <nav className="flex flex-1 flex-col overflow-y-auto py-3">
                {/* Back button to exit mini app */}
                <Tooltip delayDuration={200}>
                    <TooltipTrigger asChild>
                        <button
                            onClick={onBack}
                            className="group relative flex h-10 w-10 items-center justify-center mx-auto rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground dark:hover:bg-white/7 dark:hover:text-brand-cream"
                            aria-label="Back to main navigation"
                        >
                            <HugeiconsIcon icon={ChevronLeft} className="h-[18px] w-[18px] shrink-0" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        <span className="font-medium">Back to main navigation</span>
                    </TooltipContent>
                </Tooltip>

                {/* Separator between back button and nav items */}
                <div className="mx-auto my-3 h-px w-5 bg-border/60" />

                <div className="space-y-0.5">
                    {resolvedItems.map((item) => {
                        const isActive = isMiniAppItemActive(
                            item.href,
                            pathname,
                            searchParams
                        )

                        const Icon = item.icon

                        return (
                            <Tooltip key={item.id} delayDuration={200}>
                                <TooltipTrigger asChild>
                                    <Link
                                        href={item.href}
                                        target={item.href.startsWith('http') ? '_blank' : undefined}
                                        rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                                        className={cn(
                                            'group relative flex h-10 w-10 items-center justify-center mx-auto rounded-xl transition-all duration-200',
                                            isActive
                                                ? 'bg-primary/10 text-primary dark:bg-brand-gold/12 dark:text-brand-gold-300'
                                                : 'text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-white/7 dark:hover:text-brand-cream'
                                        )}
                                    >
                                        <HugeiconsIcon icon={Icon} className="h-[18px] w-[18px] shrink-0" />
                                        {isActive && (
                                            <motion.div
                                                layoutId="miniAppActiveIndicator"
                                                className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary dark:bg-brand-gold-700"
                                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                            />
                                        )}
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                    <span className="font-medium">{item.label}</span>
                                </TooltipContent>
                            </Tooltip>
                        )
                    })}
                </div>
            </nav>
        )
    }

    return (
        <motion.div
            initial={false}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col flex-1 overflow-hidden"
        >
            {/* Mini app header — full-width clickable back button */}
            <div className="border-b border-border/50">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onBack}
                    className="group flex w-full cursor-pointer items-center gap-3 rounded-none px-3 py-2.5 text-left transition-colors hover:bg-muted dark:hover:bg-white/7"
                    aria-label="Back to main navigation"
                >
                    <HugeiconsIcon icon={ChevronLeft} className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-brand-gold/12 dark:text-brand-gold-300">
                        <HugeiconsIcon icon={miniApp.icon} className="h-3.5 w-3.5" />
                    </div>
                    <span className="flex-1 truncate text-sm font-semibold text-foreground">
                        {miniApp.title}
                    </span>
                </motion.button>
            </div>

            {/* Mini app navigation items */}
            <nav className="flex-1 overflow-y-auto px-3 py-3">
                <div className="space-y-0.5">
                    {resolvedItems.map((item) => {
                        // Generalized active detection: works for both direct routes
                        // and query-param-based tab routes (PersistedTabs)
                        const isActive = isMiniAppItemActive(
                            item.href,
                            pathname,
                            searchParams
                        )

                        const Icon = item.icon

                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                target={item.href.startsWith('http') ? '_blank' : undefined}
                                rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                                className={cn(
                                    'group relative flex items-center gap-3 rounded-xl px-3 py-2 transition-all duration-200',
                                    isActive
                                        ? 'bg-primary/10 text-primary dark:bg-brand-gold/12 dark:text-brand-gold-300'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-white/7 dark:hover:text-brand-cream'
                                )}
                            >
                                <HugeiconsIcon icon={Icon}
                                    className={cn(
                                        'h-[18px] w-[18px] shrink-0 transition-colors',
                                        isActive
                                            ? 'text-primary dark:text-brand-gold-300'
                                            : 'text-muted-foreground group-hover:text-foreground dark:group-hover:text-brand-cream'
                                    )}
                                />
                                <span className="text-sm font-medium">{item.label}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="miniAppActiveIndicator"
                                        className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary dark:bg-brand-gold-700"
                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    />
                                )}
                            </Link>
                        )
                    })}
                </div>
            </nav>
        </motion.div>
    )
}

// Footer Component
interface FooterProps {
    isCollapsed: boolean
    pathname: string
    role: string | null
    features: { module_referrals?: boolean } | null
    userInitials: string
    userName?: string
    isMenuOpen: boolean
    setIsMenuOpen: (open: boolean) => void
    theme: string | undefined
    setTheme: (theme: string) => void
    onLogout: () => void
}

function Footer({
    isCollapsed,
    pathname,
    role,
    features,
    userInitials,
    userName,
    isMenuOpen,
    setIsMenuOpen,
    theme,
    setTheme,
    onLogout,
}: FooterProps) {
    return (
        <div className="mt-auto border-t border-border/50 p-3 space-y-1">
            {/* Settings */}
            <FooterLink
                href="/settings"
                icon={Settings}
                label="Settings"
                isActive={pathname === '/settings' || pathname.startsWith('/settings/')}
                isCollapsed={isCollapsed}
            />

            {/* Refer & Earn */}
            {role === 'OWNER' && features?.module_referrals !== false && (
                <FooterLink
                    href="/referrals"
                    icon={Gift}
                    label="Refer & Earn"
                    isActive={pathname === '/referrals'}
                    isCollapsed={isCollapsed}
                />
            )}

            {/* Profile Menu */}
            <div className="relative pt-1">
                <AnimatePresence>
                    {isMenuOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setIsMenuOpen(false)}
                            />
                            <motion.div
                                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                                className={cn(
                                    'absolute z-50 bottom-full mb-2 rounded-xl border border-border bg-background p-1 shadow-lg',
                                    isCollapsed ? 'left-0 w-48' : 'left-0 right-0'
                                )}
                            >
                                <div className="flex flex-col gap-0.5">
                                    <Link
                                        href="/settings"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                    >
                                        <HugeiconsIcon icon={Settings} className="h-4 w-4" />
                                        Settings
                                    </Link>
                                    <button
                                        onClick={() => {
                                            setTheme(theme === 'dark' ? 'light' : 'dark')
                                            setIsMenuOpen(false)
                                        }}
                                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                    >
                                        {theme === 'dark' ? (
                                            <HugeiconsIcon icon={Sun} className="h-4 w-4" />
                                        ) : (
                                            <HugeiconsIcon icon={Moon} className="h-4 w-4" />
                                        )}
                                        {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                                    </button>
                                    <div className="mx-1.5 my-1 h-px bg-border" />
                                    <button
                                        onClick={() => {
                                            setIsMenuOpen(false)
                                            onLogout()
                                        }}
                                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
                                    >
                                        <HugeiconsIcon icon={LogOut} className="h-4 w-4" />
                                        Log out
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={cn(
                        'group flex w-full items-center gap-3 rounded-2xl border border-border/50 bg-muted/30 p-2 text-left transition-all hover:bg-muted hover:border-border dark:border-white/10 dark:bg-white/[0.045] dark:hover:border-brand-gold/20 dark:hover:bg-brand-gold/10',
                        isMenuOpen && 'border-primary/20 bg-primary/10 dark:border-brand-gold/25 dark:bg-brand-gold/12',
                        isCollapsed && 'justify-center border-0 bg-transparent hover:bg-muted/50 dark:hover:bg-white/8'
                    )}
                >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary dark:bg-brand-gold/12 dark:text-brand-gold-300">
                        {userInitials}
                    </div>
                    <AnimatePresence mode="wait">
                        {!isCollapsed && (
                            <motion.div
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                className="flex flex-1 flex-col overflow-hidden"
                            >
                                <span className="truncate text-sm font-medium text-foreground dark:text-brand-cream">
                                    {userName}
                                </span>
                                <span className="truncate text-[10px] text-muted-foreground capitalize dark:text-brand-cream/55">
                                    {role?.toLowerCase().replace('_', ' ') || 'User'}
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </button>
            </div>
        </div>
    )
}

// FooterLink Component
interface FooterLinkProps {
    href: string
    icon: IconSvgElement
    label: string
    isActive: boolean
    isCollapsed: boolean
}

function FooterLink({ href, icon: Icon, label, isActive, isCollapsed }: FooterLinkProps) {
    return (
        <Tooltip delayDuration={isCollapsed ? 200 : 99999}>
            <TooltipTrigger asChild>
                <Link
                    href={href}
                    className={cn(
                        'flex items-center rounded-xl transition-colors',
                        isCollapsed ? 'h-9 w-9 justify-center mx-auto' : 'gap-3 px-2.5 py-2',
                        isActive
                            ? 'bg-primary/10 text-primary dark:bg-brand-gold/12 dark:text-brand-gold-300'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground dark:hover:bg-white/7 dark:hover:text-brand-cream'
                    )}
                >
                    <HugeiconsIcon icon={Icon} className={cn('shrink-0', isCollapsed ? 'h-[18px] w-[18px]' : 'h-[18px] w-[18px]')} />
                    <AnimatePresence mode="wait">
                        {!isCollapsed && (
                            <motion.span
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                className="whitespace-nowrap text-sm font-medium overflow-hidden"
                            >
                                {label}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </Link>
            </TooltipTrigger>
            {isCollapsed && <TooltipContent side="right">{label}</TooltipContent>}
        </Tooltip>
    )
}
