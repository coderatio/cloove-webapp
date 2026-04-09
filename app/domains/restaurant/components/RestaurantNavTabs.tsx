"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, LayoutGrid, ChefHat, RefreshCw } from "lucide-react"
import { cn } from "@/app/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select"
import {
  useRestaurantRefreshInterval,
  type RefreshIntervalValue,
} from "@/app/domains/restaurant/hooks/useRestaurantRefreshInterval"

const TABS = [
  { href: "/restaurant/live", label: "Live Board", icon: Activity },
  { href: "/restaurant/tables", label: "Tables", icon: LayoutGrid },
  { href: "/restaurant/kitchen", label: "Kitchen", icon: ChefHat },
] as const

export function RestaurantNavTabs() {
  const pathname = usePathname()
  const { value, setValue } = useRestaurantRefreshInterval()

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-brand-accent/5 dark:bg-white/5 border border-brand-accent/8 dark:border-white/5 w-fit h-11">
        {TABS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 px-4 h-9 rounded-xl text-sm font-semibold transition-all duration-200",
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

      {pathname.startsWith("/restaurant/live") && (
        <div className="w-full sm:w-auto">
          <Select value={value} onValueChange={(v) => setValue(v as RefreshIntervalValue)}>
            <SelectTrigger className="h-11 rounded-2xl px-3 w-full sm:w-[160px] bg-white/70 dark:bg-white/5">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 text-brand-accent/50" />
                <SelectValue placeholder="Refresh" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Refresh: Off</SelectItem>
              <SelectItem value="5">Every 5s</SelectItem>
              <SelectItem value="10">Every 10s</SelectItem>
              <SelectItem value="30">Every 30s</SelectItem>
              <SelectItem value="60">Every 60s</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
