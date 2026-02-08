
import Image from "next/image"
import * as React from "react"
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
    LayoutGrid,
    Banknote,
    Store,
    ShieldCheck,
    Settings,
    LogOut
} from "lucide-react"
import { cn } from "@/app/lib/utils"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/app/components/ui/tooltip"
import { useTheme } from "next-themes"
import { BusinessSwitcher } from "../shared/BusinessSwitcher"
import { Button } from "../ui/button"
import { toast } from "sonner"

const navGroups = [
    {
        label: "Main",
        items: [
            { href: "/", icon: Home, label: "Overview" },
            { href: "/assistant", icon: MessageSquare, label: "Assistant" },
        ]
    },
    {
        label: "Sales & Finance",
        items: [
            { href: "/orders", icon: ShoppingBag, label: "Orders" },
            { href: "/finance", icon: Banknote, label: "Finance" },
            { href: "/customers", icon: Users, label: "Customers" },
        ]
    },
    {
        label: "Operations",
        items: [
            { href: "/inventory", icon: Package, label: "Inventory" },
            { href: "/stores", icon: LayoutGrid, label: "Stores" },
        ]
    },
    {
        label: "Management",
        items: [
            { href: "/storefront", icon: Store, label: "Storefront" },
            { href: "/staff", icon: ShieldCheck, label: "Staff" },
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

    const handleLogout = () => {
        toast.promise(
            fetch('/api/settings/logout', { method: 'POST' })
                .then(() => {
                    window.location.href = '/';
                }),
            {
                loading: 'Logging out...',
                success: 'Logged out successfully',
                error: 'Failed to logout'
            }
        )
    }

    return (
        <motion.aside
            initial={false}
            animate={{ width: isCollapsed ? 80 : 280 }}
            className="fixed left-4 top-4 bottom-4 z-40 hidden md:flex flex-col rounded-[20px] bg-brand-deep dark:bg-[#021a12] shadow-2xl transition-all duration-300"
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
                        <div className="relative h-8 w-8 shrink-0">
                            <Image
                                src="/images/logo-white.png"
                                alt="Cloove"
                                fill
                                className="object-contain"
                            />
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
                    <BusinessSwitcher isCollapsed={isCollapsed} />
                </div>

                {/* Nav Items Grouped */}
                <nav className="flex-1 space-y-6 px-4 overflow-y-auto scrollbar-hide">
                    {navGroups.map((group) => (
                        <div key={group.label} className="space-y-1">
                            {!isCollapsed && (
                                <h3 className="px-4 text-[11px] font-bold uppercase tracking-[0.15em] text-brand-cream/50 mb-3">
                                    {group.label}
                                </h3>
                            )}
                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const isActive = pathname === item.href

                                    return (
                                        <Tooltip key={item.href} delayDuration={0}>
                                            <TooltipTrigger asChild>
                                                <Link
                                                    href={item.href}
                                                    className={cn(
                                                        "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
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
                                            </TooltipTrigger>
                                            {isCollapsed && (
                                                <TooltipContent side="right">
                                                    {item.label}
                                                </TooltipContent>
                                            )}
                                        </Tooltip>
                                    )
                                })}
                            </div>
                            {/* Divider for grouped look when collapsed */}
                            {isCollapsed && group !== navGroups[navGroups.length - 1] && (
                                <div className="mx-4 my-4 h-px bg-white/5" />
                            )}
                        </div>
                    ))}
                </nav>

                {/* Footer Actions */}
                <div className="mt-auto p-4 border-t border-white/10 space-y-4 relative">
                    {/* Popover Menu */}
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
                                        "absolute z-50 bottom-full mb-2 bg-brand-deep/90 dark:bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-1 shadow-2xl min-w-[200px]",
                                        isCollapsed ? "left-2" : "left-4 right-4"
                                    )}
                                >
                                    <div className="flex flex-col gap-0.5">
                                        <Link
                                            href="/settings"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-brand-cream/70 hover:text-brand-cream hover:bg-white/5 transition-all"
                                        >
                                            <Settings className="h-4 w-4" />
                                            Settings
                                        </Link>
                                        <button
                                            onClick={() => {
                                                setTheme(theme === "dark" ? "light" : "dark")
                                                setIsMenuOpen(false)
                                            }}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-brand-cream/70 hover:text-brand-cream hover:bg-white/5 transition-all text-left w-full"
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
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-left w-full"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            Log Out
                                        </button>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>

                    {/* Sidebar Toggle (Only visible when expanded or specifically requested) */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "flex-1 h-10 flex items-center gap-2 text-brand-cream/50 hover:text-brand-cream hover:bg-white/5",
                                isCollapsed ? "justify-center px-0" : "justify-start px-2"
                            )}
                            onClick={() => setIsCollapsed(!isCollapsed)}
                        >
                            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                            {!isCollapsed && <span className="text-[11px] font-bold uppercase tracking-widest">Collapse</span>}
                        </Button>
                    </div>

                    {/* Profile Trigger */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={cn(
                            "group flex items-center gap-3 w-full rounded-2xl bg-black/20 p-2 border border-white/5 transition-all hover:bg-white/5 hover:border-white/10 text-left active:scale-[0.98]",
                            isCollapsed && "justify-center p-1 bg-transparent border-0"
                        )}
                    >
                        <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-brand-gold to-yellow-600 text-brand-deep flex items-center justify-center font-bold text-xs shadow-lg uppercase">
                            JO
                        </div>
                        {!isCollapsed && (
                            <>
                                <div className="flex flex-col flex-1 overflow-hidden">
                                    <span className="text-xs font-bold truncate text-brand-cream">Josiah AO</span>
                                    <span className="text-[10px] text-brand-cream/50 truncate font-medium">Business Owner</span>
                                </div>
                                <ChevronRight className={cn(
                                    "h-4 w-4 text-brand-cream/30 transition-transform duration-300",
                                    isMenuOpen && "rotate-90 text-brand-gold"
                                )} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </motion.aside>
    )
}
