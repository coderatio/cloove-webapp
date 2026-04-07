"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Copy, Check, RefreshCw, ArrowLeft, Building2, Clock, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { formatCurrency } from "@/app/lib/formatters"
import { CurrencyText } from "@/app/components/shared/CurrencyText"
import { Button } from "@/app/components/ui/button"
import { CurrencyDisplay } from "@/app/components/shared/CurrencyDisplay"
import { CheckoutBusinessHeader } from "./CheckoutBusinessHeader"
import type { BankTransferData } from "../types"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || ""

function getApiUrl(path: string): string {
  if (API_BASE.startsWith('http')) return `${API_BASE}${path}`
  return `/api${path}`
}

interface Props {
  bankTransfer: BankTransferData
  reference: string
  sessionId?: string
  businessName: string
  businessLogo?: string | null
  currency: string
  financialSummary?: {
    totalAmount: number
    amountPaid: number
    amountDue: number
  } | null
  academicContext?: {
    academicYear: string
    term: string
  } | null
  onPaid: () => void
  onBack: () => void
}

export function CheckoutPaymentStep({
  bankTransfer,
  reference,
  sessionId,
  businessName,
  businessLogo,
  currency,
  financialSummary,
  academicContext,
  onPaid,
  onBack,
}: Props) {
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    const expiresAt = new Date(bankTransfer.expiresAt).getTime()
    const update = () => {
      const now = Date.now()
      const remaining = Math.max(0, expiresAt - now)
      setTimeLeft(remaining)
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [bankTransfer.expiresAt])

  const minutes = Math.floor(timeLeft / 60000)
  const seconds = Math.floor((timeLeft % 60000) / 1000)
  const totalDuration = 30 * 60 * 1000 // 30 minutes
  const progress = Math.min(1, timeLeft / totalDuration)

  const copyAccountNumber = () => {
    navigator.clipboard.writeText(bankTransfer.accountNumber)
    setCopied(true)
    toast.success("Account number copied")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const res = await fetch(getApiUrl(`/checkout/${reference}/refresh`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: sessionId ? JSON.stringify({ sessionId }) : undefined,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Refresh failed')
      if (json.data?.status === 'PAID' || json.status === 'PAID') {
        onPaid()
      } else {
        toast.info("Payment not yet received. Please complete the transfer.")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to check payment status")
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleCancel = async () => {
    setIsCancelling(true)
    try {
      const res = await fetch(getApiUrl(`/checkout/${reference}/cancel`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: sessionId ? JSON.stringify({ sessionId }) : undefined,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Cancel failed')
      toast.success("Payment cancelled")
      onBack()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel payment")
    } finally {
      setIsCancelling(false)
    }
  }

  const isExpired = timeLeft <= 0

  return (
    <motion.div
      className="w-full max-w-md mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <CheckoutBusinessHeader
        businessName={businessName}
        businessLogo={businessLogo}
        className="mb-6"
      />

      <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-brand-deep/10 dark:border-white/10 rounded-3xl p-8 space-y-6 shadow-sm dark:shadow-none">
        <div className="text-center space-y-1">
          <h2 className="font-serif text-xl font-medium text-brand-deep dark:text-brand-cream">
            Complete Your Transfer
          </h2>
          <p className="text-brand-accent/50 dark:text-white/50 text-sm">
            Send the exact amount to the account below
          </p>
        </div>

        {/* Timer */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5 text-brand-accent/40 dark:text-white/40">
              <Clock className="w-3.5 h-3.5" />
              <span>Time remaining</span>
            </div>
            <span className={`font-jakarta font-semibold ${isExpired ? 'text-red-500 dark:text-red-400' : 'text-brand-gold'}`}>
              {isExpired ? "Expired" : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`}
            </span>
          </div>
          <div className="h-1.5 bg-brand-deep/5 dark:bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-brand-gold rounded-full"
              style={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-brand-deep/3 dark:bg-white/3 rounded-2xl border border-brand-deep/5 dark:border-white/5 p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-brand-accent/40 dark:text-white/40" />
            </div>
            <div>
              <p className="text-brand-accent/40 dark:text-white/40 text-xs">Bank</p>
              <p className="text-brand-deep dark:text-brand-cream text-sm font-medium">{bankTransfer.bankName}</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-brand-accent/40 dark:text-white/40 text-xs">Account Number</p>
              <p className="text-brand-deep dark:text-brand-cream text-lg font-jakarta font-semibold tracking-wider">
                {bankTransfer.accountNumber}
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={copyAccountNumber}
              className="w-10 h-10 rounded-xl"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>

          <div>
            <p className="text-brand-accent/40 dark:text-white/40 text-xs">Account Name</p>
            <p className="text-brand-deep dark:text-brand-cream text-sm font-medium">{bankTransfer.accountName}</p>
          </div>
        </div>

        {/* Amount Breakdown */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-brand-accent/40 dark:text-white/40">Subtotal</span>
            <span className="text-brand-accent/70 dark:text-white/70 font-jakarta">
              <CurrencyText value={formatCurrency(bankTransfer.subtotal, { currency })} />
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-brand-accent/40 dark:text-white/40">Fee</span>
            <span className="text-brand-accent/70 dark:text-white/70 font-jakarta">
              <CurrencyText value={formatCurrency(bankTransfer.fee, { currency })} />
            </span>
          </div>
          <div className="h-px bg-brand-deep/10 dark:bg-white/10" />
          <div className="flex items-center justify-between">
            <span className="text-brand-accent/60 dark:text-white/60 text-sm font-medium">Total</span>
            <CurrencyDisplay
              value={bankTransfer.amount}
              currency={currency}
              className="text-brand-deep dark:text-brand-gold text-xl font-semibold font-jakarta"
            />
          </div>
        </div>

        {financialSummary && (
          <div className="space-y-2">
            <div className="h-px bg-brand-deep/10 dark:bg-white/10" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-brand-accent/40 dark:text-white/40">Original amount</span>
              <span className="text-brand-accent/70 dark:text-white/70 font-jakarta">
                <CurrencyText value={formatCurrency(financialSummary.totalAmount, { currency })} />
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-brand-accent/40 dark:text-white/40">Already paid</span>
              <span className="text-brand-green dark:text-brand-gold font-jakarta">
                <CurrencyText value={formatCurrency(financialSummary.amountPaid, { currency })} />
              </span>
            </div>
            <div className="flex items-center justify-between text-sm font-medium">
              <span className="text-brand-accent/60 dark:text-white/60">Outstanding balance</span>
              <span className="text-brand-deep dark:text-brand-cream font-jakarta">
                <CurrencyText value={formatCurrency(financialSummary.amountDue, { currency })} />
              </span>
            </div>
          </div>
        )}

        {academicContext && (
          <div className="space-y-2">
            <div className="h-px bg-brand-deep/10 dark:bg-white/10" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-brand-accent/40 dark:text-white/40">Academic year</span>
              <span className="text-brand-accent/70 dark:text-white/70 font-jakarta">
                {academicContext.academicYear}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-brand-accent/40 dark:text-white/40">Term</span>
              <span className="text-brand-deep dark:text-brand-cream font-jakarta">
                {academicContext.term}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="rounded-2xl h-14 w-full bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep hover:bg-brand-deep/90 dark:hover:bg-brand-gold/90 font-bold gap-2 shadow-xl"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? "Checking..." : "I've sent the money"}
          </Button>

          <Button
            variant="ghost"
            onClick={handleCancel}
            disabled={isCancelling}
            className="w-full h-12 rounded-2xl gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {isCancelling ? "Cancelling..." : "Cancel payment"}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 mt-6">
        <ShieldCheck className="w-3.5 h-3.5 text-brand-accent/30 dark:text-white/30" />
        <p className="text-brand-accent/30 dark:text-white/30 text-xs">
          Secured by Cloove
        </p>
      </div>
    </motion.div>
  )
}
