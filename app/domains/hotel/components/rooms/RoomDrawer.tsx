"use client";

import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerStickyHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
} from "@/app/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import type { useHotelMutations } from "../../hooks/useHotelMutations";
import type { HotelRoomType } from "../../types";

type HotelMutations = ReturnType<typeof useHotelMutations>;

export function RoomDrawer({
  open,
  onOpenChange,
  mutations,
  roomTypes,
  storeId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mutations: HotelMutations;
  roomTypes: HotelRoomType[];
  storeId: string;
}) {
  const [roomTypeId, setRoomTypeId] = useState("");
  const [number, setNumber] = useState("");

  async function submit() {
    await mutations.createRoom.mutateAsync({ storeId, roomTypeId, number: number.trim() });
    onOpenChange(false);
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-w-md">
        <DrawerStickyHeader>
          <DrawerTitle className="font-serif text-2xl text-brand-deep dark:text-brand-cream">
            Add room
          </DrawerTitle>
          <DrawerDescription>
            Add the actual rooms guests stay in. Availability is counted from these.
          </DrawerDescription>
        </DrawerStickyHeader>

        <DrawerBody className="space-y-6 pt-5">
          <div className="space-y-2">
            <Label>Room type</Label>
            <Select value={roomTypeId} onValueChange={setRoomTypeId}>
              <SelectTrigger className="h-11 rounded-2xl">
                <SelectValue placeholder="Select room type" />
              </SelectTrigger>
              <SelectContent>
                {roomTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="room-number">Room number or name</Label>
            <Input
              id="room-number"
              value={number}
              onChange={(event) => setNumber(event.target.value)}
              placeholder="e.g. 204"
              maxLength={80}
            />
          </div>
        </DrawerBody>

        <DrawerFooter className="gap-2 sm:flex-row sm:items-center">
          <Button
            variant="ghost"
            className="h-11 w-full rounded-2xl sm:w-auto"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="h-11 w-full rounded-2xl font-semibold sm:flex-1"
            disabled={!roomTypeId || !number.trim() || mutations.createRoom.isPending}
            onClick={submit}
          >
            Add room
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
