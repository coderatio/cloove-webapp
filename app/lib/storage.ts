/**
 * Centralized keys for localStorage to avoid magic strings
 */
export const STORAGE_KEYS = {
    AUTH_TOKEN: 'cloove_auth_token',
    ACTIVE_BUSINESS_ID: 'active_business_id',
    THEME: 'theme',
} as const

type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS]

/**
 * Type-safe wrapper for localStorage
 */
export const storage = {
    /**
     * Get a value from localStorage
     */
    get(key: StorageKey): string | null {
        if (typeof window === 'undefined') return null
        return localStorage.getItem(key)
    },

    /**
     * Set a value in localStorage
     */
    set(key: StorageKey, value: string): void {
        if (typeof window === 'undefined') return
        localStorage.setItem(key, value)
    },

    /**
     * Remove a value from localStorage
     */
    remove(key: StorageKey): void {
        if (typeof window === 'undefined') return
        localStorage.removeItem(key)
    },

    /**
     * Clear all Cloove related storage
     */
    clear(): void {
        if (typeof window === 'undefined') return
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key)
        })
    }
}
