/**
 * Centralized keys for localStorage to avoid magic strings
 */
export const STORAGE_KEYS = {
    ACTIVE_BUSINESS_ID: 'active_business_id',
    THEME: 'theme',
    LAST_ACTIVITY: 'last_activity',
    BULK_UPLOAD_SESSION: 'cloove_bulk_upload_session',
    BULK_UPLOAD_FILE_CACHE: 'cloove_bulk_upload_file_cache',
    /** ID of the last country selected on the login screen */
    LOGIN_COUNTRY_ID: 'cloove_login_country',
    /** Queued sales for the POS system */
    POS_QUEUED_SALES: 'cloove_pos_queued_sales',
    /** Sidebar collapsed state */
    SIDEBAR_COLLAPSED: 'cloove_sidebar_collapsed',
    /** Previously paired Bluetooth thermal printer */
    BT_PRINTER: 'cloove_bt_printer',
    /** Selected printer profile (basic | standard) */
    BT_PRINTER_PROFILE: 'cloove_bt_printer_profile',
    /** Whether to always use Bluetooth for printing */
    BT_ALWAYS_USE: 'cloove_bt_always_use',
    /** Restaurant live refresh interval (seconds) */
    RESTAURANT_REFRESH_INTERVAL: 'cloove_restaurant_refresh_interval',
    /** Restaurant live view zen/fullscreen mode */
    RESTAURANT_ZEN_MODE: 'cloove_restaurant_zen_mode',
    /** Last successful /businesses payload (survives rate limits / transient errors) */
    BUSINESSES_CACHE: 'cloove_businesses_cache',
    /** Business code remembered on shared POS device for sales mode */
    SALES_MODE_BUSINESS_CODE: 'cloove_sales_mode_business_code',
    /** Business name corresponding to saved sales mode business code */
    SALES_MODE_BUSINESS_NAME: 'cloove_sales_mode_business_name',
    /** Whether the current client session is in sales mode */
    SALES_MODE_ACTIVE: 'cloove_sales_mode_active',
    /** Auto-print preference for embedded sales mode POS */
    SALES_MODE_AUTO_PRINT: 'cloove_sales_mode_auto_print',
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
        this.remove(STORAGE_KEYS.ACTIVE_BUSINESS_ID)
        this.remove(STORAGE_KEYS.LAST_ACTIVITY)
        this.remove(STORAGE_KEYS.BUSINESSES_CACHE)
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
     * Remove active business id
     */
    removeActiveBusinessId(): void {
        this.remove(STORAGE_KEYS.ACTIVE_BUSINESS_ID)
    },

    /**
     * Get the last login country ID
     */
    getLoginCountry(): string | null {
        return this.get(STORAGE_KEYS.LOGIN_COUNTRY_ID)
    },

    /**
     * Persist the selected login country ID
     */
    setLoginCountry(id: string): void {
        this.set(STORAGE_KEYS.LOGIN_COUNTRY_ID, id)
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
    },

    // --- POS Helpers ---

    /**
     * Get queued sales from storage
     */
    getQueuedSales<T>(): T[] {
        const val = this.get(STORAGE_KEYS.POS_QUEUED_SALES)
        try {
            return val ? JSON.parse(val) : []
        } catch (e) {
            console.error("Failed to parse queued sales", e)
            return []
        }
    },

    /**
     * Set queued sales in storage
     */
    setQueuedSales(value: any[]): void {
        this.set(STORAGE_KEYS.POS_QUEUED_SALES, JSON.stringify(value))
    },

    /**
     * Get sidebar collapsed state
     */
    getSidebarCollapsed(): boolean {
        return this.get(STORAGE_KEYS.SIDEBAR_COLLAPSED) === 'true'
    },

    /**
     * Set sidebar collapsed state
     */
    setSidebarCollapsed(collapsed: boolean): void {
        this.set(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(collapsed))
    },

    /**
     * Raw JSON of last successful businesses list (used when /businesses fails e.g. 429)
     */
    getBusinessesCacheJson(): string | null {
        return this.get(STORAGE_KEYS.BUSINESSES_CACHE)
    },

    setBusinessesCacheJson(json: string): void {
        this.set(STORAGE_KEYS.BUSINESSES_CACHE, json)
    },

    /** Drop last /businesses snapshot (e.g. after upgrade when server has no subscription alert). */
    clearBusinessesCache(): void {
        this.remove(STORAGE_KEYS.BUSINESSES_CACHE)
    },

    // --- Restaurant Zen Mode ---

    getRestaurantZenMode(): boolean {
        return this.get(STORAGE_KEYS.RESTAURANT_ZEN_MODE) === 'true'
    },

    setRestaurantZenMode(zen: boolean): void {
        this.set(STORAGE_KEYS.RESTAURANT_ZEN_MODE, String(zen))
    },

    // --- Sales Mode ---

    /** Get the remembered business code for the sales-mode PIN screen */
    getSalesModeBusinessCode(): string | null {
        return this.get(STORAGE_KEYS.SALES_MODE_BUSINESS_CODE)
    },

    /** Save the business code so the shared device skips business code entry on return */
    setSalesModeBusinessCode(code: string): void {
        this.set(STORAGE_KEYS.SALES_MODE_BUSINESS_CODE, code)
    },

    /** Get the remembered business name shown on the PIN entry screen */
    getSalesModeBusinessName(): string | null {
        return this.get(STORAGE_KEYS.SALES_MODE_BUSINESS_NAME)
    },

    /** Save the business name for display on the PIN screen */
    setSalesModeBusinessName(name: string): void {
        this.set(STORAGE_KEYS.SALES_MODE_BUSINESS_NAME, name)
    },

    /** Clear saved business code and name (use when switching businesses) */
    clearSalesModeDevice(): void {
        this.remove(STORAGE_KEYS.SALES_MODE_BUSINESS_CODE)
        this.remove(STORAGE_KEYS.SALES_MODE_BUSINESS_NAME)
    },
}
