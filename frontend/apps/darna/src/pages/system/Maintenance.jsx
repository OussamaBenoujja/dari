import FeaturePlaceholder from '../../components/FeaturePlaceholder.jsx'

export default function MaintenancePage() {
  return (
    <FeaturePlaceholder
      eyebrow="Maintenance"
      title="Plateforme en cours de mise à jour"
      description="Nous préparons une nouvelle version. Revenez d’ici quelques minutes."
      actions={[{ label: 'Actualiser' }]}
    />
  )
}
