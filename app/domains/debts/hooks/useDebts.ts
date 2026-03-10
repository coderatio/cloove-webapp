import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient, ApiResponse } from "@/app/lib/api-client"
import { useBusiness } from "@/app/components/BusinessProvider"
import { toast } from "sonner"

export interface DebtApi {
    id: string
    customerId: string
    customer: { id: string; name: string; phoneNumber: string | null }
    amount: number
    remainingAmount: number
    status: string
    dueAt: string | null
    invoiceUrl: string | null
    createdAt: string
}

export interface Debt {
    id: string
    customerId: string
    customerName: string
    customerPhone: string
    amount: number
    remainingAmount: number
    status: string
    dueAt: string
    invoiceUrl: string
    createdAt: string
}

function mapApiToDebt(item: DebtApi): Debt {
    return {
        id: item.id,
        customerId: item.customerId,
        customerName: item.customer?.name ?? "Unknown",
        customerPhone: item.customer?.phoneNumber ?? "",
        amount: item.amount,
        remainingAmount: item.remainingAmount,
        status: item.status,
        dueAt: item.dueAt ?? "",
        invoiceUrl: item.invoiceUrl ?? "",
        createdAt: item.createdAt,
    }
}

export interface DebtDetailApi extends DebtApi {
    repayments: Array<{
        id: string
        amount: number
        createdAt: string
    }>
}

export interface CreateDebtPayload {
    customerId: string
    amount: number
    dueAt?: string
    notes?: string
}

export interface RecordRepaymentPayload {
    amount: number
}

const PAGE_SIZE = 20

export function useDebts(
    page: number = 1,
    limit: number = PAGE_SIZE,
    search?: string,
    status?: string
) {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
    }
    if (search?.trim()) params.search = search.trim()
    if (status && status !== "ALL") params.status = status

    const {
        data: response,
        isPending,
        isFetching,
        error,
    } = useQuery<ApiResponse<DebtApi[]>>({
        queryKey: ["debts", businessId, page, limit, search, status],
        queryFn: () =>
            apiClient.get<ApiResponse<DebtApi[]>>("/debts", params, {
                fullResponse: true,
            }),
        enabled: !!businessId,
    })

    const debts: Debt[] = (response?.data ?? []).map(mapApiToDebt)
    const meta = response?.meta as { total?: number; currentPage?: number; lastPage?: number } | undefined
    const totalPages = meta?.lastPage ?? meta?.total ?? 1
    const currentPage = meta?.currentPage ?? page

    const createMutation = useMutation({
        mutationFn: (payload: CreateDebtPayload) => apiClient.post("/debts", payload),
        onSuccess: () => {
            toast.success("Debt recorded")
            queryClient.invalidateQueries({ queryKey: ["debts", businessId] })
            queryClient.invalidateQueries({ queryKey: ["debts-stats", businessId] })
        },
        onError: (err: { message?: string }) => {
            toast.error(err.message ?? "Failed to record debt")
        },
    })

    return {
        debts,
        meta: meta ? { ...meta, totalPages, currentPage } : undefined,
        isPending,
        isFetching,
        error,
        createDebt: createMutation.mutateAsync,
        isCreating: createMutation.isPending,
    }
}

export function useDebtStats() {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useQuery<ApiResponse<{
        totalOutstanding: number
        activeDebtors: number
        overdueCount: number
        collectionRate: number
    }>>({
        queryKey: ["debts-stats", businessId],
        queryFn: () =>
            apiClient.get("/debts/stats", undefined, { fullResponse: true }),
        enabled: !!businessId,
    })
}

export function useDebtDetail(debtId: string) {
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    return useQuery<ApiResponse<DebtDetailApi>>({
        queryKey: ["debt-detail", businessId, debtId],
        queryFn: () =>
            apiClient.get<ApiResponse<DebtDetailApi>>(`/debts/${debtId}`, undefined, { fullResponse: true }),
        enabled: !!businessId && !!debtId,
    })
}

export function useDebtActions() {
    const queryClient = useQueryClient()
    const { activeBusiness } = useBusiness()
    const businessId = activeBusiness?.id

    const repaymentMutation = useMutation({
        mutationFn: ({ debtId, data }: { debtId: string; data: RecordRepaymentPayload }) =>
            apiClient.post(`/debts/${debtId}/repayment`, data),
        onSuccess: () => {
            toast.success("Payment recorded")
            queryClient.invalidateQueries({ queryKey: ["debts", businessId] })
            queryClient.invalidateQueries({ queryKey: ["debts-stats", businessId] })
            queryClient.invalidateQueries({ queryKey: ["debt-detail", businessId] })
        },
        onError: (err: { message?: string }) => {
            toast.error(err.message ?? "Failed to record payment")
        },
    })

    const reminderMutation = useMutation({
        mutationFn: (debtId: string) =>
            apiClient.post(`/debts/${debtId}/reminder`, {}),
        onSuccess: () => {
            toast.success("Reminder sent")
        },
        onError: (err: { message?: string }) => {
            toast.error(err.message ?? "Failed to send reminder")
        },
    })

    const invoiceMutation = useMutation({
        mutationFn: ({ debtId, sendTo }: { debtId: string; sendTo?: "MYSELF" | "CUSTOMER" | "BOTH" }) =>
            apiClient.post<ApiResponse<{ url: string; debtAmount: number; customerName: string; customerHasWhatsapp: boolean; deliveryStatus: string[] }>>(
                `/debts/${debtId}/invoice`,
                sendTo ? { sendTo } : {},
                { fullResponse: true }
            ),
        onSuccess: (data, variables) => {
            const url = data?.data?.url
            if (!variables.sendTo && url) {
                window.open(url, "_blank")
            }
            queryClient.invalidateQueries({ queryKey: ["debt-detail", businessId] })
            queryClient.invalidateQueries({ queryKey: ["debts", businessId] })
        },
    })

    const generateInvoice = (args: { debtId: string; sendTo?: "MYSELF" | "CUSTOMER" | "BOTH" }) => {
        const isSending = !!args.sendTo
        return toast.promise(invoiceMutation.mutateAsync(args), {
            loading: isSending ? "Sending invoice..." : "Generating invoice...",
            success: (data) => {
                if (isSending) {
                    const statuses = data?.data?.deliveryStatus ?? []
                    return statuses.length > 0 ? statuses.join(", ") : "Invoice sent"
                }
                return "Invoice generated"
            },
            error: (err: { message?: string }) =>
                err.message ?? (isSending ? "Failed to send invoice" : "Failed to generate invoice"),
        })
    }

    return {
        recordRepayment: repaymentMutation.mutateAsync,
        sendReminder: reminderMutation.mutateAsync,
        generateInvoice,
        isRecordingRepayment: repaymentMutation.isPending,
        isSendingReminder: reminderMutation.isPending,
        isGeneratingInvoice: invoiceMutation.isPending,
    }
}
