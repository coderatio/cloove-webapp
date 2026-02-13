"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/app/lib/api-client'
import { storage, STORAGE_KEYS } from '@/app/lib/storage'
import { toast } from 'sonner'
import { useAuth } from './providers/auth-provider'

export interface Business {
    id: string
    name: string
    slug: string
    currency: string
    logo?: string
    role: string
    permissions: Record<string, boolean> | null
}

interface Store {
    id: string
    name: string
    location?: string
    isDefault: boolean
}

// Virtual "All Stores" constant
export const ALL_STORES_ID = 'all-stores'

const allStores: Store = {
    id: ALL_STORES_ID,
    name: 'All Stores',
    isDefault: false
}

interface BusinessContextType {
    businesses: Business[]
    activeBusiness: Business | null
    setActiveBusiness: (business: Business | null) => void
    isLoading: boolean
    refreshBusinesses: () => Promise<void>

    businessName: string
    ownerName: string

    // Legacy/Store compatibility
    currentStore: Store
    setCurrentStore: (store: Store) => void
    stores: Store[]
    addStore: (name: string, location?: string) => void
    updateStore: (id: string, data: Partial<Store>) => void
    deleteStore: (id: string) => void

    // Authorization
    role: string | null
    permissions: Record<string, boolean> | null
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined)

export function BusinessProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient()
    const [businesses, setBusinesses] = useState<Business[]>([])
    const { user } = useAuth()
    const [activeBusiness, setActiveBusinessState] = useState<Business | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Mock stores for compatibility with existing UI
    const [stores, setStores] = useState<Store[]>([allStores])
    const [currentStore, setCurrentStore] = useState<Store>(allStores)

    const addStore = useCallback((name: string, location?: string) => {
        const newStore: Store = {
            id: Math.random().toString(36).substr(2, 9),
            name,
            location,
            isDefault: false
        }
        setStores(prev => [...prev, newStore])
        toast.success(`Store "${name}" added`)
    }, [])

    const updateStore = useCallback((id: string, data: Partial<Store>) => {
        setStores(prev => prev.map(s => s.id === id ? { ...s, ...data } : s))
        toast.success('Store updated')
    }, [])

    const deleteStore = useCallback((id: string) => {
        setStores(prev => prev.filter(s => s.id !== id))
        toast.error('Store removed')
    }, [])

    const setActiveBusiness = useCallback((business: Business | null) => {
        setActiveBusinessState(business)

        // Reset store compatibility state
        setStores([allStores])
        setCurrentStore(allStores)

        if (business) {
            storage.setActiveBusinessId(business.id)
            // Invalidate all queries to force refetch with new business header
            queryClient.invalidateQueries()
            toast.success(`Switched to ${business.name}`)
        } else {
            storage.removeActiveBusinessId()
        }
    }, [queryClient])

    const refreshBusinesses = useCallback(async () => {
        // Only fetch if authenticated
        if (!apiClient.getToken()) {
            setIsLoading(false)
            setBusinesses([])
            setActiveBusinessState(null)
            return
        }

        try {
            const data = await apiClient.get<Business[]>('/businesses')
            setBusinesses(data)

            // Auto-selection or restoration
            const savedId = storage.getActiveBusinessId()

            if (data.length === 1) {
                setActiveBusiness(data[0])
            } else if (savedId) {
                const found = data.find(b => b.id === savedId)
                if (found) {
                    setActiveBusiness(found)
                }
            }
        } catch (error) {
            //console.error('Failed to fetch businesses:', error)
            toast.error('Failed to load businesses. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }, [setActiveBusiness])

    useEffect(() => {
        refreshBusinesses()
    }, [refreshBusinesses, user?.id])

    return (
        <BusinessContext.Provider value={{
            businesses,
            activeBusiness,
            setActiveBusiness,
            isLoading,
            refreshBusinesses,
            businessName: activeBusiness?.name || "",
            ownerName: user?.firstName || "",
            currentStore,
            setCurrentStore,
            stores,
            addStore,
            updateStore,
            deleteStore,
            role: activeBusiness?.role || null,
            permissions: activeBusiness?.permissions || null
        }}>
            {children}
        </BusinessContext.Provider>
    )
}

export function useBusiness() {
    const context = useContext(BusinessContext)
    if (context === undefined) {
        throw new Error('useBusiness must be used within a BusinessProvider')
    }
    return context
}
