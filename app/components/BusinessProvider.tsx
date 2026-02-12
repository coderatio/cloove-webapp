"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { apiClient } from '@/app/lib/api-client'
import { storage, STORAGE_KEYS } from '@/app/lib/storage'
import { toast } from 'sonner'

export interface Business {
    id: string
    name: string
    slug: string
    currency: string
    logo?: string
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

    // Legacy/Store compatibility (can be expanded later)
    currentStore: Store
    setCurrentStore: (store: Store) => void
    stores: Store[]
    features: Record<string, boolean>
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined)

export function BusinessProvider({ children }: { children: ReactNode }) {
    const [businesses, setBusinesses] = useState<Business[]>([])
    const [activeBusiness, setActiveBusinessState] = useState<Business | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Mock stores/features for compatibility with existing UI
    const [stores] = useState<Store[]>([allStores])
    const [currentStore, setCurrentStore] = useState<Store>(allStores)
    const [features] = useState<Record<string, boolean>>({
        'beta_analytics': true,
        'advanced_inventory': false
    })

    const setActiveBusiness = useCallback((business: Business | null) => {
        setActiveBusinessState(business)
        if (business) {
            storage.set(STORAGE_KEYS.ACTIVE_BUSINESS_ID, business.id)
        } else {
            storage.remove(STORAGE_KEYS.ACTIVE_BUSINESS_ID)
        }
    }, [])

    const refreshBusinesses = useCallback(async () => {
        // Only fetch if authenticated
        if (!apiClient.getToken()) {
            setIsLoading(false)
            return
        }

        try {
            const data = await apiClient.get<Business[]>('/api/businesses')
            setBusinesses(data)

            // Auto-selection or restoration
            const savedId = storage.get(STORAGE_KEYS.ACTIVE_BUSINESS_ID)

            if (data.length === 1) {
                setActiveBusiness(data[0])
            } else if (savedId) {
                const found = data.find(b => b.id === savedId)
                if (found) {
                    setActiveBusiness(found)
                }
            }
        } catch (error) {
            console.error('Failed to fetch businesses:', error)
            // toast.error('Failed to load businesses')
        } finally {
            setIsLoading(false)
        }
    }, [setActiveBusiness])

    useEffect(() => {
        refreshBusinesses()
    }, [refreshBusinesses])

    return (
        <BusinessContext.Provider value={{
            businesses,
            activeBusiness,
            setActiveBusiness,
            isLoading,
            refreshBusinesses,
            businessName: activeBusiness?.name || "",
            ownerName: "Josiah", // Should ideally come from auth context
            currentStore,
            setCurrentStore,
            stores,
            features
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
