"use client"

import { useState } from "react"
import { toast } from "sonner"
import { GlassCard } from "@/app/components/ui/glass-card"
import { ListCard } from "@/app/components/ui/list-card"
import { PlanCard } from "@/app/components/billing/PlanCard"
import { Button } from "@/app/components/ui/button"
import { CreditCard, AlertCircle, Download, Loader2, FileText, ChevronRight } from "lucide-react"
import { Progress } from "@/app/components/ui/progress"
import { cn } from "@/app/lib/utils"
import { useBusiness } from "@/app/components/BusinessProvider"
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose,
} from "@/app/components/ui/drawer"
import {
    type Plan,
    type BillingHistoryItem,
    useSubscriptionPlans,
    useCurrentSubscription,
    useInitiateSubscription,
    useUsageStats,
    useDowngradeSubscription,
    useBillingHistory,
    useDownloadReceipt,
} from "../hooks/useBilling"

const formatPrice = (amount: number, currency: string = "₦") => {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: currency === "₦" ? 'NGN' : currency,
        minimumFractionDigits: 0,
    }).format(amount).replace('NGN', '₦')
}


export function BillingSettings() {
    const { activeBusiness } = useBusiness()
    const { data: plans = [], isLoading: isLoadingPlans } = useSubscriptionPlans()
    const { data: subData, isLoading: isLoadingSub } = useCurrentSubscription()
    const initiateSub = useInitiateSubscription()
    const downgradeSub = useDowngradeSubscription()
    const { data: billingHistory = [], isLoading: isLoadingHistory } = useBillingHistory()
    const downloadReceipt = useDownloadReceipt()

    const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")

    // Drawer state for mobile invoice details
    const [selectedInvoice, setSelectedInvoice] = useState<BillingHistoryItem | null>(null)
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)

    const handlePlanSelect = (planSlug: string) => {
        const plan = plans.find(p => p.slug === planSlug)
        const price = billingCycle === "yearly" ? (plan?.yearlyPrice || 0) : (plan?.monthlyPrice || 0)

        if (price === 0) {
            downgradeSub.mutate(planSlug)
        } else {
            initiateSub.mutate({
                planSlug,
                interval: billingCycle,
            })
        }
    }

    const handleDownloadInvoice = (invoice: BillingHistoryItem) => {
        downloadReceipt.mutate(invoice.id)
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

    // Use business currency if available
    const currency = activeBusiness?.currency || currentPlan?.currency || "₦"

    const currentPlanPrice = Number(billingCycle === "yearly" ? (currentPlan?.yearlyPrice || 0) : (currentPlan?.monthlyPrice || 0))

    const isUnlimitedConversations = maxConversations === null || maxConversations === Infinity
    const isUnlimitedProducts = maxProducts === null || maxProducts === Infinity
    const isUnlimitedStaff = planBenefits.staffAccounts === null || planBenefits.staffAccounts === Infinity

    const conversationProgress = isUnlimitedConversations ? 0 : (usage ? (usage.conversations / Number(maxConversations)) * 100 : 0)
    const productProgress = isUnlimitedProducts ? 0 : (usage ? (usage.products / Number(maxProducts)) * 100 : 0)
    const staffProgress = isUnlimitedStaff ? 0 : (usage ? (usage.staffAccounts / Number(planBenefits.staffAccounts)) * 100 : 0)

    const isUnlimitedBusinesses = planBenefits.maxBusinesses === null || planBenefits.maxBusinesses === Infinity
    const businessProgress = isUnlimitedBusinesses ? 0 : (usage ? (usage.businesses / Number(planBenefits.maxBusinesses)) * 100 : 0)


    return (
        <div className="space-y-8">
            {/* Current Subscription Status */}
            <section className="space-y-4">
                <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream pl-1">Subscription</h2>
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
                                            subscription?.status === 'active'
                                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                        )}>
                                            {subscription?.status || 'Inactive'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-brand-deep/60 dark:text-brand-cream/60">
                                        {(() => {
                                            if (!subscription || currentPlan?.slug === 'starter' || currentPlan?.monthlyPrice === 0) {
                                                return "Free forever. Upgrade anytime."
                                            }
                                            if (subscription.status === 'trialling') {
                                                return `Trial ends on ${subscription.trialEndsAt ? new Date(subscription.trialEndsAt).toLocaleDateString() : 'N/A'}. Renews for ${formatPrice(Number(subscription.amount), currency)} thereafter.`
                                            }
                                            return `Renews automatically on ${subscription.endsAt ? new Date(subscription.endsAt).toLocaleDateString() : 'N/A'} for ${formatPrice(Number(subscription.amount), currency)}`
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
                        <div className="p-4 rounded-3xl bg-brand-deep/5 dark:bg-white/5 border border-brand-deep/5 dark:border-white/5 flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-brand-deep dark:text-brand-cream font-medium">
                                    <div className="w-5 h-5 rounded-full bg-brand-gold/20 flex items-center justify-center">
                                        <FileText className="w-3 h-3 text-brand-gold" />
                                    </div>
                                    <span className="text-sm">Wallet Funding</span>
                                </div>

                                <div className="p-4 bg-white dark:bg-brand-deep-500 rounded-2xl border border-brand-deep/5 dark:border-white/5">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40">Current Balance</span>
                                        <span className="text-2xl font-serif text-brand-deep dark:text-brand-cream">
                                            {wallet ? formatPrice(wallet.balance, wallet.currency) : formatPrice(0, currency)}
                                        </span>
                                    </div>
                                </div>

                                <p className="text-[10px] text-brand-deep/40 dark:text-brand-cream/40 leading-relaxed italic">
                                    Fund your wallet to ensure automatic renewal of your {currentPlan?.name || 'Starter'} plan.
                                </p>
                            </div>

                            <Button
                                variant="outline"
                                className="w-full text-xs h-10 mt-4 rounded-xl border-brand-gold/20 hover:bg-brand-gold/5 text-brand-deep dark:text-brand-cream"
                                onClick={() => {
                                    // Funding flow would go here
                                    toast.info("Wallet funding feature coming soon")
                                }}
                            >
                                Fund Wallet
                            </Button>
                        </div>
                    </div>
                </GlassCard>
            </section>

            {/* Available Plans */}
            <section className="space-y-6">
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
                            currency={currency}
                            currentPlanPrice={currentPlanPrice}
                            interval={billingCycle === "yearly" ? "year" : "month"}
                            features={plan.features}
                            isRecommended={plan.slug === 'growth'}
                            isCurrent={(currentPlan?.slug === plan.slug || (!currentPlan && plan.slug === 'starter')) && (plan.monthlyPrice === 0 || subscription?.interval === billingCycle)}
                            isLoading={(initiateSub.isPending && initiateSub.variables?.planSlug === plan.slug) || (downgradeSub.isPending && downgradeSub.variables === plan.slug)}
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
                                    <td className="px-6 py-4 text-sm font-medium">{formatPrice(invoice.amount, invoice.currency)}</td>
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
                            value={formatPrice(item.amount, item.currency)}
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

            {/* Mobile Invoice Drawer */}
            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <DrawerContent>
                    <DrawerHeader className="text-left">
                        <DrawerTitle>Invoice Details</DrawerTitle>
                        <DrawerDescription>
                            Review details for this billing period.
                        </DrawerDescription>
                    </DrawerHeader>

                    {selectedInvoice && (
                        <div className="p-4 space-y-6">
                            <div className="flex items-center justify-between py-2 px-4 sm:py-3 sm:px-6 rounded-3xl bg-brand-deep/5 dark:bg-white/5">
                                <div className="space-y-1">
                                    <span className="text-xs text-brand-deep/60 dark:text-brand-cream/60 uppercase tracking-wider font-medium">Status</span>
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "w-2 h-2 rounded-full",
                                            selectedInvoice.status === 'Paid' ? "bg-emerald-500" : "bg-amber-500"
                                        )} />
                                        <span className="text-sm font-bold text-brand-deep dark:text-brand-cream">{selectedInvoice.status}</span>
                                    </div>
                                </div>
                                <div className="text-right space-y-1">
                                    <span className="text-xs text-brand-deep/60 dark:text-brand-cream/60 uppercase tracking-wider font-medium">Amount</span>
                                    <div className="text-xl font-serif text-brand-deep dark:text-brand-cream">{formatPrice(selectedInvoice.amount, selectedInvoice.currency)}</div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-start py-3 border-b border-brand-deep/5 dark:border-white/5">
                                    <span className="text-brand-deep/60 dark:text-brand-cream/60 text-sm shrink-0">Reference</span>
                                    <span className="text-sm font-mono text-right break-all ml-4">{selectedInvoice?.reference}</span>
                                </div>
                                <div className="flex justify-between items-start py-3 border-b border-brand-deep/5 dark:border-white/5">
                                    <span className="text-brand-deep/60 dark:text-brand-cream/60 text-sm shrink-0">Date</span>
                                    <span className="text-sm text-right">{selectedInvoice?.date}</span>
                                </div>
                                <div className="flex justify-between items-start py-3 border-b border-brand-deep/5 dark:border-white/5">
                                    <span className="text-brand-deep/60 dark:text-brand-cream/60 text-sm shrink-0">Description</span>
                                    <span className="text-sm text-right ml-4">{selectedInvoice?.description}</span>
                                </div>
                                <div className="flex justify-between items-center py-4 text-brand-deep dark:text-brand-cream">
                                    <span className="text-sm font-medium">Total Amount</span>
                                    <span className="text-xl font-serif font-bold">
                                        {selectedInvoice && formatPrice(selectedInvoice.amount, selectedInvoice.currency)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <DrawerFooter>
                        <Button
                            className="w-full h-12 rounded-xl text-md font-bold"
                            onClick={() => selectedInvoice && handleDownloadInvoice(selectedInvoice)}
                            disabled={!selectedInvoice || (downloadReceipt.isPending && downloadReceipt.variables === selectedInvoice?.id)}
                        >
                            <Download className="h-5 w-5 mr-2" />
                            {downloadReceipt.isPending && downloadReceipt.variables === selectedInvoice?.id ? "Preparing..." : "Download Receipt"}
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
