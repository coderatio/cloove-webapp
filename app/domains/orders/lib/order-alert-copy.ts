import {
  ConciergeBellIcon,
  HotelIcon,
  MortarboardIcon,
  ShoppingBag01Icon,
} from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"
import type { Order } from "@/app/domains/orders/types"
import type { LayoutPresetId } from "@/app/domains/workspace/nav/layout-presets"

/**
 * Preset-aware vocabulary for the global incoming-order alert toast and its
 * preview drawer. Incoming "orders" are a hotel booking, a hotel room-service
 * order, a school fee record, a restaurant food order, etc. depending on the
 * workspace preset (and, within a preset, on the order itself), so the shared
 * components read their nouns/links/icon from here instead of hardcoding store
 * terminology.
 *
 * Add a preset by giving it an entry in PRESET_OVERRIDES; anything omitted
 * falls back to the generic order vocabulary. Per-order distinctions (e.g. a
 * hotel stay booking vs. an in-stay room-service order) live in
 * resolveRecordCopy.
 */
export interface OrderAlertCopy {
  /** Toast header, e.g. "New orders" / "New bookings" */
  alertTitle: string
  /** Toast subtitle */
  alertDescription: string
  /** Capitalised singular record noun for row/drawer titles, e.g. "Order" / "Booking" */
  recordLabel: string
  /** Lowercase plural for inline counts, e.g. "orders" / "bookings" */
  recordPluralLower: string
  /** Drawer footer button label, e.g. "Open Orders" / "Open Reservations" */
  openLabel: string
  /** Route the footer button navigates to */
  openHref: string
  /** Heading above the line items in the preview drawer */
  itemsLabel: string
  /** Icon for the record thumbnail / empty-image fallback */
  icon: IconSvgElement
}

const GENERIC_ORDER_COPY: OrderAlertCopy = {
  alertTitle: "New orders",
  alertDescription: "Review recent incoming orders without leaving this page.",
  recordLabel: "Order",
  recordPluralLower: "orders",
  openLabel: "Open Orders",
  openHref: "/orders",
  itemsLabel: "Order items",
  icon: ShoppingBag01Icon,
}

/** Hotel in-stay service order (room service, amenities) — not a stay booking. */
const HOTEL_SERVICE_ORDER_COPY: OrderAlertCopy = {
  ...GENERIC_ORDER_COPY,
  alertTitle: "New room service orders",
  alertDescription: "Review recent guest service orders without leaving this page.",
  recordLabel: "Room service",
  recordPluralLower: "room service orders",
  openLabel: "Open Charges & orders",
  itemsLabel: "Order items",
  icon: ConciergeBellIcon,
}

const PRESET_OVERRIDES: Partial<Record<LayoutPresetId, Partial<OrderAlertCopy>>> = {
  hotel: {
    alertTitle: "New bookings",
    alertDescription: "Review recent bookings without leaving this page.",
    recordLabel: "Booking",
    recordPluralLower: "bookings",
    openLabel: "Open Reservations",
    openHref: "/hotel/reservations",
    itemsLabel: "Stay details",
    icon: HotelIcon,
  },
  school: {
    alertTitle: "New fee records",
    alertDescription: "Review recent fee records without leaving this page.",
    recordLabel: "Fee record",
    recordPluralLower: "fee records",
    openLabel: "Open Fees",
    itemsLabel: "Fee items",
    icon: MortarboardIcon,
  },
}

/** Preset-level (header) vocabulary, before any per-order distinction. */
export function getOrderAlertCopy(presetId: string | null | undefined): OrderAlertCopy {
  const override = presetId ? PRESET_OVERRIDES[presetId as LayoutPresetId] : undefined
  return override ? { ...GENERIC_ORDER_COPY, ...override } : GENERIC_ORDER_COPY
}

/**
 * Resolve the vocabulary for a specific record. Within the hotel preset a
 * room-service order is an in-stay order rather than a stay booking, so it
 * keeps order/room-service wording and links to Charges & orders instead of
 * Reservations. Every other case uses the preset default.
 */
export function resolveRecordCopy(
  presetId: string | null | undefined,
  order: Pick<Order, "serviceMode"> | null | undefined
): OrderAlertCopy {
  if (presetId === "hotel" && order?.serviceMode === "ROOM_SERVICE") {
    return HOTEL_SERVICE_ORDER_COPY
  }
  return getOrderAlertCopy(presetId)
}

/**
 * Header vocabulary for a batch of queued records: when they all resolve to the
 * same kind (all bookings, or all room-service orders) the header speaks to
 * that kind; a mixed batch falls back to the neutral generic header.
 */
export function getAggregateAlertCopy(
  presetId: string | null | undefined,
  orders: Array<Pick<Order, "serviceMode">>
): Pick<OrderAlertCopy, "alertTitle" | "alertDescription" | "recordLabel" | "recordPluralLower"> {
  const resolved = orders.map((order) => resolveRecordCopy(presetId, order))
  const first = resolved[0]
  const allSame = first != null && resolved.every((copy) => copy.alertTitle === first.alertTitle)
  const source = allSame ? first : GENERIC_ORDER_COPY
  return {
    alertTitle: source.alertTitle,
    alertDescription: source.alertDescription,
    recordLabel: source.recordLabel,
    recordPluralLower: source.recordPluralLower,
  }
}
