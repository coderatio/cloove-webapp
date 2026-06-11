"use client";

import type { ReactNode } from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { Alert02Icon as AlertIcon } from "@hugeicons/core-free-icons";
import { GlassCard } from "@/app/components/ui/glass-card";

/**
 * Shared loading / error / empty wrapper for hotel sections so every surface
 * renders consistent, on-brand states instead of silently showing nothing.
 */
export function HotelListState({
  isLoading,
  isError,
  error,
  isEmpty,
  emptyLabel,
  emptyHint,
  emptyIcon,
  emptyAction,
  skeletonCount = 3,
  children,
}: {
  isLoading: boolean;
  isError?: boolean;
  error?: { message?: string } | null;
  isEmpty: boolean;
  emptyLabel: string;
  emptyHint?: string;
  emptyIcon?: IconSvgElement;
  emptyAction?: ReactNode;
  skeletonCount?: number;
  children: ReactNode;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <div
            key={index}
            className="h-40 animate-pulse rounded-3xl bg-brand-accent/5 dark:bg-white/5"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <GlassCard className="flex flex-col items-center gap-2 p-12 text-center">
        <HugeiconsIcon
          icon={AlertIcon}
          className="h-8 w-8 text-rose-400/70 dark:text-rose-400/60"
        />
        <p className="text-sm text-rose-600 dark:text-rose-400">
          {error?.message ?? "Something went wrong. Please try again."}
        </p>
      </GlassCard>
    );
  }

  if (isEmpty) {
    return (
      <GlassCard className="flex flex-col items-center gap-3 p-12 text-center">
        {emptyIcon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gold/10 text-brand-gold">
            <HugeiconsIcon icon={emptyIcon} className="h-6 w-6" />
          </div>
        )}
        <div className="space-y-1">
          <h3 className="font-serif text-xl text-brand-deep dark:text-brand-cream">
            {emptyLabel}
          </h3>
          {emptyHint && (
            <p className="mx-auto max-w-sm text-sm text-brand-accent/60 dark:text-brand-cream/60">
              {emptyHint}
            </p>
          )}
        </div>
        {emptyAction}
      </GlassCard>
    );
  }

  return <>{children}</>;
}
