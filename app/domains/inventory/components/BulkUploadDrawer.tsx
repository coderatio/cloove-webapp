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
import { Sparkles, Loader2, CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
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
    const [extractedProducts, setExtractedProducts] = React.useState<ExtractedProduct[]>([])
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    // Reset state when drawer closes
    React.useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setStep('upload')
                setFile(null)
                setExtractedProducts([])
                setIsSubmitting(false)
            }, 500)
        }
    }, [isOpen])

    const handleFileSelect = (selectedFile: File) => {
        setFile(selectedFile)
        setStep('extracting')

        // Simulate AI Extraction
        setTimeout(() => {
            const mockExtracted: ExtractedProduct[] = [
                {
                    id: '1',
                    name: 'Premium Silk Scarf',
                    price: 45000,
                    sku: 'SILK-001',
                    stockQuantity: 12,
                    status: 'success'
                },
                {
                    id: '2',
                    name: 'Linen Summer Dress',
                    price: 28500,
                    sku: 'DRS-LNG-02',
                    stockQuantity: 5,
                    status: 'success'
                },
                {
                    id: '3',
                    name: 'Unbranded Cotton Tee',
                    price: '',
                    sku: '',
                    stockQuantity: 0,
                    status: 'error',
                    errors: ['Missing price', 'Missing SKU']
                }
            ]
            setExtractedProducts(mockExtracted)
            setStep('review')
            toast.success("AI extraction complete. Please review the details.")
        }, 3000)
    }

    const handleUpdateProduct = (id: string, updates: Partial<ExtractedProduct>) => {
        setExtractedProducts(prev => prev.map(p => {
            if (p.id === id) {
                const updated = { ...p, ...updates }
                // Re-validate simple errors
                const errors: string[] = []
                if (!updated.price) errors.push('Missing price')
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

        setIsSubmitting(true)
        // Simulate Batch Save
        await new Promise(r => setTimeout(r, 2000))
        setIsSubmitting(false)
        setStep('success')
        onComplete(extractedProducts)
    }

    return (
        <Drawer open={isOpen} onOpenChange={onOpenChange}>
            <DrawerContent className="max-w-5xl">
                <DrawerStickyHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <DrawerTitle className="font-serif text-2xl">Bulk Product Upload</DrawerTitle>
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
                                className="max-w-xl mx-auto py-8"
                            >
                                <FileDropZone onFileSelect={handleFileSelect} />
                                <div className="mt-8 p-6 rounded-[24px] bg-brand-gold/5 border border-brand-gold/30">
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
                                <div className="space-y-4">
                                    {extractedProducts.map((product) => (
                                        <ProductExtractionCard
                                            key={product.id}
                                            product={product}
                                            onUpdate={handleUpdateProduct}
                                            onRemove={handleRemoveProduct}
                                        />
                                    ))}
                                </div>
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
                            <button
                                onClick={() => setStep('upload')}
                                className="flex cursor-pointer items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-accent/40 hover:text-brand-deep dark:text-brand-deep-300 dark:hover:text-brand-deep-400 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" /> Start Over
                            </button>
                            <Button
                                onClick={handleConfirm}
                                disabled={isSubmitting}
                                className="rounded-full bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep px-8 h-12 shadow-xl hover:scale-105 transition-all"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                )}
                                Confirm & Upload {extractedProducts.length} Products
                            </Button>
                        </div>
                    </DrawerFooter>
                )}
            </DrawerContent>
        </Drawer>
    )
}
