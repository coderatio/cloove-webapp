"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";
import { FALLBACK_CURRENCIES, type CurrencyInfo } from "@/app/lib/currencies";

/**
 * Supported currencies from the backend catalog
 * (GET /api/exchange-rates/currencies). Falls back to the bundled list so
 * pickers always have data, and caches aggressively since it rarely changes.
 */
export function useCurrencies(): CurrencyInfo[] {
  const { data } = useQuery<CurrencyInfo[]>({
    queryKey: ["currencies"],
    queryFn: () => apiClient.get<CurrencyInfo[]>("/exchange-rates/currencies"),
    initialData: FALLBACK_CURRENCIES,
    staleTime: 1000 * 60 * 60,
  });
  return data?.length ? data : FALLBACK_CURRENCIES;
}
