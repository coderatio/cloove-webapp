"use client"

import { type ElementType, useEffect, useRef, useState } from "react"
import { Button } from "@/app/components/ui/button"
import { Loader2, MessageSquare } from "lucide-react"
import { useConnectWhatsAppNumber } from "../hooks/useWhatsAppSettings"
import { toast } from "sonner"
import { useBusiness } from "@/app/components/BusinessProvider"

declare global {
  interface Window {
    fbAsyncInit?: () => void
    FB?: {
      init: (params: Record<string, unknown>) => void
      login: (
        callback: (response: { authResponse?: { code?: string }; status?: string }) => void,
        params: Record<string, unknown>
      ) => void
    }
  }
}

interface EmbeddedSignupRuntimeConfig {
  appId: string
  configId: string
  embeddedEnabled?: boolean
  isConfigured: boolean
  error: string | null
}

interface EmbeddedSignupButtonProps {
  label?: string
  connectingLabel?: string
  className?: string
  containerClassName?: string
  icon?: ElementType
  showStatusMessage?: boolean
}

const WA_SIGNUP_LOG_PREFIX = "[WhatsApp Embedded Signup]"

export function EmbeddedSignupButton({
  label = "Connect WhatsApp Number",
  connectingLabel = "Connecting…",
  className,
  containerClassName = "w-full space-y-2",
  icon: Icon = MessageSquare,
  showStatusMessage = true,
}: EmbeddedSignupButtonProps) {
  const connectNumber = useConnectWhatsAppNumber()
  const { activeBusiness } = useBusiness()
  const [sdkReady, setSdkReady] = useState(false)
  const [runtimeConfig, setRuntimeConfig] = useState<EmbeddedSignupRuntimeConfig | null>(null)
  const [authCode, setAuthCode] = useState<string | null>(null)
  const hasSubmittedRef = useRef(false)
  const [sessionData, setSessionData] = useState<{
    meta_business_id?: string
    catalog_id?: string
    catalog_name?: string
    phone_number_id?: string
    waba_id?: string
  } | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadConfig = async () => {
      try {
        const response = await fetch("/api/meta/embedded-signup-config", {
          cache: "no-store",
        })
        const data = (await response.json()) as EmbeddedSignupRuntimeConfig
        if (!cancelled) {
          setRuntimeConfig(data)
        }
      } catch {
        console.error(`${WA_SIGNUP_LOG_PREFIX} failed to load runtime config`)
        if (!cancelled) {
          setRuntimeConfig({
            appId: "",
            configId: "",
            isConfigured: false,
            error: "We could not load the Meta connection options right now.",
          })
        }
      }
    }

    loadConfig()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!runtimeConfig?.appId) return

    window.fbAsyncInit = () => {
      window.FB?.init({
        appId: runtimeConfig.appId,
        autoLogAppEvents: true,
        xfbml: true,
        version: "v21.0",
      })
      setSdkReady(true)
    }

    if (document.getElementById("facebook-jssdk")) {
      if (window.FB) queueMicrotask(() => setSdkReady(true))
      console.info(`${WA_SIGNUP_LOG_PREFIX} Meta SDK script already present`)
      return
    }

    const script = document.createElement("script")
    script.id = "facebook-jssdk"
    script.src = "https://connect.facebook.net/en_US/sdk.js"
    script.async = true
    script.defer = true
    document.body.appendChild(script)
  }, [runtimeConfig?.appId])

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (
        event.origin !== "https://www.facebook.com" &&
        event.origin !== "https://web.facebook.com"
      ) {
        return
      }

      console.info(`${WA_SIGNUP_LOG_PREFIX} received postMessage`, {
        origin: event.origin,
        rawType: typeof event.data,
        rawData: event.data,
      })

      const payload =
        typeof event.data === "string"
          ? (() => {
              try {
                return JSON.parse(event.data)
              } catch {
                return null
              }
            })()
          : event.data

      if (payload?.type === "WA_EMBEDDED_SIGNUP") {
        const data = payload.data
        console.info(`${WA_SIGNUP_LOG_PREFIX} parsed signup payload`, data)
        if (data?.phone_number_id && data?.waba_id) {
          setSessionData({
            meta_business_id: data.business_id,
            catalog_id: data.catalog_id,
            catalog_name: data.catalog_name,
            phone_number_id: data.phone_number_id,
            waba_id: data.waba_id,
          })
        }
      }
    }

    window.addEventListener("message", handler)
    return () => window.removeEventListener("message", handler)
  }, [])

  useEffect(() => {
    if (!authCode || !activeBusiness?.id || !sessionData?.phone_number_id || !sessionData?.waba_id) {
      return
    }

    if (hasSubmittedRef.current || connectNumber.isPending) {
      return
    }

    console.info(`${WA_SIGNUP_LOG_PREFIX} ready to complete signup`, {
      businessId: activeBusiness.id,
      metaBusinessId: sessionData.meta_business_id,
      phoneNumberId: sessionData.phone_number_id,
      wabaId: sessionData.waba_id,
      hasCatalogId: Boolean(sessionData.catalog_id),
      hasAuthCode: Boolean(authCode),
    })

    hasSubmittedRef.current = true
    connectNumber.mutate(
      {
        business_id: activeBusiness.id,
        code: authCode,
        meta_business_id: sessionData.meta_business_id,
        phone_number_id: sessionData.phone_number_id,
        waba_id: sessionData.waba_id,
        catalog_id: sessionData.catalog_id,
        catalog_name: sessionData.catalog_name,
      },
      {
        onSuccess: (response) => {
          console.info(`${WA_SIGNUP_LOG_PREFIX} connect API succeeded`, response)
        },
        onError: () => {
          console.error(`${WA_SIGNUP_LOG_PREFIX} connect API failed`)
          hasSubmittedRef.current = false
        },
      }
    )
  }, [authCode, activeBusiness?.id, connectNumber, sessionData])

  useEffect(() => {
    if (!authCode) return

    const timeout = window.setTimeout(() => {
      if (!sessionData?.phone_number_id || !sessionData?.waba_id) {
        console.error(`${WA_SIGNUP_LOG_PREFIX} timed out waiting for Meta session payload`, {
          authCodePresent: Boolean(authCode),
          sessionData,
        })
        toast.error("Meta did not return the WhatsApp account details needed to finish setup.")
        setAuthCode(null)
        hasSubmittedRef.current = false
      }
    }, 8000)

    return () => window.clearTimeout(timeout)
  }, [authCode, sessionData?.phone_number_id, sessionData?.waba_id])

  const isEmbeddedEnabled = runtimeConfig?.embeddedEnabled !== false
  const isConfigured = !!runtimeConfig?.isConfigured

  return (
    <div className={containerClassName}>
      <Button
        onClick={() => {
          if (!runtimeConfig?.isConfigured || !runtimeConfig.configId) {
            console.error(`${WA_SIGNUP_LOG_PREFIX} blocked launch because config is invalid`, runtimeConfig)
            toast.error(runtimeConfig?.error || "Meta Embedded Signup is not configured.")
            return
          }

          if (!activeBusiness?.id) {
            console.error(`${WA_SIGNUP_LOG_PREFIX} blocked launch because no active business is selected`)
            toast.error("Select a business before connecting WhatsApp.")
            return
          }

          if (!window.FB) {
            console.error(`${WA_SIGNUP_LOG_PREFIX} blocked launch because Meta SDK is not ready`)
            toast.error("Meta SDK is still loading. Try again.")
            return
          }

          console.info(`${WA_SIGNUP_LOG_PREFIX} launching Meta signup`, {
            activeBusinessId: activeBusiness.id,
            configId: runtimeConfig.configId,
          })

          setAuthCode(null)
          hasSubmittedRef.current = false
          setSessionData(null)

          window.FB.login(
            (response) => {
              console.info(`${WA_SIGNUP_LOG_PREFIX} FB.login callback fired`, response)
              const code = response.authResponse?.code
              if (!code) {
                console.error(`${WA_SIGNUP_LOG_PREFIX} Meta signup returned no auth code`, response)
                toast.error("Meta connection was not completed", {
                  description:
                    "Finish the Meta signup window to connect your WhatsApp number. If you closed it or cancelled permissions, you can try again.",
                })
                return
              }

              console.info(`${WA_SIGNUP_LOG_PREFIX} auth code received`)
              setAuthCode(code)
            },
            {
              config_id: runtimeConfig.configId,
              response_type: "code",
              override_default_response_type: true,
              extras: {
                setup: {},
                featureType: "",
                sessionInfoVersion: 2,
              },
            }
          )
        }}
        disabled={connectNumber.isPending || !activeBusiness?.id || !isEmbeddedEnabled}
        className={
          className ??
          "h-12 w-full rounded-full bg-brand-deep px-6 text-brand-gold-300 hover:bg-brand-deep/90 hover:text-brand-gold-200 dark:bg-brand-gold-700 dark:text-white dark:hover:bg-brand-gold-800 sm:w-auto"
        }
      >
        {connectNumber.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {connectingLabel}
          </>
        ) : (
          <>
            <Icon className="w-4 h-4 mr-2" />
            {label}
          </>
        )}
      </Button>
      {showStatusMessage && !isEmbeddedEnabled ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          Connect with Meta is not available for your business right now.
        </p>
      ) : null}
      {showStatusMessage && !isConfigured && runtimeConfig?.error ? (
        <p className="rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {runtimeConfig.error}
        </p>
      ) : null}
    </div>
  )
}
