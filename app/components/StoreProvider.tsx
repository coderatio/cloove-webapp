"use client"

import { createContext, useContext, useState, ReactNode } from 'react'

interface Store {
    id: string
    name: string
    location?: string
    isDefault: boolean
}

// Mock stores data
const mockStores: Store[] = [
    { id: '1', name: 'Main Store', location: 'Lekki Phase 1', isDefault: true },
    { id: '2', name: 'Ikeja Branch', location: 'Computer Village', isDefault: false },
    { id: '3', name: 'Abuja Store', location: 'Wuse 2', isDefault: false },
]

interface StoreContextType {
    stores: Store[]
    currentStore: Store
    setCurrentStore: (store: Store) => void
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

export function StoreProvider({ children }: { children: ReactNode }) {
    const [currentStore, setCurrentStore] = useState<Store>(mockStores[0])

    return (
        <StoreContext.Provider value={{ stores: mockStores, currentStore, setCurrentStore }}>
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
