import FeaturePlaceholder from '../../components/FeaturePlaceholder.jsx'

export default function KycPage() {
  return (
    <FeaturePlaceholder
      eyebrow="Conformité"
      title="Validation KYC"
      description="Workflow manuel pour entreprises/particuliers: visualisation des documents, commentaires internes, décision et notifications."
      actions={[{ label: 'Approuver', tone: 'teal' }, { label: 'Demander des pièces', variant: 'outline' }]}
    />
  )
}
