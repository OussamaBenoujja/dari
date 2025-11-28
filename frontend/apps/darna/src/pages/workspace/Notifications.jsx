import FeaturePlaceholder from '../../components/FeaturePlaceholder.jsx'

export default function NotificationsCenterPage() {
  return (
    <FeaturePlaceholder
      eyebrow="Temps réel"
      title="Centre de notifications"
      description="Flux catégorisé (non lus, tout, alertes système). Actions rapides pour marquer comme lu et configurer les préférences."
      actions={[{ label: 'Tout marquer comme lu' }, { label: 'Configurer les alertes', variant: 'outline' }]}
    />
  )
}
