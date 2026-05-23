"use client"

import { useMemo, useState } from "react"
import { GlassCard } from "@/app/components/ui/glass-card"
import { ListCard } from "@/app/components/ui/list-card"
import { useIsMobile } from "@/app/hooks/useMediaQuery"
import { useBusiness } from "@/app/components/BusinessProvider"
import { formatCurrency, formatDate } from "@/app/lib/formatters"
import { CurrencyText } from "@/app/components/shared/CurrencyText"
import { Skeleton } from "@/app/components/ui/skeleton"
import {
    Drawer,
    DrawerBody,
    DrawerContent,
    DrawerDescription,
    DrawerStickyHeader,
    DrawerTitle,
} from "@/app/components/ui/drawer"
import {
    PhoneCall,
    PhoneIncoming,
    PhoneOutgoing,
    Wallet,
    AlertTriangle,
    Clock,
    Loader2,
    Receipt,
} from "lucide-react"
import { cn } from "@/app/lib/utils"
import DataTable, { type Column } from "@/app/components/DataTable"
import {
    useVoiceCallCharges,
    useWalletDebts,
    type VoiceCallCharge,
    type WalletDebtItem,
} from "@/app/domains/voice/hooks/useVoice"

export function formatDuration(seconds: number | undefined | null): string {
    if (!seconds || seconds <= 0) return "—"
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return m > 0 ? `${m}m ${s}s` : `${s}s`
}

export function formatRateDisplay(ratePerMinute: number | undefined | null, currency: string | undefined | null): string {
    if (ratePerMinute == null) return "—"
    return `${formatCurrency(ratePerMinute, { currency: currency ?? "NGN" })}/min`
}

export function getChargeDirectionIcon(direction: string | undefined | null) {
    if (!direction) return PhoneCall
    const d = direction.toLowerCase()
    if (d.includes("inbound")) return PhoneIncoming
    if (d.includes("outbound")) return PhoneOutgoing
    return PhoneCall
}

export function ChargeStatusBadge({ charge }: { charge: VoiceCallCharge }) {
    const shortfall = charge.metadata?.shortfall
    const hasShortfall = shortfall != null && shortfall > 0
    if (hasShortfall) {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-200">
                <AlertTriangle className="h-3 w-3" />
                Partial
            </span>
        )
    }
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Charged
        </span>
    )
}

export function DebtStatusBadge({ debt }: { debt: WalletDebtItem }) {
    const remaining = debt.remainingAmount
    if (remaining <= 0) {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Settled
            </span>
        )
    }
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/25 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-700 dark:border-rose-400/25 dark:bg-rose-400/10 dark:text-rose-200">
            <AlertTriangle className="h-3 w-3" />
            Outstanding
        </span>
    )
}

export function VoiceChargesView() {
    const isMobile = useIsMobile()
    const { activeBusiness } = useBusiness()
    const currencyCode = activeBusiness?.currency || "NGN"

    const [selectedCharge, setSelectedCharge] = useState<VoiceCallCharge | null>(null)

    const { data: chargesData, isLoading: chargesLoading, isFetching: chargesFetching } = useVoiceCallCharges(1, 100)
    const { data: debtsData, isLoading: debtsLoading } = useWalletDebts()

    const charges = chargesData?.data ?? []
    const debts = debtsData?.data ?? []
    const debtsMeta = debtsData?.meta

    const totalChargedAmount = useMemo(
        () => charges.reduce((sum, c) => sum + c.amount, 0),
        [charges]
    )

    const columns = useMemo((): Column<VoiceCallCharge>[] => [
        {
            key: "id",
            header: "",
            width: "52px",
            cellClassName: "pl-4 pr-0 py-4 shrink-0 w-[52px] align-middle",
            headerClassName: "pl-4 pr-0 py-3 w-[52px]",
            render: (_value: unknown, row: VoiceCallCharge) => {
                const dir = row.metadata?.direction
                const Icon = getChargeDirectionIcon(dir)
                const isOutbound = dir?.toLowerCase().includes("outbound")
                return (
                    <div
                        className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-xl shrink-0",
                            isOutbound
                                ? "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300"
                                : "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300"
                        )}
                    >
                        <Icon className="h-4 w-4" />
                    </div>
                )
            },
        },
        {
            key: "description",
            header: "Call",
            cellClassName: "align-middle",
            render: (_value: unknown, row: VoiceCallCharge) => {
                const dir = row.metadata?.direction ?? "—"
                const dur = formatDuration(row.metadata?.duration_seconds)
                const country = row.metadata?.country ?? ""
                const chargeCurrency = row.currency || currencyCode
                const rate = formatRateDisplay(row.metadata?.rate_per_minute, chargeCurrency)
                return (
                    <div className="flex flex-col gap-0.5 min-w-0 py-0.5">
                        <span className="text-sm font-semibold text-brand-deep dark:text-brand-cream capitalize">
                            {dir} call
                        </span>
                        <div className="flex items-center gap-2 text-xs text-brand-accent/50 dark:text-brand-cream/45">
                            <span className="tabular-nums">{dur}</span>
                            {country && (
                                <>
                                    <span className="h-1 w-1 rounded-full bg-brand-deep/15 dark:bg-brand-cream/15" />
                                    <span>{country}</span>
                                </>
                            )}
                            {row.metadata?.rate_per_minute != null && (
                                <>
                                    <span className="h-1 w-1 rounded-full bg-brand-deep/15 dark:bg-brand-cream/15" />
                                    <span className="font-mono">{rate}</span>
                                </>
                            )}
                        </div>
                    </div>
                )
            },
        },
        {
            key: "reference",
            header: "Ref",
            cellClassName: "align-middle",
            render: (_value: unknown, row: VoiceCallCharge) => (
                <span className="font-mono text-[11px] text-brand-accent/40 dark:text-brand-cream/30 truncate max-w-[120px] block">
                    {row.reference}
                </span>
            ),
        },
        {
            key: "amount",
            header: "Amount",
            cellClassName: "align-middle",
            render: (_value: unknown, row: VoiceCallCharge) => {
                const hasShortfall = (row.metadata?.shortfall ?? 0) > 0
                return (
                    <div className="flex flex-col items-start gap-0.5">
                        <span className="font-serif font-semibold text-[16px] leading-none tabular-nums text-rose-700 dark:text-rose-300">
                            <CurrencyText value={`−${formatCurrency(row.amount, { currency: row.currency || currencyCode })}`} />
                        </span>
                        {hasShortfall && row.metadata?.shortfall ? (
                            <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
                                +{formatCurrency(row.metadata.shortfall, { currency: row.currency || currencyCode })} shortfall
                            </span>
                        ) : null}
                    </div>
                )
            },
        },
        {
            key: "currency",
            header: "Status",
            cellClassName: "align-middle",
            render: (_value: unknown, row: VoiceCallCharge) => <ChargeStatusBadge charge={row} />,
        },
        {
            key: "createdAt",
            header: "Date",
            cellClassName: "align-middle",
            render: (_value: unknown, row: VoiceCallCharge) => {
                const d = row.createdAt ? new Date(row.createdAt) : null
                return (
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[13px] font-medium text-brand-deep dark:text-brand-cream tabular-nums whitespace-nowrap leading-tight">
                            {d && !isNaN(d.getTime()) ? d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                        </span>
                        {d && !isNaN(d.getTime()) && (
                            <span className="text-[11px] text-brand-accent/40 dark:text-brand-cream/35 tabular-nums whitespace-nowrap leading-tight">
                                {d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true })}
                            </span>
                        )}
                    </div>
                )
            },
        },
    ], [currencyCode])

    if (chargesLoading && charges.length === 0) {
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-28 rounded-2xl" />
                    ))}
                </div>
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <GlassCard className="p-5 flex items-center gap-4 relative overflow-hidden group rounded-3xl before:rounded-3xl border-brand-deep/8">
                    <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Receipt className="w-24 h-24" />
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
                        <PhoneCall className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase text-brand-accent/40 dark:text-brand-cream/40">
                            Total spend
                        </p>
                        {chargesLoading ? (
                            <Skeleton className="h-8 w-20 mt-1" />
                        ) : (
                            <p className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream tabular-nums">
                                <CurrencyText value={formatCurrency(totalChargedAmount, { currency: currencyCode })} />
                            </p>
                        )}
                    </div>
                </GlassCard>

                <GlassCard className="p-5 flex items-center gap-4 relative overflow-hidden group rounded-3xl before:rounded-3xl border-brand-deep/8">
                    <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Clock className="w-24 h-24" />
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                        <Clock className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase text-brand-accent/40 dark:text-brand-cream/40">
                            Number of calls
                        </p>
                        {chargesLoading ? (
                            <Skeleton className="h-8 w-16 mt-1" />
                        ) : (
                            <p className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream">
                                {charges.length} call{charges.length !== 1 ? "s" : ""}
                            </p>
                        )}
                    </div>
                </GlassCard>

                <GlassCard className={cn(
                    "p-5 flex items-center gap-4 relative overflow-hidden group rounded-3xl before:rounded-3xl",
                    (debtsMeta?.totalOutstanding ?? 0) > 0
                        ? "border-rose-500/20 bg-rose-500/5"
                        : "border-brand-deep/8"
                )}>
                    <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                        <AlertTriangle className="w-24 h-24" />
                    </div>
                    <div className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center",
                        (debtsMeta?.totalOutstanding ?? 0) > 0
                            ? "bg-rose-500/10 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300"
                            : "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
                    )}>
                        {debtsLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (debtsMeta?.totalOutstanding ?? 0) > 0 ? (
                            <AlertTriangle className="h-6 w-6" />
                        ) : (
                            <Wallet className="h-6 w-6" />
                        )}
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase text-brand-accent/40 dark:text-brand-cream/40">
                            Outstanding Debt
                        </p>
                        {debtsLoading ? (
                            <Skeleton className="h-8 w-24 mt-1" />
                        ) : (
                            <p className={cn(
                                "text-2xl font-serif font-medium tabular-nums",
                                (debtsMeta?.totalOutstanding ?? 0) > 0
                                    ? "text-rose-600 dark:text-rose-300"
                                    : "text-emerald-600 dark:text-emerald-300"
                            )}>
                                {(debtsMeta?.totalOutstanding ?? 0) > 0 ? (
                                    <CurrencyText value={formatCurrency(debtsMeta!.totalOutstanding, { currency: debtsMeta?.currency || currencyCode })} />
                                ) : (
                                    "None"
                                )}
                            </p>
                        )}
                    </div>
                </GlassCard>
            </div>

            {/* Wallet Debts Section */}
            {!debtsLoading && debts.length > 0 && (
                <GlassCard className="rounded-2xl border-rose-500/15 bg-rose-500/3 p-5 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-brand-deep dark:text-brand-cream">
                                Outstanding Wallet Debts
                            </h3>
                            <p className="text-sm text-brand-accent/50 dark:text-brand-cream/45">
                                These debts will be settled automatically when your wallet is next funded.
                            </p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {debts.map((debt) => (
                            <div
                                key={debt.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-rose-500/10 bg-white/70 px-4 py-3 dark:bg-white/5"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-brand-deep dark:text-brand-cream">
                                        {debt.originDescription || debt.originType}
                                    </p>
                                    <p className="text-xs text-brand-accent/50 dark:text-brand-cream/45 mt-0.5">
                                        {formatDate(debt.createdAt, "MMM d, yyyy")}
                                        {debt.originType ? ` · ${debt.originType}` : ""}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4 shrink-0">
                                    <div className="text-right">
                                        <p className="text-xs text-brand-accent/45 dark:text-brand-cream/40">Remaining</p>
                                        <p className="font-serif font-semibold text-[15px] tabular-nums text-rose-600 dark:text-rose-300">
                                            <CurrencyText value={formatCurrency(debt.remainingAmount, { currency: debt.currency || currencyCode })} />
                                        </p>
                                    </div>
                                    <DebtStatusBadge debt={debt} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-brand-accent/40 dark:text-brand-cream/35">
                        {debtsMeta?.count ?? debts.length} outstanding debt{debts.length !== 1 ? "s" : ""} · total{" "}
                        <CurrencyText value={formatCurrency(debtsMeta?.totalOutstanding ?? 0, { currency: debtsMeta?.currency || currencyCode })} />
                    </p>
                </GlassCard>
            )}

            {/* Charges Table */}
            {charges.length === 0 ? (
                <GlassCard className="p-12 text-center border-dashed border-brand-deep/20 dark:border-white/10 bg-transparent">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-16 w-16 rounded-3xl bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center mb-2">
                            <PhoneCall className="w-8 h-8 text-brand-deep/20 dark:text-white/20" />
                        </div>
                        <h3 className="text-brand-deep dark:text-brand-cream font-medium">No call charges yet</h3>
                        <p className="text-xs text-brand-accent/40 dark:text-brand-cream/40 max-w-[280px] mx-auto">
                            Charges appear here once calls are completed and billed to your wallet.
                        </p>
                    </div>
                </GlassCard>
            ) : isMobile ? (
                <div className="space-y-3">
                    <p className="text-xs font-bold uppercase text-brand-accent/40 dark:text-brand-cream/40 ml-1">
                        Call Charges
                    </p>
                    {charges.map((charge, index) => {
                        const dir = charge.metadata?.direction ?? ""
                        const Icon = getChargeDirectionIcon(dir)
                        const isOutbound = dir.toLowerCase().includes("outbound")
                        const dur = formatDuration(charge.metadata?.duration_seconds)
                        const rate = formatRateDisplay(charge.metadata?.rate_per_minute, charge.currency || currencyCode)
                        return (
                            <button
                                key={charge.id}
                                type="button"
                                onClick={() => setSelectedCharge(charge)}
                                className="w-full text-left"
                            >
                                <ListCard
                                    title={charge.description || `${dir} call`}
                                    subtitle={<span className="text-xs">{dur} · {rate}</span>}
                                    icon={Icon}
                                    iconClassName={isOutbound ? "text-sky-600 dark:text-sky-300" : "text-violet-600 dark:text-violet-300"}
                                    meta={charge.createdAt ? formatDate(charge.createdAt, "MMM d, yyyy") : undefined}
                                    value={<CurrencyText value={formatCurrency(charge.amount, { currency: charge.currency || currencyCode })} />}
                                    valueLabel="Charged"
                                    delay={index * 0.05}
                                />
                            </button>
                        )
                    })}
                </div>
            ) : (
                <div className={cn("transition-opacity duration-300", chargesFetching && "opacity-50")}>
                    <p className="text-xs font-bold uppercase text-brand-accent/40 dark:text-brand-cream/40 ml-1 mb-4">
                        Call Charges
                    </p>
                    <GlassCard className="overflow-hidden border-brand-deep/5 dark:border-white/5">
                        <DataTable
                            columns={columns}
                            data={charges}
                            emptyMessage="No call charges yet."
                            onRowClick={(row) => setSelectedCharge(row)}
                        />
                    </GlassCard>
                </div>
            )}

            {/* Charge Details Drawer */}
            <Drawer open={!!selectedCharge} onOpenChange={(open) => !open && setSelectedCharge(null)}>
                <DrawerContent className="max-h-[85vh]">
                    <DrawerStickyHeader showClose>
                        <DrawerTitle className="font-sans text-xl font-semibold">Charge Details</DrawerTitle>
                        <DrawerDescription className="text-sm">
                            Detailed breakdown for this voice call charge.
                        </DrawerDescription>
                    </DrawerStickyHeader>
                    <DrawerBody>
                        {selectedCharge && <ChargeDetailContent charge={selectedCharge} currencyCode={currencyCode} />}
                    </DrawerBody>
                </DrawerContent>
            </Drawer>
        </div>
    )
}

function DetailRow({ label, value, highlight = false }: { label: string; value: React.ReactNode; highlight?: boolean }) {
    return (
        <div className={cn(
            "flex items-center justify-between gap-4 py-3 border-b border-brand-deep/5 dark:border-white/5 last:border-b-0",
            highlight && "text-rose-600 dark:text-rose-300"
        )}>
            <span className="text-xs font-medium text-brand-accent/70 dark:text-brand-cream/70">{label}</span>
            <span className={cn(
                "text-sm font-medium text-right",
                highlight ? "text-rose-700 dark:text-rose-300" : "text-brand-deep dark:text-brand-cream"
            )}>
                {value}
            </span>
        </div>
    )
}

function SectionHeader({ title }: { title: string }) {
    return (
        <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40">
                {title}
            </span>
            <div className="h-px flex-1 bg-brand-deep/5 dark:bg-white/5" />
        </div>
    )
}

function ChargeDetailContent({ charge, currencyCode }: { charge: VoiceCallCharge; currencyCode: string }) {
    const chargeCurrency = charge.currency || currencyCode
    const d = charge.createdAt ? new Date(charge.createdAt) : null
    const pd = charge.processedAt ? new Date(charge.processedAt) : null
    const dir = charge.metadata?.direction ?? "—"
    const dur = formatDuration(charge.metadata?.duration_seconds)
    const rate = formatRateDisplay(charge.metadata?.rate_per_minute, chargeCurrency)
    const hasShortfall = (charge.metadata?.shortfall ?? 0) > 0
    const balanceChange = charge.balanceBefore - charge.balanceAfter
    const DirIcon = getChargeDirectionIcon(dir)
    const isOutbound = dir.toLowerCase().includes("outbound")

    return (
        <div className="space-y-6 pb-4">
            {/* Hero amount with direction icon */}
            <div className="text-center py-6">
                <div className={cn(
                    "inline-flex h-14 w-14 items-center justify-center rounded-2xl mb-4",
                    isOutbound
                        ? "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300"
                        : "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300"
                )}>
                    <DirIcon className="h-7 w-7" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 mb-2">
                    Amount Charged
                </p>
                <p className="text-4xl font-serif font-semibold tabular-nums text-rose-700 dark:text-rose-300">
                    <CurrencyText value={`−${formatCurrency(charge.amount, { currency: chargeCurrency })}`} />
                </p>
                {hasShortfall && charge.metadata?.shortfall ? (
                    <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/5 dark:bg-amber-400/5 rounded-full px-3 py-1">
                        <AlertTriangle className="h-3 w-3" />
                        {formatCurrency(charge.metadata.shortfall, { currency: chargeCurrency })} shortfall covered
                    </p>
                ) : null}
            </div>

            {/* Section 1: Call Details */}
            <GlassCard className="rounded-2xl p-5 border-brand-deep/5 dark:border-white/5 space-y-0">
                <SectionHeader title="Call Details" />
                <DetailRow label="Direction" value={<span className="capitalize">{dir} Call</span>} />
                {charge.metadata?.callerNumber && (
                    <DetailRow label="Called" value={charge.metadata.callerNumber} />
                )}
                <DetailRow label="Duration" value={dur} />
                <DetailRow label="Rate" value={rate} />
            </GlassCard>

            {/* Section 2: Balance Impact */}
            <GlassCard className="rounded-2xl p-5 border-brand-deep/5 dark:border-white/5 space-y-0">
                <SectionHeader title="Balance Impact" />
                <DetailRow label="Balance Before" value={formatCurrency(charge.balanceBefore, { currency: chargeCurrency })} />
                <DetailRow label="Balance After" value={formatCurrency(charge.balanceAfter, { currency: chargeCurrency })} />
                <DetailRow
                    label="Change"
                    value={<span className="text-rose-600 dark:text-rose-300 font-semibold">−{formatCurrency(balanceChange, { currency: chargeCurrency })}</span>}
                />
            </GlassCard>

            {/* Section 3: Reference & Timing */}
            <GlassCard className="rounded-2xl p-5 border-brand-deep/5 dark:border-white/5 space-y-0">
                <SectionHeader title="Reference & Timing" />
                <DetailRow label="Reference ID" value={<span className="font-mono text-[11px]">{charge.reference}</span>} />
                {charge.externalReference && (
                    <DetailRow label="External Ref" value={<span className="font-mono text-[11px]">{charge.externalReference}</span>} />
                )}
                {d && !isNaN(d.getTime()) && (
                    <DetailRow label="Created" value={d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })} />
                )}
                {pd && !isNaN(pd.getTime()) && (
                    <DetailRow label="Processed" value={pd.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })} />
                )}
            </GlassCard>
        </div>
    )
}
