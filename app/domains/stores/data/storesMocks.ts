export interface Store {
    id: string
    name: string
    location?: string
    isDefault: boolean
}

export const ALL_STORES_ID = 'all-stores'

export const allStores: Store = {
    id: ALL_STORES_ID,
    name: 'All Stores',
    isDefault: false
}

export const initialMockStores: Store[] = [
    { id: '1', name: 'Main Store', location: '12 Victoria Island', isDefault: true },
    { id: '2', name: 'Ikeja Branch', location: '42 Allen Avenue', isDefault: false },
    { id: '3', name: 'Abuja Store', location: 'Maitama District', isDefault: false },
]

export const mockStoreActivities = [
    { id: '1', type: 'sale' as const, description: 'New order for Bag of Rice', amount: '₦45,000', timeAgo: '2 mins ago' },
    { id: '2', type: 'payment' as const, description: 'Debt payment from Musa', amount: '₦12,000', timeAgo: '1 hour ago' },
    { id: '3', type: 'sale' as const, description: 'Stock updated: Peak Milk', amount: '+24 units', timeAgo: '3 hours ago' },
]
