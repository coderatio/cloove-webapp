"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowUpRight01Icon as ArrowUpRight, LockIcon as Lock, PlusSignIcon as Plus, Wallet01Icon as Wallet } from "@hugeicons/core-free-icons"
import { Button } from "@/app/components/ui/button"
import { GlassCard } from "../ui/glass-card"
import { AddFundsDrawer } from "@/app/components/shared/AddFundsDrawer"
import { WithdrawDrawer } from "@/app/domains/finance/components/WithdrawDrawer"
import { useBusiness } from "@/app/components/BusinessProvider"
import { CurrencyText } from "@/app/components/shared/CurrencyText"
import { cn } from "@/app/lib/utils"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface DashboardHeroProps {
  sales: {
    value: string
    trend: string
    trendDirection: "up" | "down"
    label: string
    storeName?: string
    periodLabel?: string
  }
  wallet?: {
    balance: string
    isVerified: boolean
    label?: string
  }
  className?: string
}

function MetricBlock(props: {
  label: string
  value: React.ReactNode
  supporting?: string
  align?: "left" | "right"
  valueClassName?: string
}) {
  return (
    <div className={cn("space-y-2", props.align === "right" && "md:text-right")}>
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {props.label}
      </p>
      <div className={cn("text-3xl font-semibold tracking-tight text-foreground md:text-4xl", props.valueClassName)}>
        {props.value}
      </div>
      {props.supporting ? <p className="text-sm text-muted-foreground">{props.supporting}</p> : null}
    </div>
  )
}

export function DashboardHero({ sales, wallet, className }: DashboardHeroProps) {
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false)
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false)
  const router = useRouter()
  const { activeBusiness } = useBusiness()

  const currencyCode = activeBusiness?.currency || "NGN"
  const walletLabel = wallet?.label ?? "Wallet balance"
  const showWallet = Boolean(wallet)

  return (
    <>
      <GlassCard className={cn("rounded-[28px] p-6 md:p-7", className)}>
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] md:items-center md:gap-7">
          <section className="space-y-5">
            <MetricBlock
              label={sales.label}
              value={
                <CurrencyText
                  value={sales.value}
                  className="leading-none"
                  symbolClassName="mr-0.5"
                />
              }
              supporting={sales.periodLabel ? `Period: ${sales.periodLabel}` : sales.storeName}
              valueClassName="text-4xl md:text-[3.35rem]"
            />

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>{sales.storeName || "All stores"}</span>

              {sales.trend && sales.trend !== "—" ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                    sales.trendDirection === "up"
                      ? "border-emerald-500/20 bg-emerald-500/8 text-emerald-700 dark:text-emerald-300"
                      : "border-rose-500/20 bg-rose-500/8 text-rose-700 dark:text-rose-300"
                  )}
                >
                  <HugeiconsIcon icon={ArrowUpRight}
                    className={cn("h-3.5 w-3.5", sales.trendDirection === "down" && "rotate-90")}
                  />
                  {sales.trend}
                </span>
              ) : null}
            </div>
          </section>

          {showWallet ? (
            <aside className="border-t border-border pt-5 md:border-l md:border-t-0 md:py-1 md:pl-7">
              {wallet?.isVerified ? (
                <div className="space-y-5 md:text-right">
                  <MetricBlock
                    label={walletLabel}
                    value={<CurrencyText value={wallet.balance} />}
                    align="right"
                    valueClassName="text-3xl md:text-4xl"
                  />

                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <Button onClick={() => setIsAddMoneyOpen(true)} size="sm">
                      <HugeiconsIcon icon={Plus} className="mr-2 h-4 w-4" />
                      Add money
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setIsWithdrawOpen(true)}>
                      <HugeiconsIcon icon={Wallet} className="mr-2 h-4 w-4" />
                      Send
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 md:text-right">
                  <div className="flex items-start gap-3 md:flex-col md:items-end">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted/50 text-muted-foreground">
                      <HugeiconsIcon icon={Lock} className="h-4.5 w-4.5" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        {walletLabel}
                      </p>
                      <p className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
                        Identity verification required
                      </p>
                      <p className="max-w-[28ch] text-sm leading-6 text-muted-foreground md:ml-auto">
                        Verify your identity to unlock wallet transfers.
                      </p>
                    </div>
                  </div>

                  <div className="flex md:justify-end">
                    <Button size="sm" onClick={() => router.push("/settings?tab=verification")}>
                      Verify identity
                    </Button>
                  </div>
                </div>
              )}
            </aside>
          ) : null}
        </div>
      </GlassCard>

      <AddFundsDrawer
        isOpen={isAddMoneyOpen}
        onOpenChange={setIsAddMoneyOpen}
        currencyCode={currencyCode}
      />
      <WithdrawDrawer
        isOpen={isWithdrawOpen}
        onOpenChange={setIsWithdrawOpen}
        currencyCode={currencyCode}
      />
    </>
  )
}
