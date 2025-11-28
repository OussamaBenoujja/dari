import { Outlet } from 'react-router-dom'
import { Section } from '@darna/ui-kit'

export default function AuthLayout() {
  return (
    <div className="app-shell" style={{ alignItems: 'center' }}>
      <Section
        eyebrow="Espace sécurisé"
        title="Connexion à Darna"
        description="Authentification Keycloak + 2FA selon votre profil."
        align="center"
      >
        <Outlet />
      </Section>
    </div>
  )
}
