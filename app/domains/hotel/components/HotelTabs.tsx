"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  CalendarRangeIcon as Calendar,
  Building02Icon as Building,
  Activity03Icon as Activity,
  ConciergeBellIcon as Concierge,
} from "@hugeicons/core-free-icons";
import { cn } from "@/app/lib/utils";

const TABS: { href: string; label: string; icon: IconSvgElement }[] = [
  { href: "/hotel/rooms", label: "Rooms", icon: Building },
  { href: "/hotel/reservations", label: "Reservations", icon: Calendar },
  { href: "/hotel/requests", label: "Guest requests", icon: Activity },
  { href: "/hotel/services", label: "Services", icon: Concierge },
];

/**
 * Hotel sub-navigation. Segmented control matching the restaurant/app pattern:
 * a pill group with a raised active tab and a gold accent on the active icon.
 */
export function HotelTabs() {
  const pathname = usePathname();
  return (
    <div className="flex h-11 w-fit items-center gap-1 rounded-2xl border border-brand-accent/8 bg-brand-accent/5 p-1 dark:border-white/5 dark:bg-white/5">
      {TABS.map(({ href, label, icon }) => {
        const isActive = pathname === href || pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex h-9 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-all duration-200",
              isActive
                ? "border border-brand-accent/10 bg-white text-brand-deep shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-brand-cream"
                : "text-brand-accent/60 hover:bg-white/60 hover:text-brand-deep dark:text-brand-cream/50 dark:hover:bg-white/5 dark:hover:text-brand-cream",
            )}
          >
            <HugeiconsIcon
              icon={icon}
              className={cn("h-3.5 w-3.5", isActive ? "text-brand-gold" : "opacity-60")}
            />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        );
      })}
    </div>
  );
}
