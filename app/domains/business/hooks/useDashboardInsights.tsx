"use client"

import { useQuery } from "@tanstack/react-query"
import { apiClient, ApiResponse } from "@/app/lib/api-client"
import { useBusiness } from "@/app/components/BusinessProvider"
import { HugeiconsIcon } from "@hugeicons/react"
import { Settings01Icon as Settings, PackageIcon as Package, UserMultiple02Icon as Users, SecurityCheckIcon as ShieldCheck, BanknoteIcon as Banknote, Store01Icon as Store, Invoice01Icon as Receipt, Activity03Icon as Activity, AlertCircleIcon as AlertCircle } from "@hugeicons/core-free-icons"
import React from "react"

export interface InsightRecommendation {
    action: string
    description: string
    impact: string
}

export interface DashboardInsights {
    businessName: string
    totalGapsFound: number
    recommendations: InsightRecommendation[]
}

const ACTION_MAP: Record<string, { href: string; icon: React.ReactNode }> = {
    "Add Business Description": { href: "/settings", icon: <HugeiconsIcon icon={Settings} className="w-4 h-4" /> },
    "Set Business Category": { href: "/settings", icon: <HugeiconsIcon icon={Settings} className="w-4 h-4" /> },
    "Add Your First Product": { href: "/inventory", icon: <HugeiconsIcon icon={Package} className="w-4 h-4" /> },
    "Add Product Images": { href: "/inventory", icon: <HugeiconsIcon icon={Package} className="w-4 h-4" /> },
    "Record a New Customer": { href: "/customers", icon: <HugeiconsIcon icon={Users} className="w-4 h-4" /> },
    "Invite a Staff Member": { href: "/staff", icon: <HugeiconsIcon icon={ShieldCheck} className="w-4 h-4" /> },
    "Add Payout Bank Account": { href: "/finance", icon: <HugeiconsIcon icon={Banknote} className="w-4 h-4" /> },
    "Set Up Your Storefront": { href: "/storefront", icon: <HugeiconsIcon icon={Store} className="w-4 h-4" /> },
    "Record an Expense": { href: "/expenses", icon: <HugeiconsIcon icon={Receipt} className="w-4 h-4" /> },
    "Check Financial Summary": { href: "/finance", icon: <HugeiconsIcon icon={Activity} className="w-4 h-4" /> },
}

export function useDashboardInsights() {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    const { data: response, isLoading, error } = useQuery<ApiResponse<DashboardInsights>>({
        queryKey: ['dashboard', 'insights', businessId],
        queryFn: () => apiClient.get<ApiResponse<DashboardInsights>>('/dashboard/insights', {}, { fullResponse: true }),
        enabled: !!businessId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    })

    const recommendations = response?.data?.recommendations || []
    
    const mappedActions = recommendations.map(rec => {
        const mapping = ACTION_MAP[rec.action] || { href: "/", icon: <HugeiconsIcon icon={AlertCircle} className="w-4 h-4" /> }
        return {
            label: rec.action,
            count: 1, // These are single action items
            type: "info" as const,
            href: mapping.href,
            icon: mapping.icon,
            description: rec.description // Optional for the ActionRow but good to have
        }
    })

    return {
        insights: response?.data,
        actions: mappedActions,
        isLoading,
        error
    }
}
