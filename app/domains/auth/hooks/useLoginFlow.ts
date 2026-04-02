import { useState, useCallback, useEffect } from "react"
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"
import { apiClient } from "@/app/lib/api-client"
import { storage, STORAGE_KEYS } from "@/app/lib/storage"
import { toast } from "sonner"
import type { LoginStep, CountryDetail, IdentifyResponse, OtpVerifyResponse, LoginResponse } from "../types"
import { useCountries } from "@/app/hooks/useCountries"

// ─── Hook interface ───────────────────────────────────────────────────────────

interface UseLoginFlowProps {
    callbackUrl?: string
    router?: AppRouterInstance
    onSuccess?: () => void | Promise<void>
}

// ─── Shared post-auth routing helper ─────────────────────────────────────────

function resolveRedirectUrl(
    response: LoginResponse,
    callbackUrl: string
): string {
    const businesses = response.user?.businesses ?? []
    const isFieldAgent = !!response.user?.fieldAgent?.isFieldAgent
    const lowerPath = callbackUrl.toLowerCase();

    // Field agent routing — evaluated before business logic
    if (isFieldAgent) {
        // If callback explicitly targets /field/* honor it
        if (lowerPath.startsWith('/field')) return callbackUrl
        // Field agent with no businesses → agent dashboard
        if (businesses.length === 0) return '/field'
        // Dual-role (agent + business owner) → default to agent dashboard for generic paths
        const isGenericPath = lowerPath === '/' || lowerPath === '/login' || lowerPath === '/register' || lowerPath.includes('/select-business')
        if (isGenericPath) return '/field'
    }

    // Explicitly check if they were in the middle of adding a business
    const isAddingBusiness = lowerPath.includes('from=switcher')

    // 1. If no businesses, send to selection (unless they have a specific deep link)
    if (businesses.length === 0) {
        const isAuthPath = lowerPath === '/login' || lowerPath === '/register' || callbackUrl === '/'
        return isAuthPath ? '/select-business' : callbackUrl
    }

    // 2. Identify "Auth/Onboarding landing" paths that should be bypassed if they already have businesses.
    // However, if they were intentionally adding a business (isAddingBusiness), we let them stay.
    // NOTE: We also include '/select-business' here to prevent redirect loops back to selection twice.
    const isAuthPath = lowerPath === '/login' || lowerPath === '/register' || lowerPath.includes('/select-business') || callbackUrl === '/'
    const isGenericOnboarding = lowerPath.startsWith('/onboarding') && !isAddingBusiness

    if (businesses.length === 1) {
        // If they have 1 business and were going to a generic onboarding/auth path, send to dashboard.
        // Otherwise, honor the callbackUrl (e.g. they were adding a business or had a deep link).
        return (isAuthPath || isGenericOnboarding) ? '/' : callbackUrl
    }

    if (businesses.length > 1) {
        // Multiple businesses: always require selection unless they have an intentional deep link
        // that isn't a generic landing page.
        return (isAuthPath || isGenericOnboarding)
            ? `/select-business`
            : `/select-business?callbackUrl=${encodeURIComponent(callbackUrl)}`
    }

    return callbackUrl
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useLoginFlow({ callbackUrl = '/', router, onSuccess }: UseLoginFlowProps = {}) {
    const { data: countriesData, isLoading: isLoadingCountries } = useCountries()
    const countries = countriesData ?? []

    const [isLoading, setIsLoading] = useState(false)
    const [step, setStep] = useState<LoginStep>('identifier')
    const [identifier, setIdentifier] = useState("")
    const [password, setPassword] = useState("")
    const [pin, setPin] = useState("")
    const [otp, setOtp] = useState("")
    const [setupToken, setSetupToken] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isPinLogin, setIsPinLogin] = useState(false)
    const [signupChannel, setSignupChannel] = useState<string | null>(null)
    const [setupVia, setSetupVia] = useState<'otp' | 'email_link' | 'whatsapp_activate' | null>(null)
    const [phoneActivationRequired, setPhoneActivationRequired] = useState(false)
    const [selectedCountry, setSelectedCountry] = useState<CountryDetail | null>(null)

    useEffect(() => {
        if (countries.length === 0) return
        const savedId = storage.getLoginCountry()
        const saved = savedId ? countries.find((c) => c.id === savedId) : null
        const nigeria = countries.find(
            (c) => c?.name?.toLowerCase()?.includes("nigeria") || c?.phoneCode === "234"
        )
        const defaultCountry = saved ?? nigeria ?? countries[0]
        setSelectedCountry(defaultCountry)
        if (!savedId && defaultCountry) {
            storage.setLoginCountry(defaultCountry.id)
        }
    }, [countries, callbackUrl, router])

    // ── Shared post-login handler ─────────────────────────────────────────────
    const handleAuthSuccess = useCallback(async (response: LoginResponse) => {
        if (response.user?.setupRequired) {
            // Capture any setupToken issued by the login endpoint (e.g. PIN login with no password)
            if (response.user.setupToken) {
                setSetupToken(response.user.setupToken)
            }
            setStep('setup-password')
            return
        }

        setStep('success')
        storage.setLastActivity(Date.now())
        await onSuccess?.()

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
        const trimmedIdentifier = identifier.trim()
        if (!trimmedIdentifier) return

        setIsLoading(true)
        try {
            const response = await apiClient.post<IdentifyResponse>('/security/identifier', {
                identifier: trimmedIdentifier,
                country: selectedCountry?.id
            })

            if (response.exists) {
                setSignupChannel(response.signupChannel ?? null)
                setSetupVia(response.setupVia ?? null)
                setPhoneActivationRequired(response.phoneActivationRequired ?? false)
                if (response.authMethod === 'setup') {
                    setOtp('')   // clear any stale OTP from a previous attempt
                    setStep('verify-otp')
                    // If OTP dispatch degraded (e.g. cache/Redis unavailable), nudge the user to resend
                    if (response.setupVia === 'otp' && response.otpSent === false) {
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
                identifier: identifier.trim(),
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
                identifier: identifier.trim(),
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
                identifier: identifier.trim(),
                password: newPassword,
                setupToken,   // ← proves ownership; API must validate this
                country: selectedCountry?.id
            })
            setStep('success')
            storage.setLastActivity(Date.now())
            await onSuccess?.()

            const businesses = response.user?.businesses ?? []
            if (businesses.length === 1) {
                storage.setActiveBusinessId(businesses[0].id)
            }
            if (router) {
                // Navigate immediately — the success step animation provides visual feedback
                router.replace(resolveRedirectUrl(response, callbackUrl))
            }
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Failed to set up password')
        } finally {
            setIsLoading(false)
        }
    }, [callbackUrl, confirmPassword, identifier, newPassword, onSuccess, router, selectedCountry, setupToken])

    const backToIdentifier = useCallback(() => setStep('identifier'), [])
    const backToOtp = useCallback(() => setStep('verify-otp'), [])

    /** Re-trigger OTP dispatch without a form submit event */
    const resendOtp = useCallback(async () => {
        if (!identifier) return
        setIsLoading(true)
        try {
            await apiClient.post<IdentifyResponse>('/security/identifier', {
                identifier,
                country: selectedCountry?.id
            })
            toast.success('A new code has been sent.')
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Failed to resend code')
        } finally {
            setIsLoading(false)
        }
    }, [identifier, selectedCountry])

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
            signupChannel,
            setupVia,
            phoneActivationRequired,
            countries,
            isLoadingCountries,
            selectedCountry,
            isEmail: identifier.includes("@"),
            isPhone: /^\d+$/.test(identifier.replace(/\+/g, "")) && identifier.length >= 7,
        },
        actions: {
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
            resendOtp,
            backToIdentifier,
            backToOtp,
        }
    }
}
