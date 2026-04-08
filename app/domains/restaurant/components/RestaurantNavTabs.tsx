"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, LayoutGrid, ChefHat } from "lucide-react"
import { cn } from "@/app/lib/utils"

const TABS = [
  { href: "/restaurant/live", label: "Live Board", icon: Activity },
  { href: "/restaurant/tables", label: "Tables", icon: LayoutGrid },
  { href: "/restaurant/kitchen", label: "Kitchen", icon: ChefHat },
] as const

export function RestaurantNavTabs() {
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-1 p-1 rounded-2xl bg-brand-accent/5 dark:bg-white/5 border border-brand-accent/8 dark:border-white/5 w-fit">
      {TABS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
              isActive
                ? "bg-white dark:bg-white/10 text-brand-deep dark:text-brand-cream shadow-sm border border-brand-accent/10 dark:border-white/10"
                : "text-brand-accent/60 dark:text-brand-cream/50 hover:text-brand-deep dark:hover:text-brand-cream hover:bg-white/60 dark:hover:bg-white/5"
            )}
          >
            <Icon className={cn("h-3.5 w-3.5", isActive ? "text-brand-gold" : "opacity-60")} />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        )
      })}
    </div>
  )
}
