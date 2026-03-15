"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface MobileNavContextType {
    isMenuOpen: boolean
    setIsMenuOpen: (open: boolean) => void
}

const MobileNavContext = createContext<MobileNavContextType | undefined>(undefined)

export function MobileNavProvider({ children }: { children: ReactNode }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    return (
        <MobileNavContext.Provider value={{ isMenuOpen, setIsMenuOpen }}>
            {children}
        </MobileNavContext.Provider>
    )
}

export function useMobileNav() {
    const context = useContext(MobileNavContext)
    if (context === undefined) {
        throw new Error("useMobileNav must be used within a MobileNavProvider")
    }
    return context
}
