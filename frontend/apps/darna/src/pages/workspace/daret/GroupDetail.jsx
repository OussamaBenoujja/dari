import FeaturePlaceholder from '../../../components/FeaturePlaceholder.jsx'

export default function DaretGroupDetailPage() {
  return (
    <FeaturePlaceholder
      eyebrow="Détail du groupe"
      title="Calendrier & membres"
      description="Affiche les tours, contributions, historique des paiements, rappels envoyés et score de fiabilité pour chaque membre."
      actions={[{ label: 'Enregistrer un paiement', tone: 'orange' }, { label: 'Ouvrir le chat', variant: 'outline' }]}
    />
  )
}
