"use client";

import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ChevronDownIcon as ChevronDown } from "@hugeicons/core-free-icons";
import { DotBadge } from "@/app/components/ui/dot-badge";
import { cn } from "@/app/lib/utils";
import { RequestCard } from "./RequestCard";
import { REQUEST_FLOW, REQUEST_STATUS_CONFIG } from "../../constants";
import type { useHotelMutations } from "../../hooks/useHotelMutations";
import type { HotelServiceRequest } from "../../types";

type HotelMutations = ReturnType<typeof useHotelMutations>;

export function RequestBoard({
  requests,
  mutations,
}: {
  requests: HotelServiceRequest[];
  mutations: HotelMutations;
}) {
  const [showCancelled, setShowCancelled] = useState(false);

  const byStatus = useMemo(() => {
    const map = new Map<HotelServiceRequest["status"], HotelServiceRequest[]>();
    for (const request of requests) {
      const bucket = map.get(request.status) ?? [];
      bucket.push(request);
      map.set(request.status, bucket);
    }
    return map;
  }, [requests]);

  const cancelled = byStatus.get("cancelled") ?? [];

  return (
    <div className="space-y-4">
      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-1 lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0">
        {REQUEST_FLOW.map((status) => {
          const meta = REQUEST_STATUS_CONFIG[status];
          const items = byStatus.get(status) ?? [];
          return (
            <section
              key={status}
              className="flex min-w-[260px] flex-col gap-3 rounded-3xl border border-brand-accent/8 bg-brand-accent/[0.03] p-3 dark:border-white/8 dark:bg-white/[0.02] lg:min-w-0"
            >
              <div className="flex items-center justify-between px-1">
                <DotBadge tone={meta.tone}>{meta.label}</DotBadge>
                <span className="text-xs font-semibold text-brand-accent/50 dark:text-brand-cream/40">
                  {items.length}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {items.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-brand-accent/15 px-3 py-6 text-center text-xs text-brand-accent/40 dark:border-white/10 dark:text-brand-cream/30">
                    Nothing here
                  </p>
                ) : (
                  items.map((request) => (
                    <RequestCard key={request.id} request={request} mutations={mutations} />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>

      {cancelled.length > 0 && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setShowCancelled((value) => !value)}
            className="flex items-center gap-2 text-sm font-medium text-brand-accent/60 hover:text-brand-deep dark:text-brand-cream/50"
          >
            <HugeiconsIcon
              icon={ChevronDown}
              className={cn("h-4 w-4 transition-transform", showCancelled && "rotate-180")}
            />
            Cancelled ({cancelled.length})
          </button>
          {showCancelled && (
            <div className="grid gap-3 opacity-70 md:grid-cols-2 xl:grid-cols-3">
              {cancelled.map((request) => (
                <RequestCard key={request.id} request={request} mutations={mutations} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
