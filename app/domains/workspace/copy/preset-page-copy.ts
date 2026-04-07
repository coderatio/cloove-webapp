import type { LayoutPresetId } from "../nav/layout-presets"

/** Built-in dashboard action tiles (for permission filtering — not translated labels) */
export type DashboardActionKind = "pending_orders" | "low_stock" | "overdue_debts"

export interface OrdersUiCopy {
    stats: {
        totalRevenue: string
        totalOrders: string
        avgOrderValue: string
        pendingFulfillment: string
    }
    whisperPending: (pendingCount: number) => string
    whisperClear: string
    table: {
        customer: string
        summary: string
        total: string
        status: string
        time: string
        /** School preset: academic term on fee rows */
        term?: string
    }
    actionRequired: string
    recordSale: string
    sectionTitleLoading: string
    sectionTitle: string
    searchPlaceholder: string
    dateFilterPlaceholder: string
    filterGroups: {
        orderStatus: string
        paymentStatus: string
        type: string
    }
    errorLoadTitle: string
    errorLoadHint: string
    retry: string
    emptyFilteredTitle: string
    emptyUnfilteredTitle: string
    emptyFilteredHint: string
    emptyUnfilteredHint: string
    clearFilters: string
    recordFirstSale: string
    copyOrderIdTitle: string
    toastOrderIdCopied: string
    storeDescriptionFallback: string
    /** Shown under header on retail preset (fast checkout nudge); empty string hides */
    retailCheckoutBanner: string
    filterOptions: {
        orderStatus: {
            completed: string
            pending: string
            cancelled: string
            refunded: string
        }
        paymentStatus: {
            paid: string
            partial: string
            pending: string
        }
        type: {
            automated: string
            manual: string
        }
    }
}

export interface CustomersUiCopy {
    stats: {
        totalCustomers: string
        active30d: string
        newThisMonth: string
        totalCredit: string
    }
    whisperWithDebt: (owingCount: number, debtTotalDisplay: string) => string
    whisperClear: string
    table: {
        customer: string
        orders: string
        totalSpent: string
        lastOrder: string
        owing: string
    }
    relationshipList: string
    searchPlaceholder: string
    addCustomer: string
    filters: {
        storeLocation: string
        accountStatus: string
        hasDebt: string
        upToDate: string
    }
    actionsMenu: {
        sectionLabel: string
        viewProfile: string
        recordPayment: string
        directCall: string
        whatsappChat: string
        editProfile: string
        blacklist: string
        unblacklist: string
        makeVip: string
        demoteVip: string
    }
    listCard: {
        lastOrderPrefix: string
        noOrdersYet: string
        ordersTotalSuffix: string
        statusBlacklisted: string
        statusVip: string
        currentDebt: string
        totalLifetimeSpend: string
    }
    emptyState: {
        title: string
        hint: string
    }
    tableEmpty: string
    drawer: {
        editTitle: string
        addTitle: string
        editDescription: string
        addDescription: string
        nameLabel: string
        phoneLabel: string
        emailLabel: string
        blacklistTitle: string
        blacklistHint: string
        cancel: string
        saveChanges: string
        createButton: string
        removeProfile: string
    }
    deleteConfirm: {
        title: string
        description: (name: string) => string
        confirm: string
    }
}

export interface InventoryUiCopy {
    stats: {
        totalUnits: string
        products: string
        inventoryValue: string
    }
    whisperLowStock: (lowCount: number) => string
    whisperHealthy: string
    productList: string
    searchPlaceholder: string
    addProduct: string
    /** Pharmacy: optional banner above list (batch/expiry discipline); empty = hidden */
    expiryComplianceBanner: string
}

export interface FinanceUiCopy {
    whisperPendingReconciliation: (count: number) => string
    whisperReconciled: string
}

export interface PresetPageCopy {
    orders: {
        title: string
        descriptionWithStore: (storeName: string) => string
    }
    customers: {
        title: string
        descriptionWithStore: (storeName: string) => string
    }
    inventory: {
        title: string
        description: string
    }
    finance: {
        title: string
        descriptionWithStore: (storeName: string) => string
    }
    vendors: {
        title: string
        descriptionShort: string
        descriptionLong: string
    }
    debts: {
        title: string
        descriptionShort: string
        descriptionLong: string
    }
    expenses: {
        title: string
        descriptionShort: string
        descriptionLong: string
    }
    staff: {
        title: string
        description: string
    }
    paymentLinks: {
        title: string
        descriptionShort: string
        descriptionLong: string
    }
    activity: {
        title: string
        description: string
    }
    /** Orders page: stats row, whispers, table headers, filters */
    ordersUi: OrdersUiCopy
    /** Customers page */
    customersUi: CustomersUiCopy
    /** Inventory page */
    inventoryUi: InventoryUiCopy
    /** Finance page whispers */
    financeUi: FinanceUiCopy
    dashboard: {
        salesMetricLabel: string
        walletBalanceLabel: string
        needsAttentionTitle: string
        actions: Record<DashboardActionKind, string>
        inventoryPulseTitle: string
        inventoryPulseItemsSuffix: string
        inventoryLowStockLine: string
        inventoryLowStockHint: string
        inventoryFullyStockedHint: string
        /** Main dashboard InsightWhisper body (markdown) */
        insightAssistant: string
        insightViewReportLabel: string
        /** InventoryPulse when no low-stock lines */
        inventoryFullyStockedHeading: string
        /** Optional context line (NG/Africa vertical hints); empty hides */
        verticalHint: string
        /** School: fee-term reminder (shown when preset is school) */
        schoolFeeTermHint: string
    }
}

const DEFAULT_PAGE_COPY: PresetPageCopy = {
    orders: {
        title: "Orders",
        descriptionWithStore: (store: string) =>
            `Monitor sales pipeline and track order fulfillment for ${store}.`,
    },
    customers: {
        title: "Customers",
        descriptionWithStore: (store: string) =>
            `Manage customer relationships and track credit history for ${store}.`,
    },
    inventory: {
        title: "Inventory",
        description: "Track and manage your products across all stores.",
    },
    finance: {
        title: "Finance",
        descriptionWithStore: (store: string) => `Monitor cash flow and reconcile transactions for ${store}.`,
    },
    vendors: {
        title: "Vendors",
        descriptionShort: "Manage your suppliers.",
        descriptionLong: "Manage your suppliers and track payables.",
    },
    debts: {
        title: "Debts",
        descriptionShort: "Track customer debts.",
        descriptionLong: "Track and manage customer debts and repayments.",
    },
    expenses: {
        title: "Expenses",
        descriptionShort: "Track business expenses.",
        descriptionLong: "Track and manage your business expenses.",
    },
    staff: {
        title: "Staff Management",
        description: "Assign roles and manage permissions for your team members.",
    },
    paymentLinks: {
        title: "Payment Links",
        descriptionShort: "Manage payment links.",
        descriptionLong: "Manage payment links for sales, debts, and wallet top-ups.",
    },
    activity: {
        title: "Activity",
        description: "All sales, inventory, and payment events across your business.",
    },
    ordersUi: {
        stats: {
            totalRevenue: "Total Revenue",
            totalOrders: "Total Orders",
            avgOrderValue: "Avg. Order Value",
            pendingFulfillment: "Pending Fulfillment",
        },
        whisperPending: (n: number) =>
            `You have **${n} pending orders** awaiting fulfillment. Ensuring prompt delivery builds customer trust.`,
        whisperClear:
            "All orders have been successfully fulfilled. Your operations are running smoothly today.",
        table: {
            customer: "Customer",
            summary: "Summary",
            total: "Total",
            status: "Status",
            time: "Time",
        },
        actionRequired: "Action Required",
        recordSale: "Record Sale",
        sectionTitleLoading: "Fetching Records...",
        sectionTitle: "Recent Transactions",
        searchPlaceholder: "Search customer or ID...",
        dateFilterPlaceholder: "Filter by date",
        filterGroups: {
            orderStatus: "Order Status",
            paymentStatus: "Payment Status",
            type: "Type",
        },
        errorLoadTitle: "Failed to load orders",
        errorLoadHint:
            "Something went wrong while fetching your orders. Please check your connection and try again.",
        retry: "Retry",
        emptyFilteredTitle: "No orders match your criteria",
        emptyUnfilteredTitle: "No orders yet",
        emptyFilteredHint:
            "We couldn't find any orders matching your current filters. Try adjusting your search or filtering by a different status.",
        emptyUnfilteredHint:
            "Your sales pipeline is empty. Once you record a sale, it will appear here for you to track and manage.",
        clearFilters: "Clear All Filters",
        recordFirstSale: "Record Your First Sale",
        copyOrderIdTitle: "Copy Order ID",
        toastOrderIdCopied: "Order ID copied",
        storeDescriptionFallback: "your business",
        retailCheckoutBanner: "",
        filterOptions: {
            orderStatus: {
                completed: "Completed",
                pending: "Pending",
                cancelled: "Cancelled",
                refunded: "Refunded",
            },
            paymentStatus: {
                paid: "Paid",
                partial: "Partial",
                pending: "Pending",
            },
            type: {
                automated: "Automated",
                manual: "Manual",
            },
        },
    },
    customersUi: {
        stats: {
            totalCustomers: "Total Customers",
            active30d: "Active (30d)",
            newThisMonth: "New This Month",
            totalCredit: "Total Credit",
        },
        whisperWithDebt: (count: number, total: string) =>
            `There are **${count} customers** with unpaid debts totaling **${total}** on this page. Consider sending friendly reminders.`,
        whisperClear:
            "All customers on this page are up to date with their payments. Your credit health is looking excellent.",
        table: {
            customer: "Customer",
            orders: "Orders",
            totalSpent: "Total Spent",
            lastOrder: "Last Order",
            owing: "Owing",
        },
        relationshipList: "Relationship List",
        searchPlaceholder: "Search by name...",
        addCustomer: "Add Customer",
        filters: {
            storeLocation: "Store Location",
            accountStatus: "Account Status",
            hasDebt: "Has Debt",
            upToDate: "Up to Date",
        },
        actionsMenu: {
            sectionLabel: "Relationship Actions",
            viewProfile: "View Profile",
            recordPayment: "Record Payment",
            directCall: "Direct Call",
            whatsappChat: "WhatsApp Chat",
            editProfile: "Edit Profile",
            blacklist: "Blacklist",
            unblacklist: "Un-blacklist",
            makeVip: "Make VIP",
            demoteVip: "Demote from VIP",
        },
        listCard: {
            lastOrderPrefix: "Last order:",
            noOrdersYet: "No orders yet",
            ordersTotalSuffix: "orders total",
            statusBlacklisted: "Blacklisted",
            statusVip: "VIP",
            currentDebt: "Current Debt",
            totalLifetimeSpend: "Total Lifetime Spend",
        },
        emptyState: {
            title: "No customers found",
            hint: "Try adjusting your filters or search terms to find what you're looking for.",
        },
        tableEmpty: "No customers found",
        drawer: {
            editTitle: "Edit Profile",
            addTitle: "Add New Customer",
            editDescription: "Update customer information.",
            addDescription: "Start a new business relationship.",
            nameLabel: "Customer Name",
            phoneLabel: "Phone Number",
            emailLabel: "Email Address",
            blacklistTitle: "Blacklist Customer",
            blacklistHint: "Prevent this customer from making new orders.",
            cancel: "Cancel",
            saveChanges: "Save Changes",
            createButton: "Create Customer",
            removeProfile: "Remove Customer Profile",
        },
        deleteConfirm: {
            title: "Delete Customer Profile",
            description: (name: string) =>
                `Are you sure you want to remove ${name}? This action cannot be undone and will remove their contact records.`,
            confirm: "Delete Profile",
        },
    },
    inventoryUi: {
        stats: {
            totalUnits: "Total Units",
            products: "Products",
            inventoryValue: "Inventory Value",
        },
        whisperLowStock: (n: number) =>
            `You have **${n} items** critically low on stock. Consider restocking soon to avoid losing sales.`,
        whisperHealthy:
            "Your inventory levels are looking healthy. No urgent restocks required today.",
        productList: "Product List",
        searchPlaceholder: "Search products...",
        addProduct: "Add Product",
        expiryComplianceBanner: "",
    },
    financeUi: {
        whisperPendingReconciliation: (n: number) =>
            `You have **${n} payments** pending reconciliation. Use the **Re-query** tool to automatically verify bank transfers.`,
        whisperReconciled:
            "Your books are perfectly reconciled. All transactions have been cleared for the current period.",
    },
    dashboard: {
        salesMetricLabel: "Total Sales",
        walletBalanceLabel: "Wallet Balance",
        needsAttentionTitle: "Needs Attention",
        actions: {
            pending_orders: "Pending Orders",
            low_stock: "Low Stock",
            overdue_debts: "Overdue Debts",
        },
        inventoryPulseTitle: "Inventory Health",
        inventoryPulseItemsSuffix: "Items",
        inventoryLowStockLine: "Low Stock",
        inventoryLowStockHint: "Items need restocking soon to avoid missed sales.",
        inventoryFullyStockedHint: "Your inventory is healthy. No immediate actions needed.",
        insightAssistant: "View your assistant for tailored insights and reports.",
        insightViewReportLabel: "View Report",
        inventoryFullyStockedHeading: "Fully Stocked",
        verticalHint: "",
        schoolFeeTermHint: "",
    },
}

/** Partial nested overrides; merged with DEFAULT_PAGE_COPY in getPresetPageCopy */
const PRESET_OVERRIDES: Partial<Record<LayoutPresetId, any>> = {
    restaurant: {
        activity: {
            title: "Activity",
            description: "Service, inventory, and payment events across your business.",
        },
        orders: {
            title: "Sales & service",
            descriptionWithStore: (store: string) =>
                `Track service flow and fulfillment for ${store}.`,
        },
        customers: {
            title: "Guests",
            descriptionWithStore: (store: string) =>
                `Guest relationships and visit history for ${store}.`,
        },
        inventory: {
            title: "Menu & stock",
            description: "Track recipes, ingredients, and stock across locations.",
        },
        ordersUi: {
            stats: {
                totalRevenue: "Service revenue",
                totalOrders: "Service runs",
                avgOrderValue: "Avg. ticket",
                pendingFulfillment: "Pending service",
            },
            whisperPending: (n: number) =>
                `You have **${n} open service orders** awaiting completion. Quick turnaround keeps guests happy.`,
            whisperClear: "Service queue is clear. Great job keeping the floor running smoothly.",
            table: {
                customer: "Guest",
                summary: "Summary",
                total: "Total",
                status: "Status",
                time: "Time",
            },
            recordSale: "Record sale",
            sectionTitle: "Recent transactions",
            sectionTitleLoading: DEFAULT_PAGE_COPY.ordersUi.sectionTitleLoading,
            searchPlaceholder: "Search guest or ID...",
            dateFilterPlaceholder: DEFAULT_PAGE_COPY.ordersUi.dateFilterPlaceholder,
            actionRequired: DEFAULT_PAGE_COPY.ordersUi.actionRequired,
            filterGroups: {
                orderStatus: "Service status",
                paymentStatus: "Payment status",
                type: "Type",
            },
        },
        customersUi: {
            stats: {
                totalCustomers: "Total guests",
                active30d: "Active (30d)",
                newThisMonth: "New this month",
                totalCredit: "Open tabs",
            },
            whisperWithDebt: (count: number, total: string) =>
                `There are **${count} guests** with open balances totaling **${total}** on this page. Consider a friendly reminder.`,
            whisperClear:
                "Guests on this page are in good standing. Keep nurturing repeat visits.",
            table: {
                customer: "Guest",
                orders: "Visits",
                totalSpent: "Total spent",
                lastOrder: "Last visit",
                owing: "Owing",
            },
            relationshipList: "Guest list",
            searchPlaceholder: "Search by name...",
            addCustomer: "Add guest",
            actionsMenu: {
                sectionLabel: "Guest actions",
                viewProfile: "View profile",
                recordPayment: "Record payment",
                directCall: "Direct call",
                whatsappChat: "WhatsApp",
                editProfile: "Edit profile",
                blacklist: "Blacklist",
                unblacklist: "Un-blacklist",
                makeVip: "Mark VIP",
                demoteVip: "Remove VIP",
            },
            listCard: {
                lastOrderPrefix: "Last visit:",
                noOrdersYet: "No visits yet",
                ordersTotalSuffix: "visits total",
                statusBlacklisted: "Blacklisted",
                statusVip: "VIP",
                currentDebt: "Open tab",
                totalLifetimeSpend: "Lifetime spend",
            },
            emptyState: {
                title: "No guests found",
                hint: "Try another search or filter—or add a walk-in guest.",
            },
            tableEmpty: "No guests found",
            drawer: {
                editTitle: "Edit guest",
                addTitle: "Add guest",
                editDescription: "Update guest details.",
                addDescription: "Create a new guest profile for your floor.",
                nameLabel: "Guest name",
                phoneLabel: "Phone number",
                emailLabel: "Email address",
                blacklistTitle: "Blacklist guest",
                blacklistHint: "Stop this guest from placing new orders.",
                cancel: "Cancel",
                saveChanges: "Save changes",
                createButton: "Create guest",
                removeProfile: "Remove guest profile",
            },
            deleteConfirm: {
                title: "Remove guest profile",
                description: (name: string) =>
                    `Remove ${name} from your guest list? This cannot be undone and clears contact records.`,
                confirm: "Remove profile",
            },
        },
        inventoryUi: {
            stats: {
                totalUnits: "Total units",
                products: "Menu items",
                inventoryValue: "Stock value",
            },
            whisperLowStock: (n: number) =>
                `**${n} menu items** are critically low. Restock to avoid 86s during service.`,
            whisperHealthy: "Menu stock looks healthy. No urgent kitchen restocks today.",
            productList: "Menu & stock list",
            searchPlaceholder: "Search menu items...",
            addProduct: "Add menu item",
        },
        financeUi: {
            whisperPendingReconciliation: (n: number) =>
                `**${n} payments** need reconciliation against your payouts. Use **Re-query** to verify transfers.`,
            whisperReconciled: DEFAULT_PAGE_COPY.financeUi.whisperReconciled,
        },
        dashboard: {
            salesMetricLabel: "Service sales",
            walletBalanceLabel: DEFAULT_PAGE_COPY.dashboard.walletBalanceLabel,
            needsAttentionTitle: "Needs attention",
            actions: {
                pending_orders: "Pending service",
                low_stock: "Low menu stock",
                overdue_debts: DEFAULT_PAGE_COPY.dashboard.actions.overdue_debts,
            },
            inventoryPulseTitle: "Menu stock health",
            inventoryPulseItemsSuffix: "SKU",
            inventoryLowStockLine: "Low stock",
            inventoryLowStockHint: "Items need restocking to keep service running smoothly.",
            inventoryFullyStockedHint: "Stock levels look good for your menu.",
            insightAssistant:
                "Ask your assistant for labor, COGS, and peak-hour ideas tailored to hospitality.",
            insightViewReportLabel: DEFAULT_PAGE_COPY.dashboard.insightViewReportLabel,
            inventoryFullyStockedHeading: "Service stock OK",
            verticalHint:
                "Track transfers in **Finance** and keep **Menu & stock** tight to reduce 86s during peak service.",
            schoolFeeTermHint: "",
        },
    },
    retail: {
        orders: {
            title: "Checkout",
            descriptionWithStore: (store: string) =>
                `Monitor checkout and sales for ${store}.`,
        },
        inventory: {
            title: "Products & stock",
            description: "Manage product catalog and stock levels across stores.",
        },
        ordersUi: {
            stats: {
                totalRevenue: "Sales revenue",
                totalOrders: "Transactions",
                avgOrderValue: "Avg. basket",
                pendingFulfillment: "Pending pickup",
            },
            whisperPending: (n: number) =>
                `You have **${n} checkouts** awaiting completion. Quick handoff keeps shoppers happy.`,
            whisperClear: "Checkout queue is clear. Shelf operations look smooth.",
            table: {
                customer: "Customer",
                summary: "Summary",
                total: "Total",
                status: "Status",
                time: "Time",
            },
            recordSale: "New sale",
            sectionTitle: "Recent checkouts",
            sectionTitleLoading: DEFAULT_PAGE_COPY.ordersUi.sectionTitleLoading,
            searchPlaceholder: "Search receipt or customer...",
            dateFilterPlaceholder: DEFAULT_PAGE_COPY.ordersUi.dateFilterPlaceholder,
            actionRequired: DEFAULT_PAGE_COPY.ordersUi.actionRequired,
            filterGroups: {
                orderStatus: "Order status",
                paymentStatus: "Payment status",
                type: "Type",
            },
            retailCheckoutBanner:
                "For busy shops and open markets: keep **Checkout** fast with search and filters, and **Products & stock** accurate for shelf availability.",
        },
        customersUi: {
            stats: {
                totalCustomers: "Total customers",
                active30d: "Active (30d)",
                newThisMonth: "New this month",
                totalCredit: "Store credit",
            },
            whisperWithDebt: (count: number, total: string) =>
                `There are **${count} customers** with unpaid balances totaling **${total}** on this page. Consider a friendly reminder.`,
            whisperClear:
                "Customers on this page are in good standing. Loyalty and credit look healthy.",
            table: {
                customer: "Customer",
                orders: "Orders",
                totalSpent: "Total spent",
                lastOrder: "Last order",
                owing: "Owing",
            },
            relationshipList: "Customer list",
            searchPlaceholder: "Search name or phone...",
            addCustomer: "Add customer",
        },
        inventoryUi: {
            stats: {
                totalUnits: "Units on hand",
                products: "SKUs",
                inventoryValue: "Retail value",
            },
            whisperLowStock: (n: number) =>
                `**${n} SKUs** are below shelf minimum. Restock to avoid lost sales.`,
            whisperHealthy: "Shelf coverage looks healthy. No urgent replenishment today.",
            productList: "Catalog & stock",
            searchPlaceholder: "Search SKU or product...",
            addProduct: "Add product",
        },
        dashboard: {
            salesMetricLabel: "Checkout sales",
            walletBalanceLabel: DEFAULT_PAGE_COPY.dashboard.walletBalanceLabel,
            needsAttentionTitle: "Store alerts",
            actions: {
                pending_orders: "Pending checkouts",
                low_stock: "Low shelf stock",
                overdue_debts: DEFAULT_PAGE_COPY.dashboard.actions.overdue_debts,
            },
            inventoryPulseTitle: "Stock health",
            inventoryPulseItemsSuffix: "Products",
            inventoryLowStockLine: "Low stock",
            inventoryLowStockHint: "Restock soon to avoid empty shelves.",
            inventoryFullyStockedHint: "Shelf availability looks healthy.",
            insightAssistant: DEFAULT_PAGE_COPY.dashboard.insightAssistant,
            insightViewReportLabel: DEFAULT_PAGE_COPY.dashboard.insightViewReportLabel,
            inventoryFullyStockedHeading: DEFAULT_PAGE_COPY.dashboard.inventoryFullyStockedHeading,
            verticalHint:
                "Card and transfer payments reconcile in Finance—keep **Checkout** and stock aligned for smooth trading days.",
            schoolFeeTermHint: "",
        },
    },
    pharmacy: {
        activity: {
            title: "Activity",
            description: "Dispensing, stock, payments, and compliance-related events.",
        },
        customers: {
            title: "Patients",
            descriptionWithStore: (store: string) =>
                `Patient profiles and purchase history for ${store}.`,
        },
        orders: {
            title: "Dispensing",
            descriptionWithStore: (store: string) =>
                `Track dispensing and sales compliance for ${store}.`,
        },
        inventory: {
            title: "Stock & batches",
            description: "Monitor stock levels, batches, and expiry across stores.",
        },
        debts: {
            title: "Debts",
            descriptionShort: "Track outstanding balances.",
            descriptionLong: "Track patient balances and repayments.",
        },
        ordersUi: {
            stats: {
                totalRevenue: "Dispensing revenue",
                totalOrders: "Dispenses",
                avgOrderValue: "Avg. ticket",
                pendingFulfillment: "Pending fulfillment",
            },
            whisperPending: (n: number) =>
                `You have **${n} open dispenses** awaiting completion. Timely fulfillment supports patient care.`,
            whisperClear:
                "Dispensing queue is clear. Compliance and patient flow look on track.",
            table: {
                customer: "Patient",
                summary: "Summary",
                total: "Total",
                status: "Status",
                time: "Time",
            },
            recordSale: "Record sale",
            sectionTitle: "Recent dispensing",
            sectionTitleLoading: DEFAULT_PAGE_COPY.ordersUi.sectionTitleLoading,
            searchPlaceholder: "Search patient or order ID...",
            dateFilterPlaceholder: DEFAULT_PAGE_COPY.ordersUi.dateFilterPlaceholder,
            actionRequired: DEFAULT_PAGE_COPY.ordersUi.actionRequired,
            filterGroups: {
                orderStatus: "Order status",
                paymentStatus: "Payment status",
                type: "Type",
            },
        },
        customersUi: {
            stats: {
                totalCustomers: "Total patients",
                active30d: "Active (30d)",
                newThisMonth: "New this month",
                totalCredit: "Outstanding balance",
            },
            whisperWithDebt: (count: number, total: string) =>
                `There are **${count} patients** with unpaid balances totaling **${total}** on this page. Consider sending reminders.`,
            whisperClear:
                "Patients on this page are up to date with payments. Balances look healthy.",
            table: {
                customer: "Patient",
                orders: "Visits",
                totalSpent: "Total spent",
                lastOrder: "Last visit",
                owing: "Balance",
            },
            relationshipList: "Patient register",
            searchPlaceholder: "Search patient name...",
            addCustomer: "Add patient",
            filters: {
                storeLocation: "Branch",
                accountStatus: "Account status",
                hasDebt: "Has balance",
                upToDate: "Cleared",
            },
            actionsMenu: {
                sectionLabel: "Patient actions",
                viewProfile: "View profile",
                recordPayment: "Record payment",
                directCall: "Direct call",
                whatsappChat: "WhatsApp",
                editProfile: "Edit profile",
                blacklist: "Block",
                unblacklist: "Unblock",
                makeVip: "Mark VIP",
                demoteVip: "Remove VIP",
            },
            listCard: {
                lastOrderPrefix: "Last visit:",
                noOrdersYet: "No visits yet",
                ordersTotalSuffix: "visits total",
                statusBlacklisted: "Blocked",
                statusVip: "VIP",
                currentDebt: "Balance due",
                totalLifetimeSpend: "Total paid",
            },
            emptyState: {
                title: "No patients found",
                hint: "Adjust search or filters—or add a walk-in patient profile.",
            },
            tableEmpty: "No patients found",
            drawer: {
                editTitle: "Edit patient",
                addTitle: "New patient",
                editDescription: "Update patient and contact details.",
                addDescription: "Create a patient profile for dispensing and visits.",
                nameLabel: "Patient name",
                phoneLabel: "Phone number",
                emailLabel: "Email address",
                blacklistTitle: "Block patient",
                blacklistHint: "Stop this patient from new orders until cleared.",
                cancel: "Cancel",
                saveChanges: "Save changes",
                createButton: "Create patient",
                removeProfile: "Remove patient profile",
            },
            deleteConfirm: {
                title: "Delete patient profile",
                description: (name: string) =>
                    `Remove ${name}? This cannot be undone and deletes stored contact details for this profile.`,
                confirm: "Delete profile",
            },
        },
        inventoryUi: {
            stats: {
                totalUnits: "Total units",
                products: "SKU lines",
                inventoryValue: "Stock value",
            },
            whisperLowStock: (n: number) =>
                `**${n} lines** are critically low. Restock to avoid stock-outs and compliance gaps.`,
            whisperHealthy:
                "Stock levels look healthy. No urgent replenishment flagged today.",
            productList: "Stock & batch list",
            searchPlaceholder: "Search product or batch...",
            addProduct: "Add product",
            expiryComplianceBanner:
                "Review batch expiry dates on receipts and shelves—especially high-turn items. Accurate stock protects patients and audits.",
        },
        financeUi: {
            whisperPendingReconciliation: (n: number) =>
                `**${n} payments** need reconciliation against payouts. Use **Re-query** to verify transfers and stay audit-ready.`,
            whisperReconciled: DEFAULT_PAGE_COPY.financeUi.whisperReconciled,
        },
        dashboard: {
            salesMetricLabel: "Dispensing total",
            walletBalanceLabel: DEFAULT_PAGE_COPY.dashboard.walletBalanceLabel,
            needsAttentionTitle: "Compliance & stock",
            actions: {
                pending_orders: "Pending dispensing",
                low_stock: "Low stock alerts",
                overdue_debts: "Overdue balances",
            },
            inventoryPulseTitle: "Stock health",
            inventoryPulseItemsSuffix: "Lines",
            inventoryLowStockLine: "Low stock",
            inventoryLowStockHint: "Restock critical lines to avoid stock-outs.",
            inventoryFullyStockedHint: "Stock levels are within target ranges.",
            insightAssistant: DEFAULT_PAGE_COPY.dashboard.insightAssistant,
            insightViewReportLabel: DEFAULT_PAGE_COPY.dashboard.insightViewReportLabel,
            inventoryFullyStockedHeading: "Lines within range",
            verticalHint:
                "Reconcile bank transfers promptly—**Finance** and **Stock & batches** together reduce compliance gaps.",
            schoolFeeTermHint: "",
        },
    },
    school: {
        activity: {
            title: "Activity",
            description: "Fees, resources, payments, and people-related events.",
        },
        customers: {
            title: "Students & parents",
            descriptionWithStore: (store: string) =>
                `Relationships and fee history for ${store}.`,
        },
        orders: {
            title: "Fees & sales",
            descriptionWithStore: (store: string) =>
                `Track fees, payments, and sales for ${store}.`,
        },
        inventory: {
            title: "Resources & stock",
            description: "Manage books, uniforms, and consumables across locations.",
        },
        staff: {
            title: "Faculty & staff",
            description: "Roles and permissions for your team.",
        },
        paymentLinks: {
            title: "Fee payment links",
            descriptionShort: "Share links for tuition and fees.",
            descriptionLong:
                "Create and manage links parents use to pay school fees, outstanding balances, and wallet top-ups.",
        },
        expenses: {
            title: "Expenses",
            descriptionShort: "Track school operating costs.",
            descriptionLong: "Track and manage operating expenses.",
        },
        ordersUi: {
            stats: {
                totalRevenue: "Fees & sales",
                totalOrders: "Transactions",
                avgOrderValue: "Avg. payment",
                pendingFulfillment: "Pending payment",
            },
            whisperPending: (n: number) =>
                `You have **${n} fee or sales records** awaiting completion. Follow up to keep accounts current.`,
            whisperClear:
                "Fee and sales activity is up to date. Your billing rhythm looks steady.",
            table: {
                customer: "Payer",
                summary: "Summary",
                total: "Total",
                status: "Status",
                time: "Time",
                term: "Term",
            },
            recordSale: "Record payment",
            sectionTitle: "Recent fees & sales",
            sectionTitleLoading: DEFAULT_PAGE_COPY.ordersUi.sectionTitleLoading,
            searchPlaceholder: "Search student, parent, or receipt...",
            dateFilterPlaceholder: DEFAULT_PAGE_COPY.ordersUi.dateFilterPlaceholder,
            actionRequired: DEFAULT_PAGE_COPY.ordersUi.actionRequired,
            filterGroups: {
                orderStatus: "Status",
                paymentStatus: "Payment status",
                type: "Type",
            },
        },
        customersUi: {
            stats: {
                totalCustomers: "Total contacts",
                active30d: "Active (30d)",
                newThisMonth: "New this month",
                totalCredit: "Fees owed",
            },
            whisperWithDebt: (count: number, total: string) =>
                `There are **${count} contacts** with outstanding fees totaling **${total}** on this page. Consider a gentle reminder.`,
            whisperClear:
                "Fee accounts on this page are current. Family relationships look healthy.",
            table: {
                customer: "Student / parent",
                orders: "Transactions",
                totalSpent: "Total paid",
                lastOrder: "Last activity",
                owing: "Owing",
            },
            relationshipList: "Directory",
            searchPlaceholder: "Search student or parent...",
            addCustomer: "Add contact",
            filters: {
                storeLocation: "Campus / branch",
                accountStatus: "Fee status",
                hasDebt: "Fees owing",
                upToDate: "Fees up to date",
            },
            actionsMenu: {
                sectionLabel: "Contact actions",
                viewProfile: "View profile",
                recordPayment: "Record payment",
                directCall: "Direct call",
                whatsappChat: "WhatsApp",
                editProfile: "Edit profile",
                blacklist: "Restrict",
                unblacklist: "Remove restriction",
                makeVip: "Mark priority",
                demoteVip: "Remove priority",
            },
            listCard: {
                lastOrderPrefix: "Last activity:",
                noOrdersYet: "No activity yet",
                ordersTotalSuffix: "transactions total",
                statusBlacklisted: "Restricted",
                statusVip: "Priority",
                currentDebt: "Fees owing",
                totalLifetimeSpend: "Total paid",
            },
            emptyState: {
                title: "No contacts found",
                hint: "Try another search or filter—or add a parent or student contact.",
            },
            tableEmpty: "No contacts found",
            drawer: {
                editTitle: "Edit contact",
                addTitle: "Add contact",
                editDescription: "Update student or parent details.",
                addDescription: "Add a family contact for fees and communication.",
                nameLabel: "Full name",
                phoneLabel: "Phone number",
                emailLabel: "Email address",
                blacklistTitle: "Restrict contact",
                blacklistHint: "Block new fee charges until resolved.",
                cancel: "Cancel",
                saveChanges: "Save changes",
                createButton: "Create contact",
                removeProfile: "Remove contact",
            },
            deleteConfirm: {
                title: "Remove contact",
                description: (name: string) =>
                    `Remove ${name} from your directory? This cannot be undone and clears stored contact details.`,
                confirm: "Remove",
            },
        },
        inventoryUi: {
            stats: {
                totalUnits: "Total units",
                products: "Resource lines",
                inventoryValue: "Stock value",
            },
            whisperLowStock: (n: number) =>
                `**${n} resource lines** are low. Restock so classes and programs stay supplied.`,
            whisperHealthy: "Resource stock looks healthy. No urgent reorders today.",
            productList: "Resources list",
            searchPlaceholder: "Search resource or SKU...",
            addProduct: "Add resource",
        },
        dashboard: {
            salesMetricLabel: "Fee & sales total",
            walletBalanceLabel: DEFAULT_PAGE_COPY.dashboard.walletBalanceLabel,
            needsAttentionTitle: "Needs attention",
            actions: {
                pending_orders: "Pending payments",
                low_stock: "Low resource stock",
                overdue_debts: "Outstanding balances",
            },
            inventoryPulseTitle: "Resource stock",
            inventoryPulseItemsSuffix: "Items",
            inventoryLowStockLine: "Low stock",
            inventoryLowStockHint: "Restock resources so programs can run without disruption.",
            inventoryFullyStockedHint: "Resource levels look good.",
            insightAssistant: DEFAULT_PAGE_COPY.dashboard.insightAssistant,
            insightViewReportLabel: DEFAULT_PAGE_COPY.dashboard.insightViewReportLabel,
            inventoryFullyStockedHeading: "Resources OK",
            verticalHint:
                "Align **Fees & sales** with **Students & parents**—term-style billing is easier when contacts and receipts match.",
            schoolFeeTermHint:
                "Tip: filter fees by session or class in **Fees & sales**, and keep the **Directory** current for parent communication.",
        },
    },
}

function deepMergeDashboard(
    base: PresetPageCopy["dashboard"],
    over?: Partial<PresetPageCopy["dashboard"]>
): PresetPageCopy["dashboard"] {
    if (!over) return base
    return {
        ...base,
        ...over,
        actions: { ...base.actions, ...over.actions },
    }
}

function mergeOrdersUi(base: OrdersUiCopy, over?: Partial<OrdersUiCopy>): OrdersUiCopy {
    if (!over) return base
    const filterOptions =
        over.filterOptions != null
            ? {
                  orderStatus: {
                      ...base.filterOptions.orderStatus,
                      ...over.filterOptions.orderStatus,
                  },
                  paymentStatus: {
                      ...base.filterOptions.paymentStatus,
                      ...over.filterOptions.paymentStatus,
                  },
                  type: { ...base.filterOptions.type, ...over.filterOptions.type },
              }
            : base.filterOptions
    return {
        ...base,
        ...over,
        stats: { ...base.stats, ...over.stats },
        table: { ...base.table, ...over.table },
        filterGroups: { ...base.filterGroups, ...over.filterGroups },
        filterOptions,
    }
}

function mergeCustomersUi(base: CustomersUiCopy, over?: Partial<CustomersUiCopy>): CustomersUiCopy {
    if (!over) return base
    return {
        ...base,
        ...over,
        stats: { ...base.stats, ...over.stats },
        table: { ...base.table, ...over.table },
        filters: over.filters ? { ...base.filters, ...over.filters } : base.filters,
        actionsMenu: over.actionsMenu ? { ...base.actionsMenu, ...over.actionsMenu } : base.actionsMenu,
        listCard: over.listCard ? { ...base.listCard, ...over.listCard } : base.listCard,
        emptyState: over.emptyState ? { ...base.emptyState, ...over.emptyState } : base.emptyState,
        drawer: over.drawer ? { ...base.drawer, ...over.drawer } : base.drawer,
        deleteConfirm: over.deleteConfirm
            ? {
                  ...base.deleteConfirm,
                  ...over.deleteConfirm,
                  description: over.deleteConfirm.description ?? base.deleteConfirm.description,
              }
            : base.deleteConfirm,
    }
}

function mergeInventoryUi(base: InventoryUiCopy, over?: Partial<InventoryUiCopy>): InventoryUiCopy {
    if (!over) return base
    return {
        ...base,
        ...over,
        stats: { ...base.stats, ...over.stats },
    }
}

function mergeFinanceUi(base: FinanceUiCopy, over?: Partial<FinanceUiCopy>): FinanceUiCopy {
    if (!over) return base
    return { ...base, ...over }
}

export function getPresetPageCopy(presetId: string | null | undefined): PresetPageCopy {
    const id = (presetId && presetId in PRESET_OVERRIDES ? presetId : "default") as LayoutPresetId
    const o = PRESET_OVERRIDES[id]
    if (!o) return DEFAULT_PAGE_COPY

    return {
        orders: { ...DEFAULT_PAGE_COPY.orders, ...o.orders },
        customers: { ...DEFAULT_PAGE_COPY.customers, ...o.customers },
        inventory: { ...DEFAULT_PAGE_COPY.inventory, ...o.inventory },
        finance: { ...DEFAULT_PAGE_COPY.finance, ...o.finance },
        vendors: { ...DEFAULT_PAGE_COPY.vendors, ...o.vendors },
        debts: { ...DEFAULT_PAGE_COPY.debts, ...o.debts },
        expenses: { ...DEFAULT_PAGE_COPY.expenses, ...o.expenses },
        staff: { ...DEFAULT_PAGE_COPY.staff, ...o.staff },
        paymentLinks: { ...DEFAULT_PAGE_COPY.paymentLinks, ...o.paymentLinks },
        activity: { ...DEFAULT_PAGE_COPY.activity, ...o.activity },
        ordersUi: mergeOrdersUi(DEFAULT_PAGE_COPY.ordersUi, o.ordersUi as Partial<OrdersUiCopy> | undefined),
        customersUi: mergeCustomersUi(
            DEFAULT_PAGE_COPY.customersUi,
            o.customersUi as Partial<CustomersUiCopy> | undefined
        ),
        inventoryUi: mergeInventoryUi(
            DEFAULT_PAGE_COPY.inventoryUi,
            o.inventoryUi as Partial<InventoryUiCopy> | undefined
        ),
        financeUi: mergeFinanceUi(DEFAULT_PAGE_COPY.financeUi, o.financeUi as Partial<FinanceUiCopy> | undefined),
        dashboard: deepMergeDashboard(DEFAULT_PAGE_COPY.dashboard, o.dashboard),
    }
}
