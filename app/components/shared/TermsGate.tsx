"use client"

import { useState } from "react"
import { FileText, Shield, Loader2, ChevronRight } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerBody,
    DrawerFooter,
} from "@/app/components/ui/drawer"
import { apiClient } from "@/app/lib/api-client"
import { useAuth } from "@/app/components/providers/auth-provider"
import { toast } from "sonner"
import { cn } from "@/app/lib/utils"

const TERMS_URL = "https://clooveai.com/terms"
const PRIVACY_URL = "https://clooveai.com/privacy"

/**
 * Non-closable drawer that blocks access for users who have not yet accepted
 * the Terms of Service and Privacy Policy.
 *
 * Mounted inside AppLayout — rendered above all page content.
 * Once the user accepts, `refreshUser()` clears the gate automatically.
 */
export function TermsGate({ children }: { children: React.ReactNode }) {
    const { user, isLoading, refreshUser } = useAuth()
    const [accepted, setAccepted] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const needsConsent = !isLoading && !!user && !user.termsAcceptedAt

    const handleAccept = async () => {
        if (!accepted) {
            toast.error("Please tick the checkbox to confirm you agree.")
            return
        }
        setIsSubmitting(true)
        try {
            await apiClient.post("/security/accept-terms", {})
            await refreshUser()
        } catch {
            toast.error("Something went wrong. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
            {children}

            <Drawer
                open={needsConsent}
                dismissible={false}
            >
                <DrawerContent>
                    {/* showClose={false} — user cannot dismiss without accepting */}
                    <DrawerStickyHeader showClose={false}>
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-brand-deep/6 dark:bg-brand-gold/10">
                                <Shield className="size-5 text-brand-deep/70 dark:text-brand-gold" aria-hidden />
                            </div>
                            <div>
                                <DrawerTitle>Terms &amp; Privacy Policy</DrawerTitle>
                                <DrawerDescription className="mt-0.5">
                                    Review and accept before continuing
                                </DrawerDescription>
                            </div>
                        </div>
                    </DrawerStickyHeader>

                    <DrawerBody className="space-y-6">
                        <p className="text-sm leading-relaxed text-brand-accent/70 dark:text-brand-cream/60">
                            We&apos;ve updated our Terms of Service and Privacy Policy. Please review
                            them before continuing to use Cloove.
                        </p>

                        {/* Document links — grouped list style */}
                        <div className="overflow-hidden rounded-3xl border border-brand-deep/8 dark:border-white/10">
                            {[
                                { href: TERMS_URL, icon: FileText, label: "Terms of Service", description: "Usage rules and legal agreement" },
                                { href: PRIVACY_URL, icon: Shield, label: "Privacy Policy", description: "How we collect and use your data" },
                            ].map(({ href, icon: Icon, label, description }, i, arr) => (
                                <a
                                    key={href}
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn(
                                        "group flex w-full items-center gap-4 p-4 text-left transition-all duration-200",
                                        "bg-white/75 hover:bg-white/90 dark:bg-white/[0.06] dark:hover:bg-white/10",
                                        i < arr.length - 1 && "border-b border-brand-deep/8 dark:border-white/10"
                                    )}
                                >
                                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-deep/6 dark:bg-white/8">
                                        <Icon className="size-5 text-brand-deep/70 dark:text-brand-gold/80" aria-hidden />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-brand-deep dark:text-brand-cream">{label}</p>
                                        <p className="mt-0.5 text-xs text-brand-deep/50 dark:text-brand-cream/50">{description}</p>
                                    </div>
                                    <ChevronRight className="size-4 shrink-0 text-brand-deep/30 transition-transform duration-200 group-hover:translate-x-0.5 dark:text-white/30" aria-hidden />
                                </a>
                            ))}
                        </div>

                        {/* Checkbox */}
                        <label className="flex cursor-pointer items-start gap-3 group">
                            <div className="relative mt-0.5 shrink-0">
                                <input
                                    type="checkbox"
                                    checked={accepted}
                                    onChange={(e) => setAccepted(e.target.checked)}
                                    className="sr-only"
                                />
                                <div className={cn(
                                    "flex size-5 items-center justify-center rounded-md border transition-all duration-200",
                                    accepted
                                        ? "bg-brand-gold border-brand-gold"
                                        : "border-brand-deep/20 bg-brand-deep/4 group-hover:border-brand-deep/40 dark:border-white/20 dark:bg-white/5 dark:group-hover:border-brand-gold/40"
                                )}>
                                    {accepted && (
                                        <svg className="size-3 text-brand-deep" viewBox="0 0 12 12" fill="none" aria-hidden>
                                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </div>
                            </div>
                            <span className="text-sm leading-relaxed text-brand-accent/65 transition-colors group-hover:text-brand-accent/80 dark:text-brand-cream/55 dark:group-hover:text-brand-cream/75">
                                I have read and agree to the{" "}
                                <a
                                    href={TERMS_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="font-medium text-brand-deep underline underline-offset-2 transition-colors hover:text-brand-deep/70 dark:text-brand-gold/80 dark:hover:text-brand-gold"
                                >
                                    Terms of Service
                                </a>
                                {" "}and{" "}
                                <a
                                    href={PRIVACY_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="font-medium text-brand-deep underline underline-offset-2 transition-colors hover:text-brand-deep/70 dark:text-brand-gold/80 dark:hover:text-brand-gold"
                                >
                                    Privacy Policy
                                </a>
                            </span>
                        </label>
                    </DrawerBody>

                    <DrawerFooter>
                        <Button
                            onClick={handleAccept}
                            disabled={isSubmitting || !accepted}
                            className="w-full h-12 rounded-2xl bg-brand-gold font-bold text-brand-deep hover:bg-brand-gold/90 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                "Accept & Continue"
                            )}
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </>
    )
}
