import {
    DeveloperScope,
    WebhookEvent,
    type DeveloperApiKeyScope,
    type DeveloperWebhookEvent,
} from "@/app/domains/developer/hooks/useDeveloperApiKeys"

export type ExpiryPreset = "60-days" | "never" | "custom"

export const SCOPE_LABELS: Record<DeveloperApiKeyScope, string> = {
    [DeveloperScope.VOX_READ]: "Vox read",
    [DeveloperScope.VOX_CALLS_READ]: "Read calls",
    [DeveloperScope.VOX_CALLS_CREATE]: "Make calls",
    [DeveloperScope.VOX_AGENTS_READ]: "Read agents",
    [DeveloperScope.VOX_NUMBERS_READ]: "Read numbers",
    [DeveloperScope.MESSAGING_READ]: "Messaging read",
    [DeveloperScope.MESSAGING_CONVERSATIONS_READ]: "Read conversations",
    [DeveloperScope.MESSAGING_MESSAGES_READ]: "Read messages",
    [DeveloperScope.MESSAGING_MESSAGES_SEND]: "Send messages",
    [DeveloperScope.CONTACTS_READ]: "Read contacts",
    [DeveloperScope.CONTACTS_WRITE]: "Manage contacts",
    [DeveloperScope.PRODUCTS_READ]: "Read products",
    [DeveloperScope.PRODUCTS_WRITE]: "Manage products",
    [DeveloperScope.ORDERS_READ]: "Read orders",
    [DeveloperScope.ORDERS_WRITE]: "Manage orders",
    [DeveloperScope.WALLET_READ]: "Read wallet balance",
    [DeveloperScope.PAYOUTS_READ]: "Read payout accounts",
    [DeveloperScope.PAYOUTS_WRITE]: "Manage payout accounts",
    [DeveloperScope.WALLET_WITHDRAWALS_READ]: "Read withdrawals",
    [DeveloperScope.WALLET_WITHDRAWALS_CREATE]: "Initiate withdrawals",
    [DeveloperScope.HOTEL_READ]: "Hotel read",
    [DeveloperScope.HOTEL_ROOMS_READ]: "Read rooms",
    [DeveloperScope.HOTEL_ROOMS_WRITE]: "Manage rooms",
    [DeveloperScope.HOTEL_RESERVATIONS_READ]: "Read reservations",
    [DeveloperScope.HOTEL_RESERVATIONS_WRITE]: "Manage reservations",
    [DeveloperScope.WEBHOOKS_READ]: "Read webhook destinations",
    [DeveloperScope.WEBHOOKS_WRITE]: "Manage webhook destinations",
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
            DeveloperScope.VOX_READ,
            DeveloperScope.VOX_CALLS_READ,
            DeveloperScope.VOX_CALLS_CREATE,
            DeveloperScope.VOX_AGENTS_READ,
            DeveloperScope.VOX_NUMBERS_READ,
        ],
    },
    {
        id: "messaging",
        title: "Messaging",
        description: "Read WhatsApp conversations and send messages.",
        scopes: [
            DeveloperScope.MESSAGING_READ,
            DeveloperScope.MESSAGING_CONVERSATIONS_READ,
            DeveloperScope.MESSAGING_MESSAGES_READ,
            DeveloperScope.MESSAGING_MESSAGES_SEND,
        ],
    },
    {
        id: "contacts",
        title: "Contacts",
        description: "Read and manage customers.",
        scopes: [DeveloperScope.CONTACTS_READ, DeveloperScope.CONTACTS_WRITE],
    },
    {
        id: "products",
        title: "Products",
        description: "Read and manage products and catalog.",
        scopes: [DeveloperScope.PRODUCTS_READ, DeveloperScope.PRODUCTS_WRITE],
    },
    {
        id: "orders",
        title: "Orders",
        description: "Read and record orders and sales.",
        scopes: [DeveloperScope.ORDERS_READ, DeveloperScope.ORDERS_WRITE],
    },
    {
        id: "wallet",
        title: "Wallet & payouts",
        description:
            "Read wallet balance, manage payout accounts, and initiate withdrawals. Live keys with finance write access require an IP allowlist.",
        scopes: [
            DeveloperScope.WALLET_READ,
            DeveloperScope.PAYOUTS_READ,
            DeveloperScope.PAYOUTS_WRITE,
            DeveloperScope.WALLET_WITHDRAWALS_READ,
            DeveloperScope.WALLET_WITHDRAWALS_CREATE,
        ],
    },
    {
        id: "hotel",
        title: "Hotel",
        description: "Rooms and reservations for the AI front desk.",
        scopes: [
            DeveloperScope.HOTEL_READ,
            DeveloperScope.HOTEL_ROOMS_READ,
            DeveloperScope.HOTEL_ROOMS_WRITE,
            DeveloperScope.HOTEL_RESERVATIONS_READ,
            DeveloperScope.HOTEL_RESERVATIONS_WRITE,
        ],
    },
    {
        id: "webhooks",
        title: "Webhooks",
        description: "Manage webhook destinations and feature event subscriptions.",
        scopes: [DeveloperScope.WEBHOOKS_READ, DeveloperScope.WEBHOOKS_WRITE],
    },
]

export const DEFAULT_API_KEY_SCOPES: DeveloperApiKeyScope[] = [
    DeveloperScope.VOX_READ,
    DeveloperScope.VOX_CALLS_READ,
    DeveloperScope.VOX_AGENTS_READ,
    DeveloperScope.VOX_NUMBERS_READ,
    DeveloperScope.WEBHOOKS_READ,
]

// Keep in sync with api/app/domains/developer/webhook_events.ts (WEBHOOK_EVENT_CATALOG).
export const WEBHOOK_EVENT_LABELS: Record<DeveloperWebhookEvent, string> = {
    [WebhookEvent.VOX_CALL_STARTED]: "Call started",
    [WebhookEvent.VOX_CALL_COMPLETED]: "Call completed",
    [WebhookEvent.VOX_CALL_FAILED]: "Call failed",
    [WebhookEvent.VOX_RECORDING_READY]: "Recording ready",
    [WebhookEvent.VOX_AGENT_UPDATED]: "Agent updated",
    [WebhookEvent.MESSAGING_MESSAGE_RECEIVED]: "Message received",
    [WebhookEvent.MESSAGING_MESSAGE_SENT]: "Message sent",
    [WebhookEvent.MESSAGING_MESSAGE_DELIVERY_UPDATED]: "Message delivery updated",
    [WebhookEvent.MESSAGING_CONVERSATION_ASSIGNED]: "Conversation assigned",
    [WebhookEvent.ORDER_CREATED]: "Order created",
    [WebhookEvent.ORDER_UPDATED]: "Order updated",
    [WebhookEvent.ORDER_CANCELLED]: "Order cancelled",
    [WebhookEvent.ORDER_REFUNDED]: "Order refunded",
    [WebhookEvent.PRODUCT_CREATED]: "Product created",
    [WebhookEvent.PRODUCT_UPDATED]: "Product updated",
    [WebhookEvent.INVENTORY_LOW_STOCK]: "Low stock",
    [WebhookEvent.INVENTORY_OUT_OF_STOCK]: "Out of stock",
    [WebhookEvent.CONTACT_CREATED]: "Contact created",
    [WebhookEvent.CONTACT_UPDATED]: "Contact updated",
    [WebhookEvent.PAYMENT_RECEIVED]: "Payment received",
    [WebhookEvent.WALLET_WITHDRAWAL_REQUESTED]: "Withdrawal requested",
    [WebhookEvent.WALLET_WITHDRAWAL_COMPLETED]: "Withdrawal completed",
    [WebhookEvent.WALLET_WITHDRAWAL_FAILED]: "Withdrawal failed",
    [WebhookEvent.WALLET_DEPOSIT]: "Wallet deposit",
    [WebhookEvent.HOTEL_RESERVATION_CREATED]: "Reservation created",
    [WebhookEvent.HOTEL_RESERVATION_CHECKED_IN]: "Guest checked in",
    [WebhookEvent.HOTEL_RESERVATION_CHECKED_OUT]: "Guest checked out",
    [WebhookEvent.HOTEL_RESERVATION_CANCELLED]: "Reservation cancelled",
    [WebhookEvent.HOTEL_SERVICE_REQUEST_CREATED]: "Guest request created",
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
            WebhookEvent.VOX_CALL_STARTED,
            WebhookEvent.VOX_CALL_COMPLETED,
            WebhookEvent.VOX_CALL_FAILED,
            WebhookEvent.VOX_RECORDING_READY,
            WebhookEvent.VOX_AGENT_UPDATED,
        ],
    },
    {
        id: "messaging",
        title: "Messaging",
        description: "WhatsApp message and conversation events.",
        events: [
            WebhookEvent.MESSAGING_MESSAGE_RECEIVED,
            WebhookEvent.MESSAGING_MESSAGE_SENT,
            WebhookEvent.MESSAGING_MESSAGE_DELIVERY_UPDATED,
            WebhookEvent.MESSAGING_CONVERSATION_ASSIGNED,
        ],
    },
    {
        id: "orders",
        title: "Orders",
        description: "Order lifecycle events.",
        events: [
            WebhookEvent.ORDER_CREATED,
            WebhookEvent.ORDER_UPDATED,
            WebhookEvent.ORDER_CANCELLED,
            WebhookEvent.ORDER_REFUNDED,
        ],
    },
    {
        id: "products",
        title: "Products",
        description: "Product and inventory events.",
        events: [
            WebhookEvent.PRODUCT_CREATED,
            WebhookEvent.PRODUCT_UPDATED,
            WebhookEvent.INVENTORY_LOW_STOCK,
            WebhookEvent.INVENTORY_OUT_OF_STOCK,
        ],
    },
    {
        id: "contacts",
        title: "Contacts",
        description: "Customer events.",
        events: [WebhookEvent.CONTACT_CREATED, WebhookEvent.CONTACT_UPDATED],
    },
    {
        id: "wallet",
        title: "Payments & wallet",
        description: "Payments, withdrawals, and deposits.",
        events: [
            WebhookEvent.PAYMENT_RECEIVED,
            WebhookEvent.WALLET_WITHDRAWAL_REQUESTED,
            WebhookEvent.WALLET_WITHDRAWAL_COMPLETED,
            WebhookEvent.WALLET_WITHDRAWAL_FAILED,
            WebhookEvent.WALLET_DEPOSIT,
        ],
    },
    {
        id: "hotel",
        title: "Hotel",
        description: "Reservation lifecycle and guest requests.",
        events: [
            WebhookEvent.HOTEL_RESERVATION_CREATED,
            WebhookEvent.HOTEL_RESERVATION_CHECKED_IN,
            WebhookEvent.HOTEL_RESERVATION_CHECKED_OUT,
            WebhookEvent.HOTEL_RESERVATION_CANCELLED,
            WebhookEvent.HOTEL_SERVICE_REQUEST_CREATED,
        ],
    },
]
