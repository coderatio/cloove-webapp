"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useBusiness } from "@/app/components/BusinessProvider"
import { formatCurrency } from "@/app/lib/formatters"
import { useOrders } from "@/app/domains/orders/hooks/useOrders"
import { Order } from "@/app/domains/orders/types"
import {
  useKitchenTicketActions,
  type KitchenTicket,
} from "@/app/domains/restaurant/hooks/useRestaurantOps"
import { useGoSettings } from "@/app/domains/messaging/hooks/useWhatsAppSettings"
import { playRestaurantNewOrderSound } from "@/app/domains/restaurant/lib/new-order-sound"
import { GlobalOrderPreviewDrawer } from "@/app/domains/orders/components/GlobalOrderPreviewDrawer"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { BellRing, ChevronRight, ShoppingBag, UtensilsCrossed, X } from "lucide-react"
import { cn } from "@/app/lib/utils"

const CHANNEL_NAME = "cloove-global-order-alerts"
const GLOBAL_NEW_ORDERS_TOAST_ID = "cloove-global-new-orders-toast"

function isIncomingCustomerOrder(order: Order): boolean {
  return order.isAutomated === true || order.channel === "STOREFRONT" || order.channel === "WHATSAPP"
}

function orderAlertKey(businessId: string, orderId: string) {
  return `${businessId}:${orderId}`
}

export function GlobalOrderAlertProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { activeBusiness } = useBusiness()
  const businessId = activeBusiness?.id ?? null
  const isRestaurantPreset = activeBusiness?.layoutPreset === "restaurant"
  const { data: goSettings } = useGoSettings()
  const sound = goSettings?.order_notifications?.restaurant.new_order_sound ?? "chime"
  const { orders = [] } = useOrders(1, 10, { automation: ["AUTOMATED"] })
  const kitchenAction = useKitchenTicketActions()

  const [previewOrderId, setPreviewOrderId] = React.useState<string | null>(null)
  const [queuedOrders, setQueuedOrders] = React.useState<Order[]>([])
  const [sendingToastOrderId, setSendingToastOrderId] = React.useState<string | null>(null)
  const seenByBusinessRef = React.useRef<Record<string, Set<string>>>({})
  const announcedKeysRef = React.useRef<Set<string>>(new Set())
  const broadcastRef = React.useRef<BroadcastChannel | null>(null)

  React.useEffect(() => {
    if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return
    const channel = new BroadcastChannel(CHANNEL_NAME)
    broadcastRef.current = channel
    channel.onmessage = (event) => {
      const key = String((event.data as { key?: string } | null)?.key ?? "")
      if (key) announcedKeysRef.current.add(key)
    }
    return () => {
      channel.close()
      broadcastRef.current = null
    }
  }, [])

  const announceOrder = React.useCallback((key: string) => {
    announcedKeysRef.current.add(key)
    broadcastRef.current?.postMessage({ key })
  }, [])

  const previewOrder = React.useMemo(
    () => orders.find((order) => order.id === previewOrderId) ?? null,
    [orders, previewOrderId]
  )

  const openPreview = React.useCallback((order: Order) => {
    setPreviewOrderId(order.id)
  }, [])

  const removeQueuedOrder = React.useCallback((orderId: string) => {
    setQueuedOrders((current) => current.filter((order) => order.id !== orderId))
  }, [])

  const clearQueuedOrders = React.useCallback(() => {
    setQueuedOrders([])
  }, [])

  const handleViewOrders = React.useCallback(() => {
    setPreviewOrderId(null)
    router.push("/orders")
  }, [router])

  const sendOrderToKitchen = React.useCallback(
    async (
      order: Order,
      {
        station,
        status,
        onSuccess,
      }: {
        station: string
        status: KitchenTicket["status"]
        onSuccess?: () => void
      }
    ) => {
      if (order.kitchenTicketId) {
        toast.message("This order is already in the kitchen flow.")
        return
      }

      try {
        const result = await kitchenAction.create.mutateAsync({
          saleId: order.id,
          station,
          status,
        })

        const notification = result?.notification
        if (notification?.status === "sent") {
          toast.success(
            `Sent to kitchen. WhatsApp sent${notification.customerName ? ` to ${notification.customerName}` : ""}.`
          )
        } else if (notification?.status === "failed") {
          toast.error("Sent to kitchen, but WhatsApp failed.")
        } else if (notification?.reason && notification.reason !== "auto_send_disabled") {
          toast.message("Sent to kitchen. WhatsApp not sent.")
        } else {
          toast.success("Sent to kitchen.")
        }

        onSuccess?.()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not send order to kitchen.")
      }
    },
    [kitchenAction.create]
  )

  const handleSendToKitchen = React.useCallback(
    async ({ station, status }: { station: string; status: KitchenTicket["status"] }) => {
      if (!previewOrder) return

      await sendOrderToKitchen(previewOrder, {
        station,
        status,
        onSuccess: () => setPreviewOrderId(null),
      })
    },
    [previewOrder, sendOrderToKitchen]
  )

  React.useEffect(() => {
    if (!businessId) return
    if (!seenByBusinessRef.current[businessId]) {
      seenByBusinessRef.current[businessId] = new Set<string>()
    }
  }, [businessId])

  React.useEffect(() => {
    clearQueuedOrders()
    setSendingToastOrderId(null)
    toast.dismiss(GLOBAL_NEW_ORDERS_TOAST_ID)
  }, [businessId, clearQueuedOrders])

  React.useEffect(() => {
    if (!businessId) return

    const incomingOrders = orders.filter(isIncomingCustomerOrder)
    if (incomingOrders.length === 0) return

    const seen = seenByBusinessRef.current[businessId] ?? new Set<string>()
    if (seen.size === 0) {
      incomingOrders.forEach((order) => seen.add(order.id))
      seenByBusinessRef.current[businessId] = seen
      return
    }

    const unseenIncoming = incomingOrders.filter((order) => !seen.has(order.id))
    if (unseenIncoming.length === 0) {
      incomingOrders.forEach((order) => seen.add(order.id))
      return
    }

    const nextOrders: Order[] = []
    unseenIncoming.forEach((order) => {
      const key = orderAlertKey(businessId, order.id)
      seen.add(order.id)
      if (announcedKeysRef.current.has(key)) return

      announceOrder(key)
      nextOrders.push(order)
    })

    if (nextOrders.length > 0) {
      setQueuedOrders((current) => {
        const knownIds = new Set(current.map((order) => order.id))
        return [...current, ...nextOrders.filter((order) => !knownIds.has(order.id))]
      })
      if (isRestaurantPreset) {
        playRestaurantNewOrderSound(sound)
      }
    }
  }, [announceOrder, businessId, isRestaurantPreset, orders, sound])

  const visibleQueuedOrders = React.useMemo(() => {
    return queuedOrders
      .map((queuedOrder) => orders.find((order) => order.id === queuedOrder.id) ?? queuedOrder)
      .filter((order) => {
        if (order.id === previewOrderId) return false
        return isIncomingCustomerOrder(order)
      })
  }, [orders, previewOrderId, queuedOrders])

  React.useEffect(() => {
    if (visibleQueuedOrders.length === 0) {
      toast.dismiss(GLOBAL_NEW_ORDERS_TOAST_ID)
      return
    }

    const displayedOrders = visibleQueuedOrders.slice(0, 2)
    const remainingCount = Math.max(0, visibleQueuedOrders.length - displayedOrders.length)

    toast.custom(
      () => (
        <div
          className={cn(
            "relative w-[min(94vw,34rem)] overflow-hidden rounded-[26px] border border-slate-200/80 bg-white/95 p-4 shadow-[0_24px_70px_-28px_rgba(15,23,42,0.28)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/92",
            "before:absolute before:inset-y-0 before:left-0 before:w-1.5 before:bg-emerald-500"
          )}
        >
          <button
            type="button"
            aria-label="Dismiss new order alerts"
            onClick={clearQueuedOrders}
            className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="pr-10">
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              <BellRing className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300" />
              <span>New orders</span>
              <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[11px]">
                {visibleQueuedOrders.length}
              </Badge>
            </div>

            <div className="mt-3 space-y-3">
              {displayedOrders.map((order) => {
                const total = formatCurrency(Number(order.totalAmount || 0), {
                  currency: order.currency ?? activeBusiness?.currency ?? "NGN",
                })
                const leadItem = order.items?.[0]
                const extraItems = Math.max(0, (order.items?.length ?? 0) - 1)
                const description = [
                  order.customer || "Walk-in customer",
                  total,
                  leadItem?.productName
                    ? `${leadItem.productName}${extraItems > 0 ? ` + ${extraItems} more` : ""}`
                    : order.summary || "Open preview for details",
                ]
                  .filter(Boolean)
                  .join(" • ")

                return (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-slate-900/70"
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative h-[68px] w-[68px] shrink-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 dark:border-white/10 dark:bg-slate-900">
                        {leadItem?.imageUrl ? (
                          <Image
                            src={leadItem.imageUrl}
                            alt={leadItem.productName || "Order item"}
                            fill
                            sizes="68px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-emerald-600 dark:text-emerald-300">
                            <ShoppingBag className="h-5 w-5" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                            Order{order.shortCode ? ` #${order.shortCode}` : ""}
                          </p>
                          {order.serviceMode ? (
                            <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-[11px]">
                              {order.serviceMode.replace("_", " ")}
                            </Badge>
                          ) : null}
                        </div>

                        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {description}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            className="h-9 rounded-full bg-emerald-600 px-4 text-white hover:bg-emerald-700"
                            onClick={() => {
                              removeQueuedOrder(order.id)
                              openPreview(order)
                            }}
                          >
                            Preview
                            <ChevronRight className="ml-1.5 h-4 w-4" />
                          </Button>
                          {isRestaurantPreset && !order.kitchenTicketId ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={sendingToastOrderId === order.id}
                              className="h-9 rounded-full border-slate-200 px-4 dark:border-white/10"
                              onClick={() => {
                                setSendingToastOrderId(order.id)
                                void sendOrderToKitchen(order, {
                                  station: "kitchen",
                                  status: "queued",
                                  onSuccess: () => {
                                    setSendingToastOrderId((current) =>
                                      current === order.id ? null : current
                                    )
                                    removeQueuedOrder(order.id)
                                  },
                                })
                                  .finally(() => {
                                    setSendingToastOrderId((current) =>
                                      current === order.id ? null : current
                                    )
                                  })
                              }}
                            >
                              <UtensilsCrossed className="mr-1.5 h-4 w-4" />
                              {sendingToastOrderId === order.id ? "Sending..." : "Send to kitchen"}
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {remainingCount > 0 ? (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                +{remainingCount} more order{remainingCount === 1 ? "" : "s"} waiting
              </p>
            ) : null}
          </div>
        </div>
      ),
      {
        id: GLOBAL_NEW_ORDERS_TOAST_ID,
        duration: Infinity,
        position: "top-center",
      }
    )
  }, [
    activeBusiness?.currency,
    clearQueuedOrders,
    isRestaurantPreset,
    openPreview,
    removeQueuedOrder,
    sendingToastOrderId,
    sendOrderToKitchen,
    visibleQueuedOrders,
  ])

  return (
    <>
      {children}
      <GlobalOrderPreviewDrawer
        order={previewOrder}
        open={!!previewOrderId}
        onOpenChange={(open) => !open && setPreviewOrderId(null)}
        onViewOrders={handleViewOrders}
        isRestaurantPreset={isRestaurantPreset}
        isSendingToKitchen={kitchenAction.create.isPending}
        onSendToKitchen={handleSendToKitchen}
      />
    </>
  )
}
