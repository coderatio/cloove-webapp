"use client";

import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SparklesIcon as Sparkles,
  Loading03Icon as Loader,
  CheckmarkCircle02Icon as Check,
  Delete02Icon as Trash,
  ArrowLeft01Icon as ArrowLeft,
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
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { FileDropZone } from "@/app/components/ui/file-drop-zone";
import { DotBadge } from "@/app/components/ui/dot-badge";
import { useHotelImport } from "../../hooks/useHotelImport";

type Step = "upload" | "extracting" | "review" | "done";

interface TypeRow {
  key: string;
  name: string;
  nightlyRate: string;
  maxGuests: string;
  amenities: string;
}
interface RoomRow {
  key: string;
  number: string;
  roomTypeName: string;
}

let counter = 0;
const nextKey = () => `row-${counter++}`;

export function RoomImportDrawer({
  open,
  onOpenChange,
  storeId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
}) {
  const { extract, bulkImport } = useHotelImport();
  const [step, setStep] = useState<Step>("upload");
  const [types, setTypes] = useState<TypeRow[]>([]);
  const [rooms, setRooms] = useState<RoomRow[]>([]);

  const typeError = (row: TypeRow) =>
    !row.name.trim() ? "Needs a name" : !(Number(row.nightlyRate) > 0) ? "Needs a price" : null;
  const roomError = (row: RoomRow) => (!row.number.trim() ? "Needs a number" : null);

  const hasErrors = useMemo(
    () => types.some((t) => typeError(t)) || rooms.some((r) => roomError(r)),
    [types, rooms],
  );

  async function handleFile(file: File) {
    setStep("extracting");
    try {
      const data = await extract.mutateAsync(file);
      setTypes(
        data.roomTypes.map((t) => ({
          key: nextKey(),
          name: t.name,
          nightlyRate: t.nightlyRate ? String(t.nightlyRate) : "",
          maxGuests: t.maxGuests ? String(t.maxGuests) : "",
          amenities: t.amenities.join(", "),
        })),
      );
      setRooms(
        data.rooms.map((r) => ({
          key: nextKey(),
          number: r.number,
          roomTypeName: r.roomTypeName ?? "",
        })),
      );
      setStep("review");
    } catch {
      setStep("upload"); // toast handled by hook
    }
  }

  async function confirm() {
    const result = await bulkImport.mutateAsync({
      storeId,
      roomTypes: types.map((t) => ({
        name: t.name.trim(),
        nightlyRate: Number(t.nightlyRate),
        maxGuests: t.maxGuests ? Number(t.maxGuests) : null,
        amenities: t.amenities
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
      })),
      rooms: rooms.map((r) => ({
        number: r.number.trim(),
        roomTypeName: r.roomTypeName.trim() || null,
      })),
    });
    const created = (result.roomTypes?.created ?? 0) + (result.rooms?.created ?? 0);
    const failed = (result.roomTypes?.failed ?? 0) + (result.rooms?.failed ?? 0);
    setStep("done");
    return { created, failed };
  }

  function reset() {
    setStep("upload");
    setTypes([]);
    setRooms([]);
  }

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
              Bring your rooms in
            </DrawerTitle>
          </div>
          <DrawerDescription>
            Upload a room list from your old system (spreadsheet, PDF, or photo) and we&apos;ll read
            it for you to check.
          </DrawerDescription>
        </DrawerStickyHeader>

        <DrawerBody className="space-y-6 pt-5">
          {step === "upload" && (
            <div className="mx-auto max-w-xl space-y-3">
              <FileDropZone onFileSelect={handleFile} />
              <p className="text-center text-xs text-brand-accent/50 dark:text-brand-cream/40">
                Works with CSV, Excel, PDF, or a photo. No fixed format needed.
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
            <div className="space-y-6">
              <p className="text-sm text-brand-accent/70 dark:text-brand-cream/60">
                Check the details below and fix anything flagged before importing.
              </p>

              <section className="space-y-3">
                <h3 className="font-serif text-lg text-brand-deep dark:text-brand-cream">
                  Room types ({types.length})
                </h3>
                {types.length === 0 ? (
                  <p className="text-sm text-brand-accent/50 dark:text-brand-cream/40">
                    None found in this file.
                  </p>
                ) : (
                  types.map((row) => {
                    const error = typeError(row);
                    return (
                      <div
                        key={row.key}
                        className="grid grid-cols-1 gap-2 rounded-2xl border border-brand-deep/8 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5 sm:grid-cols-[1.4fr_0.8fr_0.7fr_1.4fr_auto]"
                      >
                        <Input
                          value={row.name}
                          placeholder="Name"
                          onChange={(e) =>
                            setTypes((p) =>
                              p.map((t) => (t.key === row.key ? { ...t, name: e.target.value } : t)),
                            )
                          }
                        />
                        <Input
                          type="number"
                          min="0"
                          value={row.nightlyRate}
                          placeholder="Rate"
                          onChange={(e) =>
                            setTypes((p) =>
                              p.map((t) =>
                                t.key === row.key ? { ...t, nightlyRate: e.target.value } : t,
                              ),
                            )
                          }
                        />
                        <Input
                          type="number"
                          min="1"
                          value={row.maxGuests}
                          placeholder="Guests"
                          onChange={(e) =>
                            setTypes((p) =>
                              p.map((t) =>
                                t.key === row.key ? { ...t, maxGuests: e.target.value } : t,
                              ),
                            )
                          }
                        />
                        <Input
                          value={row.amenities}
                          placeholder="What's included"
                          onChange={(e) =>
                            setTypes((p) =>
                              p.map((t) =>
                                t.key === row.key ? { ...t, amenities: e.target.value } : t,
                              ),
                            )
                          }
                        />
                        <div className="flex items-center justify-between gap-2 sm:justify-end">
                          {error ? (
                            <DotBadge tone="danger">{error}</DotBadge>
                          ) : (
                            <DotBadge tone="success">Looks good</DotBadge>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-xl text-brand-accent/40 hover:text-rose-500"
                            onClick={() => setTypes((p) => p.filter((t) => t.key !== row.key))}
                          >
                            <HugeiconsIcon icon={Trash} className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </section>

              <section className="space-y-3">
                <h3 className="font-serif text-lg text-brand-deep dark:text-brand-cream">
                  Rooms ({rooms.length})
                </h3>
                {rooms.length === 0 ? (
                  <p className="text-sm text-brand-accent/50 dark:text-brand-cream/40">
                    None found in this file.
                  </p>
                ) : (
                  rooms.map((row) => {
                    const error = roomError(row);
                    return (
                      <div
                        key={row.key}
                        className="grid grid-cols-1 gap-2 rounded-2xl border border-brand-deep/8 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5 sm:grid-cols-[1fr_1.4fr_auto]"
                      >
                        <Input
                          value={row.number}
                          placeholder="Room number"
                          onChange={(e) =>
                            setRooms((p) =>
                              p.map((r) =>
                                r.key === row.key ? { ...r, number: e.target.value } : r,
                              ),
                            )
                          }
                        />
                        <Input
                          value={row.roomTypeName}
                          placeholder="Room type"
                          onChange={(e) =>
                            setRooms((p) =>
                              p.map((r) =>
                                r.key === row.key ? { ...r, roomTypeName: e.target.value } : r,
                              ),
                            )
                          }
                        />
                        <div className="flex items-center justify-between gap-2 sm:justify-end">
                          {error ? (
                            <DotBadge tone="danger">{error}</DotBadge>
                          ) : (
                            <DotBadge tone="success">Looks good</DotBadge>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-xl text-brand-accent/40 hover:text-rose-500"
                            onClick={() => setRooms((p) => p.filter((r) => r.key !== row.key))}
                          >
                            <HugeiconsIcon icon={Trash} className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </section>
            </div>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
                <HugeiconsIcon icon={Check} className="h-8 w-8" />
              </div>
              <p className="font-serif text-xl text-brand-deep dark:text-brand-cream">
                Import complete
              </p>
              <p className="text-sm text-brand-accent/60 dark:text-brand-cream/50">
                Your rooms now appear on the Rooms screen.
              </p>
              <Button className="h-11 rounded-full px-6" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </div>
          )}
        </DrawerBody>

        {step === "review" && (
          <DrawerFooter className="gap-2 sm:flex-row sm:items-center">
            <Button
              variant="ghost"
              className="h-11 w-full rounded-2xl sm:w-auto"
              onClick={reset}
            >
              <HugeiconsIcon icon={ArrowLeft} className="mr-1.5 h-4 w-4" />
              Start over
            </Button>
            <Button
              className="h-11 w-full rounded-2xl font-semibold sm:flex-1"
              disabled={hasErrors || (types.length === 0 && rooms.length === 0) || bulkImport.isPending}
              onClick={confirm}
            >
              {bulkImport.isPending
                ? "Importing…"
                : `Import ${types.length} room type${types.length === 1 ? "" : "s"} and ${rooms.length} room${rooms.length === 1 ? "" : "s"}`}
            </Button>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}
