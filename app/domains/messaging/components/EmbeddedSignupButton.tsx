"use client"

import { useEffect, useCallback, useState } from "react"
import { Button } from "@/app/components/ui/button"
import { Loader2, MessageSquare } from "lucide-react"
import { useConnectWhatsAppNumber } from "../hooks/useWhatsAppSettings"

const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID
const CONFIG_ID = process.env.NEXT_PUBLIC_EMBEDDED_SIGNUP_CONFIG_ID

declare global {
  interface Window {
    fbAsyncInit?: () => void
    FB?: {
      init: (params: Record<string, unknown>) => void
      login: (
        callback: (response: { authResponse?: { code?: string } }) => void,
        params: Record<string, unknown>
      ) => void
    }
  }
}

export function EmbeddedSignupButton() {
  const connectNumber = useConnectWhatsAppNumber()
  const [sdkReady, setSdkReady] = useState(false)
  const [sessionData, setSessionData] = useState<{
    phone_number_id?: string
    waba_id?: string
  } | null>(null)

  useEffect(() => {
    if (!META_APP_ID) return

    window.fbAsyncInit = () => {
      window.FB?.init({
        appId: META_APP_ID,
        autoLogAppEvents: true,
        xfbml: true,
        version: "v21.0",
      })
      setSdkReady(true)
    }

    if (document.getElementById("facebook-jssdk")) {
      if (window.FB) setSdkReady(true)
      return
    }

    const script = document.createElement("script")
    script.id = "facebook-jssdk"
    script.src = "https://connect.facebook.net/en_US/sdk.js"
    script.async = true
    script.defer = true
    document.body.appendChild(script)
  }, [])

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (
        event.origin !== "https://www.facebook.com" &&
        event.origin !== "https://web.facebook.com"
      ) {
        return
      }

      if (event.data?.type === "WA_EMBEDDED_SIGNUP") {
        const data = event.data.data
        if (data?.phone_number_id && data?.waba_id) {
          setSessionData({
            phone_number_id: data.phone_number_id,
            waba_id: data.waba_id,
          })
        }
      }
    }

    window.addEventListener("message", handler)
    return () => window.removeEventListener("message", handler)
  }, [])

  const handleClick = useCallback(() => {
    if (!window.FB || !CONFIG_ID) return

    window.FB.login(
      (response) => {
        const code = response.authResponse?.code
        if (!code) return

        if (sessionData?.phone_number_id && sessionData?.waba_id) {
          connectNumber.mutate({
            code,
            phone_number_id: sessionData.phone_number_id,
            waba_id: sessionData.waba_id,
          })
        }
      },
      {
        config_id: CONFIG_ID,
        response_type: "code",
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: "",
          sessionInfoVersion: 2,
        },
      }
    )
  }, [sessionData, connectNumber])

  const isConfigured = !!META_APP_ID && !!CONFIG_ID

  return (
    <Button
      onClick={handleClick}
      disabled={!isConfigured || !sdkReady || connectNumber.isPending}
      className="bg-brand-deep text-brand-gold hover:bg-brand-deep/90 dark:bg-brand-gold dark:text-brand-deep dark:hover:bg-brand-gold/90 rounded-full px-6 h-12"
    >
      {connectNumber.isPending ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <MessageSquare className="w-4 h-4 mr-2" />
          Connect WhatsApp Number
        </>
      )}
    </Button>
  )
}
