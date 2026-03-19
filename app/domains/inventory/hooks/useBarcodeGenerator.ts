"use client"

import { useCallback, useRef } from 'react'
import JsBarcode from 'jsbarcode'
import { useBusiness } from '@/app/components/BusinessProvider'
import { formatCurrency } from '@/app/lib/formatters'
import type { InventoryItem, ProductVariant } from '../types'

export type BarcodeFormat = 'CODE128' | 'EAN13' | 'CODE39'

export interface LabelData {
    productName: string
    variantName: string | null
    sku: string | null
    barcode: string
    price: string
    businessName: string
    quantity: number
}

/**
 * Auto-generate a deterministic internal barcode from an ID.
 */
function autoGenerateBarcode(id: string, format: BarcodeFormat = 'CODE128'): string {
    if (format === 'EAN13') {
        // Generate a 12-digit numeric string from the ID hash
        // We'll use a simple deterministic hash of the ID
        let hash = 0
        for (let i = 0; i < id.length; i++) {
            hash = ((hash << 5) - hash) + id.charCodeAt(i)
            hash |= 0 // Convert to 32bit integer
        }
        // Take absolute value and pad to 12 digits
        const numericBase = Math.abs(hash).toString().padStart(12, '0').substring(0, 12)
        
        // Calculate EAN-13 checksum
        let sum = 0
        for (let i = 0; i < 12; i++) {
            sum += parseInt(numericBase[i]) * (i % 2 === 0 ? 1 : 3)
        }
        const checksum = (10 - (sum % 10)) % 10
        return `${numericBase}${checksum}`
    }

    // Default: CLV- prefix + first 8 chars of the ID (uppercase)
    const shortId = id.replace(/-/g, '').substring(0, 8).toUpperCase()
    return `CLV-${shortId}`
}

/**
 * Hook for barcode generation and label data preparation.
 */
export function useBarcodeGenerator() {
    const { activeBusiness } = useBusiness()
    const currencyCode = activeBusiness?.currency || 'NGN'
    const businessName = activeBusiness?.name || 'Business'

    /**
     * Render a barcode onto a canvas element and return its data URL.
     */
    const renderBarcode = useCallback((
        value: string,
        format: BarcodeFormat = 'CODE128',
        options?: { width?: number; height?: number; displayValue?: boolean; margin?: number }
    ): string | null => {
        try {
            const canvas = document.createElement('canvas')
            JsBarcode(canvas, value, {
                format,
                width: options?.width ?? 2,
                height: options?.height ?? 50,
                displayValue: options?.displayValue ?? true,
                fontSize: 12,
                fontOptions: 'bold',
                textMargin: 4,
                margin: options?.margin ?? 8,
                background: '#ffffff',
                lineColor: '#000000',
            })
            return canvas.toDataURL('image/png')
        } catch (err) {
            console.warn(`Failed to render barcode for "${value}" with format ${format}:`, err)
            return null
        }
    }, [])

    /**
     * Resolve the barcode value for a product or variant.
     * Priority: explicit barcode → auto-generated from ID based on format.
     */
    const resolveBarcodeValue = useCallback((
        product: InventoryItem,
        variant?: ProductVariant,
        format: BarcodeFormat = 'CODE128'
    ): string => {
        if (variant) {
            return variant.barcode || autoGenerateBarcode(variant.id, format)
        }
        return product.raw?.barcode || autoGenerateBarcode(product.id, format)
    }, [])

    /**
     * Build label data for a product and optionally specific variants.
     */
    const buildLabelData = useCallback((
        product: InventoryItem,
        variants?: ProductVariant[],
        quantity: number = 1
    ): LabelData[] => {
        const raw = product.raw
        const productVariants = variants || raw?.variants || raw?.product_variants || []

        if (productVariants.length === 0) {
            return [{
                productName: product.product,
                variantName: null,
                sku: raw?.sku || null,
                barcode: raw?.barcode || autoGenerateBarcode(product.id),
                price: product.price,
                businessName,
                quantity,
            }]
        }

        return productVariants.map((v: ProductVariant) => ({
            productName: product.product,
            variantName: v.name || 'Standard',
            sku: v.sku || null,
            barcode: v.barcode || autoGenerateBarcode(v.id, 'CODE128'), // Default to CODE128 for general build
            price: v.price
                ? formatCurrency(v.price, { currency: currencyCode })
                : product.price,
            businessName,
            quantity,
        }))
    }, [businessName, currencyCode])

    /**
     * Validate if a value is compatible with a specific barcode format.
     */
    const validateBarcode = useCallback((value: string, format: BarcodeFormat): { valid: boolean; error?: string; suggestion?: BarcodeFormat } => {
        if (!value) return { valid: false, error: 'Value is empty' }

        switch (format) {
            case 'EAN13':
                if (!/^\d+$/.test(value)) {
                    return { 
                        valid: false, 
                        error: 'EAN-13 format requires numeric digits only.',
                        suggestion: 'CODE128'
                    }
                }
                if (value.length !== 12 && value.length !== 13) {
                    return { 
                        valid: false, 
                        error: 'EAN-13 must be exactly 12 or 13 digits.',
                        suggestion: 'CODE128'
                    }
                }
                return { valid: true }
            
            case 'CODE39':
                // Code39 supports 0-9, A-Z, -, ., space, $, /, +, %
                if (!/^[0-9A-Z\-\.\ \$\/\+\%]+$/.test(value.toUpperCase())) {
                    return {
                        valid: false,
                        error: 'CODE39 supports only numbers, uppercase letters, and some special characters (- . $ / + % space).',
                        suggestion: 'CODE128'
                    }
                }
                return { valid: true }

            case 'CODE128':
            default:
                // Code128 supports all ASCII characters
                if (!/^[\x00-\x7F]+$/.test(value)) {
                    return {
                        valid: false,
                        error: 'CODE128 supports standard characters only.'
                    }
                }
                return { valid: true }
        }
    }, [])

    return {
        renderBarcode,
        resolveBarcodeValue,
        buildLabelData,
        validateBarcode,
        autoGenerateBarcode,
    }
}
