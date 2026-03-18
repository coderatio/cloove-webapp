/**
 * Assistant Domain Types
 *
 * Central type definitions for the AI Assistant feature.
 * All components in this domain import types from here.
 */

/** A single suggestion chip shown on the welcome screen or as follow-ups */
export interface SuggestionChip {
    id: string
    label: string
    prompt: string
    icon?: string
}

/** Metadata for a conversation thread */
export interface Conversation {
    id: string
    title: string
    date: string
    preview?: string
    isPinned?: boolean
    isArchived?: boolean
    agentType?: string | null
    lastMessageAt?: Date
    messages: AssistantMessage[]
}

/** A single chat message — mirrors AI SDK shape but works independently in mock mode */
export interface AssistantMessage {
    id: string
    role: "user" | "assistant"
    createdAt?: Date
    parts: AssistantMessagePart[]
    feedback?: { rating: "like" | "dislike"; reason?: string | null } | null
}

/** Discriminated union for message part types */
export type AssistantMessagePart =
    | TextPart
    | FilePart
    | ToolInventoryPart
    | ToolApprovalPart
    | ToolSalesChartPart
    | ToolGenericPart

export interface TextPart {
    type: "text"
    text: string
}

export interface FileAttachment {
    id: string
    name: string
    size: number
    fileType: string
    url: string
}

export interface FilePart {
    type: "file"
    file: FileAttachment
}

export interface InventoryItem {
    id: number
    name: string
    stock: number
    price: number
}

export interface ToolInventoryPart {
    type: "tool-listInventory"
    toolCallId: string
    state: "output-available" | "loading" | "output-error"
    input: Record<string, unknown>
    output: InventoryItem[]
}

export interface ToolApprovalPart {
    type: "tool-requestApproval"
    toolCallId: string
    state: "output-available" | "pending" | "output-error"
    input: { message: string }
    output?: { approved: boolean }
}

export interface SalesDataPoint {
    label: string
    value: number
}

export interface ToolSalesChartPart {
    type: "tool-salesChart"
    toolCallId: string
    state: "output-available"
    input: Record<string, unknown>
    output: {
        title: string
        data: SalesDataPoint[]
        currency: string
    }
}

export interface LineItem {
    description: string
    quantity: number
    unitPrice: number
}

export interface ToolGenericPart {
    type: `tool-${string}`
    toolCallId: string
    state: "output-available" | "loading" | "pending" | "output-error"
    input: Record<string, unknown>
    output?: unknown
}

/** Callback type for adding tool results (approval flow) */
export type AddToolResultFn = (args: {
    toolCallId: string
    tool: string
    output: unknown
}) => void
