"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/app/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { Loading03Icon as Loader2, CheckmarkCircle02Icon as CheckCircle2, CancelCircleIcon as XCircle, ArrowRight01Icon as ArrowRight } from "@hugeicons/core-free-icons"
import { useVerifyPayment } from "../../domains/business/hooks/useBilling"
import { useAuth } from "@/app/components/providers/auth-provider"
import { toast } from "sonner"

export default function SubscriptionVerifyPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { mutate: verifyPayment } = useVerifyPayment()
    const { refreshUser } = useAuth()

    const transaction_id = searchParams.get("transaction_id")
    const tx_ref = searchParams.get("tx_ref")
    const hasVerificationParams = Boolean(transaction_id && tx_ref)

    const [status, setStatus] = useState<"verifying" | "success" | "error">(
        hasVerificationParams ? "verifying" : "error"
    )

    // Verify exactly once per tx_ref. Guards against React StrictMode's
    // double-invoked effect (dev) and any re-render that changes a dependency's
    // identity, so the backend never receives a duplicate verify request.
    const verifiedRef = useRef<string | null>(null)

    useEffect(() => {
        if (!transaction_id || !tx_ref) return
        if (verifiedRef.current === tx_ref) return
        verifiedRef.current = tx_ref
        verifyPayment(
            { transaction_id, tx_ref },
            {
                onSuccess: async (data) => {
                    if (data.success) {
                        setStatus("success")
                        toast.success("Payment verified successfully!")
                        await refreshUser()
                    } else {
                        setStatus("error")
                        toast.error(data.message || "Verification failed")
                    }
                },
                onError: (error: unknown) => {
                    setStatus("error")
                    toast.error(error instanceof Error ? error.message : "An error occurred during verification")
                }
            }
        )
    }, [transaction_id, tx_ref, refreshUser, verifyPayment])

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
            <div className="w-full max-w-md space-y-6 rounded-[28px] border border-border bg-card p-6 text-center shadow-sm sm:p-8">
                {status === "verifying" && (
                    <>
                        <div className="flex justify-center">
                            <HugeiconsIcon icon={Loader2} className="h-10 w-10 animate-spin text-primary" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Verifying payment</h1>
                            <p className="text-sm text-muted-foreground">
                                Please wait while we confirm your transaction...
                            </p>
                        </div>
                    </>
                )}

                {status === "success" && (
                    <>
                        <div className="flex justify-center">
                            <HugeiconsIcon icon={CheckCircle2} className="h-12 w-12 text-emerald-500" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Payment successful</h1>
                            <p className="text-sm text-muted-foreground">
                                Your subscription has been activated. Welcome to the next level of Cloove.
                            </p>
                        </div>
                        <Button
                            className="h-12 w-full rounded-2xl bg-primary font-semibold text-white hover:bg-primary/92 hover:text-white"
                            onClick={() => router.push("/settings?tab=billing")}
                        >
                            Go to Billing
                            <HugeiconsIcon icon={ArrowRight} className="w-4 h-4 ml-2" />
                        </Button>
                    </>
                )}

                {status === "error" && (
                    <>
                        <div className="flex justify-center">
                            <HugeiconsIcon icon={XCircle} className="h-12 w-12 text-red-500" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Verification failed</h1>
                            <p className="text-sm text-muted-foreground">
                                We couldn&apos;t verify your payment. If you believe this is an error, please contact support.
                            </p>
                        </div>
                        <div className="space-y-3 pt-4">
                            <Button
                                className="h-12 w-full rounded-2xl bg-primary font-semibold text-white hover:bg-primary/92 hover:text-white"
                                onClick={() => router.push("/settings?tab=billing")}
                            >
                                Back to Billing
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
