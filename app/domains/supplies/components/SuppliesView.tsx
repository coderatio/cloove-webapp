"use client"

import * as React from "react"
import DataTable, { type Column } from "@/app/components/DataTable"
import { ManagementHeader } from "@/app/components/shared/ManagementHeader"
import { TableSearch } from "@/app/components/shared/TableSearch"
import { FilterPopover } from "@/app/components/shared/FilterPopover"
import { GlassCard } from "@/app/components/ui/glass-card"
import { PageTransition } from "@/app/components/layout/page-transition"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Textarea } from "@/app/components/ui/textarea"
import { MoneyInput } from "@/app/components/ui/money-input"
import { ImageUpload } from "@/app/components/ui/image-upload"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/app/components/ui/select"
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerBody,
    DrawerFooter,
    DrawerTitle,
    DrawerDescription,
} from "@/app/components/ui/drawer"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
} from "@/app/components/ui/base-dialog"
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/app/components/ui/dropdown-menu"
import { HugeiconsIcon } from "@hugeicons/react"
import {
    MoreVerticalIcon as MoreVertical,
    PencilIcon as Pencil,
    Delete02Icon as Trash2,
    Alert02Icon as AlertTriangle,
    PackageIcon as Package,
    ArrowDataTransferHorizontalIcon as Transfer,
    Tag01Icon as Tag,
} from "@hugeicons/core-free-icons"
import { useBusiness } from "@/app/components/BusinessProvider"
import { usePermission } from "@/app/hooks/usePermission"
import { useStores } from "@/app/domains/stores/providers/StoreProvider"
import { formatCurrency } from "@/app/lib/formatters"
import { useSupplies } from "../hooks/useSupplies"
import { useSupplyCategories } from "../hooks/useSupplyCategories"
import { ManageSupplyCategoriesDrawer } from "./ManageSupplyCategoriesDrawer"
import { Supply, CreateSupplyPayload, AdjustStockMode } from "../types"

const PRODUCT_UNITS = [
    "PIECE", "BOX", "PACK", "CARTON", "DOZEN",
    "KG", "G", "LB", "OZ", "L", "ML", "M", "CM", "OTHER",
] as const

const ALL_STORES = "all-stores"
const PAGE_SIZE = 10

interface SupplyRow {
    id: string
    name: string
    category: string
    unit: string
    stock: number
    reorderLevel: number | null
    costPriceLabel: string
    status: "In Stock" | "Low Stock"
    raw: Supply
}

interface FormState {
    name: string
    categoryId: string
    unit: string
    costPrice: number
    reorderLevel: string
    notes: string
    imageUrls: string[]
    storeQuantities: Record<string, string>
}

const emptyForm = (): FormState => ({
    name: "",
    categoryId: "",
    unit: "",
    costPrice: 0,
    reorderLevel: "",
    notes: "",
    imageUrls: [],
    storeQuantities: {},
})

/** Sum a supply's stock across all (or a single) store's inventory rows. */
function sumStock(supply: Supply, storeId?: string): number {
    return (supply.inventories || [])
        .filter((inv) => (storeId && storeId !== ALL_STORES ? inv.storeId === storeId : true))
        .reduce((acc, inv) => acc + (inv.stockQuantity || 0), 0)
}

export function SuppliesView() {
    const { currency, activeBusiness } = useBusiness()
    const currencyCode = activeBusiness?.currency || "NGN"
    const { can } = usePermission()
    const canManage = can("MANAGE_SUPPLIES")
    const { stores } = useStores()
    const { options: categoryOptions } = useSupplyCategories()

    const [search, setSearch] = React.useState("")
    const [selectedFilters, setSelectedFilters] = React.useState<string[]>([])
    const [storeFilter, setStoreFilter] = React.useState<string>(ALL_STORES)
    const [page, setPage] = React.useState(1)
    const [categoriesDrawerOpen, setCategoriesDrawerOpen] = React.useState(false)

    const STATUS_VALUES = ["In Stock", "Low Stock"]
    const filters = React.useMemo(() => {
        const statuses = selectedFilters.filter((v) => STATUS_VALUES.includes(v))
        const categoryIds = selectedFilters.filter((v) =>
            categoryOptions.some((o) => o.value === v)
        )
        return {
            search: search || undefined,
            status: statuses.length ? statuses : undefined,
            categoryIds: categoryIds.length ? categoryIds : undefined,
        }
    }, [search, selectedFilters, categoryOptions])

    const {
        supplies,
        meta,
        summary,
        isLoading,
        createSupply,
        updateSupply,
        deleteSupply,
        adjustStock,
        isAdjustingStock,
    } = useSupplies(storeFilter, page, PAGE_SIZE, filters)

    const lowThreshold = summary?.lowStockThreshold ?? 5

    // Drawer (create / edit) state
    const [drawerOpen, setDrawerOpen] = React.useState(false)
    const [editing, setEditing] = React.useState<Supply | null>(null)
    const [form, setForm] = React.useState<FormState>(emptyForm())
    const [saving, setSaving] = React.useState(false)

    // Adjust-stock dialog state
    const [adjustTarget, setAdjustTarget] = React.useState<Supply | null>(null)
    const [adjustStore, setAdjustStore] = React.useState<string>("")
    const [adjustMode, setAdjustMode] = React.useState<AdjustStockMode>("RELATIVE")
    const [adjustQty, setAdjustQty] = React.useState<string>("")

    const rows: SupplyRow[] = React.useMemo(() => {
        return (supplies || []).map((supply) => {
            const stock = sumStock(supply, storeFilter)
            const threshold = supply.reorderLevel ?? lowThreshold
            return {
                id: supply.id,
                name: supply.name,
                category: supply.category?.name || "—",
                unit: supply.unit || "—",
                stock,
                reorderLevel: supply.reorderLevel ?? null,
                costPriceLabel:
                    supply.costPrice != null
                        ? formatCurrency(supply.costPrice, { currency: currencyCode })
                        : "—",
                status: stock <= threshold ? "Low Stock" : "In Stock",
                raw: supply,
            }
        })
    }, [supplies, storeFilter, lowThreshold, currencyCode])

    function openCreate() {
        setEditing(null)
        setForm(emptyForm())
        setDrawerOpen(true)
    }

    function openEdit(supply: Supply) {
        const storeQuantities: Record<string, string> = {}
        for (const inv of supply.inventories || []) {
            storeQuantities[inv.storeId] = String(inv.stockQuantity ?? 0)
        }
        setEditing(supply)
        setForm({
            name: supply.name,
            categoryId: supply.categoryId ?? supply.category?.id ?? "",
            unit: supply.unit || "",
            costPrice: supply.costPrice ?? 0,
            reorderLevel: supply.reorderLevel != null ? String(supply.reorderLevel) : "",
            notes: supply.notes || "",
            imageUrls: supply.images || [],
            storeQuantities,
        })
        setDrawerOpen(true)
    }

    function buildPayload(): CreateSupplyPayload {
        const storeInventory = Object.entries(form.storeQuantities)
            .filter(([, qty]) => qty !== "" && !Number.isNaN(Number(qty)))
            .map(([storeId, qty]) => ({ storeId, stockQuantity: Math.max(0, Number(qty)) }))

        return {
            name: form.name.trim(),
            categoryId: form.categoryId || undefined,
            unit: form.unit || undefined,
            costPrice: form.costPrice || undefined,
            reorderLevel: form.reorderLevel !== "" ? Number(form.reorderLevel) : undefined,
            notes: form.notes.trim() || undefined,
            imageUrls: form.imageUrls.length ? form.imageUrls : undefined,
            storeInventory: storeInventory.length ? storeInventory : undefined,
        }
    }

    async function handleSave() {
        if (form.name.trim().length < 2) return
        setSaving(true)
        try {
            const payload = buildPayload()
            if (editing) {
                await updateSupply({ id: editing.id, data: payload })
            } else {
                await createSupply(payload)
            }
            setDrawerOpen(false)
        } catch {
            // toast already shown by the hook
        } finally {
            setSaving(false)
        }
    }

    function openAdjust(supply: Supply) {
        const defaultStore =
            storeFilter !== ALL_STORES
                ? storeFilter
                : supply.inventories?.[0]?.storeId || stores[0]?.id || ""
        setAdjustTarget(supply)
        setAdjustStore(defaultStore)
        setAdjustMode("RELATIVE")
        setAdjustQty("")
    }

    async function handleAdjust() {
        if (!adjustTarget || !adjustStore || adjustQty === "") return
        try {
            await adjustStock({
                id: adjustTarget.id,
                storeId: adjustStore,
                adjustment: Number(adjustQty),
                mode: adjustMode,
            })
            setAdjustTarget(null)
        } catch {
            // toast already shown by the hook
        }
    }

    const columns: Column<SupplyRow>[] = [
        {
            key: "name",
            header: "Supply",
            render: (_v, row) => (
                <div className="flex items-center gap-3">
                    {row.raw.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={row.raw.images[0]}
                            alt={row.name}
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            className="h-9 w-9 shrink-0 rounded-lg object-cover"
                        />
                    ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-deep/5 text-brand-deep/30 dark:bg-white/5">
                            <HugeiconsIcon icon={Package} className="h-4 w-4" />
                        </div>
                    )}
                    <div className="flex min-w-0 flex-col">
                        <span className="truncate font-medium text-foreground">{row.name}</span>
                        {row.raw.notes ? (
                            <span className="line-clamp-1 text-xs text-muted-foreground">{row.raw.notes}</span>
                        ) : null}
                    </div>
                </div>
            ),
        },
        { key: "category", header: "Category" },
        { key: "unit", header: "Unit" },
        {
            key: "stock",
            header: "Stock",
            render: (_v, row) => (
                <span className="font-medium tabular-nums">
                    {row.stock}
                    {row.unit !== "—" ? <span className="ml-1 text-xs text-muted-foreground">{row.unit}</span> : null}
                </span>
            ),
        },
        {
            key: "reorderLevel",
            header: "Reorder level",
            render: (_v, row) => <span className="tabular-nums text-muted-foreground">{row.reorderLevel ?? "—"}</span>,
        },
        { key: "costPriceLabel", header: "Cost price" },
        {
            key: "status",
            header: "Status",
            render: (_v, row) => (
                <Badge variant={row.status === "Low Stock" ? "warning" : "success"}>
                    {row.status === "Low Stock" ? (
                        <HugeiconsIcon icon={AlertTriangle} className="mr-1 h-3 w-3" />
                    ) : null}
                    {row.status}
                </Badge>
            ),
        },
        {
            key: "id",
            header: "",
            headerClassName: "w-10",
            render: (_v, row) =>
                canManage ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <HugeiconsIcon icon={MoreVertical} className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-48 rounded-2xl p-2 border-brand-deep/5 dark:border-white/5 shadow-2xl"
                        >
                            <DropdownMenuItem
                                onClick={() => openAdjust(row.raw)}
                                className="rounded-xl flex items-center gap-3 cursor-pointer dark:text-brand-cream dark:focus:bg-white/5"
                            >
                                <HugeiconsIcon icon={Transfer} className="h-4 w-4" />
                                Adjust stock
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => openEdit(row.raw)}
                                className="rounded-xl flex items-center gap-3 cursor-pointer dark:text-brand-cream dark:focus:bg-white/5"
                            >
                                <HugeiconsIcon icon={Pencil} className="h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    if (confirm(`Delete "${row.name}"?`)) void deleteSupply(row.raw.id)
                                }}
                                className="rounded-xl flex items-center gap-3 cursor-pointer text-rose-600 focus:bg-rose-500/10 focus:text-rose-600"
                            >
                                <HugeiconsIcon icon={Trash2} className="h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : null,
        },
    ]

    const statItems = [
        { label: "Supplies", value: String(summary?.totalSupplies ?? 0) },
        { label: "Stock units", value: String(summary?.totalStockUnits ?? 0) },
        {
            label: "Stock value",
            value: formatCurrency(summary?.totalValue ?? 0, { currency: currencyCode }),
        },
        { label: "Low stock", value: String(summary?.lowStockItems ?? 0) },
    ]

    return (
        <PageTransition>
            <div className="space-y-5">
                <ManagementHeader
                    title="Supplies"
                    description="Track internal stock and supplies your business uses but doesn't sell."
                    addButtonLabel={canManage ? "Add supply" : undefined}
                    onAddClick={canManage ? openCreate : undefined}
                    extraActions={
                        <div className="flex items-center gap-2">
                            {stores.length > 1 ? (
                                <Select
                                    value={storeFilter}
                                    onValueChange={(v) => {
                                        setStoreFilter(v)
                                        setPage(1)
                                    }}
                                >
                                    <SelectTrigger className="h-9 w-[160px] rounded-full">
                                        <SelectValue placeholder="All stores" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={ALL_STORES}>All stores</SelectItem>
                                        {stores.map((s) => (
                                            <SelectItem key={s.id} value={s.id}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : null}
                            {canManage ? (
                                <Button
                                    variant="ghost"
                                    onClick={() => setCategoriesDrawerOpen(true)}
                                    className="h-9 rounded-full bg-white border border-brand-accent/10 text-brand-deep-800 hover:text-brand-deep dark:bg-white/5 dark:text-brand-cream/80 dark:border-brand-gold-500/20 dark:hover:text-brand-gold gap-2"
                                >
                                    <HugeiconsIcon icon={Tag} className="h-4 w-4" />
                                    Categories
                                </Button>
                            ) : null}
                        </div>
                    }
                />

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {statItems.map((stat) => (
                        <GlassCard key={stat.label} className="p-4">
                            <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                            <p className="mt-1 text-xl font-semibold text-foreground">{stat.value}</p>
                        </GlassCard>
                    ))}
                </div>

                {/* Search + filter row */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <TableSearch
                        value={search}
                        onChange={(v) => {
                            setSearch(v)
                            setPage(1)
                        }}
                        placeholder="Search supplies..."
                    />
                    <FilterPopover
                        groups={[
                            {
                                title: "Status",
                                options: [
                                    { label: "In Stock", value: "In Stock" },
                                    { label: "Low Stock", value: "Low Stock" },
                                ],
                            },
                            ...(categoryOptions.length
                                ? [{ title: "Category", options: categoryOptions, type: "multiselect" as const }]
                                : []),
                        ]}
                        selectedValues={selectedFilters}
                        onSelectionChange={(values) => {
                            setSelectedFilters(values)
                            setPage(1)
                        }}
                        onClear={() => setSelectedFilters([])}
                        iconOnly
                    />
                </div>

                <div className="overflow-hidden rounded-2xl border border-brand-deep/[0.06] bg-white/60 shadow-sm shadow-brand-deep/[0.02] dark:border-white/[0.06] dark:bg-white/[0.02]">
                    <DataTable
                        columns={columns}
                        data={rows}
                        isLoading={isLoading}
                        emptyMessage="No supplies yet. Add flour, oil, packaging, and other internal stock to track it here."
                        manualPagination={{
                            currentPage: page,
                            totalPages: meta?.totalPages || 1,
                            onPageChange: setPage,
                            total: (meta as any)?.total,
                        }}
                    />
                </div>
            </div>

            {/* Create / Edit drawer */}
            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                <DrawerContent>
                    <DrawerStickyHeader>
                        <DrawerTitle>{editing ? "Edit supply" : "Add supply"}</DrawerTitle>
                        <DrawerDescription>
                            Internal stock is never shown to customers or synced to your catalog.
                        </DrawerDescription>
                    </DrawerStickyHeader>
                    <DrawerBody className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>Images</Label>
                            <ImageUpload
                                value={form.imageUrls}
                                onChange={(urls) => setForm((f) => ({ ...f, imageUrls: urls }))}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="supply-name">Name</Label>
                            <Input
                                id="supply-name"
                                value={form.name}
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                placeholder="e.g. Groundnut Oil"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label>Category</Label>
                                    {canManage ? (
                                        <button
                                            type="button"
                                            onClick={() => setCategoriesDrawerOpen(true)}
                                            className="text-xs font-medium text-brand-green hover:underline dark:text-brand-gold"
                                        >
                                            Manage
                                        </button>
                                    ) : null}
                                </div>
                                <Select
                                    value={form.categoryId || "none"}
                                    onValueChange={(v) =>
                                        setForm((f) => ({ ...f, categoryId: v === "none" ? "" : v }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No category</SelectItem>
                                        {categoryOptions.map((o) => (
                                            <SelectItem key={o.value} value={o.value}>
                                                {o.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Unit</Label>
                                <Select
                                    value={form.unit}
                                    onValueChange={(v) => setForm((f) => ({ ...f, unit: v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select unit" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PRODUCT_UNITS.map((u) => (
                                            <SelectItem key={u} value={u}>
                                                {u}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Cost price</Label>
                                <MoneyInput
                                    value={form.costPrice}
                                    onChange={(v) => setForm((f) => ({ ...f, costPrice: v }))}
                                    currencySymbol={currency}
                                    className="h-[46px]"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="supply-reorder">Reorder level</Label>
                                <Input
                                    id="supply-reorder"
                                    type="number"
                                    min={0}
                                    value={form.reorderLevel}
                                    onChange={(e) => setForm((f) => ({ ...f, reorderLevel: e.target.value }))}
                                    placeholder={`Default ${lowThreshold}`}
                                />
                            </div>
                        </div>

                        {stores.length > 0 ? (
                            <div className="space-y-2">
                                <Label>Stock per store</Label>
                                <div className="space-y-2 rounded-xl border border-brand-deep/5 p-3 dark:border-white/8">
                                    {stores.map((s) => (
                                        <div key={s.id} className="flex items-center justify-between gap-3">
                                            <span className="text-sm text-foreground">{s.name}</span>
                                            <Input
                                                type="number"
                                                min={0}
                                                className="h-9 w-28"
                                                value={form.storeQuantities[s.id] ?? ""}
                                                onChange={(e) =>
                                                    setForm((f) => ({
                                                        ...f,
                                                        storeQuantities: {
                                                            ...f.storeQuantities,
                                                            [s.id]: e.target.value,
                                                        },
                                                    }))
                                                }
                                                placeholder="0"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="flex items-center gap-2 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-600">
                                <HugeiconsIcon icon={Package} className="h-4 w-4" />
                                Add a store first to track stock quantities.
                            </p>
                        )}

                        <div className="space-y-1.5">
                            <Label htmlFor="supply-notes">Notes</Label>
                            <Textarea
                                id="supply-notes"
                                value={form.notes}
                                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                                placeholder="Optional notes (supplier, storage, etc.)"
                            />
                        </div>
                    </DrawerBody>
                    <DrawerFooter className="grid grid-cols-3 gap-2">
                        <Button variant="ghost" onClick={() => setDrawerOpen(false)}>
                            Cancel
                        </Button>
                        <Button className="col-span-2" onClick={handleSave} disabled={saving || form.name.trim().length < 2}>
                            {saving ? "Saving..." : editing ? "Save changes" : "Add supply"}
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>

            {/* Adjust-stock dialog */}
            <Dialog open={!!adjustTarget} onOpenChange={(o) => !o && setAdjustTarget(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader className="shrink-0">
                        <DialogTitle className="text-2xl">Adjust stock</DialogTitle>
                        <DialogDescription>{adjustTarget?.name}</DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 min-h-0 space-y-4 overflow-y-auto px-8 pt-2">
                        {stores.length > 1 ? (
                            <div className="space-y-1.5">
                                <Label>Store</Label>
                                <Select value={adjustStore} onValueChange={setAdjustStore}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select store" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {stores.map((s) => (
                                            <SelectItem key={s.id} value={s.id}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : null}
                        <div className="space-y-1.5">
                            <Label>Mode</Label>
                            <Select value={adjustMode} onValueChange={(v) => setAdjustMode(v as AdjustStockMode)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="RELATIVE">Add / remove (+/-)</SelectItem>
                                    <SelectItem value="ABSOLUTE">Set exact quantity</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="supply-adjust-qty">
                                {adjustMode === "ABSOLUTE" ? "New quantity" : "Quantity (use - to remove)"}
                            </Label>
                            <Input
                                id="supply-adjust-qty"
                                type="number"
                                value={adjustQty}
                                onChange={(e) => setAdjustQty(e.target.value)}
                                placeholder={adjustMode === "ABSOLUTE" ? "e.g. 20" : "e.g. -6"}
                            />
                        </div>
                    </div>
                    <DialogFooter className="shrink-0 grid grid-cols-3 gap-2 sm:space-x-0">
                        <Button variant="ghost" onClick={() => setAdjustTarget(null)}>
                            Cancel
                        </Button>
                        <Button
                            className="col-span-2"
                            onClick={handleAdjust}
                            disabled={isAdjustingStock || !adjustStore || adjustQty === ""}
                        >
                            {isAdjustingStock ? "Saving..." : "Apply"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ManageSupplyCategoriesDrawer
                open={categoriesDrawerOpen}
                onOpenChange={setCategoriesDrawerOpen}
            />
        </PageTransition>
    )
}
