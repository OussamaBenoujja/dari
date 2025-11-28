import { NavLink, Outlet } from 'react-router-dom'
import { PrimaryButton } from '@darna/ui-kit'
import { getApiBaseUrl } from '@darna/core-config'
import { useAuth } from '../hooks/useAuth.js'

const navLinks = [
  { to: '/', label: 'Accueil', end: true },
  { to: '/search', label: 'Recherche' },
  { to: '/workspace/my-listings', label: 'Mes annonces', requiresAuth: true },
  { to: '/workspace/daret', label: 'Daret', requiresAuth: true },
  { to: '/admin', label: 'Admin', requiresRole: 'admin' },
]

export default function RootLayout() {
  const { isAuthenticated, roles, profile, accountType, logout } = useAuth()
  const apiBaseUrl = getApiBaseUrl()
  const allowedLinks = navLinks.filter((link) => {
    if (link.requiresAuth && !isAuthenticated) return false
    if (link.requiresRole && !roles.includes(link.requiresRole)) return false
    return true
  })

  const displayName =
    [profile?.account?.firstName, profile?.account?.lastName].filter(Boolean).join(' ') ||
    profile?.given_name ||
    profile?.name ||
    profile?.preferred_username ||
    profile?.email ||
    'Compte Darna'
  const accountBadge = accountType === 'admin' ? 'Admin' : accountType === 'business' ? 'Entreprise' : 'Particulier'

  return (
    <div className="app-layout">
      <div className="app-layout__inner">
        <header className="app-header">
          <div>
            <p className="app-brand">Darna Platform</p>
            <small>Immobilier + épargne collective connectés en temps réel</small>
          </div>
          <nav className="app-nav">
            {allowedLinks.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end}>
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className={`auth-cta ${isAuthenticated ? 'auth-cta--connected' : ''}`}>
            {isAuthenticated ? (
              <>
                <div className="user-chip">
                  <span className="user-chip__name">{displayName}</span>
                  <span className="user-chip__role">{accountBadge}</span>
                </div>
                <NavLink to="/workspace">
                  <PrimaryButton tone="teal">Mon espace</PrimaryButton>
                </NavLink>
                <PrimaryButton type="button" variant="outline" tone="slate" onClick={logout}>
                  Déconnexion
                </PrimaryButton>
              </>
            ) : (
              <>
                <NavLink to="/auth/register">
                  <PrimaryButton variant="outline" tone="slate">
                    Créer un compte
                  </PrimaryButton>
                </NavLink>
                <NavLink to="/auth/login">
                  <PrimaryButton tone="teal">Se connecter</PrimaryButton>
                </NavLink>
              </>
            )}
          </div>
        </header>

        <main className="app-main">
          <Outlet />
        </main>

        <footer className="app-footer">
          <p>© {new Date().getFullYear()} Darna • API: {apiBaseUrl}</p>
          <p>Déployé pour containers Docker (base URLs injectées via VITE_*).</p>
        </footer>
      </div>
    </div>
  )
}
