import { Clock, Package, AlertCircle } from "lucide-react"
import React from "react"

// Mock Data structure per store
export const storeData: Record<string, any> = {
    '1': { // Main Store
        sales: { value: "₦850,000", trend: "+15% vs last week", trendDirection: "up", label: "Total Sales (Main Store)" },
        actions: [
            { label: "Pending Orders", count: 2, type: "urgent", href: "/orders", icon: React.createElement(Clock, { className: "w-4 h-4" }) },
            { label: "Low Stock", count: 1, type: "warning", href: "/inventory", icon: React.createElement(Package, { className: "w-4 h-4" }) },
        ],
        activities: [
            { id: "s1-1", type: "sale", description: "Rice Bag (50kg)", amount: "₦12,000", timeAgo: "2m ago", customer: "Walk-in", href: "/orders" },
            { id: "s1-2", type: "payment", description: "Debt Payment", amount: "₦5,000", timeAgo: "1h ago", customer: "Johnson", href: "/finance" },
        ],
        insight: "You sold more **rice** this week significantly in Main Store."
    },
    '2': { // Ikeja Branch
        sales: { value: "₦320,000", trend: "+8% vs last week", trendDirection: "up", label: "Total Sales (Ikeja)" },
        actions: [
            { label: "Pending Orders", count: 1, type: "urgent", href: "/orders", icon: React.createElement(Clock, { className: "w-4 h-4" }) },
            { label: "Low Stock", count: 4, type: "warning", href: "/inventory", icon: React.createElement(Package, { className: "w-4 h-4" }) },
        ],
        activities: [
            { id: "s2-1", type: "sale", description: "Vegetable Oil", amount: "₦8,500", timeAgo: "15m ago", customer: "Bode", href: "/orders" },
        ],
        insight: "Ikeja branch is seeing a **40% increase** in foot traffic today."
    },
    '3': { // Abuja Store
        sales: { value: "₦180,000", trend: "-5% vs last week", trendDirection: "down", label: "Total Sales (Abuja)" },
        actions: [
            { label: "Overdue Debts", count: 3, type: "urgent", href: "/customers", icon: React.createElement(AlertCircle, { className: "w-4 h-4" }) },
        ],
        activities: [
            { id: "s3-1", type: "debt", description: "New Debt Recorded", amount: "₦2,500", timeAgo: "3h ago", customer: "Mama Nkechi", href: "/finance" },
        ],
        insight: "Abuja store has **3 unpaid debts** that are over a week old."
    }
}

// Global business-level data
export const businessData = {
    wallet: {
        balance: "₦1,250,000.00",
        isVerified: false,
        label: "Wallet Balance"
    },
    insight: "Your overall business performance is **up by 12%**. Consider restocking in Ikeja soon."
}

export const velocityData = [
    { date: 'Mon', value: 120000 },
    { date: 'Tue', value: 154000 },
    { date: 'Wed', value: 110000 },
    { date: 'Thu', value: 180000 },
    { date: 'Fri', value: 240000 },
    { date: 'Sat', value: 310000 },
    { date: 'Sun', value: 215000 },
]
