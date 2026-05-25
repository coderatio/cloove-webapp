"use client"

import { PermissionGuard } from "@/app/components/shared/PermissionGuard"
import { WhatsAppAppView } from "@/app/domains/messaging/components/WhatsAppAppView"

export default function WhatsAppPage() {
    return (
        <PermissionGuard anyPermission={["VIEW_WHATSAPP_CONVERSATIONS", "MANAGE_WHATSAPP_CONVERSATIONS"]}>
            <WhatsAppAppView />
        </PermissionGuard>
    )
}
