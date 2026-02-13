import { ReactNode } from "react"
import { useEntitlement } from "../../hooks/useEntitlements"
import { UpgradePrompt } from "./UpgradePrompt"

interface FeatureGuardProps {
    feature: string
    children: ReactNode
    fallback?: ReactNode
    showUpgradePrompt?: boolean
}

/**
 * Component that renders children only if the specified feature is enabled.
 * Checks both RBAC and Plan entitlements. 
 * Shows a standard UpgradePrompt if the feature is disabled due to plan limits.
 */
export function FeatureGuard({
    feature,
    children,
    fallback = null,
    showUpgradePrompt = false
}: FeatureGuardProps) {
    const entitlement = useEntitlement(feature)

    if (entitlement.allowed) {
        return <>{children}</>
    }

    // If we want to show a standard upgrade prompt for plan/limit reasons
    if (showUpgradePrompt && (entitlement.reason === 'limit_reached' || entitlement.reason === 'plan_required')) {
        return (
            <UpgradePrompt
                icon={entitlement.reason === 'limit_reached' ? 'limit' : 'plan'}
                description={
                    entitlement.reason === 'limit_reached'
                        ? `You've reached your ${entitlement.key} limit. Upgrade to continue.`
                        : `This feature is not available on your current plan. Upgrade to unlock.`
                }
            />
        )
    }

    return <>{fallback}</>
}
