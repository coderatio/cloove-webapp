/**
 * Centralized keys for localStorage to avoid magic strings
 */
export const STORAGE_KEYS = {
    AUTH_TOKEN: 'cloove_auth_token',
    ACTIVE_BUSINESS_ID: 'active_business_id',
    THEME: 'theme',
    LAST_ACTIVITY: 'last_activity',
    BULK_UPLOAD_SESSION: 'cloove_bulk_upload_session',
    BULK_UPLOAD_FILE_CACHE: 'cloove_bulk_upload_file_cache',
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
    },

    // --- Bulk Upload Helpers ---

    /**
     * Get bulk upload session
     */
    getBulkUploadSession(): string | null {
        return this.get(STORAGE_KEYS.BULK_UPLOAD_SESSION)
    },

    /**
     * Set bulk upload session
     */
    setBulkUploadSession(value: string): void {
        this.set(STORAGE_KEYS.BULK_UPLOAD_SESSION, value)
    },

    /**
     * Clear bulk upload session
     */
    clearBulkUploadSession(): void {
        this.remove(STORAGE_KEYS.BULK_UPLOAD_SESSION)
    },

    /**
     * Get bulk upload file cache
     */
    getBulkUploadFileCache(): string | null {
        return this.get(STORAGE_KEYS.BULK_UPLOAD_FILE_CACHE)
    },

    /**
     * Set bulk upload file cache
     */
    setBulkUploadFileCache(value: string): void {
        this.set(STORAGE_KEYS.BULK_UPLOAD_FILE_CACHE, value)
    },

    /**
     * Clear bulk upload file cache
     */
    clearBulkUploadFileCache(): void {
        this.remove(STORAGE_KEYS.BULK_UPLOAD_FILE_CACHE)
    },

    /**
     * Remove a specific file cache entry by hash
     */
    removeBulkUploadFileCacheEntry(hash: string): void {
        try {
            const cacheRaw = this.getBulkUploadFileCache()
            if (!cacheRaw) return

            const cache = JSON.parse(cacheRaw)
            if (cache[hash]) {
                delete cache[hash]
                this.setBulkUploadFileCache(JSON.stringify(cache))
            }
        } catch (e) {
            console.error("Failed to remove file cache entry", e)
        }
    },

    /**
     * Prune expired file cache entries
     */
    pruneBulkUploadFileCache(maxAgeMs: number): void {
        try {
            const cacheRaw = this.getBulkUploadFileCache()
            if (!cacheRaw) return

            const cache = JSON.parse(cacheRaw)
            const now = Date.now()
            let hasChanges = false

            Object.keys(cache).forEach(hash => {
                if (now - cache[hash].timestamp > maxAgeMs) {
                    delete cache[hash]
                    hasChanges = true
                }
            })

            if (hasChanges) {
                this.setBulkUploadFileCache(JSON.stringify(cache))
            }
        } catch (e) {
            console.error("Failed to prune file cache", e)
        }
    }
}
