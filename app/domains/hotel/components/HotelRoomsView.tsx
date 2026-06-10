"use client";

import { useMemo, useState } from "react";
import {
  Building02Icon as Building,
  DoorLockIcon as Door,
  CheckmarkCircle02Icon as Check,
  WrenchIcon as Wrench,
  Add01Icon as Add,
  FileImportIcon as Import,
} from "@hugeicons/core-free-icons";
import { ManagementHeader } from "@/app/components/shared/ManagementHeader";
import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { HugeiconsIcon } from "@hugeicons/react";
import { useStores } from "@/app/domains/stores/providers/StoreProvider";
import { ConfirmDialog } from "@/app/components/shared/ConfirmDialog";
import { HotelTabs } from "./HotelTabs";
import { HotelStatTiles } from "./HotelStatTiles";
import { HotelListState } from "./HotelListState";
import { RoomTypeDrawer } from "./rooms/RoomTypeDrawer";
import { RoomDrawer } from "./rooms/RoomDrawer";
import { RoomImportDrawer } from "./rooms/RoomImportDrawer";
import { RoomTypeCard } from "./rooms/RoomTypeCard";
import { RoomBoard } from "./rooms/RoomBoard";
import { useHotelRooms, useHotelRoomTypes } from "../hooks/useHotelQueries";
import { useHotelMutations } from "../hooks/useHotelMutations";
import type { HotelRoomType } from "../types";

export function HotelRoomsView() {
  const { stores, currentStore } = useStores();
  const [storeId, setStoreId] = useState(currentStore?.id ?? stores[0]?.id ?? "");
  const roomTypes = useHotelRoomTypes(storeId);
  const rooms = useHotelRooms(storeId);
  const mutations = useHotelMutations();

  const [typeDrawerOpen, setTypeDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<HotelRoomType | null>(null);
  const [roomDrawerOpen, setRoomDrawerOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [pendingArchive, setPendingArchive] = useState<HotelRoomType | null>(null);

  const typeList = useMemo(() => roomTypes.data ?? [], [roomTypes.data]);
  const roomList = useMemo(() => rooms.data ?? [], [rooms.data]);

  const stats = useMemo(
    () => [
      {
        label: "Room types",
        value: typeList.length,
        helper: "room categories",
        icon: Building,
        tone: "info" as const,
      },
      {
        label: "Rooms",
        value: roomList.length,
        helper: "actual rooms",
        icon: Door,
        tone: "neutral" as const,
      },
      {
        label: "Available",
        value: roomList.filter((room) => room.status === "available").length,
        helper: "ready now",
        icon: Check,
        tone: "success" as const,
      },
      {
        label: "Out of service",
        value: roomList.filter((room) => room.status === "out_of_service").length,
        helper: "needs attention",
        icon: Wrench,
        tone: "danger" as const,
      },
    ],
    [typeList, roomList],
  );

  function openCreate() {
    setEditing(null);
    setTypeDrawerOpen(true);
  }

  function openEdit(type: HotelRoomType) {
    setEditing(type);
    setTypeDrawerOpen(true);
  }

  return (
    <div className="space-y-6">
      <ManagementHeader
        title="Rooms"
        description="Set up your room types, rooms, prices, and photos."
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
            <Button
              variant="outline"
              className="h-9 w-full rounded-full px-4 sm:w-auto"
              onClick={() => setRoomDrawerOpen(true)}
              disabled={typeList.length === 0}
            >
              <HugeiconsIcon icon={Add} className="mr-1.5 h-4 w-4" />
              Add room
            </Button>
            <Button
              onClick={openCreate}
              className="col-span-2 h-9 w-full rounded-full px-4 font-semibold text-white shadow-sm hover:text-white [&_svg]:text-white sm:w-auto"
            >
              <HugeiconsIcon icon={Add} className="mr-1.5 h-4 w-4" />
              Add room type
            </Button>
          </div>
        }
      />

      <HotelStatTiles stats={stats} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <HotelTabs />
        {stores.length > 1 && (
          <Select value={storeId} onValueChange={setStoreId}>
            <SelectTrigger className="h-11 w-[200px] rounded-2xl">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={Building} className="h-4 w-4 text-brand-accent/50" />
                <SelectValue placeholder="Property" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {stores.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <HotelListState
        isLoading={roomTypes.isLoading}
        isError={roomTypes.isError}
        error={roomTypes.error}
        isEmpty={typeList.length === 0}
        emptyIcon={Building}
        emptyLabel="No room types yet"
        emptyHint="Add your first room type with its price and photos. Guests can then see it and book."
        emptyAction={
          <Button className="h-11 rounded-full px-6" onClick={openCreate}>
            Add room type
          </Button>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {typeList.map((type) => (
            <RoomTypeCard
              key={type.id}
              type={type}
              onEdit={openEdit}
              onArchive={setPendingArchive}
            />
          ))}
        </div>
      </HotelListState>

      {typeList.length > 0 && (
        <HotelListState
          isLoading={rooms.isLoading}
          isError={rooms.isError}
          error={rooms.error}
          isEmpty={roomList.length === 0}
          emptyIcon={Door}
          emptyLabel="No rooms yet"
          emptyHint="Add the actual rooms for a room type so you can assign them and check guests in."
          emptyAction={
            <Button className="h-11 rounded-full px-6" onClick={() => setRoomDrawerOpen(true)}>
              Add room
            </Button>
          }
          skeletonCount={2}
        >
          <RoomBoard roomTypes={typeList} rooms={roomList} mutations={mutations} />
        </HotelListState>
      )}

      {typeDrawerOpen && (
        <RoomTypeDrawer
          key={editing?.id ?? "new"}
          open={typeDrawerOpen}
          onOpenChange={setTypeDrawerOpen}
          mutations={mutations}
          stores={stores}
          defaultStoreId={storeId}
          editing={editing}
        />
      )}
      {roomDrawerOpen && (
        <RoomDrawer
          open={roomDrawerOpen}
          onOpenChange={setRoomDrawerOpen}
          mutations={mutations}
          roomTypes={typeList}
          storeId={storeId}
        />
      )}
      {importOpen && (
        <RoomImportDrawer open={importOpen} onOpenChange={setImportOpen} storeId={storeId} />
      )}

      <ConfirmDialog
        open={!!pendingArchive}
        onOpenChange={(open) => !open && setPendingArchive(null)}
        title="Archive room type?"
        description={
          pendingArchive
            ? `"${pendingArchive.name}" will stop showing for new reservations and on WhatsApp. Current reservations aren't affected.`
            : ""
        }
        confirmText="Archive room type"
        isLoading={mutations.archiveRoomType.isPending}
        onConfirm={async () => {
          if (pendingArchive) {
            await mutations.archiveRoomType.mutateAsync({ id: pendingArchive.id });
            if (editing?.id === pendingArchive.id) setEditing(null);
            setPendingArchive(null);
          }
        }}
      />
    </div>
  );
}
