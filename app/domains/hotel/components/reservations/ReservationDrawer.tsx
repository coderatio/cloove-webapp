"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { addDays, parseISO, startOfToday } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Building02Icon as Building,
  UserMultiple02Icon as Users,
  CheckmarkCircle02Icon as Check,
  ArrowLeft01Icon as ArrowLeft,
  ArrowRight01Icon as ArrowRight,
} from "@hugeicons/core-free-icons";
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
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { DatePickerField } from "@/app/components/shared/DatePickerField";
import { SearchableSelect } from "@/app/components/ui/searchable-select";
import { NumberStepper } from "../NumberStepper";
import { useBusiness } from "@/app/components/BusinessProvider";
import { useStores } from "@/app/domains/stores/providers/StoreProvider";
import { useCustomers } from "@/app/domains/customers/hooks/useCustomers";
import { formatCurrency } from "@/app/lib/formatters";
import { cn } from "@/app/lib/utils";
import { checkHotelAvailability } from "../../hooks/useHotelQueries";
import type { useHotelMutations } from "../../hooks/useHotelMutations";
import type { AvailabilityOption } from "../../types";

type HotelMutations = ReturnType<typeof useHotelMutations>;
type Step = "stay" | "room" | "guest";

const STEPS: { id: Step; label: string }[] = [
  { id: "stay", label: "Stay" },
  { id: "room", label: "Room" },
  { id: "guest", label: "Guest" },
];

export function ReservationDrawer({
  open,
  onOpenChange,
  mutations,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mutations: HotelMutations;
}) {
  const { activeBusiness } = useBusiness();
  const { stores, currentStore } = useStores();
  const customers = useCustomers(1, 100);

  const [step, setStep] = useState<Step>("stay");
  const [storeId, setStoreId] = useState(currentStore?.id ?? stores[0]?.id ?? "");
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [roomTypeId, setRoomTypeId] = useState("");
  const [roomId, setRoomId] = useState("");
  // When a room type has more than one free room, we drill into it so the user
  // picks the specific room. Holds that room type's id while drilled in.
  const [expandedTypeId, setExpandedTypeId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [notes, setNotes] = useState("");

  // yyyy-MM-dd sorts lexically, so a plain string compare is a valid date check.
  const datesOrdered = !!checkInDate && !!checkOutDate && checkOutDate > checkInDate;
  const datesReady = !!storeId && datesOrdered;

  // Constrain the pickers: check-in can't be in the past, and check-out must be
  // at least one night after check-in.
  const today = startOfToday();
  const checkOutMin = checkInDate ? addDays(parseISO(checkInDate), 1) : addDays(today, 1);

  function handleCheckInChange(next: string) {
    setCheckInDate(next);
    // Drop a now-invalid check-out so the user re-picks within the valid range.
    if (checkOutDate && checkOutDate <= next) setCheckOutDate("");
  }

  const availability = useQuery<AvailabilityOption[]>({
    queryKey: [
      "hotel",
      "availability",
      activeBusiness?.id,
      storeId,
      checkInDate,
      checkOutDate,
      adults,
      children,
    ],
    queryFn: () =>
      checkHotelAvailability({ storeId, checkInDate, checkOutDate, adults, children }),
    enabled: open && datesReady && step !== "stay",
  });

  const options = availability.data ?? [];
  const selected = options.find((option) => option.roomType.id === roomTypeId) ?? null;
  const expandedOption =
    options.find((option) => option.roomType.id === expandedTypeId) ?? null;
  // A type with more than one free room requires the user to pick a specific one.
  const needsRoomChoice = (selected?.availableRooms.length ?? 0) > 1;
  const roomStepReady = !!roomTypeId && (!needsRoomChoice || !!roomId);

  function selectRoomType(option: AvailabilityOption) {
    setRoomTypeId(option.roomType.id);
    if (option.availableRooms.length > 1) {
      // Drill in so the user chooses which room.
      setRoomId("");
      setExpandedTypeId(option.roomType.id);
    } else {
      // One free room (or none to choose) — assign it directly.
      setRoomId(option.availableRooms[0]?.id ?? "");
      setExpandedTypeId("");
    }
  }

  const customerOptions = useMemo(
    () =>
      customers.customers.map((customer) => ({
        label: customer.phoneNumber
          ? `${customer.name} · ${customer.phoneNumber}`
          : customer.name,
        value: customer.id,
      })),
    [customers.customers],
  );

  function goToRoom() {
    setRoomTypeId("");
    setRoomId("");
    setExpandedTypeId("");
    setStep("room");
  }

  async function confirm() {
    await mutations.createReservation.mutateAsync({
      storeId,
      customerId,
      roomTypeId,
      roomId: roomId || undefined,
      checkInDate,
      checkOutDate,
      adults,
      children,
      notes: notes.trim() || undefined,
      source: "dashboard",
    });
    onOpenChange(false);
  }

  const activeIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh] max-w-xl">
        <DrawerStickyHeader>
          <DrawerTitle className="font-serif text-2xl text-brand-deep dark:text-brand-cream">
            New reservation
          </DrawerTitle>
          <DrawerDescription>
            Find an available room and confirm the reservation. Payment is handled separately.
          </DrawerDescription>
          <div className="mt-4 flex items-center gap-2">
            {STEPS.map((s, index) => (
              <div key={s.id} className="flex flex-1 items-center gap-2">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold",
                    index <= activeIndex
                      ? "bg-brand-gold text-white"
                      : "bg-brand-accent/10 text-brand-accent/50 dark:bg-white/10 dark:text-brand-cream/50",
                  )}
                >
                  {index + 1}
                </span>
                <span
                  className={cn(
                    "text-xs font-semibold",
                    index <= activeIndex
                      ? "text-brand-deep dark:text-brand-cream"
                      : "text-brand-accent/50 dark:text-brand-cream/40",
                  )}
                >
                  {s.label}
                </span>
                {index < STEPS.length - 1 && (
                  <span className="h-px flex-1 bg-brand-accent/10 dark:bg-white/10" />
                )}
              </div>
            ))}
          </div>
        </DrawerStickyHeader>

        <DrawerBody className="space-y-6 pt-5">
          {step === "stay" && (
            <>
              <div className="space-y-2">
                <Label>Property</Label>
                <Select value={storeId} onValueChange={setStoreId}>
                  <SelectTrigger className="h-11 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon
                        icon={Building}
                        className="h-4 w-4 text-brand-accent/50"
                      />
                      <SelectValue placeholder="Select property" />
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
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Check-in</Label>
                  <DatePickerField
                    value={checkInDate}
                    onChange={handleCheckInChange}
                    minDate={today}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Check-out</Label>
                  <DatePickerField
                    value={checkOutDate}
                    onChange={setCheckOutDate}
                    minDate={checkOutMin}
                  />
                </div>
              </div>
              {checkInDate && checkOutDate && !datesOrdered && (
                <p className="text-xs text-rose-600 dark:text-rose-400">
                  Check-out must be after check-in.
                </p>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Adults</Label>
                  <NumberStepper value={adults} min={1} onChange={setAdults} />
                </div>
                <div className="space-y-2">
                  <Label>Children</Label>
                  <NumberStepper value={children} min={0} onChange={setChildren} />
                </div>
              </div>
            </>
          )}

          {step === "room" && (
            <div className="space-y-3">
              {availability.isFetching ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-20 animate-pulse rounded-2xl bg-brand-accent/5 dark:bg-white/5"
                  />
                ))
              ) : availability.isError ? (
                <p className="py-8 text-center text-sm text-rose-600 dark:text-rose-400">
                  {(availability.error as Error)?.message ||
                    "Could not check availability. Go back and adjust the dates."}
                </p>
              ) : options.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <HugeiconsIcon
                    icon={Building}
                    className="h-8 w-8 text-brand-accent/30 dark:text-brand-cream/30"
                  />
                  <p className="text-sm text-brand-accent/60 dark:text-brand-cream/50">
                    No rooms available for these dates and guests.
                  </p>
                </div>
              ) : expandedOption ? (
                <>
                  <button
                    type="button"
                    onClick={() => setExpandedTypeId("")}
                    className="flex items-center gap-1.5 text-sm font-semibold text-brand-accent/70 transition-colors hover:text-brand-deep dark:text-brand-cream/60 dark:hover:text-brand-cream"
                  >
                    <HugeiconsIcon icon={ArrowLeft} className="h-4 w-4" />
                    All room types
                  </button>
                  <div className="min-w-0">
                    <p className="font-serif text-base text-brand-deep dark:text-brand-cream">
                      {expandedOption.roomType.name}
                    </p>
                    <p className="text-xs text-brand-accent/60 dark:text-brand-cream/50">
                      Choose a room · {expandedOption.availableUnits} available
                    </p>
                  </div>
                  {expandedOption.availableRooms.map((room) => {
                    const isActive = room.id === roomId;
                    return (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => setRoomId(room.id)}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left transition-colors",
                          isActive
                            ? "border-brand-gold bg-brand-gold/10"
                            : "border-brand-deep/8 bg-white/60 hover:border-brand-accent/20 dark:border-white/10 dark:bg-white/5",
                        )}
                      >
                        <span className="flex items-center gap-2 font-medium text-brand-deep dark:text-brand-cream">
                          <HugeiconsIcon
                            icon={Building}
                            className="h-4 w-4 text-brand-accent/50"
                          />
                          Room {room.number}
                        </span>
                        {isActive && (
                          <HugeiconsIcon icon={Check} className="h-4 w-4 text-brand-gold" />
                        )}
                      </button>
                    );
                  })}
                </>
              ) : (
                options.map((option) => {
                  const isActive = option.roomType.id === roomTypeId;
                  const multipleRooms = option.availableRooms.length > 1;
                  return (
                    <button
                      key={option.roomType.id}
                      type="button"
                      onClick={() => selectRoomType(option)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left transition-colors",
                        isActive
                          ? "border-brand-gold bg-brand-gold/10"
                          : "border-brand-deep/8 bg-white/60 hover:border-brand-accent/20 dark:border-white/10 dark:bg-white/5",
                      )}
                    >
                      <div className="min-w-0">
                        <p className="font-serif text-base text-brand-deep dark:text-brand-cream">
                          {option.roomType.name}
                        </p>
                        <p className="text-xs text-brand-accent/60 dark:text-brand-cream/50">
                          {option.availableUnits} available · {option.nights}{" "}
                          {option.nights === 1 ? "night" : "nights"}
                          {isActive && roomId
                            ? ` · Room ${
                                option.availableRooms.find((room) => room.id === roomId)?.number ??
                                ""
                              }`
                            : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <div className="text-right">
                          <p className="font-semibold text-brand-deep dark:text-brand-cream">
                            {formatCurrency(option.total, {
                              currency: option.roomType.currency,
                            })}
                          </p>
                          <p className="text-[11px] text-brand-accent/50 dark:text-brand-cream/40">
                            {formatCurrency(option.roomType.baseNightlyRate, {
                              currency: option.roomType.currency,
                            })}
                            /night
                          </p>
                        </div>
                        {multipleRooms && (
                          <HugeiconsIcon
                            icon={ArrowRight}
                            className="h-4 w-4 shrink-0 text-brand-accent/40 dark:text-brand-cream/40"
                          />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {step === "guest" && (
            <>
              <div className="space-y-2">
                <Label>Guest</Label>
                <SearchableSelect
                  options={customerOptions}
                  value={customerId}
                  onChange={setCustomerId}
                  placeholder="Select guest"
                  searchPlaceholder="Search guests..."
                  emptyMessage="No matching guest."
                  popoverAlign="start"
                  triggerClassName="h-11 rounded-2xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reservation-notes">Notes</Label>
                <Textarea
                  id="reservation-notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Arrival time, preferences, special requests…"
                  rows={4}
                />
              </div>
              {selected && (
                <div className="rounded-2xl border border-brand-deep/8 bg-white/60 p-4 text-sm dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center gap-2 text-brand-deep dark:text-brand-cream">
                    <HugeiconsIcon icon={Users} className="h-4 w-4 text-brand-accent/50" />
                    <span className="font-semibold">
                      {selected.roomType.name}
                      {roomId
                        ? ` · Room ${
                            selected.availableRooms.find((room) => room.id === roomId)?.number ?? ""
                          }`
                        : ""}
                    </span>
                  </div>
                  <p className="mt-1 text-brand-accent/70 dark:text-brand-cream/60">
                    {checkInDate} → {checkOutDate} · {adults + children} guest
                    {adults + children === 1 ? "" : "s"} ·{" "}
                    {formatCurrency(selected.total, {
                      currency: selected.roomType.currency,
                    })}
                  </p>
                </div>
              )}
            </>
          )}
        </DrawerBody>

        <DrawerFooter className="gap-2 sm:flex-row sm:items-center">
          {step !== "stay" ? (
            <Button
              variant="ghost"
              className="h-11 w-full rounded-2xl sm:w-auto"
              onClick={() => {
                // From the room-unit view, step back to the room-type list first.
                if (step === "room" && expandedTypeId) {
                  setExpandedTypeId("");
                  // Clear the half-made selection if no room was chosen.
                  if (!roomId) setRoomTypeId("");
                  return;
                }
                setStep(step === "guest" ? "room" : "stay");
              }}
            >
              <HugeiconsIcon icon={ArrowLeft} className="mr-1.5 h-4 w-4" />
              Back
            </Button>
          ) : (
            <Button
              variant="ghost"
              className="h-11 w-full rounded-2xl sm:w-auto"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          )}
          {step === "stay" && (
            <Button
              className="h-11 w-full rounded-2xl font-semibold sm:flex-1"
              disabled={!datesReady}
              onClick={goToRoom}
            >
              Check availability
            </Button>
          )}
          {step === "room" && (
            <Button
              className="h-11 w-full rounded-2xl font-semibold sm:flex-1"
              disabled={!roomStepReady}
              onClick={() => setStep("guest")}
            >
              Continue
            </Button>
          )}
          {step === "guest" && (
            <Button
              className="h-11 w-full rounded-2xl font-semibold sm:flex-1"
              disabled={!customerId || !roomTypeId || mutations.createReservation.isPending}
              onClick={confirm}
            >
              <HugeiconsIcon icon={Check} className="mr-1.5 h-4 w-4" />
              {mutations.createReservation.isPending ? "Confirming…" : "Confirm stay"}
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
