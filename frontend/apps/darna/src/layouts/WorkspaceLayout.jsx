import { NavLink, Outlet } from 'react-router-dom'

const workspaceLinks = [
  { to: '/workspace/my-listings', label: 'Mes annonces' },
  { to: '/workspace/create-listing', label: 'Créer une annonce' },
  { to: '/workspace/leads', label: 'Leads & chat' },
  { to: '/workspace/notifications', label: 'Notifications' },
  { to: '/workspace/financing', label: 'Financement' },
  { to: '/workspace/daret', label: 'Mes groupes' },
  { to: '/workspace/profile', label: 'Profil' },
  { to: '/workspace/subscriptions', label: 'Abonnement' },
]

export default function WorkspaceLayout() {
  return (
    <div className="workspace-layout">
      <aside className="workspace-sidebar">
        <h2>Espace annonceur</h2>
        <nav>
          {workspaceLinks.map((link) => (
            <NavLink key={link.to} to={link.to}>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <section className="workspace-content">
        <Outlet />
      </section>
    </div>
  )
}
