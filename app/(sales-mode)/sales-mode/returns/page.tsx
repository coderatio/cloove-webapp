"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Receipt, RotateCcw, Search, ShieldCheck } from "lucide-react"
import { Input } from "@/app/components/ui/input"
import { Button } from "@/app/components/ui/button"
import { CurrencyText } from "@/app/components/shared/CurrencyText"
import { formatCurrency, formatDate } from "@/app/lib/formatters"
import { useOrders } from "@/app/domains/orders/hooks/useOrders"
import { type Order } from "@/app/domains/orders/types"
import { OrderDetailsDrawer } from "@/app/domains/orders/components/OrderDetailsDrawer"
import { useLayoutPresetId } from "@/app/domains/workspace/hooks/usePresetPageCopy"
import { cn } from "@/app/lib/utils"

const PAGE_SIZE = 40

type StatusFilter = "all" | "COMPLETED" | "CANCELLED"

const STATUS_FILTERS: Array<{ id: StatusFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "COMPLETED", label: "Completed" },
  { id: "CANCELLED", label: "Cancelled" },
]

export default function SalesModeReturnsPage() {
  const router = useRouter()
  const preset = useLayoutPresetId()
  const [search, setSearch] = React.useState("")
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null)
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all")

  React.useEffect(() => {
    if (preset !== "retail") router.replace("/sales-mode/pos")
  }, [preset, router])

  const statusQuery = statusFilter === "all" ? ["COMPLETED", "CANCELLED"] : [statusFilter]

  const { orders, isLoading } = useOrders(1, PAGE_SIZE, {
    search,
    status: statusQuery,
  })

  const metrics = React.useMemo(() => {
    const completed = orders.filter((order) => order.status === "COMPLETED").length
    const cancelled = orders.filter((order) => order.status === "CANCELLED").length
    return { total: orders.length, completed, cancelled }
  }, [orders])

  return (
    <div className="h-full overflow-auto p-3 md:p-4">
      <div className="mx-auto max-w-6xl space-y-4 pb-6">
        <section className="rounded-3xl border border-black/10 bg-background/70 p-4 backdrop-blur dark:border-white/10 md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent/50 dark:text-brand-cream/50">
                Returns Command
              </p>
              <h1 className="mt-1 text-xl font-serif text-brand-deep dark:text-brand-cream md:text-2xl">Returns & Reversal Review</h1>
              <p className="mt-1 text-xs text-brand-accent/60 dark:text-brand-cream/60 md:text-sm">
                Validate receipts before reversal, then complete sensitive actions via Sales History.
              </p>
            </div>
            <Link
              href="/sales-mode/history"
              className="inline-flex items-center justify-center rounded-xl border border-brand-gold/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand-gold hover:bg-brand-gold/10"
            >
              Open History
            </Link>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <MetricCard label="Entries" value={String(metrics.total)} icon={Receipt} />
            <MetricCard label="Completed" value={String(metrics.completed)} icon={ShieldCheck} tone="good" />
            <MetricCard label="Cancelled" value={String(metrics.cancelled)} icon={RotateCcw} tone="warn" />
          </div>

          <div className="mt-4 relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-accent/40 dark:text-brand-cream/40" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search receipt code or customer"
              className="h-11 rounded-xl pl-9"
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {STATUS_FILTERS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setStatusFilter(option.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition",
                  statusFilter === option.id
                    ? "border-brand-gold/50 bg-brand-gold/15 text-brand-gold"
                    : "border-black/10 bg-white/70 text-brand-accent/65 hover:border-black/20 dark:border-white/10 dark:bg-white/5 dark:text-brand-cream/65"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-black/10 bg-background/75 backdrop-blur dark:border-white/10">
          {isLoading ? (
            <StateCard label="Loading sales records..." />
          ) : orders.length === 0 ? (
            <StateCard label="No matching sale found." />
          ) : (
            <div className="divide-y divide-black/5 dark:divide-white/10">
              {orders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => setSelectedOrder(order)}
                  className="w-full px-4 py-3 text-left transition-colors hover:bg-black/3 dark:hover:bg-white/5 md:px-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-brand-deep dark:text-brand-cream">{order.customer}</p>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="mt-0.5 truncate text-xs text-brand-accent/55 dark:text-brand-cream/55">
                        #{order.shortCode ?? order.id.slice(0, 6)} · {order.summary}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-brand-deep dark:text-brand-cream">
                        <CurrencyText value={formatCurrency(order.totalAmount, { currency: order.currency || "NGN" })} />
                      </p>
                      <p className="text-[11px] text-brand-accent/55 dark:text-brand-cream/55">{formatDate(order.date, "MMM d, h:mm a")}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <div className="rounded-2xl border border-black/10 bg-background/70 p-4 dark:border-white/10">
          <p className="text-xs text-brand-accent/65 dark:text-brand-cream/65">
            For high-risk actions (cancel/reversal), open the full transaction context in Sales History.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/sales-mode/history")}
            className="mt-3 h-9 rounded-lg"
          >
            Continue To History
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <OrderDetailsDrawer
        order={selectedOrder}
        open={!!selectedOrder}
        onOpenChange={(open) => {
          if (!open) setSelectedOrder(null)
        }}
      />
    </div>
  )
}

function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  tone?: "default" | "good" | "warn"
}) {
  const iconClass = tone === "good"
    ? "text-emerald-500"
    : tone === "warn"
      ? "text-amber-500"
      : "text-brand-gold"

  return (
    <article className="rounded-2xl border border-black/10 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-accent/50 dark:text-brand-cream/50">{label}</p>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-brand-deep dark:text-brand-cream">{value}</p>
        <Icon className={cn("h-4 w-4", iconClass)} />
      </div>
    </article>
  )
}

function StatusBadge({ status }: { status: Order["status"] }) {
  const className = status === "CANCELLED"
    ? "bg-amber-500/15 text-amber-500"
    : status === "COMPLETED"
      ? "bg-emerald-500/15 text-emerald-500"
      : "bg-slate-500/15 text-slate-500"

  return <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]", className)}>{status}</span>
}

function StateCard({ label }: { label: string }) {
  return <div className="p-6 text-sm text-brand-accent/60 dark:text-brand-cream/60">{label}</div>
}
