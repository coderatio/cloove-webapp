export const MOCK_STATS = {
    referralCode: "CLV-USER",
    referralLink: "https://usecloove.com/signup?ref=CLV-USER",
    totalReferrals: 12,
    activeReferrals: 8,
    totalEarnings: 45000,
    availableBalance: 15000,
    pendingPayout: 5000
}

export const MOCK_PAYOUTS = [
    { id: 1, amount: 10000, status: "completed", date: "2024-02-01", bank: "Gtbank •••• 1234", reference: "REF-82392-X", items: [] },
    { id: 2, amount: 15000, status: "completed", date: "2024-01-15", bank: "Gtbank •••• 1234", reference: "REF-99231-Y", items: [] },
    { id: 3, amount: 5000, status: "pending", date: "2024-02-08", bank: "Gtbank •••• 1234", reference: "REF-11234-Z", items: [] },
]
