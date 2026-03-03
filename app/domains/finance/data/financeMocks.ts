export interface FinanceTransactionMock {
    id: string
    reference: string
    type: 'Credit' | 'Debit'
    amount: string
    amountNumeric: number
    customer: string
    status: 'Cleared' | 'Pending' | 'Failed' | 'Processing'
    date: string
    dateLabel?: string
    fullDate?: string
    method: string
    storeId?: string
    sale?: {
        shortCode: string
        status: string
        customerName?: string
        totalAmount: number
    }
    withdrawal?: {
        bankName: string
        accountNumber: string
        accountName: string
    }
}

export const initialTransactions: FinanceTransactionMock[] = [
    {
        id: 'TX-9021', reference: 'TX-9021', type: 'Credit', amount: '₦45,000', amountNumeric: 45000, customer: 'Mrs. Adebayo', status: 'Cleared', date: 'Today, 10:30 AM', method: 'Bank Transfer', storeId: 'store-1',
        sale: { shortCode: '9021', status: 'COMPLETED', customerName: 'Mrs. Adebayo', totalAmount: 45000 }
    },
    { id: 'TX-9022', reference: 'TX-9022', type: 'Credit', amount: '₦12,500', amountNumeric: 12500, customer: 'Chief Okonkwo', status: 'Pending', date: 'Today, 09:15 AM', method: 'Bank Transfer', storeId: 'store-1' },
    {
        id: 'TX-9023', reference: 'TX-9023', type: 'Debit', amount: '₦8,000', amountNumeric: 8000, customer: 'Vendor: Alaba Textiles', status: 'Cleared', date: 'Yesterday', method: 'Cash', storeId: 'store-2'
    },
    {
        id: 'TX-9026', reference: 'TX-9026', type: 'Debit', amount: '₦50,000', amountNumeric: 50000, customer: 'Rent: Feb 2026', status: 'Cleared', date: 'Feb 1', method: 'Bank Transfer',
        withdrawal: { bankName: 'Access Bank', accountNumber: '0123456789', accountName: 'Cloove Business' }
    },
    { id: 'TX-9024', reference: 'TX-9024', type: 'Credit', amount: '₦24,000', amountNumeric: 24000, customer: 'Blessing Stores', status: 'Cleared', date: 'Yesterday', method: 'POS', storeId: 'store-1' },
    { id: 'TX-9025', reference: 'TX-9025', type: 'Credit', amount: '₦15,800', amountNumeric: 15800, customer: 'Mama Tunde', status: 'Pending', date: 'Feb 5', method: 'Bank Transfer', storeId: 'store-2' },
    { id: 'TX-9027', reference: 'TX-9027', type: 'Credit', amount: '₦5,500', amountNumeric: 5500, customer: 'Grace Fashion', status: 'Cleared', date: 'Jan 31', method: 'Cash', storeId: 'store-2' },
]
