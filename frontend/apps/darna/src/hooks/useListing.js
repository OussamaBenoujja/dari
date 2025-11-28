import { useQuery } from '@tanstack/react-query'
import { fetchListingById } from '../features/listings/api.js'

export function useListing(listingId, options = {}) {
  return useQuery({
    queryKey: ['listing', listingId],
    queryFn: async () => {
      const response = await fetchListingById(listingId)
      return response.data
    },
    enabled: Boolean(listingId) && (options.enabled ?? true),
    staleTime: options.staleTime ?? 30_000,
  })
}
