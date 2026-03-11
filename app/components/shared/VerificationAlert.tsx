"use client"

import Link from "next/link"
import { AlertCircle, MessageCircle } from "lucide-react"
import { useAuth } from "@/app/components/providers/auth-provider"
import { cn } from "@/app/lib/utils"

const WHATSAPP_BOT_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER?.replace(/\D/g, "") ?? ""

function buildWhatsAppUrl(): string {
    if (!WHATSAPP_BOT_NUMBER) return ""
    const text = encodeURIComponent("Hi")
    return `https://wa.me/${WHATSAPP_BOT_NUMBER}${text ? `?text=${text}` : ""}`
}

export function VerificationAlert() {
    const { user } = useAuth()
    if (!user) return null

    const needsEmailVerify = user.email && user.emailVerified === false
    const needsPhoneVerify = user.phoneNumber && user.phoneVerified === false
    if (!needsEmailVerify && !needsPhoneVerify) return null

    const whatsAppUrl = buildWhatsAppUrl()

    return (
        <div
            role="alert"
            className="mb-4 rounded-2xl border-2 border-brand-gold/50 bg-brand-gold-100 dark:bg-brand-gold-950/40 px-4 py-3.5 flex items-center gap-3 shadow-sm"
        >
            <AlertCircle
                className="w-5 h-5 text-brand-gold-600 dark:text-brand-gold shrink-0"
                aria-hidden
            />
            <div className="min-w-0 flex-1">
                {needsEmailVerify && (
                    <p className="text-sm font-medium text-brand-deep-800 dark:text-brand-cream">
                        Verify your email for full access.{" "}
                        <Link
                            href="/verify/email"
                            className="underline font-semibold text-brand-deep-600 dark:text-brand-gold hover:text-brand-deep-800 dark:hover:text-brand-gold-300"
                        >
                            Verify now
                        </Link>
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
                    <MessageCircle className="w-5 h-5" aria-hidden />
                </a>
            )}
        </div>
    )
}
