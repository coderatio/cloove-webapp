"use client"

import { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import { toast } from 'sonner'
import { Store, allStores, initialMockStores } from '../data/storesMocks'

interface StoreContextType {
    stores: Store[]
    currentStore: Store
    setCurrentStore: (store: Store) => void
    addStore: (name: string, location?: string) => void
    updateStore: (id: string, data: Partial<Store>) => void
    deleteStore: (id: string) => void
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

export function StoreProvider({ children }: { children: ReactNode }) {
    const [stores, setStores] = useState<Store[]>([allStores, ...initialMockStores])
    const [currentStore, setCurrentStore] = useState<Store>(allStores)

    const addStore = useCallback((name: string, location?: string) => {
        const newStore: Store = {
            id: Math.random().toString(36).substring(2, 9),
            name,
            location,
            isDefault: false
        }
        setStores(prev => [...prev, newStore])
        toast.success(`Store "${name}" added`)
    }, [])

    const updateStore = useCallback((id: string, data: Partial<Store>) => {
        setStores(prev => prev.map(s => s.id === id ? { ...s, ...data } : s))
        toast.success('Store updated')
    }, [])

    const deleteStore = useCallback((id: string) => {
        setStores(prev => prev.filter(s => s.id !== id))
        toast.error('Store removed')
    }, [])

    return (
        <StoreContext.Provider value={{
            stores,
            currentStore,
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
