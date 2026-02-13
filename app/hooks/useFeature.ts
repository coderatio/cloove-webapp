"use client"

import { useBusiness } from "../components/BusinessProvider"

/**
 * Hook to check if a specific feature is enabled for the current business.
 * This checks the business-level feature flags (often derived from permissions).
 * 
 * @param featureKey The key of the feature flag to check
 * @returns boolean indicating if the feature is enabled
 */
export function useFeature(featureKey: string): boolean {
    const { permissions, role, features } = useBusiness()

    // 1. Check Business-level feature enablement (Plan/Config)
    // If feature is explicitly false for the business, everyone is blocked
    if (features && features[featureKey] === false) {
        return false
    }

    // 2. Role based bypass (Owners have all available features)
    if (role === 'OWNER') return true

    // 3. Permission based check for non-owners
    if (!permissions) return false

    return !!permissions[featureKey]
}
