import { storage } from "@/app/lib/storage"
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
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""

interface RequestOptions extends RequestInit {
    params?: Record<string, string>
    skipAuthRedirect?: boolean
    fullResponse?: boolean
}

/**
 * Standard API Response structure
 */
export interface ApiResponse<T = any> {
    success: boolean
    message: string
    data: T
    meta: Record<string, any>
}

/**
 * Core API Client for making HTTP requests
 */
export const apiClient = {
    /**
     * Token management
     */
    getToken() {
        return storage.getToken()
    },

    setToken(token: string) {
        storage.setToken(token)
    },

    clearToken() {
        storage.clear()
    },

    async refresh() {
        try {
            const data = await this.post<{ token: string }>("/security/refresh", {}, { skipAuthRedirect: true })
            this.setToken(data.token)
            return data
        } catch (error) {
            //console.error("[API Client] Token refresh failed:", error)
            throw error
        }
    },

    async logout() {
        try {
            await this.post("/security/logout", {})
        } finally {
            this.clearToken()
            if (typeof window !== 'undefined') {
                window.location.href = '/login'
            }
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
        const base = API_BASE_URL.startsWith('http')
            ? API_BASE_URL
            : (typeof window !== 'undefined' ? window.location.origin : '')

        // Correctly join paths to avoid stripping base path (like /api)
        const normalizedBase = base.endsWith('/') ? base : `${base}/`
        const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint

        const url = new URL(normalizedEndpoint, normalizedBase)
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
        const businessId = storage.getActiveBusinessId()

        // Default headers
        const config: RequestInit = {
            ...customConfig,
            headers: {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {}),
                ...(businessId ? { "x-business-id": businessId } : {}),
                ...headers,
            },
        }

        try {
            const response = await fetch(url, config)
            const rawData = await response.json().catch(() => ({})) // Handle empty responses

            // If it's a structured response, unwrap it
            if (rawData && typeof rawData === 'object' && 'success' in rawData) {
                const apiResponse = rawData as ApiResponse<T>

                if (!apiResponse.success) {
                    const errorMessage = apiResponse.message || `API Error: ${response.status}`
                    throw new ApiError(errorMessage, response.status, apiResponse.data)
                }

                // If the caller explicitly wants the full response, return it
                if (options.fullResponse) {
                    return apiResponse as any as T
                }

                // Otherwise return just the data to maintain compatibility with existing hooks
                return apiResponse.data as T
            }

            if (!response.ok) {
                // Handle specific status codes
                if (response.status === HttpStatus.UNAUTHORIZED && !options.skipAuthRedirect) {
                    this.clearToken()

                    // Redirect to login on authentication failure
                    if (typeof window !== 'undefined') {
                        const currentPath = window.location.pathname
                        // Avoid infinite redirect if already on login
                        if (currentPath !== '/login') {
                            window.location.href = `/login?callbackUrl=${encodeURIComponent(currentPath)}`
                        }
                    }
                }

                const errorMessage = rawData.error || rawData.message || `API Error: ${response.status}`
                throw new ApiError(errorMessage, response.status, rawData)
            }

            return rawData as T
        } catch (error) {
            // Re-throw ApiErrors, wrap others
            if (error instanceof ApiError) {
                throw error
            }
            const message = error instanceof Error ? error.message : "An unexpected error occurred"
            // console.error(`[API Client] ${endpoint} failed:`, message)
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
