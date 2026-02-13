"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Button } from "@/app/components/ui/button"
import { Loader2, CheckCircle2, XCircle, ArrowRight } from "lucide-react"
import { useVerifyPayment } from "../../domains/business/hooks/useBilling"
import { toast } from "sonner"

export default function SubscriptionVerifyPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const verifyPayment = useVerifyPayment()
    const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying")

    const transaction_id = searchParams.get("transaction_id")
    const tx_ref = searchParams.get("tx_ref")

    useEffect(() => {
        if (!transaction_id || !tx_ref) {
            setStatus("error")
            return
        }

        verifyPayment.mutate(
            { transaction_id, tx_ref },
            {
                onSuccess: (data) => {
                    if (data.success) {
                        setStatus("success")
                        toast.success("Payment verified successfully!")
                    } else {
                        setStatus("error")
                        toast.error(data.message || "Verification failed")
                    }
                },
                onError: (error: any) => {
                    setStatus("error")
                    toast.error(error.message || "An error occurred during verification")
                }
            }
        )
    }, [transaction_id, tx_ref])

    return (
        <div className="min-h-screen bg-brand-cream dark:bg-brand-deep flex items-center justify-center p-4">
            <GlassCard className="max-w-md w-full p-8 text-center space-y-6">
                {status === "verifying" && (
                    <>
                        <div className="flex justify-center">
                            <Loader2 className="w-12 h-12 text-brand-gold animate-spin" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-serif text-brand-deep dark:text-brand-cream">Verifying Payment</h1>
                            <p className="text-sm text-brand-deep/60 dark:text-brand-cream/60">
                                Please wait while we confirm your transaction...
                            </p>
                        </div>
                    </>
                )}

                {status === "success" && (
                    <>
                        <div className="flex justify-center">
                            <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-serif text-brand-deep dark:text-brand-cream">Payment Successful!</h1>
                            <p className="text-sm text-brand-deep/60 dark:text-brand-cream/60">
                                Your subscription has been activated. Welcome to the next level of Cloove.
                            </p>
                        </div>
                        <Button
                            className="w-full h-12 rounded-xl font-bold bg-brand-deep dark:bg-brand-gold text-brand-gold dark:text-brand-deep"
                            onClick={() => router.push("/settings?tab=billing")}
                        >
                            Go to Billing
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </>
                )}

                {status === "error" && (
                    <>
                        <div className="flex justify-center">
                            <XCircle className="w-16 h-16 text-red-500" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-serif text-brand-deep dark:text-brand-cream">Verification Failed</h1>
                            <p className="text-sm text-brand-deep/60 dark:text-brand-cream/60">
                                We couldn't verify your payment. If you believe this is an error, please contact support.
                            </p>
                        </div>
                        <div className="space-y-3 pt-4">
                            <Button
                                className="w-full h-12 rounded-xl font-bold"
                                onClick={() => router.push("/settings?tab=billing")}
                            >
                                Back to Billing
                            </Button>
                        </div>
                    </>
                )}
            </GlassCard>
        </div>
    )
}
