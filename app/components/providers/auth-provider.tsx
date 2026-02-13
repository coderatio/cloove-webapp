"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { apiClient } from "@/app/lib/api-client"
import { storage, STORAGE_KEYS } from "@/app/lib/storage"
import { SessionManager } from "../auth/SessionManager"

interface User {
    id: string
    fullName: string
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    setupRequired: boolean
    session?: {
        expiresAt?: string
        refreshInterval?: string
    }
}

interface AuthContextType {
    user: User | null
    isLoading: boolean
    logout: () => void
    refreshUser: () => Promise<void>
    updateUserMetadata: (token: string) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const fetchUser = async (silent = false) => {
        if (!silent) setIsLoading(true)
        const token = storage.get(STORAGE_KEYS.AUTH_TOKEN)
        if (!token) {
            setUser(null)
            setIsLoading(false)
            return
        }

        try {
            const userData = await apiClient.get<User>("/security/me")
            setUser(userData)
        } catch (error) {
            console.error("Failed to fetch user:", error)
            // If it's a 401, the apiClient will handle the redirect
        } finally {
            if (!silent) setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchUser(false) // Initial load should show loading state
    }, [])

    const refreshUser = () => fetchUser(true) // Subsequent refreshes should be silent

    const logout = async () => {
        try {
            setUser(null)
            await apiClient.logout()
        } catch (error) {
            console.error("Logout failed:", error)
            storage.clear()
            window.location.href = "/login"
        }
    }

    const updateUserMetadata = (token: string) => {
        // This is called when the session manager refreshes the token
        // We don't necessarily need to update the user object if nothing changed,
        // but it's a good place if we want to update expiresAt in the future.
        // For now, apiClient.refresh() already saves the token to storage.
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
