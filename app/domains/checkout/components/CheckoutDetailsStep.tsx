"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Loader2, ShoppingBag, Building2, Pencil, X, CheckCircle2, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { formatCurrency } from "@/app/lib/formatters"
import { CurrencyText } from "@/app/components/shared/CurrencyText"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { MoneyInput } from "@/app/components/ui/money-input"
import { CurrencyDisplay } from "@/app/components/shared/CurrencyDisplay"
import { useInitiateBankTransfer, usePaymentProviders } from "../hooks/useCheckout"
import { CheckoutBusinessHeader } from "./CheckoutBusinessHeader"
import type { CheckoutData, BankTransferData } from "../types"

interface Props {
  checkout: CheckoutData
  reference: string
  onBankTransferReady: (data: BankTransferData, sessionId?: string) => void
}

function providerDisplayName(id: string): string {
  const names: Record<string, string> = {
    flutterwave: 'Flutterwave',
    paystack: 'Paystack',
    monnify: 'Monnify',
    kuda: 'Kuda',
    cloove: 'Cloove Pay',
  }
  return names[id] || id.charAt(0).toUpperCase() + id.slice(1)
}

function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = { NGN: '₦', USD: '$', GBP: '£', EUR: '€' }
  return symbols[currency] || currency
}

export function CheckoutDetailsStep({ checkout, reference, onBankTransferReady }: Props) {
  const [customerName, setCustomerName] = useState(checkout.customer.name || "")
  const [email, setEmail] = useState(checkout.customer.email || "")
  const [phoneNumber, setPhoneNumber] = useState(checkout.customer.phone || "")
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [isEditingAmount, setIsEditingAmount] = useState(false)
  const [customAmount, setCustomAmount] = useState(0)

  const bankTransfer = useInitiateBankTransfer(reference)
  const { data: providers, isPending: isLoadingProviders } = usePaymentProviders()

  const enabledProviders = (providers || [])
    .filter((p) => p.is_enabled && p.dynamic_account_enabled !== false)
    .sort((a, b) => (a.dynamic_account_priority ?? 99) - (b.dynamic_account_priority ?? 99))

  // For wallet links with no fixed amount, amount input is always shown
  const isWallet = checkout.targetType === 'WALLET'
  const hasFixedAmount = checkout.amount !== null && checkout.amount > 0
  const showAmountInput = isWallet && !hasFixedAmount
  const canEditAmount = checkout.targetType === 'SALE' || checkout.targetType === 'DEBT' || (isWallet && hasFixedAmount)

  const payAmount = showAmountInput || isEditingAmount
    ? customAmount > 0 ? customAmount : 0
    : checkout.amount || 0

  // Auto-select first provider
  if (!selectedProvider && enabledProviders.length > 0) {
    setSelectedProvider(enabledProviders[0].id)
  }

  const selectedProviderInfo = enabledProviders.find((p) => p.id === selectedProvider)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!customerName.trim()) {
      toast.error("Please enter your name")
      return
    }
    if (!email.trim()) {
      toast.error("Please enter your email")
      return
    }
    if (!selectedProvider) {
      toast.error("Please select a payment method")
      return
    }
    if (payAmount <= 0) {
      toast.error("Please enter an amount")
      return
    }
    if (canEditAmount && isEditingAmount && checkout.amount && payAmount > checkout.amount) {
      toast.error(`Amount cannot exceed ${formatCurrency(checkout.amount, { currency: checkout.businessCurrency })}`)
      return
    }

    const sendAmount = showAmountInput || isEditingAmount ? payAmount : undefined

    bankTransfer.mutate(
      {
        customerName: customerName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        amount: sendAmount,
        provider: selectedProvider || undefined,
      },
      {
        onSuccess: (data) => {
          const { sessionId, ...bankData } = data
          onBankTransferReady(bankData, sessionId)
        },
        onError: (err) => toast.error(err.message || "Failed to initiate payment"),
      }
    )
  }

  return (
    <motion.div
      className="w-full max-w-3xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <CheckoutBusinessHeader
        businessName={checkout.businessName}
        businessLogo={checkout.businessLogo}
        className="mb-6 md:pl-60"
      />

      {/* Two-column layout: providers sidebar + payment content */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Left — Provider Sidebar */}
        <div className="md:w-56 shrink-0">
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-brand-deep/10 dark:border-white/10 rounded-3xl p-4 space-y-3 shadow-sm dark:shadow-none">
            <p className="text-brand-accent/40 dark:text-white/40 text-[10px] font-bold uppercase tracking-widest px-1">
              Payment Method
            </p>

            {isLoadingProviders ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-14 bg-brand-deep/5 dark:bg-white/3 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : enabledProviders.length === 0 ? (
              <div className="bg-brand-deep/5 dark:bg-white/3 rounded-2xl border border-brand-deep/5 dark:border-white/5 p-4 text-center">
                <p className="text-brand-accent/40 dark:text-white/40 text-xs">No methods available</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {enabledProviders.map((provider) => {
                  const isSelected = selectedProvider === provider.id
                  return (
                    <Button
                      key={provider.id}
                      type="button"
                      variant="ghost"
                      onClick={() => setSelectedProvider(provider.id)}
                      className={`w-full flex items-center gap-3 px-3 py-3 h-auto rounded-2xl border transition-all justify-start ${isSelected
                        ? 'border-brand-gold/30 bg-brand-gold/5 dark:border-brand-gold/40 dark:bg-brand-gold/10'
                        : 'border-transparent bg-brand-deep/3 dark:bg-white/3 hover:bg-brand-deep/6 dark:hover:bg-white/6'
                        }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-brand-gold/10 dark:bg-brand-gold/15' : 'bg-brand-deep/5 dark:bg-white/5'
                        }`}>
                        {provider.logo_url ? (
                          <img src={provider.logo_url} alt={provider.name} className="w-5 h-5 rounded" />
                        ) : (
                          <Building2 className={`w-4 h-4 ${isSelected ? 'text-brand-gold' : 'text-brand-accent/40 dark:text-white/40'}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className={`text-sm font-medium leading-tight ${isSelected ? 'text-brand-deep dark:text-brand-cream' : 'text-brand-accent/60 dark:text-white/60'}`}>
                          {providerDisplayName(provider.id)}
                        </p>
                        <p className="text-brand-accent/25 dark:text-white/25 text-[10px]">Bank Transfer</p>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-brand-green dark:text-brand-gold shrink-0" />
                      )}
                    </Button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right — Payment Details Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-brand-deep/10 dark:border-white/10 rounded-3xl p-6 space-y-5 shadow-sm dark:shadow-none">
            {/* Title & Description */}
            {checkout.title && (
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-medium text-brand-deep dark:text-brand-cream">
                  {checkout.title}
                </h3>
                {checkout.description && (
                  <p className="text-brand-accent/50 dark:text-white/50 text-sm">{checkout.description}</p>
                )}
              </div>
            )}

            {/* Amount */}
            <div className="space-y-1">
              <p className="text-brand-accent/40 dark:text-white/40 text-[10px] font-bold uppercase tracking-widest">
                {showAmountInput ? 'Enter Amount' : 'Amount to Pay'}
              </p>

              {showAmountInput ? (
                // Wallet with no fixed amount — always show input
                <MoneyInput
                  value={customAmount}
                  onChange={setCustomAmount}
                  currencySymbol={getCurrencySymbol(checkout.businessCurrency)}
                  placeholder="0.00"
                />
              ) : isEditingAmount ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MoneyInput
                      value={customAmount}
                      onChange={setCustomAmount}
                      currencySymbol={getCurrencySymbol(checkout.businessCurrency)}
                      placeholder="0.00"
                      autoFocus
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { setIsEditingAmount(false); setCustomAmount(0) }}
                      className="w-14 h-14 rounded-2xl shrink-0 dark:hover:bg-white/10"
                    >
                      <X className="w-6 h-6 text-brand-accent/40 dark:text-white/40" />
                    </Button>
                  </div>
                  <p className="text-brand-accent/30 dark:text-white/30 text-xs px-1">
                    Total due: <CurrencyText value={formatCurrency(checkout.amount!, { currency: checkout.businessCurrency })} />
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CurrencyDisplay
                    value={checkout.amount!}
                    currency={checkout.businessCurrency}
                    className="font-serif font-semibold text-brand-deep dark:text-brand-gold text-3xl"
                  />
                  {canEditAmount && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { setIsEditingAmount(true); setCustomAmount(checkout.amount!) }}
                      className="w-8 h-8 rounded-full bg-accent/5 hover:bg-accent/10 dark:bg-white/10 dark:hover:bg-white/15"
                      title="Pay a different amount"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Item Breakdown */}
            {checkout.items && checkout.items.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-brand-accent/40 dark:text-white/40 text-[10px] font-bold uppercase tracking-widest">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Items</span>
                </div>
                <div className="bg-brand-deep/3 dark:bg-white/3 rounded-2xl border border-brand-deep/5 dark:border-white/5 divide-y divide-brand-deep/5 dark:divide-white/5">
                  {checkout.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-brand-deep dark:text-brand-cream text-sm">{item.name}</span>
                        {item.quantity > 1 && (
                          <span className="text-brand-accent/30 dark:text-white/30 text-xs">x{item.quantity}</span>
                        )}
                      </div>
                      <span className="text-brand-accent/70 dark:text-white/70 text-sm font-jakarta">
                        <CurrencyText value={formatCurrency(item.totalPrice, { currency: checkout.businessCurrency })} />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="h-px bg-brand-deep/5 dark:bg-white/5" />

            {/* Customer Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <p className="text-brand-accent/40 dark:text-white/40 text-[10px] font-bold uppercase tracking-widest">
                  Your Details
                </p>
                <div className="space-y-3">
                  <Input
                    type="text"
                    placeholder="Full name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="rounded-2xl h-12 sm:h-13 sm:px-4"
                    required
                  />
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-2xl h-12 sm:h-13 sm:px-4"
                    required
                  />
                  <Input
                    type="tel"
                    placeholder="Phone number (optional)"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="rounded-2xl h-12 sm:h-13 sm:px-4"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={bankTransfer.isPending || !selectedProvider || payAmount <= 0}
                className="rounded-2xl h-14 sm:h-16 w-full bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep hover:bg-brand-deep/90 dark:hover:bg-brand-gold/90 font-bold text-sm gap-2 shadow-xl"
              >
                {bankTransfer.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : payAmount > 0 ? (
                  <>
                    Pay <CurrencyText value={formatCurrency(payAmount, { currency: checkout.businessCurrency })} />
                    {selectedProviderInfo && (
                      <span className="opacity-50">
                        via {providerDisplayName(selectedProviderInfo.id)}
                      </span>
                    )}
                  </>
                ) : (
                  'Enter amount to pay'
                )}
              </Button>
            </form>

            <div className="flex items-center justify-center gap-1.5 pt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-accent/30 dark:text-white/30" />
              <p className="text-brand-accent/30 dark:text-white/30 text-xs text-center">
                Secured by CloovePay
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
