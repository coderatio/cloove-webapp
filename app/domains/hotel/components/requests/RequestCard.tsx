"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon as ArrowLeft,
  ArrowRight01Icon as ArrowRight,
  CheckmarkCircle02Icon as Check,
  Cancel01Icon as Cancel,
  Time04Icon as Clock,
} from "@hugeicons/core-free-icons";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils";
import {
  REQUEST_FLOW,
  REQUEST_STATUS_CONFIG,
  TONE_SURFACE,
  categoryMeta,
  formatElapsed,
} from "../../constants";
import type { useHotelMutations } from "../../hooks/useHotelMutations";
import type { HotelServiceRequest } from "../../types";

type HotelMutations = ReturnType<typeof useHotelMutations>;

export function RequestCard({
  request,
  mutations,
}: {
  request: HotelServiceRequest;
  mutations: HotelMutations;
}) {
  const meta = categoryMeta(request.category);
  const flowIndex = REQUEST_FLOW.indexOf(request.status);
  const prev = flowIndex > 0 ? REQUEST_FLOW[flowIndex - 1] : undefined;
  const next = flowIndex >= 0 ? REQUEST_FLOW[flowIndex + 1] : undefined;
  const isTerminal = request.status === "completed" || request.status === "cancelled";

  const setStatus = (status: HotelServiceRequest["status"]) =>
    mutations.updateRequest.mutate({ id: request.id, status });

  return (
    <div className="space-y-3 rounded-2xl border border-brand-deep/8 bg-white p-3.5 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-gold/10 text-brand-gold">
            <HugeiconsIcon icon={meta.icon} className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-sm text-brand-deep dark:text-brand-cream">
              {meta.label}
            </p>
            <p className="truncate text-xs text-brand-accent/60 dark:text-brand-cream/50">
              {request.customer?.name ?? "Guest"}
              {request.room?.number ? ` · Room ${request.room.number}` : ""}
            </p>
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-1 text-[10px] font-medium text-brand-accent/50 dark:text-brand-cream/40">
          <HugeiconsIcon icon={Clock} className="h-3 w-3" />
          {formatElapsed(request.createdAt)}
        </span>
      </div>

      {request.details && (
        <p className="line-clamp-2 text-xs text-brand-accent/70 dark:text-brand-cream/60">
          {request.details}
        </p>
      )}
      {request.service?.name && (
        <p className="text-xs font-medium text-brand-deep dark:text-brand-cream">
          {request.service.name}
        </p>
      )}

      {!isTerminal && (
        <div className="flex items-center gap-1.5">
          {prev && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0 rounded-xl border border-brand-accent/10 text-brand-accent/50 hover:text-brand-deep dark:border-white/10 dark:text-brand-cream/50"
              onClick={() => setStatus(prev)}
              disabled={mutations.updateRequest.isPending}
              title={`Back to ${REQUEST_STATUS_CONFIG[prev].label}`}
            >
              <HugeiconsIcon icon={ArrowLeft} className="h-3.5 w-3.5" />
            </Button>
          )}
          {next ? (
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                "h-8 flex-1 rounded-xl border text-[11px] font-bold uppercase tracking-wider",
                TONE_SURFACE[REQUEST_STATUS_CONFIG[next].tone].bg,
                TONE_SURFACE[REQUEST_STATUS_CONFIG[next].tone].accent,
                "border-transparent",
              )}
              onClick={() => setStatus(next)}
              disabled={mutations.updateRequest.isPending}
            >
              {REQUEST_STATUS_CONFIG[next].label}
              <HugeiconsIcon icon={ArrowRight} className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          ) : (
            <span className="flex flex-1 items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-accent/40 dark:text-brand-cream/30">
              <HugeiconsIcon icon={Check} className="h-3.5 w-3.5" />
              Done
            </span>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0 rounded-xl text-brand-accent/40 hover:text-rose-500 dark:text-brand-cream/40"
            onClick={() => setStatus("cancelled")}
            disabled={mutations.updateRequest.isPending}
            title="Cancel request"
          >
            <HugeiconsIcon icon={Cancel} className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
