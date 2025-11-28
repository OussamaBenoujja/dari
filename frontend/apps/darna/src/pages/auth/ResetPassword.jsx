import FeaturePlaceholder from '../../components/FeaturePlaceholder.jsx'

export default function ResetPasswordPage() {
  return (
    <FeaturePlaceholder
      eyebrow="Compte"
      title="Réinitialisation du mot de passe"
      description="Demande de lien sécurisé, validation du token et saisie du nouveau mot de passe conforme aux règles Keycloak."
      actions={[{ label: 'Envoyer le lien' }]}
    />
  )
}
