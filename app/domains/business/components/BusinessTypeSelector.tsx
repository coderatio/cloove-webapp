"use client"

import { User, Building2, Check } from "lucide-react"
import { cn } from "@/app/lib/utils"

export type BusinessType = 'INDIVIDUAL' | 'REGISTERED'

interface BusinessTypeSelectorProps {
    value: BusinessType | null
    onChange: (type: BusinessType) => void
}

const options = [
    {
        type: 'INDIVIDUAL' as BusinessType,
        label: 'Individual / Unregistered',
        description: 'A sole trader, freelancer, or informal business.',
        requirements: 'Verification requires a BVN at minimum.',
        Icon: User,
    },
    {
        type: 'REGISTERED' as BusinessType,
        label: 'Registered Business',
        description: 'A formally registered company (LLC, Ltd, etc.).',
        requirements: 'Requires BVN and registration documents (CAC, MERMAT, Status Report).',
        Icon: Building2,
    },
]

export function BusinessTypeSelector({ value, onChange }: BusinessTypeSelectorProps) {
    return (
        <div className="grid w-full grid-cols-1 gap-3">
            {options.map(({ type, label, description, requirements, Icon }) => {
                const isSelected = value === type
                return (
                    <button
                        key={type}
                        type="button"
                        onClick={() => onChange(type)}
                        className={cn(
                            "group flex cursor-pointer items-start gap-4 rounded-2xl border p-4 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/25 sm:p-5",
                            isSelected
                                ? "border-primary/35 bg-primary/8 ring-1 ring-primary/15"
                                : "border-border bg-card hover:border-primary/20 hover:bg-muted/45"
                        )}
                    >
                        <div className={cn(
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border",
                            isSelected
                                ? "border-primary/20 bg-primary text-white"
                                : "border-border bg-muted text-muted-foreground group-hover:text-primary"
                        )}>
                            <Icon className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className={cn(
                                    "text-base font-semibold leading-tight",
                                    isSelected ? "text-foreground" : "text-foreground/85"
                                )}>
                                    {label}
                                </h3>
                                {isSelected && (
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                                    </span>
                                )}
                            </div>

                            <p className="max-w-full text-sm leading-relaxed text-muted-foreground">
                                {description}
                                <br />
                                {requirements}
                            </p>
                        </div>
                    </button>
                )
            })}
        </div>
    )
}
