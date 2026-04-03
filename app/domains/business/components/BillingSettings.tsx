"use client"

import { useState } from "react"
import { toast } from "sonner"
import Link from "next/link"
import { GlassCard } from "@/app/components/ui/glass-card"
import { ListCard } from "@/app/components/ui/list-card"
import { PlanCard } from "@/app/components/billing/PlanCard"
import { Button } from "@/app/components/ui/button"
import { AlertCircle, Copy, CreditCard, Download, Loader2, FileText, ChevronRight, Lock, Wallet } from "lucide-react"
import { Switch } from "@/app/components/ui/switch"
import { Progress } from "@/app/components/ui/progress"
import { cn } from "@/app/lib/utils"
import { useBusiness } from "@/app/components/BusinessProvider"
import { useAuth } from "@/app/components/providers/auth-provider"
import {
    Drawer,
    DrawerContent,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose,
    DrawerStickyHeader,
    DrawerBody,
} from "@/app/components/ui/drawer"
import { PinInputDrawer } from "@/app/components/shared/PinInputDrawer"
import { AddFundsDrawer } from "@/app/components/shared/AddFundsDrawer"
import { CurrencyText } from "@/app/components/shared/CurrencyText"
import { ApiError } from "@/app/lib/api-client"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/app/components/ui/select"
import {
    type Plan,
    type BillingHistoryItem,
    useSubscriptionPlans,
    useCurrentSubscription,
    useInitiateSubscription,
    useSubscriptionQuote,
    usePaySubscriptionFromWallet,
    useUpdateRenewalPreference,
    useUsageStats,
    useDowngradeSubscription,
    useBillingHistory,
    useDownloadReceipt,
} from "../hooks/useBilling"

const formatPrice = (amount: number, currency: string = "NGN") => {
    const code = currency.length === 3 ? currency : currency === "₦" ? "NGN" : currency
    return new Intl.NumberFormat("en", {
        style: "currency",
        currency: code,
        currencyDisplay: "narrowSymbol",
        minimumFractionDigits: 0,
    }).format(amount)
}

/** e.g. `past_due` → "Past due", `trialing` → "Trialing" */
const formatSubscriptionStatusLabel = (raw: string) => {
    const normalized = raw.replace(/_/g, " ").trim()
    if (!normalized) return "Inactive"
    const lower = normalized.toLowerCase()
    return lower.charAt(0).toUpperCase() + lower.slice(1)
}


export function BillingSettings() {
    const { user } = useAuth()
    const { activeBusiness, businesses, isMultiBusinessRestricted, primaryBusinessId } = useBusiness()
    const ownerBusinesses = businesses.filter((b) => b.role === "OWNER")
    const [selectedWalletBusinessId, setSelectedWalletBusinessId] = useState<string | null>(null)
    const effectiveWalletId =
        selectedWalletBusinessId ?? activeBusiness?.id ?? ownerBusinesses[0]?.id ?? null
    const isWalletLocked = isMultiBusinessRestricted && !!primaryBusinessId
    const visibleWalletBusinesses = isWalletLocked
        ? ownerBusinesses.filter((b) => b.id === primaryBusinessId)
        : ownerBusinesses

    const { data: plans = [], isLoading: isLoadingPlans } = useSubscriptionPlans()
    const { data: subData, isLoading: isLoadingSub } = useCurrentSubscription(effectiveWalletId)
    const initiateSub = useInitiateSubscription()
    const payFromWallet = usePaySubscriptionFromWallet()
    const updateRenewalPref = useUpdateRenewalPreference()
    const downgradeSub = useDowngradeSubscription()
    const { data: billingHistory = [], isLoading: isLoadingHistory } =
        useBillingHistory(effectiveWalletId)
    const downloadReceipt = useDownloadReceipt()

    const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")

    const [selectedInvoice, setSelectedInvoice] = useState<BillingHistoryItem | null>(null)
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)

    const [checkoutOpen, setCheckoutOpen] = useState(false)
    const [checkoutPlanSlug, setCheckoutPlanSlug] = useState<string | null>(null)
    const [pinDrawerOpen, setPinDrawerOpen] = useState(false)
    const [addFundsOpen, setAddFundsOpen] = useState(false)

    const { data: checkoutQuote, isLoading: checkoutQuoteLoading } = useSubscriptionQuote(
        checkoutPlanSlug,
        billingCycle,
        effectiveWalletId,
        checkoutOpen && !!checkoutPlanSlug
    )

    const handlePlanSelect = (planSlug: string) => {
        const plan = plans.find((p) => p.slug === planSlug)
        const price =
            billingCycle === "yearly" ? (plan?.yearlyPrice || 0) : (plan?.monthlyPrice || 0)

        if (price === 0) {
            downgradeSub.mutate({
                planSlug,
                businessIdOverride: effectiveWalletId,
            })
        } else {
            setCheckoutPlanSlug(planSlug)
            setCheckoutOpen(true)
        }
    }

    const handleDownloadInvoice = (invoice: BillingHistoryItem) => {
        downloadReceipt.mutate({
            transactionId: invoice.id,
            businessIdOverride: effectiveWalletId,
        })
    }

    const handleInvoiceClick = (invoice: BillingHistoryItem) => {
        setSelectedInvoice(invoice)
        setIsDrawerOpen(true)
    }

    const { data: usage, isLoading: isLoadingUsage } = useUsageStats()

    if (isLoadingPlans || isLoadingSub) {
        return (
            <div className="flex flex-col items-center justify-center p-24 space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-brand-gold" />
                <p className="text-sm font-medium text-brand-deep/40 dark:text-brand-cream/40 animate-pulse">Loading Billing Details...</p>
            </div>
        )
    }

    const currentPlan = subData?.currentPlan
    const subscription = subData?.subscription
    const wallet = subData?.wallet

    const planBenefits = currentPlan?.benefits || {}
    const maxConversations = planBenefits.maxConversations
    const maxProducts = planBenefits.products

    const ownerCurrencyCode = user?.countryDetail?.currency?.code ?? "NGN"

    const currentPlanPrice = Number(billingCycle === "yearly" ? (currentPlan?.yearlyPrice || 0) : (currentPlan?.monthlyPrice || 0))

    /** Free tier has no billable period; an "expired" row from a past trial must not label the current plan as expired. */
    const isFreePlan =
        !subscription ||
        currentPlan?.slug === "starter" ||
        Number(currentPlan?.monthlyPrice ?? 0) === 0
    const subscriptionStatusRaw = subscription?.status ?? "Inactive"
    const subscriptionStatusLabel =
        isFreePlan &&
            ["expired", "canceled", "cancelled", "inactive"].includes(
                String(subscriptionStatusRaw).toLowerCase()
            )
            ? "Active"
            : formatSubscriptionStatusLabel(String(subscriptionStatusRaw))

    const isUnlimitedConversations = maxConversations === null || maxConversations === Infinity
    const isUnlimitedProducts = maxProducts === null || maxProducts === Infinity
    const isUnlimitedStaff = planBenefits.staffAccounts === null || planBenefits.staffAccounts === Infinity

    const conversationProgress = isUnlimitedConversations ? 0 : (usage ? (usage.conversations / Number(maxConversations)) * 100 : 0)
    const productProgress = isUnlimitedProducts ? 0 : (usage ? (usage.products / Number(maxProducts)) * 100 : 0)
    const staffProgress = isUnlimitedStaff ? 0 : (usage ? (usage.staffAccounts / Number(planBenefits.staffAccounts)) * 100 : 0)

    const isUnlimitedBusinesses = planBenefits.maxBusinesses === null || planBenefits.maxBusinesses === Infinity
    const businessProgress = isUnlimitedBusinesses ? 0 : (usage ? (usage.businesses / Number(planBenefits.maxBusinesses)) * 100 : 0)

    const subscriptionStatusNorm = subscription?.status?.toLowerCase() ?? ""

    const isDownloadingInvoice = (id: string) =>
        downloadReceipt.isPending &&
        (downloadReceipt.variables === id ||
            (typeof downloadReceipt.variables === "object" &&
                downloadReceipt.variables?.transactionId === id))

    return (
        <div className="space-y-8">
            {/* Current Subscription Status */}
            <section className="space-y-4">
                <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream pl-1">Subscription</h2>
                {isMultiBusinessRestricted && businesses.length > 1 && (
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-sm">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <p>
                            Your account is currently limited to your one business on the free plan.
                            Upgrade your subscription to re-enable access to your multiple businesses.
                        </p>
                    </div>
                )}
                <GlassCard className="p-6">
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="col-span-1 md:col-span-2 space-y-6">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-2xl font-serif text-brand-deep dark:text-brand-cream">
                                            {currentPlan?.name || 'Starter'} Plan
                                        </h3>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                            ["active", "trialing", "trialling"].includes(
                                                String(subscriptionStatusLabel).toLowerCase()
                                            )
                                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                        )}>
                                            {subscriptionStatusLabel}
                                        </span>
                                    </div>
                                    <p className="text-sm text-brand-deep/60 dark:text-brand-cream/60">
                                        {(() => {
                                            if (!subscription || currentPlan?.slug === "starter" || currentPlan?.monthlyPrice === 0) {
                                                return "Free forever. Upgrade anytime."
                                            }
                                            const amountEl = (
                                                <CurrencyText
                                                    value={formatPrice(Number(subscription.amount), ownerCurrencyCode)}
                                                    className="font-medium text-brand-deep/80 dark:text-brand-cream/80"
                                                />
                                            )
                                            const periodLabel = subscription.interval === "yearly" ? "year" : "month"

                                            if (subscriptionStatusNorm === "trialing" || subscriptionStatusNorm === "trialling") {
                                                return (
                                                    <>
                                                        Trial ends on{" "}
                                                        {subscription.trialEndsAt
                                                            ? new Date(subscription.trialEndsAt).toLocaleDateString()
                                                            : "—"}
                                                        . After that, {amountEl} per {periodLabel} — subscribe to continue using paid features.
                                                    </>
                                                )
                                            }

                                            if (subscriptionStatusNorm === "past_due" && subscription.trialEndsAt) {
                                                return (
                                                    <>
                                                        Your trial ends on{" "}
                                                        {new Date(subscription.trialEndsAt).toLocaleDateString()}.
                                                        Subscribe to continue at {amountEl} per {periodLabel}.
                                                    </>
                                                )
                                            }

                                            if (subscriptionStatusNorm === "past_due") {
                                                return (
                                                    <>
                                                        Payment overdue.
                                                        {subscription.endsAt ? (
                                                            <>
                                                                {" "}
                                                                Last period ended{" "}
                                                                {new Date(subscription.endsAt).toLocaleDateString()}.
                                                            </>
                                                        ) : null}{" "}
                                                        Pay {amountEl} to restore access.
                                                    </>
                                                )
                                            }

                                            if (subscriptionStatusNorm === "active") {
                                                return (
                                                    <>
                                                        Renews automatically on{" "}
                                                        {subscription.endsAt
                                                            ? new Date(subscription.endsAt).toLocaleDateString()
                                                            : "—"}{" "}
                                                        for {amountEl}
                                                    </>
                                                )
                                            }

                                            return (
                                                <>
                                                    {subscription.endsAt ? (
                                                        <>
                                                            Next period {new Date(subscription.endsAt).toLocaleDateString()} —{" "}
                                                        </>
                                                    ) : null}
                                                    {amountEl}
                                                </>
                                            )
                                        })()}
                                    </p>
                                </div>
                            </div>

                            {/* Usage Stats */}
                            <div className="space-y-4 pt-4 border-t border-brand-deep/5 dark:border-white/5">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="text-brand-deep/60 dark:text-brand-cream/60">Conversations</span>
                                        <span className="text-brand-deep dark:text-brand-cream">
                                            {isLoadingUsage ? "Loading..." : `${usage?.conversations || 0} / ${isUnlimitedConversations ? "∞" : maxConversations}`}
                                        </span>
                                    </div>
                                    <Progress value={conversationProgress} className="h-1.5" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="text-brand-deep/60 dark:text-brand-cream/60">Products</span>
                                        <span className="text-brand-deep dark:text-brand-cream">
                                            {isLoadingUsage ? "Loading..." : `${usage?.products || 0} / ${isUnlimitedProducts ? "∞" : maxProducts}`}
                                        </span>
                                    </div>
                                    <Progress value={productProgress} className="h-1.5" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="text-brand-deep/60 dark:text-brand-cream/60">Staff Accounts</span>
                                        <span className="text-brand-deep dark:text-brand-cream">
                                            {isLoadingUsage ? "Loading..." : `${usage?.staffAccounts || 0} / ${isUnlimitedStaff ? "∞" : planBenefits.staffAccounts}`}
                                        </span>
                                    </div>
                                    <Progress value={staffProgress} className="h-1.5" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="text-brand-deep/60 dark:text-brand-cream/60">Businesses Used</span>
                                        <span className="text-brand-deep dark:text-brand-cream">
                                            {isLoadingUsage ? "Loading..." : `${usage?.businesses || 0} / ${isUnlimitedBusinesses ? "∞" : planBenefits.maxBusinesses}`}
                                        </span>
                                    </div>
                                    <Progress value={businessProgress} className="h-1.5" />
                                </div>
                            </div>
                        </div>

                        {/* Wallet Funding Card */}
                        <div className="p-4 rounded-3xl bg-brand-deep/5 dark:bg-white/5 border border-brand-deep/5 dark:border-white/5 flex flex-col justify-between transition-colors duration-200">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-brand-deep dark:text-brand-cream font-medium">
                                    <div className="w-5 h-5 rounded-full bg-brand-gold/20 flex items-center justify-center shrink-0">
                                        <Wallet className="w-3 h-3 text-brand-gold" />
                                    </div>
                                    <span className="text-sm">Wallet Funding</span>
                                </div>

                                <div
                                    key={effectiveWalletId ?? "none"}
                                    className="p-4 bg-white dark:bg-brand-deep-500 rounded-2xl border border-brand-deep/5 dark:border-white/5 min-h-18 flex flex-col justify-center transition-opacity duration-200"
                                >
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40">
                                        Current Balance
                                    </span>
                                    {isLoadingSub ? (
                                        <span className="mt-0.5 text-2xl font-serif tabular-nums text-brand-deep dark:text-brand-cream">
                                            Loading...
                                        </span>
                                    ) : (
                                        <CurrencyText
                                            value={
                                                wallet
                                                    ? formatPrice(wallet.balance, wallet.currency)
                                                    : formatPrice(0, ownerCurrencyCode)
                                            }
                                            className="mt-0.5 text-2xl font-serif tabular-nums text-brand-deep dark:text-brand-cream"
                                        />
                                    )}
                                </div>

                                <p className="text-[10px] text-brand-deep/40 dark:text-brand-cream/40 leading-relaxed italic">
                                    Fund your wallet to ensure automatic renewal of your{" "}
                                    {currentPlan?.name || "Starter"} plan.
                                </p>

                                {subData?.renewalPreference && (
                                    <div className="space-y-3 pt-4 border-t border-brand-deep/10 dark:border-white/10">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40">
                                            Renewal preferences
                                        </p>
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-xs text-brand-deep/80 dark:text-brand-cream/80">
                                                Auto-renew from wallet
                                            </span>
                                            <Switch
                                                checked={subData.renewalPreference.walletDeductionEnabled !== false}
                                                disabled={updateRenewalPref.isPending}
                                                onCheckedChange={(v) =>
                                                    updateRenewalPref.mutate({
                                                        walletDeductionEnabled: v,
                                                        businessIdOverride: effectiveWalletId,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-xs text-brand-deep/80 dark:text-brand-cream/80">
                                                Card/bank only (no wallet auto-debit)
                                            </span>
                                            <Switch
                                                checked={
                                                    subData.renewalPreference.autoRenewalMode ===
                                                    "gateway_only"
                                                }
                                                disabled={updateRenewalPref.isPending}
                                                onCheckedChange={(v) =>
                                                    updateRenewalPref.mutate({
                                                        autoRenewalMode: v ? "gateway_only" : "wallet",
                                                        businessIdOverride: effectiveWalletId,
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
                                {visibleWalletBusinesses.length > 1 && (
                                    <Select
                                        value={effectiveWalletId ?? ""}
                                        onValueChange={(id) => setSelectedWalletBusinessId(id || null)}
                                    >
                                        <SelectTrigger
                                            className={cn(
                                                "cursor-pointer rounded-xl h-10 text-xs font-medium border-brand-deep/10 dark:border-white/10",
                                                "transition-[border-color,box-shadow] duration-200",
                                                "focus:ring-2 focus:ring-brand-gold/20 dark:focus:ring-brand-gold/30",
                                                "sm:flex-1 min-w-0"
                                            )}
                                            aria-label="Select wallet to fund or pay from"
                                        >
                                            <SelectValue placeholder="Select wallet" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            {visibleWalletBusinesses.map((b) => (
                                                <SelectItem
                                                    key={b.id}
                                                    value={b.id}
                                                    className="text-sm rounded-lg focus:bg-brand-gold/10"
                                                >
                                                    {b.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "text-xs h-10 rounded-xl border-brand-gold/20 hover:bg-brand-gold/5 text-brand-deep dark:text-brand-cream",
                                        "transition-colors duration-200 shrink-0",
                                        visibleWalletBusinesses.length > 1 ? "sm:w-auto sm:flex-initial" : "w-full"
                                    )}
                                    onClick={() => setAddFundsOpen(true)}
                                >
                                    <Wallet className="w-3.5 h-3.5 mr-2 shrink-0" />
                                    Fund Wallet
                                </Button>
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </section>

            {/* Available Plans */}
            <section id="plans" className="space-y-6 scroll-mt-24">
                <div className="flex items-center justify-between">
                    <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream pl-1">Available Plans</h2>
                    <div className="flex items-center gap-2 p-1 bg-brand-deep/5 dark:bg-white/5 rounded-lg">
                        <button
                            onClick={() => setBillingCycle("monthly")}
                            className={cn(
                                "px-3 py-1 rounded-md text-xs font-bold shadow-sm transition-all",
                                billingCycle === "monthly"
                                    ? "bg-white dark:bg-white/10 text-brand-deep dark:text-brand-cream"
                                    : "text-brand-deep/60 dark:text-brand-cream/60 hover:bg-white/40"
                            )}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingCycle("yearly")}
                            className={cn(
                                "px-3 py-1 rounded-md text-xs font-bold shadow-sm transition-all",
                                billingCycle === "yearly"
                                    ? "bg-white dark:bg-white/10 text-brand-deep dark:text-brand-cream"
                                    : "text-brand-deep/60 dark:text-brand-cream/60 hover:bg-white/40"
                            )}
                        >
                            Yearly (-20%)
                        </button>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {plans.map((plan: Plan) => (
                        <PlanCard
                            key={plan.id}
                            name={plan.name}
                            description={plan.description}
                            price={billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice}
                            currency={ownerCurrencyCode}
                            currentPlanPrice={currentPlanPrice}
                            interval={billingCycle === "yearly" ? "year" : "month"}
                            features={plan.features}
                            isRecommended={plan.slug === 'growth'}
                            isCurrent={(currentPlan?.slug === plan.slug || (!currentPlan && plan.slug === 'starter')) && (plan.monthlyPrice === 0 || subscription?.interval === billingCycle)}
                            isLoading={
                                (initiateSub.isPending && initiateSub.variables?.planSlug === plan.slug) ||
                                (payFromWallet.isPending &&
                                    payFromWallet.variables?.planSlug === plan.slug) ||
                                (downgradeSub.isPending &&
                                    (downgradeSub.variables === plan.slug ||
                                        (typeof downgradeSub.variables === "object" &&
                                            downgradeSub.variables?.planSlug === plan.slug)))
                            }
                            onSelect={() => handlePlanSelect(plan.slug)}
                        />
                    ))}
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>Downgrading your plan may result in loss of access to certain features (e.g., staff accounts, analytics history) at the end of your complete billing cycle.</p>
                </div>
            </section>

            {/* Billing History */}
            <section className="space-y-4">
                <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream pl-1">Billing History</h2>

                {/* Desktop Table View */}
                <GlassCard className="hidden md:block overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-brand-deep/5 dark:bg-white/5 text-brand-deep/60 dark:text-brand-cream/60 font-medium">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Description</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-deep/5 dark:divide-white/5">
                            {billingHistory?.map((invoice) => (
                                <tr
                                    key={invoice.id}
                                    className="border-t border-border/50 group hover:bg-brand-gold/5 transition-colors cursor-pointer"
                                    onClick={() => handleInvoiceClick(invoice)}
                                >
                                    <td className="px-6 py-4 text-sm text-brand-deep/60">{invoice.date}</td>
                                    <td className="px-6 py-4 text-sm font-medium">{invoice.description}</td>
                                    <td className="px-6 py-4 text-sm font-medium">
                                        <CurrencyText value={formatPrice(invoice.amount, invoice.currency)} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                                            invoice.status === 'Paid'
                                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                        )}>
                                            {invoice.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end items-center">
                                            <ChevronRight className="h-5 w-5 text-brand-deep/20 group-hover:text-brand-gold transition-colors" />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!isLoadingHistory && billingHistory.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-brand-deep/20 dark:text-brand-cream/20" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-brand-deep/60 dark:text-brand-cream/60">No billing history found</p>
                                <p className="text-xs text-brand-deep/40 dark:text-brand-cream/40">Your invoices and receipts will appear here.</p>
                            </div>
                        </div>
                    )}
                </GlassCard>

                {/* Mobile List View */}
                <div className="md:hidden space-y-3">
                    {billingHistory?.map((item) => (
                        <ListCard
                            key={item.id}
                            title={item.description}
                            subtitle={item.date}
                            status={item.status}
                            statusColor={item.status === 'Paid' ? 'success' : 'warning'}
                            value={
                                <CurrencyText
                                    value={formatPrice(item.amount, item.currency)}
                                    className="font-semibold"
                                />
                            }
                            onClick={() => handleInvoiceClick(item)}
                        />
                    ))}
                    {!isLoadingHistory && (!billingHistory || billingHistory.length === 0) && (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-3 bg-brand-deep/5 dark:bg-white/5 rounded-3xl border border-dashed border-brand-deep/10 dark:border-white/10">
                            <FileText className="w-8 h-8 text-brand-deep/20 dark:text-brand-cream/20" />
                            <p className="text-sm font-medium text-brand-deep/40 dark:text-brand-cream/40">No billing history found</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Subscription checkout — wallet vs gateway (Calm Intelligence: glass, serif, gold accent) */}
            <Drawer
                open={checkoutOpen}
                onOpenChange={(open) => {
                    setCheckoutOpen(open)
                    if (!open) {
                        setCheckoutPlanSlug(null)
                        setPinDrawerOpen(false)
                    }
                }}
            >
                <DrawerContent className="max-w-2xl mx-auto max-h-[92vh] flex flex-col rounded-t-[32px] border border-brand-deep/5 dark:border-white/10 bg-brand-cream dark:bg-brand-deep-900 shadow-2xl">
                    <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-brand-gold/40 to-transparent" />
                    <DrawerStickyHeader className="pb-4 border-b border-brand-deep/5 dark:border-white/5">
                        <div className="text-center w-full space-y-2 pr-10">
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-deep/35 dark:text-brand-cream/35">
                                Complete payment
                            </p>
                            <DrawerTitle className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream tracking-tight">
                                {checkoutPlanSlug
                                    ? plans.find((p) => p.slug === checkoutPlanSlug)?.name ?? "Plan"
                                    : "Plan"}
                            </DrawerTitle>
                            <DrawerDescription className="text-sm text-brand-deep/55 dark:text-brand-cream/55 leading-relaxed max-w-md mx-auto">
                                Choose how you would like to pay. Card and bank transfers are processed by
                                our payment partner — they may show additional fees at checkout.
                            </DrawerDescription>
                        </div>
                    </DrawerStickyHeader>

                    <DrawerBody className="flex-1 overflow-y-auto px-6 md:px-8 pt-2 pb-4">
                        {checkoutQuoteLoading ? (
                            <div className="flex justify-center py-16">
                                <Loader2 className="w-10 h-10 animate-spin text-brand-gold" />
                            </div>
                        ) : checkoutQuote ? (
                            <div className="space-y-6">
                                <GlassCard className="p-6 space-y-4 border-brand-gold/15 bg-brand-gold/3 dark:bg-white/3 shadow-sm">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40">
                                            Plan amount
                                        </span>
                                        <CurrencyText
                                            value={formatPrice(checkoutQuote.baseAmount, checkoutQuote.currency)}
                                            className="text-xl font-serif font-semibold tabular-nums text-brand-deep dark:text-brand-cream"
                                        />
                                    </div>
                                    {checkoutQuote.wallet ? (
                                        <div className="pt-3 border-t border-brand-deep/10 dark:border-white/10 space-y-1">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-brand-deep/50 dark:text-brand-cream/50">
                                                    Business wallet
                                                </span>
                                                <CurrencyText
                                                    value={formatPrice(
                                                        checkoutQuote.wallet.balance,
                                                        checkoutQuote.wallet.currency
                                                    )}
                                                    className="font-medium tabular-nums text-brand-deep dark:text-brand-cream"
                                                />
                                            </div>
                                            {!checkoutQuote.wallet.sufficient ? (
                                                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                                    Insufficient balance for this plan. Fund your wallet or
                                                    pay with card.
                                                </p>
                                            ) : !user?.hasTransactionPin ? (
                                                <p className="text-xs text-brand-deep/50 dark:text-brand-cream/50 leading-relaxed flex items-start gap-2">
                                                    <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5 text-brand-gold" />
                                                    <span>
                                                        Set a 4-digit transaction PIN in Security to pay from
                                                        your wallet.{" "}
                                                        <Link
                                                            href="/settings?tab=security"
                                                            className="font-semibold text-brand-gold underline-offset-2 hover:underline"
                                                        >
                                                            Set up PIN
                                                        </Link>
                                                    </span>
                                                </p>
                                            ) : null}
                                        </div>
                                    ) : null}
                                </GlassCard>
                            </div>
                        ) : null}
                    </DrawerBody>

                    <DrawerFooter className="flex-col gap-3 border-t border-brand-deep/5 dark:border-white/5 bg-brand-cream/80 dark:bg-brand-deep-900/95 backdrop-blur-md">
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full h-12 rounded-2xl border-brand-deep/15 dark:border-white/15 text-brand-deep dark:text-brand-cream hover:bg-brand-deep/5 dark:hover:bg-white/5"
                            disabled={
                                !checkoutQuote?.wallet?.sufficient ||
                                !user?.hasTransactionPin ||
                                payFromWallet.isPending ||
                                initiateSub.isPending
                            }
                            onClick={() => {
                                if (!checkoutPlanSlug || !effectiveWalletId) return
                                if (!checkoutQuote?.wallet?.sufficient) return
                                if (!user?.hasTransactionPin) {
                                    toast.error(
                                        "Set a transaction PIN in Security settings to pay from your wallet."
                                    )
                                    return
                                }
                                setPinDrawerOpen(true)
                            }}
                        >
                            <Wallet className="w-4 h-4 mr-2 shrink-0" />
                            Pay from wallet
                        </Button>
                        <Button
                            type="button"
                            className="w-full h-12 rounded-2xl bg-brand-gold text-brand-deep hover:bg-brand-gold/90 font-semibold shadow-lg shadow-brand-gold/20"
                            disabled={initiateSub.isPending || payFromWallet.isPending}
                            onClick={() => {
                                if (!checkoutPlanSlug || !effectiveWalletId) return
                                initiateSub.mutate({
                                    planSlug: checkoutPlanSlug,
                                    interval: billingCycle,
                                    businessIdOverride: effectiveWalletId,
                                })
                            }}
                        >
                            <CreditCard className="w-4 h-4 mr-2 shrink-0" />
                            Pay with card / bank
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>

            <PinInputDrawer
                open={pinDrawerOpen}
                onOpenChange={setPinDrawerOpen}
                title="Confirm wallet payment"
                description="Enter your 4-digit transaction PIN to debit your business wallet for this subscription."
                onSubmit={async (pin) => {
                    if (!checkoutPlanSlug || !effectiveWalletId) {
                        throw new Error("Checkout expired. Please try again.")
                    }
                    try {
                        await payFromWallet.mutateAsync({
                            planSlug: checkoutPlanSlug,
                            interval: billingCycle,
                            pin,
                            businessIdOverride: effectiveWalletId,
                        })
                        setCheckoutOpen(false)
                        setCheckoutPlanSlug(null)
                    } catch (err) {
                        const message =
                            err instanceof ApiError
                                ? err.message
                                : err instanceof Error
                                    ? err.message
                                    : "Payment failed"
                        throw new Error(message)
                    }
                }}
            />

            <AddFundsDrawer
                isOpen={addFundsOpen}
                onOpenChange={setAddFundsOpen}
                currencyCode={wallet?.currency ?? ownerCurrencyCode}
            />

            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <DrawerContent>
                    <DrawerStickyHeader className="text-left">
                        <DrawerTitle>Invoice Details</DrawerTitle>
                        <DrawerDescription>
                            Review details for this billing period.
                        </DrawerDescription>
                    </DrawerStickyHeader>

                    {selectedInvoice && (
                        <DrawerBody className="space-y-6 p-4">
                            <div className="flex flex-row items-start justify-between gap-4 rounded-2xl bg-brand-deep/5 px-4 py-4 dark:bg-white/5 sm:gap-6 sm:px-6">
                                <div className="min-w-0 flex-1 space-y-1.5">
                                    <span className="block text-xs font-medium uppercase tracking-wider text-brand-deep/60 dark:text-brand-cream/60">
                                        Status
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={cn(
                                                "h-2 w-2 shrink-0 rounded-full",
                                                selectedInvoice.status === "Paid" ? "bg-emerald-500" : "bg-amber-500"
                                            )}
                                        />
                                        <span className="text-sm font-bold text-brand-deep dark:text-brand-cream">
                                            {selectedInvoice.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="min-w-0 flex-1 space-y-1.5 text-right">
                                    <span className="block text-xs font-medium uppercase tracking-wider text-brand-deep/60 dark:text-brand-cream/60">
                                        Amount
                                    </span>
                                    <CurrencyText
                                        value={formatPrice(selectedInvoice.amount, selectedInvoice.currency)}
                                        className="inline-flex justify-end text-xl font-serif text-brand-deep dark:text-brand-cream"
                                    />
                                </div>
                            </div>
                            <div className="space-y-0">
                                <div className="flex flex-col gap-2 border-b border-brand-deep/5 py-3 dark:border-white/5 md:flex-row md:items-center md:justify-between md:gap-4">
                                    <span className="w-full shrink-0 text-sm text-brand-deep/60 dark:text-brand-cream/60 md:max-w-[40%]">
                                        Reference
                                    </span>
                                    <div className="flex w-full min-w-0 items-center gap-2 md:flex-1 md:justify-end">
                                        <span
                                            className="min-w-0 flex-1 truncate font-mono text-sm text-brand-deep dark:text-brand-cream md:text-right"
                                            title={selectedInvoice.reference}
                                        >
                                            {selectedInvoice.reference}
                                        </span>
                                        <button
                                            type="button"
                                            className="shrink-0 rounded-lg p-1.5 text-brand-deep/45 transition-colors hover:bg-brand-deep/5 hover:text-brand-deep dark:text-brand-cream/45 dark:hover:bg-white/10 dark:hover:text-brand-cream"
                                            aria-label="Copy reference"
                                            onClick={() => {
                                                void navigator.clipboard.writeText(selectedInvoice.reference).then(() => {
                                                    toast.success("Reference copied")
                                                })
                                            }}
                                        >
                                            <Copy className="h-4 w-4" aria-hidden />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1 border-b border-brand-deep/5 py-3 dark:border-white/5 md:flex-row md:items-start md:justify-between md:gap-4">
                                    <span className="w-full shrink-0 text-sm text-brand-deep/60 dark:text-brand-cream/60 md:max-w-[40%]">
                                        Date
                                    </span>
                                    <span className="w-full text-sm text-brand-deep dark:text-brand-cream md:text-right">
                                        {selectedInvoice.date}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1 border-b border-brand-deep/5 py-3 dark:border-white/5 md:flex-row md:items-start md:justify-between md:gap-4">
                                    <span className="w-full shrink-0 text-sm text-brand-deep/60 dark:text-brand-cream/60 md:max-w-[40%]">
                                        Description
                                    </span>
                                    <span className="w-full text-sm text-brand-deep dark:text-brand-cream md:text-right">
                                        {selectedInvoice.description}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1 py-4 text-brand-deep dark:text-brand-cream md:flex-row md:items-baseline md:justify-between md:gap-4">
                                    <span className="w-full text-sm font-medium md:max-w-[40%]">Total Amount</span>
                                    <CurrencyText
                                        value={formatPrice(selectedInvoice.amount, selectedInvoice.currency)}
                                        className="w-full text-xl font-serif font-bold md:inline-flex md:w-auto md:justify-end"
                                    />
                                </div>
                            </div>
                        </DrawerBody>
                    )}

                    <DrawerFooter>
                        <Button
                            className="w-full h-12 rounded-xl text-md font-bold"
                            onClick={() => selectedInvoice && handleDownloadInvoice(selectedInvoice)}
                            disabled={!selectedInvoice || isDownloadingInvoice(selectedInvoice?.id ?? "")}
                        >
                            <Download className="h-5 w-5 mr-2" />
                            {isDownloadingInvoice(selectedInvoice?.id ?? "") ? "Preparing..." : "Download Receipt"}
                        </Button>
                        <DrawerClose asChild>
                            <Button variant="outline" className="w-full h-12 rounded-xl border-brand-deep/10 dark:border-white/10 hover:bg-brand-deep/5 dark:hover:bg-white/5">
                                Close
                            </Button>
                        </DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </div>
    )
}
