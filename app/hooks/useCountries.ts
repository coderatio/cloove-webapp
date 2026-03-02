import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/app/lib/api-client"
import type { CountryDetail } from "@/app/components/ui/country-selector"

const COUNTRIES_QUERY_KEY = ["countries"] as const

export function useCountries() {
    return useQuery({
        queryKey: COUNTRIES_QUERY_KEY,
        queryFn: () => apiClient.get<CountryDetail[]>("/security/countries"),
        staleTime: 1000 * 60 * 60,
    })
}
