"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { apiClient } from "@/app/lib/api-client"
import { storage, STORAGE_KEYS } from "@/app/lib/storage"

interface User {
    id: string
    fullName: string
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    setupRequired: boolean
}

interface AuthContextType {
    user: User | null
    isLoading: boolean
    logout: () => void
    refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const fetchUser = async () => {
        const token = storage.get(STORAGE_KEYS.AUTH_TOKEN)
        if (!token) {
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
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchUser()
    }, [])

    const logout = () => {
        apiClient.post("/settings/logout", {}).finally(() => {
            storage.remove(STORAGE_KEYS.AUTH_TOKEN)
            storage.remove(STORAGE_KEYS.ACTIVE_BUSINESS_ID)
            window.location.href = "/login"
        })
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, logout, refreshUser: fetchUser }}>
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
