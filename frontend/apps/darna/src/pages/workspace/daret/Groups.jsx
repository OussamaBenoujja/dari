import FeaturePlaceholder from '../../../components/FeaturePlaceholder.jsx'

export default function DaretGroupsPage() {
  return (
    <FeaturePlaceholder
      eyebrow="Daret / Tirelire"
      title="Groupes disponibles"
      description="Liste des groupes, filtres par statut, taille, ville et possibilité de créer un nouveau cercle."
      actions={[{ label: 'Créer un groupe', tone: 'teal' }, { label: 'Filtrer les groupes', variant: 'outline' }]}
    />
  )
}
