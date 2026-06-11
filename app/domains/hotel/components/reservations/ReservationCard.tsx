"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Login03Icon as CheckIn,
  Logout03Icon as CheckOut,
  DoorLockIcon as Door,
} from "@hugeicons/core-free-icons";
import { GlassCard } from "@/app/components/ui/glass-card";
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
import { formatCurrency } from "@/app/lib/formatters";
import { RESERVATION_STATUS_CONFIG } from "../../constants";
import type { useHotelMutations } from "../../hooks/useHotelMutations";
import type { HotelReservation, HotelRoom } from "../../types";
import { ReservationPaymentDrawer } from "./ReservationPaymentDrawer";

type HotelMutations = ReturnType<typeof useHotelMutations>;

export function ReservationCard({
  reservation,
  rooms,
  mutations,
}: {
  reservation: HotelReservation;
  rooms: HotelRoom[];
  mutations: HotelMutations;
}) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [balanceWarningOpen, setBalanceWarningOpen] = useState(false);
  const status = RESERVATION_STATUS_CONFIG[reservation.status];
  const amountPaid = Number(reservation.amountPaid ?? 0);
  const balance = Number(reservation.balance ?? reservation.totalAmount);
  const assignableRooms = rooms.filter(
    (room) =>
      room.roomTypeId === reservation.roomTypeId &&
      room.status !== "out_of_service",
  );
  const holdDeadline =
    reservation.status === "pending_payment" && reservation.holdExpiresAt
      ? new Date(reservation.holdExpiresAt)
      : null;

  return (
    <GlassCard hoverEffect className="p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="font-serif text-lg text-brand-deep dark:text-brand-cream">
              {reservation.customer?.name ?? "Guest"}
            </h3>
            <DotBadge
              tone={status.tone}
              pulse={reservation.status === "checked_in"}
            >
              {status.label}
            </DotBadge>
          </div>
          <p className="text-sm text-brand-accent/70 dark:text-brand-cream/60">
            {reservation.roomType?.name ?? "Room"}
            {reservation.room?.number
              ? ` · Room ${reservation.room.number}`
              : ""}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="text-brand-deep/80 dark:text-brand-cream/80">
              {reservation.checkInDate} → {reservation.checkOutDate}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-brand-accent/50 dark:text-brand-cream/40">
              #{reservation.confirmationCode}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="font-semibold text-brand-deep dark:text-brand-cream">
              {formatCurrency(reservation.totalAmount, {
                currency: reservation.currency,
              })}
            </span>
            <span
              className={
                balance <= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : amountPaid > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-rose-600 dark:text-rose-400"
              }
            >
              {balance <= 0
                ? "Paid"
                : amountPaid > 0
                  ? `${formatCurrency(balance, { currency: reservation.currency })} balance`
                  : "Unpaid"}
            </span>
          </div>
          {holdDeadline && (
            <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
              Room held until{" "}
              {holdDeadline.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {reservation.status === "confirmed" && !reservation.roomId && (
            <Select
              onValueChange={(roomId) =>
                mutations.assignRoom.mutate({ id: reservation.id, roomId })
              }
            >
              <SelectTrigger className="h-9 w-[160px] rounded-xl">
                <div className="flex items-center gap-2">
                  <HugeiconsIcon
                    icon={Door}
                    className="h-3.5 w-3.5 text-brand-accent/50"
                  />
                  <SelectValue placeholder="Assign room" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {assignableRooms.length === 0 ? (
                  <SelectItem value="__none__" disabled>
                    No eligible rooms
                  </SelectItem>
                ) : (
                  assignableRooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      Room {room.number}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}

          {reservation.status === "confirmed" && reservation.roomId && (
            <Button
              size="sm"
              className="h-9 rounded-xl font-semibold"
              disabled={mutations.reservationAction.isPending}
              onClick={() => {
                if (balance > 0) {
                  setBalanceWarningOpen(true);
                  return;
                }
                mutations.reservationAction.mutate({
                  id: reservation.id,
                  action: "check-in",
                });
              }}
            >
              <HugeiconsIcon icon={CheckIn} className="mr-1.5 h-4 w-4" />
              Check in
            </Button>
          )}

          {reservation.status === "checked_in" && (
            <Button
              size="sm"
              className="h-9 rounded-xl font-semibold"
              disabled={mutations.reservationAction.isPending}
              onClick={() =>
                mutations.reservationAction.mutate({
                  id: reservation.id,
                  action: "check-out",
                })
              }
            >
              <HugeiconsIcon icon={CheckOut} className="mr-1.5 h-4 w-4" />
              Check out
            </Button>
          )}

          {reservation.saleId &&
            balance > 0 &&
            reservation.status !== "cancelled" && (
              <Button
                size="sm"
                variant="outline"
                className="h-9 rounded-xl"
                onClick={() => setPaymentOpen(true)}
              >
                Record payment
              </Button>
            )}

          {["pending_payment", "confirmed"].includes(reservation.status) && (
            <Button
              size="sm"
              variant="ghost"
              className="h-9 rounded-xl text-brand-accent/70 hover:text-rose-500 dark:text-brand-cream/60"
              onClick={() => setCancelOpen(true)}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel reservation?"
        description={`This cancels ${reservation.customer?.name ?? "the guest"}'s reservation (${reservation.confirmationCode}). This can't be undone.`}
        confirmText="Cancel reservation"
        isLoading={mutations.reservationAction.isPending}
        onConfirm={async () => {
          await mutations.reservationAction.mutateAsync({
            id: reservation.id,
            action: "cancel",
          });
          setCancelOpen(false);
        }}
      />

      <ConfirmDialog
        open={balanceWarningOpen}
        onOpenChange={setBalanceWarningOpen}
        title="Outstanding balance"
        description={`${formatCurrency(balance, {
          currency: reservation.currency,
        })} is still due. Confirm only if reception will collect or has approved the balance.`}
        confirmText="Check in with balance"
        isLoading={mutations.reservationAction.isPending}
        onConfirm={async () => {
          await mutations.reservationAction.mutateAsync({
            id: reservation.id,
            action: "check-in",
            payload: { allowOutstandingBalance: true },
          });
          setBalanceWarningOpen(false);
        }}
      />

      {paymentOpen && (
        <ReservationPaymentDrawer
          reservation={reservation}
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          mutations={mutations}
        />
      )}
    </GlassCard>
  );
}
