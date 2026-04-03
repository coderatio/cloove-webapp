"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { apiClient } from "@/app/lib/api-client"
import { storage } from "@/app/lib/storage"
import { SessionManager } from "../auth/SessionManager"

export interface UserCountryDetail {
    id: string
    name: string
    code: string
    phoneCode: string
    currency: { code: string; symbol: string }
}

export interface SubscriptionAlert {
    type: "grace_period" | "renewal_success" | "renewal_failed" | "expired" | "trial_active"
    daysOverdue: number
    gracePeriodEndsAt: string | null
    planName: string
    message: string
    invoiceUrl: string | null
}

interface User {
    id: string
    fullName: string
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    country?: string | null
    countryDetail?: UserCountryDetail | null
    setupRequired: boolean
    emailVerified?: boolean
    phoneVerified?: boolean
    signupChannel?: string
    session?: {
        expiresAt?: string
        refreshInterval?: string
    }
    hasTransactionPin: boolean
    avatarUrl?: string | null
    fieldAgent: {
        isFieldAgent: boolean
        agentCode: string
        agentId: string
    } | null
    /** Present when subscription needs attention (grace, expired, etc.). */
    subscriptionAlert?: SubscriptionAlert | null
}

interface AuthContextType {
    user: User | null
    isLoading: boolean
    logout: () => Promise<void>
    refreshUser: () => Promise<void>
    updateUserMetadata: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const pathname = usePathname()

    const fetchUser = async (silent = false) => {
        if (!silent) setIsLoading(true)
        try {
            const userData = await apiClient.get<User>("/security/me", undefined, { skipAuthRedirect: true })
            setUser(userData)
        } catch (error) {
            // 401 means no valid session — just clear user state
            setUser(null)
        } finally {
            if (!silent) setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchUser(false) // Initial load should show loading state
    }, [])

    // Reset activity timer when user state transitions from null to non-null
    // (e.g. on successful login or initial session load)
    useEffect(() => {
        if (user) {
            storage.setLastActivity(Date.now())
        }
    }, [!!user])

    const refreshUser = () => fetchUser(true) // Subsequent refreshes should be silent

    const logout = async () => {
        const callbackUrl = encodeURIComponent(pathname)
        setUser(null)
        await apiClient.logout(`/login?callbackUrl=${callbackUrl}`)
    }

    const updateUserMetadata = () => {
        // Called when the session manager refreshes the token (cookie rotated server-side).
        // No client-side action needed — the cookie is updated via the Set-Cookie header.
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, logout, refreshUser, updateUserMetadata }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
