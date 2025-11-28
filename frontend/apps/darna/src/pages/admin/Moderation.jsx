import FeaturePlaceholder from '../../components/FeaturePlaceholder.jsx'

export default function ModerationPage() {
  return (
    <FeaturePlaceholder
      eyebrow="Modération"
      title="Annonces & signalements"
      description="File d’attente avec filtres, actions bulk (approuver, rejeter, demander corrections) et audit trail."
      actions={[{ label: 'Valider la sélection', tone: 'teal' }]}
    />
  )
}
