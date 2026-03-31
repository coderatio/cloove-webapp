"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Barcode,
    Printer,
    Minus,
    Plus,
    Check,
    ChevronDown,
    Layers,
    Tag,
    Maximize2,
    ExternalLink,
    AlertTriangle,
} from "lucide-react"
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerBody,
    DrawerFooter,
} from "@/app/components/ui/drawer"
import { Button } from "@/app/components/ui/button"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Label } from "@/app/components/ui/label"
import { Badge } from "@/app/components/ui/badge"
import { Switch } from "@/app/components/ui/switch"
import { cn } from "@/app/lib/utils"
import { useBarcodeGenerator, type BarcodeFormat, type LabelData } from "../hooks/useBarcodeGenerator"
import { useInventory } from "../hooks/useInventory"
import { useBusiness } from "@/app/components/BusinessProvider"
import { toast } from "sonner"
import { formatCurrency } from "@/app/lib/formatters"
import { CurrencyText } from "@/app/components/shared/CurrencyText"
import type { InventoryItem, ProductVariant } from "../types"
import { RefreshCcw, Save } from "lucide-react"

// ── Template Definitions ─────────────────────────────────────────────────

type LabelTemplate = 'standard' | 'compact' | 'full'

const TEMPLATES: Record<LabelTemplate, {
    label: string
    description: string
    icon: React.ReactNode
    widthMM: number
    heightMM: number
}> = {
    standard: {
        label: 'Standard',
        description: '2" × 1" — Shelf & retail labels',
        icon: <Tag className="w-4 h-4" />,
        widthMM: 50.8,
        heightMM: 25.4,
    },
    compact: {
        label: 'Compact',
        description: '1.5" × 0.75" — High-density tags',
        icon: <Barcode className="w-4 h-4" />,
        widthMM: 38.1,
        heightMM: 19.05,
    },
    full: {
        label: 'Full',
        description: '3" × 2" — Premium product tags',
        icon: <Maximize2 className="w-4 h-4" />,
        widthMM: 76.2,
        heightMM: 50.8,
    },
}

const FORMAT_OPTIONS: { label: string; value: BarcodeFormat; description: string }[] = [
    { label: 'CODE128', value: 'CODE128', description: 'Alphanumeric — universal' },
    { label: 'EAN-13', value: 'EAN13', description: 'Retail — 13-digit' },
    { label: 'CODE39', value: 'CODE39', description: 'Industrial — alphanumeric' },
]

// ── Props ────────────────────────────────────────────────────────────────

interface LabelPreviewDrawerProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    products: InventoryItem[]
    mode: 'single' | 'bulk'
}

// ── Component ────────────────────────────────────────────────────────────

export function LabelPreviewDrawer({
    isOpen,
    onOpenChange,
    products,
    mode,
}: LabelPreviewDrawerProps) {
    const { renderBarcode, buildLabelData, validateBarcode, autoGenerateBarcode } = useBarcodeGenerator()
    const { updateProduct } = useInventory()
    const { activeBusiness } = useBusiness()
    const currencyCode = activeBusiness?.currency || 'NGN'
    const businessName = activeBusiness?.name || 'Business'
    const [isSyncing, setIsSyncing] = React.useState(false)

    const [template, setTemplate] = React.useState<LabelTemplate>('standard')
    const [barcodeFormat, setBarcodeFormat] = React.useState<BarcodeFormat>('CODE128')
    const [showFormatPicker, setShowFormatPicker] = React.useState(false)
    const [quantities, setQuantities] = React.useState<Record<string, number>>({})
    const [isSimplified, setIsSimplified] = React.useState(false)

    // Per-variant selection state (variant id → boolean)
    const [selectedVariants, setSelectedVariants] = React.useState<Record<string, boolean>>({})

    // Build labels from products
    const allLabels = React.useMemo(() => {
        const labels: (LabelData & { _key: string; productId: string; variantId?: string })[] = []
        products.forEach(product => {
            const raw = product.raw
            const variants = raw?.variants || raw?.product_variants || []

            if (variants.length === 0) {
                const barcode = raw?.barcode || autoGenerateBarcode(product.id, barcodeFormat)
                labels.push({
                    productName: product.product,
                    variantName: null,
                    sku: raw?.sku || null,
                    barcode,
                    price: formatCurrency(product.price, { currency: currencyCode }),
                    businessName,
                    quantity: 1,
                    _key: `${product.id}-base`,
                    productId: product.id
                })
            } else {
                variants.forEach((v: any) => {
                    const barcode = v.barcode || autoGenerateBarcode(v.id, barcodeFormat)
                    labels.push({
                        productName: product.product,
                        variantName: v.name || 'Standard',
                        sku: v.sku || null,
                        barcode,
                        price: formatCurrency(v.price || product.price, { currency: currencyCode }),
                        businessName,
                        quantity: 1,
                        _key: `${product.id}-${v.id}`,
                        productId: product.id,
                        variantId: v.id
                    })
                })
            }
        })
        return labels
    }, [products, autoGenerateBarcode, barcodeFormat, currencyCode, businessName])

    // Initialize selection & quantities only when the specific product set changes
    const productIdsHash = React.useMemo(() => products.map(p => p.id).join(','), [products])
    
    React.useEffect(() => {
        const initSelected: Record<string, boolean> = {}
        const initQty: Record<string, number> = {}
        allLabels.forEach(l => {
            initSelected[l._key] = true
            initQty[l._key] = 1
        })
        setSelectedVariants(initSelected)
        setQuantities(initQty)
    }, [productIdsHash]) // Only reset if the actual selected products in the table change

    const activeLabelKeys = React.useMemo(
        () => allLabels.filter(l => selectedVariants[l._key]).map(l => l._key),
        [allLabels, selectedVariants]
    )

    const totalLabels = activeLabelKeys.reduce((sum, key) => sum + (quantities[key] || 1), 0)

    const updateQuantity = (key: string, delta: number) => {
        setQuantities(prev => ({
            ...prev,
            [key]: Math.max(1, (prev[key] || 1) + delta),
        }))
    }

    const toggleVariant = (key: string) => {
        setSelectedVariants(prev => ({
            ...prev,
            [key]: !prev[key],
        }))
    }

    // ── Print Logic ──────────────────────────────────────────────────────

    const handlePrint = React.useCallback(() => {
        const selectedLabels = allLabels.filter(l => selectedVariants[l._key])
        if (selectedLabels.length === 0) return

        const tmpl = TEMPLATES[template]

        // Build label HTML items
        const labelItems: string[] = []
        selectedLabels.forEach(label => {
            const qty = quantities[label._key] || 1
            const barcodeDataUrl = renderBarcode(label.barcode, barcodeFormat, {
                width: template === 'compact' ? 1.0 : 1.5,
                height: template === 'compact' ? 25 : template === 'full' ? 45 : 35,
                displayValue: true,
                margin: 0,
            })

            const labelBody = `
                <div class="label-inner">
                    ${!isSimplified || template === 'full' ? `
                        <div class="product-info">
                            ${template === 'full' ? `<div class="biz-name">${escapeHtml(label.businessName)}</div>` : ''}
                            <div class="prod-title">${escapeHtml(label.productName)}</div>
                            <div class="prod-subtitle">${label.variantName ? escapeHtml(label.variantName) : ''} ${template === 'full' && label.sku ? `• ${escapeHtml(label.sku)}` : ''}</div>
                        </div>
                    ` : ''}
                    
                    <div class="barcode-wrap">
                        ${barcodeDataUrl ? `<img src="${barcodeDataUrl}" class="barcode-img ${template}-barcode" />` : `<div class="barcode-fallback">${escapeHtml(label.barcode)}</div>`}
                    </div>
                    
                    <div class="price-wrap">
                        <div class="price-val">${escapeHtml(label.price)}</div>
                    </div>
                </div>
            `

            for (let i = 0; i < qty; i++) {
                labelItems.push(`<div class="label ${template}">${labelBody}</div>`)
            }
        })

        // Assemble print HTML
        const printHtml = `<!DOCTYPE html>
<html>
<head>
<style>
    @page { margin: 0; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    html, body { margin: 0; padding: 0; background: #fff; }
    body {
        font-family: -apple-system, BlinkMacSystemFont, "Syne", "Instrument Serif", system-ui, sans-serif;
        color: #000;
        display: flex;
        flex-wrap: wrap;
        gap: 0;
        align-content: flex-start;
    }
    .label {
        display: flex !important;
        width: ${tmpl.widthMM}mm;
        height: ${tmpl.heightMM}mm;
        padding: ${template === 'compact' ? '0.5mm' : '1.5mm'};
        break-inside: avoid;
        page-break-inside: avoid;
        overflow: hidden;
        border: 0.05mm solid #eee;
    }
    @media print { .label { border: none; } }
    
    .label-inner {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        text-align: center;
        border: 0.2mm solid #000; /* Outer border for "pro" look */
        padding: 0.5mm;
    }
    
    .product-info {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 0.2mm;
    }
    .biz-name {
        font-size: 3.5pt;
        font-weight: 800;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: #666;
    }
    .prod-title {
        font-size: ${template === 'full' ? '9pt' : template === 'compact' ? '5.5pt' : '7.5pt'};
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.02em;
        line-height: 1.1;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
    .prod-subtitle {
        font-size: ${template === 'compact' ? '4.5pt' : '5pt'};
        font-weight: 700;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.1em;
    }
    
    .barcode-wrap {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        padding: 0.5mm 0;
        border-top: 0.15mm solid #000;
        border-bottom: 0.15mm solid #000;
        margin: 0.5mm 0;
    }
    .barcode-img {
        max-width: 100%;
        max-height: 100%;
        height: auto;
        object-fit: contain;
    }
    .standard-barcode { max-height: 8mm; }
    .compact-barcode { max-height: 6mm; }
    .full-barcode { max-height: 14mm; }
    
    .price-wrap {
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .price-val {
        font-size: ${template === 'full' ? '14pt' : template === 'compact' ? '8pt' : '11pt'};
        font-weight: 900;
        letter-spacing: -0.02em;
        line-height: 1;
    }
    .sku {
        font-family: 'Courier New', monospace;
        font-size: 5pt;
        color: #888;
        letter-spacing: 0.05em;
        text-align: center;
    }
    .barcode-text {
        font-family: 'Courier New', monospace;
        font-size: 7pt;
        letter-spacing: 0.1em;
    }
</style>
</head>
<body>
    ${labelItems.join('\n')}
</body>
</html>`

        // Print using hidden iframe
        const iframe = document.createElement("iframe")
        iframe.style.position = "fixed"
        iframe.style.right = "0"
        iframe.style.bottom = "0"
        iframe.style.width = "0"
        iframe.style.height = "0"
        iframe.style.border = "0"
        document.body.appendChild(iframe)

        const iframeDoc = iframe.contentWindow?.document
        if (!iframeDoc) {
            document.body.removeChild(iframe)
            return
        }

        iframeDoc.open()
        iframeDoc.write(printHtml)
        iframeDoc.close()

        // Wait for images to load before printing
        const images = iframeDoc.querySelectorAll('img')
        const imagePromises = Array.from(images).map(img =>
            new Promise<void>((resolve) => {
                if (img.complete) resolve()
                else {
                    img.onload = () => resolve()
                    img.onerror = () => resolve()
                }
            })
        )

        Promise.all(imagePromises).then(() => {
            setTimeout(() => {
                iframe.contentWindow?.focus()
                iframe.contentWindow?.print()
                setTimeout(() => document.body.removeChild(iframe), 2000)
            }, 300)
        })
    }, [allLabels, selectedVariants, quantities, template, barcodeFormat, renderBarcode])

    // ── Persistence Logic ────────────────────────────────────────────────

    // Identify labels that have an auto-generated barcode not yet in DB
    const unsavedLabels = React.useMemo(() => {
        return allLabels.filter(label => {
            const product = products.find(p => p.id === label.productId)
            if (!product) return false

            // If it's a variant label
            if (label.variantId) {
                const variants = product.raw?.variants || product.raw?.product_variants || []
                const v = variants.find((v: any) => v.id === label.variantId)
                return !v?.barcode && label.barcode.startsWith('CLV-') || (v?.barcode !== label.barcode && label.barcode !== '')
            }

            // If it's a base product label
            return !product.raw?.barcode && label.barcode.startsWith('CLV-') || (product.raw?.barcode !== label.barcode && label.barcode !== '')
        })
    }, [allLabels, products])

    const handleSaveBarcodes = async () => {
        if (unsavedLabels.length === 0) return
        setIsSyncing(true)

        try {
            // Group by product
            const productsToUpdate: Record<string, { barcode?: string; variants?: any[] }> = {}

            unsavedLabels.forEach(label => {
                if (!productsToUpdate[label.productId]) {
                    const p = products.find(prod => prod.id === label.productId)
                    productsToUpdate[label.productId] = {
                        barcode: p?.raw?.barcode || '',
                        variants: (p?.raw?.variants || p?.raw?.product_variants || []).map((v: any) => ({
                            id: v.id,
                            name: v.name,
                            sku: v.sku,
                            barcode: v.barcode,
                            price: v.price?.toString()
                        }))
                    }
                }

                if (label.variantId) {
                    const variant = productsToUpdate[label.productId].variants?.find(v => v.id === label.variantId)
                    if (variant) variant.barcode = label.barcode
                } else {
                    productsToUpdate[label.productId].barcode = label.barcode
                }
            })

            // Run updates
            await Promise.all(Object.entries(productsToUpdate).map(([id, data]) =>
                updateProduct({ id, data })
            ))

            toast.success(`Successfully saved ${unsavedLabels.length} barcodes to database`)
        } catch (err) {
            console.error(err)
            toast.error("Failed to save some barcodes")
        } finally {
            setIsSyncing(false)
        }
    }

    // ── Render ────────────────────────────────────────────────────────────

    const singleProduct = products.length === 1 ? products[0] : null

    return (
        <Drawer open={isOpen} onOpenChange={onOpenChange}>
            <DrawerContent className="max-w-2xl h-[92vh]">
                <DrawerStickyHeader className="pb-6 px-4 sm:px-8">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center text-brand-gold shrink-0">
                            <Barcode className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <DrawerTitle className="text-2xl font-serif font-medium text-brand-deep dark:text-brand-cream leading-tight">
                                {mode === 'bulk' ? 'Bulk Label Print' : 'Product Labels'}
                            </DrawerTitle>
                            <DrawerDescription className="flex items-center gap-2 mt-1">
                                <Layers className="w-3 h-3" />
                                {singleProduct
                                    ? singleProduct.product
                                    : `${products.length} products selected`
                                }
                            </DrawerDescription>
                        </div>
                    </div>
                </DrawerStickyHeader>

                <DrawerBody className="p-0 overflow-y-auto bg-brand-cream/30 dark:bg-brand-deep/10">
                    <div className="py-8 px-4 sm:px-8 space-y-8">
                        {/* ── Template Selector ────────────────────────────── */}
                        <div className="space-y-4">
                            <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40">
                                <Tag className="w-3 h-3" />
                                Label Template
                            </h3>
                            <div className="grid grid-cols-3 gap-3">
                                {(Object.entries(TEMPLATES) as [LabelTemplate, typeof TEMPLATES[LabelTemplate]][]).map(([key, tmpl]) => (
                                    <motion.div
                                        key={key}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => setTemplate(key)}
                                    >
                                        <GlassCard
                                            className={cn(
                                                "p-4 cursor-pointer transition-all duration-300 border-2",
                                                template === key
                                                    ? "border-brand-gold ring-2 ring-brand-gold/10 bg-brand-gold/5 dark:bg-brand-gold/10"
                                                    : "border-transparent hover:border-brand-gold/20"
                                            )}
                                        >
                                            <div className="flex flex-col items-center text-center gap-2">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                                    template === key
                                                        ? "bg-brand-gold text-brand-deep"
                                                        : "bg-brand-deep/5 dark:bg-white/5 text-brand-deep/40 dark:text-brand-cream/40"
                                                )}>
                                                    {tmpl.icon}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-brand-deep dark:text-brand-cream">{tmpl.label}</p>
                                                    <p className="text-[9px] text-brand-deep/40 dark:text-brand-cream/40 mt-0.5 leading-tight">{tmpl.description}</p>
                                                </div>
                                            </div>
                                        </GlassCard>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* ── Label Density Toggle ────────────────────────── */}
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/5">
                            <div className="space-y-0.5">
                                <p className="text-sm font-medium text-brand-deep dark:text-brand-cream">Simplified View</p>
                                <p className="text-[10px] text-brand-deep/40 dark:text-brand-cream/40">Print only barcode and price on standard/compact</p>
                            </div>
                            <Switch checked={isSimplified} onCheckedChange={setIsSimplified} />
                        </div>

                        {/* ── Barcode Format ───────────────────────────────── */}
                        <div className="space-y-3">
                            <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40">
                                <Barcode className="w-3 h-3" />
                                Barcode Format
                            </h3>
                            <button
                                onClick={() => setShowFormatPicker(!showFormatPicker)}
                                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 hover:border-brand-gold/30 transition-all cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-brand-deep dark:text-brand-cream font-mono">
                                        {FORMAT_OPTIONS.find(f => f.value === barcodeFormat)?.label}
                                    </span>
                                    <span className="text-[10px] text-brand-deep/40 dark:text-brand-cream/40">
                                        {FORMAT_OPTIONS.find(f => f.value === barcodeFormat)?.description}
                                    </span>
                                </div>
                                <ChevronDown className={cn("w-4 h-4 text-brand-deep/30 dark:text-brand-cream/30 transition-transform", showFormatPicker && "rotate-180")} />
                            </button>
                            <AnimatePresence>
                                {showFormatPicker && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="grid gap-2 pt-2">
                                            {FORMAT_OPTIONS.map(opt => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => {
                                                        setBarcodeFormat(opt.value)
                                                        setShowFormatPicker(false)
                                                    }}
                                                    className={cn(
                                                        "flex items-center justify-between px-4 py-3 rounded-xl border transition-all cursor-pointer",
                                                        barcodeFormat === opt.value
                                                            ? "border-brand-gold bg-brand-gold/5 dark:bg-brand-gold/10"
                                                            : "border-brand-deep/5 dark:border-white/10 hover:border-brand-gold/20 bg-white dark:bg-white/5"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs font-bold font-mono text-brand-deep dark:text-brand-cream">{opt.label}</span>
                                                        <span className="text-[10px] text-brand-deep/40 dark:text-brand-cream/40">{opt.description}</span>
                                                    </div>
                                                    {opt.value === 'EAN13' && (
                                                        <span className="text-[9px] text-brand-gold/60 font-medium px-2 py-0.5 rounded-full bg-brand-gold/5 border border-brand-gold/10 ml-auto mr-2">
                                                            Numeric Only
                                                        </span>
                                                    )}
                                                    {barcodeFormat === opt.value && (
                                                        <Check className="w-4 h-4 text-brand-gold" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* ── Label Items ──────────────────────────────────── */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-deep/40 dark:text-brand-cream/40">
                                    <Layers className="w-3 h-3" />
                                    Label Items
                                </h3>
                                <Badge variant="default">
                                    {totalLabels} {totalLabels === 1 ? 'label' : 'labels'}
                                </Badge>
                            </div>

                            <div className="space-y-3">
                                <AnimatePresence>
                                    {allLabels.map(label => {
                                        const isSelected = selectedVariants[label._key]
                                        const qty = quantities[label._key] || 1

                                        return (
                                            <motion.div
                                                key={label._key}
                                                layout
                                                initial={{ opacity: 0, y: 12 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                            >
                                                <GlassCard className={cn(
                                                    "p-4 transition-all duration-300 border-2",
                                                    isSelected
                                                        ? "border-brand-gold/20"
                                                        : "border-transparent opacity-50"
                                                )}>
                                                    <div className="flex items-start gap-4">
                                                        {/* Selection checkbox */}
                                                        <button
                                                            onClick={() => toggleVariant(label._key)}
                                                            className={cn(
                                                                "w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer",
                                                                isSelected
                                                                    ? "bg-brand-gold border-brand-gold text-brand-deep"
                                                                    : "border-brand-deep/15 dark:border-white/15"
                                                            )}
                                                        >
                                                            {isSelected && <Check className="w-3.5 h-3.5" />}
                                                        </button>

                                                        {/* Label info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-medium text-brand-deep dark:text-brand-cream truncate">
                                                                    {label.productName}
                                                                </p>
                                                                {label.variantName && (
                                                                    <Badge variant="default" className="text-[9px] shrink-0">
                                                                        {label.variantName}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-3 mt-1">
                                                                <span className="text-xs font-mono text-brand-deep/40 dark:text-brand-cream/40">
                                                                    {label.barcode}
                                                                </span>
                                                                {label.sku && (
                                                                    <span className="text-[10px] text-brand-deep/30 dark:text-brand-cream/30">
                                                                        SKU: {label.sku}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm font-serif font-bold text-brand-deep dark:text-brand-gold mt-1">
                                                                <CurrencyText value={label.price} />
                                                            </p>

                                                            {/* Inline barcode preview */}
                                                            {isSelected && (
                                                                <BarcodePreview
                                                                    value={label.barcode}
                                                                    label={label}
                                                                    isSimplified={isSimplified}
                                                                    template={template}
                                                                    businessName={businessName}
                                                                    format={barcodeFormat}
                                                                    renderBarcode={renderBarcode}
                                                                    validateBarcode={validateBarcode}
                                                                    onSwitchFormat={setBarcodeFormat}
                                                                />
                                                            )}
                                                        </div>

                                                        {/* Quantity control */}
                                                        {isSelected && (
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <button
                                                                    onClick={() => updateQuantity(label._key, -1)}
                                                                    className="w-8 h-8 rounded-lg bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center hover:bg-brand-deep/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
                                                                >
                                                                    <Minus className="w-3.5 h-3.5 text-brand-deep/60 dark:text-brand-cream/60" />
                                                                </button>
                                                                <span className="w-8 text-center text-sm font-bold text-brand-deep dark:text-brand-cream">
                                                                    {qty}
                                                                </span>
                                                                <button
                                                                    onClick={() => updateQuantity(label._key, 1)}
                                                                    className="w-8 h-8 rounded-lg bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center hover:bg-brand-deep/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
                                                                >
                                                                    <Plus className="w-3.5 h-3.5 text-brand-deep/60 dark:text-brand-cream/60" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </GlassCard>
                                            </motion.div>
                                        )
                                    })}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </DrawerBody>

                <DrawerFooter className="bg-brand-cream/80 dark:bg-brand-deep-800 backdrop-blur-md pt-4">
                    <div className="max-w-xl mx-auto w-full space-y-3">
                        {unsavedLabels.length > 0 && (
                            <div className="flex items-center justify-between p-3 rounded-xl bg-brand-gold/10 border border-brand-gold/20">
                                <div className="flex items-center gap-2">
                                    <RefreshCcw className={cn("w-3.5 h-3.5 text-brand-gold", isSyncing && "animate-spin")} />
                                    <span className="text-[10px] font-bold text-brand-gold uppercase tracking-widest">
                                        {unsavedLabels.length} unsaved barcodes generated
                                    </span>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={handleSaveBarcodes}
                                    disabled={isSyncing}
                                    className="h-7 rounded-lg bg-brand-gold text-brand-deep hover:bg-brand-gold/90 text-[10px] font-bold px-4"
                                >
                                    {isSyncing ? "Saving..." : "Save to DB"}
                                </Button>
                            </div>
                        )}
                        <Button
                            onClick={handlePrint}
                            disabled={totalLabels === 0 || isSyncing}
                            className="w-full rounded-2xl h-14 bg-brand-deep text-brand-gold dark:bg-brand-gold dark:hover:bg-brand-gold/80 dark:text-brand-deep font-bold shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest text-xs"
                        >
                            <Printer className="w-4 h-4 mr-2" />
                            Print {totalLabels} {totalLabels === 1 ? 'Label' : 'Labels'}
                        </Button>
                    </div>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}

// ── Barcode Preview Sub-Component ────────────────────────────────────────

function BarcodePreview({
    value,
    format,
    renderBarcode,
    validateBarcode,
    onSwitchFormat,
    label,
    isSimplified,
    template,
    businessName
}: {
    value: string
    format: BarcodeFormat
    renderBarcode: (value: string, format: BarcodeFormat, options?: any) => string | null
    validateBarcode: (value: string, format: BarcodeFormat) => { valid: boolean; error?: string; suggestion?: BarcodeFormat }
    onSwitchFormat: (format: BarcodeFormat) => void
    label: LabelData
    isSimplified: boolean
    template: LabelTemplate
    businessName: string
}) {
    const [dataUrl, setDataUrl] = React.useState<string | null>(null)
    const validation = React.useMemo(() => validateBarcode(value, format), [value, format, validateBarcode])

    React.useEffect(() => {
        if (validation.valid) {
            const url = renderBarcode(value, format, { width: 1.2, height: 40, displayValue: true, margin: 0 })
            setDataUrl(url || null)
        } else {
            setDataUrl(null)
        }
    }, [value, format, renderBarcode, validation.valid])

    if (!validation.valid) {
        return (
            <div className="mt-3 py-3 px-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 space-y-2">
                <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-rose-500 font-medium leading-relaxed">
                        {validation.error || `Cannot render barcode — value may be incompatible with ${format} format.`}
                    </p>
                </div>
                {validation.suggestion && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSwitchFormat(validation.suggestion!)}
                        className="h-7 px-3 rounded-lg text-[10px] bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 dark:text-rose-400 border border-rose-500/20"
                    >
                        <ExternalLink className="w-3 h-3 mr-1.5" />
                        Switch to {validation.suggestion}
                    </Button>
                )}
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3"
        >
            <div className={cn(
                "p-3 rounded-xl bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 flex flex-col items-center shadow-sm",
                template === 'compact' ? "gap-2" : "gap-4"
            )}>
                <div className={cn(
                    "w-full flex flex-col items-center justify-between border-2 border-brand-deep dark:border-brand-gold p-2 min-h-[140px]",
                    template === 'compact' ? "min-h-[100px]" : template === 'full' ? "min-h-[200px]" : ""
                )}>
                    {(!isSimplified || template === 'full') && (
                        <div className="flex flex-col items-center w-full gap-0.5 mb-2">
                            {template === 'full' && (
                                <span className="text-[8px] font-black tracking-[0.2em] uppercase text-brand-deep/40 dark:text-brand-gold/40 mb-1">
                                    {label.businessName}
                                </span>
                            )}
                            <h4 className={cn(
                                "font-black text-center leading-tight tracking-tight uppercase text-brand-deep dark:text-brand-cream",
                                template === 'full' ? "text-base" : template === 'compact' ? "text-[10px]" : "text-sm"
                            )}>
                                {label.productName}
                            </h4>
                            {label.variantName && (
                                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-deep/60 dark:text-brand-gold/60">
                                    {label.variantName} {template === 'full' && label.sku && `• ${label.sku}`}
                                </span>
                            )}
                        </div>
                    )}
                    
                    <div className="w-full h-px bg-brand-deep dark:bg-brand-gold opacity-20" />
                    
                    <div className="flex items-center justify-center w-full grow py-3">
                        {dataUrl ? (
                            <img 
                                src={dataUrl} 
                                alt="Barcode" 
                                className={cn(
                                    "max-w-full h-auto object-contain dark:invert",
                                    template === 'compact' ? "max-h-[40px]" : template === 'full' ? "max-h-[100px]" : "max-h-[70px]"
                                )} 
                            />
                        ) : (
                            <div className="h-full w-full bg-brand-deep/5 dark:bg-white/5 animate-pulse rounded flex items-center justify-center">
                                <span className="text-[10px] font-mono opacity-30">{label.barcode}</span>
                            </div>
                        )}
                    </div>

                    <div className="w-full h-px bg-brand-deep dark:bg-brand-gold opacity-20" />
                    
                    <div className="flex flex-col items-center justify-center w-full pt-2">
                        <p className={cn(
                            "font-black text-brand-deep dark:text-brand-gold leading-none tracking-tighter",
                            template === 'full' ? "text-3xl" : template === 'compact' ? "text-lg" : "text-2xl"
                        )}>
                            <CurrencyText value={label.price} />
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

// ── Utility ──────────────────────────────────────────────────────────────

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
}
