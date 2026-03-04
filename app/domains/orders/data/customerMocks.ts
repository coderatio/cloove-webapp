export interface Customer {
    id: string;
    name: string;
    phone: string;
    email?: string;
    type: 'Walk-in' | 'Regular' | 'Wholesale';
    recentPurchases?: number;
}

export const mockCustomers: Customer[] = [
    { id: 'c1', name: 'Afolabi John', phone: '08012345678', email: 'afolabi@example.com', type: 'Regular', recentPurchases: 12 },
    { id: 'c2', name: 'Chioma Okeke', phone: '08123456789', email: 'chioma@example.com', type: 'Wholesale', recentPurchases: 25 },
    { id: 'c3', name: 'Musa Ibrahim', phone: '09034567890', type: 'Walk-in' },
    { id: 'c4', name: 'Sarah Williams', phone: '07045678901', email: 'sarah@example.com', type: 'Regular', recentPurchases: 5 },
    { id: 'c5', name: 'Olumide Bakare', phone: '08056712345', type: 'Walk-in' },
];
