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
    } = {}
): string {
    const {
        currency = 'NGN',
        locale = 'en-NG',
        minimumFractionDigits = 0
    } = options;

    const numericValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numericValue)) return '₦0';

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits,
        maximumFractionDigits: 2,
    }).format(numericValue);
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
