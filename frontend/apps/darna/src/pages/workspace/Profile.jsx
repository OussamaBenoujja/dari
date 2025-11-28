import FeaturePlaceholder from '../../components/FeaturePlaceholder.jsx'

export default function ProfilePage() {
  return (
    <FeaturePlaceholder
      eyebrow="Compte"
      title="Profil & informations KYC"
      description="Synchronisation avec Keycloak (email, téléphone, MFA), infos entreprise, documents vérifiés et préférences."
      actions={[{ label: 'Mettre à jour mon profil', tone: 'teal' }]}
    />
  )
}
