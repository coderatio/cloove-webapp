"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
    LayoutDashboard, 
    UserPlus, 
    Building2, 
    Wallet, 
    History,
    LogOut,
    Settings
} from "lucide-react"
import { cn } from "@/app/lib/utils"
import { motion } from "framer-motion"

const navItems = [
    { href: "", icon: LayoutDashboard, label: "Overview" },
    { href: "/onboard", icon: UserPlus, label: "Onboard" },
    { href: "/businesses", icon: Building2, label: "Merchants" },
    { href: "/wallet", icon: Wallet, label: "Wallet" },
]

export function AgentSidebar() {
    const pathname = usePathname()

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="fixed left-0 top-0 h-screen w-20 md:w-64 bg-brand-deep text-brand-cream z-50 transition-all duration-300 hidden md:flex flex-col items-center md:items-stretch py-8 border-r border-white/5">
                {/* Logo */}
                <div className="px-6 mb-12 flex items-center gap-3 justify-center md:justify-start">
                    <div className="w-10 h-10 rounded-xl bg-brand-gold flex items-center justify-center shadow-lg shadow-brand-gold/20">
                        <span className="text-brand-deep font-bold text-xl">C</span>
                    </div>
                    <span className="hidden md:block font-serif text-xl tracking-tight text-brand-gold">Cloove <span className="text-white/60 text-sm font-sans font-normal ml-1">Agents</span></span>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 w-full px-4 space-y-2">
                    {navItems.map((item) => {
                        const fullHref = `/field${item.href}`
                        const isActive = item.href === "" 
                            ? pathname === "/field" || pathname === "/field/" 
                            : pathname.includes(item.href)
                        
                        return (
                            <Link
                                key={item.href}
                                href={fullHref}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group relative",
                                    isActive 
                                        ? "bg-brand-gold text-brand-deep" 
                                        : "text-brand-cream/60 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive && "text-brand-deep")} />
                                <span className="hidden md:block font-medium text-sm">{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                {/* Bottom Section */}
                <div className="px-4 mt-auto space-y-2 w-full">
                    <Link
                        href="/field/settings"
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl text-brand-cream/60 hover:text-white hover:bg-white/5 transition-all group"
                    >
                        <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform" />
                        <span className="hidden md:block font-medium text-sm">Settings</span>
                    </Link>
                    <button
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all w-full group"
                    >
                        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="hidden md:block font-medium text-sm">Log Out</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-6 left-4 right-4 h-16 bg-brand-deep/90 backdrop-blur-2xl border border-white/10 md:hidden z-50 flex items-center justify-around px-2 rounded-3xl shadow-2xl shadow-black/40">
                {navItems.map((item) => {
                    const fullHref = `/field${item.href}`
                    const isActive = item.href === "" 
                        ? pathname === "/field" || pathname === "/field/" 
                        : pathname.includes(item.href)
                    
                    return (
                        <Link
                            key={item.href}
                            href={fullHref}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-2xl transition-all duration-300 relative",
                                isActive ? "text-brand-gold" : "text-brand-cream/40"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5 transition-transform duration-300", isActive && "scale-110 -translate-y-0.5")} />
                            <span className="text-[9px] font-bold uppercase tracking-widest">{item.label}</span>
                            
                            {isActive && (
                                <motion.div 
                                    layoutId="mobile-active-glow"
                                    className="absolute -bottom-1 w-1 h-1 bg-brand-gold rounded-full shadow-[0_0_8px_rgba(234,179,8,0.8)]"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                        </Link>
                    )
                })}
            </nav>
        </>
    )
}
