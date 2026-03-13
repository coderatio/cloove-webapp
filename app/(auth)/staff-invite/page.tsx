"use client"

import { useEffect, useState, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Loader2, CheckCircle2, ArrowRight, ShieldCheck, Briefcase, Mail, Info, LogOut, UserCircle, Lock, Eye, EyeOff } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { GlassCard } from "@/app/components/ui/glass-card"
import { apiClient } from "@/app/lib/api-client"
import { storage } from "@/app/lib/storage"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

type InviteStatus = 'loading' | 'pending' | 'setup_password' | 'active' | 'wrong_account' | 'error'

interface InviteData {
    businessName: string
    invitedEmail?: string
    invitedName?: string
    invitedUserId?: string
    hasPassword?: boolean
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
    const token = searchParams.get('token')
    const [status, setStatus] = useState<InviteStatus>('loading')
    const [inviteData, setInviteData] = useState<InviteData | null>(null)
    const [isAccepting, setIsAccepting] = useState(false)
    const isLoggedIn = typeof window !== 'undefined' && !!storage.getToken()

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
                const res = await apiClient.get<any>(`/staff/invitation/status?token=${token}`)
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
            setStatus('active')
            toast.success("Invitation accepted successfully")
        } catch (err: any) {
            const message = err.message || "Failed to accept invitation"
            // Detect "wrong account" error from backend
            if (err.statusCode === 403) {
                setStatus('wrong_account')
            } else {
                toast.error(message)
                if (err.statusCode === 400 || err.statusCode === 404) {
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
            const res = await apiClient.post<any>('/staff/invitation/accept-with-setup', {
                token,
                password,
            })

            // Auto-login: store the auth token
            if (res?.token) {
                storage.setToken(res.token)
            }

            // Set the active business if available
            if (res?.membership?.businessId) {
                storage.setActiveBusinessId(res.membership.businessId)
            }

            setStatus('active')
            toast.success("Welcome! Your account is ready.")
        } catch (err: any) {
            const message = err.message || "Failed to set up your account"
            toast.error(message)
            if (err.statusCode === 400 && message.includes('already has a password')) {
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
            <div className="min-h-dvh flex flex-col items-center justify-center bg-brand-deep-950 gap-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative w-24 h-24"
                >
                    <div className="absolute inset-0 rounded-full border-t-2 border-brand-gold animate-spin" />
                    <div className="absolute inset-4 rounded-full border-b-2 border-brand-green/30 animate-spin-slow" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 relative">
                            <Image src="/images/logo-white.png" alt="Cloove" fill className="object-contain opacity-50" />
                        </div>
                    </div>
                </motion.div>
                <p className="text-brand-cream/40 text-sm font-medium tracking-widest uppercase animate-pulse">
                    Verifying secure link...
                </p>
            </div>
        )
    }

    return (
        <div className="min-h-dvh w-full flex flex-col items-center justify-center p-4 relative overflow-hidden bg-brand-deep-950">
            {/* Background Decor */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-brand-gold/5 blur-[120px]" />
                <div className="absolute -bottom-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-brand-green/10 blur-[120px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-30 pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
            </div>

            <div className="w-full max-w-lg relative z-10 flex flex-col items-center">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex flex-col items-center mb-12"
                >
                    <div className="relative h-14 w-14 mb-4">
                        <Image src="/images/logo-white.png" alt="Cloove" fill className="object-contain" priority />
                    </div>
                </motion.div>

                <AnimatePresence mode="wait">
                    {status === 'pending' ? (
                        <motion.div
                            key="pending"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full"
                        >
                            <GlassCard className="p-8 md:p-12 border-white/5 bg-white/3 backdrop-blur-3xl relative overflow-hidden group shadow-2xl shadow-black/40">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-brand-gold/10 transition-colors duration-700" />

                                <div className="space-y-10 text-center relative z-10">
                                    <div className="space-y-4">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-gold/10 border border-brand-gold/20 mb-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse" />
                                            <span className="text-[10px] font-bold text-brand-gold uppercase tracking-wider">Join The Team</span>
                                        </div>
                                        <h1 className="text-3xl md:text-4xl font-serif text-brand-cream leading-tight">
                                            You&apos;ve been invited to join <br />
                                            <span className="text-transparent bg-clip-text bg-linear-to-r from-brand-gold to-brand-gold/50 font-bold">
                                                {inviteData?.businessName}
                                            </span>
                                        </h1>
                                        {inviteData?.invitedEmail && (
                                            <div className="flex items-center justify-center gap-2 text-brand-cream/40 text-sm">
                                                <Mail className="w-4 h-4" />
                                                <span>Invitation sent to {inviteData.invitedEmail}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                        <div className="p-5 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/8 transition-colors group/item">
                                            <div className="w-10 h-10 rounded-2xl bg-brand-gold/10 flex items-center justify-center mb-3 group-hover/item:scale-110 transition-transform">
                                                <ShieldCheck className="w-5 h-5 text-brand-gold" />
                                            </div>
                                            <h3 className="text-sm font-bold text-brand-cream mb-1">Secure Access</h3>
                                            <p className="text-xs text-brand-cream/40 leading-relaxed">Enterprise-grade security protecting your business account.</p>
                                        </div>
                                        <div className="p-5 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/8 transition-colors group/item">
                                            <div className="w-10 h-10 rounded-2xl bg-brand-green/10 flex items-center justify-center mb-3 group-hover/item:scale-110 transition-transform">
                                                <Briefcase className="w-5 h-5 text-brand-green" />
                                            </div>
                                            <h3 className="text-sm font-bold text-brand-cream mb-1">Smart Management</h3>
                                            <p className="text-xs text-brand-cream/40 leading-relaxed">Leverage powerful AI tools to track sales and inventory.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4">
                                        <Button
                                            onClick={handleAccept}
                                            disabled={isAccepting}
                                            className="w-full h-16 rounded-4xl bg-brand-gold text-brand-deep font-bold text-lg hover:bg-white transition-all duration-300 shadow-2xl shadow-brand-gold/20 flex items-center justify-center gap-3 active:scale-95 hover:text-brand-deep"
                                        >
                                            {isAccepting ? (
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                            ) : inviteData?.hasPassword === false ? (
                                                <>Set Up Account &amp; Join <ArrowRight className="w-5 h-5" /></>
                                            ) : !isLoggedIn ? (
                                                <>Log In &amp; Accept <ArrowRight className="w-5 h-5" /></>
                                            ) : (
                                                <>Accept &amp; Join Team <ArrowRight className="w-5 h-5" /></>
                                            )}
                                        </Button>
                                        <p className="text-[10px] text-brand-cream/20 text-center uppercase tracking-widest font-bold">
                                            By joining, you agree to the Cloove Terms of Service
                                        </p>
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>

                    ) : status === 'setup_password' ? (
                        <motion.div
                            key="setup_password"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full"
                        >
                            <GlassCard className="p-8 md:p-12 border-white/5 bg-white/3 backdrop-blur-3xl relative overflow-hidden group shadow-2xl shadow-black/40">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-brand-gold/10 transition-colors duration-700" />

                                <div className="space-y-8 relative z-10">
                                    <div className="text-center space-y-3">
                                        <div className="mx-auto w-16 h-16 rounded-full bg-brand-gold/10 flex items-center justify-center border border-brand-gold/20 mb-4">
                                            <Lock className="w-8 h-8 text-brand-gold" />
                                        </div>
                                        <h1 className="text-2xl md:text-3xl font-serif text-brand-cream leading-tight">
                                            Create Your Password
                                        </h1>
                                        <p className="text-brand-cream/50 text-sm max-w-xs mx-auto">
                                            Set up a password to secure your account and join{' '}
                                            <span className="text-brand-gold font-semibold">{inviteData?.businessName}</span>.
                                        </p>
                                    </div>

                                    <div className="space-y-5">
                                        {/* Password field */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-brand-cream/60 uppercase tracking-wider">
                                                New Password
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    placeholder="Min. 8 characters"
                                                    className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-4 pr-12 text-brand-cream placeholder:text-brand-cream/20 focus:outline-none focus:border-brand-gold/40 focus:ring-1 focus:ring-brand-gold/20 transition-all"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-cream/30 hover:text-brand-cream/60 transition-colors"
                                                >
                                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                </button>
                                            </div>

                                            {/* Password strength indicator */}
                                            {password.length > 0 && (
                                                <div className="space-y-1.5">
                                                    <div className="flex gap-1.5">
                                                        {[1, 2, 3].map((i) => (
                                                            <div
                                                                key={i}
                                                                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
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
                                            <label className="text-xs font-bold text-brand-cream/60 uppercase tracking-wider">
                                                Confirm Password
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    placeholder="Re-enter your password"
                                                    className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-4 pr-12 text-brand-cream placeholder:text-brand-cream/20 focus:outline-none focus:border-brand-gold/40 focus:ring-1 focus:ring-brand-gold/20 transition-all"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-cream/30 hover:text-brand-cream/60 transition-colors"
                                                >
                                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
                                            className="w-full h-16 rounded-4xl bg-brand-gold text-brand-deep font-bold text-lg hover:bg-white transition-all duration-300 shadow-2xl shadow-brand-gold/20 flex items-center justify-center gap-3 active:scale-95 hover:text-brand-deep disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            {isSettingUp ? (
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                            ) : (
                                                <>Create Password &amp; Join <ArrowRight className="w-5 h-5" /></>
                                            )}
                                        </Button>
                                        <button
                                            onClick={() => setStatus('pending')}
                                            className="w-full text-center text-sm text-brand-cream/30 hover:text-brand-cream/50 transition-colors py-2"
                                        >
                                            Back
                                        </button>
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>

                    ) : status === 'wrong_account' ? (
                        <motion.div
                            key="wrong_account"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full"
                        >
                            <GlassCard className="p-8 md:p-12 border-brand-gold/10 bg-white/3 backdrop-blur-3xl text-center space-y-8 shadow-2xl shadow-black/40">
                                <div className="mx-auto w-20 h-20 rounded-full bg-brand-gold/10 flex items-center justify-center border border-brand-gold/20">
                                    <UserCircle className="w-10 h-10 text-brand-gold" />
                                </div>

                                <div className="space-y-3">
                                    <h1 className="text-2xl font-serif text-brand-cream">Different Account Detected</h1>
                                    <p className="text-brand-cream/50 leading-relaxed max-w-xs mx-auto text-sm">
                                        This invitation was sent to{' '}
                                        <span className="text-brand-gold font-semibold">
                                            {inviteData?.invitedName || inviteData?.invitedEmail || 'another user'}
                                        </span>.
                                        You&apos;re currently logged in with a different account.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <Button
                                        onClick={handleSwitchAccount}
                                        className="w-full h-14 rounded-4xl bg-brand-gold text-brand-deep font-bold text-base hover:bg-white transition-all duration-300 shadow-xl shadow-brand-gold/20 flex items-center justify-center gap-3 active:scale-95 hover:text-brand-deep"
                                    >
                                        <LogOut className="w-5 h-5" />
                                        Switch Account &amp; Accept
                                    </Button>
                                    <Button
                                        onClick={() => router.push('/')}
                                        variant="outline"
                                        className="w-full h-14 rounded-4xl border-white/5 bg-white/5 text-brand-cream font-bold hover:bg-white/10 transition-all hover:text-brand-cream/60"
                                    >
                                        Back to Dashboard
                                    </Button>
                                </div>

                                <p className="text-[10px] text-brand-cream/20 uppercase tracking-widest font-bold">
                                    You&apos;ll be logged out and can sign in with the correct account
                                </p>
                            </GlassCard>
                        </motion.div>

                    ) : status === 'active' ? (
                        <motion.div
                            key="active"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full text-center"
                        >
                            <GlassCard className="p-12 border-brand-green/20 bg-brand-green/2 backdrop-blur-3xl relative overflow-hidden shadow-2xl shadow-black/40">
                                <div className="absolute flex justify-center inset-0 pointer-events-none opacity-20">
                                    <div className="w-full h-full bg-[radial-gradient(circle_at_center,var(--brand-green)_0%,transparent_70%)]" />
                                </div>

                                <div className="relative z-10 space-y-8">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 200, damping: 12 }}
                                        className="mx-auto w-24 h-24 rounded-full bg-brand-green/10 flex items-center justify-center border border-brand-green/20"
                                    >
                                        <CheckCircle2 className="w-12 h-12 text-brand-green" />
                                    </motion.div>

                                    <div className="space-y-3">
                                        <h1 className="text-4xl font-serif text-brand-cream">Welcome Aboard!</h1>
                                        <p className="text-brand-cream/60 max-w-xs mx-auto text-lg leading-relaxed">
                                            You are now a member of <span className="text-brand-gold font-bold">{inviteData?.businessName}</span>.
                                        </p>
                                    </div>

                                    <Button
                                        onClick={() => router.push('/')}
                                        className="w-full h-16 rounded-4xl bg-brand-cream text-brand-deep font-bold text-lg hover:bg-white transition-all duration-300 flex items-center justify-center gap-2 group hover:text-brand-cream/60"
                                    >
                                        Proceed to Dashboard
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </div>
                            </GlassCard>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full"
                        >
                            <GlassCard className="p-12 border-white/5 bg-white/3 backdrop-blur-3xl text-center space-y-8 shadow-2xl shadow-black/40">
                                <div className="mx-auto w-20 h-20 rounded-full bg-red-500/5 flex items-center justify-center border border-red-500/10">
                                    <Info className="w-10 h-10 text-red-500/60" />
                                </div>
                                <div className="space-y-3">
                                    <h1 className="text-2xl font-serif text-brand-cream">Invitation Expired</h1>
                                    <p className="text-brand-cream/40 leading-relaxed max-w-xs mx-auto">
                                        This invitation link is invalid or has expired for security reasons. Please ask the business owner to resend the invite.
                                    </p>
                                </div>
                                <Button
                                    onClick={() => router.push('/login')}
                                    variant="outline"
                                    className="w-full h-16 rounded-4xl border-white/5 bg-white/5 text-brand-cream font-bold hover:bg-white/10 transition-all hover:text-brand-cream/60"
                                >
                                    Back to Login
                                </Button>
                            </GlassCard>
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-12 flex flex-col items-center gap-6"
                >
                    <div className="h-px w-24 bg-linear-to-r from-transparent via-brand-cream/10 to-transparent" />
                    <p className="text-[10px] text-center text-brand-cream/20 uppercase tracking-[0.4em] font-medium">
                        Powered by Cloove AI Intelligence
                    </p>
                </motion.div>
            </div>

            <style jsx global>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 3s linear infinite;
                }
            `}</style>
        </div>
    )
}
