import FeaturePlaceholder from '../../components/FeaturePlaceholder.jsx'

export default function TwoFactorPage() {
  return (
    <FeaturePlaceholder
      eyebrow="2FA"
      title="Validation à deux facteurs"
      description="Saisie du code OTP (SMS / TOTP) lorsque l’API indique qu’un facteur supplémentaire est requis."
      actions={[{ label: 'Valider le code' }, { label: 'Utiliser une clé de secours', variant: 'outline' }]}
    />
  )
}
