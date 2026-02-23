import { useState, useCallback } from "react"
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"
import { apiClient } from "@/app/lib/api-client"
import { storage, STORAGE_KEYS } from "@/app/lib/storage"
import { toast } from "sonner"
import type { LoginStep, CountryDetail, IdentifyResponse, OtpVerifyResponse, LoginResponse } from "../types"

// ─── Module-level countries cache (fetched once, reused across remounts) ──────
// This avoids re-fetching on every mount/remount of the login form.
// Synchronous cache: populated once the fetch resolves so we can read it
// in useState() initializers without async gymnastics.
let countriesPromise: Promise<CountryDetail[]> | null = null
let countriesCache: CountryDetail[] = []

function getCountries(): Promise<CountryDetail[]> {
    if (!countriesPromise) {
        countriesPromise = apiClient
            .get<CountryDetail[]>('/security/countries')
            .then((data) => {
                countriesCache = data   // populate sync cache
                return data
            })
            .catch((err) => {
                // Reset both caches on error so next mount retries
                countriesPromise = null
                countriesCache = []
                throw err
            })
    }
    return countriesPromise
}

/**
 * Synchronously pick the best default country from the already-resolved cache.
 * Called as a useState lazy initializer so the VERY FIRST render has the right value.
 * Returns null if the cache isn't resolved yet (async load will set it instead).
 */


// ─── Hook interface ───────────────────────────────────────────────────────────

interface UseLoginFlowProps {
    callbackUrl?: string
    router?: AppRouterInstance
    onSuccess?: () => void
}

// ─── Shared post-auth routing helper ─────────────────────────────────────────

function resolveRedirectUrl(
    response: LoginResponse,
    callbackUrl: string
): string {
    const businesses = response.user?.businesses ?? []
    return businesses.length > 1
        ? `/select-business?callbackUrl=${encodeURIComponent(callbackUrl)}`
        : callbackUrl
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useLoginFlow({ callbackUrl = '/', router, onSuccess }: UseLoginFlowProps = {}) {
    const [isLoading, setIsLoading] = useState(false)
    const [step, setStep] = useState<LoginStep>('identifier')
    const [identifier, setIdentifier] = useState("")
    const [password, setPassword] = useState("")
    const [pin, setPin] = useState("")
    const [otp, setOtp] = useState("")                   // OTP for the verify-otp step
    const [setupToken, setSetupToken] = useState("")     // Short-lived token returned after OTP verify
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isPinLogin, setIsPinLogin] = useState(false)
    const [countries, setCountries] = useState<CountryDetail[]>([])
    const [selectedCountry, setSelectedCountry] = useState<CountryDetail | null>(null)

    // Fetch countries using module-level cache — called lazily on mount
    const loadCountries = useCallback(async () => {
        // Redirect already-authenticated users immediately
        const token = apiClient.getToken()
        if (token && router) {
            router.replace(callbackUrl)
            return
        }
        try {
            const data = await getCountries()
            setCountries(data)
            if (data.length > 0) {
                // 1. Try to restore the last-used login country (exact ID match)
                const savedId = storage.getLoginCountry()
                const saved = savedId ? data.find(c => c.id === savedId) : null

                // 2. Fall back to Nigeria — match by name OR by phone code (+234)
                const nigeria = data.find(c =>
                    c?.name?.toLowerCase()?.includes('nigeria') || c?.phoneCode === '234'
                )

                const defaultCountry = saved ?? nigeria ?? data[0]

                console.log('[useLoginFlow] loadCountries default selection:', {
                    savedId,
                    hasSaved: !!saved,
                    hasNigeria: !!nigeria,
                    finalSelection: defaultCountry?.name
                })

                // Delay the selection state update slightly to ensure React has fully committed
                // the `countries` array to the DOM. If the module cache is instant, 
                // synchronous batching here can cause the selection to be dropped.
                setTimeout(() => {
                    setSelectedCountry(defaultCountry)
                    // 3. Persist immediately so future visits restore via exact ID match
                    if (!savedId && defaultCountry) {
                        storage.setLoginCountry(defaultCountry.id)
                    }
                }, 50)
            }
        } catch {
            toast.error("Failed to load supported countries")
        }
    }, [callbackUrl, router]) // eslint-disable-line react-hooks/exhaustive-deps

    // ── Shared post-login handler ─────────────────────────────────────────────
    const handleAuthSuccess = useCallback((response: LoginResponse) => {
        apiClient.setToken(response.token)

        if (response.user?.setupRequired) {
            setStep('setup-password')
            return
        }

        setStep('success')
        onSuccess?.()

        const businesses = response.user?.businesses ?? []
        if (businesses.length === 1) {
            storage.set(STORAGE_KEYS.ACTIVE_BUSINESS_ID, businesses[0].id)
        }

        if (router) {
            // Navigate immediately — the success step animation provides visual feedback
            router.replace(resolveRedirectUrl(response, callbackUrl))
        }
    }, [callbackUrl, onSuccess, router])

    // ── Step handlers ────────────────────────────────────────────────────────

    const handleIdentifierSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault()
        if (!identifier) return

        setIsLoading(true)
        try {
            const response = await apiClient.post<IdentifyResponse>('/security/identifier', {
                identifier,
                country: selectedCountry?.id
            })

            if (response.exists) {
                if (response.authMethod === 'setup') {
                    setOtp('')   // clear any stale OTP from a previous attempt
                    setStep('verify-otp')
                    // If OTP dispatch degraded (e.g. cache/Redis unavailable), nudge the user to resend
                    if (response.otpSent === false) {
                        toast.info("We couldn't send your code right now. Use the Resend button to try again.")
                    }
                } else {
                    setIsPinLogin(response.authMethod === 'pin')
                    setStep('verify')
                }
            }
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "User not found")
        } finally {
            setIsLoading(false)
        }
    }, [identifier, selectedCountry])

    const handleVerifySubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            const response = await apiClient.post<LoginResponse>('/security/login', {
                identifier,
                [isPinLogin ? 'pin' : 'password']: isPinLogin ? pin : password,
                country: selectedCountry?.id
            })
            handleAuthSuccess(response)
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Authentication failed")
        } finally {
            setIsLoading(false)
        }
    }, [identifier, isPinLogin, pin, password, selectedCountry, handleAuthSuccess])

    // ── OTP verification (gates setup-password for unregistered users) ────────
    const handleOtpSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault()
        if (!otp) return
        setIsLoading(true)
        try {
            const response = await apiClient.post<OtpVerifyResponse>('/security/verify-setup-otp', {
                identifier,
                otp,
                country: selectedCountry?.id
            })
            // Store the short-lived token — required by setup-password to prove ownership
            setSetupToken(response.setupToken)
            setStep('setup-password')
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Invalid or expired code')
        } finally {
            setIsLoading(false)
        }
    }, [identifier, otp, selectedCountry])

    const handleSetupSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault()
        if (newPassword.length < 8) {
            toast.error('Password must be at least 8 characters')
            return
        }
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match')
            return
        }
        setIsLoading(true)
        try {
            const response = await apiClient.post<LoginResponse>('/security/setup-password', {
                identifier,
                password: newPassword,
                setupToken,   // ← proves ownership; API must validate this
                country: selectedCountry?.id
            })
            apiClient.setToken(response.token)
            setStep('success')
            onSuccess?.()

            const businesses = response.user?.businesses ?? []
            if (businesses.length === 1) {
                storage.setActiveBusinessId(businesses[0].id)
            }
            if (router) {
                setTimeout(() => router.replace(resolveRedirectUrl(response, callbackUrl)), 500)
            }
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Failed to set up password')
        } finally {
            setIsLoading(false)
        }
    }, [callbackUrl, confirmPassword, identifier, newPassword, onSuccess, router, selectedCountry, setupToken])

    const backToIdentifier = useCallback(() => setStep('identifier'), [])
    const backToOtp = useCallback(() => setStep('verify-otp'), [])

    // Persist country selection so it survives page refreshes
    const selectCountry = useCallback((country: CountryDetail | null) => {
        setSelectedCountry(country)
        if (country) storage.setLoginCountry(country.id)
    }, [])

    return {
        state: {
            isLoading,
            step,
            identifier,
            password,
            pin,
            otp,
            newPassword,
            confirmPassword,
            showPassword,
            isPinLogin,
            countries,
            selectedCountry,
            isEmail: identifier.includes("@"),
            isPhone: /^\d+$/.test(identifier.replace(/\+/g, "")) && identifier.length >= 7,
        },
        actions: {
            loadCountries,
            setIdentifier,
            setPassword,
            setPin,
            setOtp,
            setNewPassword,
            setConfirmPassword,
            setShowPassword,
            setSelectedCountry: selectCountry,
            handleIdentifierSubmit,
            handleVerifySubmit,
            handleOtpSubmit,
            handleSetupSubmit,
            backToIdentifier,
            backToOtp,
        }
    }
}
