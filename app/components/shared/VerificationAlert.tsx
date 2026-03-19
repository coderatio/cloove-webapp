"use client"

import { AlertCircle, ExternalLink } from "lucide-react"
import { useAuth } from "@/app/components/providers/auth-provider"
import { cn } from "@/app/lib/utils"
import { apiClient } from "@/app/lib/api-client"
import { toast } from "sonner"
import { useRef, useState } from "react"

const WHATSAPP_BOT_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER?.replace(/\D/g, "") ?? ""

function buildWhatsAppUrl(): string {
    if (!WHATSAPP_BOT_NUMBER) return ""
    const text = encodeURIComponent("Hi")

    return `https://wa.me/${WHATSAPP_BOT_NUMBER}${text ? `?text=${text}` : ""}`
}

export function VerificationAlert() {
    const { user } = useAuth()
    const [emailSent, setEmailSent] = useState(false)
    const pendingRef = useRef(false)

    if (!user) return null

    const needsEmailVerify = user.email && user.emailVerified === false
    const needsPhoneVerify = user.phoneNumber && user.phoneVerified === false
    if (!needsEmailVerify && !needsPhoneVerify) return null

    const whatsAppUrl = buildWhatsAppUrl()

    const handleResendEmail = () => {
        if (pendingRef.current) return
        pendingRef.current = true

        toast.promise(
            apiClient.post("/security/resend-verification-email", {}).then((data) => {
                setEmailSent(true)
                return data
            }).finally(() => {
                pendingRef.current = false
            }),
            {
                loading: "Sending verification email...",
                success: "Verification email sent! Check your inbox.",
                error: (err) => err?.message || "Failed to send verification email. Try again later.",
                position: "top-center",
            }
        )
    }

    return (
        <div
            role="alert"
            className="mb-8 rounded-3xl border border-brand-gold/30 bg-brand-gold/5 dark:bg-brand-gold/10 px-6 py-4 flex items-center gap-4 shadow-xl shadow-brand-gold/5 backdrop-blur-md transition-all duration-300 group hover:border-brand-gold/50"
        >
            <AlertCircle
                className="w-5 h-5 text-brand-gold-600 dark:text-brand-gold-400 shrink-0 group-hover:scale-110 transition-transform duration-300"
                aria-hidden
            />
            <div className="min-w-0 flex-1">
                {needsEmailVerify && (
                    <p className="text-sm font-medium text-brand-deep-800 dark:text-brand-cream">
                        {emailSent ? (
                            "Verification email sent! Check your inbox."
                        ) : (
                            <>
                                Verify your email for full access.{" "}
                                <button
                                    onClick={handleResendEmail}
                                    className="underline font-semibold text-brand-deep-600 dark:text-brand-gold hover:text-brand-deep-800 dark:hover:text-brand-gold-300 cursor-pointer"
                                >
                                    Verify now
                                </button>
                            </>
                        )}
                    </p>
                )}
                {needsPhoneVerify && (
                    <p className="text-sm font-medium text-brand-deep-800 dark:text-brand-cream">
                        Send a WhatsApp message to our Bot to verify your phone number.
                    </p>
                )}
            </div>
            {needsPhoneVerify && whatsAppUrl && (
                <a
                    href={whatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open in WhatsApp"
                    className={cn(
                        "shrink-0 rounded-xl p-2",
                        "bg-brand-green-600/20 dark:bg-brand-green-600/10",
                        "text-brand-green-600 dark:text-brand-green-600",
                        "hover:bg-brand-green-600/30 dark:hover:bg-brand-green-600/20",
                        "active:scale-95 transition-all duration-200"
                    )}
                >
                    <ExternalLink className="w-5 h-5" aria-hidden />
                </a>
            )}
        </div>
    )
}
