"use client"

import React, { useState } from "react"
import { useFieldAgent } from "@/app/domains/field-agent/providers/FieldAgentProvider"
import { useAuth } from "@/app/components/providers/auth-provider"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Button } from "@/app/components/ui/button"
import {
    Building2,
    ArrowRight,
    CheckCircle2,
    Loader2,
    Search,
    ChevronRight,
    Clock,
    Wallet,
    ArrowUpRight,
    CreditCard,
    Plus,
    Banknote,
    ShieldAlert
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { AgentStatCard } from "@/app/components/field-agent/AgentStatCard"
import { PinVerificationDrawer } from "@/app/components/shared/PinVerificationDrawer"
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerBody,
    DrawerFooter,
    DrawerClose,
} from "@/app/components/ui/drawer"
import { MoneyInput } from "@/app/components/ui/money-input"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/app/components/ui/select"

type PayoutRecord = { date: string; time: string; amount: string; status: string; refId: string }

const PAYOUT_HISTORY: PayoutRecord[] = [
    { date: "Mar 15, 2024", time: "14:20", amount: "₦25,000", status: "Processed", refId: "CLV-Q3R7K2P8X" },
    { date: "Feb 28, 2024", time: "09:45", amount: "₦18,400", status: "Processed", refId: "CLV-M5T9L1N4W" },
    { date: "Jan 10, 2024", time: "16:30", amount: "₦12,000", status: "Processed", refId: "CLV-B2V6H8J3Y" },
]

export default function WalletPage() {
    const { stats } = useFieldAgent()
    const { user } = useAuth()
    const router = useRouter()
    const [activeDrawer, setActiveDrawer] = useState<'payout' | 'add-account' | 'detail' | null>(null)
    const [showPinDrawer, setShowPinDrawer] = useState(false)
    const [pinAction, setPinAction] = useState<{ type: string; metadata: any } | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [payoutAmount, setPayoutAmount] = useState(0)
    const [selectedPayout, setSelectedPayout] = useState<PayoutRecord | null>(null)

    const [accountData, setAccountData] = useState({
        bank: "",
        accountNumber: "",
        accountName: ""
    })

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            maximumFractionDigits: 0
        }).format(val)
    }

    const handleRequestPayout = async () => {
        if (payoutAmount <= 0) {
            toast.error("Please enter a valid amount")
            return
        }
        if (payoutAmount > stats.pendingPayout) {
            toast.error("Insufficient balance")
            return
        }

        if (!user?.hasTransactionPin) {
            toast.error("Transaction PIN required. Please set it in Security settings.")
            router.push("/field/security")
            return
        }

        setPinAction({
            type: 'REQUEST_WALLET_WITHDRAWAL',
            metadata: { amount: payoutAmount, channel: "Access Bank (**** 4567)" }
        })
        setShowPinDrawer(true)
    }

    const onPayoutVerified = async (data: any) => {
        setIsSubmitting(true)
        // In a real app, the verification already executed the action on the server.
        // For this demo, we'll simulate the remaining UI logic.
        await new Promise(r => setTimeout(r, 1000))
        toast.success(`Payout of ${formatCurrency(payoutAmount)} requested successfully!`)
        setIsSubmitting(false)
        setActiveDrawer(null)
        setPayoutAmount(0)
    }

    const handleAddAccount = async () => {
        if (!accountData.bank || accountData.accountNumber.length !== 10) {
            toast.error("Please provide valid account details")
            return
        }

        if (!user?.hasTransactionPin) {
            toast.error("Transaction PIN required. Please set it in Security settings.")
            router.push("/field/security")
            return
        }

        setPinAction({
            type: 'ADD_PAYOUT_ACCOUNT',
            metadata: { ...accountData }
        })
        setShowPinDrawer(true)
    }

    const onAccountVerified = async (data: any) => {
        setIsSubmitting(true)
        await new Promise(r => setTimeout(r, 1000))
        toast.success("Payout channel integrated successfully!")
        setIsSubmitting(false)
        setActiveDrawer(null)
        setAccountData({ bank: "", accountNumber: "", accountName: "" })
    }

    return (
        <div className="space-y-6 md:space-y-10 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-8">
                <div className="space-y-2">
                    <p className="text-[10px] font-black tracking-[0.4em] uppercase text-brand-gold">Financial Command</p>
                    <h1 className="text-3xl md:text-5xl font-serif font-medium text-brand-deep dark:text-brand-cream leading-tight">Earnings Hub</h1>
                </div>
                <Button
                    onClick={() => setActiveDrawer('payout')}
                    className="w-full md:w-auto bg-brand-deep text-white rounded-[24px] px-8 md:px-12 h-16 md:h-20 font-bold shadow-2xl shadow-brand-deep/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 md:gap-4"
                >
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-brand-gold/10 flex items-center justify-center">
                        <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 text-brand-gold" />
                    </div>
                    Request Payout
                </Button>
            </div>

            {/* Financial Stats — horizontal scroll on mobile/tablet, grid on desktop */}
            <div className="flex gap-4 overflow-x-auto py-3 lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0 scrollbar-none">
                <div className="min-w-[300px] lg:min-w-0 shrink-0 lg:shrink">
                    <AgentStatCard
                        title="Lifetime Earnings"
                        value={formatCurrency(stats.totalEarned)}
                        subtext="Consolidated commission growth"
                        icon={Banknote}
                        trend={{ value: 12, isPositive: true }}
                    />
                </div>
                <div className="min-w-[300px] lg:min-w-0 shrink-0 lg:shrink">
                    <AgentStatCard
                        title="Available Balance"
                        value={formatCurrency(stats.pendingPayout)}
                        subtext="Ready for immediate extraction"
                        icon={Wallet}
                        trend={{ value: 8, isPositive: true }}
                    />
                </div>
                <div className="min-w-[300px] lg:min-w-0 shrink-0 lg:shrink">
                    <AgentStatCard
                        title="Pending Payouts"
                        value="₦0"
                        subtext="Awaiting system confirmation"
                        icon={CreditCard}
                        trend={{ value: 0, isPositive: true }}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
                {/* Payout Channels Section */}
                <div className="border-none shadow-2xl shadow-brand-deep/5 overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-6 md:mb-10">
                        <div>
                            <h3 className="text-xl md:text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream leading-none">Payout Channels</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-brand-deep/20 dark:text-brand-cream/60 mt-2 md:mt-3">Active Extraction Links</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setActiveDrawer('add-account')}
                            className="w-10 h-10 md:w-12 md:h-12 bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20 rounded-2xl transition-all border border-brand-gold/20"
                        >
                            <Plus className="w-5 h-5 md:w-6 md:h-6" />
                        </Button>
                    </div>

                    <div className="space-y-4 md:space-y-6 flex-1">
                        {/* Primary Account Card */}
                        <div className="relative p-5 md:p-7 rounded-[28px] md:rounded-[40px] border border-brand-gold/30 bg-white/40 dark:bg-white/5 group hover:bg-white/60 dark:hover:bg-white/10 transition-all cursor-pointer shadow-xl shadow-brand-gold/5 overflow-hidden">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-gold/5 blur-3xl -mr-24 -mt-24 group-hover:bg-brand-gold/10 transition-colors" />

                            <div className="relative flex flex-col gap-5 md:gap-8">
                                <div className="flex items-start justify-between">
                                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-brand-deep flex items-center justify-center text-brand-gold shadow-2xl shadow-brand-deep/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                                        <Building2 className="w-6 h-6 md:w-8 md:h-8" />
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-brand-gold bg-brand-gold/5 px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-brand-gold/10 backdrop-blur-md">Default</span>
                                        <div className="w-8 h-1 bg-brand-gold/20 rounded-full group-hover:w-12 transition-all" />
                                    </div>
                                </div>

                                <div className="space-y-1.5 md:space-y-2">
                                    <h4 className="text-xl md:text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream leading-none">Access Bank</h4>
                                    <div className="flex items-center gap-2 md:gap-3 text-brand-deep/40 dark:text-brand-cream/40 font-medium italic text-sm">
                                        <span className="font-mono tracking-tighter text-sm md:text-base">**** 4567</span>
                                        <span className="w-1 h-1 rounded-full bg-brand-gold/40" />
                                        <span>Josiah Yahaya</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Integration Card */}
                        <div
                            onClick={() => setActiveDrawer('add-account')}
                            className="p-5 md:p-8 rounded-[28px] md:rounded-[40px] border-2 border-dashed border-brand-deep/10 dark:border-white/10 bg-brand-deep/1 dark:bg-white/2 flex items-center gap-4 md:gap-6 group hover:border-brand-gold/40 hover:bg-brand-gold/5 transition-all cursor-pointer min-h-[100px] md:min-h-[140px]"
                        >
                            <div className="w-11 h-11 md:w-14 md:h-14 shrink-0 rounded-2xl md:rounded-3xl bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center text-brand-deep/10 dark:text-white/40 group-hover:bg-brand-gold group-hover:text-white transition-all duration-500 shadow-sm border border-brand-deep/5">
                                <Plus className="w-6 h-6 md:w-8 md:h-8" />
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                                <p className="text-base md:text-lg font-bold text-brand-deep/30 dark:text-brand-cream/30 group-hover:text-brand-deep dark:group-hover:text-brand-cream transition-colors">Integrate New Channel</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-brand-deep/10 dark:text-white/60 line-clamp-1 group-hover:text-brand-gold/60 transition-colors">Bank, Wallet, or Digital Asset</p>
                            </div>
                            <div className="w-9 h-9 md:w-10 md:h-10 shrink-0 rounded-full border border-brand-deep/5 dark:border-white/5 flex items-center justify-center group-hover:border-brand-gold group-hover:bg-brand-gold/10 transition-all">
                                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-brand-deep/10 dark:text-white/40 group-hover:text-brand-gold transition-all" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Audit Trail Section */}
                <GlassCard className="p-5 md:p-10 border-none shadow-2xl shadow-brand-deep/5 flex flex-col">
                    <div className="mb-6 md:mb-8">
                        <h3 className="text-xl md:text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream leading-none">Audit Trail: Payouts</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-brand-deep/20 mt-2">Historical Extractions</p>
                    </div>
                    <div className="space-y-4 md:space-y-6 flex-1">
                        {PAYOUT_HISTORY.map((payout, i) => (
                            <div
                                key={i}
                                onClick={() => {
                                    setSelectedPayout(payout)
                                    setActiveDrawer('detail')
                                }}
                                className="flex items-center justify-between group cursor-pointer hover:translate-x-1 transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center border border-green-500/20 group-hover:scale-105 transition-transform">
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-serif font-medium text-brand-deep dark:text-brand-cream leading-none">{payout.amount}</p>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <p className="text-[10px] text-brand-deep/30 uppercase tracking-[0.2em] font-black leading-none">{payout.date}</p>
                                            <span className="w-1 h-1 rounded-full bg-brand-gold/40" />
                                            <p className="text-[10px] text-brand-deep/30 font-bold leading-none">{payout.time}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1.5">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-green-600 leading-none">{payout.status}</span>
                                    <div className="w-6 h-1 bg-green-500/10 rounded-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            </div>

            <Drawer open={activeDrawer === 'payout'} onOpenChange={(o) => !o && setActiveDrawer(null)}>
                <DrawerContent>
                    <DrawerStickyHeader>
                        <DrawerTitle className="text-4xl">Request Payout</DrawerTitle>
                        <DrawerDescription className="text-base mt-2">Enter the amount you wish to extract to your primary channel.</DrawerDescription>
                    </DrawerStickyHeader>
                    <DrawerBody className="space-y-8 px-8 py-10">
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-brand-deep/40 ml-1">Extraction Amount</Label>
                            <MoneyInput
                                value={payoutAmount}
                                onChange={setPayoutAmount}
                                className="h-16 text-2xl font-serif"
                                placeholder="0.00"
                            />
                            <div className="flex items-center justify-between px-1">
                                <span className="text-xs font-bold text-brand-deep/40 italic">Available: {formatCurrency(stats.pendingPayout)}</span>
                                <button
                                    onClick={() => setPayoutAmount(stats.pendingPayout)}
                                    className="text-[10px] font-black uppercase tracking-widest text-brand-gold hover:underline"
                                >
                                    Max
                                </button>
                            </div>
                        </div>

                        <div className="p-6 rounded-3xl bg-brand-gold/5 border border-brand-gold/10 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-brand-deep flex items-center justify-center text-brand-gold">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-brand-deep/40">Destination</p>
                                <p className="text-sm font-bold text-brand-deep dark:text-brand-cream">Access Bank • **** 4567</p>
                            </div>
                        </div>
                    </DrawerBody>
                    <DrawerFooter className="px-8 pb-12">
                        <Button
                            onClick={handleRequestPayout}
                            disabled={isSubmitting || payoutAmount <= 0}
                            className="h-16 w-full bg-brand-deep text-white rounded-2xl font-bold text-lg shadow-2xl shadow-brand-deep/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Confirm Payout"}
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>

            <Drawer open={activeDrawer === 'add-account'} onOpenChange={(o) => !o && setActiveDrawer(null)}>
                <DrawerContent>
                    <DrawerStickyHeader>
                        <DrawerTitle className="text-4xl">Add New Account</DrawerTitle>
                        <DrawerDescription className="text-base mt-2">Link a new bank account for automated commission payouts.</DrawerDescription>
                    </DrawerStickyHeader>
                    <DrawerBody className="space-y-8 px-8 py-10">
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-brand-deep/40 ml-1">Select Institution</Label>
                                <Select onValueChange={(v) => setAccountData(p => ({ ...p, bank: v }))}>
                                    <SelectTrigger className="h-16 sm:h-16 rounded-2xl border-brand-deep/10 dark:border-white/10 bg-white/50 dark:bg-white/5 font-bold text-lg">
                                        <SelectValue placeholder="Identify Bank" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        <SelectItem value="gtb" className="py-3">Guaranty Trust Bank</SelectItem>
                                        <SelectItem value="access" className="py-3">Access Bank</SelectItem>
                                        <SelectItem value="zenith" className="py-3">Zenith Bank</SelectItem>
                                        <SelectItem value="kuda" className="py-3">Kuda Microfinance</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-brand-deep/40 ml-1">Account Number</Label>
                                <Input
                                    placeholder="000 000 0000"
                                    maxLength={10}
                                    value={accountData.accountNumber}
                                    onChange={(e) => setAccountData(p => ({ ...p, accountNumber: e.target.value }))}
                                    className="h-16 sm:h-16 rounded-2xl border-brand-deep/10 dark:border-white/10 bg-white/50 dark:bg-white/5 font-mono text-xl tracking-[0.2em] font-bold"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-brand-deep/40 ml-1">Verified Name</Label>
                                <Input
                                    placeholder="Entity Name"
                                    value={accountData.accountName}
                                    onChange={(e) => setAccountData(p => ({ ...p, accountName: e.target.value }))}
                                    className="h-16 sm:h-16 rounded-2xl border-brand-deep/10 dark:border-white/10 bg-white/50 dark:bg-white/5 font-bold text-lg"
                                />
                                <p className="text-[10px] text-brand-deep/30 font-bold italic ml-1">System will attempt automatic identity verification.</p>
                            </div>
                        </div>
                    </DrawerBody>
                    <DrawerFooter className="px-8 pb-12">
                        <Button
                            onClick={handleAddAccount}
                            disabled={isSubmitting}
                            className="h-16 w-full bg-brand-gold hover:text-brand-cream text-brand-deep rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-brand-gold/20 transition-all hover:scale-[1.02] active:scale-95"
                        >
                            {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Add Account"}
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>

            <Drawer open={activeDrawer === 'detail'} onOpenChange={(o) => !o && setActiveDrawer(null)}>
                <DrawerContent>
                    <DrawerStickyHeader>
                        <DrawerTitle className="text-4xl text-brand-deep dark:text-brand-cream">Payout Audit</DrawerTitle>
                        <DrawerDescription className="text-base mt-2">Transaction metadata for your financial records.</DrawerDescription>
                    </DrawerStickyHeader>
                    <DrawerBody className="p-8">
                        {selectedPayout && (
                            <div className="space-y-6">
                                <div className="p-8 rounded-[40px] bg-brand-deep text-white flex flex-col items-center justify-center text-center space-y-4 shadow-2xl shadow-brand-deep/20 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 blur-3xl rounded-full -mr-16 -mt-16" />
                                    <div className="w-20 h-20 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center border border-green-500/30">
                                        <CheckCircle2 className="w-10 h-10" />
                                    </div>
                                    <div>
                                        <p className="text-4xl font-serif font-medium leading-none">{selectedPayout.amount}</p>
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mt-3">Successfully Processed</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-2">
                                    {[
                                        { label: "Reference ID", value: selectedPayout.refId, icon: Search },
                                        { label: "Channel", value: "Access Bank (****4567)", icon: Building2 },
                                        { label: "Timeline", value: `${selectedPayout.date} • ${selectedPayout.time}`, icon: Clock },
                                        { label: "Method", value: "Automated Bank Transfer", icon: ChevronRight }
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-4 px-5 py-4 bg-white/70 dark:bg-white/5 rounded-2xl border border-brand-deep/5 dark:border-white/5">
                                            <div className="w-10 h-10 shrink-0 rounded-xl bg-brand-deep/5 flex items-center justify-center text-brand-deep/30">
                                                <item.icon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-brand-deep/30 leading-none">{item.label}</p>
                                                <p className="text-sm font-bold text-brand-deep dark:text-brand-cream mt-1.5 truncate">{item.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </DrawerBody>
                    <DrawerFooter className="px-8 pb-12">
                        <DrawerClose asChild>
                            <Button variant="outline" className="h-16 w-full rounded-2xl font-bold border-brand-deep/10 text-brand-deep/60">Close Record</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>

            <PinVerificationDrawer
                open={showPinDrawer}
                onOpenChange={setShowPinDrawer}
                onSuccess={pinAction?.type === 'REQUEST_WALLET_WITHDRAWAL' ? onPayoutVerified : onAccountVerified}
                actionType={pinAction?.type || ''}
                metadata={pinAction?.metadata || {}}
                title={pinAction?.type === 'REQUEST_WALLET_WITHDRAWAL' ? "Verify Payout" : "Verify Account Attachment"}
                description={`Please enter your PIN to authorize ${pinAction?.type === 'REQUEST_WALLET_WITHDRAWAL' ? "this extraction" : "this new connection"}.`}
            />
        </div>
    )
}
