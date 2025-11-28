import FeaturePlaceholder from '../../components/FeaturePlaceholder.jsx'

export default function SystemParamsPage() {
  return (
    <FeaturePlaceholder
      eyebrow="Plateforme"
      title="Paramètres système"
      description="Lecture seule des variables critiques exposées par l’API (base URLs, connecteurs, limites)."
      actions={[{ label: 'Actualiser', variant: 'outline' }]}
    />
  )
}
