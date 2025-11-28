import FeaturePlaceholder from '../../../components/FeaturePlaceholder.jsx'

export default function DaretHistoryPage() {
  return (
    <FeaturePlaceholder
      eyebrow="Historique"
      title="Journal des contributions"
      description="Tableau de toutes les contributions, retards, rappels envoyés et intégration notifications."
      actions={[{ label: 'Exporter en CSV', variant: 'outline' }]}
    />
  )
}
