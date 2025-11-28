import FeaturePlaceholder from '../../components/FeaturePlaceholder.jsx'

export default function CookiesConsentPage() {
  return (
    <FeaturePlaceholder
      eyebrow="Conformité"
      title="Cookies & RGPD"
      description="Bannière + panneau de gestion des consentements pour analytics, chat, stockage média."
      actions={[{ label: 'Accepter tout', tone: 'teal' }, { label: 'Personnaliser', variant: 'outline' }]}
    />
  )
}
