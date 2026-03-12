"use client"

import { InventoryView } from "@/app/domains/inventory/components/InventoryView"
import { PermissionGuard } from "@/app/components/shared/PermissionGuard"

export default function InventoryPage() {
    return (
        <PermissionGuard permission="VIEW_PRODUCTS">
            <InventoryView />
        </PermissionGuard>
    )
}
