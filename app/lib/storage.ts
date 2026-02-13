/**
 * Centralized keys for localStorage to avoid magic strings
 */
export const STORAGE_KEYS = {
    AUTH_TOKEN: 'cloove_auth_token',
    ACTIVE_BUSINESS_ID: 'active_business_id',
    THEME: 'theme',
    LAST_ACTIVITY: 'last_activity',
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
     * Clear all Cloove session-related storage (preserves theme)
     */
    clear(): void {
        if (typeof window === 'undefined') return
        this.remove(STORAGE_KEYS.AUTH_TOKEN)
        this.remove(STORAGE_KEYS.ACTIVE_BUSINESS_ID)
        this.remove(STORAGE_KEYS.LAST_ACTIVITY)
    },

    /**
     * Get token
     */
    getToken(): string | null {
        return this.get(STORAGE_KEYS.AUTH_TOKEN)
    },

    /**
     * Get active business id
     */
    getActiveBusinessId(): string | null {
        return this.get(STORAGE_KEYS.ACTIVE_BUSINESS_ID)
    },

    /**
     * Get theme
     */
    getTheme(): string | null {
        return this.get(STORAGE_KEYS.THEME)
    },

    /**
     * Set token
     */
    setToken(token: string): void {
        this.set(STORAGE_KEYS.AUTH_TOKEN, token)
    },

    /**
     * Set active business id
     */
    setActiveBusinessId(id: string): void {
        this.set(STORAGE_KEYS.ACTIVE_BUSINESS_ID, id)
    },

    /**
     * Set theme
     */
    setTheme(theme: string): void {
        this.set(STORAGE_KEYS.THEME, theme)
    },

    /**
     * Remove token and active business id
     */
    removeToken(): void {
        this.remove(STORAGE_KEYS.AUTH_TOKEN)
    },

    /**
     * Remove active business id
     */
    removeActiveBusinessId(): void {
        this.remove(STORAGE_KEYS.ACTIVE_BUSINESS_ID)
    },

    /**
     * Get last activity timestamp
     */
    getLastActivity(): number {
        const val = this.get(STORAGE_KEYS.LAST_ACTIVITY)
        return val ? parseInt(val) : Date.now()
    },

    /**
     * Set last activity timestamp
     */
    setLastActivity(timestamp: number): void {
        this.set(STORAGE_KEYS.LAST_ACTIVITY, timestamp.toString())
    }
}
