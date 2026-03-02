export interface Customer {
    id: string
    name: string
    orders: number
    totalSpent: string
    lastOrder: string
    owing: string
    phoneNumber: string
    email: string
    isBlacklisted: boolean
}

export const initialCustomers: Customer[] = [
    { id: '1', name: 'Mrs. Adebayo', orders: 12, totalSpent: '₦156,000', lastOrder: 'Today', owing: '₦15,000', phoneNumber: '08012345678', email: '', isBlacklisted: false },
    { id: '2', name: 'Chief Okonkwo', orders: 8, totalSpent: '₦89,500', lastOrder: 'Yesterday', owing: '₦8,500', phoneNumber: '07098765432', email: 'okonkwo@example.com', isBlacklisted: false },
    { id: '3', name: 'Fatima Shop', orders: 15, totalSpent: '₦234,000', lastOrder: 'Today', owing: '₦5,000', phoneNumber: '09011112222', email: '', isBlacklisted: false },
    { id: '4', name: 'Blessing Stores', orders: 6, totalSpent: '₦54,200', lastOrder: 'Feb 5', owing: '—', phoneNumber: '', email: 'blessing@example.com', isBlacklisted: false },
    { id: '5', name: 'Mama Tunde', orders: 4, totalSpent: '₦32,800', lastOrder: 'Feb 3', owing: '—', phoneNumber: '08033334444', email: '', isBlacklisted: false },
    { id: '6', name: 'Grace Fashion', orders: 9, totalSpent: '₦118,500', lastOrder: 'Feb 1', owing: '—', phoneNumber: '07055556666', email: 'grace@example.com', isBlacklisted: false },
]
