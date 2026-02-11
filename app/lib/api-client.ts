
import { toast } from "sonner"

// Type for API error responses
interface ApiErrorResponse {
    message?: string
    error?: string
    statusCode?: number
}

// Custom error class for API errors
export class ApiError extends Error {
    statusCode: number
    data: any

    constructor(message: string, statusCode: number, data?: any) {
        super(message)
        this.name = "ApiError"
        this.statusCode = statusCode
        this.data = data
    }
}

// Base configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api"

interface RequestOptions extends RequestInit {
    params?: Record<string, string>
}

/**
 * Core API Client for making HTTP requests
 */
export const apiClient = {
    /**
     * Helper to construct URLs with query params
     */
    buildUrl(endpoint: string, params?: Record<string, string>) {
        const url = new URL(endpoint, window.location.origin + API_BASE_URL) // Handle relative /api paths
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    url.searchParams.append(key, value)
                }
            })
        }
        // Return relative path if base is same origin, else full URL
        return url.toString().replace(window.location.origin, "")
    },

    /**
     * Generic request handler
     */
    async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const { params, headers, ...customConfig } = options

        const url = this.buildUrl(endpoint, params)

        // Default headers
        const config: RequestInit = {
            ...customConfig,
            headers: {
                "Content-Type": "application/json",
                ...headers,
            },
        }

        try {
            const response = await fetch(url, config)
            const data = await response.json().catch(() => ({})) // Handle empty responses

            if (!response.ok) {
                // Handle specific status codes
                if (response.status === 401) {
                    // Handle unauthorized (redirect to login, etc.)
                    // window.location.href = "/login"
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
            throw new ApiError(message, 500)
        }
    },

    // HTTP VERBS

    get<T>(endpoint: string, params?: Record<string, string>, options?: RequestOptions) {
        return this.request<T>(endpoint, { ...options, method: "GET", params })
    },

    post<T>(endpoint: string, body: any, options?: RequestOptions) {
        return this.request<T>(endpoint, { ...options, method: "POST", body: JSON.stringify(body) })
    },

    put<T>(endpoint: string, body: any, options?: RequestOptions) {
        return this.request<T>(endpoint, { ...options, method: "PUT", body: JSON.stringify(body) })
    },

    patch<T>(endpoint: string, body: any, options?: RequestOptions) {
        return this.request<T>(endpoint, { ...options, method: "PATCH", body: JSON.stringify(body) })
    },

    delete<T>(endpoint: string, options?: RequestOptions) {
        return this.request<T>(endpoint, { ...options, method: "DELETE" })
    },
}
