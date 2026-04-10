"use client"

import * as React from "react"
import DataTable, { type Column } from "@/app/components/DataTable"
import { useIsMobile } from "@/app/hooks/useMediaQuery"
import { PageTransition } from "@/app/components/layout/page-transition"
import { ListCard } from "@/app/components/ui/list-card"
import { GlassCard } from "@/app/components/ui/glass-card"
import { AlertCircle, Users, Trash2, Loader2, ChevronLeft, ChevronRight, UserPenIcon } from "lucide-react"
import { cn } from "@/app/lib/utils"
import { apiClient } from "@/app/lib/api-client"
import { ManagementHeader } from "@/app/components/shared/ManagementHeader"
import { InsightWhisper } from "@/app/components/dashboard/InsightWhisper"
import { useBusiness } from "@/app/components/BusinessProvider"
import { useLayoutPresetId, usePresetPageCopy } from "@/app/domains/workspace/hooks/usePresetPageCopy"
import { useStores } from "@/app/domains/stores/providers/StoreProvider"
import { formatCurrency } from "@/app/lib/formatters"
import { CurrencyText } from "@/app/components/shared/CurrencyText"
import { Button } from "@/app/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/app/components/ui/select"
import { FilterPopover } from "@/app/components/shared/FilterPopover"
import { TableSearch } from "@/app/components/shared/TableSearch"
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerClose,
} from "@/app/components/ui/drawer"
import { Switch } from "@/app/components/ui/switch"
import { ConfirmDialog } from "@/app/components/shared/ConfirmDialog"
import { Skeleton } from "@/app/components/ui/skeleton"
import { useCustomers, useCustomerStats, type Customer } from "../hooks/useCustomers"
import { useDepartments, type DepartmentMember } from "@/app/domains/staff/hooks/useDepartments"
import { useFeeTemplates } from "@/app/domains/school/hooks/useFeeTemplates"
import { useRecordSale } from "@/app/domains/orders/hooks/useRecordSale"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from "@/app/components/ui/dropdown-menu"
import {
    MoreHorizontal,
    Phone,
    MessageSquare,
    Receipt,
    User,
    Ban,
    CheckCircle2,
    TrendingUp,
    Crown,
    Star
} from "lucide-react"
import { CustomerProfileDrawer } from "./CustomerProfileDrawer"
import { RecordPaymentDrawer } from "@/app/domains/orders/components/RecordPaymentDrawer"
import { toast } from "sonner"

const PAGE_SIZE = 20

export function CustomersView() {
    const isMobile = useIsMobile()
    const { activeBusiness } = useBusiness()
    const pageCopy = usePresetPageCopy()
    const layoutPresetId = useLayoutPresetId()
    const isSchoolPreset = layoutPresetId === "school"
    const cui = pageCopy.customersUi
    const showDepartmentField = cui.drawer.showDepartmentField
    const { currentStore, stores } = useStores()
    const currencyCode = activeBusiness?.currency ?? "NGN"
    const [search, setSearch] = React.useState("")
    const deferredSearch = React.useDeferredValue(search)
    const [currentPage, setCurrentPage] = React.useState(1)
    const [selectedFilters, setSelectedFilters] = React.useState<string[]>([])
    const [isAddOpen, setIsAddOpen] = React.useState(false)
    const [editingItem, setEditingItem] = React.useState<Customer | null>(null)
    const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false)
    const [itemToDelete, setItemToDelete] = React.useState<Customer | null>(null)
    const [viewingCustomerId, setViewingCustomerId] = React.useState<string | null>(null)
    const [recordingPaymentFor, setRecordingPaymentFor] = React.useState<Customer | null>(null)
    const [selectedDepartmentId, setSelectedDepartmentId] = React.useState<string | null>(null)
    const [selectedFeeTemplateId, setSelectedFeeTemplateId] = React.useState<string | null>(null)
    const [isDepartmentLookupLoading, setIsDepartmentLookupLoading] = React.useState(false)

    const storeIds = React.useMemo(() => stores.map((s) => s.id), [stores])
    const selectedStoreIds = React.useMemo(
        () => selectedFilters.filter((id) => storeIds.includes(id)),
        [selectedFilters, storeIds]
    )
    const selectedStatusFilters = React.useMemo(
        () => selectedFilters.filter((x) => x === "owing" || x === "clean"),
        [selectedFilters]
    )

    React.useEffect(() => {
        setCurrentPage(1)
    }, [selectedStoreIds.join(",")])

    const {
        customers,
        meta,
        isPending,
        error,
        createCustomer,
        updateCustomer,
        deleteCustomer,
        isCreating,
        isUpdating,
        isDeleting,
    } = useCustomers(
        currentPage,
        PAGE_SIZE,
        deferredSearch,
        selectedStoreIds.length > 0 ? selectedStoreIds : undefined,
        cui.toasts
    )
    const { departments, addMembers, removeMembers } = useDepartments()
    const { templates } = useFeeTemplates()
    const { recordSale } = useRecordSale()

    const { data: statsData, isLoading: isStatsLoading } = useCustomerStats()
    const stats = statsData?.data

    const filterGroups = [
        {
            title: cui.filters.storeLocation,
            options: stores.map((s) => ({ label: s.name, value: s.id })),
        },
        {
            title: cui.filters.accountStatus,
            options: [
                { label: cui.filters.hasDebt, value: "owing" },
                { label: cui.filters.upToDate, value: "clean" },
            ],
        },
    ]

    const [formData, setFormData] = React.useState({
        name: "",
        phoneNumber: "",
        email: "",
        isBlacklisted: false,
    })

    const filteredCustomers = React.useMemo(() => {
        return customers.filter((c) => {
            const isOwing = c.owing !== "—"
            const matchesStatus =
                selectedStatusFilters.length === 0 ||
                (selectedStatusFilters.includes("owing") && isOwing) ||
                (selectedStatusFilters.includes("clean") && !isOwing)
            return matchesStatus
        })
    }, [customers, selectedStatusFilters])

    const owingCustomersOnPage = customers.filter((c) => c.owing !== "—").length
    const totalDebtOnPage = customers.reduce((acc, curr) => {
        if (curr.owing === "—") return acc
        const val = parseInt(curr.owing.replace(/[^0-9]/g, ""), 10) || 0
        return acc + val
    }, 0)

    const viewingCustomer = React.useMemo(() =>
        customers.find(c => c.id === viewingCustomerId) || null,
        [customers, viewingCustomerId]
    )

    const resetForm = () => {
        setFormData({ name: "", phoneNumber: "", email: "", isBlacklisted: false })
        setSelectedDepartmentId(null)
        setSelectedFeeTemplateId(null)
    }

    React.useEffect(() => {
        let cancelled = false

        const resolveCustomerDepartment = async () => {
            if (!showDepartmentField) {
                setSelectedDepartmentId(null)
                setIsDepartmentLookupLoading(false)
                return
            }
            if (!editingItem) {
                setIsDepartmentLookupLoading(false)
                return
            }
            if (departments.length === 0) {
                setSelectedDepartmentId(null)
                return
            }

            setIsDepartmentLookupLoading(true)
            try {
                const memberships = await Promise.all(
                    departments.map(async (department) => {
                        const members = await apiClient.get<DepartmentMember[]>(`/departments/${department.id}/members`)
                        const isMember = members.some(
                            (member) =>
                                member.memberableType === "Customer" &&
                                member.memberableId === editingItem.id
                        )
                        return { departmentId: department.id, isMember }
                    })
                )

                if (cancelled) return
                const current = memberships.find((membership) => membership.isMember)
                setSelectedDepartmentId(current?.departmentId ?? null)
            } catch {
                if (!cancelled) setSelectedDepartmentId(null)
            } finally {
                if (!cancelled) setIsDepartmentLookupLoading(false)
            }
        }

        void resolveCustomerDepartment()
        return () => {
            cancelled = true
        }
    }, [editingItem, departments, showDepartmentField])

    const syncCustomerDepartment = async (customerId: string) => {
        if (!showDepartmentField) return
        if (departments.length === 0) return

        const memberships = await Promise.all(
            departments.map(async (department) => {
                const members = await apiClient.get<DepartmentMember[]>(`/departments/${department.id}/members`)
                const isMember = members.some(
                    (member) =>
                        member.memberableType === "Customer" &&
                        member.memberableId === customerId
                )
                return { departmentId: department.id, isMember }
            })
        )

        const currentlyAssignedIds = memberships
            .filter((membership) => membership.isMember)
            .map((membership) => membership.departmentId)
        const toRemove = currentlyAssignedIds.filter((id) => id !== selectedDepartmentId)

        if (toRemove.length > 0) {
            await Promise.all(
                toRemove.map((departmentId) =>
                    removeMembers({
                        departmentId,
                        members: [{ memberableType: "Customer", memberableId: customerId }],
                        quiet: true,
                    })
                )
            )
        }

        if (selectedDepartmentId && !currentlyAssignedIds.includes(selectedDepartmentId)) {
            await addMembers({
                departmentId: selectedDepartmentId,
                members: [{ memberableType: "Customer", memberableId: customerId }],
                quiet: true,
            })
        }
    }

    const applyTemplateToCustomerIfSelected = async (customerId: string) => {
        if (!isSchoolPreset) return
        if (!selectedFeeTemplateId) return
        const template = templates.find((t) => t.id === selectedFeeTemplateId)
        if (!template) {
            toast.error(cui.drawer.feeTemplateNotFoundToast)
            return
        }

        const requiredItems = template.items.filter((item) => !item.isOptional && Number(item.amount) > 0)
        if (requiredItems.length === 0) {
            toast.error(cui.drawer.feeTemplateEmptyToast)
            return
        }

        await recordSale({
            items: requiredItems.map((item) => ({
                productName: item.name,
                quantity: 1,
                customPrice: Number(item.amount),
                lineType: "FEE",
            })),
            paymentMethod: "CASH",
            amountPaid: 0,
            customerId,
            channel: "IN_STORE",
            academicTermId: template.academicTermId ?? undefined,
            notes: `Auto-generated from fee template: ${template.name}`,
        })

        toast.success(cui.drawer.feeTemplateAppliedToast)
    }

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        const created = await createCustomer({
            name: formData.name.trim(),
            phoneNumber: formData.phoneNumber.trim() || undefined,
            email: formData.email.trim() || undefined,
            isBlacklisted: formData.isBlacklisted,
        })

        if (created?.id) {
            await syncCustomerDepartment(created.id)
            await applyTemplateToCustomerIfSelected(created.id)
        }

        setIsAddOpen(false)
        resetForm()
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingItem) return
        await updateCustomer({
            id: editingItem.id,
            data: {
                name: formData.name.trim(),
                phoneNumber: formData.phoneNumber.trim() || undefined,
                email: formData.email.trim() || undefined,
                isBlacklisted: formData.isBlacklisted,
            },
        })
        await syncCustomerDepartment(editingItem.id)
        await applyTemplateToCustomerIfSelected(editingItem.id)
        setEditingItem(null)
        resetForm()
    }

    const handleDelete = async () => {
        if (!itemToDelete) return
        await deleteCustomer(itemToDelete.id)
        setConfirmDeleteOpen(false)
        setItemToDelete(null)
        setEditingItem(null)
    }

    const openEdit = (item: Customer) => {
        setFormData({
            name: item.name,
            phoneNumber: item.phoneNumber,
            email: item.email,
            isBlacklisted: item.isBlacklisted,
        })
        setSelectedFeeTemplateId(null)
        setEditingItem(item)
    }

    const renderCustomerActions = (item: Customer) => (
        <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-brand-deep/5 dark:hover:bg-white/5 rounded-full">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 border-brand-deep/5 dark:border-white/5 shadow-2xl">
                    <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 p-3">
                        {cui.actionsMenu.sectionLabel}
                    </DropdownMenuLabel>
                    <DropdownMenuItem
                        onClick={() => setViewingCustomerId(item.id)}
                        className="rounded-xl flex items-center gap-3 cursor-pointer dark:text-brand-cream dark:focus:bg-white/5"
                    >
                        <div className="h-8 w-8 rounded-full bg-brand-green/10 dark:bg-emerald-500/10 flex items-center justify-center text-brand-green dark:text-emerald-400">
                            <User className="w-4 h-4" />
                        </div>
                        <span className="font-medium">{cui.actionsMenu.viewProfile}</span>
                    </DropdownMenuItem>

                    {item.owing !== "—" && (
                        <DropdownMenuItem
                            onClick={() => setRecordingPaymentFor(item)}
                            className="rounded-xl flex items-center gap-3 cursor-pointer dark:text-brand-cream dark:focus:bg-white/5"
                        >
                            <div className="h-8 w-8 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                                <Receipt className="w-4 h-4" />
                            </div>
                            <span className="font-medium">{cui.actionsMenu.recordPayment}</span>
                        </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator className="bg-brand-deep/5 my-1" />

                    {item.phoneNumber && (
                        <>
                            <DropdownMenuItem className="rounded-xl flex items-center gap-3 cursor-pointer dark:text-brand-cream dark:focus:bg-white/5" asChild>
                                <a href={`tel:${item.phoneNumber}`}>
                                    <div className="h-8 w-8 rounded-full bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center text-brand-accent dark:text-brand-cream">
                                        <Phone className="w-4 h-4" />
                                    </div>
                                    <span className="font-medium">{cui.actionsMenu.directCall}</span>
                                </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-xl flex items-center gap-3 cursor-pointer dark:text-brand-cream dark:focus:bg-white/5" asChild>
                                <a href={`https://wa.me/${item.phoneNumber.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer">
                                    <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                        <MessageSquare className="w-4 h-4" />
                                    </div>
                                    <span className="font-medium">{cui.actionsMenu.whatsappChat}</span>
                                </a>
                            </DropdownMenuItem>
                        </>
                    )}

                    <DropdownMenuSeparator className="bg-brand-deep/5 my-1" />

                    <DropdownMenuItem
                        onClick={() => openEdit(item)}
                        className="rounded-xl flex items-center gap-3 cursor-pointer dark:text-brand-cream dark:focus:bg-white/5"
                    >
                        <div className="h-8 w-8 rounded-full bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center text-brand-accent dark:text-brand-cream">
                            <UserPenIcon className="w-4 h-4" />
                        </div>
                        <span className="font-medium">{cui.actionsMenu.editProfile}</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={async () => {
                            await updateCustomer({
                                id: item.id,
                                data: { isBlacklisted: !item.isBlacklisted }
                            })
                        }}
                        className={cn(
                            "rounded-xl flex items-center gap-3 cursor-pointer dark:focus:bg-white/5",
                            item.isBlacklisted ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"
                        )}
                    >
                        <div className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center",
                            item.isBlacklisted ? "bg-emerald-500/10" : "bg-rose-500/10"
                        )}>
                            {item.isBlacklisted ? <CheckCircle2 className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                        </div>
                        <span className="font-medium">{item.isBlacklisted ? cui.actionsMenu.unblacklist : cui.actionsMenu.blacklist}</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={async () => {
                            await updateCustomer({
                                id: item.id,
                                data: { isVip: !item.isVip }
                            })
                        }}
                        className={cn(
                            "rounded-xl flex items-center gap-3 cursor-pointer transition-colors dark:focus:bg-white/5",
                            item.isVip ? "text-brand-accent dark:text-brand-cream font-semibold" : "text-brand-gold font-medium"
                        )}
                    >
                        <div className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center transition-colors",
                            item.isVip ? "bg-brand-accent/10 dark:bg-white/5" : "bg-brand-gold/10"
                        )}>
                            <Star className={cn("w-4 h-4", item.isVip ? "text-brand-accent fill-brand-accent/20" : "text-brand-gold")} />
                        </div>
                        <span>{item.isVip ? cui.actionsMenu.demoteVip : cui.actionsMenu.makeVip}</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )

    const columns: Column<Customer>[] = [
        {
            key: "name",
            header: cui.table.customer,
            render: (_value: Customer[keyof Customer], item: Customer) => (
                <div className="flex flex-col gap-0.5">
                    <span
                        className={cn(
                            "font-serif font-medium text-base",
                            item.isBlacklisted
                                ? "text-brand-deep/30 dark:text-brand-cream/30 line-through"
                                : "text-brand-deep dark:text-brand-cream"
                        )}
                    >
                        {item.name}
                    </span>
                    {item.isVip && (
                        <div className="flex items-center gap-1 mt-1">
                            <Crown className="w-3 h-3 text-brand-gold fill-brand-gold/20" />
                            <span className="text-[9px] font-bold text-brand-gold uppercase tracking-widest">{cui.listCard.statusVip}</span>
                        </div>
                    )}
                    {item.isBlacklisted && (
                        <span className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter mt-1">
                            {cui.listCard.statusBlacklisted}
                        </span>
                    )}
                </div>
            ),
        },
        { key: "orders", header: cui.table.orders },
        { key: "totalSpent", header: cui.table.totalSpent },
        { key: "lastOrder", header: cui.table.lastOrder },
        {
            key: "owing",
            header: cui.table.owing,
            render: (value: Customer[keyof Customer]) => {
                const owing = String(value)
                return (
                    <span
                        className={cn(
                            "font-medium px-2 py-0.5 rounded-full text-xs inline-flex items-center gap-1.5",
                            owing !== "—"
                                ? "bg-brand-gold/10 text-brand-deep dark:text-brand-gold border border-brand-gold/20"
                                : "text-brand-accent/30 dark:text-brand-cream/30"
                        )}
                    >
                        {owing !== "—" && (
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse" />
                        )}
                        {owing}
                    </span>
                )
            },
        },
        {
            key: "actions" as any,
            header: "",
            render: (_value, item: Customer) => renderCustomerActions(item),
        },
    ]

    const debtDisplay = formatCurrency(totalDebtOnPage, { currency: currencyCode })
    const intelligenceWhisper =
        owingCustomersOnPage > 0
            ? cui.whisperWithDebt(owingCustomersOnPage, debtDisplay)
            : cui.whisperClear

    const isFormPending = isCreating || isUpdating
    const totalPages = meta?.totalPages ?? 1
    const canPrev = currentPage > 1
    const canNext = currentPage < totalPages

    if (error) {
        return (
            <PageTransition>
                <div className="max-w-5xl mx-auto space-y-8 pb-24">
                    <ManagementHeader
                        title={pageCopy.customers.title}
                        description={pageCopy.customers.descriptionWithStore(pageCopy.ordersUi.storeDescriptionFallback)}
                    />
                    <GlassCard className="p-8 text-center">
                        <p className="text-brand-deep dark:text-brand-cream mb-4">
                            {(error as Error).message}
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => window.location.reload()}
                            className="rounded-2xl dark:border-white/5 dark:text-brand-cream hover:dark:bg-white/5"
                        >
                            Retry
                        </Button>
                    </GlassCard>
                </div>
            </PageTransition>
        )
    }

    return (
        <PageTransition>
            <div className="max-w-5xl mx-auto space-y-8 pb-24">
                <ManagementHeader
                    title={pageCopy.customers.title}
                    description={pageCopy.customers.descriptionWithStore(
                        currentStore?.name || pageCopy.ordersUi.storeDescriptionFallback
                    )}
                    addButtonLabel={cui.addCustomer}
                    onAddClick={() => {
                        resetForm()
                        setIsAddOpen(true)
                    }}
                />

                <InsightWhisper insight={intelligenceWhisper} />

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <GlassCard className="p-5 flex items-center gap-4 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Users className="w-24 h-24" />
                        </div>
                        <div className="h-12 w-12 rounded-full bg-brand-green/10 dark:bg-brand-green/20 flex items-center justify-center text-brand-deep dark:text-brand-cream">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-brand-accent/40 dark:text-brand-cream/60 uppercase tracking-widest">
                                {cui.stats.totalCustomers}
                            </p>
                            {isStatsLoading ? (
                                <Skeleton className="h-8 w-16 mt-1" />
                            ) : (
                                <p className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream">
                                    {stats?.totalCustomers ?? meta?.total ?? customers.length}
                                </p>
                            )}
                        </div>
                    </GlassCard>

                    <GlassCard className="p-5 flex items-center gap-4 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                            <TrendingUp className="w-24 h-24" />
                        </div>
                        <div className="h-12 w-12 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-brand-gold/60 dark:text-brand-gold/80 uppercase tracking-widest">
                                {cui.stats.active30d}
                            </p>
                            {isStatsLoading ? (
                                <Skeleton className="h-8 w-12 mt-1" />
                            ) : (
                                <p className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-gold">
                                    {stats?.activeCustomers ?? 0}
                                </p>
                            )}
                        </div>
                    </GlassCard>

                    <GlassCard className="p-5 flex items-center gap-4 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                            <User className="w-24 h-24" />
                        </div>
                        <div className="h-12 w-12 rounded-full bg-brand-accent/10 flex items-center justify-center text-brand-accent">
                            <User className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-brand-accent/40 dark:text-brand-cream/40 uppercase tracking-widest">
                                {cui.stats.newThisMonth}
                            </p>
                            {isStatsLoading ? (
                                <Skeleton className="h-8 w-12 mt-1" />
                            ) : (
                                <p className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream">
                                    {stats?.newCustomers ?? 0}
                                </p>
                            )}
                        </div>
                    </GlassCard>

                    <GlassCard
                        className={cn(
                            "p-5 flex items-center gap-4 relative overflow-hidden group transition-all",
                            (stats?.totalDebt ?? 0) > 0
                                ? "border-rose-500/20 bg-rose-500/5 shadow-[0_0_20px_rgba(239,68,68,0.05)]"
                                : "border-brand-deep/5"
                        )}
                    >
                        <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity text-rose-500">
                            <AlertCircle className="w-24 h-24" />
                        </div>
                        <div className="h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-rose-500/60 uppercase tracking-widest">
                                {cui.stats.totalCredit}
                            </p>
                            {isStatsLoading ? (
                                <Skeleton className="h-8 w-12 mt-1" />
                            ) : (
                                <p className="text-2xl font-serif font-medium text-rose-500">
                                    <CurrencyText value={formatCurrency(stats?.totalDebt ?? 0, { currency: currencyCode })} />
                                </p>
                            )}
                        </div>
                    </GlassCard>
                </div>

                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-accent/40 dark:text-brand-cream/40 ml-1">
                            {cui.relationshipList}
                        </p>
                        <div className="flex items-center gap-3 font-sans w-full md:w-auto">
                            <TableSearch
                                value={search}
                                onChange={setSearch}
                                placeholder={cui.searchPlaceholder}
                                className="flex-1 min-w-0 w-full"
                            />
                            <div className="shrink-0">
                                <FilterPopover
                                    groups={filterGroups}
                                    selectedValues={selectedFilters}
                                    onSelectionChange={setSelectedFilters}
                                    onClear={() => setSelectedFilters([])}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {isPending && !customers.length ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                        ))}
                    </div>
                ) : isMobile ? (
                    <div className="space-y-3">
                        {filteredCustomers.length === 0 ? (
                            <GlassCard className="p-12 text-center border-dashed border-brand-deep/20 dark:border-white/10 bg-transparent">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="h-16 w-16 rounded-3xl bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center mb-2">
                                        <Users className="w-8 h-8 text-brand-deep/20 dark:text-white/20" />
                                    </div>
                                    <h3 className="text-brand-deep dark:text-brand-cream font-medium">{cui.emptyState.title}</h3>
                                    <p className="text-xs text-brand-accent/40 dark:text-brand-cream/40 max-w-[240px] mx-auto">
                                        {cui.emptyState.hint}
                                    </p>
                                </div>
                            </GlassCard>
                        ) : (
                            filteredCustomers.map((customer, index) => (
                                <ListCard
                                    key={customer.id}
                                    title={customer.name}
                                    subtitle={
                                        customer.lastOrder !== "Never"
                                            ? `${cui.listCard.lastOrderPrefix} ${customer.lastOrder}`
                                            : cui.listCard.noOrdersYet
                                    }
                                    meta={`${customer.orders} ${cui.listCard.ordersTotalSuffix}`}
                                    icon={User}
                                    iconClassName="text-brand-deep/40 dark:text-brand-cream/40"
                                    status={
                                        customer.isBlacklisted
                                            ? cui.listCard.statusBlacklisted
                                            : customer.isVip
                                              ? cui.listCard.statusVip
                                              : undefined
                                    }
                                    statusColor={customer.isBlacklisted ? "danger" : customer.isVip ? "warning" : undefined}
                                    value={
                                        customer.owing !== "—" ? customer.owing : customer.totalSpent
                                    }
                                    valueLabel={
                                        customer.owing !== "—"
                                            ? cui.listCard.currentDebt
                                            : cui.listCard.totalLifetimeSpend
                                    }
                                    delay={index * 0.05}
                                    actions={renderCustomerActions(customer)}
                                    onClick={() => setViewingCustomerId(customer.id)}
                                />
                            ))
                        )}
                    </div>
                ) : (
                    <GlassCard className="overflow-hidden border-brand-deep/5 dark:border-white/5">
                        <DataTable
                            columns={columns}
                            data={filteredCustomers}
                            emptyMessage={cui.tableEmpty}
                        />
                    </GlassCard>
                )}

                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!canPrev || isPending}
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            className="rounded-xl dark:border-white/5 dark:text-brand-cream hover:dark:bg-white/5"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                        </Button>
                        <span className="text-sm text-brand-accent/60 dark:text-brand-cream/60">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!canNext || isPending}
                            onClick={() => setCurrentPage((p) => p + 1)}
                            className="rounded-xl dark:border-white/5 dark:text-brand-cream hover:dark:bg-white/5"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                )}

                <Drawer
                    open={isAddOpen || !!editingItem}
                    onOpenChange={(open) => {
                        if (!open) {
                            setIsAddOpen(false)
                            setEditingItem(null)
                            resetForm()
                        }
                    }}
                >
                    <DrawerContent>
                        <DrawerStickyHeader>
                            <DrawerTitle>
                                {editingItem ? cui.drawer.editTitle : cui.drawer.addTitle}
                            </DrawerTitle>
                            <DrawerDescription>
                                {editingItem ? cui.drawer.editDescription : cui.drawer.addDescription}
                            </DrawerDescription>
                        </DrawerStickyHeader>

                        <div className="p-8 pb-12 overflow-y-auto">
                            <form
                                onSubmit={editingItem ? handleUpdate : handleAdd}
                                className="max-w-lg mx-auto space-y-6"
                            >
                                <div className="space-y-3">
                                    <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1 block">
                                        {cui.drawer.nameLabel}
                                    </label>
                                    <input
                                        autoFocus
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
                                        }
                                        placeholder="e.g. Mrs. Adebayo"
                                        className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/20 text-brand-deep dark:text-brand-cream"
                                        required
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1 block">
                                        {cui.drawer.phoneLabel}
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phoneNumber}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                phoneNumber: e.target.value,
                                            })
                                        }
                                        placeholder="e.g. 08012345678"
                                        className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/20 text-brand-deep dark:text-brand-cream"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1 block">
                                        {cui.drawer.emailLabel}
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) =>
                                            setFormData({ ...formData, email: e.target.value })
                                        }
                                        placeholder="e.g. adebayo@example.com"
                                        className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/20 text-brand-deep dark:text-brand-cream"
                                    />
                                </div>

                                {showDepartmentField && (
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1 block">
                                            {cui.drawer.departmentLabel}
                                        </label>
                                        {isDepartmentLookupLoading ? (
                                            <div className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 text-sm text-brand-accent/50 dark:text-brand-cream/50">
                                                Loading current department...
                                            </div>
                                        ) : (
                                            <>
                                                <Select
                                                    value={selectedDepartmentId ?? "__none__"}
                                                    onValueChange={(value) =>
                                                        setSelectedDepartmentId(value === "__none__" ? null : value)
                                                    }
                                                >
                                                    <SelectTrigger className="h-14 rounded-2xl px-6 bg-white dark:bg-white/5 border-brand-deep/5 dark:border-white/10">
                                                        <SelectValue placeholder={cui.drawer.departmentPlaceholder} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="__none__">{cui.drawer.departmentPlaceholder}</SelectItem>
                                                        {departments.map((department) => (
                                                            <SelectItem key={department.id} value={department.id}>
                                                                {department.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {departments.length === 0 && (
                                                    <p className="text-xs text-brand-accent/50 dark:text-brand-cream/50 ml-1">
                                                        {cui.drawer.departmentEmptyHint}
                                                    </p>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}

                                {isSchoolPreset && (
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 ml-1 block">
                                            {cui.drawer.feeTemplateLabel}
                                        </label>
                                        <Select
                                            value={selectedFeeTemplateId ?? "__none__"}
                                            onValueChange={(value) =>
                                                setSelectedFeeTemplateId(value === "__none__" ? null : value)
                                            }
                                        >
                                            <SelectTrigger className="h-14 rounded-2xl px-6 bg-white dark:bg-white/5 border-brand-deep/5 dark:border-white/10">
                                                <SelectValue placeholder={cui.drawer.feeTemplatePlaceholder} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="__none__">{cui.drawer.feeTemplatePlaceholder}</SelectItem>
                                                {templates
                                                    .filter((template) => template.status !== "ARCHIVED")
                                                    .map((template) => (
                                                        <SelectItem key={template.id} value={template.id}>
                                                            {template.name}
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-brand-accent/50 dark:text-brand-cream/50 ml-1">
                                            {cui.drawer.feeTemplateHint}
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-brand-deep/2 dark:bg-white/5 border border-brand-deep/5 dark:border-white/5">
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-medium text-brand-deep dark:text-brand-cream">
                                                {cui.drawer.blacklistTitle}
                                            </p>
                                            <p className="text-xs text-brand-accent/40 dark:text-brand-cream/40">
                                                {cui.drawer.blacklistHint}
                                            </p>
                                        </div>
                                        <Switch
                                            checked={formData.isBlacklisted}
                                            onCheckedChange={(checked) =>
                                                setFormData({
                                                    ...formData,
                                                    isBlacklisted: checked,
                                                })
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <DrawerClose asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="flex-1 rounded-2xl h-14 border-brand-deep/5 dark:border-white/5 dark:text-brand-cream"
                                        >
                                            {cui.drawer.cancel}
                                        </Button>
                                    </DrawerClose>
                                    <Button
                                        type="submit"
                                        disabled={isFormPending}
                                        className="flex-1 rounded-2xl h-14 bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold shadow-xl"
                                    >
                                        {isFormPending ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : editingItem ? (
                                            cui.drawer.saveChanges
                                        ) : (
                                            cui.drawer.createButton
                                        )}
                                    </Button>
                                </div>

                                {editingItem && (
                                    <div className="pt-6 border-t border-brand-deep/5 dark:border-white/5 mt-6">
                                        <button
                                            type="button"
                                            disabled={isDeleting}
                                            onClick={() => {
                                                setItemToDelete(editingItem)
                                                setConfirmDeleteOpen(true)
                                            }}
                                            className="flex items-center justify-center gap-2 w-full py-4 text-xs font-bold text-rose-500/60 hover:text-rose-500 transition-all uppercase tracking-widest disabled:opacity-50"
                                        >
                                            {isDeleting ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                            {cui.drawer.removeProfile}
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                    </DrawerContent>
                </Drawer>

                <ConfirmDialog
                    open={confirmDeleteOpen}
                    onOpenChange={setConfirmDeleteOpen}
                    onConfirm={handleDelete}
                    title={cui.deleteConfirm.title}
                    description={
                        itemToDelete?.name
                            ? cui.deleteConfirm.description(itemToDelete.name)
                            : cui.deleteConfirm.title
                    }
                    confirmText={cui.deleteConfirm.confirm}
                    variant="destructive"
                />

                <CustomerProfileDrawer
                    customer={viewingCustomer}
                    open={!!viewingCustomerId}
                    onOpenChange={(open) => !open && setViewingCustomerId(null)}
                    onEdit={(c) => {
                        setViewingCustomerId(null)
                        openEdit(c)
                    }}
                    onUpdateVip={async (id, isVip) => {
                        await updateCustomer({ id, data: { isVip } })
                    }}
                />

                <RecordPaymentDrawer
                    order={recordingPaymentFor ? ({
                        id: recordingPaymentFor.id,
                        totalAmount: recordingPaymentFor.owing.replace(/[^0-9]/g, ""),
                        amountPaid: "0",
                        currency: currencyCode,
                        shortCode: recordingPaymentFor.name.substring(0, 8),
                    } as any) : null}
                    open={!!recordingPaymentFor}
                    onOpenChange={(open) => !open && setRecordingPaymentFor(null)}
                    onSuccess={async (amount, method) => {
                        // This would typically call a Collect Payment API
                        console.log(`Collecting ${amount} via ${method} for ${recordingPaymentFor?.name}`)
                    }}
                    isSubmitting={false}
                />
            </div>
        </PageTransition>
    )
}
