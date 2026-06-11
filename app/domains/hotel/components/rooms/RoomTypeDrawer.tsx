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
import { Switch } from "@/app/components/ui/switch";
import { MoneyInput } from "@/app/components/ui/money-input";
import { ImageUpload } from "@/app/components/ui/image-upload";
import { buildCurrencyOptions, currencySymbol } from "@/app/lib/currencies";
import { useCurrencies } from "@/app/hooks/useCurrencies";
import type { Store } from "@/app/domains/stores/providers/StoreProvider";
import { NumberStepper } from "../NumberStepper";
import type { useHotelMutations } from "../../hooks/useHotelMutations";
import type { HotelRoomType } from "../../types";

type HotelMutations = ReturnType<typeof useHotelMutations>;

interface FormState {
  name: string;
  storeId: string;
  capacity: number;
  rate: number;
  currency: string;
  amenities: string;
  images: string[];
  isActive: boolean;
  catalogSyncEnabled: boolean;
}

function initialState(editing: HotelRoomType | null, defaultStoreId: string): FormState {
  if (!editing) {
    return {
      name: "",
      storeId: defaultStoreId,
      capacity: 2,
      rate: 0,
      currency: "NGN",
      amenities: "",
      images: [],
      isActive: true,
      catalogSyncEnabled: true,
    };
  }
  return {
    name: editing.name,
    storeId: editing.storeId,
    capacity: editing.capacity,
    rate: Number(editing.baseNightlyRate),
    currency: editing.currency,
    amenities: editing.amenities.join(", "),
    images: editing.images.map((image) => image.url),
    isActive: editing.isActive,
    catalogSyncEnabled: editing.catalogSyncEnabled,
  };
}

function ToggleRow({
  title,
  hint,
  checked,
  onCheckedChange,
}: {
  title: string;
  hint: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-brand-deep/5 bg-white/40 px-4 py-3 dark:border-white/5 dark:bg-white/5">
      <div className="pr-4">
        <p className="text-sm font-medium text-brand-deep dark:text-brand-cream">{title}</p>
        <p className="text-xs text-brand-accent/60 dark:text-brand-cream/60">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function RoomTypeDrawer({
  open,
  onOpenChange,
  mutations,
  stores,
  defaultStoreId,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mutations: HotelMutations;
  stores: Store[];
  defaultStoreId: string;
  editing: HotelRoomType | null;
}) {
  const [form, setForm] = useState<FormState>(() => initialState(editing, defaultStoreId));
  const currencies = useCurrencies();
  const isEditing = !!editing;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit() {
    const payload = {
      storeId: form.storeId,
      name: form.name.trim(),
      capacity: form.capacity,
      baseNightlyRate: form.rate,
      currency: form.currency.trim() || "NGN",
      amenities: form.amenities
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      images: form.images.map((url, index) => ({
        id: editing?.images.find((image) => image.url === url)?.id ?? crypto.randomUUID(),
        url,
        isPrimary: index === 0,
        alt: `${form.name.trim()} image ${index + 1}`,
      })),
      catalogSyncEnabled: form.catalogSyncEnabled,
      ...(isEditing ? { isActive: form.isActive } : {}),
    };
    if (isEditing && editing) {
      await mutations.updateRoomType.mutateAsync({ id: editing.id, payload });
    } else {
      await mutations.createRoomType.mutateAsync(payload);
    }
    onOpenChange(false);
  }

  const canSubmit =
    form.name.trim().length >= 2 &&
    !!form.storeId &&
    form.rate > 0 &&
    !mutations.createRoomType.isPending &&
    !mutations.updateRoomType.isPending;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh] max-w-xl">
        <DrawerStickyHeader>
          <DrawerTitle className="font-serif text-2xl text-brand-deep dark:text-brand-cream">
            {isEditing ? "Edit room type" : "Add room type"}
          </DrawerTitle>
          <DrawerDescription>
            A room type is a category you sell, like Deluxe or Suite. Set its price, photos,
            and what&apos;s included.
          </DrawerDescription>
        </DrawerStickyHeader>

        <DrawerBody className="space-y-6 pt-5">
          <div className="space-y-2">
            <Label htmlFor="room-type-name">Name</Label>
            <Input
              id="room-type-name"
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="e.g. Deluxe Room"
              maxLength={160}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Property</Label>
              <Select value={form.storeId} onValueChange={(value) => update("storeId", value)}>
                <SelectTrigger className="h-11 rounded-2xl">
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Max guests</Label>
              <NumberStepper
                value={form.capacity}
                min={1}
                max={50}
                onChange={(value) => update("capacity", value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="room-type-rate">Nightly rate</Label>
              <MoneyInput
                id="room-type-rate"
                value={form.rate}
                onChange={(value) => update("rate", value)}
                currencySymbol={currencySymbol(form.currency, currencies)}
                className="h-11 rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={form.currency} onValueChange={(value) => update("currency", value)}>
                <SelectTrigger className="h-11 rounded-2xl">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  {buildCurrencyOptions(currencies, form.currency).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="room-type-amenities">What&apos;s included (separate with commas)</Label>
            <Input
              id="room-type-amenities"
              value={form.amenities}
              onChange={(event) => update("amenities", event.target.value)}
              placeholder="Wi-Fi, breakfast, balcony"
            />
          </div>

          <div className="space-y-2">
            <Label>Images</Label>
            <ImageUpload
              value={form.images}
              onChange={(images) => update("images", images)}
              maxFiles={8}
            />
            <p className="text-xs text-muted-foreground">
              The first photo is the one shown on WhatsApp.
            </p>
          </div>

          {isEditing && (
            <ToggleRow
              title="Available to book"
              hint="Turn off to stop offering this room type to guests."
              checked={form.isActive}
              onCheckedChange={(value) => update("isActive", value)}
            />
          )}
          <ToggleRow
            title="Show on WhatsApp"
            hint="Let guests browse and book this room on WhatsApp. Needs an available room, a price, and at least one photo."
            checked={form.catalogSyncEnabled}
            onCheckedChange={(value) => update("catalogSyncEnabled", value)}
          />
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
            disabled={!canSubmit}
            onClick={submit}
          >
            {isEditing ? "Save changes" : "Add room type"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
