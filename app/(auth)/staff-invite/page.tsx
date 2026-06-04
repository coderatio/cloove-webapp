"use client"

import { useEffect, useState, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"
import { HugeiconsIcon } from "@hugeicons/react"
import { Loading03Icon as Loader2, CheckmarkCircle02Icon as CheckCircle2, ArrowRight01Icon as ArrowRight, SecurityCheckIcon as ShieldCheck, Briefcase01Icon as Briefcase, Mail01Icon as Mail, InformationCircleIcon as Info, Logout01Icon as LogOut, UserCircleIcon as UserCircle, LockIcon as Lock, EyeIcon as Eye, EyeOffIcon as EyeOff } from "@hugeicons/core-free-icons"
import { Button } from "@/app/components/ui/button"
import { GlassCard } from "@/app/components/ui/glass-card"
import { apiClient } from "@/app/lib/api-client"
import { storage } from "@/app/lib/storage"
import { useAuth } from "@/app/components/providers/auth-provider"
import { toast } from "sonner"

type InviteStatus = 'loading' | 'pending' | 'setup_password' | 'active' | 'wrong_account' | 'error'

interface InviteData {
    businessName: string
    invitedEmail?: string
    invitedName?: string
    invitedUserId?: string
    hasPassword?: boolean
}

interface StaffInvitationStatusResponse {
    business?: { name?: string }
    user?: { email?: string; fullName?: string }
    userId?: string
    hasPassword?: boolean
    status?: string
}

interface StaffInvitationAcceptResponse {
    membership?: { businessId?: string }
}

function getErrorInfo(err: unknown): { message: string; statusCode?: number } {
    if (err instanceof Error) {
        const maybeStatus = (err as { statusCode?: unknown }).statusCode
        return {
            message: err.message,
            statusCode: typeof maybeStatus === 'number' ? maybeStatus : undefined,
        }
    }
    return { message: "An unexpected error occurred" }
}

function getPasswordStrength(password: string): { level: 'weak' | 'good' | 'strong'; score: number } {
    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[a-z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++

    if (score <= 2) return { level: 'weak', score }
    if (score <= 3) return { level: 'good', score }
    return { level: 'strong', score }
}

const strengthColors = {
    weak: 'bg-red-500',
    good: 'bg-yellow-500',
    strong: 'bg-brand-green',
}

const strengthLabels = {
    weak: 'Weak',
    good: 'Good',
    strong: 'Strong',
}

export default function StaffInvitePage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { user, refreshUser } = useAuth()
    const token = searchParams.get('token')
    const [status, setStatus] = useState<InviteStatus>('loading')
    const [inviteData, setInviteData] = useState<InviteData | null>(null)
    const [isAccepting, setIsAccepting] = useState(false)
    const isLoggedIn = !!user

    // Password setup state
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isSettingUp, setIsSettingUp] = useState(false)

    const passwordStrength = useMemo(() => getPasswordStrength(password), [password])
    const passwordsMatch = password === confirmPassword
    const canSubmitPassword = password.length >= 8 && passwordsMatch && confirmPassword.length > 0

    useEffect(() => {
        if (!token) {
            setStatus('error')
            return
        }

        async function checkStatus() {
            try {
                const res = await apiClient.get<StaffInvitationStatusResponse>(`/staff/invitation/status?token=${token}`)
                if (res) {
                    setInviteData({
                        businessName: res.business?.name || "the business",
                        invitedEmail: res.user?.email,
                        invitedName: res.user?.fullName,
                        invitedUserId: res.userId,
                        hasPassword: res.hasPassword,
                    })
                    if (res.status === 'ACTIVE') {
                        setStatus('active')
                    } else {
                        setStatus('pending')
                    }
                } else {
                    setStatus('error')
                }
            } catch (err) {
                console.error('[StaffInvite] Status check failed:', err)
                setStatus('error')
            }
        }

        checkStatus()
    }, [token])

    const handleAccept = async () => {
        if (!token) return

        // If user has no password, go to password setup step
        if (inviteData && inviteData.hasPassword === false) {
            setStatus('setup_password')
            return
        }

        // If not logged in, redirect to login and come back
        if (!isLoggedIn) {
            const returnUrl = `/staff-invite?token=${token}`
            router.push(`/login?callbackUrl=${encodeURIComponent(returnUrl)}`)
            return
        }

        setIsAccepting(true)
        try {
            await apiClient.post('/staff/invitation/accept', { token })
            await refreshUser()
            setStatus('active')
            toast.success("Invitation accepted successfully")
        } catch (err: unknown) {
            const { message, statusCode } = getErrorInfo(err)
            // Detect "wrong account" error from backend
            if (statusCode === 403) {
                setStatus('wrong_account')
            } else {
                toast.error(message)
                if (statusCode === 400 || statusCode === 404) {
                    setStatus('error')
                }
            }
        } finally {
            setIsAccepting(false)
        }
    }

    const handlePasswordSetup = async () => {
        if (!token || !canSubmitPassword) return

        setIsSettingUp(true)
        try {
            const res = await apiClient.post<StaffInvitationAcceptResponse>('/staff/invitation/accept-with-setup', {
                token,
                password,
            })

            // Auth cookie is set server-side; just set the active business if available
            if (res?.membership?.businessId) {
                storage.setActiveBusinessId(res.membership.businessId)
            }

            await refreshUser()
            setStatus('active')
            toast.success("Welcome! Your account is ready.")
        } catch (err: unknown) {
            const { message, statusCode } = getErrorInfo(err)
            toast.error(message)
            if (statusCode === 400 && message.includes('already has a password')) {
                // User already has a password — redirect to login flow
                const returnUrl = `/staff-invite?token=${token}`
                router.push(`/login?callbackUrl=${encodeURIComponent(returnUrl)}`)
            }
        } finally {
            setIsSettingUp(false)
        }
    }

    const handleSwitchAccount = () => {
        // Clear current session and redirect to login with return URL
        storage.clear()
        const returnUrl = `/staff-invite?token=${token}`
        router.push(`/login?callbackUrl=${encodeURIComponent(returnUrl)}`)
    }

    if (status === 'loading') {
        return (
            <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-brand-deep-950">
                <div className="relative h-12 w-12">
                    <Image src="/images/logo-white.png" alt="Cloove" fill className="object-contain opacity-80" />
                </div>
                <HugeiconsIcon icon={Loader2} className="h-5 w-5 animate-spin text-emerald-300" />
                <p className="text-sm font-medium uppercase tracking-widest text-white/40">
                    Verifying secure link...
                </p>
            </div>
        )
    }

    return (
        <div className="relative flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden bg-brand-deep-950 px-4 py-8">
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(18,87,65,0.28),transparent_42%),linear-gradient(180deg,#061a14_0%,#03100c_100%)]" />
            <div className="relative z-10 flex w-full max-w-[520px] flex-col items-center">
                <div className="mb-6 flex flex-col items-center">
                    <div className="relative mb-3 h-11 w-11">
                        <Image src="/images/logo-white.png" alt="Cloove" fill className="object-contain" priority />
                    </div>
                </div>

                    {status === 'pending' ? (
                        <div className="w-full">
                            <GlassCard className="relative overflow-hidden rounded-[28px] border-white/10 bg-white/[0.045] p-6 shadow-sm md:p-8">
                                <div className="space-y-10 text-center relative z-10">
                                    <div className="space-y-4">
                                        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                                            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300/80">Join the team</span>
                                        </div>
                                        <h1 className="text-2xl font-semibold leading-tight tracking-tight text-white md:text-3xl">
                                            You&apos;ve been invited to join {inviteData?.businessName}
                                        </h1>
                                        {inviteData?.invitedEmail && (
                                            <div className="flex items-center justify-center gap-2 text-sm text-white/45">
                                                <HugeiconsIcon icon={Mail} className="w-4 h-4" />
                                                <span>Invitation sent to {inviteData.invitedEmail}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/20">
                                                <HugeiconsIcon icon={ShieldCheck} className="w-5 h-5 text-emerald-300" />
                                            </div>
                                            <h3 className="mb-1 text-sm font-semibold text-white">Secure access</h3>
                                            <p className="text-xs leading-relaxed text-white/45">Your access is tied to this invitation and business.</p>
                                        </div>
                                        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/20">
                                                <HugeiconsIcon icon={Briefcase} className="w-5 h-5 text-emerald-300" />
                                            </div>
                                            <h3 className="mb-1 text-sm font-semibold text-white">Business workspace</h3>
                                            <p className="text-xs leading-relaxed text-white/45">After accepting, you&apos;ll continue into the workspace.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4">
                                        <Button
                                            onClick={handleAccept}
                                            disabled={isAccepting}
                                            className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl bg-primary font-semibold text-white hover:bg-primary/92 hover:text-white disabled:opacity-45"
                                        >
                                            {isAccepting ? (
                                                <HugeiconsIcon icon={Loader2} className="h-5 w-5 animate-spin" />
                                            ) : inviteData?.hasPassword === false ? (
                                                <>Set Up Account &amp; Join <HugeiconsIcon icon={ArrowRight} className="w-5 h-5" /></>
                                            ) : !isLoggedIn ? (
                                                <>Log In &amp; Accept <HugeiconsIcon icon={ArrowRight} className="w-5 h-5" /></>
                                            ) : (
                                                <>Accept &amp; Join Team <HugeiconsIcon icon={ArrowRight} className="w-5 h-5" /></>
                                            )}
                                        </Button>
                                        <p className="text-center text-[10px] font-semibold uppercase tracking-widest text-white/25">
                                            By joining, you agree to the Cloove Terms of Service
                                        </p>
                                    </div>
                                </div>
                            </GlassCard>
                        </div>

                    ) : status === 'setup_password' ? (
                        <div className="w-full">
                            <GlassCard className="relative overflow-hidden rounded-[28px] border-white/10 bg-white/[0.045] p-6 shadow-sm md:p-8">
                                <div className="space-y-8 relative z-10">
                                    <div className="text-center space-y-3">
                                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                                            <HugeiconsIcon icon={Lock} className="h-6 w-6 text-emerald-300" />
                                        </div>
                                        <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
                                            Create your password
                                        </h1>
                                        <p className="mx-auto max-w-xs text-sm text-white/55">
                                            Set up a password to secure your account and join{' '}
                                            <span className="font-semibold text-emerald-300">{inviteData?.businessName}</span>.
                                        </p>
                                    </div>

                                    <div className="space-y-5">
                                        {/* Password field */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold uppercase tracking-wider text-white/55">
                                                New Password
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    placeholder="Min. 8 characters"
                                                    className="h-14 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 pr-12 text-white placeholder:text-white/35 focus:border-white/25 focus:outline-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/70"
                                                >
                                                    {showPassword ? <HugeiconsIcon icon={EyeOff} className="w-5 h-5" /> : <HugeiconsIcon icon={Eye} className="w-5 h-5" />}
                                                </button>
                                            </div>

                                            {/* Password strength indicator */}
                                            {password.length > 0 && (
                                                <div className="space-y-1.5">
                                                    <div className="flex gap-1.5">
                                                        {[1, 2, 3].map((i) => (
                                                            <div
                                                                key={i}
                                                                className={`h-1 flex-1 rounded-full ${
                                                                    i <= (passwordStrength.level === 'weak' ? 1 : passwordStrength.level === 'good' ? 2 : 3)
                                                                        ? strengthColors[passwordStrength.level]
                                                                        : 'bg-white/10'
                                                                }`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <p className={`text-[10px] font-bold uppercase tracking-wider ${
                                                        passwordStrength.level === 'weak' ? 'text-red-400' :
                                                        passwordStrength.level === 'good' ? 'text-yellow-400' :
                                                        'text-brand-green'
                                                    }`}>
                                                        {strengthLabels[passwordStrength.level]}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Confirm password field */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold uppercase tracking-wider text-white/55">
                                                Confirm Password
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    placeholder="Re-enter your password"
                                                    className="h-14 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 pr-12 text-white placeholder:text-white/35 focus:border-white/25 focus:outline-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/70"
                                                >
                                                    {showConfirmPassword ? <HugeiconsIcon icon={EyeOff} className="w-5 h-5" /> : <HugeiconsIcon icon={Eye} className="w-5 h-5" />}
                                                </button>
                                            </div>
                                            {confirmPassword.length > 0 && !passwordsMatch && (
                                                <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
                                                    Passwords do not match
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-2">
                                        <Button
                                            onClick={handlePasswordSetup}
                                            disabled={!canSubmitPassword || isSettingUp}
                                            className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl bg-primary font-semibold text-white hover:bg-primary/92 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
                                        >
                                            {isSettingUp ? (
                                                <HugeiconsIcon icon={Loader2} className="h-5 w-5 animate-spin" />
                                            ) : (
                                                <>Create Password &amp; Join <HugeiconsIcon icon={ArrowRight} className="w-5 h-5" /></>
                                            )}
                                        </Button>
                                        <button
                                            onClick={() => setStatus('pending')}
                                            className="w-full py-2 text-center text-sm text-white/40 hover:text-white/70"
                                        >
                                            Back
                                        </button>
                                    </div>
                                </div>
                            </GlassCard>
                        </div>

                    ) : status === 'wrong_account' ? (
                        <div className="w-full">
                            <GlassCard className="space-y-6 rounded-[28px] border-white/10 bg-white/[0.045] p-6 text-center shadow-sm md:p-8">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                                    <HugeiconsIcon icon={UserCircle} className="h-6 w-6 text-emerald-300" />
                                </div>

                                <div className="space-y-3">
                                    <h1 className="text-2xl font-semibold tracking-tight text-white">Different account detected</h1>
                                    <p className="mx-auto max-w-xs text-sm leading-relaxed text-white/55">
                                        This invitation was sent to{' '}
                                        <span className="font-semibold text-emerald-300">
                                            {inviteData?.invitedName || inviteData?.invitedEmail || 'another user'}
                                        </span>.
                                        You&apos;re currently logged in with a different account.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <Button
                                        onClick={handleSwitchAccount}
                                        className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl bg-primary font-semibold text-white hover:bg-primary/92 hover:text-white"
                                    >
                                        <HugeiconsIcon icon={LogOut} className="w-5 h-5" />
                                        Switch Account &amp; Accept
                                    </Button>
                                    <Button
                                        onClick={() => router.push('/')}
                                        variant="outline"
                                        className="h-12 w-full rounded-2xl border-white/10 bg-white/[0.04] font-semibold text-white/70 hover:bg-white/[0.07] hover:text-white"
                                    >
                                        Back to Dashboard
                                    </Button>
                                </div>

                                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25">
                                    You&apos;ll be logged out and can sign in with the correct account
                                </p>
                            </GlassCard>
                        </div>

                    ) : status === 'active' ? (
                        <div className="w-full text-center">
                            <GlassCard className="relative overflow-hidden rounded-[28px] border-white/10 bg-white/[0.045] p-8 shadow-sm">
                                <div className="relative z-10 space-y-8">
                                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10">
                                        <HugeiconsIcon icon={CheckCircle2} className="h-7 w-7 text-emerald-300" />
                                    </div>

                                    <div className="space-y-3">
                                        <h1 className="text-3xl font-semibold tracking-tight text-white">Welcome aboard</h1>
                                        <p className="mx-auto max-w-xs text-base leading-relaxed text-white/60">
                                            You are now a member of <span className="font-semibold text-emerald-300">{inviteData?.businessName}</span>.
                                        </p>
                                    </div>

                                    <Button
                                        onClick={() => router.push('/')}
                                        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-semibold text-white hover:bg-primary/92 hover:text-white"
                                    >
                                        Proceed to Dashboard
                                        <HugeiconsIcon icon={ArrowRight} className="h-4 w-4" />
                                    </Button>
                                </div>
                            </GlassCard>
                        </div>
                    ) : (
                        <div className="w-full">
                            <GlassCard className="space-y-6 rounded-[28px] border-white/10 bg-white/[0.045] p-8 text-center shadow-sm">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-red-400/10 bg-red-400/10">
                                    <HugeiconsIcon icon={Info} className="h-6 w-6 text-red-300" />
                                </div>
                                <div className="space-y-3">
                                    <h1 className="text-2xl font-semibold tracking-tight text-white">Invitation expired</h1>
                                    <p className="mx-auto max-w-xs leading-relaxed text-white/50">
                                        This invitation link is invalid or has expired for security reasons. Please ask the business owner to resend the invite.
                                    </p>
                                </div>
                                <Button
                                    onClick={() => router.push('/login')}
                                    variant="outline"
                                    className="h-12 w-full rounded-2xl border-white/10 bg-white/[0.04] font-semibold text-white/70 hover:bg-white/[0.07] hover:text-white"
                                >
                                    Back to Login
                                </Button>
                            </GlassCard>
                        </div>
                    )}
                <div className="mt-8 flex flex-col items-center gap-4">
                    <div className="h-px w-24 bg-linear-to-r from-transparent via-brand-cream/10 to-transparent" />
                    <p className="text-center text-[10px] font-medium uppercase tracking-[0.28em] text-white/20">
                        Powered by Cloove
                    </p>
                </div>
            </div>
        </div>
    )
}
