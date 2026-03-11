"use client"

import * as React from 'react'
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerClose,
    DrawerBody,
    DrawerFooter
} from "@/app/components/ui/drawer"
import { Button } from "@/app/components/ui/button"
import { FileDropZone } from "@/app/components/ui/file-drop-zone"
import { ProductExtractionCard, ExtractedProduct } from "./ProductExtractionCard"
import { Sparkles, Loader2, CheckCircle2, ChevronRight, ArrowLeft, Edit3, Store as StoreIcon, AlertCircle, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { storage } from '@/app/lib/storage'
import { useBulkUpload, BulkUploadPayload } from "../hooks/useBulkUpload"
import { useBusiness } from '@/app/components/BusinessProvider'
import { useStores } from '@/app/domains/stores/providers/StoreProvider'
import { useProductCategories } from '../hooks/useProductCategories'
import { MultiSelect } from '@/app/components/ui/multi-select'
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover'
import { cn } from '@/app/lib/utils'

type UploadStep = 'upload' | 'extracting' | 'review' | 'success'

interface BulkUploadDrawerProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onComplete: (products: any[]) => void
}

export function BulkUploadDrawer({
    isOpen,
    onOpenChange,
    onComplete
}: BulkUploadDrawerProps) {
    const [step, setStep] = React.useState<UploadStep>('upload')
    const [file, setFile] = React.useState<File | null>(null)
    const [fileHash, setFileHash] = React.useState<string | null>(null)
    const [extractedProducts, setExtractedProducts] = React.useState<ExtractedProduct[]>([])
    const [selectedStoreIds, setSelectedStoreIds] = React.useState<string[]>([])
    const [isValidatingImages, setIsValidatingImages] = React.useState(false)
    const [brokenImageUrls, setBrokenImageUrls] = React.useState<string[]>([])
    const [problemPopoverOpen, setProblemPopoverOpen] = React.useState(false)
    const { extractProducts, confirmUpload, isUploading } = useBulkUpload()

    const totalBrokenImageCount = React.useMemo(() => {
        const brokenSet = new Set(brokenImageUrls)
        return extractedProducts.reduce(
            (count, p) =>
                count + (p.imageUrls || []).filter((url) => brokenSet.has(url)).length,
            0
        )
    }, [extractedProducts, brokenImageUrls])

    const submitBlockers = React.useMemo(() => {
        const list: string[] = []
        if (extractedProducts.some((p) => p.status === 'error')) {
            list.push('Some products have errors (e.g. missing name or price). Fix them before submitting.')
        }
        if (totalBrokenImageCount > 0) {
            list.push(
                `${totalBrokenImageCount} broken image link${totalBrokenImageCount === 1 ? '' : 's'}. Remove or replace them before submitting.`
            )
        }
        return list
    }, [extractedProducts, totalBrokenImageCount])
    const { stores, currentStore } = useStores()
    const { options: categoryOptions } = useProductCategories()
    const foundImageCount = React.useMemo(
        () => extractedProducts.reduce((count, product) => count + (product.imageUrls?.length || 0), 0),
        [extractedProducts]
    )

    const imageUrlSignature = React.useMemo(
        () =>
            [...new Set(extractedProducts.flatMap((p) => p.imageUrls || []).filter(Boolean))].sort().join('\n'),
        [extractedProducts]
    )

    React.useEffect(() => {
        if (step !== 'review' || extractedProducts.length === 0) {
            setBrokenImageUrls([])
            setIsValidatingImages(false)
            return
        }

        const urls = [...new Set(extractedProducts.flatMap((p) => p.imageUrls || []).filter(Boolean))]
        if (urls.length === 0) {
            setBrokenImageUrls([])
            setIsValidatingImages(false)
            return
        }

        let cancelled = false
        setIsValidatingImages(true)

        const run = async () => {
            const broken = await findBrokenImageUrls(extractedProducts)
            if (!cancelled) {
                setBrokenImageUrls(broken)
                setIsValidatingImages(false)
                if (broken.length > 0) {
                    const brokenSet = new Set(broken)
                    const totalOccurrences = extractedProducts.reduce(
                        (count, p) =>
                            count + (p.imageUrls || []).filter((url) => brokenSet.has(url)).length,
                        0
                    )
                    toast.error(
                        `Found ${totalOccurrences} broken image link${totalOccurrences === 1 ? '' : 's'}. Fix or remove them to enable submit.`
                    )
                }
            }
        }

        run()
        return () => {
            cancelled = true
        }
    }, [step, imageUrlSignature])

    const checkImageReachable = (url: string, timeoutMs = 6000): Promise<boolean> => {
        return new Promise((resolve) => {
            const img = new Image()
            let resolved = false

            const done = (value: boolean) => {
                if (!resolved) {
                    resolved = true
                    resolve(value)
                }
            }

            const timeoutId = window.setTimeout(() => done(false), timeoutMs)
            img.onload = () => {
                window.clearTimeout(timeoutId)
                done(true)
            }
            img.onerror = () => {
                window.clearTimeout(timeoutId)
                done(false)
            }

            img.src = url
        })
    }

    const findBrokenImageUrls = async (products: ExtractedProduct[]) => {
        const uniqueUrls = [...new Set(products.flatMap((p) => p.imageUrls || []).filter(Boolean))]
        if (uniqueUrls.length === 0) return []

        const checks = await Promise.all(
            uniqueUrls.map(async (url) => ({ url, ok: await checkImageReachable(url) }))
        )
        return checks.filter((item) => !item.ok).map((item) => item.url)
    }

    // Load session state on mount
    React.useEffect(() => {
        if (isOpen) {
            const cachedSession = storage.getBulkUploadSession()
            if (cachedSession) {
                try {
                    const { step: cachedStep, products, timestamp, hash } = JSON.parse(cachedSession)
                    // Expire session after 24 hours
                    if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
                        setStep(cachedStep)
                        setExtractedProducts(products)
                        if (hash) setFileHash(hash)
                        if (cachedStep === 'review' && products.length > 0) {
                            toast.info("Restored your previous upload session.")
                        }
                    } else {
                        storage.clearBulkUploadSession()
                    }
                } catch (e) {
                    console.error("Failed to restore bulk upload session", e)
                }
            }
        }
    }, [isOpen])

    // Pre-select store if none selected
    React.useEffect(() => {
        if (isOpen && stores.length > 0 && selectedStoreIds.length === 0) {
            const defaultId = currentStore?.id || stores.find(s => s.isDefault)?.id || stores[0].id
            if (defaultId) {
                setSelectedStoreIds([defaultId])
            }
        }
    }, [isOpen, stores, currentStore, selectedStoreIds])

    // Save session state whenever relevant data changes
    React.useEffect(() => {
        if (step === 'review' && extractedProducts.length > 0) {
            storage.setBulkUploadSession(JSON.stringify({
                step,
                products: extractedProducts,
                timestamp: Date.now(),
                hash: fileHash
            }))
        }
    }, [step, extractedProducts, fileHash])

    const computeFileHash = async (file: File): Promise<string> => {
        const buffer = await file.arrayBuffer()
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    }

    const saveToFileCache = (hash: string, products: ExtractedProduct[], fileName: string) => {
        try {
            const cacheRaw = storage.getBulkUploadFileCache()
            const cache = cacheRaw ? JSON.parse(cacheRaw) : {}
            cache[hash] = {
                originalProducts: products,
                fileName,
                timestamp: Date.now()
            }
            storage.setBulkUploadFileCache(JSON.stringify(cache))
        } catch (e) {
            console.error("Failed to save to file cache", e)
        }
    }

    const getFromFileCache = (hash: string) => {
        try {
            const cacheRaw = storage.getBulkUploadFileCache()
            if (!cacheRaw) return null
            const cache = JSON.parse(cacheRaw)
            const cachedFile = cache[hash]

            if (!cachedFile) return null

            // Check expiration (14 days)
            const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000
            storage.pruneBulkUploadFileCache(FOURTEEN_DAYS_MS)

            return cachedFile
        } catch (e) {
            return null
        }
    }

    // Cleanup expired cache entries on mount
    React.useEffect(() => {
        try {
            const cacheRaw = storage.getBulkUploadFileCache()
            if (cacheRaw) {
                const cache = JSON.parse(cacheRaw)
                const now = Date.now()
                const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000

                let hasChanges = false
                Object.keys(cache).forEach(hash => {
                    if (now - cache[hash].timestamp > FOURTEEN_DAYS_MS) {
                        delete cache[hash]
                        hasChanges = true
                    }
                })

                if (hasChanges) {
                    storage.setBulkUploadFileCache(JSON.stringify(cache))
                }
            }
        } catch (e) {
            console.error("Failed to cleanup file cache", e)
        }
    }, [])

    const handleFileSelect = async (selectedFile: File) => {
        setFile(selectedFile)
        setStep('extracting')

        try {
            const computedHash = await computeFileHash(selectedFile)
            setFileHash(computedHash)

            // Check FILE cache first
            const cachedFile = getFromFileCache(computedHash)
            if (cachedFile) {
                // Ensure products from cache have the current selectedStoreIds if they don't have any
                const productsFromCache = cachedFile.originalProducts.map((p: any) => ({
                    ...p,
                    storeIds: p.storeIds && p.storeIds.length > 0 ? p.storeIds : [...selectedStoreIds]
                }))
                setExtractedProducts(productsFromCache)
                setStep('review')
                toast.success('Extraction completed. Please review')
                return
            }

            // Real AI Extraction
            const data = await extractProducts(selectedFile)

            // Map backend response to frontend ExtractedProduct
            const mappedProducts: ExtractedProduct[] = data.map((p: any, index: number) => {
                const errors: string[] = []
                if (!p.price) errors.push('Missing price')
                if (!p.name) errors.push('Missing name')

                return {
                    id: `new-${Date.now()}-${index}`,
                    name: p.name || '',
                    price: p.price || 0,
                    sku: p.sku || '',
                    stockQuantity: p.stockQuantity || 0,
                    category: p.category || '',
                    imageUrls: p.imageUrls || [],
                    status: errors.length > 0 ? 'error' : 'success',
                    errors: errors,
                    storeIds: [...selectedStoreIds]
                }
            })

            setExtractedProducts(mappedProducts)
            setStep('review')
            toast.success("AI extraction complete. Please review the details.")

            // Save to FILE cache
            saveToFileCache(computedHash, mappedProducts, selectedFile.name)
        } catch (error) {
            console.error("Error processing file:", error)
            // Error toast is already handled by hook
            setStep('upload')
        }
    }

    const handleUpdateProduct = (id: string, updates: Partial<ExtractedProduct>) => {
        setExtractedProducts(prev => prev.map(p => {
            if (p.id === id) {
                const updated = { ...p, ...updates }
                // Re-validate simple errors
                const errors: string[] = []
                if (!updated.price && updated.price !== 0) errors.push('Missing price')
                if (!updated.name) errors.push('Missing name')
                return {
                    ...updated,
                    errors,
                    status: errors.length > 0 ? 'error' as const : 'success' as const
                }
            }
            return p
        }))
    }

    const handleRemoveProduct = (id: string) => {
        setExtractedProducts(prev => prev.filter(p => p.id !== id))
    }

    const handleConfirm = async () => {
        const hasErrors = extractedProducts.some(p => p.status === 'error')
        if (hasErrors) {
            toast.error("Please fix errors before uploading.")
            return
        }
        if (brokenImageUrls.length > 0 || isValidatingImages) {
            return
        }

        try {
            const payload: BulkUploadPayload = {
                storeIds: selectedStoreIds.length > 0 ? selectedStoreIds : undefined,
                products: extractedProducts.map(p => ({
                    name: p.name,
                    price: typeof p.price === 'string' ? parseFloat(p.price) : p.price,
                    sku: p.sku || undefined,
                    stockQuantity: typeof p.stockQuantity === 'string' ? parseInt(p.stockQuantity) : p.stockQuantity,
                    category: p.category || undefined,
                    imageUrls: p.imageUrls?.length ? p.imageUrls : undefined,
                    storeIds: p.storeIds && p.storeIds.length > 0 ? p.storeIds : undefined
                }))
            }

            await confirmUpload(payload)
            setStep('success')
            storage.clearBulkUploadSession()
            onComplete(extractedProducts)
        } catch (error) {
            console.error("Upload failed:", error)
        }
    }

    return (
        <Drawer open={isOpen} onOpenChange={onOpenChange}>
            <DrawerContent className="max-w-5xl">
                <DrawerStickyHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <DrawerTitle className="font-serif text-2xl">
                            Bulk Product Upload
                        </DrawerTitle>
                    </div>
                    <DrawerDescription>
                        {step === 'upload' && "Upload a PDF, CSV or Excel file and our AI will extract product details for you."}
                        {step === 'extracting' && "Cloove AI is analyzing your document and identifying products..."}
                        {step === 'review' && `Verify and refine the ${extractedProducts.length} products we found.`}
                        {step === 'success' && "Your products have been added to your inventory."}
                    </DrawerDescription>
                </DrawerStickyHeader>

                <DrawerBody className="">
                    <AnimatePresence mode="wait">
                        {step === 'upload' && (
                            <motion.div
                                key="upload"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="max-w-xl mx-auto"
                            >
                                <div className="mb-8 p-6 rounded-[32px] bg-white dark:bg-white/5 border border-brand-deep/5 dark:border-white/10 shadow-sm">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-2xl bg-brand-green/10 flex items-center justify-center text-brand-green">
                                            <StoreIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-brand-deep dark:text-brand-cream">Select Destination Store</h4>
                                            <p className="text-xs text-brand-accent/40 dark:text-brand-cream/40">Where should these products be added?</p>
                                        </div>
                                    </div>

                                    <MultiSelect
                                        options={stores.map(s => ({ label: s.name, value: s.id }))}
                                        value={selectedStoreIds}
                                        onChange={setSelectedStoreIds}
                                        placeholder="Pick one or more branches..."
                                    />

                                    {selectedStoreIds.length === 0 && stores.length > 0 && (
                                        <p className="mt-3 text-[10px] text-brand-orange/60 font-medium">
                                            Note: If no store is selected, products will be added to your default branch.
                                        </p>
                                    )}
                                </div>

                                <FileDropZone onFileSelect={handleFileSelect} />
                                <p className="mt-3 text-center text-[11px] text-brand-accent/40 dark:text-brand-cream/40">
                                    Maximum of 100 products per upload
                                </p>
                                <div className="mt-5 p-6 rounded-[24px] bg-brand-gold/5 border border-brand-gold/30">
                                    <h4 className="text-sm font-bold text-brand-deep-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4" /> Why use AI Bulk Upload?
                                    </h4>
                                    <ul className="space-y-2 text-xs text-brand-accent/60 dark:text-brand-cream/60">
                                        <li className="flex gap-2">
                                            <div className="w-1 h-1 rounded-full bg-brand-gold mt-1.5 shrink-0" />
                                            No need for specific templates. Just upload your invoice or list.
                                        </li>
                                        <li className="flex gap-2">
                                            <div className="w-1 h-1 rounded-full bg-brand-gold mt-1.5 shrink-0" />
                                            Automatic identification of name, price, variants and stock.
                                        </li>
                                        <li className="flex gap-2">
                                            <div className="w-1 h-1 rounded-full bg-brand-gold mt-1.5 shrink-0" />
                                            Instant refinement via the interactive dashboard.
                                        </li>
                                    </ul>
                                </div>
                            </motion.div>
                        )}

                        {step === 'extracting' && (
                            <motion.div
                                key="extracting"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center py-20 text-center"
                            >
                                <div className="relative">
                                    <div className="absolute inset-0 bg-brand-gold/20 blur-[50px] rounded-full animate-pulse" />
                                    <div className="relative w-24 h-24 rounded-[32px] bg-brand-deep/5 dark:bg-white/5 border border-brand-gold/20 flex items-center justify-center">
                                        <Loader2 className="w-10 h-10 text-brand-gold animate-spin" />
                                    </div>
                                </div>
                                <div className="mt-8 space-y-2">
                                    <h3 className="font-serif text-2xl font-medium text-brand-deep dark:text-brand-cream">
                                        Whispering with Intelligence
                                    </h3>
                                    <p className="text-sm text-brand-accent/40 dark:text-brand-cream/40 px-4">
                                        Extracting data from "{file?.name}"...
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {step === 'review' && (
                            <motion.div
                                key="review"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="max-w-3xl mx-auto space-y-6"
                            >
                                <div className="bg-brand-gold/10 border border-brand-gold/20 rounded-3xl sm:rounded-2xl p-4 flex items-start gap-3">
                                    <div className="p-2 bg-brand-gold/20 rounded-full shrink-0">
                                        <Edit3 className="w-4 h-4 text-brand-deep dark:text-brand-gold" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-brand-deep dark:text-brand-cream">Review your data</h4>
                                        <p className="text-xs text-brand-deep/60 dark:text-brand-cream/60 mt-1">
                                            Please verify the extracted details below. Tap any field to edit before confirming.
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {extractedProducts.map((product) => (
                                        <ProductExtractionCard
                                            key={product.id}
                                            product={product}
                                            stores={stores}
                                            categories={categoryOptions}
                                            onUpdate={handleUpdateProduct}
                                            onRemove={handleRemoveProduct}
                                        />
                                    ))}
                                </div>
                                <p className="text-xs text-brand-deep/60 dark:text-brand-cream/60">
                                    {foundImageCount > 0
                                        ? `${foundImageCount} image${foundImageCount === 1 ? '' : 's'} found and will be attached. Missing/unreachable images are skipped.`
                                        : 'No valid images found yet. You can still submit and upload products without images.'}
                                </p>
                            </motion.div>
                        )}

                        {step === 'success' && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center py-20 text-center"
                            >
                                <div className="w-20 h-20 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green mb-8">
                                    <CheckCircle2 className="w-10 h-10" />
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <h3 className="font-serif text-3xl font-medium text-brand-deep dark:text-brand-cream">
                                            Inventory Restocked
                                        </h3>
                                        <p className="text-sm text-brand-accent/40 dark:text-brand-cream/40">
                                            {extractedProducts.length} products have been successfully added.
                                        </p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <Button
                                            onClick={() => onOpenChange(false)}
                                            className="rounded-full border border-brand-deep/10 bg-transparent text-brand-deep hover:bg-brand-deep/5 px-8 h-12"
                                        >
                                            View Inventory
                                        </Button>
                                        <Button
                                            onClick={() => setStep('upload')}
                                            className="rounded-full bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep px-8 h-12 shadow-lg"
                                        >
                                            Upload More
                                            <ChevronRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </DrawerBody>
                {step === 'review' && (
                    <DrawerFooter>
                        <div className="sticky bottom-0 pt-6 pb-2 flex items-center justify-between gap-4">
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setStep('upload')
                                    setExtractedProducts([])
                                    setFile(null)
                                    setFileHash(null)
                                    storage.clearBulkUploadSession()
                                }}
                                className="flex cursor-pointer items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-accent/40 hover:text-brand-deep dark:text-brand-deep-300 dark:hover:text-brand-deep-400"
                            >
                                <ArrowLeft className="w-4 h-4" /> Start Over
                            </Button>
                            <div className="relative inline-flex">
                                <Button
                                    onClick={handleConfirm}
                                    disabled={
                                        isUploading ||
                                        isValidatingImages ||
                                        extractedProducts.some(p => p.status === 'error') ||
                                        brokenImageUrls.length > 0
                                    }
                                    className="rounded-full bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep px-8 h-12 shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    {isUploading || isValidatingImages ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                    )}
                                    <span className="hidden md:inline">
                                        {isValidatingImages
                                            ? 'Checking image links...'
                                            : `Confirm & Upload ${extractedProducts.length} Products`}
                                    </span>
                                    <span className="md:hidden">{isValidatingImages ? 'Checking...' : 'Confirm'}</span>
                                </Button>
                                {submitBlockers.length > 0 && (
                                    <Popover open={problemPopoverOpen} onOpenChange={setProblemPopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                aria-label="View issues preventing submit"
                                                className={cn(
                                                    "absolute -top-0.5 -right-0.5 z-10 h-7 w-7 rounded-full opacity-100",
                                                    "!bg-rose-500 text-white shadow-md hover:!bg-rose-600",
                                                    "hover:scale-110 active:scale-95 transition-transform duration-200 ease-out",
                                                    "focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-brand-deep-800"
                                                )}
                                            >
                                                <AlertCircle className="h-4 w-4" strokeWidth={2.5} />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            side="top"
                                            align="end"
                                            sideOffset={8}
                                            className="w-80 rounded-2xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950 p-0 overflow-hidden shadow-lg"
                                        >
                                            <div className="flex items-start justify-between gap-2 px-3 py-2 border-b border-rose-200 dark:border-rose-800">
                                                <p className="text-sm font-semibold text-rose-700 dark:text-rose-200">
                                                    Cannot submit
                                                </p>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setProblemPopoverOpen(false)}
                                                    aria-label="Close"
                                                    className="size-6 rounded-lg text-rose-600 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <ul className="p-3 space-y-2 text-xs text-rose-700/90 dark:text-rose-200/90">
                                                {submitBlockers.map((message, i) => (
                                                    <li key={i} className="flex gap-2">
                                                        <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                                                        {message}
                                                    </li>
                                                ))}
                                            </ul>
                                        </PopoverContent>
                                    </Popover>
                                )}
                            </div>
                        </div>
                    </DrawerFooter>
                )}
            </DrawerContent>
        </Drawer>
    )
}
