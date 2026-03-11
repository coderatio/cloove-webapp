export type LoginStep = 'identifier' | 'verify' | 'verify-otp' | 'setup-password' | 'success'

export interface CountryDetail {
    id: string
    name: string
    code: string
    phoneCode: string
    currency: {
        code: string
        symbol: string
    }
}

export interface IdentifyResponse {
    exists: boolean
    /** 'setup' means user has no password yet — OTP or email_link flow */
    authMethod: 'password' | 'pin' | 'setup'
    /** False when OTP generation failed (e.g. cache unavailable) — user should hit Resend */
    otpSent?: boolean
    /** 'email_link' = web+email: use verify-email link. 'whatsapp_activate' = phone: message bot first. 'otp' = OTP sent to email (e.g. admin). */
    setupVia?: 'otp' | 'email_link' | 'whatsapp_activate'
    /** True when user registered with phone via web, has a password, but phone is not yet verified */
    phoneActivationRequired?: boolean
    emailMasked?: string | null
    phoneNumberMasked?: string | null
    signupChannel?: string | null
}

/** Response from the OTP verification step (used before password setup) */
export interface OtpVerifyResponse {
    /** Short-lived token proving the user owns the identifier — pass to setup-password */
    setupToken: string
}

export interface LoginUserBusiness {
    id: string
    name: string
    slug: string
    currency: string
}

export interface LoginResponseUser {
    id: string
    fullName: string | null
    email: string | null
    phoneNumber: string | null
    /** True when user has not yet set a dashboard password */
    setupRequired: boolean
    emailVerified?: boolean
    phoneVerified?: boolean
    signupChannel?: string
    businesses?: LoginUserBusiness[]
}

export interface LoginResponse {
    token: string
    user?: LoginResponseUser
}
