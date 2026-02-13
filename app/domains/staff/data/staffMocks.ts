export type Role = 'OWNER' | 'STAFF' | 'ACCOUNTANT'

export const PERMISSIONS = [
    { id: 'VIEW_FINANCIALS', label: 'View Financials', category: 'Finance' },
    { id: 'VIEW_SALES', label: 'View Sales', category: 'Sales' },
    { id: 'RECORD_SALE', label: 'Record Sales', category: 'Sales' },
    { id: 'MANAGE_PRODUCTS', label: 'Manage Products', category: 'Operations' },
    { id: 'MANAGE_STAFF', label: 'Manage Staff', category: 'Management' },
    { id: 'RECORD_EXPENSE', label: 'Record Expenses', category: 'Finance' },
    { id: 'RECORD_REPAYMENT', label: 'Record Repayments', category: 'Finance' },
]

export const initialStaff = [
    {
        id: '1',
        name: 'Blessing Okon',
        phone: '+234 801 234 5678',
        role: 'STAFF' as Role,
        status: 'Active',
        permissions: ['VIEW_SALES', 'RECORD_SALE', 'RECORD_REPAYMENT']
    },
    {
        id: '2',
        name: 'Samuel Adebayo',
        phone: '+234 802 345 6789',
        role: 'ACCOUNTANT' as Role,
        status: 'Active',
        permissions: ['VIEW_FINANCIALS', 'VIEW_SALES', 'RECORD_EXPENSE', 'RECORD_REPAYMENT']
    },
    {
        id: '3',
        name: 'Chioma Nwosu',
        phone: '+234 803 456 7890',
        role: 'STAFF' as Role,
        status: 'Pending',
        permissions: ['VIEW_SALES', 'RECORD_SALE']
    },
]
