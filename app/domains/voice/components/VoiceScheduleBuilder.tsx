"use client"

import { OperatingHoursBuilder } from "@/app/components/shared/OperatingHoursBuilder"

interface VoiceScheduleBuilderProps {
    value: string
    onChange: (value: string) => void
}

export function VoiceScheduleBuilder({ value, onChange }: VoiceScheduleBuilderProps) {
    return (
        <OperatingHoursBuilder
            value={value}
            onChange={onChange}
            description="Used for after-hours routing and caller expectation setting."
        />
    )
}
