import FeaturePlaceholder from '../../components/FeaturePlaceholder.jsx'

export default function NotFoundPage() {
  return (
    <FeaturePlaceholder
      eyebrow="Perdu?"
      title="404"
      description="Cette page n’existe pas ou plus."
      actions={[{ label: 'Retour à l’accueil' }]}
    />
  )
}
