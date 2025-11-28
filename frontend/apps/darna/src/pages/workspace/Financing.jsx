import FeaturePlaceholder from '../../components/FeaturePlaceholder.jsx'

export default function FinancingPage() {
  return (
    <FeaturePlaceholder
      eyebrow="Financement"
      title="Banques & simulateur"
      description="Listing des banques partenaires + simulateur front (montant, durée, taux) et redirection vers conseillers."
      actions={[{ label: 'Lancer la simulation', tone: 'teal' }]}
    />
  )
}
