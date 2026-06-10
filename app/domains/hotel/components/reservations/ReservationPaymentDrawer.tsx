"use client";

import { useState } from "react";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerStickyHeader,
  DrawerTitle,
} from "@/app/components/ui/drawer";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { MoneyInput } from "@/app/components/ui/money-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { formatCurrency } from "@/app/lib/formatters";
import type { HotelReservation } from "../../types";
import type { useHotelMutations } from "../../hooks/useHotelMutations";
import { currencySymbol } from "@/app/lib/currencies";

type HotelMutations = ReturnType<typeof useHotelMutations>;

export function ReservationPaymentDrawer({
  reservation,
  open,
  onOpenChange,
  mutations,
}: {
  reservation: HotelReservation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mutations: HotelMutations;
}) {
  const balance = Number(reservation.balance ?? reservation.totalAmount);
  const [amount, setAmount] = useState(balance);
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "TRANSFER" | "POS"
  >("CASH");

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-w-lg">
        <DrawerStickyHeader>
          <DrawerTitle>Record reservation payment</DrawerTitle>
        </DrawerStickyHeader>
        <DrawerBody className="space-y-5">
          <div className="rounded-2xl border border-brand-deep/10 p-4 text-sm dark:border-white/10">
            <div className="flex justify-between">
              <span>Outstanding balance</span>
              <strong>
                {formatCurrency(balance, { currency: reservation.currency })}
              </strong>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Amount received</Label>
            <MoneyInput
              value={amount}
              onChange={setAmount}
              min={0}
              max={balance}
              currencySymbol={currencySymbol(reservation.currency)}
            />
          </div>
          <div className="space-y-2">
            <Label>Payment method</Label>
            <Select
              value={paymentMethod}
              onValueChange={(value) =>
                setPaymentMethod(value as "CASH" | "TRANSFER" | "POS")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="TRANSFER">Bank transfer</SelectItem>
                <SelectItem value="POS">POS</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </DrawerBody>
        <DrawerFooter>
          <Button
            disabled={
              amount <= 0 ||
              amount > balance ||
              mutations.recordPayment.isPending
            }
            onClick={async () => {
              await mutations.recordPayment.mutateAsync({
                id: reservation.id,
                amount,
                paymentMethod,
              });
              onOpenChange(false);
            }}
          >
            Record payment
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
