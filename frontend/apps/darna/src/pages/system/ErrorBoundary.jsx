import FeaturePlaceholder from '../../components/FeaturePlaceholder.jsx'

export default function ErrorBoundaryPage() {
  return (
    <FeaturePlaceholder
      eyebrow="Incident"
      title="500"
      description="Une erreur inattendue est survenue. Rafraîchissez ou contactez le support."
      actions={[{ label: 'Réessayer' }, { label: 'Contacter le support', variant: 'outline' }]}
    />
  )
}
