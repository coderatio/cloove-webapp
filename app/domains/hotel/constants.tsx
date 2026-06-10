import { type IconSvgElement } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon as CheckmarkCircle,
  LoginCircleIcon as LoginCircle,
  LogoutCircleIcon as LogoutCircle,
  CancelCircleIcon as CancelCircle,
  Time04Icon as Hourglass,
  Clock01Icon as Clock,
  CheckmarkBadge01Icon as CheckmarkBadge,
  UserMultiple02Icon as Users,
  WrenchIcon as Wrench,
  CleaningBucketIcon as CleaningBucket,
  SparklesIcon as Sparkles,
  WashingMachineIcon as WashingMachine,
  FlowerIcon as Flower,
  TaxiIcon as Taxi,
  HelpCircleIcon as HelpCircle,
} from "@hugeicons/core-free-icons";
import type { DotBadgeTone } from "@/app/components/ui/dot-badge";
import type {
  HotelReservationStatus,
  HotelServiceRequestStatus,
  HotelRoom,
} from "./types";

export interface StatusMeta {
  label: string;
  tone: DotBadgeTone;
  icon: IconSvgElement;
}

/** Maps a DotBadge tone to matching text/surface classes for tiles & columns. */
export const TONE_SURFACE: Record<
  DotBadgeTone,
  { accent: string; bg: string }
> = {
  success: {
    accent: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  warning: {
    accent: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
  },
  danger: { accent: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10" },
  info: { accent: "text-sky-600 dark:text-sky-400", bg: "bg-sky-500/10" },
  neutral: {
    accent: "text-brand-accent/70 dark:text-brand-cream/60",
    bg: "bg-brand-accent/8 dark:bg-white/8",
  },
};

export const RESERVATION_STATUS_CONFIG: Record<
  HotelReservationStatus,
  StatusMeta
> = {
  pending_payment: { label: "Awaiting payment", tone: "warning", icon: Clock },
  confirmed: { label: "Confirmed", tone: "info", icon: CheckmarkCircle },
  checked_in: { label: "Checked in", tone: "success", icon: LoginCircle },
  checked_out: { label: "Checked out", tone: "neutral", icon: LogoutCircle },
  cancelled: { label: "Cancelled", tone: "danger", icon: CancelCircle },
  no_show: { label: "No show", tone: "warning", icon: Hourglass },
};

export const REQUEST_STATUS_CONFIG: Record<
  HotelServiceRequestStatus,
  StatusMeta
> = {
  new: { label: "New", tone: "warning", icon: Clock },
  acknowledged: { label: "Acknowledged", tone: "info", icon: CheckmarkBadge },
  in_progress: { label: "In progress", tone: "info", icon: Hourglass },
  completed: { label: "Completed", tone: "success", icon: CheckmarkCircle },
  cancelled: { label: "Cancelled", tone: "neutral", icon: CancelCircle },
};

/** Statuses that form the request board columns, in advance order. */
export const REQUEST_FLOW: HotelServiceRequestStatus[] = [
  "new",
  "acknowledged",
  "in_progress",
  "completed",
];

export const ROOM_STATUS_CONFIG: Record<HotelRoom["status"], StatusMeta> = {
  available: { label: "Available", tone: "success", icon: CheckmarkCircle },
  occupied: { label: "Occupied", tone: "warning", icon: Users },
  out_of_service: { label: "Out of service", tone: "danger", icon: Wrench },
};

export interface CategoryMeta {
  label: string;
  icon: IconSvgElement;
}

export const REQUEST_CATEGORY_META: Record<string, CategoryMeta> = {
  housekeeping: { label: "Housekeeping", icon: CleaningBucket },
  towels: { label: "Towels", icon: Sparkles },
  laundry: { label: "Laundry", icon: WashingMachine },
  spa: { label: "Spa", icon: Flower },
  airport_pickup: { label: "Airport pickup", icon: Taxi },
  maintenance: { label: "Maintenance", icon: Wrench },
  other: { label: "Other", icon: HelpCircle },
};

export function categoryMeta(category: string): CategoryMeta {
  return (
    REQUEST_CATEGORY_META[category] ?? { label: category, icon: HelpCircle }
  );
}

/** Compact elapsed-time label (e.g. "4m", "2h 10m") from an ISO timestamp. */
export function formatElapsed(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${Math.max(diff, 0)}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  const hours = Math.floor(diff / 3600);
  return `${hours}h ${Math.floor((diff % 3600) / 60)}m`;
}
