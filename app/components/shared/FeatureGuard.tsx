"use client"

import { ReactNode } from "react"
import { useFeature } from "../../hooks/useFeature"

interface FeatureGuardProps {
    feature: string
    children: ReactNode
    fallback?: ReactNode
}

/**
 * Component that renders children only if the specified feature is enabled.
 * Optionally renders a fallback if the feature is disabled.
 */
export function FeatureGuard({ feature, children, fallback = null }: FeatureGuardProps) {
    const isEnabled = useFeature(feature)

    if (isEnabled) {
        return <>{children}</>
    }

    return <>{fallback}</>
}
