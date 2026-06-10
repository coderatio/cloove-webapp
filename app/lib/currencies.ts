export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
}

export interface CurrencyOption {
  value: string;
  label: string;
}

/**
 * Offline fallback, mirroring the backend `CURRENCIES` catalog
 * (GET /api/exchange-rates/currencies). Used as initial data so pickers render
 * instantly and still work if the request fails.
 */
export const FALLBACK_CURRENCIES: CurrencyInfo[] = [
  { code: "NGN", name: "Nigerian Naira", symbol: "₦" },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "GH₵" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh" },
  { code: "RWF", name: "Rwandan Franc", symbol: "FRw" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "UGX", name: "Ugandan Shilling", symbol: "USh" },
  { code: "USD", name: "US Dollar", symbol: "$" },
];

export function currencySymbol(
  code: string | null | undefined,
  list: CurrencyInfo[] = FALLBACK_CURRENCIES,
): string {
  if (!code) return "";
  const match = list.find((item) => item.code === code.toUpperCase());
  return match?.symbol ?? code.toUpperCase();
}

/**
 * Builds Select options from a currency list, prepending the current value if
 * it isn't part of the list (e.g. a legacy code) so it stays selectable.
 */
export function buildCurrencyOptions(
  list: CurrencyInfo[],
  current?: string | null,
): CurrencyOption[] {
  const options = list.map((item) => ({
    value: item.code,
    label: `${item.code} - ${item.name}`,
  }));
  const code = current?.trim().toUpperCase();
  if (code && !options.some((option) => option.value === code)) {
    return [{ value: code, label: code }, ...options];
  }
  return options;
}
