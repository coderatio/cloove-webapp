"use client";

import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon as Trash } from "@hugeicons/core-free-icons";
import { Button } from "@/app/components/ui/button";
import { DotBadge } from "@/app/components/ui/dot-badge";
import { ConfirmDialog } from "@/app/components/shared/ConfirmDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { ROOM_STATUS_CONFIG } from "../../constants";
import type { useHotelMutations } from "../../hooks/useHotelMutations";
import type { HotelRoom, HotelRoomType } from "../../types";

type HotelMutations = ReturnType<typeof useHotelMutations>;

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

  const groups = useMemo(() => {
    return roomTypes
      .map((type) => ({
        type,
        rooms: rooms.filter((room) => room.roomTypeId === type.id),
      }))
      .filter((group) => group.rooms.length > 0);
  }, [roomTypes, rooms]);

  return (
    <div className="space-y-6">
      {groups.map(({ type, rooms: typeRooms }) => {
        const available = typeRooms.filter((room) => room.status === "available").length;
        return (
          <section key={type.id} className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h3 className="font-serif text-lg text-brand-deep dark:text-brand-cream">
                {type.name}
              </h3>
              <span className="text-xs text-brand-accent/50 dark:text-brand-cream/40">
                {available}/{typeRooms.length} available
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {typeRooms.map((room) => {
                const status = ROOM_STATUS_CONFIG[room.status];
                return (
                  <div
                    key={room.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-brand-deep/8 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-brand-deep dark:text-brand-cream">
                        Room {room.number}
                      </p>
                      <DotBadge tone={status.tone} pulse={room.status === "occupied"}>
                        {status.label}
                      </DotBadge>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Select
                        value={room.status}
                        onValueChange={(value) =>
                          mutations.updateRoom.mutate({
                            id: room.id,
                            payload: { status: value },
                          })
                        }
                      >
                        <SelectTrigger className="h-9 w-[140px] rounded-xl text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(
                            Object.keys(ROOM_STATUS_CONFIG) as HotelRoom["status"][]
                          ).map((value) => (
                            <SelectItem key={value} value={value}>
                              {ROOM_STATUS_CONFIG[value].label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-xl text-brand-accent/40 hover:text-rose-500 dark:text-brand-cream/40"
                        onClick={() => setPendingDelete(room)}
                        title="Delete room"
                      >
                        <HugeiconsIcon icon={Trash} className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

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
