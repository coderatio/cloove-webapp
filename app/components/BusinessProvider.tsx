"use client"

import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter, usePathname } from 'next/navigation'
import { apiClient } from '@/app/lib/api-client'
import { storage, STORAGE_KEYS } from '@/app/lib/storage'
import { toast } from 'sonner'
import { useAuth } from './providers/auth-provider'

export type BusinessType = 'INDIVIDUAL' | 'REGISTERED'

export interface Business {
    id: string
    name: string
    slug: string
    currency: string
    logo?: string
    role: string
    businessType: BusinessType | null
    permissions: Record<string, boolean> | null
    stores: Array<{ id: string; name: string }>
    features: Record<string, boolean> | null
}


interface BusinessContextType {
    businesses: Business[]
    activeBusiness: Business | null
    setActiveBusiness: (business: Business | null, options?: { quiet?: boolean }) => void
    isLoading: boolean
    isRefreshing: boolean
    refreshBusinesses: () => Promise<Business[] | undefined>

    businessName: string
    ownerName: string

    // Authorization
    role: string | null
    permissions: Record<string, boolean> | null
    features: Record<string, boolean> | null
    currency: string
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined)

const BUSINESS_TYPE_EXEMPT_PATHS = [
    '/select-business-type',
    '/select-business',
    '/onboarding',
    '/login',
    '/register',
]

export function BusinessProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient()
    const [businesses, setBusinesses] = useState<Business[]>([])
    const { user, isLoading: isAuthLoading } = useAuth()
    const [activeBusiness, setActiveBusinessState] = useState<Business | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const router = useRouter()
    const pathname = usePathname()
    // Tracks which user's businesses have been fetched to prevent Strict Mode double-calls
    const fetchedForUserRef = useRef<string | null>(null)

    const setActiveBusiness = useCallback((business: Business | null, options?: { quiet?: boolean }) => {
        setActiveBusinessState(business)

        if (business) {
            storage.setActiveBusinessId(business.id)
            // Invalidate all queries to force refetch with new business header
            queryClient.invalidateQueries()

            if (!options?.quiet) {
                const isSelectionPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/select-business')
                const action = isSelectionPage ? 'Selected' : 'Switched to'
                toast.success(`${action} ${business.name}`)
            }
        } else {
            storage.removeActiveBusinessId()
        }
    }, [queryClient])

    const refreshBusinesses = useCallback(async (): Promise<Business[] | undefined> => {
        setIsRefreshing(true)
        try {
            const data = await apiClient.get<Business[]>('/businesses')
            setBusinesses(data)

            const savedId = storage.getActiveBusinessId()
            if (data.length === 1) {
                setActiveBusiness(data[0], { quiet: true })
            } else if (savedId) {
                const found = data.find(b => b.id === savedId)
                if (found) {
                    setActiveBusiness(found, { quiet: true })
                }
            }
            return data
        } catch (error) {
            toast.error('Failed to load businesses. Please try again.')
            return undefined
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }, [setActiveBusiness])

    useEffect(() => {
        if (isAuthLoading) return // Wait for auth check to finish
        if (!user) {
            setIsLoading(false)  // Not authenticated — no businesses to load
            setBusinesses([])
            setActiveBusinessState(null)
            fetchedForUserRef.current = null
            return
        }
        // Deduplicate: skip if already fetched for this user (guards against Strict Mode double-invoke)
        if (fetchedForUserRef.current === user.id) return
        fetchedForUserRef.current = user.id
        refreshBusinesses()
    // refreshBusinesses is a stable useCallback — safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, isAuthLoading])

    // Handle all business-related redirects (Selection -> Type Selection -> Dashboard)
    useEffect(() => {
        if (isLoading || isRefreshing || isAuthLoading || !user) return

        // 1. No business selected? Must go select one (unless on an onboarding/auth page)
        if (!activeBusiness) {
            const isBusinessSelectionPage = ['/select-business', '/onboarding', '/login', '/register'].some(p => pathname === p || pathname.startsWith(p + '/'))
            if (!isBusinessSelectionPage) {
                const callbackUrl = encodeURIComponent(pathname)
                router.replace(`/select-business?callbackUrl=${callbackUrl}`)
            }
            return
        }

        // 2. Business selected but no type? Must go select type (Only for Owners)
        // Non-owners should NEVER be redirected to setup pages
        if (activeBusiness.businessType == null) {
            if (activeBusiness.role === 'OWNER') {
                const isExemptFromTypeSelection = BUSINESS_TYPE_EXEMPT_PATHS.some(p => pathname.startsWith(p))
                if (!isExemptFromTypeSelection) {
                    const callbackUrl = encodeURIComponent(pathname)
                    router.replace(`/select-business-type?callbackUrl=${callbackUrl}`)
                }
            }
            return
        }

        // 3. Prevent non-owners from accessing setup pages directly
        const isSetupPage = ['/onboarding', '/select-business-type'].some(p => pathname === p)
        if (isSetupPage && activeBusiness.role !== 'OWNER' && activeBusiness.role !== null) {
            router.replace('/')
            return
        }
    }, [activeBusiness, isLoading, isRefreshing, isAuthLoading, user, pathname, router])

    const getBusinessCurrency = useCallback(() => {
        const currencyCode = activeBusiness?.currency!
        try {
            const parts = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currencyCode,
                currencyDisplay: 'narrowSymbol',
            }).formatToParts(0)
            return parts.find(p => p.type === 'currency')?.value || currencyCode
        } catch (e) {
            return '₦'
        }
    }, [activeBusiness?.currency])

    return (
        <BusinessContext.Provider value={{
            businesses,
            activeBusiness,
            setActiveBusiness,
            isLoading,
            isRefreshing,
            refreshBusinesses,
            businessName: activeBusiness?.name || "",
            ownerName: user?.firstName || "",
            role: activeBusiness?.role || null,
            permissions: activeBusiness?.permissions || null,
            features: activeBusiness?.features || null,
            currency: getBusinessCurrency()
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
