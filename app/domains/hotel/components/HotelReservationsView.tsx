"use client";

import { useMemo, useState } from "react";
import {
  CalendarRangeIcon as Calendar,
  Login03Icon as CheckIn,
  Logout03Icon as CheckOut,
  DoorLockIcon as Door,
  FilterIcon as Filter,
  UserAdd01Icon as ImportGuests,
  FileImportIcon as Import,
  PlusSignIcon as Plus,
} from "@hugeicons/core-free-icons";
import { ManagementHeader } from "@/app/components/shared/ManagementHeader";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { CustomerRosterImportDrawer } from "@/app/domains/customers/components/CustomerRosterImportDrawer";
import { usePermission } from "@/app/hooks/usePermission";
import { HotelTabs } from "./HotelTabs";
import { HotelStatTiles } from "./HotelStatTiles";
import { HotelListState } from "./HotelListState";
import { ReservationDrawer } from "./reservations/ReservationDrawer";
import { ReservationImportDrawer } from "./reservations/ReservationImportDrawer";
import { ReservationCard } from "./reservations/ReservationCard";
import { useHotelReservations, useHotelRooms } from "../hooks/useHotelQueries";
import { useHotelMutations } from "../hooks/useHotelMutations";
import { RESERVATION_STATUS_CONFIG } from "../constants";
import type { HotelReservationStatus } from "../types";

const STATUS_OPTIONS = (
  Object.keys(RESERVATION_STATUS_CONFIG) as HotelReservationStatus[]
).map((status) => ({ value: status, label: RESERVATION_STATUS_CONFIG[status].label }));

/**
 * Front-desk priority: stays that still need attention (awaiting payment,
 * arriving, in house) come first; terminal stays (checked out, no-show,
 * cancelled) sink to the bottom. Within a status, soonest check-in first.
 */
const STATUS_ORDER: Record<HotelReservationStatus, number> = {
  pending_payment: 0,
  confirmed: 1,
  checked_in: 2,
  checked_out: 3,
  no_show: 4,
  cancelled: 5,
};

function todayIso() {
  return new Date().toLocaleDateString("en-CA");
}

export function HotelReservationsView() {
  const reservations = useHotelReservations();
  const rooms = useHotelRooms();
  const mutations = useHotelMutations();
  const { can } = usePermission();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [guestImportOpen, setGuestImportOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | HotelReservationStatus>("all");

  const all = useMemo(() => reservations.data ?? [], [reservations.data]);

  const stats = useMemo(() => {
    const today = todayIso();
    return [
      {
        label: "Arriving today",
        value: all.filter((r) => r.status === "confirmed" && r.checkInDate === today)
          .length,
        helper: "due to check in",
        icon: CheckIn,
        tone: "info" as const,
      },
      {
        label: "Staying now",
        value: all.filter((r) => r.status === "checked_in").length,
        helper: "currently checked in",
        icon: Calendar,
        tone: "success" as const,
      },
      {
        label: "Departing today",
        value: all.filter((r) => r.status === "checked_in" && r.checkOutDate === today)
          .length,
        helper: "due to check out",
        icon: CheckOut,
        tone: "warning" as const,
      },
      {
        label: "Available rooms",
        value: (rooms.data ?? []).filter((room) => room.status === "available").length,
        helper: "ready to assign",
        icon: Door,
        tone: "neutral" as const,
      },
    ];
  }, [all, rooms.data]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return all
      .filter((reservation) => {
        if (statusFilter !== "all" && reservation.status !== statusFilter) return false;
        if (!term) return true;
        return [
          reservation.customer?.name,
          reservation.confirmationCode,
          reservation.roomType?.name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term);
      })
      .sort((a, b) => {
        const statusDelta =
          (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
        if (statusDelta !== 0) return statusDelta;
        return a.checkInDate.localeCompare(b.checkInDate);
      });
  }, [all, search, statusFilter]);

  return (
    <div className="space-y-6">
      <ManagementHeader
        title="Reservations"
        description="Check live availability, confirm stays, assign rooms, and manage arrivals."
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by guest, code, or room type..."
        extraActions={
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
            <Button
              variant="outline"
              className="h-9 w-full rounded-full px-4 sm:w-auto"
              onClick={() => setImportOpen(true)}
            >
              <HugeiconsIcon icon={Import} className="mr-1.5 h-4 w-4" />
              Import
            </Button>
            {can("CREATE_CUSTOMER") && (
              <Button
                variant="outline"
                className="h-9 w-full rounded-full px-4 sm:w-auto"
                onClick={() => setGuestImportOpen(true)}
              >
                <HugeiconsIcon icon={ImportGuests} className="mr-1.5 h-4 w-4" />
                Import guests
              </Button>
            )}
            <Button
              onClick={() => setDrawerOpen(true)}
              className="col-span-2 h-9 w-full rounded-full px-4 font-semibold text-white shadow-sm hover:text-white [&_svg]:text-white sm:w-auto"
            >
              <HugeiconsIcon icon={Plus} className="mr-1.5 h-4 w-4" />
              New reservation
            </Button>
          </div>
        }
      />

      <HotelStatTiles stats={stats} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <HotelTabs />
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as "all" | HotelReservationStatus)}
        >
          <SelectTrigger className="h-11 w-[180px] rounded-2xl">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={Filter} className="h-4 w-4 text-brand-accent/50" />
              <SelectValue placeholder="All statuses" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <HotelListState
        isLoading={reservations.isLoading}
        isError={reservations.isError}
        error={reservations.error}
        isEmpty={filtered.length === 0}
        emptyIcon={Calendar}
        emptyLabel={all.length === 0 ? "No reservations yet" : "No matching reservations"}
        emptyHint={
          all.length === 0
            ? "Create a reservation or let the AI front desk take bookings over WhatsApp and voice."
            : "Try a different search or clear the status filter."
        }
        skeletonCount={3}
      >
        <div className="grid gap-4">
          {filtered.map((reservation) => (
            <ReservationCard
              key={reservation.id}
              reservation={reservation}
              rooms={rooms.data ?? []}
              mutations={mutations}
            />
          ))}
        </div>
      </HotelListState>

      {drawerOpen && (
        <ReservationDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          mutations={mutations}
        />
      )}
      {importOpen && (
        <ReservationImportDrawer open={importOpen} onOpenChange={setImportOpen} />
      )}
      {guestImportOpen && (
        <CustomerRosterImportDrawer open={guestImportOpen} onOpenChange={setGuestImportOpen} />
      )}
    </div>
  );
}
