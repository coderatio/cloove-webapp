import { useState, useEffect, useCallback } from "react"
import { apiClient } from "@/app/lib/api-client"
import { storage, STORAGE_KEYS } from "@/app/lib/storage"
import { toast } from "sonner"
import type { LoginStep, CountryDetail, IdentifyResponse, LoginResponse } from "../types"

interface UseLoginFlowProps {
    callbackUrl?: string
    router?: any
    onSuccess?: () => void
}

export function useLoginFlow({ callbackUrl = '/', router, onSuccess }: UseLoginFlowProps = {}) {
    const [isLoading, setIsLoading] = useState(false)
    const [step, setStep] = useState<LoginStep>('identifier')
    const [identifier, setIdentifier] = useState("")
    const [password, setPassword] = useState("")
    const [pin, setPin] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isPinLogin, setIsPinLogin] = useState(false)
    const [countries, setCountries] = useState<CountryDetail[]>([])
    const [selectedCountry, setSelectedCountry] = useState<CountryDetail | null>(null)

    // Initial auth check - skip if we're already in a login flow beyond the first step
    useEffect(() => {
        if (step !== 'identifier') return

        const token = apiClient.getToken()
        if (token && router) {
            router.replace(callbackUrl)
        }
    }, [callbackUrl, router, step])

    // Fetch countries on mount
    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const data = await apiClient.get<CountryDetail[]>('/security/countries')
                setCountries(data)
                if (data.length > 0) {
                    setSelectedCountry(data[0])
                }
            } catch (error) {
                console.error("Failed to fetch countries:", error)
                toast.error("Failed to load supported countries")
            }
        }
        fetchCountries()
    }, [])

    const isEmail = identifier.includes("@")
    const isPhone = /^\d+$/.test(identifier.replace(/\+/g, "")) && identifier.length >= 7

    const handleIdentifierSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault()
        if (!identifier) return

        setIsLoading(true)
        try {
            const response = await apiClient.post<IdentifyResponse>('/security/identifier', {
                identifier,
                country: selectedCountry?.id
            })

            if (response.exists) {
                setIsPinLogin(response.authMethod === 'pin')
                setStep('verify')
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "User not found"
            toast.error(message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleVerifySubmit = async (e: React.SubmitEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const response = await apiClient.post<LoginResponse>('/security/login', {
                identifier,
                [isPinLogin ? 'pin' : 'password']: isPinLogin ? pin : password,
                country: selectedCountry?.id
            })

            apiClient.setToken(response.token)

            if (response.user?.setupRequired) {
                setStep('setup-password')
            } else {
                setStep('success')

                // Refresh global auth state
                if (onSuccess) onSuccess()

                // Set active business if there's only one
                const businesses = response.user?.businesses || []
                if (businesses.length === 1) {
                    storage.set(STORAGE_KEYS.ACTIVE_BUSINESS_ID, businesses[0].id)
                }

                if (router) {
                    setTimeout(() => {
                        // If multiple businesses, go to selection, otherwise dashboard
                        const finalUrl = businesses.length > 1
                            ? `/select-business?callbackUrl=${encodeURIComponent(callbackUrl)}`
                            : callbackUrl
                        router.replace(finalUrl)
                    }, 1500)
                }
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Authentication failed"
            toast.error(message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSetupSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            // Mocking setup for now
            await new Promise(resolve => setTimeout(resolve, 1000))
            setStep('success')
            if (router) {
                setTimeout(() => {
                    router.replace(callbackUrl)
                }, 1500)
            }
        } finally {
            setIsLoading(false)
        }
    }

    const backToIdentifier = () => setStep('identifier')

    return {
        state: {
            isLoading,
            step,
            identifier,
            password,
            pin,
            newPassword,
            confirmPassword,
            showPassword,
            isPinLogin,
            countries,
            selectedCountry,
            isEmail,
            isPhone
        },
        actions: {
            setIdentifier,
            setPassword,
            setPin,
            setNewPassword,
            setConfirmPassword,
            setShowPassword,
            setSelectedCountry,
            handleIdentifierSubmit,
            handleVerifySubmit,
            handleSetupSubmit,
            backToIdentifier
        }
    }
}
