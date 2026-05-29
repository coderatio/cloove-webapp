import type { DeveloperApiKeyScope } from "@/app/domains/developer/hooks/useDeveloperApiKeys"

export type ExpiryPreset = "60-days" | "never" | "custom"

export const SCOPE_LABELS: Record<DeveloperApiKeyScope, string> = {
    "vox:read": "Vox read",
    "vox:calls:read": "Read calls",
    "vox:calls:create": "Make calls",
    "vox:agents:read": "Read agents",
    "vox:numbers:read": "Read numbers",
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
