"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  PencilEdit01Icon as Pencil,
  ArchiveIcon as Archive,
} from "@hugeicons/core-free-icons";
import { GlassCard } from "@/app/components/ui/glass-card";
import { Button } from "@/app/components/ui/button";
import { formatCurrency } from "@/app/lib/formatters";
import type { HotelRoomType } from "../../types";

function isCatalogReady(type: HotelRoomType) {
  return (
    type.catalogSyncEnabled &&
    type.isActive &&
    (type.rooms?.some((room) => room.status !== "out_of_service") ?? false) &&
    type.images?.some((image) => image.isPrimary && image.url.startsWith("https://"))
  );
}

export function RoomTypeCard({
  type,
  onEdit,
  onArchive,
}: {
  type: HotelRoomType;
  onEdit: (type: HotelRoomType) => void;
  onArchive: (type: HotelRoomType) => void;
}) {
  const ready = isCatalogReady(type);
  const roomCount = type.rooms?.length ?? 0;

  return (
    <GlassCard hoverEffect className="flex flex-col">
      {type.images?.[0]?.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={type.images[0].url}
          alt={type.images[0].alt ?? type.name}
          className="h-36 w-full object-cover"
        />
      ) : (
        <div className="h-36 w-full bg-brand-accent/5 dark:bg-white/5" />
      )}
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-serif text-lg text-brand-deep dark:text-brand-cream">
              {type.name}
            </h3>
            {type.description && (
              <p className="mt-1 line-clamp-2 text-sm text-brand-accent/70 dark:text-brand-cream/60">
                {type.description}
              </p>
            )}
          </div>
          <span
            className={
              type.isActive
                ? "shrink-0 rounded-full bg-brand-green/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-green"
                : "shrink-0 rounded-full bg-brand-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-accent/60"
            }
          >
            {type.isActive ? "Active" : "Hidden"}
          </span>
        </div>

        <dl className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <dt className="text-[10px] uppercase tracking-widest text-brand-accent/50 dark:text-brand-cream/40">
              Rate
            </dt>
            <dd className="font-medium text-brand-deep dark:text-brand-cream">
              {formatCurrency(type.baseNightlyRate, { currency: type.currency })}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-widest text-brand-accent/50 dark:text-brand-cream/40">
              Sleeps
            </dt>
            <dd className="font-medium text-brand-deep dark:text-brand-cream">
              {type.capacity}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-widest text-brand-accent/50 dark:text-brand-cream/40">
              Rooms
            </dt>
            <dd className="font-medium text-brand-deep dark:text-brand-cream">{roomCount}</dd>
          </div>
        </dl>

        {type.amenities.length > 0 && (
          <p className="line-clamp-1 text-xs text-brand-accent/60 dark:text-brand-cream/50">
            {type.amenities.join(" · ")}
          </p>
        )}

        <div className="mt-auto flex items-center justify-end gap-2 border-t border-brand-deep/5 pt-3 dark:border-white/5">
          <span
            className={`mr-auto text-xs ${ready ? "text-brand-green" : "text-brand-accent/50 dark:text-brand-cream/40"}`}
          >
            {ready ? "Shown on WhatsApp" : "Not on WhatsApp"}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(type)}
            className="text-brand-accent/70 hover:text-brand-deep dark:text-brand-cream/60"
          >
            <HugeiconsIcon icon={Pencil} className="mr-1 h-4 w-4" /> Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onArchive(type)}
            className="text-brand-accent/70 hover:text-rose-500 dark:text-brand-cream/60"
          >
            <HugeiconsIcon icon={Archive} className="mr-1 h-4 w-4" /> Archive
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}
