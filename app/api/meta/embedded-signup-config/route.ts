import { NextResponse } from "next/server"

function isPlaceholderConfigId(value: string | undefined) {
  if (!value) return true

  const normalized = value.trim()
  if (!normalized) return true

  return (
    normalized === "1234567890" ||
    normalized === "YOUR_EMBEDDED_SIGNUP_CONFIG_ID" ||
    normalized === "REPLACE_ME"
  )
}

export async function GET() {
  const appId = process.env.NEXT_PUBLIC_META_APP_ID?.trim() || ""
  const configId = process.env.NEXT_PUBLIC_EMBEDDED_SIGNUP_CONFIG_ID?.trim() || ""
  const embeddedEnabled =
    (process.env.NEXT_PUBLIC_WHATSAPP_EMBEDDED_SIGNUP_ENABLED || "false").toLowerCase() === "true"
  const isConfigured =
    embeddedEnabled && Boolean(appId) && Boolean(configId) && !isPlaceholderConfigId(configId)

  return NextResponse.json(
    {
      appId,
      configId: isConfigured ? configId : "",
      embeddedEnabled,
      isConfigured,
      error:
        embeddedEnabled && !isConfigured
          ? "Embedded Signup is not configured with a valid Meta config ID."
          : null,
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  )
}
