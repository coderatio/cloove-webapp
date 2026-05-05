"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Crown, Mail, Phone, Search, ShieldAlert, User, Users } from "lucide-react"
import { Input } from "@/app/components/ui/input"
import { useCustomers, type Customer } from "@/app/domains/customers/hooks/useCustomers"
import { useLayoutPresetId } from "@/app/domains/workspace/hooks/usePresetPageCopy"
import { cn } from "@/app/lib/utils"

type CustomerFilter = "all" | "vip" | "owing"

const CUSTOMER_FILTERS: Array<{ id: CustomerFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "vip", label: "VIP" },
  { id: "owing", label: "Owing" },
]

export default function SalesModeCustomersPage() {
  const router = useRouter()
  const preset = useLayoutPresetId()
  const [search, setSearch] = React.useState("")
  const [filter, setFilter] = React.useState<CustomerFilter>("all")

  React.useEffect(() => {
    if (preset !== "retail") router.replace("/sales-mode/pos")
  }, [preset, router])

  const { customers, isPending } = useCustomers(1, 80, search)

  const summary = React.useMemo(() => {
    const vipCount = customers.filter((customer) => customer.isVip).length
    const owingCount = customers.filter((customer) => parseMoney(customer.owing) > 0).length
    return { total: customers.length, vipCount, owingCount }
  }, [customers])

  const visibleCustomers = React.useMemo(() => {
    if (filter === "vip") return customers.filter((customer) => customer.isVip)
    if (filter === "owing") return customers.filter((customer) => parseMoney(customer.owing) > 0)
    return customers
  }, [customers, filter])

  return (
    <div className="h-full overflow-auto p-3 md:p-4">
      <div className="mx-auto max-w-6xl space-y-4 pb-6">
        <section className="rounded-3xl border border-black/10 bg-background/70 p-4 backdrop-blur dark:border-white/10 md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent/50 dark:text-brand-cream/50">
                Retail Customer Desk
              </p>
              <h1 className="mt-1 text-xl font-serif text-brand-deep dark:text-brand-cream md:text-2xl">Customer Lookup</h1>
              <p className="mt-1 text-xs text-brand-accent/60 dark:text-brand-cream/60 md:text-sm">
                Find buyer profiles quickly before checkout, debt collection, or repeat sales.
              </p>
            </div>
            <Link
              href="/sales-mode/pos"
              className="inline-flex items-center justify-center rounded-xl border border-brand-gold/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand-gold hover:bg-brand-gold/10"
            >
              Back To POS
            </Link>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <SummaryCard label="Total" value={String(summary.total)} icon={Users} />
            <SummaryCard label="VIP" value={String(summary.vipCount)} icon={Crown} tone="gold" />
            <SummaryCard label="With Outstanding" value={String(summary.owingCount)} icon={ShieldAlert} tone="warn" />
          </div>

          <div className="mt-4 relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-accent/40 dark:text-brand-cream/40" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customer by name"
              className="h-11 rounded-xl pl-9"
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {CUSTOMER_FILTERS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setFilter(option.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition",
                  filter === option.id
                    ? "border-brand-gold/50 bg-brand-gold/15 text-brand-gold"
                    : "border-black/10 bg-white/70 text-brand-accent/65 hover:border-black/20 dark:border-white/10 dark:bg-white/5 dark:text-brand-cream/65"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          {isPending ? (
            <StateCard label="Loading customers..." />
          ) : visibleCustomers.length === 0 ? (
            <StateCard label="No customer matches for current search/filter." />
          ) : (
            visibleCustomers.map((customer) => <CustomerRow key={customer.id} customer={customer} />)
          )}
        </section>
      </div>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  tone?: "default" | "gold" | "warn"
}) {
  const iconClass = tone === "gold"
    ? "text-brand-gold"
    : tone === "warn"
      ? "text-amber-500"
      : "text-brand-accent/70 dark:text-brand-cream/70"

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

function CustomerRow({ customer }: { customer: Customer }) {
  const hasDebt = parseMoney(customer.owing) > 0

  return (
    <article className="rounded-2xl border border-black/10 bg-background/75 p-4 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-base font-semibold text-brand-deep dark:text-brand-cream">{customer.name}</p>
            {customer.isVip ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-gold/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-brand-gold">
                <Crown className="h-3 w-3" /> VIP
              </span>
            ) : null}
            {hasDebt ? (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-amber-500">Outstanding</span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-brand-accent/55 dark:text-brand-cream/55">
            {customer.orders} sales · Total spent {customer.totalSpent}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-brand-accent/65 dark:text-brand-cream/65">
          <span className="inline-flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            Owing {customer.owing}
          </span>
          {customer.phoneNumber ? (
            <span className="inline-flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" />
              {customer.phoneNumber}
            </span>
          ) : null}
          {customer.email ? (
            <span className="inline-flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" />
              {customer.email}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  )
}

function parseMoney(value: string): number {
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ""))
  return Number.isFinite(parsed) ? parsed : 0
}

function StateCard({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-background/60 p-6 text-sm text-brand-accent/60 dark:border-white/10 dark:text-brand-cream/60">
      {label}
    </div>
  )
}
