"use client"

import { Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useLoginFlow } from "@/app/domains/auth/hooks/useLoginFlow"
import { IdentifierStep } from "@/app/domains/auth/components/IdentifierStep"
import { VerifyStep } from "@/app/domains/auth/components/VerifyStep"
import { VerifyOtpStep } from "@/app/domains/auth/components/VerifyOtpStep"
import { SetupPasswordStep } from "@/app/domains/auth/components/SetupPasswordStep"
import { SuccessStep } from "@/app/domains/auth/components/SuccessStep"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/app/components/providers/auth-provider"

export function LoginFlowContainer() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { refreshUser } = useAuth()
    const callbackUrl = searchParams.get("callbackUrl") || "/"

    const flow = useLoginFlow({ callbackUrl, router, onSuccess: refreshUser })
    const { state } = flow

    return (
        <>
            {state.step === 'identifier' ? <IdentifierStep key="identifier" flow={flow} /> : null}
            {state.step === 'verify' ? <VerifyStep key="verify" flow={flow} /> : null}
            {state.step === 'verify-otp' ? <VerifyOtpStep key="verify-otp" flow={flow} /> : null}
            {state.step === 'setup-password' ? <SetupPasswordStep key="setup" flow={flow} /> : null}
            {state.step === 'success' ? <SuccessStep key="success" /> : null}
        </>
    )
}

export function LoginFlowWrapper() {
    return (
        <Suspense fallback={
            <div className="flex h-64 items-center justify-center rounded-[28px] border border-white/10 bg-white/[0.04] text-white/40">
                <Loader2 className="h-5 w-5 animate-spin" />
            </div>
        }>
            <LoginFlowContainer />
        </Suspense>
    )
}
