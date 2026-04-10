export type Role = 'OWNER' | 'STAFF' | 'ACCOUNTANT'

export type PermissionMeta = { label: string; category: string }

/**
 * Display metadata for every permission in the system.
 * Used to render permission toggles in the staff editor.
 * Filtered at render time using getPermissionsForPreset().
 */
export const ALL_PERMISSIONS: Record<string, PermissionMeta> = {
    // Finance
    VIEW_FINANCIALS:    { label: 'View Financials',     category: 'Finance' },
    VIEW_EXPENSES:      { label: 'View Expenses',        category: 'Finance' },
    RECORD_EXPENSE:     { label: 'Record Expenses',      category: 'Finance' },
    RECORD_REPAYMENT:   { label: 'Record Repayments',    category: 'Finance' },
    MANAGE_PAYOUTS:     { label: 'Manage Payouts',       category: 'Finance' },

    // Sales
    VIEW_SALES:         { label: 'View Sales',           category: 'Sales' },
    RECORD_SALE:        { label: 'Record Sales',         category: 'Sales' },
    UPDATE_SALE:        { label: 'Edit Sales',           category: 'Sales' },
    DELETE_SALE:        { label: 'Delete Sales',         category: 'Sales' },

    // Inventory
    VIEW_PRODUCTS:      { label: 'View Products',        category: 'Inventory' },
    MANAGE_PRODUCTS:    { label: 'Manage Products',      category: 'Inventory' },

    // Customers
    VIEW_CUSTOMERS:     { label: 'View Customers',       category: 'Customers' },
    CREATE_CUSTOMER:    { label: 'Add Customers',        category: 'Customers' },
    UPDATE_CUSTOMER:    { label: 'Edit Customers',       category: 'Customers' },
    DELETE_CUSTOMER:    { label: 'Delete Customers',     category: 'Customers' },

    // Suppliers
    VIEW_SUPPLIERS:     { label: 'View Suppliers',       category: 'Suppliers' },
    MANAGE_SUPPLIERS:   { label: 'Manage Suppliers',     category: 'Suppliers' },
    RECORD_PAYABLE:     { label: 'Record Payables',      category: 'Suppliers' },
    PAY_SUPPLIER:       { label: 'Pay Suppliers',        category: 'Suppliers' },

    // Staff & Management
    VIEW_STAFF:             { label: 'View Staff',           category: 'Management' },
    MANAGE_STAFF:           { label: 'Manage Staff',         category: 'Management' },
    MANAGE_SUBSCRIPTION:    { label: 'Manage Subscription',  category: 'Management' },
    MANAGE_BUSINESS_CONFIG: { label: 'Business Settings',    category: 'Management' },

    // General
    VIEW_DASHBOARD:     { label: 'View Dashboard',       category: 'General' },
    VIEW_STORES:        { label: 'View Stores',          category: 'General' },
    MANAGE_STORES:      { label: 'Manage Stores',        category: 'General' },

    // School preset
    VIEW_ACADEMIC_CALENDAR:    { label: 'View Academic Calendar',    category: 'School' },
    MANAGE_ACADEMIC_CALENDAR:  { label: 'Manage Academic Calendar',  category: 'School' },
    VIEW_FEE_TEMPLATES:        { label: 'View Fee Templates',        category: 'School' },
    MANAGE_FEE_TEMPLATES:      { label: 'Manage Fee Templates',      category: 'School' },

    // Restaurant preset
    VIEW_RESTAURANT_TABLES:    { label: 'View Tables',               category: 'Restaurant' },
    MANAGE_RESTAURANT_TABLES:  { label: 'Manage Tables',             category: 'Restaurant' },
    VIEW_KITCHEN_TICKETS:      { label: 'View Kitchen Board',        category: 'Restaurant' },
    MANAGE_KITCHEN_TICKETS:    { label: 'Manage Kitchen Tickets',    category: 'Restaurant' },
    VIEW_BAR_TICKETS:          { label: 'View Bar Board',            category: 'Restaurant' },
    MANAGE_BAR_TICKETS:        { label: 'Manage Bar Tickets',        category: 'Restaurant' },
}
