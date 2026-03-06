export interface ReferralStats {
    referralCode: string
    referralLink: string
    totalReferrals: number
    completedReferrals: number
    pendingReferrals: number
    totalEarnings: number
    availableBalance: number
    pendingWithdrawals: number
}

export interface ReferralWalletBalance {
    balance: number
    availableBalance: number
    pendingWithdrawals: number
}

export interface ReferralBankAccount {
    id: string
    bankName: string
    accountNumber: string
    accountName: string
    isPrimary: boolean
}

export interface ReferralPayout {
    id: string
    amount: number
    currency: string
    status: string
    createdAt: string
    processedAt: string | null
    reference: string
    bank: string | null
}

export interface ReferralListItem {
    id: string
    referredBusinessName: string | null
    status: string
    createdAt: string
    completedAt: string | null
}

export interface ReferralStatsResponse {
    data: ReferralStats
}

export interface PaginationMeta {
    total: number
    currentPage: number
    lastPage: number
    perPage?: number
}
