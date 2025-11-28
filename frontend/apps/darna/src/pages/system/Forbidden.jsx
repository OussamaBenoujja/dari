import FeaturePlaceholder from '../../components/FeaturePlaceholder.jsx'

export default function ForbiddenPage() {
  return (
    <FeaturePlaceholder
      eyebrow="Accès refusé"
      title="403"
      description="Votre rôle ne permet pas d’accéder à cette zone."
      actions={[{ label: 'Retour à l’accueil' }]}
    />
  )
}
