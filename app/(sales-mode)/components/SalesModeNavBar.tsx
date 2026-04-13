"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { ChefHat, CookingPot, History, LayoutGrid, LogOut, Receipt, Table2 } from "lucide-react"
import { cn } from "@/app/lib/utils"
import { useAuth } from "@/app/components/providers/auth-provider"
import { Button } from "@/app/components/ui/button"
import { Switch } from "@/app/components/ui/switch"
import { storage, STORAGE_KEYS } from "@/app/lib/storage"

const tabs = [
    { href: "/sales-mode/pos", label: "POS", icon: Receipt },
    { href: "/sales-mode/restaurant/live", label: "Live", icon: LayoutGrid },
    { href: "/sales-mode/restaurant/kitchen", label: "Kitchen", icon: ChefHat },
    { href: "/sales-mode/restaurant/bar", label: "Bar", icon: CookingPot },
    { href: "/sales-mode/restaurant/tables", label: "Tables", icon: Table2 },
    { href: "/sales-mode/history", label: "History", icon: History },
]

export function SalesModeNavBar({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const { user, salesModeLogout } = useAuth()
    const businessName = storage.getSalesModeBusinessName() ?? "Business"
    const [autoPrint, setAutoPrint] = useState(true)

    useEffect(() => {
        const persisted = storage.get(STORAGE_KEYS.SALES_MODE_AUTO_PRINT)
        if (persisted === "false") setAutoPrint(false)
        if (persisted === "true") setAutoPrint(true)
    }, [])

    const toggleAutoPrint = (enabled: boolean) => {
        setAutoPrint(enabled)
        storage.set(STORAGE_KEYS.SALES_MODE_AUTO_PRINT, String(enabled))
        window.dispatchEvent(
            new CustomEvent("sales-mode:set-auto-print", { detail: { enabled } })
        )
    }

    return (
        <div className="min-h-screen bg-brand-cream dark:bg-brand-deep flex flex-col">
            <header className="fixed top-0 inset-x-0 z-40 h-14 sm:h-16 border-b border-black/10 dark:border-white/10 pl-3 pr-2 sm:px-4 md:px-6 flex items-center justify-between gap-1.5 sm:gap-3 bg-background/90 backdrop-blur-xl">
                <div className="min-w-0 flex-1 basis-0">
                    <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.14em] sm:tracking-[0.2em] text-brand-accent/50 dark:text-brand-cream/50 font-bold truncate">
                        {user?.fullName ?? "Staff"}
                    </p>
                    <p className="text-xs sm:text-sm md:text-base font-semibold truncate leading-tight">
                        {businessName}
                    </p>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                    {pathname.startsWith("/sales-mode/pos") && (
                        <div
                            className="flex items-center gap-1 sm:gap-2 rounded-lg sm:rounded-xl border border-black/10 dark:border-white/10 bg-background px-1.5 sm:px-3 h-8 sm:h-9"
                            title="Auto-print receipt after checkout"
                        >
                            <span className="text-[8px] sm:text-[10px] uppercase tracking-[0.1em] sm:tracking-[0.18em] font-bold text-brand-accent/60 dark:text-brand-cream/60 max-[360px]:hidden">
                                Auto Print
                            </span>
                            <span className="text-[8px] font-bold uppercase tracking-wide text-brand-accent/60 dark:text-brand-cream/60 min-[361px]:hidden">
                                Print
                            </span>
                            <Switch checked={autoPrint} onCheckedChange={toggleAutoPrint} className="scale-[0.82] sm:scale-100 origin-center shrink-0" />
                        </div>
                    )}
                    <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="h-8 w-8 rounded-lg p-0 sm:h-9 sm:w-auto sm:rounded-xl sm:px-3"
                        onClick={() => void salesModeLogout()}
                        aria-label="Log out"
                    >
                        <LogOut className="w-3.5 h-3.5 sm:mr-1.5" />
                        <span className="hidden sm:inline">Logout</span>
                    </Button>
                </div>
            </header>

            <main className="mt-14 mb-16 h-[calc(100vh-7.5rem)] sm:mt-16 sm:h-[calc(100vh-8rem)] overflow-hidden">
                <div className="h-full min-h-0">{children}</div>
            </main>

            <nav className="fixed bottom-0 inset-x-0 z-40 h-16 border-t border-black/10 dark:border-white/10 grid grid-cols-6 bg-background/95 backdrop-blur-xl shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
                {tabs.map((tab) => {
                    const active = pathname === tab.href
                    const Icon = tab.icon
                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={cn(
                                "flex flex-col items-center justify-center text-[10px] gap-1 transition-colors",
                                active ? "text-brand-gold" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Icon className={cn("w-4 h-4", active && "drop-shadow-[0_0_8px_rgba(212,175,55,0.35)]")} />
                            {tab.label}
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
