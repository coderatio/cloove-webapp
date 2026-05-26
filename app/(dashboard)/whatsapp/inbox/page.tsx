"use client"

import { PermissionGuard } from "@/app/components/shared/PermissionGuard"
import { WhatsAppInboxPageView } from "@/app/domains/messaging/components/WhatsAppInboxView"

export default function WhatsAppInboxPage() {
    return (
        <PermissionGuard anyPermission={["VIEW_WHATSAPP_CONVERSATIONS", "MANAGE_WHATSAPP_CONVERSATIONS"]}>
            <WhatsAppInboxPageView />
        </PermissionGuard>
    )
}
