"use client";

import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SparklesIcon as Sparkles,
  Loading03Icon as Loader,
  CheckmarkCircle02Icon as Check,
  Delete02Icon as Trash,
  ArrowLeft01Icon as ArrowLeft,
  Building02Icon as Building,
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
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { FileDropZone } from "@/app/components/ui/file-drop-zone";
import { DotBadge } from "@/app/components/ui/dot-badge";
import { useStores } from "@/app/domains/stores/providers/StoreProvider";
import { RESERVATION_STATUS_CONFIG } from "../../constants";
import { useHotelImport } from "../../hooks/useHotelImport";
import type { HotelReservationStatus } from "../../types";

type Step = "upload" | "extracting" | "review" | "done";

interface Row {
  key: string;
  guestName: string;
  guestPhone: string;
  roomTypeName: string;
  checkInDate: string;
  checkOutDate: string;
  status: HotelReservationStatus;
}

const STATUS_KEYS = Object.keys(RESERVATION_STATUS_CONFIG) as HotelReservationStatus[];

let counter = 0;
const nextKey = () => `res-${counter++}`;

function normalizeStatus(raw: string | null): HotelReservationStatus {
  const value = (raw ?? "").toLowerCase().replace(/[^a-z]/g, "");
  if (["checkedin", "inhouse", "arrived", "staying"].includes(value)) return "checked_in";
  if (["checkedout", "departed", "completed", "done"].includes(value)) return "checked_out";
  if (["cancelled", "canceled", "void"].includes(value)) return "cancelled";
  if (value === "noshow") return "no_show";
  return "confirmed";
}

export function ReservationImportDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { stores, currentStore } = useStores();
  const { extractReservations, bulkImportReservations } = useHotelImport();
  const [step, setStep] = useState<Step>("upload");
  const [storeId, setStoreId] = useState(currentStore?.id ?? stores[0]?.id ?? "");
  const [rows, setRows] = useState<Row[]>([]);
  const [summary, setSummary] = useState<{
    created: number;
    failed: number;
    guestsCreated: number;
    warnings: number;
  } | null>(null);

  const rowError = (row: Row) => {
    if (!row.guestName.trim()) return "Needs a guest";
    if (!row.checkInDate || !row.checkOutDate) return "Needs dates";
    if (row.checkOutDate <= row.checkInDate) return "Check-out must be after check-in";
    return null;
  };

  const hasErrors = useMemo(() => rows.some((r) => rowError(r)), [rows]);

  async function handleFile(file: File) {
    setStep("extracting");
    try {
      const data = await extractReservations.mutateAsync(file);
      setRows(
        data.reservations.map((r) => ({
          key: nextKey(),
          guestName: r.guestName,
          guestPhone: r.guestPhone ?? "",
          roomTypeName: r.roomTypeName ?? "",
          checkInDate: r.checkInDate ?? "",
          checkOutDate: r.checkOutDate ?? "",
          status: normalizeStatus(r.status),
        })),
      );
      setStep("review");
    } catch {
      setStep("upload");
    }
  }

  async function confirm() {
    const result = await bulkImportReservations.mutateAsync({
      storeId,
      reservations: rows.map((r) => ({
        guestName: r.guestName.trim(),
        guestPhone: r.guestPhone.trim() || null,
        roomTypeName: r.roomTypeName.trim() || null,
        checkInDate: r.checkInDate,
        checkOutDate: r.checkOutDate,
        status: r.status,
      })),
    });
    setSummary({
      created: result.created,
      failed: result.failed,
      guestsCreated: result.guestsCreated,
      warnings: result.warnings.length,
    });
    setStep("done");
  }

  function reset() {
    setStep("upload");
    setRows([]);
    setSummary(null);
  }

  const update = (key: string, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DrawerContent className="max-h-[92vh] max-w-3xl">
        <DrawerStickyHeader>
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gold/10 text-brand-gold">
              <HugeiconsIcon icon={Sparkles} className="h-4 w-4" />
            </div>
            <DrawerTitle className="font-serif text-2xl text-brand-deep dark:text-brand-cream">
              Bring your reservations in
            </DrawerTitle>
          </div>
          <DrawerDescription>
            Upload your current bookings so arrivals and in-house guests carry over. We&apos;ll match
            or create each guest for you.
          </DrawerDescription>
        </DrawerStickyHeader>

        <DrawerBody className="space-y-6 pt-5">
          {step === "upload" && (
            <div className="mx-auto max-w-xl space-y-4">
              {stores.length > 1 && (
                <div className="space-y-2">
                  <Label>Property</Label>
                  <Select value={storeId} onValueChange={setStoreId}>
                    <SelectTrigger className="h-11 rounded-2xl">
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={Building} className="h-4 w-4 text-brand-accent/50" />
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
              )}
              <FileDropZone onFileSelect={handleFile} />
              <p className="text-center text-xs text-brand-accent/50 dark:text-brand-cream/40">
                Works with CSV, Excel, PDF, or a photo. Add your rooms first so bookings match a
                room type.
              </p>
            </div>
          )}

          {step === "extracting" && (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <HugeiconsIcon icon={Loader} className="h-10 w-10 animate-spin text-brand-gold" />
              <p className="text-sm text-brand-accent/60 dark:text-brand-cream/50">
                Reading your file…
              </p>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-3">
              <p className="text-sm text-brand-accent/70 dark:text-brand-cream/60">
                Check the {rows.length} booking{rows.length === 1 ? "" : "s"} below. Fix anything
                flagged, then import.
              </p>
              {rows.map((row) => {
                const error = rowError(row);
                return (
                  <div
                    key={row.key}
                    className="space-y-2 rounded-2xl border border-brand-deep/8 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <Input
                        value={row.guestName}
                        placeholder="Guest name"
                        onChange={(e) => update(row.key, { guestName: e.target.value })}
                      />
                      <Input
                        value={row.guestPhone}
                        placeholder="Phone"
                        onChange={(e) => update(row.key, { guestPhone: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                      <Input
                        value={row.roomTypeName}
                        placeholder="Room type"
                        onChange={(e) => update(row.key, { roomTypeName: e.target.value })}
                      />
                      <Input
                        type="date"
                        value={row.checkInDate}
                        onChange={(e) => update(row.key, { checkInDate: e.target.value })}
                      />
                      <Input
                        type="date"
                        value={row.checkOutDate}
                        onChange={(e) => update(row.key, { checkOutDate: e.target.value })}
                      />
                      <Select
                        value={row.status}
                        onValueChange={(value) =>
                          update(row.key, { status: value as HotelReservationStatus })
                        }
                      >
                        <SelectTrigger className="h-[46px] rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_KEYS.map((key) => (
                            <SelectItem key={key} value={key}>
                              {RESERVATION_STATUS_CONFIG[key].label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      {error ? (
                        <DotBadge tone="danger">{error}</DotBadge>
                      ) : (
                        <DotBadge tone="success">Looks good</DotBadge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-xl text-brand-accent/40 hover:text-rose-500"
                        onClick={() => setRows((p) => p.filter((r) => r.key !== row.key))}
                      >
                        <HugeiconsIcon icon={Trash} className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {step === "done" && summary && (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
                <HugeiconsIcon icon={Check} className="h-8 w-8" />
              </div>
              <p className="font-serif text-xl text-brand-deep dark:text-brand-cream">
                Imported {summary.created} reservation{summary.created === 1 ? "" : "s"}
              </p>
              <p className="max-w-sm text-sm text-brand-accent/60 dark:text-brand-cream/50">
                {summary.guestsCreated > 0
                  ? `${summary.guestsCreated} new guest${summary.guestsCreated === 1 ? "" : "s"} added. `
                  : ""}
                {summary.warnings > 0
                  ? `${summary.warnings} need a quick look (check the reservation list).`
                  : "Everything looks good."}
                {summary.failed > 0 ? ` ${summary.failed} could not be imported.` : ""}
              </p>
              <Button className="h-11 rounded-full px-6" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </div>
          )}
        </DrawerBody>

        {step === "review" && (
          <DrawerFooter className="gap-2 sm:flex-row sm:items-center">
            <Button variant="ghost" className="h-11 w-full rounded-2xl sm:w-auto" onClick={reset}>
              <HugeiconsIcon icon={ArrowLeft} className="mr-1.5 h-4 w-4" />
              Start over
            </Button>
            <Button
              className="h-11 w-full rounded-2xl font-semibold sm:flex-1"
              disabled={hasErrors || rows.length === 0 || !storeId || bulkImportReservations.isPending}
              onClick={confirm}
            >
              {bulkImportReservations.isPending
                ? "Importing…"
                : `Import ${rows.length} reservation${rows.length === 1 ? "" : "s"}`}
            </Button>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}
