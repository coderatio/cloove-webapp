"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/app/lib/api-client"
import { useBusiness } from "@/app/components/BusinessProvider"

export type AcademicTermDto = {
    id: string
    academicSessionId: string
    name: string
    startsAt: string
    endsAt: string
    sortOrder: number
}

export type AcademicSessionDto = {
    id: string
    name: string
    startsAt: string
    endsAt: string
    sortOrder: number
    terms: AcademicTermDto[]
}

export type AcademicCalendarData = {
    sessions: AcademicSessionDto[]
    activeTermId: string | null
}

function useInvalidateAcademicCalendar() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id
    return () => {
        void queryClient.invalidateQueries({ queryKey: ["academic-calendar", businessId] })
    }
}

export function useAcademicCalendar() {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id
    const invalidate = useInvalidateAcademicCalendar()

    const query = useQuery({
        queryKey: ["academic-calendar", businessId],
        queryFn: () => apiClient.get<AcademicCalendarData>("/academic-calendar"),
        enabled: !!businessId,
        staleTime: 60_000,
    })

    const setActiveTerm = useMutation({
        mutationFn: (termId: string | null) =>
            apiClient.post("/academic-calendar/active-term", { termId }, { fullResponse: true }),
        onSuccess: () => invalidate(),
    })

    const createSession = useMutation({
        mutationFn: (body: { name: string; startsAt: string; endsAt: string; sortOrder?: number }) =>
            apiClient.post("/academic-sessions", body, { fullResponse: true }),
        onSuccess: () => invalidate(),
    })

    const deleteSession = useMutation({
        mutationFn: (id: string) => apiClient.delete(`/academic-sessions/${id}`, { fullResponse: true }),
        onSuccess: () => invalidate(),
    })

    const createTerm = useMutation({
        mutationFn: ({
            sessionId,
            ...body
        }: {
            sessionId: string
            name: string
            startsAt: string
            endsAt: string
            sortOrder?: number
        }) => apiClient.post(`/academic-sessions/${sessionId}/terms`, body, { fullResponse: true }),
        onSuccess: () => invalidate(),
    })

    const deleteTerm = useMutation({
        mutationFn: (id: string) => apiClient.delete(`/academic-terms/${id}`, { fullResponse: true }),
        onSuccess: () => invalidate(),
    })

    return {
        ...query,
        setActiveTerm,
        createSession,
        deleteSession,
        createTerm,
        deleteTerm,
    }
}
