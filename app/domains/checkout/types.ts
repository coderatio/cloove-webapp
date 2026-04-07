export interface CheckoutDepositAccount {
  id: string
  bankName: string
  accountNumber: string
  accountName: string
  qrCodeUrl: string | null
  provider: string | null
}

export interface CheckoutData {
  reference: string
  businessName: string
  businessLogo: string | null
  businessCurrency: string
  amount: number | null
  title: string | null
  description: string | null
  targetType: 'SALE' | 'DEBT' | 'WALLET'
  isReusable: boolean
  isPaid: boolean
  isExpired: boolean
  customer: {
    name: string | null
    email: string | null
    phone: string | null
  }
  items: Array<{
    name: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }> | null
  depositAccounts?: CheckoutDepositAccount[] | null
  financialSummary?: {
    totalAmount: number
    amountPaid: number
    amountDue: number
  } | null
  academicContext?: {
    academicYear: string
    term: string
  } | null
}

export interface BankTransferData {
  accountName: string
  bankName: string
  accountNumber: string
  amount: number
  subtotal: number
  fee: number
  reference: string
  expiresAt: string
}

export type CheckoutStep = 'details' | 'payment' | 'success'

export interface PaymentProviderInfo {
  id: string
  name: string
  is_enabled: boolean
  logo_url: string | null
  virtual_account_mode: 'pool' | 'dynamic'
  dynamic_account_enabled: boolean
  static_account_priority: number
  dynamic_account_priority: number
}
