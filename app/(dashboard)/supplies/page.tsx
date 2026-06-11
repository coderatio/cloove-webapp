"use client"

import { SuppliesView } from "@/app/domains/supplies/components/SuppliesView"
import { PermissionGuard } from "@/app/components/shared/PermissionGuard"

export default function SuppliesPage() {
    return (
        <PermissionGuard permission="VIEW_SUPPLIES">
            <SuppliesView />
        </PermissionGuard>
    )
}
