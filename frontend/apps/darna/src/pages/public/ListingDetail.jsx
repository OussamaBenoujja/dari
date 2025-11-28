import { useMemo } from 'react'
import { NavLink, useParams, useNavigate } from 'react-router-dom'
import { PrimaryButton, Section, StatusCard } from '@darna/ui-kit'
import FullScreenLoader from '../../components/feedback/FullScreenLoader.jsx'
import { useListing } from '../../hooks/useListing.js'
import { useAuth } from '../../hooks/useAuth.js'

export default function ListingDetailPage() {
  const { listingId } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { data, isLoading, isError, refetch } = useListing(listingId)
  const listing = data?.data

  const equipment = useMemo(() => {
    const entries = Object.entries(listing?.characteristics?.equipment ?? {})
    return entries
      .filter(([, enabled]) => Boolean(enabled))
      .map(([key]) => key.replace(/([A-Z])/g, ' $1').trim())
  }, [listing?.characteristics?.equipment])

  if (isLoading) {
    return <FullScreenLoader message="Chargement de l’annonce…" />
  }

  if (isError) {
    return (
      <Section title="Impossible de récupérer l’annonce" description="La ressource n’est pas disponible ou l’API ne répond pas.">
        <PrimaryButton onClick={() => refetch()} tone="teal">
          Réessayer
        </PrimaryButton>
      </Section>
    )
  }

  if (!listing) {
    return (
      <Section title="Annonce introuvable" description="Cette annonce a peut-être été retirée ou n’existe pas." align="center">
        <PrimaryButton onClick={() => navigate('/search')} variant="outline" tone="slate">
          Retour à la recherche
        </PrimaryButton>
      </Section>
    )
  }

  const heroImage = listing.media?.[0]?.url
  const publishedAt = listing.createdAt ? new Date(listing.createdAt) : null

  return (
    <div className="listing-detail">
      <header className="listing-detail__hero">
        {heroImage ? (
          <img src={heroImage} alt={listing.title} />
        ) : (
          <div className="listing-detail__placeholder" aria-hidden="true">
            📷
          </div>
        )}
        <div className="listing-detail__meta">
          <p className="eyebrow">Annonce #{listingId}</p>
          <h1>{listing.title}</h1>
          <p className="listing-detail__location">{formatLocation(listing)}</p>
          <p className="listing-detail__price">
            {listing.price?.toLocaleString?.('fr-FR')} {listing.currency} · {listing.transactionType}
          </p>
          <div className="listing-detail__actions">
            <PrimaryButton tone="teal" onClick={() => (isAuthenticated ? navigate('/workspace/leads') : navigate('/auth/login', { state: { from: `/listings/${listingId}` } }))}>
              Contacter le vendeur
            </PrimaryButton>
            <NavLink to="/workspace/financing">
              <PrimaryButton variant="outline" tone="slate">Simuler un crédit</PrimaryButton>
            </NavLink>
          </div>
        </div>
      </header>

      <section className="listing-detail__body">
        <Section
          align="start"
          eyebrow="Description"
          title="Présentation"
          description={listing.description}
        >
          <div className="listing-detail__stats">
            <StatusCard
              tone="teal"
              label="Surface"
              value={`${listing.characteristics?.totalSurface} m²`}
              helper={`${listing.characteristics?.bedroomCount} chambres`}
            />
            <StatusCard
              tone="orange"
              label="Salles d’eau"
              value={listing.characteristics?.bathroomCount}
              helper={listing.availability ? 'Disponible' : 'Indisponible'}
            />
            <StatusCard
              tone="slate"
              label="Publication"
              value={publishedAt ? publishedAt.toLocaleDateString('fr-MA') : 'N/A'}
              helper={`Visibilité ${listing.visibilityTier}`}
            />
          </div>
        </Section>

        <Section align="start" eyebrow="Caractéristiques" title="Confort & équipements">
          <div className="listing-detail__grid">
            <div>
              <h3>Localisation</h3>
              <ul>
                <li>Adresse: {listing.location?.address}</li>
                <li>Ville: {listing.location?.city}</li>
                <li>Pays: {listing.location?.country}</li>
                <li>
                  Coordonnées: {listing.location?.coordinates?.latitude}, {listing.location?.coordinates?.longitude}
                </li>
              </ul>
            </div>
            <div>
              <h3>Équipements</h3>
              {equipment.length > 0 ? (
                <ul className="listing-detail__chips">
                  {equipment.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>Aucun équipement renseigné.</p>
              )}
            </div>
            <div>
              <h3>Règles internes</h3>
              <ul>
                {renderRules(listing)}
              </ul>
            </div>
          </div>
        </Section>
      </section>
    </div>
  )
}

function formatLocation(listing) {
  return [listing.location?.address, listing.location?.city, listing.location?.country].filter(Boolean).join(' • ')
}

function renderRules(listing) {
  const rules = listing.characteristics?.internalRules
  if (!rules) {
    return <li>Aucune règle renseignée</li>
  }

  return ['animalsAllowed', 'smokingAllowed', 'partiesAllowed'].map((ruleKey) => {
    const allowed = rules[ruleKey]
    const labelMap = {
      animalsAllowed: 'Animaux',
      smokingAllowed: 'Fumeurs',
      partiesAllowed: 'Événements',
    }
    return (
      <li key={ruleKey} className={allowed ? 'rule-allowed' : 'rule-forbidden'}>
        {labelMap[ruleKey]} {allowed ? 'autorisés' : 'interdits'}
      </li>
    )
  })
}
