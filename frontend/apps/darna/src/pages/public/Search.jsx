import { useState } from 'react'
import { PrimaryButton, Section } from '@darna/ui-kit'
import { useListings } from '../../hooks/useListings.js'
import ListingCard from '../../components/ListingCard.jsx'

export default function SearchPage() {
  const [filters, setFilters] = useState({ transactionType: 'sale', limit: 20 })
  const { data, isLoading, isError, refetch } = useListings(filters)

  function handleChange(event) {
    const { name, value } = event.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    refetch()
  }

  return (
    <div className="app-shell">
      <Section
        eyebrow="Recherche avancée"
        title="Filtrez et explorez en direct"
        description="Les résultats sont récupérés depuis l’API `/api/realEstate/search` avec vos critères."
      >
        <form className="search-form" onSubmit={handleSubmit}>
          <label>
            Ville
            <input name="city" value={filters.city ?? ''} onChange={handleChange} placeholder="Casablanca" />
          </label>
          <label>
            Type de transaction
            <select name="transactionType" value={filters.transactionType} onChange={handleChange}>
              <option value="sale">Vente</option>
              <option value="daily rental">Location journalière</option>
              <option value="monthly">Location mensuelle</option>
              <option value="seasonal">Saisonnier</option>
            </select>
          </label>
          <label>
            Prix min (MAD)
            <input
              type="number"
              name="minPrice"
              value={filters.minPrice ?? ''}
              onChange={handleChange}
              min={0}
            />
          </label>
          <label>
            Prix max (MAD)
            <input
              type="number"
              name="maxPrice"
              value={filters.maxPrice ?? ''}
              onChange={handleChange}
              min={0}
            />
          </label>
          <PrimaryButton type="submit">Mettre à jour</PrimaryButton>
        </form>
      </Section>

      <Section align="start" title="Résultats">
        {isLoading && <p>Recherche en cours…</p>}
        {isError && <p>Erreur lors du chargement des annonces (API indisponible ?)</p>}
        {data?.data?.length === 0 && !isLoading && !isError && <p>Aucun résultat pour ces filtres.</p>}
        {data?.data?.length > 0 && !isLoading && !isError && (
          <div className="listing-grid">
            {data.data.map((listing) => (
              <ListingCard key={listing.id || listing._id} listing={listing} />
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}
