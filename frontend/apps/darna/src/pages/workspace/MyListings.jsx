import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PrimaryButton, Section } from '@darna/ui-kit'
import ListingTable from '../../components/workspace/ListingTable.jsx'
import FullScreenLoader from '../../components/feedback/FullScreenLoader.jsx'
import { useMyListings, MY_LISTINGS_QUERY_KEY } from '../../hooks/useMyListings.js'
import { useAuth } from '../../hooks/useAuth.js'
import { deleteListing, updateListing } from '../../features/listings/api.js'

export default function MyListingsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isHydrated, isAuthenticated } = useAuth()
  const [busyId, setBusyId] = useState(null)
  const [feedback, setFeedback] = useState(null)

  const { data, isLoading, isError, refetch } = useMyListings(
    { limit: 100, sortBy: 'createdAt' },
    { enabled: isHydrated && isAuthenticated },
  )

  const listings = data?.data ?? []

  const toggleAvailability = useMutation({
    mutationFn: ({ listingId, availability }) => updateListing(listingId, { availability }),
    onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: MY_LISTINGS_QUERY_KEY })
      setFeedback({ type: 'success', message: 'Annonce mise à jour.' })
    },
    onError: (error) => {
      const message = error.response?.data?.message ?? 'Impossible de mettre à jour la disponibilité'
      setFeedback({ type: 'error', message })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (listingId) => deleteListing(listingId),
    onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: MY_LISTINGS_QUERY_KEY })
      setFeedback({ type: 'success', message: 'Annonce supprimée.' })
    },
    onError: (error) => {
      const message = error.response?.data?.message ?? 'Suppression impossible'
      setFeedback({ type: 'error', message })
    },
  })

  const handleToggleAvailability = async (listing) => {
    const listingId = listing.id || listing._id
    setBusyId(listingId)
    try {
      await toggleAvailability.mutateAsync({ listingId, availability: !listing.availability })
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (listing) => {
    const listingId = listing.id || listing._id
    if (!window.confirm('Supprimer définitivement cette annonce ?')) {
      return
    }
    setBusyId(listingId)
    try {
      await deleteMutation.mutateAsync(listingId)
    } finally {
      setBusyId(null)
    }
  }

  if (!isHydrated || (isLoading && !data)) {
    return <FullScreenLoader message="Chargement de vos annonces…" />
  }

  if (!isAuthenticated) {
    return (
      <Section
        eyebrow="Mes annonces"
        title="Connectez-vous"
        description="Identifiez-vous pour gérer vos annonces."
        align="start"
      />
    )
  }

  if (isError) {
    return (
      <Section
        eyebrow="Mes annonces"
        title="Impossible de charger vos annonces"
        description="L’API a renvoyé une erreur. Réessayez."
        align="start"
      >
        <PrimaryButton onClick={() => refetch()} tone="teal">
          Réessayer
        </PrimaryButton>
      </Section>
    )
  }

  return (
    <div className="workspace-shell">
      <header className="workspace-header">
        <div>
          <p className="eyebrow">Mes annonces</p>
          <h1>Tableau de bord annonceur</h1>
          <p>Gérez vos annonces, mettez en pause celles qui ne sont plus disponibles et créez-en de nouvelles.</p>
        </div>
        <PrimaryButton tone="teal" onClick={() => navigate('/workspace/create-listing')}>
          Nouvelle annonce
        </PrimaryButton>
      </header>

      {feedback && (
        <div className={`alert alert--${feedback.type}`} role="status">
          {feedback.message}
        </div>
      )}

      <ListingTable
        listings={listings}
        busyId={busyId}
        onView={(listing) => navigate(`/listings/${listing.id || listing._id}`)}
        onToggleAvailability={handleToggleAvailability}
        onDelete={handleDelete}
      />
    </div>
  )
}
