import FeaturePlaceholder from '../../../components/FeaturePlaceholder.jsx'

export default function DaretTicketsPage() {
  return (
    <FeaturePlaceholder
      eyebrow="Support"
      title="Tickets & assistance"
      description="Création et suivi des tickets ouverts auprès de l’équipe Darna pour résoudre les blocages Daret/Tirelire."
      actions={[{ label: 'Nouveau ticket', tone: 'teal' }]}
    />
  )
}
