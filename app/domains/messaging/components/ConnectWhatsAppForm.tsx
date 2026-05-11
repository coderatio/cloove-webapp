"use client"

import { useState } from "react"
import { Input } from "@/app/components/ui/input"
import { Button } from "@/app/components/ui/button"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { useManualConnectWhatsAppNumber, type WhatsAppNumber } from "../hooks/useWhatsAppSettings"

interface FormState {
  phone_number: string
  phone_number_id: string
  meta_business_id: string
  waba_id: string
  app_id: string
  access_token: string
  app_secret: string
  catalog_id: string
}

interface ConnectWhatsAppFormProps {
  mode?: "connect" | "update"
  initialNumber?: WhatsAppNumber | null
  onSuccess?: (payload: { message: string; warning?: string | null }) => void
}

const INITIAL_STATE: FormState = {
  phone_number: "",
  phone_number_id: "",
  meta_business_id: "",
  waba_id: "",
  app_id: "",
  access_token: "",
  app_secret: "",
  catalog_id: "",
}

export function ConnectWhatsAppForm({
  mode = "connect",
  initialNumber = null,
  onSuccess,
}: ConnectWhatsAppFormProps) {
  const connectMutation = useManualConnectWhatsAppNumber()
  const [form, setForm] = useState<FormState>({
    phone_number: initialNumber?.phone_number ?? "",
    phone_number_id: initialNumber?.phone_number_id ?? "",
    meta_business_id: initialNumber?.meta_business_id ?? "",
    waba_id: initialNumber?.waba_id ?? "",
    app_id: initialNumber?.app_id ?? "",
    access_token: "",
    app_secret: "",
    catalog_id: initialNumber?.selected_catalog_id ?? "",
  })
  const [showToken, setShowToken] = useState(false)
  const [showAppSecret, setShowAppSecret] = useState(false)
  const isUpdateMode = mode === "update"

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const trimmed = {
      phone_number: form.phone_number.trim(),
      phone_number_id: form.phone_number_id.trim(),
      waba_id: form.waba_id.trim(),
      meta_business_id: form.meta_business_id.trim(),
      app_id: form.app_id.trim(),
      access_token: form.access_token.trim(),
      app_secret: form.app_secret.trim(),
      catalog_id: form.catalog_id.trim(),
    }

    if (
      !isUpdateMode &&
      (!trimmed.phone_number ||
        !trimmed.phone_number_id ||
        !trimmed.waba_id ||
        !trimmed.meta_business_id ||
        !trimmed.app_id ||
        !trimmed.access_token ||
        !trimmed.app_secret)
    ) {
      toast.error("Phone Number, Phone Number ID, WABA ID, Meta Business ID, App ID, App Secret, and Access Token are required.")
      return
    }

    if (
      isUpdateMode &&
      !trimmed.phone_number &&
      !trimmed.phone_number_id &&
      !trimmed.waba_id &&
      !trimmed.meta_business_id &&
      !trimmed.app_id &&
      !trimmed.access_token &&
      !trimmed.app_secret &&
      !trimmed.catalog_id
    ) {
      toast.error("Add at least one field to update.")
      return
    }

    connectMutation.mutate(
      {
        ...(trimmed.phone_number ? { phone_number: trimmed.phone_number } : {}),
        ...(trimmed.phone_number_id ? { phone_number_id: trimmed.phone_number_id } : {}),
        ...(trimmed.waba_id ? { waba_id: trimmed.waba_id } : {}),
        ...(trimmed.meta_business_id ? { meta_business_id: trimmed.meta_business_id } : {}),
        ...(trimmed.app_id ? { app_id: trimmed.app_id } : {}),
        ...(trimmed.access_token ? { access_token: trimmed.access_token } : {}),
        ...(trimmed.app_secret ? { app_secret: trimmed.app_secret } : {}),
        ...(trimmed.catalog_id ? { catalog_id: trimmed.catalog_id } : {}),
      },
      {
        onSuccess: (response) => {
          setForm((prev) =>
            isUpdateMode
              ? { ...prev, access_token: "", app_secret: "", catalog_id: prev.catalog_id }
              : INITIAL_STATE
          )
          onSuccess?.({
            message: response?.message || "WhatsApp saved.",
            warning: response?.warning ?? null,
          })
        },
      }
    )
  }

  const handleChange = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/60">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField label="Phone Number" required={!isUpdateMode}>
            <Input
              value={form.phone_number}
              onChange={(e) => handleChange("phone_number", e.target.value)}
              placeholder="+2348012345678"
              className="bg-white dark:bg-slate-900/50"
            />
          </FormField>
          <FormField label="Phone Number ID" required={!isUpdateMode}>
            <Input
              value={form.phone_number_id}
              onChange={(e) => handleChange("phone_number_id", e.target.value)}
              placeholder="106540352242922"
              className="bg-white dark:bg-slate-900/50"
            />
          </FormField>
          <FormField label="WABA ID" required={!isUpdateMode}>
            <Input
              value={form.waba_id}
              onChange={(e) => handleChange("waba_id", e.target.value)}
              placeholder="2031294951050226"
              className="bg-white dark:bg-slate-900/50"
            />
          </FormField>
          <FormField label="Meta Business ID" required={!isUpdateMode}>
            <Input
              value={form.meta_business_id}
              onChange={(e) => handleChange("meta_business_id", e.target.value)}
              placeholder="123456789012345"
              className="bg-white dark:bg-slate-900/50"
            />
          </FormField>
        </div>

        <FormField label="App ID" required={!isUpdateMode}>
          <Input
            value={form.app_id}
            onChange={(e) => handleChange("app_id", e.target.value)}
            placeholder="Meta App ID that issued the access token"
            className="bg-white dark:bg-slate-900/50"
          />
        </FormField>

        <FormField
          label={isUpdateMode ? "Access Token (optional)" : "Permanent Access Token"}
          required={!isUpdateMode}
        >
          <div className="relative">
            <Input
              type={showToken ? "text" : "password"}
              value={form.access_token}
              onChange={(e) => handleChange("access_token", e.target.value)}
              placeholder="EAAQ..."
              className="pr-10 bg-white font-mono text-sm dark:bg-slate-900/50"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </FormField>

        <FormField
          label={isUpdateMode ? "App Secret (optional)" : "App Secret"}
          required={!isUpdateMode}
        >
          <div className="relative">
            <Input
              type={showAppSecret ? "text" : "password"}
              value={form.app_secret}
              onChange={(e) => handleChange("app_secret", e.target.value)}
              placeholder={isUpdateMode ? "Enter app secret only if changing it" : "Used to configure your Meta App webhook"}
              className="pr-10 bg-white font-mono text-sm dark:bg-slate-900/50"
            />
            <button
              type="button"
              onClick={() => setShowAppSecret(!showAppSecret)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              {showAppSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </FormField>

        <FormField label="Catalog ID (optional)">
          <Input
            value={form.catalog_id}
            onChange={(e) => handleChange("catalog_id", e.target.value)}
            placeholder="Leave empty to auto-create catalog"
            className="bg-white dark:bg-slate-900/50"
          />
        </FormField>

        <Button
          type="submit"
          disabled={connectMutation.isPending}
          className="h-10 w-full rounded-full bg-brand-deep text-brand-cream hover:bg-brand-deep/90"
        >
          {connectMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isUpdateMode ? "Updating..." : "Connecting..."}
            </>
          ) : (
            isUpdateMode ? "Update Config" : "Connect Manually"
          )}
        </Button>
      </form>
    </div>
  )
}

function FormField({
  label,
  required,
  children,
}: {
  label: string
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
    </div>
  )
}
