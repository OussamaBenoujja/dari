import { Section, PrimaryButton, StatusCard } from '@darna/ui-kit'
import { useListings } from '../../hooks/useListings.js'
import ListingCard from '../../components/ListingCard.jsx'

const stats = [
  {
    label: 'Annonces actives',
    value: '1 842',
    helper: '38 nouvelles aujourd’hui',
    tone: 'teal',
  },
  {
    label: 'Cercles d’épargne',
    value: '126',
    helper: '12 régions couvertes',
    tone: 'orange',
  },
  {
    label: 'Taux de réponse',
    value: '92%',
    helper: 'SLA < 5 min',
    tone: 'slate',
  },
]

const workflows = [
  {
    title: 'Recherche intelligente',
    body: 'Mots-clés, filtres avancés, géolocalisation et favoris synchronisés.',
    icon: '🔍',
    cta: 'Voir les annonces',
  },
  {
    title: 'Chat temps réel',
    body: 'Socket.IO pour leads chauds, transferts de fichiers et présence vendeur.',
    icon: '💬',
    cta: 'Ouvrir l’inbox',
  },
  {
    title: 'Daret / Tirelire',
    body: 'Épargne collective, suivi des tours et scoring de fiabilité intégré.',
    icon: '🤝',
    cta: 'Découvrir les groupes',
  },
  {
    title: 'Admin cockpit',
    body: 'KYC, modération, plans payants et métriques clés en un coup d’œil.',
    icon: '🛠️',
    cta: 'Consulter le dashboard',
  },
]

export default function HomePage() {
  const { data, isLoading, isError } = useListings({ limit: 6 })
  return (
    <main className="app-shell">
      <Section
        eyebrow="Plateforme Darna"
        title="Immobilier + épargne collective, réunis dans une seule interface"
        description="Lancez vos annonces, échangez avec vos prospects, pilotez vos plans d’abonnement et connectez Tirelire pour financer vos projets."
        kicker="API sécurisée, Keycloak, MinIO et Socket.IO déjà branchés."
      >
        <div className="action-row">
          <PrimaryButton tone="teal" onClick={() => document.getElementById('latest-listings')?.scrollIntoView({ behavior: 'smooth' })}>
            Commencer la recherche
          </PrimaryButton>
          <PrimaryButton variant="outline" tone="slate">
            Ouvrir un compte vendeur
          </PrimaryButton>
        </div>
      </Section>

      <div className="stats-grid">
        {stats.map((stat) => (
          <StatusCard key={stat.label} {...stat} />
        ))}
      </div>

      <Section
        align="start"
        eyebrow="Parcours couverts"
        title="Tout le cycle de vie de l’annonce"
        description="De la mise en ligne jusqu’à la signature et au suivi d’épargne collective, chaque étape dispose d’un module dédié."
      >
        <div className="feature-grid">
          {workflows.map((flow) => (
            <article key={flow.title} className="feature-card">
              <div className="feature-card__icon" aria-hidden="true">
                {flow.icon}
              </div>
              <div>
                <h3 className="feature-card__title">{flow.title}</h3>
                <p className="feature-card__body">{flow.body}</p>
              </div>
              <PrimaryButton variant="ghost" tone="slate">
                {flow.cta}
              </PrimaryButton>
            </article>
          ))}
        </div>
      </Section>

      <Section
        align="start"
        eyebrow="En direct"
        title="Dernières annonces publiées"
        description="Données servies depuis l’API Darna /api/realEstate/search"
        id="latest-listings"
      >
        {isLoading && <p>Chargement des annonces…</p>}
        {isError && <p>Impossible de contacter l’API. Vérifiez que le backend tourne.</p>}
        {data?.data?.length === 0 && !isLoading && !isError && (
          <div>
            <p>Aucune annonce n’a été retournée.</p>
            <PrimaryButton variant="outline" tone="slate">
              Créer la première annonce
            </PrimaryButton>
          </div>
        )}
        {data?.data?.length > 0 && !isLoading && !isError && (
          <div className="listing-grid">
            {data.data.map((listing) => (
              <ListingCard key={listing.id || listing._id} listing={listing} />
            ))}
          </div>
        )}
      </Section>
    </main>
  )
}
