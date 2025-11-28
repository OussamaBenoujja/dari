import { useQuery } from '@tanstack/react-query'
import { searchListings } from '../features/listings/api.js'

export const LISTINGS_QUERY_KEY = ['listings']

export function fetchListings({ queryKey }) {
  const [_key, params] = queryKey
  return searchListings(params).then((response) => response.data)
}

export function useListings(filters = {}, options = {}) {
  return useQuery({
    queryKey: [...LISTINGS_QUERY_KEY, filters],
    queryFn: fetchListings,
    enabled: options.enabled ?? true,
    staleTime: options.staleTime ?? 60_000,
  })
}
