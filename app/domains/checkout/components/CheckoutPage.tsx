"use client"

import { useState, useCallback } from "react"
import { useCheckoutData, useCheckoutSSE } from "../hooks/useCheckout"
import type { CheckoutStep, BankTransferData } from "../types"
import { CheckoutDetailsStep } from "./CheckoutDetailsStep"
import { CheckoutPaymentStep } from "./CheckoutPaymentStep"
import { CheckoutSuccessStep } from "./CheckoutSuccessStep"
import { CheckoutExpired } from "./CheckoutExpired"
import { CheckoutSkeleton } from "./CheckoutSkeleton"
import { CheckoutWalletStep } from "./CheckoutWalletStep"

interface Props {
  reference: string
}

export function CheckoutPage({ reference }: Props) {
  const { data: checkout, isPending, error } = useCheckoutData(reference)
  const [step, setStep] = useState<CheckoutStep>('details')
  const [bankTransfer, setBankTransfer] = useState<BankTransferData | null>(null)
  const [sessionId, setSessionId] = useState<string | undefined>()
  const [paidAmount, setPaidAmount] = useState<number>(0)

  const handlePaid = useCallback(() => {
    setStep('success')
  }, [])

  // Only connect SSE when in payment step
  useCheckoutSSE(
    step === 'payment' ? reference : '',
    handlePaid,
    sessionId
  )

  if (isPending) return <CheckoutSkeleton />
  if (error || !checkout) {
    return <CheckoutExpired message={error?.message || "This payment link is invalid or has expired."} />
  }
  if (checkout.isPaid) return <CheckoutSuccessStep businessName={checkout.businessName} businessLogo={checkout.businessLogo} amount={checkout.amount || 0} currency={checkout.businessCurrency} />
  if (checkout.isExpired) return <CheckoutExpired message="This payment link has expired." />

  // Wallet links show deposit accounts directly — no multi-step flow
  if (checkout.targetType === 'WALLET' && checkout.depositAccounts) {
    return <CheckoutWalletStep checkout={checkout} />
  }

  if (step === 'success') {
    return <CheckoutSuccessStep businessName={checkout.businessName} businessLogo={checkout.businessLogo} amount={paidAmount || checkout.amount || 0} currency={checkout.businessCurrency} />
  }

  if (step === 'payment' && bankTransfer) {
    return (
      <CheckoutPaymentStep
        bankTransfer={bankTransfer}
        reference={reference}
        sessionId={sessionId}
        businessName={checkout.businessName}
        businessLogo={checkout.businessLogo}
        currency={checkout.businessCurrency}
        onPaid={handlePaid}
        onBack={() => setStep('details')}
      />
    )
  }

  return (
    <CheckoutDetailsStep
      checkout={checkout}
      reference={reference}
      onBankTransferReady={(data, sid) => {
        setBankTransfer(data)
        setSessionId(sid)
        setPaidAmount(data.subtotal)
        setStep('payment')
      }}
    />
  )
}
