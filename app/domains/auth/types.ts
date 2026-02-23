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
    /** 'setup' means user has no password yet — OTP will be sent, then route to verify-otp */
    authMethod: 'password' | 'pin' | 'setup'
    /** False when OTP generation failed (e.g. cache unavailable) — user should hit Resend */
    otpSent?: boolean
    emailMasked?: string | null
    phoneNumberMasked?: string | null
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
    phoneNumber: string
    /** True when user has not yet set a dashboard password */
    setupRequired: boolean
    businesses?: LoginUserBusiness[]
}

export interface LoginResponse {
    token: string
    user?: LoginResponseUser
}
