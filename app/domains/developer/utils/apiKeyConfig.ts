import type {
    DeveloperApiKeyScope,
    DeveloperWebhookEvent,
} from "@/app/domains/developer/hooks/useDeveloperApiKeys"

export type ExpiryPreset = "60-days" | "never" | "custom"

export const SCOPE_LABELS: Record<DeveloperApiKeyScope, string> = {
    "vox:read": "Vox read",
    "vox:calls:read": "Read calls",
    "vox:calls:create": "Make calls",
    "vox:agents:read": "Read agents",
    "vox:numbers:read": "Read numbers",
    "messaging:read": "Messaging read",
    "messaging:conversations:read": "Read conversations",
    "messaging:messages:read": "Read messages",
    "messaging:messages:send": "Send messages",
    "contacts:read": "Read contacts",
    "contacts:write": "Manage contacts",
    "products:read": "Read products",
    "products:write": "Manage products",
    "orders:read": "Read orders",
    "orders:write": "Manage orders",
    "wallet:read": "Read wallet balance",
    "payouts:read": "Read payout accounts",
    "payouts:write": "Manage payout accounts",
    "wallet:withdrawals:read": "Read withdrawals",
    "wallet:withdrawals:create": "Initiate withdrawals",
    "webhooks:read": "Read webhook destinations",
    "webhooks:write": "Manage webhook destinations",
}

export const SCOPE_GROUPS: Array<{
    id: string
    title: string
    description: string
    scopes: DeveloperApiKeyScope[]
}> = [
    {
        id: "vox",
        title: "Vox",
        description: "Voice engine access for calls, agents, and numbers.",
        scopes: [
            "vox:read",
            "vox:calls:read",
            "vox:calls:create",
            "vox:agents:read",
            "vox:numbers:read",
        ],
    },
    {
        id: "messaging",
        title: "Messaging",
        description: "Read WhatsApp conversations and send messages.",
        scopes: [
            "messaging:read",
            "messaging:conversations:read",
            "messaging:messages:read",
            "messaging:messages:send",
        ],
    },
    {
        id: "contacts",
        title: "Contacts",
        description: "Read and manage customers.",
        scopes: ["contacts:read", "contacts:write"],
    },
    {
        id: "products",
        title: "Products",
        description: "Read and manage products and catalog.",
        scopes: ["products:read", "products:write"],
    },
    {
        id: "orders",
        title: "Orders",
        description: "Read and record orders and sales.",
        scopes: ["orders:read", "orders:write"],
    },
    {
        id: "wallet",
        title: "Wallet & payouts",
        description:
            "Read wallet balance, manage payout accounts, and initiate withdrawals. Live keys with finance write access require an IP allowlist.",
        scopes: [
            "wallet:read",
            "payouts:read",
            "payouts:write",
            "wallet:withdrawals:read",
            "wallet:withdrawals:create",
        ],
    },
    {
        id: "webhooks",
        title: "Webhooks",
        description: "Manage webhook destinations and feature event subscriptions.",
        scopes: [
            "webhooks:read",
            "webhooks:write",
        ],
    },
]

export const DEFAULT_API_KEY_SCOPES: DeveloperApiKeyScope[] = [
    "vox:read",
    "vox:calls:read",
    "vox:agents:read",
    "vox:numbers:read",
    "webhooks:read",
]

// Keep in sync with api/app/domains/developer/webhook_events.ts (WEBHOOK_EVENT_CATALOG).
export const WEBHOOK_EVENT_LABELS: Record<DeveloperWebhookEvent, string> = {
    "vox.call.started": "Call started",
    "vox.call.completed": "Call completed",
    "vox.call.failed": "Call failed",
    "vox.recording.ready": "Recording ready",
    "vox.agent.updated": "Agent updated",
    "messaging.message.received": "Message received",
    "messaging.message.sent": "Message sent",
    "messaging.message.delivery_updated": "Message delivery updated",
    "messaging.conversation.assigned": "Conversation assigned",
    "order.created": "Order created",
    "order.updated": "Order updated",
    "order.cancelled": "Order cancelled",
    "order.refunded": "Order refunded",
    "product.created": "Product created",
    "product.updated": "Product updated",
    "inventory.low_stock": "Low stock",
    "inventory.out_of_stock": "Out of stock",
    "contact.created": "Contact created",
    "contact.updated": "Contact updated",
    "payment.received": "Payment received",
    "wallet.withdrawal.requested": "Withdrawal requested",
    "wallet.withdrawal.completed": "Withdrawal completed",
    "wallet.withdrawal.failed": "Withdrawal failed",
    "wallet.deposit": "Wallet deposit",
}

export const WEBHOOK_EVENT_GROUPS: Array<{
    id: string
    title: string
    description: string
    events: DeveloperWebhookEvent[]
}> = [
    {
        id: "vox",
        title: "Vox",
        description: "Voice call lifecycle and recordings.",
        events: [
            "vox.call.started",
            "vox.call.completed",
            "vox.call.failed",
            "vox.recording.ready",
            "vox.agent.updated",
        ],
    },
    {
        id: "messaging",
        title: "Messaging",
        description: "WhatsApp message and conversation events.",
        events: [
            "messaging.message.received",
            "messaging.message.sent",
            "messaging.message.delivery_updated",
            "messaging.conversation.assigned",
        ],
    },
    {
        id: "orders",
        title: "Orders",
        description: "Order lifecycle events.",
        events: ["order.created", "order.updated", "order.cancelled", "order.refunded"],
    },
    {
        id: "products",
        title: "Products",
        description: "Product and inventory events.",
        events: ["product.created", "product.updated", "inventory.low_stock", "inventory.out_of_stock"],
    },
    {
        id: "contacts",
        title: "Contacts",
        description: "Customer events.",
        events: ["contact.created", "contact.updated"],
    },
    {
        id: "wallet",
        title: "Payments & wallet",
        description: "Payments, withdrawals, and deposits.",
        events: [
            "payment.received",
            "wallet.withdrawal.requested",
            "wallet.withdrawal.completed",
            "wallet.withdrawal.failed",
            "wallet.deposit",
        ],
    },
]
