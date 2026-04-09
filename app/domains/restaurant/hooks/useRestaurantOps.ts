"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/app/lib/api-client"
import { useBusiness } from "@/app/components/BusinessProvider"

export interface KitchenTicket {
  id: string
  saleId: string | null
  station: string
  status: "queued" | "preparing" | "ready" | "served"
  createdAt: string
}

export interface BarTicket {
  id: string
  saleId: string | null
  station: string
  status: "ordered" | "making" | "ready" | "served"
  createdAt: string
}

export interface TableSession {
  id: string
  storeId: string | null
  saleId: string | null
  tableLabel: string
  status: "open" | "closed" | "merged" | "transferred"
  covers: number
  openedAt: string
  closedAt: string | null
}

export interface RestaurantTable {
  id: string
  storeId: string | null
  label: string
  capacity: number
  isActive: boolean
  deletedAt?: string | null
}

export function useKitchenTickets(options?: { refetchInterval?: number | false }) {
  const { activeBusiness } = useBusiness()
  const businessId = activeBusiness?.id
  return useQuery({
    queryKey: ["restaurant", "kitchenTickets", businessId],
    queryFn: () => apiClient.get<KitchenTicket[]>("/restaurant/kitchen-tickets"),
    enabled: !!businessId,
    refetchInterval: options?.refetchInterval ?? 5000,
  })
}

export function useTableSessions(options?: {
  status?: "open" | "closed" | "merged" | "transferred" | "all"
  limit?: number
  enabled?: boolean
  refetchInterval?: number | false
}) {
  const { activeBusiness } = useBusiness()
  const businessId = activeBusiness?.id
  const status = options?.status ?? "all"
  const limit = options?.limit
  return useQuery({
    queryKey: ["restaurant", "tableSessions", businessId, status, limit],
    queryFn: () =>
      apiClient.get<TableSession[]>("/restaurant/table-sessions", {
        status,
        ...(limit ? { limit: String(limit) } : {}),
      }),
    enabled: (options?.enabled ?? true) && !!businessId,
    refetchInterval: options?.refetchInterval ?? (status === "open" ? 5000 : false),
  })
}

export function useRestaurantTables(status: "active" | "archived" | "all" = "active") {
  const { activeBusiness } = useBusiness()
  const businessId = activeBusiness?.id
  return useQuery({
    queryKey: ["restaurant", "tables", businessId, status],
    queryFn: () => apiClient.get<RestaurantTable[]>("/restaurant/tables", { status }),
    enabled: !!businessId,
    staleTime: 30000,
  })
}

export function useRestaurantTableActions() {
  const queryClient = useQueryClient()
  const { activeBusiness } = useBusiness()
  const businessId = activeBusiness?.id

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["restaurant", "tables", businessId] })
  }

  const createTable = useMutation({
    mutationFn: (payload: { label: string; capacity: number; storeId?: string }) =>
      apiClient.post("/restaurant/tables", payload),
    onSuccess: invalidate,
  })

  const updateTable = useMutation({
    mutationFn: ({
      id,
      ...payload
    }: {
      id: string
      label?: string
      capacity?: number
      storeId?: string
      isActive?: boolean
    }) => apiClient.patch(`/restaurant/tables/${id}`, payload),
    onSuccess: invalidate,
  })

  const deleteTable = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/restaurant/tables/${id}`),
    onSuccess: invalidate,
  })

  const restoreTable = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/restaurant/tables/${id}/restore`, {}),
    onSuccess: invalidate,
  })

  const permanentDeleteTable = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/restaurant/tables/${id}/permanent`),
    onSuccess: invalidate,
  })

  return { createTable, updateTable, deleteTable, restoreTable, permanentDeleteTable }
}

export function useBarTickets(options?: { refetchInterval?: number | false }) {
  const { activeBusiness } = useBusiness()
  const businessId = activeBusiness?.id
  return useQuery({
    queryKey: ["restaurant", "barTickets", businessId],
    queryFn: () => apiClient.get<BarTicket[]>("/restaurant/bar-tickets"),
    enabled: !!businessId,
    refetchInterval: options?.refetchInterval ?? 5000,
  })
}

export function useBarTicketActions() {
  const queryClient = useQueryClient()
  const { activeBusiness } = useBusiness()
  const businessId = activeBusiness?.id
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["restaurant", "barTickets", businessId] })

  const advance = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BarTicket["status"] }) =>
      apiClient.patch(`/restaurant/bar-tickets/${id}`, { status }),
    onSuccess: invalidate,
  })

  const updateLabel = useMutation({
    mutationFn: ({ id, label }: { id: string; label: string }) =>
      apiClient.patch(`/restaurant/bar-tickets/${id}`, { label }),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/restaurant/bar-tickets/${id}`),
    onSuccess: invalidate,
  })

  return { advance, updateLabel, remove }
}

export function useCreateBarTicket() {
  const queryClient = useQueryClient()
  const { activeBusiness } = useBusiness()
  const businessId = activeBusiness?.id
  return useMutation({
    mutationFn: (payload: { saleId?: string; label?: string }) =>
      apiClient.post<BarTicket>("/restaurant/bar-tickets", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant", "barTickets", businessId] })
    },
  })
}

export function useKitchenTicketActions() {
  const queryClient = useQueryClient()
  const { activeBusiness } = useBusiness()
  const businessId = activeBusiness?.id
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: KitchenTicket["status"] }) =>
      apiClient.patch(`/restaurant/kitchen-tickets/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant", "kitchenTickets", businessId] })
    },
  })
}

export function useTableSessionActions() {
  const queryClient = useQueryClient()
  const { activeBusiness } = useBusiness()
  const businessId = activeBusiness?.id
  return useMutation({
    mutationFn: (id: string) => apiClient.post(`/restaurant/table-sessions/${id}/close`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant", "tableSessions", businessId] })
    },
  })
}
