import FeaturePlaceholder from '../../components/FeaturePlaceholder.jsx'

export default function AdminDashboardPage() {
  return (
    <FeaturePlaceholder
      eyebrow="Admin"
      title="Dashboard KPI"
      description="Volume d’annonces, conversion leads, santé Tirelire, alertes KYC. Graphiques (Recharts) et cards."
      actions={[{ label: 'Exporter les métriques', variant: 'outline' }]}
    />
  )
}
