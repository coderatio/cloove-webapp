"use client"

import { useQuery } from "@tanstack/react-query"
import { apiClient, ApiResponse } from "@/app/lib/api-client"
import { useBusiness } from "@/app/components/BusinessProvider"
import { 
    Settings, 
    Package, 
    Users, 
    ShieldCheck, 
    Banknote, 
    Store, 
    Receipt, 
    Activity,
    AlertCircle
} from "lucide-react"
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
    "Add Business Description": { href: "/settings", icon: <Settings className="w-4 h-4" /> },
    "Set Business Category": { href: "/settings", icon: <Settings className="w-4 h-4" /> },
    "Add Your First Product": { href: "/inventory", icon: <Package className="w-4 h-4" /> },
    "Add Product Images": { href: "/inventory", icon: <Package className="w-4 h-4" /> },
    "Record a New Customer": { href: "/customers", icon: <Users className="w-4 h-4" /> },
    "Invite a Staff Member": { href: "/staff", icon: <ShieldCheck className="w-4 h-4" /> },
    "Add Payout Bank Account": { href: "/finance", icon: <Banknote className="w-4 h-4" /> },
    "Set Up Your Storefront": { href: "/storefront", icon: <Store className="w-4 h-4" /> },
    "Record an Expense": { href: "/expenses", icon: <Receipt className="w-4 h-4" /> },
    "Check Financial Summary": { href: "/finance", icon: <Activity className="w-4 h-4" /> },
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
        const mapping = ACTION_MAP[rec.action] || { href: "/", icon: <AlertCircle className="w-4 h-4" /> }
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
