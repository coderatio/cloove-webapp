import { format } from 'date-fns';

/**
 * Formats a numeric value into a currency string.
 * Defaults to Nigerian Naira (NGN).
 */
export function formatCurrency(
    value: number | string,
    options: {
        currency?: string;
        locale?: string;
        minimumFractionDigits?: number;
        notation?: 'standard' | 'compact';
    } = {}
): string {
    const {
        currency = 'NGN',
        locale = 'en-NG',
        minimumFractionDigits = 0,
        notation = 'standard'
    } = options;

    const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;

    const formatOpts = {
        style: 'currency' as const,
        currency,
        currencyDisplay: 'narrowSymbol' as const,
        minimumFractionDigits,
        maximumFractionDigits: notation === 'compact' ? 1 : 2,
        notation,
    };
    if (isNaN(numericValue)) return new Intl.NumberFormat(locale, formatOpts).format(0);

    return new Intl.NumberFormat(locale, formatOpts).format(numericValue);
}

/**
 * Strips all non-numeric characters from a string.
 * Useful for parsing currency inputs back to numbers.
 */
export function parseCurrencyToNumber(value: string): number {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    return parseFloat(cleaned) || 0;
}

/**
 * Formats a number with commas for live input viewing.
 */
export function formatNumberWithCommas(value: string | number): string {
    const stringValue = typeof value === 'number' ? value.toString() : value;
    const parts = stringValue.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
}

/**
 * Formats a numeric value into a compact currency string (e.g., 10k, 1.2m).
 */
export function formatCompactCurrency(
    value: number | string,
    options: {
        currency?: string;
        locale?: string;
    } = {}
): string {
    return formatCurrency(value, { ...options, notation: 'compact' });
}

/**
 * Formats a date string into a human-readable format.
 * Default: "MMM yyyy" (e.g., "Jan 2024")
 */
export function formatDate(date: string | Date | undefined, pattern: string = 'MMM yyyy') {
    if (!date || date === 'Unknown') return 'Unknown';
    try {
        let d: Date;
        if (typeof date === 'string') {
            const cleanedDate = date.replace(' •', '').replace('•', '');
            d = new Date(cleanedDate);
        } else {
            d = date;
        }

        if (isNaN(d.getTime())) {
            // Check if it's already in a relative format or similar
            if (typeof date === 'string' && (date.includes('ago') || date.includes('Never'))) {
                return date;
            }
            return 'Unknown';
        }
        return format(d, pattern);
    } catch {
        return 'Unknown';
    }
}
