"use client"

import * as React from "react"
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerStickyHeader,
  DrawerTitle,
} from "@/app/components/ui/drawer"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Input } from "@/app/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select"
import { formatCurrency } from "@/app/lib/formatters"
import { Order } from "@/app/domains/orders/types"
import { type KitchenTicket } from "@/app/domains/restaurant/hooks/useRestaurantOps"
import { ExternalLink, Store, UtensilsCrossed } from "lucide-react"

const KITCHEN_INITIAL_STATUS_OPTIONS: Array<{ value: KitchenTicket["status"]; label: string }> = [
  { value: "queued", label: "Queued" },
  { value: "preparing", label: "Preparing" },
  { value: "ready", label: "Ready" },
  { value: "served", label: "Served" },
]

const KITCHEN_STATION_OPTIONS = [
  { value: "kitchen", label: "Kitchen" },
  { value: "grill", label: "Grill" },
  { value: "pastry", label: "Pastry" },
  { value: "pickup", label: "Pickup" },
  { value: "custom", label: "Enter manually" },
] as const

interface GlobalOrderPreviewDrawerProps {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onViewOrders: () => void
  isRestaurantPreset: boolean
  allowSendToKitchen?: boolean
  isSendingToKitchen: boolean
  onSendToKitchen: (input: { station: string; status: KitchenTicket["status"] }) => Promise<void>
}

export function GlobalOrderPreviewDrawer({
  order,
  open,
  onOpenChange,
  onViewOrders,
  isRestaurantPreset,
  allowSendToKitchen = true,
  isSendingToKitchen,
  onSendToKitchen,
}: GlobalOrderPreviewDrawerProps) {
  const [stationMode, setStationMode] = React.useState("kitchen")
  const [station, setStation] = React.useState("kitchen")
  const [initialStatus, setInitialStatus] = React.useState<KitchenTicket["status"]>("queued")

  React.useEffect(() => {
    if (!order) return
    setStationMode("kitchen")
    setStation("kitchen")
    setInitialStatus(order.status === "COMPLETED" ? "preparing" : "queued")
  }, [order])

  if (!order) return null

  const currency = order.currency ?? "NGN"
  const topItems = order.items?.slice(0, 4) ?? []
  const remainingItems = Math.max(0, (order.items?.length ?? 0) - topItems.length)
  const canSendToKitchen = isRestaurantPreset && allowSendToKitchen && !order.kitchenTicketId

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-w-xl">
        <DrawerStickyHeader>
          <DrawerTitle>
            New order{order.shortCode ? ` #${order.shortCode}` : ""}
          </DrawerTitle>
          <DrawerDescription>
            Preview the order here, then open Orders only if you need the full workflow.
          </DrawerDescription>
        </DrawerStickyHeader>

        <DrawerBody className="space-y-5 pt-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/40">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
                  {order.customer || "Walk-in customer"}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Badge variant="secondary" className="rounded-full">
                    {order.channel ?? "Order"}
                  </Badge>
                  {order.serviceMode ? (
                    <Badge variant="outline" className="rounded-full">
                      {order.serviceMode.replace("_", " ")}
                    </Badge>
                  ) : null}
                  {order.tableLabel ? (
                    <Badge variant="outline" className="rounded-full">
                      Table {order.tableLabel}
                    </Badge>
                  ) : null}
                  {order.kitchenTicketStatus ? (
                    <Badge variant="outline" className="rounded-full">
                      Kitchen: {order.kitchenTicketStatus}
                    </Badge>
                  ) : null}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Total</p>
                <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">
                  {formatCurrency(Number(order.totalAmount || 0), { currency })}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <Store className="h-4 w-4" />
              Order items
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800">
              {topItems.map((item, index) => (
                <div
                  key={`${item.productName}-${index}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm not-last:border-b not-last:border-slate-200 dark:not-last:border-slate-800"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                      {item.productName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {item.quantity} x {formatCurrency(Number(item.price || 0), { currency })}
                    </p>
                  </div>
                  <p className="shrink-0 font-medium text-slate-900 dark:text-slate-100">
                    {formatCurrency(Number(item.total || 0), { currency })}
                  </p>
                </div>
              ))}
              {remainingItems > 0 ? (
                <div className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                  + {remainingItems} more item{remainingItems === 1 ? "" : "s"}
                </div>
              ) : null}
            </div>
          </div>

          {order.notes ? (
            <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
              <p className="mb-1 text-xs uppercase tracking-[0.18em] text-slate-400">Notes</p>
              {order.notes}
            </div>
          ) : null}

          {canSendToKitchen ? (
            <div className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
              <div className="flex items-center gap-2 text-sm font-medium text-amber-900 dark:text-amber-200">
                <UtensilsCrossed className="h-4 w-4" />
                Send to kitchen from here
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700/80 dark:text-amber-200/70">
                    Station
                  </label>
                  <Select
                    value={stationMode}
                    onValueChange={(value) => {
                      setStationMode(value)
                      if (value !== "custom") setStation(value)
                    }}
                  >
                    <SelectTrigger className="rounded-2xl bg-white dark:bg-slate-950/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {KITCHEN_STATION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700/80 dark:text-amber-200/70">
                    Initial stage
                  </label>
                  <Select
                    value={initialStatus}
                    onValueChange={(value) => setInitialStatus(value as KitchenTicket["status"])}
                  >
                    <SelectTrigger className="rounded-2xl bg-white dark:bg-slate-950/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {KITCHEN_INITIAL_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {stationMode === "custom" ? (
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700/80 dark:text-amber-200/70">
                    Station name
                  </label>
                  <Input
                    value={station}
                    onChange={(event) => setStation(event.target.value)}
                    placeholder="Enter station name"
                    className="rounded-2xl bg-white dark:bg-slate-950/60"
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </DrawerBody>

        <DrawerFooter className="flex-row flex-wrap justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={onViewOrders} className="rounded-full">
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Orders
            </Button>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {canSendToKitchen ? (
              <Button
                onClick={() => void onSendToKitchen({ station: station.trim(), status: initialStatus })}
                disabled={!station.trim() || isSendingToKitchen}
                className="rounded-full"
              >
                <UtensilsCrossed className="mr-2 h-4 w-4" />
                {isSendingToKitchen ? "Sending..." : "Send to kitchen"}
              </Button>
            ) : null}
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
