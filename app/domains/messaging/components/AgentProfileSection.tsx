"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ChevronDownIcon as ChevronDown, SparklesIcon as Sparkles } from "@hugeicons/core-free-icons"
import { Switch } from "@/app/components/ui/switch"
import { cn } from "@/app/lib/utils"
import type {
    AgentCapabilitiesSummary,
    AgentProfile,
} from "../hooks/useWhatsAppSettings"

interface AgentProfileSectionProps {
    profile: AgentProfile
    preset?: string
    overrides: Partial<AgentCapabilitiesSummary> | null | undefined
    onProfileChange: (profile: AgentProfile) => void
    onOverridesChange: (overrides: Partial<AgentCapabilitiesSummary> | null) => void
}

const CAPABILITY_LABELS: Array<{
    key: keyof AgentCapabilitiesSummary
    label: string
    description: string
}> = [
        { key: "products", label: "Products", description: "Browse, search, and preview catalog items." },
        { key: "cart", label: "Cart", description: "Add to cart, checkout, and clear cart." },
        { key: "orders", label: "Orders", description: "Order history and tracking." },
        { key: "debts", label: "Debts", description: "Outstanding balances and reminders." },
        { key: "promotions", label: "Promotions", description: "Active deals and discounts." },
        { key: "storefrontLink", label: "Storefront link", description: "Share the online store URL." },
        { key: "services", label: "Services", description: "Service catalog and consultation booking." },
        { key: "inquiries", label: "Inquiries", description: "Capture leads from chat." },
]

const HOTEL_CAPABILITY_LABELS: typeof CAPABILITY_LABELS = [
    { key: "rooms", label: "Room bookings", description: "Browse rooms, check availability, and manage reservations." },
    { key: "foodOrdering", label: "Restaurant ordering", description: "Browse food products and place restaurant orders." },
    { key: "hotelServices", label: "Hotel services", description: "Laundry, spa, pickup, housekeeping, and guest requests." },
    { key: "roomService", label: "Room service", description: "Allow checked-in guests to link food orders to their room." },
    { key: "publicFoodOrdering", label: "Public food ordering", description: "Allow takeaway, pickup, or delivery without a hotel stay." },
    { key: "roomCharge", label: "Charge to room", description: "Allow validated checked-in guests to charge room-service orders." },
]

export function AgentProfileSection({
    profile,
    preset,
    overrides,
    onProfileChange,
    onOverridesChange,
}: AgentProfileSectionProps) {
    const [advancedOpen, setAdvancedOpen] = useState(false)

    const isService = profile === "service"
    const isHotel = preset === "hotel"
    const capabilityLabels = isHotel ? HOTEL_CAPABILITY_LABELS : CAPABILITY_LABELS

    return (
        <section className="space-y-4">
            <div className="flex items-start gap-3">
                <HugeiconsIcon icon={Sparkles} className="w-5 h-5 text-brand-gold mt-1 shrink-0" />
                <div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                        {isHotel ? "Hotel assistant modules" : "Assistant profile"}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {isHotel
                            ? "The hotel preset combines room bookings, restaurant ordering, and guest services."
                            : "Choose what the assistant is allowed to talk about and which tools it can call."}
                    </p>
                </div>
            </div>

            {!isHotel && <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ProfileCard
                    active={!isService}
                    title="Commerce"
                    description="Sells products. Browse, cart, orders, debts, promotions."
                    onClick={() => onProfileChange("commerce")}
                />
                <ProfileCard
                    active={isService}
                    title="Service"
                    description="Consultancy, agency, clinic. Discuss services and capture inquiries — no products or carts."
                    onClick={() => onProfileChange("service")}
                />
            </div>}

            <button
                type="button"
                onClick={() => setAdvancedOpen((v) => !v)}
                className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-deep dark:hover:text-brand-cream transition-colors"
            >
                <HugeiconsIcon icon={ChevronDown}
                    className={cn(
                        "w-4 h-4 transition-transform",
                        advancedOpen && "rotate-180"
                    )}
                />
                {isHotel ? "Hotel module controls" : "Advanced capability overrides"}
            </button>

            {advancedOpen && (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-2 divide-y divide-slate-100 dark:divide-slate-800/60">
                    {capabilityLabels.map(({ key, label, description }) => {
                        const override = overrides?.[key]
                        return (
                            <div
                                key={key}
                                className="flex items-center justify-between gap-4 px-4 py-3"
                            >
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                        {label}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {description}
                                    </p>
                                </div>
                                <Switch
                                    checked={override ?? defaultsFor(profile, key, isHotel)}
                                    onCheckedChange={(value) => {
                                        const next: Partial<AgentCapabilitiesSummary> = {
                                            ...(overrides ?? {}),
                                            [key]: value,
                                        }
                                        onOverridesChange(next)
                                    }}
                                />
                            </div>
                        )
                    })}
                </div>
            )}
        </section>
    )
}

function defaultsFor(
    profile: AgentProfile,
    key: keyof AgentCapabilitiesSummary,
    isHotel = false
): boolean {
    if (isHotel) {
        return [
            "rooms",
            "foodOrdering",
            "hotelServices",
            "roomService",
            "publicFoodOrdering",
            "roomCharge",
        ].includes(key)
    }
    if (profile === "service") {
        return key === "services" || key === "inquiries" || key === "storefrontLink"
    }
    return key !== "services" && key !== "inquiries" && key !== "booking"
}

interface ProfileCardProps {
    active: boolean
    title: string
    description: string
    onClick: () => void
}

function ProfileCard({ active, title, description, onClick }: ProfileCardProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "p-4 rounded-2xl text-left border transition-all",
                active
                    ? "bg-brand-deep text-brand-gold-300 border-brand-deep shadow-lg dark:bg-emerald-500/20 dark:text-emerald-100 dark:border-emerald-400/30"
                    : "bg-white/60 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-brand-deep/30 dark:hover:border-slate-700"
            )}
        >
            <div className="text-sm font-bold tracking-wide">{title}</div>
            <div className={cn("text-xs mt-1", active ? "text-emerald-100/85" : "text-slate-500 dark:text-slate-300")}>
                {description}
            </div>
        </button>
    )
}
