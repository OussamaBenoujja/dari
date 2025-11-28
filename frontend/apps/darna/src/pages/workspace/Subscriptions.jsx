import FeaturePlaceholder from '../../components/FeaturePlaceholder.jsx'

export default function SubscriptionsPage() {
  return (
    <FeaturePlaceholder
      eyebrow="Mon plan"
      title="Abonnements"
      description="Choix Gratuit / Pro / Premium avec quotas, badges, priorité d’affichage et facturation récurrente."
      actions={[{ label: 'Passer en Premium', tone: 'orange' }, { label: 'Voir l’historique', variant: 'outline' }]}
    />
  )
}
