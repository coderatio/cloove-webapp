import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/app/lib/api-client"
import { storage } from "@/app/lib/storage"
import { useBusiness } from "../components/BusinessProvider"

export interface Entitlement {
    key: string
    allowed: boolean
    limit: number | boolean
    used: number | null
    remaining: number | null
    reason: 'unauthorized' | 'limit_reached' | 'plan_required' | null
}

export const useEntitlements = () => {
    const businessId = storage.getActiveBusinessId() as string
    return useQuery({
        queryKey: ["entitlements", businessId],
        queryFn: () => apiClient.get<Record<string, Entitlement>>("/subscriptions/entitlements"),
        enabled: !!businessId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    })
}

/**
 * Hook to get detailed entitlement info for a specific feature.
 * This is specifically for subscription-based limits and features.
 */
export function useEntitlement(featureKey: string): Entitlement {
    const { role } = useBusiness()
    const { data: entitlements } = useEntitlements()

    // 1. Check Entitlements (Plan Limits) from API
    if (entitlements && entitlements[featureKey]) {
        return entitlements[featureKey]
    }

    // 2. Fallback for Owner (if API hasn't loaded or key is missing but they are owner)
    if (role === 'OWNER') {
        return {
            key: featureKey,
            allowed: true,
            limit: true,
            used: null,
            remaining: null,
            reason: null
        }
    }

    // 3. Fallback for staff
    // The backend now correctly populates entitlements for the business context 
    // for all authorized members (owners and staff).
    return {
        key: featureKey,
        allowed: false,
        limit: false,
        used: null,
        remaining: null,
        reason: 'unauthorized'
    }
}
