"use client"

import { createContext, useContext, useState, ReactNode } from 'react'

interface Store {
    id: string
    name: string
    location?: string
    isDefault: boolean
}

// Virtual "All Stores" constant
export const ALL_STORES_ID = 'all-stores'

const allStores: Store = {
    id: ALL_STORES_ID,
    name: 'All Stores',
    isDefault: false
}

// Mock stores data
const mockStores: Store[] = [
    allStores,
    { id: '1', name: 'Main Store', location: 'Lekki Phase 1', isDefault: true },
    { id: '2', name: 'Ikeja Branch', location: 'Computer Village', isDefault: false },
    { id: '3', name: 'Abuja Store', location: 'Wuse 2', isDefault: false },
]

interface StoreContextType {
    businessName: string
    businessLogo?: string
    allStores: Store
    stores: Store[]
    currentStore: Store
    setCurrentStore: (store: Store) => void
    ownerName: string
    addStore: (name: string, location: string) => void
    updateStore: (id: string, updates: Partial<Store>) => void
    deleteStore: (id: string) => void
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

export function StoreProvider({ children }: { children: ReactNode }) {
    const [stores, setStores] = useState<Store[]>(mockStores)
    const [currentStore, setCurrentStore] = useState<Store>(mockStores[0])

    const addStore = (name: string, location: string) => {
        const newStore: Store = {
            id: Math.random().toString(36).substring(7),
            name,
            location,
            isDefault: false
        }
        setStores([...stores, newStore])
    }

    const updateStore = (id: string, updates: Partial<Store>) => {
        setStores(stores.map(s => s.id === id ? { ...s, ...updates } : s))
        if (currentStore.id === id) {
            setCurrentStore({ ...currentStore, ...updates })
        }
    }

    const deleteStore = (id: string) => {
        if (id === ALL_STORES_ID) return
        const newStores = stores.filter(s => s.id !== id)
        setStores(newStores)
        if (currentStore.id === id) {
            setCurrentStore(allStores)
        }
    }

    return (
        <StoreContext.Provider value={{
            businessName: "Cloove Fashion",
            allStores,
            stores,
            currentStore,
            setCurrentStore,
            ownerName: "Josiah",
            addStore,
            updateStore,
            deleteStore
        }}>
            {children}
        </StoreContext.Provider>
    )
}

export function useStore() {
    const context = useContext(StoreContext)
    if (context === undefined) {
        throw new Error('useStore must be used within a StoreProvider')
    }
    return context
}
