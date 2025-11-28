import FeaturePlaceholder from '../../components/FeaturePlaceholder.jsx'

export default function VerifyEmailPage() {
  return (
    <FeaturePlaceholder
      eyebrow="Sécurité"
      title="Vérification email"
      description="Code OTP envoyé par email pour activer le compte avant de créer des annonces."
      actions={[{ label: 'Renvoyer le code' }]}
    />
  )
}
