"use client"

import { useState } from "react"
import { GlassCard } from "@/app/components/ui/glass-card"
import { ListCard } from "@/app/components/ui/list-card"
import { PlanCard } from "@/app/components/billing/PlanCard"
import { Button } from "@/app/components/ui/button"
import { CreditCard, Zap, Calendar, AlertCircle, Download } from "lucide-react"
import { Progress } from "@/app/components/ui/progress"
import { toast } from "sonner"
import { cn } from "@/app/lib/utils"

const PLANS = [
    {
        id: "starter",
        name: "Starter",
        slug: "starter",
        price: 0,
        description: "For individuals and small retail/services businesses.",
        features: [
            "20 Products",
            "100 Monthly Conversations",
            "Single User Account",
            "Basic Analytics",
            "Cloove Domain"
        ]
    },
    {
        id: "growth",
        name: "Growth",
        slug: "growth",
        price: 5000,
        description: "For established businesses looking to scale operations.",
        features: [
            "Unlimited Products",
            "3 Staff Accounts",
            "500 Monthly Conversations",
            "Advanced Analytics",
            "Custom Domain Connection",
            "Expense & Debt Tracking"
        ],
        isRecommended: true
    },
    {
        id: "scale",
        name: "Scale",
        slug: "scale",
        price: 15000,
        description: "Comprehensive features for enterprise-level operations.",
        features: [
            "Unlimited Products",
            "Unlimited Staff Accounts",
            "Unlimited Conversations",
            "Priority Support",
            "API Access",
            "Dedicated Account Manager"
        ]
    }
]

const BILLING_HISTORY = [
    {
        id: "inv_1",
        date: "Feb 1, 2026",
        description: "Growth Plan (Monthly)",
        amount: "₦5,000",
        status: "Paid",
        statusColor: "success" as const
    },
    {
        id: "inv_2",
        date: "Jan 1, 2026",
        description: "Growth Plan (Monthly)",
        amount: "₦5,000",
        status: "Paid",
        statusColor: "success" as const
    }
]

export function BillingSettings() {
    const [currentPlanId, setCurrentPlanId] = useState("starter")
    const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null)
    const [billingCycle, setBillingCycle] = useState<"month" | "year">("month")

    const handlePlanSelect = (planId: string) => {
        setLoadingPlanId(planId)

        // Simulate API call
        setTimeout(() => {
            setCurrentPlanId(planId)
            setLoadingPlanId(null)
            toast.success(`Successfully switched to ${PLANS.find(p => p.id === planId)?.name} Plan`)
        }, 1500)
    }

    const currentPlan = PLANS.find(p => p.id === currentPlanId) || PLANS[0]

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
                                            {currentPlan.name} Plan
                                        </h3>
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                                            Active
                                        </span>
                                    </div>
                                    <p className="text-sm text-brand-deep/60 dark:text-brand-cream/60">
                                        {currentPlan.price === 0
                                            ? "Free forever. Upgrade anytime."
                                            : "Renews automatically on March 1, 2026"
                                        }
                                    </p>
                                </div>
                            </div>

                            {/* Usage Stats Mockup */}
                            <div className="space-y-4 pt-4 border-t border-brand-deep/5 dark:border-white/5">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="text-brand-deep/60 dark:text-brand-cream/60">Conversations</span>
                                        <span className="text-brand-deep dark:text-brand-cream">45 / {currentPlanId === 'starter' ? '100' : '500'}</span>
                                    </div>
                                    <Progress value={45} className="h-1.5" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="text-brand-deep/60 dark:text-brand-cream/60">Staff Accounts</span>
                                        <span className="text-brand-deep dark:text-brand-cream">
                                            {currentPlanId === 'starter' ? '1 / 1' : '1 / 3'}
                                        </span>
                                    </div>
                                    <Progress value={100} className="h-1.5" />
                                </div>
                            </div>
                        </div>

                        {/* Payment Method Preview */}
                        <div className="p-4 rounded-2xl bg-brand-deep/5 dark:bg-white/5 border border-brand-deep/5 dark:border-white/5 space-y-4">
                            <div className="flex items-center gap-2 text-brand-deep dark:text-brand-cream font-medium">
                                <CreditCard className="w-4 h-4" />
                                <span>Payment Method</span>
                            </div>
                            <div className="p-3 bg-white dark:bg-[#021a12] rounded-xl border border-brand-deep/5 dark:border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-5 bg-brand-deep rounded text-[6px] text-white flex items-center justify-center font-bold">VISA</div>
                                    <span className="text-sm font-mono text-brand-deep/60 dark:text-brand-cream/60">•••• 4242</span>
                                </div>
                            </div>
                            <Button variant="ghost" className="w-full text-xs h-8">Update Payment Method</Button>
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
                            onClick={() => setBillingCycle("month")}
                            className={cn(
                                "px-3 py-1 rounded-md text-xs font-bold shadow-sm transition-all",
                                billingCycle === "month"
                                    ? "bg-white dark:bg-white/10 text-brand-deep dark:text-brand-cream"
                                    : "text-brand-deep/60 dark:text-brand-cream/60 hover:bg-white/40"
                            )}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingCycle("year")}
                            className={cn(
                                "px-3 py-1 rounded-md text-xs font-bold shadow-sm transition-all",
                                billingCycle === "year"
                                    ? "bg-white dark:bg-white/10 text-brand-deep dark:text-brand-cream"
                                    : "text-brand-deep/60 dark:text-brand-cream/60 hover:bg-white/40"
                            )}
                        >
                            Yearly (-20%)
                        </button>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {PLANS.map((plan) => (
                        <PlanCard
                            key={plan.id}
                            name={plan.name}
                            description={plan.description}
                            price={billingCycle === "year" ? plan.price * 12 * 0.8 : plan.price}
                            interval={billingCycle}
                            features={plan.features}
                            isRecommended={plan.isRecommended}
                            isCurrent={currentPlanId === plan.id}
                            isLoading={loadingPlanId === plan.id}
                            onSelect={() => handlePlanSelect(plan.id)}
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
                                <th className="px-6 py-4 text-right">Invoice</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-deep/5 dark:divide-white/5">
                            {BILLING_HISTORY.map((item) => (
                                <tr key={item.id}>
                                    <td className="px-6 py-4 text-brand-deep dark:text-brand-cream">{item.date}</td>
                                    <td className="px-6 py-4 text-brand-deep/60 dark:text-brand-cream/60">{item.description}</td>
                                    <td className="px-6 py-4 text-brand-deep dark:text-brand-cream font-medium">{item.amount}</td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "px-2 py-1 rounded-full text-xs font-bold uppercase",
                                            item.status === 'Paid' ? "bg-emerald-500/10 text-emerald-600" : "bg-brand-deep/10 text-brand-deep"
                                        )}>{item.status}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button variant="ghost" size="sm" className="h-8">Download</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </GlassCard>

                {/* Mobile List View */}
                <div className="md:hidden space-y-3">
                    {BILLING_HISTORY.map((item) => (
                        <ListCard
                            key={item.id}
                            title={item.description}
                            subtitle={item.date}
                            status={item.status}
                            statusColor={item.statusColor}
                            value={item.amount}
                            onClick={() => { }} // Could trigger download or view details
                        />
                    ))}
                </div>
            </section>
        </div>
    )
}
