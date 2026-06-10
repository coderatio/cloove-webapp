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
import {
  playRestaurantNewOrderSound,
  preloadRestaurantNewOrderSound,
} from "@/app/domains/restaurant/lib/new-order-sound"
import { GlobalOrderPreviewDrawer } from "@/app/domains/orders/components/GlobalOrderPreviewDrawer"
import { getAggregateAlertCopy, resolveRecordCopy } from "@/app/domains/orders/lib/order-alert-copy"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { HugeiconsIcon } from "@hugeicons/react"
import { BellRingIcon as BellRing, ChevronRightIcon as ChevronRight, EyeIcon as Eye, FlaskConicalIcon as FlaskConical, Restaurant01Icon as UtensilsCrossed, Cancel01Icon as X } from "@hugeicons/core-free-icons"
import { cn } from "@/app/lib/utils"

const CHANNEL_NAME = "cloove-global-order-alerts"
const GLOBAL_NEW_ORDERS_TOAST_ID = "cloove-global-new-orders-toast"
const DEV_PREVIEW_ORDER_PREFIX = "__dev_preview__:"

function isIncomingCustomerOrder(order: Order): boolean {
  return order.isAutomated === true || order.channel === "STOREFRONT" || order.channel === "WHATSAPP"
}

function orderAlertKey(businessId: string, orderId: string) {
  return `${businessId}:${orderId}`
}

function isDevPreviewOrder(order: Pick<Order, "id"> | null | undefined) {
  return !!order?.id?.startsWith(DEV_PREVIEW_ORDER_PREFIX)
}

function buildDevPreviewOrders(currency: string): Order[] {
  const baseTime = Date.now()
  return [
    {
      id: `${DEV_PREVIEW_ORDER_PREFIX}${baseTime}-1`,
      shortCode: "DEV101",
      date: new Date(baseTime).toISOString(),
      summary: "BBQ Chicken Sliders + 1 more",
      items: [
        {
          productName: "BBQ Chicken Sliders",
          quantity: 1,
          price: 5580,
          total: 5580,
        },
        {
          productName: "Citrus Cola",
          quantity: 1,
          price: 1400,
          total: 1400,
        },
      ],
      totalAmount: 6980,
      currency,
      customer: "Josiah",
      amountPaid: 0,
      paymentMethod: "Bank transfer",
      status: "PENDING",
      channel: "WHATSAPP",
      notes: "Developer preview order.",
      isAutomated: true,
      serviceMode: "TAKEAWAY",
    },
    {
      id: `${DEV_PREVIEW_ORDER_PREFIX}${baseTime}-2`,
      shortCode: "DEV102",
      date: new Date(baseTime).toISOString(),
      summary: "Pepperoni Pizza + 2 more",
      items: [
        {
          productName: "Pepperoni Pizza",
          quantity: 1,
          price: 12500,
          total: 12500,
        },
        {
          productName: "Garlic Bread",
          quantity: 1,
          price: 3200,
          total: 3200,
        },
        {
          productName: "Lemonade",
          quantity: 2,
          price: 1800,
          total: 3600,
        },
      ],
      totalAmount: 19300,
      currency,
      customer: "Ada",
      amountPaid: 0,
      paymentMethod: "Pay at counter",
      status: "PENDING",
      channel: "STOREFRONT",
      notes: "Developer preview order.",
      isAutomated: true,
      serviceMode: "DINE_IN",
      tableLabel: "12",
    },
    {
      id: `${DEV_PREVIEW_ORDER_PREFIX}${baseTime}-3`,
      shortCode: "DEV103",
      date: new Date(baseTime).toISOString(),
      summary: "Chicken Alfredo Pasta",
      items: [
        {
          productName: "Chicken Alfredo Pasta",
          quantity: 1,
          price: 9200,
          total: 9200,
        },
      ],
      totalAmount: 9200,
      currency,
      customer: "Mary",
      amountPaid: 0,
      paymentMethod: "Card",
      status: "PENDING",
      channel: "WHATSAPP",
      notes: "Developer preview order.",
      isAutomated: true,
      serviceMode: "TAKEAWAY",
    },
  ]
}

export function GlobalOrderAlertProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { activeBusiness } = useBusiness()
  const businessId = activeBusiness?.id ?? null
  const isDevPreviewEnabled = process.env.NODE_ENV !== "production"
  const isRestaurantPreset = activeBusiness?.layoutPreset === "restaurant"
  const layoutPreset = activeBusiness?.layoutPreset ?? null
  const { data: goSettings } = useGoSettings()
  const sound = goSettings?.order_notifications?.restaurant.new_order_sound ?? "chime"
  const customSoundUrl = goSettings?.order_notifications?.restaurant.new_order_sound_url ?? null
  const { orders = [] } = useOrders(1, 10, { automation: ["AUTOMATED"] })
  const kitchenAction = useKitchenTicketActions()

  const [previewOrderId, setPreviewOrderId] = React.useState<string | null>(null)
  const [queuedOrders, setQueuedOrders] = React.useState<Order[]>([])
  const [sendingToastOrderId, setSendingToastOrderId] = React.useState<string | null>(null)
  const seenByBusinessRef = React.useRef<Record<string, Set<string>>>({})
  const announcedKeysRef = React.useRef<Set<string>>(new Set())
  const broadcastRef = React.useRef<BroadcastChannel | null>(null)
  const lastSoundCountRef = React.useRef(0)

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
    () => orders.find((order) => order.id === previewOrderId) ?? queuedOrders.find((order) => order.id === previewOrderId) ?? null,
    [orders, previewOrderId, queuedOrders]
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

  const triggerDeveloperToastPreview = React.useCallback(() => {
    const previewOrders = buildDevPreviewOrders(activeBusiness?.currency ?? "NGN")
    setQueuedOrders((current) => {
      const nonPreviewOrders = current.filter((order) => !isDevPreviewOrder(order))
      return [...previewOrders, ...nonPreviewOrders]
    })
  }, [activeBusiness?.currency])

  React.useEffect(() => {
    if (sound === "custom") preloadRestaurantNewOrderSound(customSoundUrl)
  }, [customSoundUrl, sound])

  const handleViewOrders = React.useCallback(
    (href: string) => {
      setPreviewOrderId(null)
      router.push(href)
    },
    [router]
  )

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
      if (isDevPreviewOrder(order)) {
        toast.message("Developer preview only. Create a real order to test kitchen dispatch.")
        return
      }

      if (order.kitchenTicketId) {
        toast.message("This order is now sent to the kitchen.")
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
    }
  }, [announceOrder, businessId, orders])

  const visibleQueuedOrders = React.useMemo(() => {
    return queuedOrders
      .map((queuedOrder) => orders.find((order) => order.id === queuedOrder.id) ?? queuedOrder)
      .filter((order) => {
        if (order.id === previewOrderId) return false
        return isIncomingCustomerOrder(order)
      })
  }, [orders, previewOrderId, queuedOrders])

  const headerCopy = React.useMemo(
    () => getAggregateAlertCopy(layoutPreset, visibleQueuedOrders),
    [layoutPreset, visibleQueuedOrders]
  )

  React.useEffect(() => {
    if (visibleQueuedOrders.length === 0) {
      toast.dismiss(GLOBAL_NEW_ORDERS_TOAST_ID)
      lastSoundCountRef.current = 0
      return
    }

    const displayedOrders = visibleQueuedOrders.slice(0, 2)
    const remainingCount = Math.max(0, visibleQueuedOrders.length - displayedOrders.length)

    toast.custom(
      () => (
        <div
          className={cn(
            "cloove-order-alert-toast relative w-[min(94vw,34rem)] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_20px_60px_-28px_rgba(15,23,42,0.38)] ring-1 ring-black/[0.02] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950"
          )}
        >
          <button
            type="button"
            aria-label="Dismiss new order alerts"
            onClick={clearQueuedOrders}
            className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-slate-200"
          >
            <HugeiconsIcon icon={X} className="h-4 w-4" />
          </button>

          <div className="border-b border-slate-200/70 px-4 py-3 pr-12 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/15">
                <HugeiconsIcon icon={BellRing} className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                    {headerCopy.alertTitle}
                  </p>
                  <Badge variant="secondary" className="rounded-full px-2 py-0 text-[11px]">
                    {visibleQueuedOrders.length}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {headerCopy.alertDescription}
                </p>
              </div>
            </div>
          </div>

          <div className="p-2">
            <div className="space-y-1.5">
              {displayedOrders.map((order) => {
                const record = resolveRecordCopy(layoutPreset, order)
                const total = formatCurrency(Number(order.totalAmount || 0), {
                  currency: order.currency ?? activeBusiness?.currency ?? "NGN",
                })
                const leadItem = order.items?.[0]
                const extraItems = Math.max(0, (order.items?.length ?? 0) - 1)
                const itemSummary = leadItem?.productName
                  ? `${leadItem.productName}${extraItems > 0 ? ` + ${extraItems} more` : ""}`
                  : order.summary || "Open preview for details"

                return (
                  <div
                    key={order.id}
                    className="group rounded-[22px] border border-transparent p-2 transition-colors hover:border-slate-200 hover:bg-slate-50 sm:p-2.5 dark:hover:border-white/10 dark:hover:bg-white/[0.03]"
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100 sm:h-12 sm:w-12 dark:border-white/10 dark:bg-slate-900">
                        {leadItem?.imageUrl ? (
                          <Image
                            src={leadItem.imageUrl}
                            alt={leadItem.productName || "Order item"}
                            fill
                            sizes="(max-width: 640px) 44px, 48px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-emerald-600 dark:text-emerald-300">
                            <HugeiconsIcon icon={record.icon} className="h-4.5 w-4.5" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-2">
                          <p className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
                            {record.recordLabel}{order.shortCode ? ` #${order.shortCode}` : ""}
                          </p>
                          {order.serviceMode ? (
                            <Badge variant="outline" className="hidden shrink-0 rounded-full px-2 py-0 text-[10px] uppercase tracking-normal sm:inline-flex">
                              {order.serviceMode.replace("_", " ")}
                            </Badge>
                          ) : null}
                        </div>

                        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                          {order.customer || "Walk-in customer"} • {total}
                        </p>
                        <p className="mt-0.5 truncate text-xs font-medium text-slate-700 dark:text-slate-300">
                          {itemSummary}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
                        <Button
                          size="sm"
                          aria-label={`Preview ${record.recordLabel.toLowerCase()}${order.shortCode ? ` #${order.shortCode}` : ""}`}
                          title="Preview"
                          className="h-9 w-9 rounded-full bg-emerald-600 px-0 text-xs text-white hover:bg-emerald-700 sm:h-8 sm:w-auto sm:px-3"
                          onClick={() => {
                            removeQueuedOrder(order.id)
                            openPreview(order)
                          }}
                        >
                          <HugeiconsIcon icon={Eye} className="h-4 w-4 sm:hidden" />
                          <span className="hidden sm:inline">Preview</span>
                          <HugeiconsIcon icon={ChevronRight} className="ml-1 hidden h-3.5 w-3.5 sm:block" />
                        </Button>
                        {isRestaurantPreset && !order.kitchenTicketId ? (
                          <Button
                            size="sm"
                            variant="outline"
                            aria-label={`Send order${order.shortCode ? ` #${order.shortCode}` : ""} to kitchen`}
                            title="Send to kitchen"
                            disabled={sendingToastOrderId === order.id}
                            className="h-9 w-9 rounded-full border-slate-200 px-0 text-xs sm:h-8 sm:w-auto sm:px-3 dark:border-white/10"
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
                            <HugeiconsIcon icon={UtensilsCrossed} className="h-4 w-4 sm:mr-1 sm:h-3.5 sm:w-3.5" />
                            <span className="hidden sm:inline">
                              {sendingToastOrderId === order.id ? "Sending..." : "Send to kitchen"}
                            </span>
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {remainingCount > 0 ? (
              <p className="px-2.5 pb-1.5 pt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                +{remainingCount} more{" "}
                {remainingCount === 1
                  ? headerCopy.recordLabel.toLowerCase()
                  : headerCopy.recordPluralLower}{" "}
                waiting
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

    if (isRestaurantPreset && visibleQueuedOrders.length > lastSoundCountRef.current) {
      playRestaurantNewOrderSound(sound, customSoundUrl)
    }
    lastSoundCountRef.current = visibleQueuedOrders.length
  }, [
    activeBusiness?.currency,
    clearQueuedOrders,
    headerCopy,
    layoutPreset,
    customSoundUrl,
    isRestaurantPreset,
    openPreview,
    removeQueuedOrder,
    sendingToastOrderId,
    sendOrderToKitchen,
    sound,
    visibleQueuedOrders,
  ])

  return (
    <>
      {children}
      {isDevPreviewEnabled ? (
        <div className="pointer-events-none fixed bottom-6 right-6 z-[90]">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={triggerDeveloperToastPreview}
            className="pointer-events-auto h-10 rounded-full border-slate-200 bg-white/95 px-4 shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-950/92"
          >
            <HugeiconsIcon icon={FlaskConical} className="mr-2 h-4 w-4" />
            Preview toast
          </Button>
        </div>
      ) : null}
      <GlobalOrderPreviewDrawer
        order={previewOrder}
        open={!!previewOrderId}
        onOpenChange={(open) => !open && setPreviewOrderId(null)}
        onViewOrders={handleViewOrders}
        layoutPreset={layoutPreset}
        isRestaurantPreset={isRestaurantPreset}
        allowSendToKitchen={!isDevPreviewOrder(previewOrder)}
        isSendingToKitchen={kitchenAction.create.isPending}
        onSendToKitchen={handleSendToKitchen}
      />
    </>
  )
}
