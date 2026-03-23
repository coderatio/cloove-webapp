"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

export interface AgentStats {
    totalEarned: number
    activeMerchants: number
    pendingPayout: number
    monthlyEarnings: { month: string; amount: number }[]
}

export interface OnboardedBusiness {
    id: string
    name: string
    ownerName: string
    phone: string
    onboardedAt: string
    status: "active" | "pending" | "incomplete"
    earnings: number
}

interface FieldAgentContextType {
    agentCode: string
    stats: AgentStats
    businesses: OnboardedBusiness[]
    isLoading: boolean
    onboardBusiness: (data: any) => Promise<void>
}

const FieldAgentContext = createContext<FieldAgentContextType | undefined>(undefined)

const DEMO_STATS: AgentStats = {
    totalEarned: 125400,
    activeMerchants: 24,
    pendingPayout: 12000,
    monthlyEarnings: [
        { month: "Jan", amount: 15000 },
        { month: "Feb", amount: 28000 },
        { month: "Mar", amount: 35000 },
    ]
}

const DEMO_BUSINESSES: OnboardedBusiness[] = [
    {
        id: "1",
        name: "Luxe Fabrics",
        ownerName: "Sarah Johnson",
        phone: "+234 801 234 5678",
        onboardedAt: "2024-03-10T10:30:00",
        status: "active",
        earnings: 5200
    },
    {
        id: "2",
        name: "Gourmet Bites",
        ownerName: "Michael Chen",
        phone: "+234 802 345 6789",
        onboardedAt: "2024-03-15T14:45:00",
        status: "pending",
        earnings: 0
    },
    {
        id: "3",
        name: "Tech Haven",
        ownerName: "Amina Bello",
        phone: "+234 803 456 7890",
        onboardedAt: "2024-02-28T09:15:00",
        status: "active",
        earnings: 12400
    }
]

export function FieldAgentProvider({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(false)
    const [stats, setStats] = useState<AgentStats>(DEMO_STATS)
    const [businesses, setBusinesses] = useState<OnboardedBusiness[]>(DEMO_BUSINESSES)

    const onboardBusiness = async (data: any) => {
        // Simulate API call
        setIsLoading(true)
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        const newBiz: OnboardedBusiness = {
            id: Math.random().toString(36).substr(2, 9),
            name: data.businessName,
            ownerName: data.merchantName,
            phone: data.phone,
            onboardedAt: new Date().toISOString(),
            status: "pending",
            earnings: 0
        }
        
        setBusinesses(prev => [newBiz, ...prev])
        setIsLoading(false)
    }

    return (
        <FieldAgentContext.Provider value={{ 
            agentCode: "CLV-AGT-001", 
            stats, 
            businesses, 
            isLoading,
            onboardBusiness
        }}>
            {children}
        </FieldAgentContext.Provider>
    )
}

export function useFieldAgent() {
    const context = useContext(FieldAgentContext)
    if (context === undefined) {
        throw new Error("useFieldAgent must be used within a FieldAgentProvider")
    }
    return context
}
