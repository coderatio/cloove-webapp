"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef } from "react"
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

    const maskedPin = useMemo(() => "•".repeat(pin.length), [pin])
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

    const submitPin = async () => {
        if (safePin.length !== SALES_PIN_LENGTH || isLoading) return
        await loginWithPin(safePin)
    }

    useEffect(() => {
        if (step === "pin" && safePin.length === SALES_PIN_LENGTH && !isLoading) {
            void submitPin()
        }
    }, [step, safePin, isLoading])

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

    const submitBusinessCode = async () => {
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
    }

    useEffect(() => {
        if (
            step === "business-code" &&
            safeBusinessCode.length === BUSINESS_CODE_LENGTH &&
            !isLoading &&
            !businessLookupRef.current
        ) {
            void submitBusinessCode()
        }
    }, [step, safeBusinessCode, isLoading])

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
        <div className="min-h-dvh w-full flex items-center justify-center p-4 bg-brand-deep-950">
            <div className={step === "pin" ? "w-full max-w-5xl" : "w-full max-w-md"}>
                <GlassCard
                    className={
                        step === "pin"
                            ? "relative border-white/10 bg-white/5 shadow-2xl shadow-black/20 overflow-hidden"
                            : "p-6 md:p-8 border-white/10 bg-white/5 space-y-6 shadow-2xl shadow-black/20"
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
                                <h1 className="font-serif text-3xl text-brand-cream">Sales Mode</h1>
                                <p className="text-sm text-brand-cream/60 mt-2">Enter your business code</p>
                            </div>
                            <div className="space-y-5">
                                <button
                                    type="button"
                                    onClick={() => void submitBusinessCode()}
                                    className="w-full h-14 rounded-2xl bg-black/20 border border-white/20 text-brand-cream flex items-center justify-center"
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
                                            className="h-16 rounded-2xl border-white/20 bg-white/5 text-brand-cream text-lg font-semibold hover:bg-white/15 hover:text-brand-cream"
                                        >
                                            {digit}
                                        </Button>
                                    ))}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={clearBusinessCode}
                                        className="h-16 rounded-2xl border-white/20 bg-white/5 text-brand-cream hover:bg-white/15 hover:text-brand-cream"
                                    >
                                        Clear
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => appendBusinessDigit("0")}
                                        className="h-16 rounded-2xl border-white/20 bg-white/5 text-brand-cream text-lg font-semibold hover:bg-white/15 hover:text-brand-cream"
                                    >
                                        0
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={businessBackspace}
                                        className="h-16 rounded-2xl border-white/20 bg-white/5 text-brand-cream hover:bg-white/15 hover:text-brand-cream"
                                    >
                                        <Delete className="w-4 h-4" />
                                    </Button>
                                </div>
                                <p className="text-center text-[11px] text-brand-cream/60">
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
                                    <div className="flex items-center justify-center text-brand-gold text-sm gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Validating business...
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="grid lg:grid-cols-[0.42fr_0.58fr] min-h-[560px] h-full items-stretch">
                            <div className="relative h-full p-8 lg:p-10 border-b lg:border-b-0 border-white/10 bg-linear-to-b from-brand-gold/10 via-white/0 to-transparent">
                                <div className="absolute inset-0 pointer-events-none opacity-40">
                                    <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-brand-gold/20 blur-3xl" />
                                    <div className="absolute -bottom-16 -right-10 h-52 w-52 rounded-full bg-brand-green/20 blur-3xl" />
                                </div>
                                <div className="relative z-10 h-full flex flex-col">
                                    <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center mb-6">
                                        <Image
                                            src="/images/logo-white.png"
                                            alt="Business logo"
                                            width={28}
                                            height={28}
                                            className="object-contain"
                                        />
                                    </div>
                                    <p className="text-[10px] uppercase tracking-[0.2em] text-brand-gold/80 font-bold">
                                        Active Business
                                    </p>
                                    <h2 className="mt-2 text-2xl lg:text-3xl font-serif text-brand-cream leading-tight">
                                        {businessInfo?.businessName ?? "Business"}
                                    </h2>
                                    <p className="text-sm text-brand-cream/60 mt-3">
                                        Shared device mode is active. Enter staff PIN to continue selling.
                                    </p>
                                    <div className="mt-auto pt-6">
                                        <button
                                            type="button"
                                            onClick={changeBusinessCode}
                                            className="text-sm text-brand-gold hover:text-brand-gold/80 underline underline-offset-4"
                                        >
                                            Change business
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="h-full p-8 lg:p-10 flex flex-col justify-center">
                                <div className="text-center mb-6">
                                    <h1 className="font-serif text-3xl text-brand-cream">Sales Mode</h1>
                                    <p className="text-sm text-brand-cream/60 mt-2">Enter staff PIN</p>
                                </div>
                                <div className="space-y-5">
                                    <button
                                        type="button"
                                        onClick={submitPin}
                                        className="w-full h-12 rounded-xl bg-white/10 border border-white/20 text-brand-cream flex items-center justify-center"
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
                                                className="h-14 rounded-xl border-white/20 text-brand-cream hover:bg-white/15 hover:text-brand-cream"
                                            >
                                                {digit}
                                            </Button>
                                        ))}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-14 rounded-xl border-white/20 text-brand-cream hover:bg-white/15 hover:text-brand-cream"
                                            disabled
                                        >
                                            .
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => appendDigit("0")}
                                            className="h-14 rounded-xl border-white/20 text-brand-cream hover:bg-white/15 hover:text-brand-cream"
                                        >
                                            0
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={backspace}
                                            className="h-14 rounded-xl border-white/20 text-brand-cream hover:bg-white/15 hover:text-brand-cream"
                                        >
                                            <Delete className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <p className="text-center text-[11px] text-brand-cream/60">
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
                        <Link href="/login" className="inline-flex items-center text-xs text-brand-gold/80 hover:text-brand-gold">
                            <ArrowLeft className="w-3 h-3 mr-1.5" />
                            Back to Login
                        </Link>
                    </div>
                </GlassCard>
            </div>
        </div>
    )
}
