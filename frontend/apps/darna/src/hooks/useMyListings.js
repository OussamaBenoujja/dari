import { useQuery } from '@tanstack/react-query'
import { fetchMyListings } from '../features/listings/api.js'

export const MY_LISTINGS_QUERY_KEY = ['my-listings']

function getMyListings({ queryKey }) {
  const [, params] = queryKey
  return fetchMyListings(params).then((response) => response.data)
}

export function useMyListings(params = {}, options = {}) {
  return useQuery({
    queryKey: [...MY_LISTINGS_QUERY_KEY, params],
    queryFn: getMyListings,
    refetchOnWindowFocus: false,
    enabled: options.enabled ?? true,
  })
}
