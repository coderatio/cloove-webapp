export type LoginStep = 'identifier' | 'verify' | 'setup-password' | 'success'

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
    authMethod: 'password' | 'pin' | 'setup'
    emailMasked?: string | null
    phoneNumberMasked?: string | null
}

export interface LoginResponse {
    token: string
    user?: {
        id: string
        fullName: string | null
        email: string | null
        phoneNumber: string
        setupRequired: boolean
    }
}
