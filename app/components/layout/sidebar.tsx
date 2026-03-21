
import Image from "next/image"
import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
    Home,
    Sparkles,
    Package,
    Users,
    ShoppingBag,
    ChevronRight,
    ChevronLeft,
    ChevronDown,
    Moon,
    Sun,
    LayoutGrid,
    Settings,
    LogOut,
    Store,
    Gift,
    Banknote,
    ShieldCheck,
    Activity,
    AlertCircle,
    Receipt,
    Truck,
    Link2,
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
import { apiClient } from "@/app/lib/api-client"

import { usePermission } from "@/app/hooks/usePermission"
import { useAuth } from "../providers/auth-provider"

interface NavItem {
    href: string;
    icon: any;
    label: string;
    permission?: string;
    children?: NavItem[];
}

interface NavGroup {
    label: string;
    items: NavItem[];
}

const navGroups: NavGroup[] = [
    {
        label: "Main",
        items: [
            { href: "/", icon: Home, label: "Overview" },
            { href: "/assistant", icon: Sparkles, label: "Assistant" },
        ]
    },
    {
        label: "Sales & Finance",
        items: [
            { href: "/orders", icon: ShoppingBag, label: "Orders", permission: 'VIEW_SALES' },
            {
                href: "/finance", icon: Banknote, label: "Finance", permission: 'VIEW_FINANCIALS', children: [
                    { href: "/finance/payment-links", icon: Link2, label: "Payment Links", permission: 'VIEW_FINANCIALS' },
                ]
            },
            { href: "/customers", icon: Users, label: "Customers", permission: 'VIEW_CUSTOMERS' },
            { href: "/debts", icon: AlertCircle, label: "Debts", permission: 'VIEW_CUSTOMERS' },
            { href: "/expenses", icon: Receipt, label: "Expenses", permission: 'VIEW_EXPENSES' },
            { href: "/vendors", icon: Truck, label: "Vendors", permission: 'VIEW_SUPPLIERS' },
        ]
    },
    {
        label: "Operations",
        items: [
            { href: "/inventory", icon: Package, label: "Inventory", permission: 'MANAGE_PRODUCTS' },
            { href: "/stores", icon: LayoutGrid, label: "Stores", permission: 'MANAGE_STAFF' },
            { href: "/activity", icon: Activity, label: "Activity", permission: 'VIEW_DASHBOARD' },
        ]
    },
    // {
    //     label: "Growth",
    //     items: [
    //         {
    //             label: "Marketing",
    //             href: "/marketing",
    //             icon: Megaphone,
    //             description: "Campaigns & Promotions"
    //         }
    //     ]
    // },
    {
        label: "Staff & Management",
        items: [
            { href: "/storefront", icon: Store, label: "Storefront", permission: 'MANAGE_STAFF' },
            { href: "/staff", icon: ShieldCheck, label: "Staff", permission: 'MANAGE_STAFF' },
        ]
    }
]

interface SidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (value: boolean) => void;
}

export function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
    const pathname = usePathname()
    const { theme, setTheme } = useTheme()
    const [isMenuOpen, setIsMenuOpen] = React.useState(false)
    const getExpandedForPath = (path: string) => {
        const expanded = new Set<string>()
        for (const group of navGroups) {
            for (const item of group.items) {
                const isParentOrChildActive = path === item.href || item.children?.some(child => path.startsWith(child.href))
                if (isParentOrChildActive && item.children?.length) expanded.add(item.href)
            }
        }
        return expanded
    }
    const [expandedItems, setExpandedItems] = React.useState<Set<string>>(() => getExpandedForPath(pathname))
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
    const { user, logout } = useAuth()

    React.useEffect(() => {
        setExpandedItems(getExpandedForPath(pathname))
    }, [pathname])

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
            animate={{ width: isCollapsed ? 80 : 280 }}
            transition={{ type: "tween", duration: 0.05, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed left-4 top-4 bottom-4 z-40 hidden md:flex flex-col rounded-[20px] bg-brand-deep dark:bg-[#050a08] shadow-2xl border border-white/5"
        >
            {/* Background Texture/Gradient for depth */}
            <div className="absolute inset-0 pointer-events-none opacity-50">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/5 blur-[80px] rounded-full mix-blend-overlay" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-gold/10 blur-[60px] rounded-full" />
            </div>

            <div className={cn(
                "relative z-10 flex flex-col h-full text-brand-cream",
                !isCollapsed && "overflow-hidden"
            )}>
                {/* Header: when collapsed stack logo + expand; when expanded logo + label left, collapse right */}
                <div className={cn("p-4 mb-2", isCollapsed ? "flex flex-col items-center gap-3" : "flex items-center justify-between")}>
                    <div className="flex items-center gap-3 overflow-hidden min-w-0">
                        <div className="relative h-8 w-8 shrink-0">
                            <Image
                                src="/images/logo-white.png"
                                alt="Cloove"
                                fill
                                className="object-contain"
                            />
                        </div>
                        {!isCollapsed && (
                            <span className="font-serif text-2xl font-medium tracking-tight whitespace-nowrap text-brand-cream">
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
                                    className="h-8 w-8 shrink-0 rounded-xl text-brand-cream/80 hover:text-brand-cream hover:bg-white/10 transition-colors"
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
                            className="h-8 w-8 shrink-0 rounded-xl text-brand-cream/50 hover:text-brand-cream hover:bg-white/10 transition-colors"
                            aria-label="Collapse sidebar"
                        >
                            <PanelRightClose className="h-5 w-5" />
                        </Button>
                    )}
                </div>

                {/* Store Switcher */}
                <div className={cn("px-4 pb-8 transition-all", isCollapsed && "px-2")}>
                    <BusinessSwitcher isCollapsed={isCollapsed} />
                </div>

                {/* Nav Items Grouped */}
                <nav className={cn("flex-1 overflow-y-auto scrollbar-hide pb-6", isCollapsed ? "space-y-2 px-2" : "space-y-6 px-4")}>
                    {navGroups.map((group) => {
                        // Filter items in the group based on permissions
                        const filteredItems = group.items.filter(item => !item.permission || can(item.permission))

                        // If no items are left in the group, don't render the group at all
                        if (filteredItems.length === 0) return null

                        return (
                            <div key={group.label} className="space-y-1">
                                {!isCollapsed && (
                                    <h3 className="px-4 text-[11px] font-bold uppercase tracking-[0.15em] text-brand-cream/50 mb-3">
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
                                                                "group relative flex items-center rounded-xl transition-all duration-200",
                                                                isCollapsed ? "justify-center h-12 w-12 mx-auto" : "gap-3 px-4 py-3",
                                                                (isActive || isChildActive)
                                                                    ? "bg-white/10 text-brand-gold-light shadow-sm backdrop-blur-sm"
                                                                    : "text-brand-cream/70 hover:text-brand-cream hover:bg-white/5"
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
                                                                        "h-5 w-5 shrink-0 transition-colors",
                                                                        (isActive || isChildActive) ? "text-brand-gold-light" : "text-brand-cream/70 group-hover:text-brand-cream"
                                                                    )}
                                                                />

                                                                {!isCollapsed && (
                                                                    <span className="whitespace-nowrap">{item.label}</span>
                                                                )}
                                                            </Link>

                                                            {hasChildren && !isCollapsed && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleExpanded(item.href) }}
                                                                    className="h-7 w-7 rounded-lg hover:bg-white/10 transition-all shrink-0 text-brand-cream/40 hover:text-brand-gold-light"
                                                                >
                                                                    <ChevronDown className={cn(
                                                                        "h-3.5 w-3.5 transition-transform duration-300",
                                                                        isExpanded ? "rotate-0" : "-rotate-90"
                                                                    )} />
                                                                </Button>
                                                            )}

                                                            {(isActive || isChildActive) && !isCollapsed && (
                                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-brand-gold-light rounded-r-full" />
                                                            )}
                                                        </div>
                                                    </TooltipTrigger>
                                                    {isCollapsed && collapsedSettled && (
                                                        <TooltipContent side="right" className="flex flex-col gap-1">
                                                            <span>{item.label}</span>
                                                            {filteredChildren && filteredChildren.length > 0 && (
                                                                <>
                                                                    <div className="h-px bg-white/10 my-1" />
                                                                    {filteredChildren.map(child => (
                                                                        <Link
                                                                            key={child.href}
                                                                            href={child.href}
                                                                            className={cn(
                                                                                "text-xs py-1 px-1 rounded hover:bg-white/10 transition-colors",
                                                                                pathname.startsWith(child.href) ? "text-brand-gold-light font-medium" : ""
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
                                                        <div className="relative ml-[16px] pl-4 py-1 space-y-1">
                                                            {/* Vertical Connection Line */}
                                                            <div className="absolute left-0 top-0 bottom-0 w-px bg-white/20" />

                                                            {filteredChildren.map(child => {
                                                                const isChildItemActive = pathname === child.href || pathname.startsWith(child.href)
                                                                return (
                                                                    <Link
                                                                        key={child.href}
                                                                        href={child.href}
                                                                        className={cn(
                                                                            "group/sub relative flex items-center gap-3 py-2 rounded-xl text-sm transition-all duration-200",
                                                                            isChildItemActive
                                                                                ? "text-brand-gold-light"
                                                                                : "text-brand-cream/50 hover:text-brand-gold-light"
                                                                        )}
                                                                    >
                                                                        {/* Active Indicator Dot */}
                                                                        <div className={cn(
                                                                            "absolute -left-[19px] w-1.5 h-1.5 rounded-full transition-all duration-300",
                                                                            isChildItemActive
                                                                                ? "bg-brand-gold-light ring-4 ring-brand-gold-light/20"
                                                                                : "bg-white/10 group-hover/sub:bg-white/30"
                                                                        )} />

                                                                        <child.icon className={cn(
                                                                            "h-4 w-4 shrink-0 transition-colors",
                                                                            isChildItemActive ? "text-brand-gold-light" : "text-brand-cream/40 group-hover/sub:text-brand-cream"
                                                                        )} />
                                                                        <span className="font-medium">{child.label}</span>
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
                                {isCollapsed && group !== navGroups[navGroups.length - 1] && (
                                    <div className="mx-3 my-2 h-px bg-white/5" />
                                )}
                            </div>
                        )
                    })}
                </nav>

                {/* Footer Actions */}
                <div className="mt-auto p-4 border-t border-white/10 space-y-4 relative">
                    {/* Footer buttons removed from here to be moved inside their own relative containers if needed, but primarily profile menu needs it */}

                    {/* Refer & Earn Button */}
                    {role === 'OWNER' && (
                        <Link
                            href="/referrals"
                            className={cn(
                                "flex items-center rounded-xl transition-all duration-200 mb-2",
                                isCollapsed ? "justify-center h-12 w-12 mx-auto" : "gap-3 px-3 py-2 text-sm font-medium",
                                pathname === "/referrals"
                                    ? "bg-brand-gold-light/10 text-brand-gold-light"
                                    : "text-brand-cream/70 hover:text-brand-cream hover:bg-white/5"
                            )}
                        >
                            <Gift className={cn("h-5 w-5 shrink-0", pathname === "/referrals" ? "text-brand-gold-light" : "text-brand-cream/70")} />
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
                                            "absolute z-50 bottom-full mb-3 bg-brand-deep-600 dark:bg-brand-deep-800 backdrop-blur-xl border border-white/10 rounded-2xl p-1 shadow-2xl min-w-[200px]",
                                            isCollapsed ? "left-0" : "left-0 right-0"
                                        )}
                                    >
                                        <div className="flex flex-col gap-0.5">
                                            <Link
                                                href="/settings"
                                                onClick={() => setIsMenuOpen(false)}
                                                className="flex cursor-pointer items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-brand-cream/70 hover:text-brand-cream hover:bg-white/5 transition-all"
                                            >
                                                <Settings className="h-4 w-4" />
                                                Settings
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    setTheme(theme === "dark" ? "light" : "dark")
                                                    setIsMenuOpen(false)
                                                }}
                                                className="flex cursor-pointer items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-brand-cream/70 hover:text-brand-cream hover:bg-white/5 transition-all text-left w-full"
                                            >
                                                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                                                {theme === "dark" ? "Light Mode" : "Dark Mode"}
                                            </button>
                                            <div className="h-px bg-white/5 mx-2 my-1" />
                                            <button
                                                onClick={() => {
                                                    setIsMenuOpen(false)
                                                    handleLogout()
                                                }}
                                                className="flex cursor-pointer items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-left w-full"
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
                                "group flex cursor-pointer items-center gap-3 w-full rounded-2xl bg-black/20 p-2 border border-white/5 transition-all hover:bg-white/5 hover:border-white/10 text-left active:scale-[0.98]",
                                isCollapsed && "justify-center p-1 bg-transparent border-0"
                            )}
                        >
                            <div className="h-9 w-9 shrink-0 rounded-full bg-linear-to-br from-brand-gold to-yellow-600 text-brand-deep flex items-center justify-center font-bold text-xs shadow-lg uppercase">
                                {userInitials}
                            </div>
                            {!isCollapsed && (
                                <>
                                    <div className="flex flex-col flex-1 overflow-hidden min-w-0">
                                        <span className="text-xs font-bold truncate text-brand-cream">{user?.fullName}</span>
                                        <span className="text-[10px] text-brand-cream/50 truncate font-medium capitalize">{role?.toLowerCase().replace('_', ' ') || 'User'}</span>
                                    </div>
                                    <ChevronRight className={cn(
                                        "h-4 w-4 shrink-0 text-brand-cream/30 transition-transform duration-300",
                                        isMenuOpen && "rotate-90 text-brand-gold-bright"
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
