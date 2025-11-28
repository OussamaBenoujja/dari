import { NavLink, Outlet } from 'react-router-dom'

const adminLinks = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/moderation', label: 'Modération' },
  { to: '/admin/plans', label: 'Plans & tarifs' },
  { to: '/admin/kyc', label: 'KYC' },
  { to: '/admin/system', label: 'Paramètres système' },
]

export default function AdminLayout() {
  return (
    <div className="workspace-layout">
      <aside className="workspace-sidebar">
        <h2>Console admin</h2>
        <nav>
          {adminLinks.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end}>
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
