export const EXPENSE_CATEGORIES = [
    { value: 'RENT', label: 'Rent', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
    { value: 'SALARY', label: 'Salary', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
    { value: 'UTILITIES', label: 'Utilities', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
    { value: 'SUPPLIES', label: 'Supplies', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
    { value: 'TRANSPORT', label: 'Transport', color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20' },
    { value: 'MAINTENANCE', label: 'Maintenance', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' },
    { value: 'MARKETING', label: 'Marketing', color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20' },
    { value: 'SUBSCRIPTION', label: 'Subscription', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
    { value: 'LEGAL', label: 'Legal', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' },
    { value: 'OTHER', label: 'Other', color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20' },
] as const

export type ExpenseCategoryValue = typeof EXPENSE_CATEGORIES[number]['value']

export function getCategoryConfig(value: string) {
    return EXPENSE_CATEGORIES.find(c => c.value === value) ?? EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1]
}
