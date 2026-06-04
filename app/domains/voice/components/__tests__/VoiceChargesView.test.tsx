import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CallIncoming01Icon, CallOutgoing01Icon, CallingIcon } from '@hugeicons/core-free-icons'

import {
    formatDuration,
    formatRateDisplay,
    getChargeDirectionIcon,
    ChargeStatusBadge,
    DebtStatusBadge,
    VoiceChargesView,
} from '../VoiceChargesView'

// ────────────────────────────────────────────────────────────────────────────
// Pure utility function tests
// ────────────────────────────────────────────────────────────────────────────

describe('formatDuration', () => {
    it('returns em dash for null/undefined/zero', () => {
        expect(formatDuration(null)).toBe('—')
        expect(formatDuration(undefined)).toBe('—')
        expect(formatDuration(0)).toBe('—')
        expect(formatDuration(-1)).toBe('—')
    })

    it('formats seconds only', () => {
        expect(formatDuration(30)).toBe('30s')
        expect(formatDuration(5)).toBe('5s')
    })

    it('formats minutes and seconds', () => {
        expect(formatDuration(90)).toBe('1m 30s')
        expect(formatDuration(125)).toBe('2m 5s')
        expect(formatDuration(3600)).toBe('60m 0s')
    })
})

describe('formatRateDisplay', () => {
    it('returns em dash when rate is null/undefined', () => {
        expect(formatRateDisplay(null, 'NGN')).toBe('—')
        expect(formatRateDisplay(undefined, 'NGN')).toBe('—')
    })

    it('formats rate per minute with given currency', () => {
        const result = formatRateDisplay(15.5, 'NGN')
        expect(result).toMatch(/₦/)
        expect(result).toMatch(/\/min/)
    })

    it('defaults to NGN when currency is null', () => {
        const result = formatRateDisplay(10, null)
        expect(result).toMatch(/₦/)
        expect(result).toMatch(/\/min/)
    })
})

describe('getChargeDirectionIcon', () => {
    it('returns PhoneCall for null/undefined', () => {
        expect(getChargeDirectionIcon(null)).toBeDefined()
        expect(getChargeDirectionIcon(undefined)).toBeDefined()
    })

    it('returns PhoneIncoming for inbound directions', () => {
        expect(getChargeDirectionIcon('inbound')).toBe(CallIncoming01Icon)
    })

    it('returns PhoneOutgoing for outbound directions', () => {
        expect(getChargeDirectionIcon('outbound')).toBe(CallOutgoing01Icon)
    })

    it('returns PhoneCall for other directions', () => {
        expect(getChargeDirectionIcon('transfer')).toBe(CallingIcon)
        expect(getChargeDirectionIcon('')).toBe(CallingIcon)
    })
})

// ────────────────────────────────────────────────────────────────────────────
// ChargeStatusBadge tests
// ────────────────────────────────────────────────────────────────────────────

describe('ChargeStatusBadge', () => {
    it('renders "Partial" when charge has shortfall', () => {
        const charge = {
            metadata: { shortfall: 50 },
            amount: 100,
            currency: 'NGN',
        } as any
        const { container } = render(ChargeStatusBadge({ charge }))
        expect(container.textContent).toContain('Partial')
    })

    it('renders "Charged" when no shortfall', () => {
        const charge = {
            metadata: {},
            amount: 100,
            currency: 'NGN',
        } as any
        const { container } = render(ChargeStatusBadge({ charge }))
        expect(container.textContent).toContain('Charged')
    })

    it('renders "Charged" when shortfall is zero', () => {
        const charge = {
            metadata: { shortfall: 0 },
            amount: 100,
            currency: 'NGN',
        } as any
        const { container } = render(ChargeStatusBadge({ charge }))
        expect(container.textContent).toContain('Charged')
    })
})

// ────────────────────────────────────────────────────────────────────────────
// DebtStatusBadge tests
// ────────────────────────────────────────────────────────────────────────────

describe('DebtStatusBadge', () => {
    it('renders "Settled" when remaining amount is zero', () => {
        const debt = { remainingAmount: 0 } as any
        const { container } = render(DebtStatusBadge({ debt }))
        expect(container.textContent).toContain('Settled')
    })

    it('renders "Settled" when remaining amount is negative', () => {
        const debt = { remainingAmount: -1 } as any
        const { container } = render(DebtStatusBadge({ debt }))
        expect(container.textContent).toContain('Settled')
    })

    it('renders "Outstanding" when remaining amount is positive', () => {
        const debt = { remainingAmount: 500 } as any
        const { container } = render(DebtStatusBadge({ debt }))
        expect(container.textContent).toContain('Outstanding')
    })
})

// ────────────────────────────────────────────────────────────────────────────
// VoiceChargesView component tests
// ────────────────────────────────────────────────────────────────────────────

// Mock the hooks
vi.mock('../../hooks/useVoice', () => ({
    useVoiceCallCharges: vi.fn(),
    useWalletDebts: vi.fn(),
}))

// Mock the business provider
vi.mock('@/app/components/BusinessProvider', () => ({
    useBusiness: vi.fn(() => ({
        activeBusiness: { id: 'biz-1', currency: 'NGN' },
    })),
}))

// Mock the media query hook
vi.mock('@/app/hooks/useMediaQuery', () => ({
    useIsMobile: vi.fn(() => false),
}))

// Mock component dependencies
vi.mock('@/app/components/DataTable', () => ({
    default: ({ columns, data, emptyMessage }: any) => (
        <div data-testid="data-table">
            <span data-testid="data-table-rows">{data.length}</span>
            <span data-testid="data-table-empty">{emptyMessage}</span>
        </div>
    ),
    Column: {} as any,
}))

vi.mock('@/app/components/ui/list-card', () => ({
    ListCard: ({ title, value }: any) => (
        <div data-testid="list-card">
            <span data-testid="list-card-title">{title}</span>
            <span data-testid="list-card-value">{value}</span>
        </div>
    ),
}))

vi.mock('@/app/components/ui/glass-card', () => ({
    GlassCard: ({ children, className }: any) => (
        <div data-testid="glass-card" className={className}>
            {children}
        </div>
    ),
}))

vi.mock('@/app/components/ui/skeleton', () => ({
    Skeleton: ({ className }: any) => (
        <div data-testid="skeleton" className={className} />
    ),
}))

vi.mock('@/app/components/shared/CurrencyText', () => ({
    CurrencyText: ({ value }: any) => <span data-testid="currency-text">{value}</span>,
}))

vi.mock('@/app/lib/formatters', () => ({
    formatCurrency: (val: number, opts?: any) =>
        `${opts?.currency === 'NGN' ? '₦' : '$'}${val}`,
    formatDate: (date: string) => (date ? 'Jan 15, 2025' : '—'),
}))

vi.mock('@/app/lib/utils', () => ({
    cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
    formatPhoneNumber: (phone: string) => phone,
}))

import * as useVoiceModule from '../../hooks/useVoice'
import * as mediaQueryModule from '@/app/hooks/useMediaQuery'

describe('VoiceChargesView', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Default: desktop, no data
        vi.mocked(useVoiceModule.useVoiceCallCharges).mockReturnValue({
            data: { data: [], meta: { page: 1, limit: 100 } },
            isLoading: false,
            isFetching: false,
        } as any)
        vi.mocked(useVoiceModule.useWalletDebts).mockReturnValue({
            data: { data: [], meta: { count: 0, totalOutstanding: 0, currency: 'NGN' } },
            isLoading: false,
        } as any)
    })

    it('shows loading skeleton when charges are loading', () => {
        vi.mocked(useVoiceModule.useVoiceCallCharges).mockReturnValue({
            data: undefined,
            isLoading: true,
            isFetching: false,
        } as any)
        vi.mocked(useVoiceModule.useWalletDebts).mockReturnValue({
            data: undefined,
            isLoading: true,
        } as any)

        const { container } = render(<VoiceChargesView />)
        const skeletons = container.querySelectorAll('[data-testid="skeleton"]')
        expect(skeletons.length).toBeGreaterThan(0)
    })

    it('renders empty state when no charges exist', () => {
        render(<VoiceChargesView />)
        expect(screen.getByText('No call charges yet')).toBeInTheDocument()
    })

    it('renders summary cards with charge data', () => {
        const mockCharges = [
            {
                id: 'ch-1',
                reference: 'REF-001',
                amount: 500,
                currency: 'NGN',
                description: 'Inbound call',
                voiceCallId: 'call-1',
                metadata: {
                    direction: 'inbound',
                    duration_seconds: 120,
                    rate_per_minute: 15,
                    country: 'Nigeria',
                },
                balanceBefore: 10000,
                balanceAfter: 9500,
                createdAt: '2025-01-15T10:30:00Z',
                processedAt: '2025-01-15T10:31:00Z',
            },
            {
                id: 'ch-2',
                reference: 'REF-002',
                amount: 750,
                currency: 'NGN',
                description: 'Outbound call',
                voiceCallId: 'call-2',
                metadata: {
                    direction: 'outbound',
                    duration_seconds: 300,
                    rate_per_minute: 25,
                    country: 'Nigeria',
                },
                balanceBefore: 9500,
                balanceAfter: 8750,
                createdAt: '2025-01-15T11:00:00Z',
                processedAt: '2025-01-15T11:01:00Z',
            },
        ]

        vi.mocked(useVoiceModule.useVoiceCallCharges).mockReturnValue({
            data: { data: mockCharges, meta: { page: 1, limit: 100 } },
            isLoading: false,
            isFetching: false,
        } as any)

        const { container } = render(<VoiceChargesView />)
        const currencyTexts = container.querySelectorAll('[data-testid="currency-text"]')
        expect(currencyTexts.length).toBeGreaterThan(0)
    })

    it('renders wallet debts section when debts exist', () => {
        vi.mocked(useVoiceModule.useWalletDebts).mockReturnValue({
            data: {
                data: [
                    {
                        id: 'debt-1',
                        businessId: 'biz-1',
                        walletId: 'wallet-1',
                        originType: 'voice_calls',
                        originId: 'call-1',
                        originDescription: 'Voice call charges',
                        originalAmount: 1500,
                        paidAmount: 500,
                        remainingAmount: 1000,
                        currency: 'NGN',
                        status: 'outstanding',
                        relatedTransactionId: null,
                        metadata: null,
                        settledAt: null,
                        createdAt: '2025-01-15T10:30:00Z',
                        updatedAt: null,
                    },
                ],
                meta: { count: 1, totalOutstanding: 1000, currency: 'NGN' },
            },
            isLoading: false,
        } as any)

        render(<VoiceChargesView />)
        expect(screen.getByText('Outstanding Wallet Debts')).toBeInTheDocument()
        expect(screen.getByText('Voice call charges')).toBeInTheDocument()
    })

    it('renders DataTable on desktop', () => {
        const mockCharges = [
            {
                id: 'ch-1',
                reference: 'REF-001',
                amount: 500,
                currency: 'NGN',
                description: 'Inbound call',
                voiceCallId: 'call-1',
                metadata: { direction: 'inbound', duration_seconds: 120, rate_per_minute: 15 },
                balanceBefore: 10000,
                balanceAfter: 9500,
                createdAt: '2025-01-15T10:30:00Z',
                processedAt: '2025-01-15T10:31:00Z',
            },
        ]

        vi.mocked(useVoiceModule.useVoiceCallCharges).mockReturnValue({
            data: { data: mockCharges, meta: { page: 1, limit: 100 } },
            isLoading: false,
            isFetching: false,
        } as any)

        const { container } = render(<VoiceChargesView />)
        const dataTable = container.querySelector('[data-testid="data-table"]')
        expect(dataTable).toBeInTheDocument()
    })

    it('renders ListCard on mobile', () => {
        // Override useIsMobile to return true
        vi.mocked(mediaQueryModule.useIsMobile).mockReturnValue(true)

        const mockCharges = [
            {
                id: 'ch-1',
                reference: 'REF-001',
                amount: 500,
                currency: 'NGN',
                description: 'Inbound call',
                voiceCallId: 'call-1',
                metadata: { direction: 'inbound', duration_seconds: 120, rate_per_minute: 15 },
                balanceBefore: 10000,
                balanceAfter: 9500,
                createdAt: '2025-01-15T10:30:00Z',
                processedAt: '2025-01-15T10:31:00Z',
            },
        ]

        vi.mocked(useVoiceModule.useVoiceCallCharges).mockReturnValue({
            data: { data: mockCharges, meta: { page: 1, limit: 100 } },
            isLoading: false,
            isFetching: false,
        } as any)

        const { container } = render(<VoiceChargesView />)
        const listCards = container.querySelectorAll('[data-testid="list-card"]')
        expect(listCards.length).toBeGreaterThan(0)
    })
})
