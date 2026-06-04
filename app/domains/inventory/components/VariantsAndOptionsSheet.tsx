"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { HugeiconsIcon } from "@hugeicons/react"
import { PlusSignIcon as Plus, Delete02Icon as Trash2, ChevronDownIcon as ChevronDown, SparklesIcon as Sparkles, Loading03Icon as Loader2, ListTreeIcon as ListTree, Layers01Icon as Layers, Tag01Icon as Tag, BoxesIcon as Boxes } from "@hugeicons/core-free-icons"

import { cn } from "@/app/lib/utils"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { GlassCard } from "@/app/components/ui/glass-card"
import { MoneyInput } from "@/app/components/ui/money-input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/app/components/ui/select"
import {
    SideSheet,
    SideSheetContent,
    SideSheetStickyHeader,
    SideSheetTitle,
    SideSheetDescription,
    SideSheetBody,
    SideSheetFooter,
    SideSheetClose,
} from "@/app/components/ui/side-sheet"
import { formatCurrency } from "@/app/lib/formatters"
import { useStores } from "@/app/domains/stores/providers/StoreProvider"
import type { BarcodeFormat } from "../hooks/useBarcodeGenerator"

// ---------- Public form-side types (mirrored in InventoryView) ----------
//
// We keep these mirrored rather than importing from InventoryView to avoid a
// circular dep and to make the sheet a self-contained editor.

export interface FormStoreInventoryLine {
    storeId: string
    stockQuantity: number
}

export interface FormVariantOptionValue {
    name: string
    value: string
}

export interface FormVariantRow {
    _key: string
    id?: string
    name: string
    sku: string
    barcode: string
    price: string
    stockQuantity: number
    storeInventory?: FormStoreInventoryLine[]
    optionValues: FormVariantOptionValue[]
}

export interface FormProductOption {
    name: string
    position: number
    values: string[]
}

export const META_OPTION_NAMES = [
    "Color",
    "Size",
    "Material",
    "Pattern",
    "Gender",
    "Age group",
    "Brand",
] as const

export const MAX_PRODUCT_OPTIONS = 3

let __variantKeyCounter = 0
export function newVariantKey(): string {
    __variantKeyCounter += 1
    return `v-${Date.now().toString(36)}-${__variantKeyCounter}`
}

export function variantDisplayNameFromOptions(optionValues: FormVariantOptionValue[]): string {
    return optionValues
        .map((entry) => entry.value?.trim())
        .filter((part): part is string => Boolean(part))
        .join(" / ")
}

// Internal helper used by the editor — kept private so callers stick to the
// pure data api above.
function getVariantOptionValue(variant: FormVariantRow, axisName: string): string {
    return (variant.optionValues.find((ov) => ov.name === axisName)?.value || "").trim()
}

// ----------------------------- OptionRow -----------------------------------
//
// We keep the values text local so commas don't get eaten by the
// split/trim/filter/join roundtrip on every keystroke. The parsed array is
// pushed up to the parent on every change for downstream consumers; the
// displayed text always tracks what the user actually typed.

function parseOptionValuesText(text: string): string[] {
    const seen = new Set<string>()
    const out: string[] = []
    for (const part of text.split(",")) {
        const trimmed = part.trim()
        if (!trimmed || seen.has(trimmed)) continue
        seen.add(trimmed)
        out.push(trimmed)
    }
    return out
}

const OPTION_VALUES_PLACEHOLDERS: Record<string, string> = {
    Color: "Red, Blue, Green",
    Size: "S, M, L",
    Material: "Cotton, Leather, Silk",
    Pattern: "Striped, Plaid, Solid",
    Gender: "Male, Female, Unisex",
    "Age group": "Adult, Kids, Toddler",
    Brand: "Nike, Adidas, Puma",
}

function placeholderForOption(name: string): string {
    return OPTION_VALUES_PLACEHOLDERS[name] || "Value 1, Value 2, Value 3"
}

const SINGLE_VALUE_PLACEHOLDERS: Record<string, string> = {
    Color: "Red",
    Size: "M",
    Material: "Cotton",
    Pattern: "Striped",
    Gender: "Male",
    "Age group": "Adult",
    Brand: "Nike",
}

function singleValuePlaceholderForOption(name: string): string {
    return SINGLE_VALUE_PLACEHOLDERS[name] || "value"
}

interface OptionRowProps {
    option: FormProductOption
    /** Option names already used by other rows — excluded from this row's picker. */
    disallowedNames: string[]
    onRename: (nextName: string) => void
    onSetValues: (values: string[]) => void
    onRemove: () => void
}

const OptionRow = React.memo(function OptionRow({
    option,
    disallowedNames,
    onRename,
    onSetValues,
    onRemove,
}: OptionRowProps) {
    const isCustom = !(META_OPTION_NAMES as readonly string[]).includes(option.name)
    const disallowedSet = React.useMemo(() => new Set(disallowedNames), [disallowedNames])
    const [valuesText, setValuesText] = React.useState<string>(() => option.values.join(", "))

    // Resync the input when the parent replaces values from outside (e.g. add
    // option / remove option / reset form). We only overwrite local text when
    // its parsed form drifts from the parent — typing keeps user input intact.
    React.useEffect(() => {
        const parsedLocal = parseOptionValuesText(valuesText)
        const sameAsParent =
            parsedLocal.length === option.values.length &&
            parsedLocal.every((v, i) => v === option.values[i])
        if (!sameAsParent) {
            setValuesText(option.values.join(", "))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [option.values.join("\u0000")])

    return (
        <GlassCard
            allowOverflow
            className="p-4 bg-white dark:bg-white/5 border-brand-deep/5 dark:border-white/5 space-y-3"
        >
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] sm:grid-rows-[auto_auto] gap-x-3 gap-y-2 items-start">
                <label className="sm:col-start-1 sm:row-start-1 text-[9px] font-bold uppercase tracking-widest text-brand-deep/30 dark:text-brand-cream/30 ml-1">
                    Type
                </label>
                <div className="sm:col-start-1 sm:row-start-2 space-y-2">
                    <Select
                        value={isCustom ? "__custom__" : option.name}
                        onValueChange={(value) => onRename(value === "__custom__" ? "" : value)}
                    >
                        <SelectTrigger className="h-12 rounded-xl bg-brand-deep/2 dark:bg-white/2 border-brand-deep/5 dark:border-white/5 text-sm">
                            <SelectValue placeholder="Choose..." />
                        </SelectTrigger>
                        <SelectContent>
                            {META_OPTION_NAMES.filter(
                                (name) => name === option.name || !disallowedSet.has(name),
                            ).map((name) => (
                                <SelectItem key={name} value={name}>
                                    {name}
                                </SelectItem>
                            ))}
                            <SelectItem value="__custom__">Custom...</SelectItem>
                        </SelectContent>
                    </Select>
                    {isCustom && (
                        <input
                            placeholder="e.g. Flavor"
                            value={option.name}
                            onChange={(e) => onRename(e.target.value)}
                            className="text-sm w-full h-10 px-3 rounded-xl bg-brand-deep/2 dark:bg-white/2 border border-brand-deep/5 dark:border-white/5 focus:outline-none focus:ring-1 focus:ring-brand-gold/20"
                        />
                    )}
                </div>
                <label className="sm:col-start-2 sm:row-start-1 text-[9px] font-bold uppercase tracking-widest text-brand-deep/30 dark:text-brand-cream/30 ml-1">
                    Values (comma-separated)
                </label>
                <input
                    placeholder={placeholderForOption(option.name)}
                    value={valuesText}
                    onChange={(e) => {
                        const nextText = e.target.value
                        setValuesText(nextText)
                        onSetValues(parseOptionValuesText(nextText))
                    }}
                    onBlur={() => {
                        // Tidy whitespace on blur (collapse "Red,  ,Blue " → "Red, Blue").
                        const parsed = parseOptionValuesText(valuesText)
                        const tidy = parsed.join(", ")
                        if (tidy !== valuesText) setValuesText(tidy)
                    }}
                    className="sm:col-start-2 sm:row-start-2 text-sm w-full h-12 px-4 rounded-xl bg-brand-deep/2 dark:bg-white/2 border border-brand-deep/5 dark:border-white/5 focus:outline-none focus:ring-1 focus:ring-brand-gold/20 transition-all"
                />
                <button
                    type="button"
                    onClick={onRemove}
                    className="sm:col-start-3 sm:row-start-2 h-12 w-full sm:w-12 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 flex items-center justify-center transition-all"
                    aria-label="Remove option"
                >
                    <HugeiconsIcon icon={Trash2} className="w-4 h-4" />
                </button>
            </div>
        </GlassCard>
    )
})

// ----------------------------- StoreStockInputs -----------------------------

function StoreStockInputs({
    storeIds,
    stocks,
    onChange,
}: {
    storeIds: string[]
    stocks: FormStoreInventoryLine[]
    onChange: (stocks: FormStoreInventoryLine[]) => void
}) {
    const { stores } = useStores()
    const selectedStores = stores.filter((s) => storeIds.includes(s.id))

    if (selectedStores.length <= 1) return null

    return (
        <div className="space-y-4 p-4 rounded-2xl bg-brand-deep/2 dark:bg-white/2 border border-brand-deep/5 dark:border-white/5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40 px-1">
                Stock per Store
            </label>
            <div className="grid grid-cols-1 gap-3">
                {selectedStores.map((store) => {
                    const found = stocks.find((s) => s.storeId === store.id)
                    const currentStock = found?.stockQuantity ?? 0
                    return (
                        <div key={store.id} className="flex items-center justify-between gap-4">
                            <span className="text-xs font-medium text-brand-deep/60 dark:text-brand-cream/60 truncate max-w-[150px]">
                                {store.name}
                            </span>
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={currentStock}
                                onChange={(e) => {
                                    const rawValue = e.target.value.replace(/[^0-9]/g, "")
                                    const val = rawValue === "" ? 0 : parseInt(rawValue)
                                    const exists = stocks.some((s) => s.storeId === store.id)
                                    const newStocks = exists
                                        ? stocks.map((s) =>
                                            s.storeId === store.id ? { ...s, stockQuantity: val } : s,
                                        )
                                        : [...stocks, { storeId: store.id, stockQuantity: val }]
                                    onChange(newStocks)
                                }}
                                className="w-24 px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-brand-green/20"
                            />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ----------------------------- Props ---------------------------------------

export interface VariantsAndOptionsSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void

    productOptions: FormProductOption[]
    variants: FormVariantRow[]

    /** Stores currently picked for the product — used to drive per-store stock rows. */
    storeIds: string[]
    /** Base product price; new variants inherit this. */
    productBasePrice: string

    currencySymbol: string
    currencyCode: string

    barcodeFormat: BarcodeFormat
    autoGenerateBarcode: (id: string, format: BarcodeFormat) => string

    onChange: (next: { productOptions: FormProductOption[]; variants: FormVariantRow[] }) => void
}

// ----------------------------- Variant editor ------------------------------

interface VariantEditorProps {
    variant: FormVariantRow
    index: number
    productOptions: FormProductOption[]
    storeIds: string[]
    currencySymbol: string
    expanded: boolean
    canDelete: boolean
    barcodeFormat: BarcodeFormat
    autoGenerateBarcode: (id: string, format: BarcodeFormat) => string
    onToggleExpand: () => void
    onRemove: () => void
    onChange: (next: FormVariantRow) => void
    headerOverride?: string
}

const VariantEditor = React.memo(function VariantEditor({
    variant,
    index,
    productOptions,
    storeIds,
    currencySymbol,
    expanded,
    canDelete,
    barcodeFormat,
    autoGenerateBarcode,
    onToggleExpand,
    onRemove,
    onChange,
    headerOverride,
}: VariantEditorProps) {
    const derivedDisplayName =
        headerOverride ||
        variantDisplayNameFromOptions(variant.optionValues) ||
        variant.name ||
        `Variant ${index + 1}`

    const stockFromStores = (variant.storeInventory || [])
        .filter((s) => storeIds.length === 0 || storeIds.includes(s.storeId))
        .reduce((sum, s) => sum + (Number(s.stockQuantity) || 0), 0)
    const totalStock = stockFromStores || variant.stockQuantity || 0

    const summaryParts: string[] = []
    if (variant.sku) summaryParts.push(variant.sku)
    if (variant.price) summaryParts.push(`${currencySymbol}${variant.price}`)
    summaryParts.push(`${totalStock} in stock`)

    const handleAxisChange = (axisName: string, nextValue: string) => {
        const existingIdx = variant.optionValues.findIndex((ov) => ov.name === axisName)
        const optionValues = [...variant.optionValues]
        if (existingIdx >= 0) {
            optionValues[existingIdx] = { name: axisName, value: nextValue }
        } else {
            optionValues.push({ name: axisName, value: nextValue })
        }
        // Derive variant.name from option values, but only if it isn't a
        // user-typed custom string already (we keep manual names if user
        // bypassed options entirely — handled in `useGroups === false` branch).
        const derivedName = variantDisplayNameFromOptions(optionValues)
        onChange({
            ...variant,
            optionValues,
            name: derivedName || variant.name,
        })
    }

    const updateField = <K extends keyof FormVariantRow>(key: K, value: FormVariantRow[K]) => {
        onChange({ ...variant, [key]: value })
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="relative"
        >
            <GlassCard
                allowOverflow
                className="bg-white dark:bg-white/5 border-brand-deep/5 dark:border-white/5 transition-all hover:border-brand-gold/20"
            >
                <div className="flex items-center gap-3 p-4">
                    <button
                        type="button"
                        onClick={onToggleExpand}
                        className="flex-1 flex items-center justify-between gap-3 text-left cursor-pointer min-w-0"
                    >
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium text-brand-deep dark:text-brand-cream truncate">
                                {derivedDisplayName}
                            </span>
                            <span className="text-[10px] text-brand-deep/40 dark:text-brand-cream/40 uppercase tracking-widest font-bold truncate">
                                {summaryParts.join(" • ")}
                            </span>
                        </div>
                        <HugeiconsIcon icon={ChevronDown}
                            className={cn(
                                "w-4 h-4 text-brand-deep/40 dark:text-brand-cream/40 transition-transform shrink-0",
                                expanded && "rotate-180",
                            )}
                        />
                    </button>
                    {canDelete && (
                        <button
                            type="button"
                            onClick={onRemove}
                            className="w-8 h-8 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 flex items-center justify-center transition-all shrink-0"
                            aria-label="Remove variant"
                        >
                            <HugeiconsIcon icon={Trash2} className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                <AnimatePresence initial={false}>
                    {expanded && (
                        <motion.div
                            key="body"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.18 }}
                            className="overflow-hidden"
                        >
                            <div className="px-4 pb-5 pt-1 space-y-5 border-t border-brand-deep/5 dark:border-white/5">
                                {productOptions.length > 0 ? (
                                    <div className="space-y-3 pt-4">
                                        <div className="text-[9px] font-bold uppercase tracking-widest text-brand-deep/30 dark:text-brand-cream/30 ml-1">
                                            Axis values
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {productOptions.map((opt, optIdx) => {
                                                const current = getVariantOptionValue(variant, opt.name)
                                                const datalistId = `option-suggestions-${variant._key}-${optIdx}`
                                                return (
                                                    <div key={`${optIdx}-${opt.name}`} className="space-y-2">
                                                        <label className="text-[9px] font-bold uppercase tracking-widest text-brand-deep/30 dark:text-brand-cream/30 ml-1">
                                                            {opt.name || "Untitled axis"}
                                                        </label>
                                                        <input
                                                            list={datalistId}
                                                            placeholder={
                                                                opt.values[0] ||
                                                                `e.g. ${singleValuePlaceholderForOption(opt.name)}`
                                                            }
                                                            value={current}
                                                            onChange={(e) => handleAxisChange(opt.name, e.target.value)}
                                                            className="text-sm w-full h-12 px-4 rounded-xl bg-brand-deep/2 dark:bg-white/2 border border-brand-deep/5 dark:border-white/5 focus:outline-none focus:ring-1 focus:ring-brand-gold/20 transition-all"
                                                        />
                                                        {opt.values.length > 0 && (
                                                            <datalist id={datalistId}>
                                                                {opt.values.map((v) => (
                                                                    <option key={v} value={v} />
                                                                ))}
                                                            </datalist>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2 pt-4">
                                        <label className="text-[9px] font-bold uppercase tracking-widest text-brand-deep/30 dark:text-brand-cream/30 ml-1">
                                            Variant Name
                                        </label>
                                        <input
                                            placeholder="e.g. Extra Large"
                                            value={variant.name}
                                            onChange={(e) => updateField("name", e.target.value)}
                                            className="text-sm w-full h-12 px-4 rounded-xl bg-brand-deep/2 dark:bg-white/2 border border-brand-deep/5 dark:border-white/5 focus:outline-none focus:ring-1 focus:ring-brand-gold/20 transition-all"
                                        />
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold uppercase tracking-widest text-brand-deep/30 dark:text-brand-cream/30 ml-1">
                                            SKU (Optional)
                                        </label>
                                        <input
                                            placeholder="V-SKU-001"
                                            value={variant.sku}
                                            onChange={(e) => updateField("sku", e.target.value)}
                                            className="text-xs w-full h-12 px-4 rounded-xl bg-brand-deep/2 dark:bg-white/2 border border-brand-deep/5 dark:border-white/5 focus:outline-none focus:ring-1 focus:ring-brand-gold/20 font-mono transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between ml-1">
                                            <label className="text-[9px] font-bold uppercase tracking-widest text-brand-deep/30 dark:text-brand-cream/30">
                                                Barcode (Optional)
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const fallbackId =
                                                        variant.id || Math.random().toString(36).substring(7)
                                                    updateField(
                                                        "barcode",
                                                        autoGenerateBarcode(fallbackId, barcodeFormat),
                                                    )
                                                }}
                                                className="text-[9px] font-bold text-brand-gold hover:text-brand-gold/80 transition-colors flex items-center gap-1"
                                            >
                                                <HugeiconsIcon icon={Sparkles} className="w-3 h-3" />
                                                Auto-Generate
                                            </button>
                                        </div>
                                        <input
                                            placeholder="Variant Barcode"
                                            value={variant.barcode || ""}
                                            onChange={(e) => updateField("barcode", e.target.value)}
                                            className="text-xs w-full h-12 px-4 rounded-xl bg-brand-deep/2 dark:bg-white/2 border border-brand-deep/5 dark:border-white/5 focus:outline-none focus:ring-1 focus:ring-brand-gold/20 font-mono transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold uppercase tracking-widest text-brand-deep/30 dark:text-brand-cream/30 ml-1">
                                            Stock Level
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                placeholder="0"
                                                readOnly={storeIds.length > 1}
                                                value={(() => {
                                                    if (storeIds.length > 1) {
                                                        return (variant.storeInventory || [])
                                                            .filter((s) => storeIds.includes(s.storeId))
                                                            .reduce(
                                                                (sum, s) => sum + (Number(s.stockQuantity) || 0),
                                                                0,
                                                            )
                                                    }
                                                    return variant.stockQuantity || 0
                                                })()}
                                                onChange={(e) => {
                                                    const rawValue = e.target.value.replace(/[^0-9]/g, "")
                                                    const val = rawValue === "" ? 0 : parseInt(rawValue)
                                                    const next: FormVariantRow = { ...variant, stockQuantity: val }
                                                    if (storeIds.length === 1) {
                                                        const storeId = storeIds[0]
                                                        const inv = [...(next.storeInventory || [])]
                                                        const sIdx = inv.findIndex((s) => s.storeId === storeId)
                                                        if (sIdx > -1) {
                                                            inv[sIdx] = { ...inv[sIdx], stockQuantity: val }
                                                        } else {
                                                            inv.push({ storeId, stockQuantity: val })
                                                        }
                                                        next.storeInventory = inv
                                                    }
                                                    onChange(next)
                                                }}
                                                className={cn(
                                                    "text-sm w-full h-12 px-4 rounded-xl bg-brand-deep/2 dark:bg-white/2 border border-brand-deep/5 dark:border-white/5 focus:outline-none focus:ring-1 focus:ring-brand-gold/20 transition-all font-bold",
                                                    storeIds.length > 1 &&
                                                    "bg-brand-deep/5 dark:bg-white/5 cursor-not-allowed text-brand-deep/40 dark:text-brand-cream/40",
                                                )}
                                            />
                                            {storeIds.length > 1 && (
                                                <div
                                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                                    title="Calculated from stores"
                                                >
                                                    <HugeiconsIcon icon={Loader2} className="w-3 h-3 text-brand-gold" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold uppercase tracking-widest text-brand-deep/30 dark:text-brand-cream/30 ml-1">
                                            Variant Price
                                        </label>
                                        <MoneyInput
                                            currencySymbol={currencySymbol}
                                            className="h-12 text-sm"
                                            value={variant.price}
                                            onChange={(val) => updateField("price", val?.toString() || "")}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <StoreStockInputs
                                    storeIds={storeIds}
                                    stocks={variant.storeInventory || []}
                                    onChange={(stocks) => {
                                        const normalized: FormStoreInventoryLine[] = stocks.map((s) => ({
                                            storeId: s.storeId,
                                            stockQuantity: Number(s.stockQuantity) || 0,
                                        }))
                                        const total = normalized
                                            .filter((s) => storeIds.includes(s.storeId))
                                            .reduce((sum, s) => sum + s.stockQuantity, 0)
                                        onChange({
                                            ...variant,
                                            storeInventory: normalized,
                                            stockQuantity: total,
                                        })
                                    }}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </GlassCard>
        </motion.div>
    )
})

// ----------------------------- Main sheet ----------------------------------

export function VariantsAndOptionsSheet({
    open,
    onOpenChange,
    productOptions,
    variants,
    storeIds,
    productBasePrice,
    currencySymbol,
    currencyCode,
    barcodeFormat,
    autoGenerateBarcode,
    onChange,
}: VariantsAndOptionsSheetProps) {
    const [expandedVariantKeys, setExpandedVariantKeys] = React.useState<Set<string>>(new Set())

    // When the sheet opens, expand the single variant if there is just one.
    // Keyed on `open` so editing keystrokes don't reshape expansion.
    React.useEffect(() => {
        if (!open) return
        if (variants.length === 1) {
            setExpandedVariantKeys(new Set([variants[0]._key]))
        } else {
            setExpandedVariantKeys(new Set())
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    const toggleVariantExpansion = React.useCallback((key: string) => {
        setExpandedVariantKeys((prev) => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }, [])

    // ---- option helpers (operate via parent onChange) ----

    const updateOptions = (
        nextOptions: FormProductOption[],
        variantTransform?: (v: FormVariantRow) => FormVariantRow,
    ) => {
        onChange({
            productOptions: nextOptions,
            variants: variantTransform ? variants.map(variantTransform) : variants,
        })
    }

    const updateVariants = (nextVariants: FormVariantRow[]) => {
        onChange({ productOptions, variants: nextVariants })
    }

    const handleAddOption = () => {
        const used = new Set(productOptions.map((o) => o.name))
        // Empty name (custom) when every meta type is already taken — avoids
        // creating a duplicate key like "Color".
        const next = (META_OPTION_NAMES as readonly string[]).find((n) => !used.has(n)) ?? ""
        const newOption: FormProductOption = {
            name: next,
            position: productOptions.length + 1,
            values: [],
        }
        updateOptions([...productOptions, newOption], (v) => ({
            ...v,
            optionValues:
                next && !v.optionValues.some((ov) => ov.name === next)
                    ? [...v.optionValues, { name: next, value: "" }]
                    : v.optionValues,
        }))
    }

    const handleRenameOption = (oIdx: number, nextName: string) => {
        const previousName = productOptions[oIdx]?.name || ""
        const nextOptions = [...productOptions]
        nextOptions[oIdx] = { ...nextOptions[oIdx], name: nextName }
        updateOptions(nextOptions, (v) => ({
            ...v,
            optionValues: v.optionValues.map((ov) =>
                ov.name === previousName ? { ...ov, name: nextName } : ov,
            ),
        }))
    }

    const handleSetOptionValues = (oIdx: number, values: string[]) => {
        const nextOptions = [...productOptions]
        nextOptions[oIdx] = { ...nextOptions[oIdx], values }
        updateOptions(nextOptions)
    }

    const handleRemoveOption = (oIdx: number) => {
        const removed = productOptions[oIdx]?.name
        const nextOptions = productOptions
            .filter((_, i) => i !== oIdx)
            .map((o, i) => ({ ...o, position: i + 1 }))
        updateOptions(nextOptions, (v) => ({
            ...v,
            optionValues: v.optionValues.filter((ov) => ov.name !== removed),
        }))
    }

    const handleAddVariant = (presetOptionValues?: FormVariantOptionValue[]) => {
        const newKey = newVariantKey()
        const optionValues =
            presetOptionValues ??
            productOptions.map((opt) => ({ name: opt.name, value: "" }))
        const newVariant: FormVariantRow = {
            _key: newKey,
            name: variantDisplayNameFromOptions(optionValues) || "",
            sku: "",
            barcode: "",
            price: productBasePrice,
            stockQuantity: 0,
            storeInventory: [],
            optionValues,
        }
        updateVariants([...variants, newVariant])
        setExpandedVariantKeys((prev) => {
            const next = new Set(prev)
            next.add(newKey)
            return next
        })
    }

    const handleRemoveVariant = (index: number) => {
        const removed = variants[index]
        const newVariants = [...variants]
        newVariants.splice(index, 1)
        updateVariants(newVariants)
        if (removed?._key) {
            setExpandedVariantKeys((prev) => {
                if (!prev.has(removed._key)) return prev
                const next = new Set(prev)
                next.delete(removed._key)
                return next
            })
        }
    }

    const handleVariantChange = (index: number, next: FormVariantRow) => {
        const newVariants = [...variants]
        newVariants[index] = next
        updateVariants(newVariants)
    }

    // We deliberately don't group variants into per-axis accordions. Each
    // variant is one row in the database (one SKU), so it makes sense to
    // render it once. Its axis values (Color, Size, …) are shown in the card
    // title (e.g. "Red / Small") and edited inside its expanded body.
    //
    // We sort the list so it reads predictably:
    //   1) by each declared option, in declared value order,
    //   2) ad-hoc / unassigned values last.

    const sortedVariantsWithIndex = React.useMemo(() => {
        const withIndex = variants.map((variant, index) => ({ variant, index }))
        if (productOptions.length === 0) return withIndex

        const valueOrderByAxis = new Map<string, Map<string, number>>()
        for (const opt of productOptions) {
            const order = new Map<string, number>()
            opt.values.forEach((v, i) => order.set(v, i))
            valueOrderByAxis.set(opt.name, order)
        }

        return [...withIndex].sort((a, b) => {
            for (const opt of productOptions) {
                const av = getVariantOptionValue(a.variant, opt.name)
                const bv = getVariantOptionValue(b.variant, opt.name)
                const order = valueOrderByAxis.get(opt.name)!
                const ai = av && order.has(av) ? order.get(av)! : av ? Infinity - 1 : Infinity
                const bi = bv && order.has(bv) ? order.get(bv)! : bv ? Infinity - 1 : Infinity
                if (ai !== bi) return ai - bi
                if (av !== bv) return av.localeCompare(bv)
            }
            return a.index - b.index
        })
    }, [productOptions, variants])

    const totalVariants = variants.length

    return (
        <SideSheet open={open} onOpenChange={onOpenChange}>
            <SideSheetContent>
                <SideSheetStickyHeader>
                    <SideSheetTitle>Variants & options</SideSheetTitle>
                    <SideSheetDescription>
                        Define axes like Color or Size, then add a variant for each combination so customers can pick the
                        exact one they want.
                    </SideSheetDescription>
                </SideSheetStickyHeader>

                <SideSheetBody className="space-y-8">
                    {/* Quick summary chip row */}
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="default" className="gap-1.5">
                            <HugeiconsIcon icon={Layers} className="w-3 h-3" />
                            {productOptions.length} {productOptions.length === 1 ? "option" : "options"}
                        </Badge>
                        <Badge variant="default" className="gap-1.5">
                            <HugeiconsIcon icon={Boxes} className="w-3 h-3" />
                            {totalVariants} {totalVariants === 1 ? "variant" : "variants"}
                        </Badge>
                    </div>

                    {/* --------- Options section --------- */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-deep/40 dark:text-brand-cream/40">
                                    <HugeiconsIcon icon={ListTree} className="w-3 h-3" />
                                    Options
                                </h3>
                                <p className="text-[10px] text-brand-deep/40 dark:text-brand-cream/40 mt-1 max-w-md">
                                    Axes that vary across the product (max {MAX_PRODUCT_OPTIONS}). Leave empty for a single-SKU product.
                                </p>
                            </div>
                            {productOptions.length < MAX_PRODUCT_OPTIONS && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={handleAddOption}
                                    className="text-[10px] h-8 font-bold uppercase tracking-widest text-brand-gold hover:bg-brand-gold/5 px-4 rounded-full transition-all"
                                >
                                    <HugeiconsIcon icon={Plus} className="w-3.5 h-3.5 mr-1" />
                                    Add option
                                </Button>
                            )}
                        </div>

                        {productOptions.length === 0 ? (
                            <GlassCard className="p-5 bg-white dark:bg-white/5 border-dashed border-brand-deep/10 dark:border-white/10 text-center">
                                <p className="text-xs text-brand-deep/50 dark:text-brand-cream/50">
                                    No options yet. Add one to model things like Color or Size.
                                </p>
                            </GlassCard>
                        ) : (
                            <div className="space-y-3">
                                {productOptions.map((opt, oIdx) => (
                                    <OptionRow
                                        key={`option-${oIdx}`}
                                        option={opt}
                                        disallowedNames={productOptions
                                            .filter((_, i) => i !== oIdx)
                                            .map((o) => o.name)
                                            .filter(Boolean)}
                                        onRename={(nextName) => handleRenameOption(oIdx, nextName)}
                                        onSetValues={(values) => handleSetOptionValues(oIdx, values)}
                                        onRemove={() => handleRemoveOption(oIdx)}
                                    />
                                ))}
                            </div>
                        )}
                    </section>

                    {/* --------- Variants section --------- */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-deep/40 dark:text-brand-cream/40">
                                    <HugeiconsIcon icon={Tag} className="w-3 h-3" />
                                    Variants
                                </h3>
                                <p className="text-[10px] text-brand-deep/40 dark:text-brand-cream/40 mt-1 max-w-md">
                                    Each variant is one SKU. Tap a card to edit its details.
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => handleAddVariant()}
                                className="text-[10px] h-8 font-bold uppercase tracking-widest text-brand-gold hover:bg-brand-gold/5 px-4 rounded-full transition-all"
                            >
                                <HugeiconsIcon icon={Plus} className="w-3.5 h-3.5 mr-1" />
                                Add variant
                            </Button>
                        </div>

                        {totalVariants === 0 ? (
                            <GlassCard className="p-5 bg-white dark:bg-white/5 border-dashed border-brand-deep/10 dark:border-white/10 text-center">
                                <p className="text-xs text-brand-deep/50 dark:text-brand-cream/50">
                                    No variants yet. Click <span className="font-semibold">Add variant</span> to create one.
                                </p>
                            </GlassCard>
                        ) : (
                            <div className="space-y-3">
                                <AnimatePresence mode="popLayout">
                                    {sortedVariantsWithIndex.map(({ variant, index }) => (
                                        <VariantEditor
                                            key={variant._key}
                                            variant={variant}
                                            index={index}
                                            productOptions={productOptions}
                                            storeIds={storeIds}
                                            currencySymbol={currencySymbol}
                                            expanded={expandedVariantKeys.has(variant._key)}
                                            canDelete={variants.length > 1}
                                            barcodeFormat={barcodeFormat}
                                            autoGenerateBarcode={autoGenerateBarcode}
                                            onToggleExpand={() => toggleVariantExpansion(variant._key)}
                                            onRemove={() => handleRemoveVariant(index)}
                                            onChange={(next) => handleVariantChange(index, next)}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </section>

                    {/* Inventory total summary */}
                    {totalVariants > 0 && (() => {
                        const totalValue = variants.reduce((sum, v) => {
                            const price = parseFloat(v.price || "0") || 0
                            const stock =
                                (v.storeInventory || [])
                                    .filter((s) => storeIds.length === 0 || storeIds.includes(s.storeId))
                                    .reduce((s, x) => s + (Number(x.stockQuantity) || 0), 0) ||
                                v.stockQuantity ||
                                0
                            return sum + price * stock
                        }, 0)
                        const totalStock = variants.reduce((sum, v) => {
                            const stock =
                                (v.storeInventory || [])
                                    .filter((s) => storeIds.length === 0 || storeIds.includes(s.storeId))
                                    .reduce((s, x) => s + (Number(x.stockQuantity) || 0), 0) ||
                                v.stockQuantity ||
                                0
                            return sum + stock
                        }, 0)
                        return (
                            <div className="rounded-2xl border border-brand-deep/10 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm px-5 py-4 flex items-center justify-between gap-4 [text-decoration:none]">
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40">
                                        Inventory value
                                    </span>
                                    <span className="text-[11px] text-brand-deep/50 dark:text-brand-cream/50 mt-0.5">
                                        {totalVariants} {totalVariants === 1 ? "variant" : "variants"}
                                        {" · "}
                                        {totalStock} in stock
                                    </span>
                                </div>
                                <span className="font-serif text-2xl font-medium text-brand-deep dark:text-brand-cream tabular-nums whitespace-nowrap [text-decoration:none]">
                                    {formatCurrency(totalValue, { currency: currencyCode })}
                                </span>
                            </div>
                        )
                    })()}
                </SideSheetBody>

                <SideSheetFooter>
                    <div className="flex gap-3">
                        <SideSheetClose asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                className="flex-1 rounded-2xl h-12 uppercase tracking-widest text-[10px] font-bold text-brand-deep/40 dark:text-brand-cream/40 hover:bg-brand-deep/5 dark:hover:bg-white/5 transition-all"
                            >
                                Cancel
                            </Button>
                        </SideSheetClose>
                        <SideSheetClose asChild>
                            <Button
                                type="button"
                                className="flex-1 rounded-2xl h-12 bg-brand-deep text-brand-gold dark:bg-brand-gold-700 dark:hover:bg-brand-gold-800 dark:text-brand-deep font-bold shadow-xl uppercase tracking-widest text-xs"
                            >
                                Done
                            </Button>
                        </SideSheetClose>
                    </div>
                </SideSheetFooter>
            </SideSheetContent>
        </SideSheet>
    )
}
