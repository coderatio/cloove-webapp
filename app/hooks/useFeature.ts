"use client"

import { useBusiness } from "../components/BusinessProvider"

/**
 * Hook to check if a specific feature is enabled for the current business
 * @param featureKey The key of the feature flag to check
 * @returns boolean indicating if the feature is enabled
 */
export function useFeature(featureKey: string): boolean {
    const { permissions, role } = useBusiness()

    if (role === 'OWNER') return true

    // Fallback for previous mock features
    const legacyFeatures: Record<string, boolean> = {
        'beta_analytics': true,
        'advanced_inventory': false
    }

    if (legacyFeatures[featureKey] !== undefined) {
        return legacyFeatures[featureKey]
    }

    if (!permissions) return false

    return !!permissions[featureKey]
}
