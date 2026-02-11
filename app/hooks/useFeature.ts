"use client"

import { useBusiness } from "../components/BusinessProvider"

/**
 * Hook to check if a specific feature is enabled for the current business
 * @param featureKey The key of the feature flag to check
 * @returns boolean indicating if the feature is enabled
 */
export function useFeature(featureKey: string): boolean {
    const { features } = useBusiness()

    // If features is undefined (loading or error), default to false
    if (!features) return false

    return !!features[featureKey]
}
