"use client"

import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter, usePathname } from 'next/navigation'
import { apiClient, ApiError } from '@/app/lib/api-client'
import { HttpStatus } from '@/app/lib/http-status'
import { storage } from '@/app/lib/storage'
import { toast } from 'sonner'
import { useAuth } from './providers/auth-provider'

export type BusinessType = 'INDIVIDUAL' | 'REGISTERED'

export interface Business {
    id: string
    name: string
    slug: string
    code: string
    currency: string
    logo?: string
    role: string
    businessType: BusinessType | null
    /** Active workspace layout preset for this business (e.g. 'restaurant', 'retail') */
    layoutPreset: string
    permissions: Record<string, boolean> | null
    stores: Array<{ id: string; name: string }>
    features: Record<string, boolean> | null
}


interface BusinessContextType {
    businesses: Business[]
    activeBusiness: Business | null
    setActiveBusiness: (business: Business | null, options?: { quiet?: boolean }) => void
    isBusinessSelectable: (business: Business | null) => boolean
    isLoading: boolean
    isRefreshing: boolean
    refreshBusinesses: () => Promise<Business[] | undefined>
    /** True when /businesses failed and we had no cached list to restore (do not show “create business” onboarding) */
    businessesLoadFailed: boolean
    /** Last fetch failed but we restored businesses from local cache (e.g. rate limit) */
    isUsingStaleBusinesses: boolean
    isMultiBusinessRestricted: boolean
    primaryBusinessId: string | null

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

interface BusinessesCachePayload {
    userId: string
    businesses: Business[]
    primaryBusinessId: string | null
    /** Legacy field — ignored on read; restriction is always resolved live from `/subscriptions`. */
    isMultiBusinessRestricted?: boolean
}

function parseBusinessesCache(userId: string): BusinessesCachePayload | null {
    const raw = storage.getBusinessesCacheJson()
    if (!raw) return null
    try {
        const p = JSON.parse(raw) as BusinessesCachePayload
        if (p.userId !== userId || !Array.isArray(p.businesses)) return null
        return p
    } catch {
        return null
    }
}

async function fetchBusinessesWithRetry(): Promise<Business[]> {
    try {
        return await apiClient.get<Business[]>('/businesses')
    } catch (e) {
        if (e instanceof ApiError && e.statusCode === HttpStatus.TOO_MANY_REQUESTS) {
            await new Promise((r) => setTimeout(r, 1600))
            return await apiClient.get<Business[]>('/businesses')
        }
        throw e
    }
}

type SubscriptionBusinessGate = {
    /** Extra businesses locked (free tier or overdue). */
    multiBusinessRestricted: boolean
    /** Current plan is starter/free/$0 — used with `subscriptionAlert` to bust stale localStorage. */
    isFreeTierPlan: boolean
}

/**
 * Multi-business restriction + free-tier flag from `/subscriptions`.
 * Uses current plan entitlements — not `subscription.status === 'expired'` alone (stale row after upgrade).
 *
 * Extra businesses are locked only on free/starter/$0 plans. Do **not** lock on `past_due` while the user
 * is still entitled to a paid plan (e.g. `grace_period` / billing grace, or trialing) — `subscriptionAlert`
 * types are informational; gating follows plan tier from `/subscriptions`.
 */
async function resolveSubscriptionBusinessGate(
    firstBusinessId: string | null,
    businessCount: number
): Promise<SubscriptionBusinessGate> {
    if (!firstBusinessId) {
        return { multiBusinessRestricted: false, isFreeTierPlan: true }
    }
    try {
        const subData = await apiClient.get<{
            currentPlan: { monthlyPrice?: number; slug?: string } | null
            subscription: { status?: string } | null
        }>('/subscriptions', undefined, { businessIdOverride: firstBusinessId })

        const plan = subData?.currentPlan
        const slug = (plan?.slug ?? '').toLowerCase()
        const monthly = Number(plan?.monthlyPrice ?? 0)
        const isFreeTierPlan =
            !plan || monthly === 0 || slug === 'starter' || slug === 'free'

        const multiBusinessRestricted = businessCount > 1 && isFreeTierPlan

        return { multiBusinessRestricted, isFreeTierPlan }
    } catch {
        return {
            multiBusinessRestricted: businessCount > 1,
            isFreeTierPlan: true,
        }
    }
}

export function BusinessProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient()
    const [businesses, setBusinesses] = useState<Business[]>([])
    const { user, isLoading: isAuthLoading } = useAuth()
    const [activeBusiness, setActiveBusinessState] = useState<Business | null>(null)
    const [isMultiBusinessRestricted, setIsMultiBusinessRestricted] = useState(false)
    const [primaryBusinessId, setPrimaryBusinessId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [businessesLoadFailed, setBusinessesLoadFailed] = useState(false)
    const [isUsingStaleBusinesses, setIsUsingStaleBusinesses] = useState(false)
    const router = useRouter()
    const pathname = usePathname()
    // Tracks which user's businesses have been fetched to prevent Strict Mode double-calls
    const fetchedForUserRef = useRef<string | null>(null)

    const isBusinessSelectable = useCallback((business: Business | null) => {
        if (!business) return true
        if (!isMultiBusinessRestricted || !primaryBusinessId) return true
        return business.id === primaryBusinessId
    }, [isMultiBusinessRestricted, primaryBusinessId])

    const setActiveBusiness = useCallback((business: Business | null, options?: { quiet?: boolean }) => {
        if (business && !isBusinessSelectable(business)) {
            if (!options?.quiet) {
                toast.error('Upgrade your plan to access this business.')
            }
            return
        }

        setActiveBusinessState(business)

        if (business) {
            storage.setActiveBusinessId(business.id)
            // Mark all queries stale without immediately firing them —
            // each section refetches on demand with the new business header
            queryClient.invalidateQueries({ refetchType: 'none' })

            if (!options?.quiet) {
                const isSelectionPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/select-business')
                const action = isSelectionPage ? 'Selected' : 'Switched to'
                toast.success(`${action} ${business.name}`)
            }
        } else {
            storage.removeActiveBusinessId()
        }
    }, [queryClient, isBusinessSelectable])

    const refreshBusinesses = useCallback(async (): Promise<Business[] | undefined> => {
        if (!user?.id) return undefined
        setIsRefreshing(true)

        const applyActiveSelection = (
            data: Business[],
            nextRestricted: boolean,
            firstBusinessId: string | null,
            firstBusiness: Business | null,
        ) => {
            const savedId = storage.getActiveBusinessId()
            if (data.length === 1) {
                setActiveBusiness(data[0], { quiet: true })
            } else if (savedId) {
                const found = data.find((b) => b.id === savedId)
                if (found && (!nextRestricted || found.id === firstBusinessId)) {
                    setActiveBusiness(found, { quiet: true })
                } else if (nextRestricted && firstBusiness) {
                    setActiveBusiness(firstBusiness, { quiet: true })
                }
            } else if (nextRestricted && firstBusiness) {
                setActiveBusiness(firstBusiness, { quiet: true })
            }
        }

        try {
            const data = await fetchBusinessesWithRetry()
            setBusinesses(data)
            const ownerBusinesses = data.filter((b) => b.role === 'OWNER')
            const firstBusiness = ownerBusinesses[0] ?? data[0] ?? null
            const firstBusinessId = firstBusiness?.id ?? null

            setPrimaryBusinessId(firstBusinessId)

            const gate = await resolveSubscriptionBusinessGate(firstBusinessId, data.length)
            setIsMultiBusinessRestricted(gate.multiBusinessRestricted)
            applyActiveSelection(data, gate.multiBusinessRestricted, firstBusinessId, firstBusiness)

            // Server has no billing alert and user is on a paid plan — drop stale businesses snapshot, then persist fresh.
            if (user.subscriptionAlert == null && !gate.isFreeTierPlan) {
                storage.clearBusinessesCache()
            }

            try {
                storage.setBusinessesCacheJson(
                    JSON.stringify({
                        userId: user.id,
                        businesses: data,
                        primaryBusinessId: firstBusinessId,
                    } satisfies BusinessesCachePayload),
                )
            } catch {
                // ignore quota / private mode
            }

            setBusinessesLoadFailed(false)
            setIsUsingStaleBusinesses(false)
            return data
        } catch {
            const cached = parseBusinessesCache(user.id)
            if (cached && cached.businesses.length > 0) {
                setBusinesses(cached.businesses)
                setPrimaryBusinessId(cached.primaryBusinessId)
                const ownerBusinesses = cached.businesses.filter((b) => b.role === 'OWNER')
                const firstBusiness = ownerBusinesses[0] ?? cached.businesses[0] ?? null
                const firstBusinessId =
                    cached.primaryBusinessId ?? firstBusiness?.id ?? null
                const gate = await resolveSubscriptionBusinessGate(
                    firstBusinessId,
                    cached.businesses.length
                )
                setIsMultiBusinessRestricted(gate.multiBusinessRestricted)
                applyActiveSelection(
                    cached.businesses,
                    gate.multiBusinessRestricted,
                    firstBusinessId,
                    firstBusiness,
                )
                setBusinessesLoadFailed(false)
                setIsUsingStaleBusinesses(true)
                toast.message('Could not refresh your businesses (requests limited). Using saved data — try again shortly.')
                return cached.businesses
            }

            setBusinessesLoadFailed(true)
            toast.error('Failed to load businesses. Please try again.')
            return undefined
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }, [setActiveBusiness, user?.id, user?.subscriptionAlert])

    useEffect(() => {
        if (isAuthLoading) return // Wait for auth check to finish
        if (!user) {
            setIsLoading(false)  // Not authenticated — no businesses to load
            setBusinesses([])
            setActiveBusinessState(null)
            setIsMultiBusinessRestricted(false)
            setPrimaryBusinessId(null)
            setBusinessesLoadFailed(false)
            setIsUsingStaleBusinesses(false)
            fetchedForUserRef.current = null
            return
        }
        // Deduplicate: skip if already fetched for this user (guards against Strict Mode double-invoke)
        if (fetchedForUserRef.current === user.id) return
        fetchedForUserRef.current = user.id
        setIsLoading(true) // Ensure guard waits during the initial fetch for a new user
        refreshBusinesses()
        // refreshBusinesses is a stable useCallback — safe to omit from deps
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, isAuthLoading])

    // Handle all business-related redirects (Selection -> Type Selection -> Dashboard)
    useEffect(() => {
        if (isLoading || isRefreshing || isAuthLoading || !user) return

        // Skip all business redirects when on field agent pages
        if (pathname.startsWith('/field')) return

        // Field-agent-only users (no businesses) trying to access dashboard pages → redirect to agent portal
        if (user.fieldAgent && businesses.length === 0) {
            const isExemptPath = ['/field', '/login', '/register', '/select-business'].some(
                (p) => pathname.startsWith(p)
            )
            if (!isExemptPath) {
                router.replace('/field')
                return
            }
        }

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
    }, [activeBusiness, isLoading, isRefreshing, isAuthLoading, user, pathname, router, businesses.length])

    const getBusinessCurrency = useCallback(() => {
        const currencyCode = activeBusiness?.currency || 'NGN'
        try {
            const parts = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currencyCode,
                currencyDisplay: 'narrowSymbol',
            }).formatToParts(0)
            return parts.find(p => p.type === 'currency')?.value || currencyCode
        } catch {
            return '₦'
        }
    }, [activeBusiness?.currency])

    return (
        <BusinessContext.Provider value={{
            businesses,
            activeBusiness,
            setActiveBusiness,
            isBusinessSelectable,
            isLoading,
            isRefreshing,
            refreshBusinesses,
            businessesLoadFailed,
            isUsingStaleBusinesses,
            isMultiBusinessRestricted,
            primaryBusinessId,
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
