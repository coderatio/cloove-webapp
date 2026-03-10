"use client"

import { motion } from "framer-motion"
import { Check, ShieldCheck } from "lucide-react"
import { CurrencyDisplay } from "@/app/components/shared/CurrencyDisplay"

interface Props {
  businessName: string
  businessLogo?: string | null
  amount: number
  currency: string
}

export function CheckoutSuccessStep({ businessName, businessLogo, amount, currency }: Props) {
  return (
    <div className="w-full max-w-md mx-auto text-center">
      <motion.div
        className="bg-white dark:bg-white/5 backdrop-blur-xl border border-brand-deep/10 dark:border-white/10 rounded-3xl p-8 space-y-6 shadow-sm dark:shadow-none"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
        >
          <Check className="w-10 h-10 text-emerald-500 dark:text-emerald-400" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <h2 className="font-serif text-2xl font-medium text-brand-deep dark:text-brand-cream">
            Payment Received
          </h2>
          <CurrencyDisplay
            value={amount}
            currency={currency}
            className="text-emerald-600 dark:text-emerald-400 text-3xl font-semibold font-jakarta justify-center"
          />
          <div className="flex items-center justify-center gap-2">
            {businessLogo && (
              <img
                src={businessLogo}
                alt={businessName}
                className="w-5 h-5 rounded-md object-cover"
              />
            )}
            <p className="text-brand-accent/50 dark:text-white/50 text-sm">
              Paid to {businessName}
            </p>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        className="flex items-center justify-center gap-1.5 mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <ShieldCheck className="w-3.5 h-3.5 text-brand-accent/30 dark:text-white/30" />
        <p className="text-brand-accent/30 dark:text-white/30 text-xs">
          Secured by Cloove
        </p>
      </motion.div>
    </div>
  )
}
