import FeaturePlaceholder from '../../components/FeaturePlaceholder.jsx'

export default function SsoCallbackPage() {
  return (
    <FeaturePlaceholder
      eyebrow="SSO"
      title="Callback OAuth"
      description="Capture du code d’autorisation, échange contre token Keycloak, puis bootstrap du profil Darna."
      actions={[{ label: 'Continuer vers le dashboard' }]}
    />
  )
}
