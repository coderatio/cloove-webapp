"use client"

import { useMemo } from "react"
import { useBusiness } from "../components/BusinessProvider"
import { useCurrentSubscription, useUsageStats } from "@/app/domains/business/hooks/useBilling"
import type { SubscriptionResponse } from "@/app/domains/business/hooks/useBilling"

const STAFF_PERMISSIONS = new Set(["MANAGE_STAFF", "VIEW_STAFF"])

function planAllowsStaffAccounts(subData: SubscriptionResponse | undefined): boolean {
    if (!subData?.currentPlan) return false
    const benefits = subData.currentPlan.benefits as Record<string, unknown> | undefined
    const raw = benefits?.staffAccounts
    if (raw === null || raw === undefined) return false
    if (raw === Infinity) return true
    return Number(raw) > 0
}

export function usePermission() {
    const { role, permissions, isLoading: isBusinessLoading } = useBusiness()
    const { data: subData, isLoading: isSubLoading } = useCurrentSubscription()
    const { data: usage, isLoading: isUsageLoading } = useUsageStats()

    const staffAllowedByPlan = useMemo(() => planAllowsStaffAccounts(subData), [subData])

    const loading = isBusinessLoading || isSubLoading || isUsageLoading

    /**
     * True when the current plan allows at least one staff seat (matches backend PlanService.canAccessFeature).
     */
    const canUseStaffFeature = (): boolean => staffAllowedByPlan

    /**
     * True when the user can invite another staff member (under plan limit).
     */
    const canInviteStaff = (): boolean => {
        if (!staffAllowedByPlan) return false
        if (role !== "OWNER" && permissions?.MANAGE_STAFF !== true) return false

        const benefits = subData?.currentPlan?.benefits as Record<string, unknown> | undefined
        const maxStaff = benefits?.staffAccounts
        const isUnlimited =
            maxStaff === undefined || maxStaff === null || maxStaff === Infinity
        if (isUnlimited) return true
        if (usage == null) return false
        return usage.staffAccounts < Number(maxStaff)
    }

    /**
     * Check if the user has a specific permission (aligned with API: staff perms require plan + role).
     */
    const can = (permission: string): boolean => {
        if (STAFF_PERMISSIONS.has(permission)) {
            if (!staffAllowedByPlan) return false
            if (role === "OWNER") return true
            if (!permissions) return false
            return permissions[permission] === true
        }

        if (role === "OWNER") return true
        if (!permissions) return false
        return permissions[permission] === true
    }

    /**
     * Check if the user has any of the given permissions (OR logic).
     */
    const canAny = (permissionsList: string[]): boolean => {
        return permissionsList.some((p) => can(p))
    }

    /**
     * Check if the user has a specific role
     */
    const hasRole = (targetRole: string): boolean => {
        return role === targetRole
    }

    return {
        can,
        canAny,
        hasRole,
        role,
        permissions,
        loading,
        canUseStaffFeature,
        canInviteStaff,
    }
}
