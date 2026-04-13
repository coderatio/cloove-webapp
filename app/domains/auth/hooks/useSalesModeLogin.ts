"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/app/lib/api-client"
import { storage, STORAGE_KEYS } from "@/app/lib/storage"

export type SalesModeLoginStep = "business-code" | "pin"
const SALES_PIN_LENGTH = 4

interface BusinessLookupData {
    businessId: string
    businessName: string
}

export function useSalesModeLogin() {
    // If we have a saved business code, start at PIN entry directly
    const savedCode = typeof window !== "undefined" ? storage.getSalesModeBusinessCode() : null
    const savedName = typeof window !== "undefined" ? storage.getSalesModeBusinessName() : null

    const [step, setStep] = useState<SalesModeLoginStep>(
        savedCode ? "pin" : "business-code"
    )
    const [businessCode, setBusinessCode] = useState(savedCode ?? "")
    const [businessInfo, setBusinessInfo] = useState<BusinessLookupData | null>(
        savedCode && savedName ? { businessId: "", businessName: savedName } : null
    )
    const [pin, setPin] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    function updateBusinessCode(nextCode: string) {
        setBusinessCode(nextCode)
        if (error) setError(null)
    }


    const router = useRouter()

    /** Step 1: Look up the business by code */
    async function lookupBusiness(code: string) {
        setError(null)
        setIsLoading(true)
        try {
            const data = await apiClient.post<BusinessLookupData>(
                "/security/sales-mode/lookup",
                { businessCode: code.trim().toUpperCase() }
            )
            // Save to device so next visit skips straight to PIN
            storage.setSalesModeBusinessCode(code.trim().toUpperCase())
            storage.setSalesModeBusinessName(data.businessName)
            setBusinessCode(code.trim().toUpperCase())
            setBusinessInfo(data)
            setStep("pin")
        } catch (err: any) {
            setBusinessCode("")
            if (err?.statusCode === 404) {
                setError("Business not found, or Sales Mode is not available for this account.")
            } else {
                setError("Something went wrong. Please try again.")
            }
        } finally {
            setIsLoading(false)
        }
    }

    /** Step 2: Authenticate with PIN */
    async function loginWithPin(enteredPin: string) {
        if (!/^\d{4}$/.test(enteredPin) || enteredPin.length !== SALES_PIN_LENGTH) {
            setError("PIN must be exactly 4 digits.")
            return
        }

        setError(null)
        setIsLoading(true)
        try {
            await apiClient.post(
                "/security/sales-mode/login",
                { businessCode: businessCode.trim().toUpperCase(), pin: enteredPin }
            )
            storage.set(STORAGE_KEYS.SALES_MODE_ACTIVE, "true")
            // Force full navigation so app providers re-hydrate from auth cookie immediately.
            // Client-side replace can keep stale in-memory auth state and trigger AuthGuard redirect.
            window.location.href = "/sales-mode/pos"
        } catch (err: any) {
            if (err?.statusCode === 429) {
                setError(err.message ?? "Too many attempts. Please wait before trying again.")
            } else if (err?.statusCode === 401) {
                setError("Incorrect PIN. Please try again.")
            } else {
                setError("Something went wrong. Please try again.")
            }
            setPin("")
        } finally {
            setIsLoading(false)
        }
    }

    /** Go back to business code entry (change business) */
    function changeBusinessCode() {
        storage.clearSalesModeDevice()
        setBusinessCode("")
        setBusinessInfo(null)
        setPin("")
        setError(null)
        setStep("business-code")
    }

    return {
        step,
        businessCode,
        setBusinessCode: updateBusinessCode,
        businessInfo,
        pin,
        setPin,
        isLoading,
        error,
        lookupBusiness,
        loginWithPin,
        changeBusinessCode,
    }
}
