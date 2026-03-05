import { useState, useEffect } from 'react'
import { Customer } from '../data/customerMocks'
import { storage } from '@/app/lib/storage'

export interface CartItem {
    id: string
    product: string
    price: number
    quantity: number
    category?: string
}

export interface QueuedSale {
    id: string
    customer: Customer | null
    items: CartItem[]
    paymentMethod: 'Cash' | 'Transfer' | 'Card'
    discount: number
    promotionId?: string
    note: string
    amountPaid: number | string
    total: number
    timestamp: number
}

export function useQueuedSales() {
    const [queuedSales, setQueuedSales] = useState<QueuedSale[]>([])
    const [isLoaded, setIsLoaded] = useState(false)

    // Load from storage on mount
    useEffect(() => {
        const stored = storage.getQueuedSales<QueuedSale>()
        setQueuedSales(stored)
        setIsLoaded(true)
    }, [])

    // Sync to storage on change
    useEffect(() => {
        if (isLoaded) {
            storage.setQueuedSales(queuedSales)
        }
    }, [queuedSales, isLoaded])

    const queueSale = (sale: Omit<QueuedSale, 'id' | 'timestamp'>) => {
        const newSale: QueuedSale = {
            ...sale,
            id: `q-${Date.now()}`,
            timestamp: Date.now()
        }
        setQueuedSales(prev => [newSale, ...prev])
        return newSale
    }

    const removeQueuedSale = (id: string) => {
        setQueuedSales(prev => prev.filter(s => s.id !== id))
    }

    const clearQueue = () => {
        setQueuedSales([])
    }

    return {
        queuedSales,
        queueSale,
        removeQueuedSale,
        clearQueue,
        isLoaded
    }
}
