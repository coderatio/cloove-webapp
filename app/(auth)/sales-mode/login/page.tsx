"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef } from "react"
import Image from "next/image"
import { AlertTriangle, ArrowLeft, Delete, Loader2 } from "lucide-react"
import { useSalesModeLogin } from "@/app/domains/auth/hooks/useSalesModeLogin"
import { Button } from "@/app/components/ui/button"
import { GlassCard } from "@/app/components/ui/glass-card"

const BUSINESS_CODE_LENGTH = 8
const SALES_PIN_LENGTH = 4

export default function SalesModeLoginPage() {
    const {
        step,
        businessCode,
        setBusinessCode,
        businessInfo,
        pin,
        setPin,
        isLoading,
        error,
        lookupBusiness,
        loginWithPin,
        changeBusinessCode,
    } = useSalesModeLogin()

    const businessLookupRef = useRef(false)
    const lastSubmittedBusinessCodeRef = useRef<string | null>(null)

    const safeBusinessCode = useMemo(
        () => businessCode.replace(/\D/g, "").slice(0, BUSINESS_CODE_LENGTH),
        [businessCode]
    )
    const safePin = useMemo(
        () => pin.replace(/\D/g, "").slice(0, SALES_PIN_LENGTH),
        [pin]
    )

    const renderPinSlots = (filledCount: number, total: number) => {
        return (
            <span className="inline-flex items-center gap-3" aria-hidden="true">
                {Array.from({ length: total }).map((_, index) => (
                    <span
                        key={index}
                        className={
                            index < filledCount
                                ? "h-2.5 w-2.5 rounded-full bg-brand-cream"
                                : "h-2.5 w-2.5 rounded-full bg-brand-cream/25"
                        }
                    />
                ))}
            </span>
        )
    }

    const appendDigit = (digit: string) => {
        if (pin.length >= SALES_PIN_LENGTH || isLoading) return
        setPin(`${pin}${digit}`)
    }

    const backspace = () => {
        if (!pin.length || isLoading) return
        setPin(pin.slice(0, -1))
    }

    const submitPin = useCallback(async () => {
        if (safePin.length !== SALES_PIN_LENGTH || isLoading) return
        await loginWithPin(safePin)
    }, [isLoading, loginWithPin, safePin])

    useEffect(() => {
        if (step === "pin" && safePin.length === SALES_PIN_LENGTH && !isLoading) {
            void submitPin()
        }
    }, [step, safePin, isLoading, submitPin])

    const appendBusinessDigit = (digit: string) => {
        if (isLoading || safeBusinessCode.length >= BUSINESS_CODE_LENGTH) return
        const next = `${safeBusinessCode}${digit}`
        lastSubmittedBusinessCodeRef.current = null
        setBusinessCode(next)
    }

    const businessBackspace = () => {
        if (isLoading || !safeBusinessCode.length) return
        lastSubmittedBusinessCodeRef.current = null
        setBusinessCode(safeBusinessCode.slice(0, -1))
    }

    const clearBusinessCode = () => {
        if (isLoading) return
        lastSubmittedBusinessCodeRef.current = null
        setBusinessCode("")
    }

    const submitBusinessCode = useCallback(async () => {
        if (
            step !== "business-code" ||
            safeBusinessCode.length !== BUSINESS_CODE_LENGTH ||
            isLoading ||
            businessLookupRef.current ||
            lastSubmittedBusinessCodeRef.current === safeBusinessCode
        ) {
            return
        }

        lastSubmittedBusinessCodeRef.current = safeBusinessCode
        businessLookupRef.current = true
        await lookupBusiness(safeBusinessCode)
        businessLookupRef.current = false
    }, [isLoading, lookupBusiness, safeBusinessCode, step])

    useEffect(() => {
        if (
            step === "business-code" &&
            safeBusinessCode.length === BUSINESS_CODE_LENGTH &&
            !isLoading &&
            !businessLookupRef.current
        ) {
            void submitBusinessCode()
        }
    }, [step, safeBusinessCode, isLoading, submitBusinessCode])

    useEffect(() => {
        const handlePaste = (event: ClipboardEvent) => {
            const text = event.clipboardData?.getData("text") ?? ""
            const digits = text.replace(/\D/g, "")
            if (!digits) return

            event.preventDefault()

            if (step === "business-code") {
                const next = digits.slice(0, BUSINESS_CODE_LENGTH)
                lastSubmittedBusinessCodeRef.current = null
                setBusinessCode(next)
                return
            }

            const nextPin = digits.slice(0, SALES_PIN_LENGTH)
            setPin(nextPin)
        }

        window.addEventListener("paste", handlePaste)
        return () => window.removeEventListener("paste", handlePaste)
    }, [step, setBusinessCode, setPin])

    return (
        <div className="flex min-h-dvh w-full items-center justify-center bg-brand-deep-950 px-4 py-8">
            <div className={step === "pin" ? "w-full max-w-5xl" : "w-full max-w-md"}>
                <GlassCard
                    className={
                        step === "pin"
                            ? "relative overflow-hidden rounded-[28px] border-white/10 bg-white/[0.045] shadow-sm"
                            : "space-y-6 rounded-[28px] border-white/10 bg-white/[0.045] p-5 shadow-sm md:p-6"
                    }
                >
                    {step === "pin" && (
                        <div
                            className="hidden lg:block absolute top-0 bottom-0 left-[42%] w-px bg-white/10 pointer-events-none"
                            aria-hidden="true"
                        />
                    )}

                    {step === "business-code" ? (
                        <>
                            <div className="text-center">
                                <h1 className="text-2xl font-semibold tracking-tight text-white">Sales Mode</h1>
                                <p className="mt-2 text-sm text-white/55">Enter your business code</p>
                            </div>
                            <div className="space-y-5">
                                <button
                                    type="button"
                                    onClick={() => void submitBusinessCode()}
                                    className="flex h-14 w-full items-center justify-center rounded-2xl border border-white/12 bg-white/[0.04] text-white"
                                >
                                    {renderPinSlots(safeBusinessCode.length, BUSINESS_CODE_LENGTH)}
                                </button>

                                <div className="grid grid-cols-3 gap-3">
                                    {[...'123456789'].map((digit) => (
                                        <Button
                                            key={digit}
                                            type="button"
                                            variant="outline"
                                            onClick={() => appendBusinessDigit(digit)}
                                            className="h-14 rounded-2xl border-white/10 bg-white/[0.04] text-lg font-semibold text-white hover:bg-white/[0.08] hover:text-white"
                                        >
                                            {digit}
                                        </Button>
                                    ))}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={clearBusinessCode}
                                        className="h-14 rounded-2xl border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white"
                                    >
                                        Clear
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => appendBusinessDigit("0")}
                                        className="h-14 rounded-2xl border-white/10 bg-white/[0.04] text-lg font-semibold text-white hover:bg-white/[0.08] hover:text-white"
                                    >
                                        0
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={businessBackspace}
                                        className="h-14 rounded-2xl border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white"
                                    >
                                        <Delete className="w-4 h-4" />
                                    </Button>
                                </div>
                                <p className="text-center text-[11px] text-white/50">
                                    Business code is 8 digits. Continue starts automatically.
                                </p>
                                {error && (
                                    <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-3 py-2.5 flex items-start gap-2.5">
                                        <AlertTriangle className="w-4 h-4 mt-0.5 text-red-300 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-semibold text-red-200">Couldn&apos;t verify business code</p>
                                            <p className="text-xs text-red-200/90 leading-relaxed">{error}</p>
                                        </div>
                                    </div>
                                )}
                                {isLoading && (
                                    <div className="flex items-center justify-center gap-2 text-sm text-emerald-300">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Validating business...
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="grid min-h-[520px] h-full items-stretch lg:grid-cols-[0.42fr_0.58fr]">
                            <div className="relative h-full border-b border-white/10 bg-white/[0.025] p-7 lg:border-b-0 lg:p-9">
                                <div className="relative z-10 h-full flex flex-col">
                                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                                        <Image
                                            src="/images/logo-white.png"
                                            alt="Business logo"
                                            width={28}
                                            height={28}
                                            className="object-contain"
                                        />
                                    </div>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
                                        Active Business
                                    </p>
                                    <h2 className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-white lg:text-3xl">
                                        {businessInfo?.businessName ?? "Business"}
                                    </h2>
                                    <p className="mt-3 text-sm text-white/55">
                                        Shared device mode is active. Enter staff PIN to continue selling.
                                    </p>
                                    <div className="mt-auto pt-6">
                                        <button
                                            type="button"
                                            onClick={changeBusinessCode}
                                            className="text-sm text-emerald-300/75 underline underline-offset-4 hover:text-white"
                                        >
                                            Change business
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="h-full p-8 lg:p-10 flex flex-col justify-center">
                                <div className="mb-6 text-center">
                                    <h1 className="text-2xl font-semibold tracking-tight text-white">Sales Mode</h1>
                                    <p className="mt-2 text-sm text-white/55">Enter staff PIN</p>
                                </div>
                                <div className="space-y-5">
                                    <button
                                        type="button"
                                        onClick={submitPin}
                                        className="flex h-12 w-full items-center justify-center rounded-2xl border border-white/12 bg-white/[0.04] text-white"
                                    >
                                        {renderPinSlots(safePin.length, SALES_PIN_LENGTH)}
                                    </button>

                                    <div className="grid grid-cols-3 gap-3">
                                        {[...'123456789'].map((digit) => (
                                            <Button
                                                key={digit}
                                                type="button"
                                                variant="outline"
                                                onClick={() => appendDigit(digit)}
                                                className="h-14 rounded-2xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white"
                                            >
                                                {digit}
                                            </Button>
                                        ))}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-14 rounded-2xl border-white/10 bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white"
                                            disabled
                                        >
                                            .
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => appendDigit("0")}
                                            className="h-14 rounded-2xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white"
                                        >
                                            0
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={backspace}
                                            className="h-14 rounded-2xl border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white"
                                        >
                                            <Delete className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <p className="text-center text-[11px] text-white/50">
                                        Enter your access code to login.
                                    </p>
                                    {error && (
                                        <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-3 py-2.5 flex items-start gap-2.5">
                                            <AlertTriangle className="w-4 h-4 mt-0.5 text-red-300 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-semibold text-red-200">PIN login failed</p>
                                                <p className="text-xs text-red-200/90 leading-relaxed">{error}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={step === "pin" ? "px-6 pb-6" : ""}>
                        <Link href="/login" className="inline-flex items-center text-xs text-emerald-300/75 hover:text-white">
                            <ArrowLeft className="w-3 h-3 mr-1.5" />
                            Back to Login
                        </Link>
                    </div>
                </GlassCard>
            </div>
        </div>
    )
}
