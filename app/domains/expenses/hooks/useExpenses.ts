import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient, ApiResponse } from "@/app/lib/api-client"
import { useBusiness } from "@/app/components/BusinessProvider"
import { toast } from "sonner"

export interface ExpenseApi {
    id: string
    amount: number
    category: string
    description: string | null
    date: string
    createdAt: string
}

export interface Expense {
    id: string
    amount: number
    category: string
    description: string
    date: string
}

function mapApiToExpense(item: ExpenseApi): Expense {
    return {
        id: item.id,
        amount: item.amount,
        category: item.category,
        description: item.description ?? "",
        date: item.date,
    }
}

export interface CreateExpensePayload {
    amount: number
    category: string
    description?: string
    date?: string
}

export interface UpdateExpensePayload {
    amount?: number
    category?: string
    description?: string
    date?: string
}

const PAGE_SIZE = 20

export function useExpenses(
    page: number = 1,
    limit: number = PAGE_SIZE,
    search?: string,
    category?: string
) {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
    }
    if (search?.trim()) params.search = search.trim()
    if (category) params.category = category

    const {
        data: response,
        isPending,
        isFetching,
        error,
    } = useQuery<ApiResponse<ExpenseApi[]>>({
        queryKey: ["expenses", businessId, page, limit, search, category],
        queryFn: () =>
            apiClient.get<ApiResponse<ExpenseApi[]>>("/expenses", params, {
                fullResponse: true,
            }),
        enabled: !!businessId,
    })

    const expenses: Expense[] = (response?.data ?? []).map(mapApiToExpense)
    const meta = response?.meta as { total?: number; currentPage?: number; lastPage?: number } | undefined
    const totalPages = meta?.lastPage ?? meta?.total ?? 1
    const currentPage = meta?.currentPage ?? page

    const createMutation = useMutation({
        mutationFn: (payload: CreateExpensePayload) => apiClient.post("/expenses", payload),
        onSuccess: () => {
            toast.success("Expense recorded")
            queryClient.invalidateQueries({ queryKey: ["expenses", businessId] })
            queryClient.invalidateQueries({ queryKey: ["expenses-stats", businessId] })
        },
        onError: (err: { message?: string }) => {
            toast.error(err.message ?? "Failed to record expense")
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateExpensePayload }) =>
            apiClient.patch(`/expenses/${id}`, data),
        onSuccess: () => {
            toast.success("Expense updated")
            queryClient.invalidateQueries({ queryKey: ["expenses", businessId] })
            queryClient.invalidateQueries({ queryKey: ["expenses-stats", businessId] })
        },
        onError: (err: { message?: string }) => {
            toast.error(err.message ?? "Failed to update expense")
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiClient.delete(`/expenses/${id}`),
        onSuccess: () => {
            toast.success("Expense deleted")
            queryClient.invalidateQueries({ queryKey: ["expenses", businessId] })
            queryClient.invalidateQueries({ queryKey: ["expenses-stats", businessId] })
        },
        onError: (err: { message?: string }) => {
            toast.error(err.message ?? "Failed to delete expense")
        },
    })

    return {
        expenses,
        meta: meta ? { ...meta, totalPages, currentPage } : undefined,
        isPending,
        isFetching,
        error,
        createExpense: createMutation.mutateAsync,
        updateExpense: updateMutation.mutateAsync,
        deleteExpense: deleteMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    }
}

export function useExpenseStats() {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useQuery<ApiResponse<{
        totalThisMonth: number
        todaySpending: number
        avgDaily: number
        topCategory: string | null
    }>>({
        queryKey: ["expenses-stats", businessId],
        queryFn: () =>
            apiClient.get("/expenses/stats", undefined, { fullResponse: true }),
        enabled: !!businessId,
    })
}
