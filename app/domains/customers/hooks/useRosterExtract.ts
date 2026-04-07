"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/app/lib/api-client"
import { useBusiness } from "@/app/components/BusinessProvider"
import { toast } from "sonner"

export interface ExtractedPerson {
    id: string
    name: string
    phone: string
    whatsapp: string
    email: string
    class: string
    role: string
    notes: string
    confidence: number
    status: "ok" | "error"
    errors: string[]
}

interface RawExtractedPerson {
    name: string
    phone: string | null
    whatsapp: string | null
    email: string | null
    class: string | null
    role: string | null
    notes: string | null
    confidence: number
}

function mapRaw(raw: RawExtractedPerson, index: number): ExtractedPerson {
    const errors: string[] = []
    if (!raw.name?.trim()) errors.push("Name is required")
    return {
        id: `person-${Date.now()}-${index}`,
        name: raw.name ?? "",
        phone: raw.phone ?? "",
        whatsapp: raw.whatsapp ?? "",
        email: raw.email ?? "",
        class: raw.class ?? "",
        role: raw.role ?? "",
        notes: raw.notes ?? "",
        confidence: raw.confidence ?? 0.8,
        status: errors.length > 0 ? "error" : "ok",
        errors,
    }
}

export function useRosterExtract() {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    const extractMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData()
            formData.append("file", file)
            return apiClient.request<RawExtractedPerson[]>("/customers/roster-extract", {
                method: "POST",
                body: formData,
                headers: { "Content-Type": undefined as unknown as string },
            })
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to extract roster data")
        },
    })

    return {
        extractRoster: extractMutation.mutateAsync,
        mapRaw,
        isExtracting: extractMutation.isPending,
        businessId,
    }
}
