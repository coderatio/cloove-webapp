"use client"

import Image from "next/image"
import { HugeiconsIcon } from "@hugeicons/react"
import { Loading03Icon as Loader2, SecurityWarningIcon as ShieldAlert, Store01Icon as Store } from "@hugeicons/core-free-icons"
import dynamic from "next/dynamic"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { LoginSignupLink } from "@/app/domains/auth/components/LoginSignupLink"
import { Button } from "@/app/components/ui/button"

// 1. Background elements as stable divs to avoid framer-motion SSR mismatches
function BackgroundDecor() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(18,87,65,0.28),transparent_42%),linear-gradient(180deg,#061a14_0%,#03100c_100%)]" />
        </div>
    )
}

const LoginFlowWrapper = dynamic(
    () => import("@/app/domains/auth/components/LoginFlowContainer").then(mod => mod.LoginFlowWrapper),
    {
        ssr: false,
        loading: () => (
            <div className="flex h-64 items-center justify-center rounded-[28px] border border-white/10 bg-white/[0.04] text-white/40">
                <HugeiconsIcon icon={Loader2} className="h-5 w-5 animate-spin" />
            </div>
        )
    }
)

export default function LoginPage() {
    const searchParams = useSearchParams()
    const isSessionExpired = searchParams.get('reason') === 'session_expired'

    return (
        <div className="relative flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden bg-brand-deep-950 px-4 py-8">
            <BackgroundDecor />
            <div className="relative z-10 w-full max-w-[420px]">
                {isSessionExpired && (
                    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3">
                        <HugeiconsIcon icon={ShieldAlert} className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                        <div>
                            <p className="text-sm font-semibold text-amber-200">Session expired</p>
                            <p className="mt-0.5 text-xs text-amber-300/70">
                                You were logged out due to inactivity. Please sign in again to continue.
                            </p>
                        </div>
                    </div>
                )}

                <div className="mb-6 flex flex-col items-center">
                    <div className="relative mb-3 h-11 w-11">
                        <Image
                            src="/images/logo-white.png"
                            alt="Cloove"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <h1 className="text-center text-2xl font-semibold tracking-tight text-white">
                        Welcome back
                    </h1>
                    <p className="mt-1 text-center text-sm text-white/55">
                        Sign in to continue to Cloove.
                    </p>
                </div>

                <div>
                    <LoginFlowWrapper />
                </div>

                <div className="mt-3">
                    <Link href="/sales-mode/login" className="block">
                        <Button
                            variant="outline"
                            className="h-11 w-full rounded-2xl border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.06] hover:text-white"
                        >
                            <HugeiconsIcon icon={Store} className="w-4 h-4 mr-2" />
                            Sales Mode
                        </Button>
                    </Link>
                </div>

                <LoginSignupLink />
            </div>
        </div>
    )
}
