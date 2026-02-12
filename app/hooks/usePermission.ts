"use client"

import { useBusiness } from "../components/BusinessProvider"

export function usePermission() {
    const { role, permissions } = useBusiness()

    /**
     * Check if the user has a specific permission
     */
    const can = (permission: string): boolean => {
        if (role === 'OWNER') return true
        if (!permissions) return false
        return permissions[permission] === true
    }

    /**
     * Check if the user has any of the given permissions
     */
    const canAny = (permissionsList: string[]): boolean => {
        if (role === 'OWNER') return true
        return permissionsList.some(p => can(p))
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
        permissions
    }
}
