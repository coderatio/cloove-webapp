"use client";

import {
  Building02Icon as Building2,
  CalendarRangeIcon as Calendar,
  Activity03Icon as Activity,
  UserMultiple02Icon as Users,
  ChefHatIcon as ChefHat,
  CallIcon as Phone,
  ConciergeBellIcon as Concierge,
} from "@hugeicons/core-free-icons";
import type { PresetPageCopy } from "@/app/domains/workspace/copy/preset-page-copy";
import { usePermission } from "@/app/hooks/usePermission";
import { ModuleShell } from "./ModuleShell";
import { QuickLinkRow } from "./QuickLinkRow";

export function HotelDashboardModule({
  pageCopy,
}: {
  pageCopy: PresetPageCopy;
}) {
  const { can } = usePermission();
  return (
    <ModuleShell
      icon={Building2}
      title="AI front desk"
      subtitle="See your reservations, room status, guest requests, and room service at a glance."
      footerMarkdown={pageCopy.dashboard.verticalHint}
    >
      <QuickLinkRow
        items={[
          {
            href: "/hotel/reservations",
            label: "Reservations",
            icon: Calendar,
            show: can("VIEW_HOTEL_RESERVATIONS"),
          },
          {
            href: "/hotel/rooms",
            label: "Rooms",
            icon: Building2,
            show: can("VIEW_HOTEL_ROOMS"),
          },
          {
            href: "/hotel/requests",
            label: "Guest requests",
            icon: Activity,
            show: can("VIEW_HOTEL_SERVICE_REQUESTS"),
          },
          {
            href: "/hotel/services",
            label: "Services",
            icon: Concierge,
            show: can("VIEW_PRODUCTS"),
          },
          {
            href: "/customers",
            label: "Guests",
            icon: Users,
            show: can("VIEW_CUSTOMERS"),
          },
          {
            href: "/restaurant/kitchen",
            label: "Room service",
            icon: ChefHat,
            show: can("VIEW_KITCHEN_TICKETS"),
          },
          {
            href: "/voice",
            label: "AI receptionist",
            icon: Phone,
            show: can("VIEW_VOICE_CALLS"),
          },
        ]}
      />
    </ModuleShell>
  );
}
