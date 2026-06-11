"use client";

import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon as Check,
  Delete02Icon as Trash,
  FilterIcon as Filter,
  MoreHorizontalIcon as MoreHorizontal,
  Search01Icon as Search,
} from "@hugeicons/core-free-icons";
import DataTable, { type Column } from "@/app/components/DataTable";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { DotBadge } from "@/app/components/ui/dot-badge";
import { ConfirmDialog } from "@/app/components/shared/ConfirmDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { ROOM_STATUS_CONFIG } from "../../constants";
import type { useHotelMutations } from "../../hooks/useHotelMutations";
import type { HotelRoom, HotelRoomType } from "../../types";

type HotelMutations = ReturnType<typeof useHotelMutations>;

type RoomRow = HotelRoom & { typeName: string };

const PAGE_SIZE = 15;
const STATUS_KEYS = Object.keys(ROOM_STATUS_CONFIG) as HotelRoom["status"][];

export function RoomBoard({
  roomTypes,
  rooms,
  mutations,
}: {
  roomTypes: HotelRoomType[];
  rooms: HotelRoom[];
  mutations: HotelMutations;
}) {
  const [pendingDelete, setPendingDelete] = useState<HotelRoom | null>(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | HotelRoom["status"]>("all");

  const typeName = useMemo(() => {
    const map = new Map(roomTypes.map((type) => [type.id, type.name]));
    return (id: string) => map.get(id) ?? "—";
  }, [roomTypes]);

  const typeOptions = useMemo(
    () =>
      roomTypes
        .map((type) => ({
          id: type.id,
          name: type.name,
          count: rooms.filter((room) => room.roomTypeId === type.id).length,
        }))
        .filter((option) => option.count > 0),
    [roomTypes, rooms],
  );

  const filtered = useMemo<RoomRow[]>(() => {
    const term = query.trim().toLowerCase();
    return rooms
      .filter((room) => {
        if (typeFilter !== "all" && room.roomTypeId !== typeFilter) return false;
        if (statusFilter !== "all" && room.status !== statusFilter) return false;
        if (term && !room.number.toLowerCase().includes(term)) return false;
        return true;
      })
      .map((room) => ({ ...room, typeName: typeName(room.roomTypeId) }))
      .sort(
        (a, b) =>
          a.typeName.localeCompare(b.typeName) ||
          a.number.localeCompare(b.number, undefined, { numeric: true }),
      );
  }, [rooms, query, typeFilter, statusFilter, typeName]);

  const columns: Column<RoomRow>[] = [
    {
      key: "number",
      header: "Room",
      cellClassName: "font-semibold text-brand-deep dark:text-brand-cream",
      render: (value) => `Room ${value}`,
    },
    {
      key: "typeName",
      header: "Room type",
      cellClassName: "text-brand-accent/70 dark:text-brand-cream/60",
    },
    {
      key: "status",
      header: "Status",
      render: (_value, room) => {
        const status = ROOM_STATUS_CONFIG[room.status];
        return (
          <DotBadge tone={status.tone} pulse={room.status === "occupied"}>
            {status.label}
          </DotBadge>
        );
      },
    },
    {
      key: "id",
      header: "",
      width: "72px",
      cellClassName: "text-right",
      render: (_value, room) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 rounded-full p-0 hover:bg-brand-deep/5 dark:hover:bg-white/5"
              title="Room actions"
            >
              <HugeiconsIcon icon={MoreHorizontal} className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-52 rounded-2xl border-brand-deep/5 p-2 shadow-2xl dark:border-white/5"
          >
            <DropdownMenuLabel className="p-3 text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40">
              Set status
            </DropdownMenuLabel>
            {STATUS_KEYS.map((value) => {
              const status = ROOM_STATUS_CONFIG[value];
              const isCurrent = room.status === value;
              return (
                <DropdownMenuItem
                  key={value}
                  disabled={isCurrent}
                  onClick={() =>
                    mutations.updateRoom.mutate({ id: room.id, payload: { status: value } })
                  }
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-xl dark:text-brand-cream dark:focus:bg-white/5"
                >
                  <DotBadge tone={status.tone}>{status.label}</DotBadge>
                  {isCurrent && (
                    <HugeiconsIcon icon={Check} className="h-4 w-4 text-brand-green" />
                  )}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator className="my-1 bg-brand-deep/5" />
            <DropdownMenuItem
              onClick={() => setPendingDelete(room)}
              className="flex cursor-pointer items-center gap-3 rounded-xl text-rose-600 focus:bg-rose-50 focus:text-rose-600 dark:text-rose-400 dark:focus:bg-rose-500/10"
            >
              <HugeiconsIcon icon={Trash} className="h-4 w-4" />
              <span className="font-medium">Delete room</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <HugeiconsIcon
            icon={Search}
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-accent/40"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search room number..."
            className="h-11 pl-10"
          />
        </div>
        {typeOptions.length > 1 && (
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-11 w-full rounded-2xl sm:w-[200px]">
              <SelectValue placeholder="All room types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All room types</SelectItem>
              {typeOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name} ({option.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as "all" | HotelRoom["status"])}
        >
          <SelectTrigger className="h-11 w-full rounded-2xl sm:w-[170px]">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={Filter} className="h-4 w-4 text-brand-accent/50" />
              <SelectValue placeholder="All statuses" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_KEYS.map((value) => (
              <SelectItem key={value} value={value}>
                {ROOM_STATUS_CONFIG[value].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-brand-deep/8 bg-white/60 dark:border-white/10 dark:bg-white/5">
        <DataTable
          columns={columns}
          data={filtered}
          pageSize={PAGE_SIZE}
          emptyMessage="No rooms match your search"
        />
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete room?"
        description={
          pendingDelete
            ? `Room ${pendingDelete.number} will be removed. Existing reservations keep their history.`
            : ""
        }
        confirmText="Delete room"
        isLoading={mutations.archiveRoom.isPending}
        onConfirm={async () => {
          if (pendingDelete) {
            await mutations.archiveRoom.mutateAsync({ id: pendingDelete.id });
            setPendingDelete(null);
          }
        }}
      />
    </div>
  );
}
