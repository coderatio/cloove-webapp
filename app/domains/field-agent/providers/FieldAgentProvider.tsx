"use client"

import React, { createContext, useContext } from "react"
import { useAuth } from "@/app/components/providers/auth-provider"

interface FieldAgentContextType {
    agentCode: string | null
    agentId: string | null
    isAgent: boolean
}

const FieldAgentContext = createContext<FieldAgentContextType | undefined>(undefined)

export function FieldAgentProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth()

    return (
        <FieldAgentContext.Provider value={{
            agentCode: user?.fieldAgent?.agentCode ?? null,
            agentId: user?.fieldAgent?.agentId ?? null,
            isAgent: !!user?.fieldAgent,
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
