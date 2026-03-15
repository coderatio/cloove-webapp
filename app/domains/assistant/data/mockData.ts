/**
 * Mock Data — AI Assistant Domain
 *
 * Comprehensive mock conversations and suggestion chips
 * for E2E flow testing without any API dependency.
 */

import type {
    Conversation,
    SuggestionChip,
    AssistantMessage,
    AssistantMessagePart,
} from "../types"

// ─── Suggestion Chips ────────────────────────────────────────────────────────

export const welcomeSuggestions: SuggestionChip[] = [
    {
        id: "sales-summary",
        label: "Summarize today's sales",
        prompt: "Give me a summary of today's sales across all stores.",
        icon: "📊",
    },
    {
        id: "low-stock",
        label: "Check low-stock items",
        prompt: "Which products are low in stock and need reordering?",
        icon: "📦",
    },
    {
        id: "weekly-report",
        label: "Generate weekly report",
        prompt: "Generate a performance report for this week.",
        icon: "📈",
    },
    {
        id: "debt-recovery",
        label: "Outstanding debts",
        prompt: "Show me all outstanding customer debts and suggest a recovery plan.",
        icon: "💰",
    },
]

export const followUpSuggestions: SuggestionChip[] = [
    {
        id: "reorder",
        label: "Reorder out-of-stock items",
        prompt: "Help me create a restock order for all out-of-stock items.",
        icon: "🔄",
    },
    {
        id: "compare-stores",
        label: "Compare store performance",
        prompt: "Compare performance across my stores this month.",
        icon: "🏪",
    },
    {
        id: "best-sellers",
        label: "Top-selling products",
        prompt: "What were my best-selling products this week?",
        icon: "🏆",
    },
]

// ─── Mock Tool Outputs ───────────────────────────────────────────────────────

const inventoryToolPart: AssistantMessagePart = {
    type: "tool-listInventory",
    toolCallId: "inv-mock-001",
    state: "output-available",
    input: { category: "Beverages" },
    output: [
        { id: 1, name: "Coca Cola 50cl", stock: 24, price: 300 },
        { id: 2, name: "Pepsi 50cl", stock: 12, price: 250 },
        { id: 3, name: "Fanta Orange 50cl", stock: 0, price: 250 },
        { id: 4, name: "Sprite 50cl", stock: 3, price: 250 },
        { id: 5, name: "Malt Guinness", stock: 48, price: 350 },
    ],
}

const approvalToolPart: AssistantMessagePart = {
    type: "tool-requestApproval",
    toolCallId: "appr-mock-001",
    state: "pending",
    input: {
        message:
            "I'd like to create a purchase order for 3 cases of Fanta 50cl and 2 cases of Sprite 50cl from your vendor 'ABC Distributors'. Total estimated cost: ₦18,500.",
    },
}

const salesChartToolPart: AssistantMessagePart = {
    type: "tool-salesChart",
    toolCallId: "chart-mock-001",
    state: "output-available",
    input: { period: "week" },
    output: {
        title: "Sales This Week",
        currency: "NGN",
        data: [
            { label: "Mon", value: 45200 },
            { label: "Tue", value: 38100 },
            { label: "Wed", value: 52800 },
            { label: "Thu", value: 41300 },
            { label: "Fri", value: 67500 },
            { label: "Sat", value: 89200 },
            { label: "Sun", value: 31400 },
        ],
    },
}

// ─── Mock Conversations ──────────────────────────────────────────────────────

const weeklyPerformanceMessages: AssistantMessage[] = [
    {
        id: "wp-1",
        role: "assistant",
        createdAt: new Date(Date.now() - 60000 * 5),
        parts: [
            {
                type: "text",
                text: "Good evening. I've completed your weekly performance analysis. Here are the key findings:\n\n**Revenue** is up **12%** compared to last week, driven primarily by increased weekend foot traffic. Your **beverage** category is performing well, but I've noticed some stock concerns.",
            },
        ],
    },
    {
        id: "wp-2",
        role: "user",
        createdAt: new Date(Date.now() - 60000 * 4),
        parts: [{ type: "text", text: "Which items are running low?" }],
    },
    {
        id: "wp-3",
        role: "assistant",
        createdAt: new Date(Date.now() - 60000 * 3),
        parts: [
            {
                type: "text",
                text: "Here's the current inventory status for your **Beverages** category. Two items need immediate attention:",
            },
            inventoryToolPart,
        ],
    },
    {
        id: "wp-4",
        role: "user",
        createdAt: new Date(Date.now() - 60000 * 2),
        parts: [
            {
                type: "text",
                text: "Can you create a restock order for the out-of-stock items?",
            },
        ],
    },
    {
        id: "wp-5",
        role: "assistant",
        createdAt: new Date(Date.now() - 60000),
        parts: [
            {
                type: "text",
                text: "I've prepared a purchase order for the items that are out of stock or critically low. Please review and approve:",
            },
            approvalToolPart,
        ],
    },
]

const salesAnalysisMessages: AssistantMessage[] = [
    {
        id: "sa-1",
        role: "user",
        createdAt: new Date(Date.now() - 60000 * 10),
        parts: [
            {
                type: "text",
                text: "Show me how my sales have been this week.",
            },
        ],
    },
    {
        id: "sa-2",
        role: "assistant",
        createdAt: new Date(Date.now() - 60000 * 9),
        parts: [
            {
                type: "text",
                text: "Here's your sales performance for this week. **Saturday** was your strongest day with ₦89,200 in revenue — **32%** higher than your weekly average. Overall, you've generated **₦365,500** across all stores this week.",
            },
            salesChartToolPart,
        ],
    },
    {
        id: "sa-3",
        role: "user",
        createdAt: new Date(Date.now() - 60000 * 8),
        parts: [
            {
                type: "text",
                text: "Why was Saturday so high?",
            },
        ],
    },
    {
        id: "sa-4",
        role: "assistant",
        createdAt: new Date(Date.now() - 60000 * 7),
        parts: [
            {
                type: "text",
                text: "Saturday's spike was driven by three factors:\n\n1. **Bulk order** from a new corporate customer (₦32,000)\n2. **Weekend promotion** on beverages drove 40% more beverage sales\n3. **Higher foot traffic** — you had 47 transactions vs. the weekday average of 28\n\nI'd recommend running similar weekend promotions consistently. Would you like me to draft a recurring promotion plan?",
            },
        ],
    },
]

export const defaultConversations: Conversation[] = [
    {
        id: "weekly-performance-1",
        title: "Weekly Performance",
        date: "Today",
        preview: "Revenue is up 12% compared to last week...",
        messages: weeklyPerformanceMessages,
    },
    {
        id: "sales-analysis-1",
        title: "Sales Analysis",
        date: "Today",
        preview: "Saturday was your strongest day...",
        messages: salesAnalysisMessages,
    },
    {
        id: "debt-recovery-1",
        title: "Debt Recovery Plan",
        date: "Yesterday",
        preview: "3 customers have outstanding balances...",
        messages: [
            {
                id: "dr-1",
                role: "assistant",
                createdAt: new Date(Date.now() - 60000 * 60 * 24),
                parts: [
                    {
                        type: "text",
                        text: "I've identified **3 customers** with outstanding balances totalling **₦127,400**. The oldest debt is 28 days overdue.\n\nHere's my recommended recovery approach:\n\n1. **Adebayo Foods** — ₦52,000 (28 days) → Send a formal reminder\n2. **Mama Nkechi** — ₦43,400 (14 days) → Friendly follow-up message\n3. **Chinedu & Sons** — ₦32,000 (7 days) → No action needed yet\n\nWould you like me to draft personalised reminder messages for each?",
                    },
                ],
            },
        ],
    },
]

// ─── Mock AI Responses (for simulated streaming) ─────────────────────────────

export const mockResponses: Record<string, AssistantMessage> = {
    default: {
        id: "",
        role: "assistant",
        parts: [
            {
                type: "text",
                text: "I've looked into that for you. Based on your current business data, here's what I found:\n\n**Key Insight**: Your store is performing well overall, but there are a few areas where we can optimise. Would you like me to dive deeper into any specific area — **inventory**, **sales trends**, or **customer analytics**?",
            },
        ],
    },
    sales: {
        id: "",
        role: "assistant",
        parts: [
            {
                type: "text",
                text: "Here's your sales overview for today:\n\n- **Total Revenue**: ₦78,400 across all stores\n- **Transactions**: 34 completed orders\n- **Average Order Value**: ₦2,306\n- **Top Product**: Coca Cola 50cl (18 units sold)\n\nYour afternoon peak (2-5 PM) accounted for **42%** of today's sales. Consider extending staff coverage during that window.",
            },
            salesChartToolPart,
        ],
    },
    inventory: {
        id: "",
        role: "assistant",
        parts: [
            {
                type: "text",
                text: "I've scanned your inventory across all stores. Here are the items that need attention:",
            },
            inventoryToolPart,
        ],
    },
    report: {
        id: "",
        role: "assistant",
        parts: [
            {
                type: "text",
                text: "I've compiled your weekly performance report:\n\n### Revenue Summary\n- **This Week**: ₦365,500 (+12% vs. last week)\n- **Best Day**: Saturday — ₦89,200\n- **Weakest Day**: Sunday — ₦31,400\n\n### Inventory Health\n- **2 items** out of stock\n- **3 items** critically low (< 5 units)\n- **Restock cost estimate**: ₦24,500\n\n### Customer Insights\n- **12 new customers** this week\n- **3 outstanding debts** totalling ₦127,400\n\nWould you like me to take action on any of these findings?",
            },
        ],
    },
}

/** Keyword-based response matching for mock mode */
export function getMockResponse(userMessage: string): AssistantMessage {
    const lower = userMessage.toLowerCase()
    if (lower.includes("sale") || lower.includes("revenue") || lower.includes("today")) {
        return { ...mockResponses.sales, id: `mock-${Date.now()}`, createdAt: new Date() }
    }
    if (lower.includes("stock") || lower.includes("inventory") || lower.includes("reorder")) {
        return { ...mockResponses.inventory, id: `mock-${Date.now()}`, createdAt: new Date() }
    }
    if (lower.includes("report") || lower.includes("weekly") || lower.includes("performance")) {
        return { ...mockResponses.report, id: `mock-${Date.now()}`, createdAt: new Date() }
    }
    return { ...mockResponses.default, id: `mock-${Date.now()}`, createdAt: new Date() }
}
