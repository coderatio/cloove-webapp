"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { GridIcon as Grid3X3, PackageIcon as Package, Search01Icon as Search, Tag01Icon as Tag, TradeUpIcon as TrendingUp } from "@hugeicons/core-free-icons"
import { Input } from "@/app/components/ui/input"
import { formatCurrency } from "@/app/lib/formatters"
import { CurrencyText } from "@/app/components/shared/CurrencyText"
import { useInventory, type Product } from "@/app/domains/orders/hooks/useInventory"
import { useLayoutPresetId } from "@/app/domains/workspace/hooks/usePresetPageCopy"
import { cn } from "@/app/lib/utils"

type StockFilter = "all" | Product["status"]

const STOCK_FILTERS: Array<{ id: StockFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "In Stock", label: "In Stock" },
  { id: "Low Stock", label: "Low" },
  { id: "Out of Stock", label: "Out" },
]

export default function SalesModeCatalogPage() {
  const router = useRouter()
  const preset = useLayoutPresetId()
  const [search, setSearch] = React.useState("")
  const [stockFilter, setStockFilter] = React.useState<StockFilter>("all")

  React.useEffect(() => {
    if (preset !== "retail") router.replace("/sales-mode/pos")
  }, [preset, router])

  const { products: rawProducts, isLoadingProducts } = useInventory({ search })
  const products = rawProducts as Product[]

  const metrics = React.useMemo(() => {
    const inStock = products.filter((item) => item.status === "In Stock").length
    const lowStock = products.filter((item) => item.status === "Low Stock").length
    const outOfStock = products.filter((item) => item.status === "Out of Stock").length
    const totalCatalogValue = products.reduce((sum, item) => sum + item.price * Math.max(0, item.stock), 0)
    return { inStock, lowStock, outOfStock, totalCatalogValue }
  }, [products])

  const categories = React.useMemo(() => {
    return Array.from(new Set(products.map((item) => item.category))).sort()
  }, [products])

  const visibleProducts = React.useMemo(() => {
    if (stockFilter === "all") return products
    return products.filter((item) => item.status === stockFilter)
  }, [products, stockFilter])

  return (
    <div className="h-full overflow-auto p-3 md:p-4">
      <div className="mx-auto max-w-6xl space-y-4 pb-6">
        <section className="rounded-3xl border border-black/10 bg-background/70 p-4 backdrop-blur dark:border-white/10 md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent/50 dark:text-brand-cream/50">
                Retail Catalog Console
              </p>
              <h1 className="mt-1 text-xl font-serif text-brand-deep dark:text-brand-cream md:text-2xl">Live Product Grid</h1>
              <p className="mt-1 text-xs text-brand-accent/60 dark:text-brand-cream/60 md:text-sm">
                Fast browse for cashier decisions before adding items on POS.
              </p>
            </div>

            <Link
              href="/sales-mode/pos"
              className="inline-flex items-center justify-center rounded-xl border border-brand-gold/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand-gold hover:bg-brand-gold/10"
            >
              Open POS
            </Link>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Catalog Items" value={String(products.length)} icon={Grid3X3} />
            <MetricCard label="In Stock" value={String(metrics.inStock)} icon={Package} tone="good" />
            <MetricCard label="Low / Out" value={`${metrics.lowStock + metrics.outOfStock}`} icon={TrendingUp} tone="warn" />
            <MetricCard
              label="Catalog Value"
              value={<CurrencyText value={formatCurrency(metrics.totalCatalogValue)} />}
              icon={Tag}
            />
          </div>

          <div className="mt-4 relative">
            <HugeiconsIcon icon={Search} className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-accent/40 dark:text-brand-cream/40" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search product name, tag, category"
              className="h-11 rounded-xl pl-9"
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {STOCK_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setStockFilter(filter.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition",
                  stockFilter === filter.id
                    ? "border-brand-gold/50 bg-brand-gold/15 text-brand-gold"
                    : "border-black/10 bg-white/70 text-brand-accent/65 hover:border-black/20 dark:border-white/10 dark:bg-white/5 dark:text-brand-cream/65"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {categories.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {categories.slice(0, 12).map((category) => (
                <span
                  key={category}
                  className="rounded-full border border-black/10 bg-white/60 px-3 py-1 text-[11px] font-medium text-brand-accent/75 dark:border-white/10 dark:bg-white/5 dark:text-brand-cream/75"
                >
                  {category}
                </span>
              ))}
            </div>
          ) : null}
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {isLoadingProducts ? (
            <StateCard label="Loading products..." />
          ) : visibleProducts.length === 0 ? (
            <StateCard label="No matching products for current search/filter." />
          ) : (
            visibleProducts.map((item) => (
              <article
                key={item.id}
                className="group overflow-hidden rounded-2xl border border-black/10 bg-background/75 p-4 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="line-clamp-1 text-base font-semibold text-brand-deep dark:text-brand-cream">{item.product}</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-brand-accent/60 dark:text-brand-cream/60">
                      <HugeiconsIcon icon={Tag} className="h-3.5 w-3.5" />
                      {item.category}
                    </p>
                  </div>
                  <StatusPill status={item.status} />
                </div>

                <div className="mt-4 flex items-end justify-between">
                  <p className="text-lg font-semibold text-brand-deep dark:text-brand-cream">
                    <CurrencyText value={formatCurrency(item.price)} />
                  </p>
                  <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.1em] text-brand-accent/65 dark:text-brand-cream/65">
                    <HugeiconsIcon icon={Package} className="h-3.5 w-3.5" />
                    {item.stock}
                  </p>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
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
  value: React.ReactNode
  icon: IconSvgElement
  tone?: "default" | "good" | "warn"
}) {
  const toneClass = tone === "good"
    ? "text-emerald-600 dark:text-emerald-300"
    : tone === "warn"
      ? "text-amber-600 dark:text-amber-300"
      : "text-brand-gold"

  return (
    <article className="rounded-2xl border border-black/10 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-accent/50 dark:text-brand-cream/50">{label}</p>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-brand-deep dark:text-brand-cream">{value}</p>
        <HugeiconsIcon icon={Icon} className={cn("h-4 w-4", toneClass)} />
      </div>
    </article>
  )
}

function StatusPill({ status }: { status: Product["status"] }) {
  const className = status === "Out of Stock"
    ? "bg-red-500/15 text-red-500"
    : status === "Low Stock"
      ? "bg-amber-500/15 text-amber-500"
      : "bg-emerald-500/15 text-emerald-500"

  return <span className={cn("rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em]", className)}>{status}</span>
}

function StateCard({ label }: { label: string }) {
  return (
    <div className="col-span-full rounded-2xl border border-black/10 bg-background/60 p-6 text-sm text-brand-accent/60 dark:border-white/10 dark:text-brand-cream/60">
      {label}
    </div>
  )
}
