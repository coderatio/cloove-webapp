"use client"

import * as React from "react"
import { MobileNav } from "./mobile-nav"
import { Sidebar } from "./sidebar"
import { StoreSwitcher } from "../shared/store-switcher"

interface AppLayoutProps {
    children: React.ReactNode
}

import { cn } from "@/app/lib/utils"

export default function AppLayout({ children }: AppLayoutProps) {
    const [mounted, setMounted] = React.useState(false)
    const [isCollapsed, setIsCollapsed] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="min-h-screen bg-background">
                {/* Simple loading shell */}
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-brand-cream dark:bg-brand-deep text-foreground transition-colors duration-300">
            {/* Background Gradient Mesh (Optional "Premium" touch) */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-40 dark:opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-green/20 blur-3xl filter" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-brand-gold/20 blur-3xl filter" />
            </div>

            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

            <main
                className={cn(
                    "relative z-10 min-h-screen transition-all duration-300 md:pr-8 md:py-8",
                    isCollapsed ? "md:pl-[120px]" : "md:pl-[320px]"
                )}
            >
                {/* Mobile Header */}
                <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-background/60 backdrop-blur-xl border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-green text-brand-cream">
                            <span className="font-serif font-bold">C</span>
                        </div>
                        <StoreSwitcher />
                    </div>
                </div>

                <div className="px-4 pb-24 pt-4 md:p-0">
                    {children}
                </div>
            </main>

            <MobileNav />
        </div>
    )
}
