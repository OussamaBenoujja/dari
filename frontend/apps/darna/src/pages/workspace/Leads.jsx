import FeaturePlaceholder from '../../components/FeaturePlaceholder.jsx'

export default function LeadsPage() {
  return (
    <FeaturePlaceholder
      eyebrow="Inbox"
      title="Leads & chat"
      description="Inbox regroupée par annonce avec états (nouveau, en cours, gagné, perdu) et accès au thread Socket.IO."
      actions={[{ label: 'Ouvrir un lead', tone: 'orange' }]}
    />
  )
}
