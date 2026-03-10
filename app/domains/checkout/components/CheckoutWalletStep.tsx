"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Copy, Check, Building2, ShieldCheck, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/app/components/ui/button"
import { CheckoutBusinessHeader } from "./CheckoutBusinessHeader"
import type { CheckoutData, CheckoutDepositAccount } from "../types"

interface Props {
  checkout: CheckoutData
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

export function CheckoutWalletStep({ checkout }: Props) {
  const accounts = checkout.depositAccounts ?? []

  // Group accounts by provider
  const providers = useMemo(() => {
    const map = new Map<string, CheckoutDepositAccount[]>()
    for (const account of accounts) {
      const key = account.provider || 'default'
      const list = map.get(key) || []
      list.push(account)
      map.set(key, list)
    }
    return Array.from(map.entries()).map(([id, accts]) => ({ id, accounts: accts }))
  }, [accounts])

  const [selectedProvider, setSelectedProvider] = useState<string | null>(
    providers.length > 0 ? providers[0].id : null
  )

  const filteredAccounts = providers.find((p) => p.id === selectedProvider)?.accounts ?? []
  const hasMultipleProviders = providers.length > 1

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
        title={checkout.title || checkout.businessName}
        className="mb-6"
      >
        {checkout.description && (
          <p className="text-brand-accent/50 dark:text-white/50 text-sm">{checkout.description}</p>
        )}
      </CheckoutBusinessHeader>

      {accounts.length === 0 ? (
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-brand-deep/10 dark:border-white/10 rounded-3xl p-8 text-center space-y-3 shadow-sm dark:shadow-none max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center mx-auto">
            <Building2 className="w-8 h-8 text-brand-accent/30 dark:text-white/30" />
          </div>
          <p className="text-brand-accent/50 dark:text-white/50 text-sm">
            No payment accounts available at the moment.
          </p>
        </div>
      ) : (
        <div className={`flex flex-col ${hasMultipleProviders ? 'md:flex-row md:items-start' : ''} gap-4`}>
          {/* Provider Sidebar — only when multiple providers */}
          {hasMultipleProviders && (
            <div className="md:w-56 shrink-0">
              <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-brand-deep/10 dark:border-white/10 rounded-3xl p-4 space-y-3 shadow-sm dark:shadow-none">
                <p className="text-brand-accent/40 dark:text-white/40 text-[10px] font-bold uppercase tracking-widest px-1">
                  Payment Method
                </p>
                <div className="space-y-1.5">
                  {providers.map((provider) => {
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
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-brand-gold/10 dark:bg-brand-gold/15' : 'bg-brand-deep/5 dark:bg-white/5'}`}>
                          <Building2 className={`w-4 h-4 ${isSelected ? 'text-brand-gold' : 'text-brand-accent/40 dark:text-white/40'}`} />
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
              </div>
            </div>
          )}

          {/* Account Cards */}
          <div className="flex-1 min-w-0 space-y-4">
            {filteredAccounts.map((account, index) => (
              <WalletAccountCard key={account.id} account={account} index={index} />
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-1.5 mt-6">
        <ShieldCheck className="w-3.5 h-3.5 text-brand-accent/30 dark:text-white/30" />
        <p className="text-brand-accent/30 dark:text-white/30 text-xs">
          Secured by Cloove
        </p>
      </div>
    </motion.div>
  )
}

function WalletAccountCard({ account, index }: { account: CheckoutDepositAccount; index: number }) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    toast.success(`${field} copied`)
    setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-brand-deep/10 dark:border-white/10 rounded-3xl p-6 space-y-4 shadow-sm dark:shadow-none">
        {/* Header: Bank Name + Copy All (desktop) */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-deep/5 dark:bg-white/5 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-brand-accent/40 dark:text-white/40" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-brand-accent/40 dark:text-white/40 text-xs">Bank</p>
            <p className="text-brand-deep dark:text-brand-cream text-sm font-medium">{account.bankName}</p>
          </div>
          <Button
            variant="ghost"
            onClick={() => handleCopy(
              `${account.bankName} | ${account.accountNumber} | ${account.accountName}`,
              "Details"
            )}
            className="hidden md:flex h-9 rounded-xl bg-brand-deep/5 dark:bg-white/5 hover:bg-brand-deep/10 dark:hover:bg-white/10 text-[10px] font-bold uppercase tracking-wider px-3"
          >
            {copiedField === "Details" ? (
              <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5 mr-1.5" />
            )}
            Copy All
          </Button>
        </div>

        {/* Account Number */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-brand-accent/40 dark:text-white/40 text-xs">Account Number</p>
            <p className="text-brand-deep dark:text-brand-cream text-lg font-jakarta font-semibold tracking-wider">
              {account.accountNumber}
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleCopy(account.accountNumber, "Account number")}
            className="w-10 h-10 rounded-xl"
          >
            {copiedField === "Account number" ? (
              <Check className="w-4 h-4 text-emerald-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Account Name */}
        <div>
          <p className="text-brand-accent/40 dark:text-white/40 text-xs">Account Name</p>
          <p className="text-brand-deep dark:text-brand-cream text-sm font-medium">{account.accountName}</p>
        </div>

        {/* QR Code */}
        {account.qrCodeUrl && (
          <div className="flex flex-col items-start gap-2 pt-2">
            <div className="w-36 h-36 bg-white p-2.5 rounded-2xl shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={account.qrCodeUrl}
                alt={`QR Code for ${account.bankName}`}
                className="w-full h-full"
              />
            </div>
            <p className="text-brand-accent/40 dark:text-white/40 text-xs">
              Scan with any banking app to pay instantly
            </p>
          </div>
        )}

        {/* Copy All — mobile only */}
        <div className="flex md:hidden items-center gap-3 pt-2 border-t border-brand-deep/5 dark:border-white/5">
          <Button
            variant="ghost"
            onClick={() => handleCopy(
              `${account.bankName} | ${account.accountNumber} | ${account.accountName}`,
              "Details"
            )}
            className="flex-1 h-10 rounded-xl bg-brand-deep/5 dark:bg-white/5 hover:bg-brand-deep/10 dark:hover:bg-white/10 text-xs font-bold uppercase tracking-wider"
          >
            {copiedField === "Details" ? (
              <Check className="w-3.5 h-3.5 mr-2 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5 mr-2" />
            )}
            Copy All
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
