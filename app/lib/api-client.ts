import { HttpStatus } from "./http-status"

// Custom error class for API errors
export class ApiError extends Error {
    statusCode: number
    data: unknown

    constructor(message: string, statusCode: number, data?: unknown) {
        super(message)
        this.name = "ApiError"
        this.statusCode = statusCode
        this.data = data
    }
}

// Base configuration
// If we use Next.js rewrites, we can just use relative paths.
// If NEXT_PUBLIC_API_BASE_URL is provided, we use it as the base.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""

interface RequestOptions extends RequestInit {
    params?: Record<string, string>
}

const TOKEN_KEY = "cloove_auth_token"

/**
 * Core API Client for making HTTP requests
 */
export const apiClient = {
    /**
     * Token management
     */
    getToken() {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(TOKEN_KEY)
        }
        return null
    },

    setToken(token: string) {
        if (typeof window !== 'undefined') {
            localStorage.setItem(TOKEN_KEY, token)
        }
    },

    clearToken() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(TOKEN_KEY)
            // Optional: Also clear from cookies if needed
        }
    },
    /**
     * Helper to construct URLs with query params
     */
    buildUrl(endpoint: string, params?: Record<string, string>) {
        // If endpoint is already absolute, use it
        if (endpoint.startsWith('http')) {
            const url = new URL(endpoint)
            this.appendParams(url, params)
            return url.toString()
        }

        // Otherwise, construct from base
        // If base is absolute, use it. If base is relative or empty, use window.location.origin
        const base = API_BASE_URL.startsWith('http')
            ? API_BASE_URL
            : (typeof window !== 'undefined' ? window.location.origin : '')

        const url = new URL(endpoint.startsWith('/') ? endpoint : `/${endpoint}`, base)
        this.appendParams(url, params)

        return url.toString()
    },

    appendParams(url: URL, params?: Record<string, string>) {
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    url.searchParams.append(key, value)
                }
            })
        }
    },

    /**
     * Generic request handler
     */
    async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const { params, headers, ...customConfig } = options

        const url = this.buildUrl(endpoint, params)
        const token = this.getToken()

        // Default headers
        const config: RequestInit = {
            ...customConfig,
            headers: {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {}),
                ...headers,
            },
        }

        try {
            const response = await fetch(url, config)
            const data = await response.json().catch(() => ({})) // Handle empty responses

            if (!response.ok) {
                // Handle specific status codes
                if (response.status === HttpStatus.UNAUTHORIZED) {
                    // Redirect to login on authentication failure
                    if (typeof window !== 'undefined') {
                        const currentPath = window.location.pathname
                        // Avoid infinite redirect if already on login
                        if (currentPath !== '/login') {
                            window.location.href = `/login?callbackUrl=${encodeURIComponent(currentPath)}`
                        }
                    }
                }

                const errorMessage = data.error || data.message || `API Error: ${response.status}`
                throw new ApiError(errorMessage, response.status, data)
            }

            return data as T
        } catch (error) {
            // Re-throw ApiErrors, wrap others
            if (error instanceof ApiError) {
                throw error
            }
            const message = error instanceof Error ? error.message : "An unexpected error occurred"
            // Optional: Log to monitoring service (Sentry, etc.)
            console.error(`[API Client] ${endpoint} failed:`, message)
            throw new ApiError(message, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    },

    // HTTP VERBS

    get<T>(endpoint: string, params?: Record<string, string>, options?: RequestOptions) {
        return this.request<T>(endpoint, { ...options, method: "GET", params })
    },

    post<T>(endpoint: string, body: unknown, options?: RequestOptions) {
        return this.request<T>(endpoint, { ...options, method: "POST", body: JSON.stringify(body) })
    },

    put<T>(endpoint: string, body: unknown, options?: RequestOptions) {
        return this.request<T>(endpoint, { ...options, method: "PUT", body: JSON.stringify(body) })
    },

    patch<T>(endpoint: string, body: unknown, options?: RequestOptions) {
        return this.request<T>(endpoint, { ...options, method: "PATCH", body: JSON.stringify(body) })
    },

    delete<T>(endpoint: string, options?: RequestOptions) {
        return this.request<T>(endpoint, { ...options, method: "DELETE" })
    },
}
