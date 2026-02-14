"use client"

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { toast } from 'sonner'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient, ApiResponse } from '@/app/lib/api-client'
import { useBusiness } from '@/app/components/BusinessProvider'

export interface Store {
    id: string
    businessId: string
    name: string
    location: string | null
    managerName: string | null
    managerPhone: string | null
    managerEmail: string | null
    contactEmail: string | null
    contactPhone: string | null
    isDefault: boolean
    metrics?: {
        inventoryValue: number
        staffCount: number
    }
    createdAt: string
    updatedAt: string | null
}


interface StoreContextType {
    stores: Store[]
    currentStore: Store | null
    isLoading: boolean
    setCurrentStore: (store: Store) => void
    addStore: (data: Partial<Store>) => Promise<void>
    updateStore: (id: string, data: Partial<Store>) => Promise<void>
    deleteStore: (id: string) => Promise<void>
}

export interface ActivityItem {
    id: string
    type: 'sale' | 'payment' | 'debt' | 'customer' | 'inventory'
    description: string
    amount?: string | null
    timeAgo: string
    customer?: string | null
    href?: string
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

export function StoreProvider({ children }: { children: ReactNode }) {
    const { data: response, isLoading, error } = useQuery<ApiResponse<Store[]>>({
        queryKey: ['stores'],
        queryFn: () => apiClient.get<ApiResponse<Store[]>>('/stores', {}, { fullResponse: true })
    })
    const queryClient = useQueryClient()
    const [currentStore, setCurrentStore] = useState<Store | null>(null)

    const stores: Store[] = response?.data || []

    // Set default store on load if none selected
    useEffect(() => {
        if (stores.length > 0 && !currentStore) {
            const defaultStore = stores.find(s => s.isDefault) || stores[0]
            setCurrentStore(defaultStore)
        }
    }, [stores, currentStore])

    const addStore = async (data: Partial<Store>) => {
        try {
            await apiClient.post('/stores', data)
            toast.success('Store created successfully')
            queryClient.invalidateQueries({ queryKey: ['stores'] })
        } catch (error: any) {
            toast.error(error.message || 'Failed to create store')
        }
    }

    const updateStore = async (id: string, data: Partial<Store>) => {
        try {
            await apiClient.put(`/stores/${id}`, data)
            toast.success('Store updated successfully')
            queryClient.invalidateQueries({ queryKey: ['stores'] })
        } catch (error: any) {
            toast.error(error.message || 'Failed to update store')
        }
    }

    const deleteStore = async (id: string) => {
        try {
            await apiClient.delete(`/stores/${id}`)
            toast.success('Store deleted successfully')
            queryClient.invalidateQueries({ queryKey: ['stores'] })
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete store')
        }
    }

    return (
        <StoreContext.Provider value={{
            stores,
            currentStore,
            isLoading,
            setCurrentStore,
            addStore,
            updateStore,
            deleteStore
        }}>
            {children}
        </StoreContext.Provider>
    )
}

export function useStores() {
    const context = useContext(StoreContext)
    if (context === undefined) {
        throw new Error('useStores must be used within a StoreProvider')
    }
    return context
}

export function useStoreActivities(storeId?: string) {
    const { activeBusiness } = useBusiness()

    return useQuery<ApiResponse<any[]>>({
        queryKey: ['store-activities', storeId],
        queryFn: () => apiClient.get<ApiResponse<any[]>>(`/stores/${storeId}/activities`, {}, { fullResponse: true }),
        enabled: !!storeId && !!activeBusiness,
        select: (response) => {
            const events = response.data || []
            return {
                ...response,
                data: events.map(event => {
                    const metadata = event.metadata || {}
                    let type: any = 'sale'
                    let description = 'Activity recorded'
                    let amount = null
                    let customer = null

                    switch (event.type) {
                        case 'ORDER_CREATED':
                            type = 'sale'
                            description = `New sale: ${metadata.itemCount} items`
                            amount = metadata.totalAmount ? `${metadata.totalAmount.toLocaleString()}` : null
                            customer = metadata.customerName || 'Walk-in'
                            break
                        case 'INVENTORY_INCREASED':
                            type = 'inventory'
                            description = `Restocked ${metadata.productName}`
                            amount = `+${metadata.change}`
                            break
                        case 'INVENTORY_DECREASED':
                            type = 'inventory'
                            description = `Reduced stock of ${metadata.productName}`
                            amount = `-${metadata.change}`
                            break
                        case 'PAYMENT_RECEIVED':
                            type = 'payment'
                            description = 'Payment received'
                            amount = metadata.amount ? `${metadata.amount.toLocaleString()}` : null
                            break
                    }

                    return {
                        id: event.id,
                        type,
                        description,
                        amount: amount ? `₦${amount}` : null, // Currency should probably come from store/business
                        timeAgo: new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        customer,
                        href: type === 'sale' ? `/sales/${event.entityId}` : undefined
                    }
                })
            }
        }
    })
}
