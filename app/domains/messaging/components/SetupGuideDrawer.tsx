"use client"

import { Button } from "@/app/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerStickyHeader,
  DrawerBody,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
  DrawerTrigger,
} from "@/app/components/ui/drawer"
import { HelpCircle, ExternalLink, Copy, Check } from "lucide-react"
import { useState } from "react"

export function SetupGuideDrawer() {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-brand-accent/60 dark:text-white/40 hover:text-brand-deep dark:hover:text-white"
        >
          <HelpCircle className="w-4 h-4 mr-1.5" />
          Setup guide
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerStickyHeader>
          <DrawerTitle>How to connect your WhatsApp Business number</DrawerTitle>
          <DrawerDescription>
            Follow these steps to set up your Meta app and get the credentials needed for Cloove.
          </DrawerDescription>
        </DrawerStickyHeader>

        <DrawerBody>
          <div className="space-y-6 text-sm text-brand-deep/80 dark:text-brand-cream/80">
            <section className="space-y-3">
              <StepNumber n={1} />
              <h3 className="font-semibold text-brand-deep dark:text-brand-cream">
                Create a Meta Developer App
              </h3>
              <ol className="list-disc pl-5 space-y-1.5 text-brand-accent/70 dark:text-white/50">
                <li>
                  Go to{" "}
                  <GuideLink href="https://developers.facebook.com/apps/">
                    Meta for Developers
                  </GuideLink>{" "}
                  and log in.
                </li>
                <li>Click &quot;Create App&quot; and choose the &quot;Business&quot; type.</li>
                <li>Give it a name (e.g. &quot;My Store WhatsApp&quot;) and create it.</li>
              </ol>
            </section>

            <section className="space-y-3">
              <StepNumber n={2} />
              <h3 className="font-semibold text-brand-deep dark:text-brand-cream">
                Add the WhatsApp product
              </h3>
              <ol className="list-disc pl-5 space-y-1.5 text-brand-accent/70 dark:text-white/50">
                <li>In your app dashboard, click &quot;Add Product&quot; in the sidebar.</li>
                <li>Find &quot;WhatsApp&quot; and click &quot;Set Up&quot;.</li>
                <li>Select or create a Meta Business Account when prompted.</li>
              </ol>
            </section>

            <section className="space-y-3">
              <StepNumber n={3} />
              <h3 className="font-semibold text-brand-deep dark:text-brand-cream">
                Add your phone number
              </h3>
              <ol className="list-disc pl-5 space-y-1.5 text-brand-accent/70 dark:text-white/50">
                <li>
                  Go to{" "}
                  <GuideLink href="https://business.facebook.com/settings/whatsapp-business-accounts">
                    WhatsApp Business Accounts
                  </GuideLink>{" "}
                  in Meta Business Suite.
                </li>
                <li>Select your WhatsApp Business Account.</li>
                <li>
                  Click &quot;Add Phone Number&quot; and follow the verification steps (you&apos;ll
                  receive an OTP).
                </li>
              </ol>
            </section>

            <section className="space-y-3">
              <StepNumber n={4} />
              <h3 className="font-semibold text-brand-deep dark:text-brand-cream">
                Get your credentials
              </h3>
              <p className="text-brand-accent/70 dark:text-white/50">
                In your app dashboard, go to <strong>WhatsApp → API Setup</strong>. You&apos;ll
                find:
              </p>
              <ul className="space-y-2">
                <CredentialItem
                  name="Phone Number ID"
                  description='Shown under your phone number in the "From" section'
                />
                <CredentialItem
                  name="WhatsApp Business Account ID"
                  description="Shown at the top of the API Setup page"
                />
                <CredentialItem
                  name="Permanent Access Token"
                  description='Click "Generate" under Temporary Access Token, then create a permanent System User token in Business Settings → System Users'
                />
              </ul>
            </section>

            <section className="space-y-3">
              <StepNumber n={5} />
              <h3 className="font-semibold text-brand-deep dark:text-brand-cream">
                Get your App Secret
              </h3>
              <ol className="list-disc pl-5 space-y-1.5 text-brand-accent/70 dark:text-white/50">
                <li>
                  In your app dashboard, go to <strong>Settings → Basic</strong>.
                </li>
                <li>Click &quot;Show&quot; next to App Secret and copy it.</li>
              </ol>
            </section>

            <section className="space-y-3">
              <StepNumber n={6} />
              <h3 className="font-semibold text-brand-deep dark:text-brand-cream">
                Configure the webhook
              </h3>
              <ol className="list-disc pl-5 space-y-1.5 text-brand-accent/70 dark:text-white/50">
                <li>
                  In your app dashboard, go to <strong>WhatsApp → Configuration</strong>.
                </li>
                <li>
                  Under Webhook, set the Callback URL to:{" "}
                  <CopyableCode value="https://v1.api.clooveai.com/webhooks/whatsapp" />
                </li>
                <li>
                  Set the Verify Token to the value shown after you save your credentials here.
                </li>
                <li>
                  Subscribe to the <strong>messages</strong> webhook field.
                </li>
              </ol>
            </section>

            <section className="space-y-3">
              <StepNumber n={7} />
              <h3 className="font-semibold text-brand-deep dark:text-brand-cream">
                Paste your credentials on Cloove
              </h3>
              <p className="text-brand-accent/70 dark:text-white/50">
                Fill in the form with your Phone Number ID, WABA ID, Access Token, and App Secret.
                We&apos;ll verify the connection and start routing messages to your business.
              </p>
            </section>
          </div>
        </DrawerBody>

        <DrawerFooter>
          <p className="text-xs text-brand-accent/40 dark:text-white/30">
            Need help? Reach out to our support team and we&apos;ll walk you through the setup.
          </p>
          <DrawerClose asChild>
            <Button
              variant="ghost"
              className="w-full rounded-xl"
            >
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function StepNumber({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep text-xs font-bold">
      {n}
    </span>
  )
}

function CredentialItem({ name, description }: { name: string; description: string }) {
  return (
    <li className="flex flex-col gap-0.5 pl-1">
      <span className="font-medium text-brand-deep dark:text-brand-cream">{name}</span>
      <span className="text-xs text-brand-accent/50 dark:text-white/40">{description}</span>
    </li>
  )
}

function CopyableCode({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-xs bg-brand-deep/5 dark:bg-white/10 px-2 py-1 rounded-md hover:bg-brand-deep/10 dark:hover:bg-white/15 transition-colors cursor-pointer"
    >
      <code className="break-all">{value}</code>
      {copied ? (
        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-brand-accent/40 dark:text-white/40 shrink-0" />
      )}
    </button>
  )
}

function GuideLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-0.5 text-brand-green dark:text-brand-gold underline underline-offset-2 hover:opacity-80"
    >
      {children}
      <ExternalLink className="w-3 h-3" />
    </a>
  )
}
