import FeaturePlaceholder from '../../components/FeaturePlaceholder.jsx'

export default function PlansPage() {
  return (
    <FeaturePlaceholder
      eyebrow="Monétisation"
      title="Plans & tarifs"
      description="CRUD des plans (gratuit, pro, premium), quotas, badges, tarifs, taux de commission et options de mise en avant."
      actions={[{ label: 'Ajouter un plan', tone: 'teal' }]}
    />
  )
}
