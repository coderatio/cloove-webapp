"use client"

import { Suspense } from "react"
import { AnimatePresence } from "framer-motion"
import { useSearchParams, useRouter } from "next/navigation"
import { useLoginFlow } from "@/app/domains/auth/hooks/use-login-flow"
import { IdentifierStep } from "@/app/domains/auth/components/IdentifierStep"
import { VerifyStep } from "@/app/domains/auth/components/VerifyStep"
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
        <AnimatePresence mode="wait" initial={false}>
            {state.step === 'identifier' && <IdentifierStep key="identifier" flow={flow} />}
            {state.step === 'verify' && <VerifyStep key="verify" flow={flow} />}
            {state.step === 'setup-password' && <SetupPasswordStep key="setup" flow={flow} />}
            {state.step === 'success' && <SuccessStep key="success" />}
        </AnimatePresence>
    )
}

export function LoginFlowWrapper() {
    return (
        <Suspense fallback={
            <div className="h-[400px] flex items-center justify-center text-brand-cream/20 bg-white/5 rounded-3xl border border-white/10">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        }>
            <LoginFlowContainer />
        </Suspense>
    )
}
