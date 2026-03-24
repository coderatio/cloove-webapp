"use client"

import React, { useState } from "react"
import { useFieldAgentBusinesses, OnboardedBusiness } from "@/app/domains/field-agent/hooks/useFieldAgentBusinesses"
import { useFieldAgentWallet } from "@/app/domains/field-agent/hooks/useFieldAgentWallet"
import { formatCurrency, formatDate } from "@/app/lib/formatters"
import DataTable, { Column } from "@/app/components/DataTable"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Badge } from "@/app/components/ui/badge"
import { Button } from "@/app/components/ui/button"
import { 
    Search, 
    Plus, 
    CheckCircle2, 
    Clock, 
    ChevronRight, 
    Calendar,
    ChevronLeft,
    User
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/app/lib/utils"
import { MerchantDetailsDrawer } from "@/app/components/field-agent/MerchantDetailsDrawer"

const ITEMS_PER_PAGE = 5

export default function BusinessesPage() {
    const { data: businesses = [], isLoading } = useFieldAgentBusinesses()
    const { data: wallet } = useFieldAgentWallet()
    const currency = wallet?.currency ?? 'NGN'
    const fmt = (val: number) => formatCurrency(val, { currency })
    const [searchQuery, setSearchQuery] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    
    // Drawer State
    const [selectedBusiness, setSelectedBusiness] = useState<OnboardedBusiness | null>(null)
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)

    const filteredBusinesses = businesses.filter(biz => 
        biz.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        biz.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        biz.id.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Pagination Logic
    const totalPages = Math.ceil(filteredBusinesses.length / ITEMS_PER_PAGE)
    const paginatedBusinesses = filteredBusinesses.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    )

    const handleOpenDrawer = (business: OnboardedBusiness) => {
        setSelectedBusiness(business)
        setIsDrawerOpen(true)
    }

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value)
        setCurrentPage(1) // Reset page when search query changes
    }

    const columns: Column<OnboardedBusiness>[] = [
        {
            key: "name",
            header: "Business Name",
            render: (val, row) => (
                <div className="flex flex-col">
                    <span className="font-bold text-sm">{String(val)}</span>
                    <span className="text-[10px] text-brand-deep/40 dark:text-brand-cream/40 uppercase tracking-widest font-bold">{row.ownerName}</span>
                </div>
            )
        },
        {
            key: "phone",
            header: "Contact",
            render: (val) => <span className="text-xs font-mono">{String(val)}</span>
        },
        {
            key: "onboardedAt",
            header: "Date Added",
            render: (val) => (
                <span className="text-xs font-medium text-brand-deep/60 dark:text-brand-cream/60">
                    {formatDate(String(val), 'MMM d, yyyy')}
                </span>
            )
        },
        {
            key: "status",
            header: "Status",
            render: (val) => {
                const status = String(val)
                return (
                    <Badge 
                        variant="secondary"
                        className={cn(
                            "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
                            status === "active" ? "bg-green-500/10 text-green-600" : 
                            status === "pending" ? "bg-yellow-500/10 text-yellow-600" : 
                            "bg-red-500/10 text-red-600"
                        )}
                    >
                        {status}
                    </Badge>
                )
            }
        },
        {
            key: "earnings",
            header: "Commission",
            render: (val) => (
                <span className="font-serif font-medium text-brand-green dark:text-brand-gold">
                    {fmt(Number(val))}
                </span>
            )
        }
    ]

    return (
        <div className="space-y-8">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-serif font-medium tracking-tight text-brand-deep dark:text-brand-cream">My Merchants</h1>
                    <p className="text-brand-deep/50 dark:text-brand-cream/50 text-sm mt-1">
                        You have onboarded <span className="text-brand-deep dark:text-brand-cream font-bold">{businesses.length} businesses</span> to date.
                    </p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
                    <div className="relative w-full sm:flex-1 xl:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-deep/30" />
                        <input 
                            type="text" 
                            placeholder="Search merchants..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="w-full pl-10 pr-4 py-3 bg-brand-deep/5 dark:bg-white/5 border border-brand-deep/10 dark:border-white/10 rounded-2xl text-sm outline-none focus:border-brand-gold/50 transition-all font-medium"
                        />
                    </div>
                    <Button className="w-full sm:w-auto bg-brand-gold text-brand-deep hover:bg-brand-gold/90 rounded-2xl px-8 h-12 font-bold shadow-lg shadow-brand-gold/10" asChild>
                        <Link href="/field/onboard">
                            <Plus className="w-4 h-4 mr-2" />
                            New Merchant
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Refined "Calm Intelligence" Card List */}
            <div className="grid grid-cols-1 gap-5 md:hidden">
                {paginatedBusinesses.map((biz) => (
                    <GlassCard 
                        key={biz.id} 
                        className="p-5 rounded-[24px] border border-brand-deep/5 bg-white/40 dark:bg-white/5 active:scale-[0.98] transition-all relative overflow-hidden group"
                        onClick={() => handleOpenDrawer(biz)}
                    >
                        {/* Status Glow Indicator (Subtle) */}
                        <div className={cn(
                            "absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 transition-opacity group-hover:opacity-20",
                            biz.status === 'active' ? "bg-green-500" : "bg-brand-gold"
                        )} />

                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                    biz.status === 'active' ? "bg-green-500/10 text-green-600" : "bg-brand-gold/10 text-brand-gold"
                                )}>
                                    {biz.status === 'active' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h4 className="font-serif font-medium text-lg leading-tight tracking-tight">{biz.name}</h4>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className={cn(
                                            "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md",
                                            biz.status === 'active' ? "bg-green-500/10 text-green-600" : "bg-brand-gold/10 text-brand-gold"
                                        )}>
                                            {biz.status}
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-brand-deep/10" />
                                        <span className="text-[10px] text-brand-deep/40 font-bold uppercase tracking-wider">{biz.ownerName}</span>
                                    </div>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-brand-deep/20 group-hover:text-brand-gold transition-colors" />
                        </div>

                        <div className="flex items-end justify-between pt-4 border-t border-brand-deep/5">
                            <div className="space-y-1">
                                <p className="text-[8px] font-black text-brand-deep/30 dark:text-brand-cream/30 uppercase tracking-[0.2em]">Onboarded On</p>
                                <p className="text-[10px] font-bold text-brand-deep/60 dark:text-brand-cream/60 flex items-center gap-1.5 leading-none whitespace-nowrap">
                                    <Calendar className="shrink-0 w-3 h-3 text-brand-deep/20" />
                                    {formatDate(biz.onboardedAt, 'd MMM yyyy • h:mm a')}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] font-black text-brand-deep/30 uppercase tracking-[0.2em] mb-1">Total Earned</p>
                                <p className="text-xl font-serif font-medium text-brand-gold leading-none">
                                    {fmt(biz.earnings)}
                                </p>
                            </div>
                        </div>
                    </GlassCard>
                ))}
                
                {businesses.length === 0 && !isLoading && (
                    <div className="py-24 text-center">
                        <div className="w-16 h-16 bg-brand-deep/5 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Plus className="w-8 h-8 text-brand-deep/10" />
                        </div>
                        <h3 className="text-lg font-serif font-medium text-brand-deep/40 dark:text-brand-cream/40 mb-2">No merchants yet</h3>
                        <p className="text-sm text-brand-deep/30 dark:text-brand-cream/30 max-w-[200px] mx-auto">Start onboarding businesses to grow your portfolio.</p>
                    </div>
                )}
            </div>

            {/* Desktop Table View */}
            <GlassCard className="hidden md:block overflow-hidden border-none shadow-2xl shadow-brand-deep/5">
                <DataTable 
                    columns={columns} 
                    data={paginatedBusinesses} 
                    isLoading={isLoading}
                    emptyMessage="No merchants onboarded yet"
                    onRowClick={(row) => handleOpenDrawer(row as OnboardedBusiness)}
                />
            </GlassCard>

            {/* Creative Pagination Support */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 pb-8">
                    <p className="text-xs font-bold text-brand-deep/40 uppercase tracking-widest leading-none">
                        Showing <span className="text-brand-deep dark:text-brand-cream">{Math.min(filteredBusinesses.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)}</span> to <span className="text-brand-deep dark:text-brand-cream">{Math.min(filteredBusinesses.length, currentPage * ITEMS_PER_PAGE)}</span> of <span className="text-brand-deep dark:text-brand-cream">{filteredBusinesses.length}</span> merchants
                    </p>
                    
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            className="rounded-xl w-10 h-10 p-0 bg-white/50 dark:bg-white/5 border-brand-deep/5 dark:border-white/5 hover:bg-brand-gold/10 hover:text-brand-gold hover:border-brand-gold/20 disabled:opacity-30 transition-all"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        
                        <div className="flex items-center gap-1.5 px-1">
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={cn(
                                        "w-9 h-9 rounded-xl text-xs font-black transition-all",
                                        currentPage === i + 1 
                                            ? "bg-brand-gold text-white shadow-lg shadow-brand-gold/20 scale-110" 
                                            : "bg-brand-deep/5 dark:bg-white/5 text-brand-deep/40 dark:text-brand-cream/40 hover:bg-brand-deep/10 dark:hover:bg-white/10"
                                    )}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>

                        <Button 
                            variant="outline"
                            size="sm"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            className="rounded-xl w-10 h-10 p-0 bg-white/50 dark:bg-white/5 border-brand-deep/5 dark:border-white/5 hover:bg-brand-gold/10 hover:text-brand-gold hover:border-brand-gold/20 disabled:opacity-30 transition-all"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}

            <MerchantDetailsDrawer 
                business={selectedBusiness}
                isOpen={isDrawerOpen}
                onOpenChange={setIsDrawerOpen}
            />
        </div>
    )
}
