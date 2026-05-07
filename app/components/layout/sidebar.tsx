
import Image from "next/image"
import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import {
    ChevronRight,
    ChevronDown,
    Moon,
    Sun,
    Settings,
    LogOut,
    Gift,
    PanelRightClose,
    PanelRightOpen,
} from "lucide-react"
import { cn } from "@/app/lib/utils"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/app/components/ui/tooltip"
import { useTheme } from "next-themes"
import { BusinessSwitcher } from "../shared/BusinessSwitcher"
import { Button } from "../ui/button"
import { toast } from "sonner"
import { usePermission } from "@/app/hooks/usePermission"
import { useAuth } from "../providers/auth-provider"
import { useBusiness } from "../BusinessProvider"
import { useWorkspaceNav } from "@/app/domains/workspace/hooks/useWorkspaceNav"
interface SidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (value: boolean) => void;
}

export function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
    const pathname = usePathname()
    const { theme, setTheme, resolvedTheme } = useTheme()
    const isDark = resolvedTheme === "dark"
    const [isMenuOpen, setIsMenuOpen] = React.useState(false)
    const { navGroups } = useWorkspaceNav()
    const { features } = useBusiness()

    const getExpandedForPath = React.useCallback((path: string, groups: typeof navGroups) => {
        const expanded = new Set<string>()
        for (const group of groups) {
            for (const item of group.items) {
                const isParentOrChildActive = path === item.href || item.children?.some(child => path.startsWith(child.href))
                if (isParentOrChildActive && item.children?.length) expanded.add(item.href)
            }
        }
        return expanded
    }, [])
    const [expandedItems, setExpandedItems] = React.useState<Set<string>>(() =>
        getExpandedForPath(pathname, navGroups)
    )
    const [collapsedSettled, setCollapsedSettled] = React.useState(false)
    const settleRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

    React.useEffect(() => {
        if (settleRef.current) clearTimeout(settleRef.current)
        if (isCollapsed) {
            settleRef.current = setTimeout(() => setCollapsedSettled(true), 220)
        } else {
            setCollapsedSettled(false)
        }
        return () => { if (settleRef.current) clearTimeout(settleRef.current) }
    }, [isCollapsed])

    const { can, role } = usePermission()

    React.useEffect(() => {
        const next = getExpandedForPath(pathname, navGroups)
        setExpandedItems((prev) => {
            if (prev.size === next.size && [...next].every((href) => prev.has(href))) {
                return prev
            }
            return next
        })
    }, [pathname, navGroups, getExpandedForPath])
    const { user, logout } = useAuth()

    const toggleExpanded = (href: string) => {
        setExpandedItems(prev => {
            const next = new Set(prev)
            if (next.has(href)) next.delete(href)
            else next.add(href)
            return next
        })
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2)
    }

    const userInitials = user?.fullName ? getInitials(user.fullName) : '??'

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

        return (
        <motion.aside
            initial={false}
            animate={{ width: isCollapsed ? 68 : 248 }}
            transition={{ type: "tween", duration: 0.05, ease: [0.25, 0.1, 0.25, 1] }}
            className={cn(
                "fixed bottom-4 left-4 top-4 z-40 hidden flex-col rounded-[24px] border shadow-sm md:flex",
                isDark
                    ? "border-border bg-background"
                    : "border-brand-green-100 bg-brand-green-50/60"
            )}
        >
            <div className={cn(
                "relative z-10 flex h-full flex-col text-foreground",
                !isCollapsed && "overflow-hidden"
            )}>
                {/* Header: when collapsed stack logo + expand; when expanded logo + label left, collapse right */}
                <div className={cn("mb-1 p-3", isCollapsed ? "flex flex-col items-center gap-2" : "flex items-center justify-between")}>
                    <div className="flex items-center gap-3 overflow-hidden min-w-0">
                        <div className="relative h-7 w-7 shrink-0">
                            <Image
                                src={isDark ? "/images/logo-white.png" : "/images/logo-green.png"}
                                alt="Cloove"
                                fill
                                className="object-contain"
                            />
                        </div>
                        {!isCollapsed && (
                            <span className="whitespace-nowrap text-lg font-semibold text-foreground">
                                Cloove
                            </span>
                        )}
                    </div>
                    {isCollapsed ? (
                        <Tooltip delayDuration={collapsedSettled ? 200 : 99999}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsCollapsed(!isCollapsed)}
                                    className="h-7 w-7 shrink-0 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                                    aria-label="Expand sidebar"
                                >
                                    <PanelRightOpen className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">Expand sidebar</TooltipContent>
                        </Tooltip>
                    ) : (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="h-7 w-7 shrink-0 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                            aria-label="Collapse sidebar"
                        >
                            <PanelRightClose className="h-5 w-5" />
                        </Button>
                    )}
                </div>

                {/* Store Switcher */}
                <div className={cn("px-3 pb-5 transition-all", isCollapsed && "px-1.5")}>
                    <BusinessSwitcher isCollapsed={isCollapsed} />
                </div>

                {/* Nav Items Grouped */}
                <nav className={cn("flex-1 overflow-y-auto scrollbar-hide pb-4", isCollapsed ? "space-y-1.5 px-1.5" : "space-y-4 px-3")}>
                    {navGroups.map((group, groupIndex) => {
                        const filteredItems = group.items

                        if (filteredItems.length === 0) return null

                        return (
                            <div key={group.key} className="space-y-1">
                                {!isCollapsed && (
                                    <h3 className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                        {group.label}
                                    </h3>
                                )}
                                <div className="space-y-1">
                                    {filteredItems.map((item) => {
                                        const isActive = pathname === item.href
                                        const hasChildren = item.children && item.children.length > 0
                                        const isExpanded = expandedItems.has(item.href)
                                        const isChildActive = item.children?.some(child => pathname.startsWith(child.href))
                                        const filteredChildren = item.children?.filter(child => !child.permission || can(child.permission))

                                        return (
                                            <div key={item.href}>
                                                <Tooltip delayDuration={collapsedSettled ? 200 : 99999}>
                                                    <TooltipTrigger asChild>
                                                        <div
                                                            className={cn(
                                                                "group relative flex items-center rounded-xl transition-colors duration-150",
                                                                isCollapsed ? "mx-auto h-10 w-10 justify-center" : "gap-3 px-3 py-2.5",
                                                                (isActive || isChildActive)
                                                                    ? "bg-primary text-primary-foreground shadow-sm"
                                                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                                            )}
                                                        >
                                                            <Link
                                                                href={item.href}
                                                                className={cn(
                                                                    "flex items-center gap-3",
                                                                    isCollapsed ? "justify-center" : "flex-1 min-w-0"
                                                                )}
                                                            >
                                                                <item.icon
                                                                    className={cn(
                                                                        "h-4.5 w-4.5 shrink-0 transition-colors",
                                                                        (isActive || isChildActive) ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                                                                    )}
                                                                />

                                                                {!isCollapsed && (
                                                                    <span className="whitespace-nowrap text-sm font-medium">{item.label}</span>
                                                                )}
                                                            </Link>

                                                            {hasChildren && !isCollapsed && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleExpanded(item.href) }}
                                                                    className="h-6 w-6 shrink-0 rounded-md text-muted-foreground transition-colors hover:bg-background/10 hover:text-inherit"
                                                                >
                                                                    <ChevronDown className={cn(
                                                                        "h-3.5 w-3.5 transition-transform duration-300",
                                                                        isExpanded ? "rotate-0" : "-rotate-90"
                                                                    )} />
                                                                </Button>
                                                            )}

                                                            {(isActive || isChildActive) && !isCollapsed && (
                                                                <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-primary-foreground/60" />
                                                            )}
                                                        </div>
                                                    </TooltipTrigger>
                                                    {isCollapsed && collapsedSettled && (
                                                        <TooltipContent side="right" className="flex flex-col gap-1">
                                                            <span>{item.label}</span>
                                                            {filteredChildren && filteredChildren.length > 0 && (
                                                                <>
                                                                    <div className="my-1 h-px bg-border" />
                                                                    {filteredChildren.map(child => (
                                                                            <Link
                                                                                key={child.href}
                                                                                href={child.href}
                                                                                className={cn(
                                                                                "rounded px-1 py-1 text-xs transition-colors hover:bg-muted",
                                                                                pathname.startsWith(child.href) ? "font-medium text-foreground" : "text-muted-foreground"
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

                                                {/* Submenu Children */}
                                                {hasChildren && !isCollapsed && isExpanded && filteredChildren && filteredChildren.length > 0 && (
                                                    <div className="overflow-hidden">
                                                        <div className="relative ml-3.5 space-y-1 py-1">
                                                            {/* Vertical Connection Line */}
                                                            <div className="absolute bottom-3 left-[8px] top-3 w-px bg-border" />

                                                            {filteredChildren.map(child => {
                                                                const isChildItemActive = pathname === child.href || pathname.startsWith(child.href)
                                                                return (
                                                                    <Link
                                                                        key={child.href}
                                                                        href={child.href}
                                                                        className={cn(
                                                                            "group/sub relative grid min-h-9 grid-cols-[16px_16px_minmax(0,1fr)] items-center gap-3 rounded-xl py-1.5 text-sm transition-colors duration-150",
                                                                            isChildItemActive
                                                                                ? "text-foreground"
                                                                                : "text-muted-foreground hover:text-foreground"
                                                                        )}
                                                                    >
                                                                        <span className="relative flex h-full items-center justify-center" aria-hidden>
                                                                            <span className={cn(
                                                                            "h-1.5 w-1.5 rounded-full transition-colors duration-150",
                                                                            isChildItemActive
                                                                                ? "bg-foreground ring-4 ring-foreground/10"
                                                                                : "bg-border group-hover/sub:bg-foreground/30"
                                                                        )} />
                                                                        </span>

                                                                        <child.icon className={cn(
                                                                            "h-4 w-4 shrink-0 transition-colors",
                                                                            isChildItemActive ? "text-foreground" : "text-muted-foreground group-hover/sub:text-foreground"
                                                                        )} />
                                                                        <span className="min-w-0 truncate font-medium">{child.label}</span>
                                                                    </Link>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                                {/* Divider for grouped look when collapsed */}
                                {isCollapsed && groupIndex < navGroups.length - 1 && (
                                    <div className="mx-2 my-2 h-px bg-border" />
                                )}
                            </div>
                        )
                    })}
                </nav>

                {/* Footer Actions */}
                <div className="relative mt-auto space-y-3 border-t border-border p-3">
                    {/* Footer buttons removed from here to be moved inside their own relative containers if needed, but primarily profile menu needs it */}

                    {/* Settings Button */}
                    <Link
                        href="/settings"
                            className={cn(
                                "mb-2 flex items-center rounded-xl transition-colors duration-150",
                                isCollapsed ? "mx-auto h-10 w-10 justify-center" : "gap-3 px-3 py-2 text-sm font-medium",
                                pathname === "/settings" || pathname.startsWith("/settings/")
                                ? "bg-muted text-foreground"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                    >
                        <Settings className={cn(
                            "h-5 w-5 shrink-0",
                            pathname === "/settings" || pathname.startsWith("/settings/")
                                ? "text-foreground"
                                : "text-muted-foreground"
                        )} />
                        {!isCollapsed && <span className="whitespace-nowrap">Settings</span>}
                    </Link>

                    {/* Refer & Earn Button */}
                    {role === 'OWNER' && features?.module_referrals !== false && (
                        <Link
                            href="/referrals"
                            className={cn(
                                "mb-2 flex items-center rounded-xl transition-colors duration-150",
                                isCollapsed ? "mx-auto h-10 w-10 justify-center" : "gap-3 px-3 py-2 text-sm font-medium",
                                pathname === "/referrals"
                                    ? "bg-muted text-foreground"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <Gift className={cn("h-5 w-5 shrink-0", pathname === "/referrals" ? "text-foreground" : "text-muted-foreground")} />
                            {!isCollapsed && <span className="whitespace-nowrap">Refer & Earn</span>}
                        </Link>
                    )}

                    {/* Profile Trigger & Popover */}
                    <div className="relative w-full">
                        <AnimatePresence>
                            {isMenuOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsMenuOpen(false)}
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className={cn(
                                            "absolute z-50 bottom-full mb-3 min-w-[200px] rounded-2xl border border-border bg-background p-1 shadow-lg",
                                            isCollapsed ? "left-0" : "left-0 right-0"
                                        )}
                                    >
                                        <div className="flex flex-col gap-0.5">
                                            <Link
                                                href="/settings"
                                                onClick={() => setIsMenuOpen(false)}
                                                className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                            >
                                                <Settings className="h-4 w-4" />
                                                Settings
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    setTheme(theme === "dark" ? "light" : "dark")
                                                    setIsMenuOpen(false)
                                                }}
                                                className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                            >
                                                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                                                {theme === "dark" ? "Light Mode" : "Dark Mode"}
                                            </button>
                                            <div className="mx-2 my-1 h-px bg-border" />
                                            <button
                                                onClick={() => {
                                                    setIsMenuOpen(false)
                                                    handleLogout()
                                                }}
                                                className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                                            >
                                                <LogOut className="h-4 w-4" />
                                                Log Out
                                            </button>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>

                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={cn(
                                "group flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-border bg-muted/40 p-2 text-left transition-colors hover:bg-muted",
                                isCollapsed && "justify-center border-0 bg-transparent p-1"
                            )}
                        >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-[11px] font-semibold uppercase text-foreground">
                                {userInitials}
                            </div>
                            {!isCollapsed && (
                                <>
                                    <div className="flex flex-col flex-1 overflow-hidden min-w-0">
                                        <span className="truncate text-xs font-semibold text-foreground">{user?.fullName}</span>
                                        <span className="truncate text-[10px] font-medium capitalize text-muted-foreground">{role?.toLowerCase().replace('_', ' ') || 'User'}</span>
                                    </div>
                                    <ChevronRight className={cn(
                                        "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300",
                                        isMenuOpen && "rotate-90 text-foreground"
                                    )} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </motion.aside>
    )
}
