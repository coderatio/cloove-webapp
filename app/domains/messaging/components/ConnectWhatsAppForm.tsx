"use client"

import { useState } from "react"
import { Input } from "@/app/components/ui/input"
import { Textarea } from "@/app/components/ui/textarea"
import { Button } from "@/app/components/ui/button"
import { Loader2, Eye, EyeOff, Phone, RefreshCw, MessageCircle } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/app/lib/api-client"
import { toast } from "sonner"
import { SetupGuideDrawer } from "./SetupGuideDrawer"
import type { WhatsAppNumber } from "../hooks/useWhatsAppSettings"

interface FormState {
  phone_number_id: string
  waba_id: string
  access_token: string
  app_secret: string
  phone_number: string
  webhook_verify_token: string
}

const INITIAL_STATE: FormState = {
  phone_number_id: "",
  waba_id: "",
  access_token: "",
  app_secret: "",
  phone_number: "",
  webhook_verify_token: "",
}

export function ConnectWhatsAppForm() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FormState>(INITIAL_STATE)
  const [showToken, setShowToken] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [showVerifyToken, setShowVerifyToken] = useState(false)

  const connectMutation = useMutation({
    mutationFn: (data: FormState) =>
      apiClient.post<WhatsAppNumber>("/whatsapp-numbers", {
        phone_number_id: data.phone_number_id,
        waba_id: data.waba_id,
        access_token: data.access_token,
        app_secret: data.app_secret,
        phone_number: data.phone_number,
        webhook_verify_token: data.webhook_verify_token,
        provider: "meta",
      }),
    onSuccess: () => {
      toast.success("WhatsApp number connected! Verifying with Meta...")
      queryClient.invalidateQueries({ queryKey: ["whatsapp-numbers"] })
      setForm(INITIAL_STATE)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to connect. Please check your credentials.")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.phone_number_id || !form.access_token || !form.app_secret || !form.phone_number || !form.webhook_verify_token) {
      toast.error("Please fill in all required fields.")
      return
    }

    connectMutation.mutate(form)
  }

  const handleChange = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="bg-white dark:bg-brand-deep/20 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
      <div className="px-8 py-10 border-b border-slate-100 dark:border-white/5 text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-6 border border-emerald-100 dark:border-emerald-500/20">
          <MessageCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Connect your WhatsApp number
        </h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
          Let your customers order directly from your own WhatsApp Business number.
          Set up your Meta app, then paste your credentials below.
        </p>
        <SetupGuideDrawer />
      </div>

      <div className="p-8 bg-slate-50/50 dark:bg-transparent">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-xl mx-auto">
          <FormField
            label="Phone Number"
            description="Your WhatsApp Business number in international format (e.g. +234...)"
            required
          >
            <Input
              value={form.phone_number}
              onChange={(e) => handleChange("phone_number", e.target.value)}
              placeholder="+2348012345678"
              className="bg-white dark:bg-slate-900/50"
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <FormField
              label="Phone Number ID"
              description="Found in WhatsApp → API Setup"
              required
            >
              <Input
                value={form.phone_number_id}
                onChange={(e) => handleChange("phone_number_id", e.target.value)}
                placeholder="e.g. 106540352242922"
                className="bg-white dark:bg-slate-900/50"
              />
            </FormField>

            <FormField
              label="WhatsApp Business Account ID"
              description="Found in WhatsApp → API Setup"
            >
              <Input
                value={form.waba_id}
                onChange={(e) => handleChange("waba_id", e.target.value)}
                placeholder="e.g. 2031294951050226"
                className="bg-white dark:bg-slate-900/50"
              />
            </FormField>
          </div>

          <FormField
            label="Access Token"
            description="A permanent System User token with whatsapp_business_messaging permission"
            required
          >
            <div className="relative">
              <Textarea
                value={showToken ? form.access_token : form.access_token ? "••••••••••••••••••••" : ""}
                onChange={(e) => handleChange("access_token", e.target.value)}
                onFocus={() => setShowToken(true)}
                placeholder="EAAQ..."
                rows={3}
                className="pr-10 resize-none font-mono text-sm bg-white dark:bg-slate-900/50"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </FormField>

          <FormField
            label="App Secret"
            description="Found in Settings → Basic in your Meta app dashboard"
            required
          >
            <div className="relative">
              <Input
                type={showSecret ? "text" : "password"}
                value={form.app_secret}
                onChange={(e) => handleChange("app_secret", e.target.value)}
                placeholder="Your app secret"
                className="pr-10 bg-white dark:bg-slate-900/50"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </FormField>

          <FormField
            label="Webhook Verify Token"
            description="Used when configuring the webhook URL. Generate one and save it — it won't be shown again."
            required
          >
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Input
                  type={showVerifyToken ? "text" : "password"}
                  value={form.webhook_verify_token}
                  onChange={(e) => handleChange("webhook_verify_token", e.target.value)}
                  placeholder="e.g. my-cloove-verify-token"
                  className="pr-10 font-mono text-sm bg-white dark:bg-slate-900/50"
                />
                <button
                  type="button"
                  onClick={() => setShowVerifyToken(!showVerifyToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showVerifyToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const token = crypto.randomUUID().replace(/-/g, "").slice(0, 32)
                  handleChange("webhook_verify_token", token)
                  setShowVerifyToken(true)
                }}
                className="shrink-0 shadow-sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate
              </Button>
            </div>
          </FormField>

          <div className="pt-6 border-t border-slate-200 dark:border-white/10">
            <Button
              type="submit"
              disabled={connectMutation.isPending}
              className="w-full bg-brand-deep text-brand-cream hover:bg-brand-deep/90 shadow-sm h-11 text-base font-medium"
            >
              {connectMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect WhatsApp Number"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function FormField({
  label,
  description,
  required,
  children,
}: {
  label: string
  description?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {description && (
        <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
      )}
    </div>
  )
}
