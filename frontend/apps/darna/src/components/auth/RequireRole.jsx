import PropTypes from 'prop-types'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import FullScreenLoader from '../feedback/FullScreenLoader.jsx'

export default function RequireRole({ children, roles }) {
  const { roles: userRoles, isHydrated, isLoading, isAuthenticated } = useAuth()

  if (!isHydrated || isLoading) {
    return <FullScreenLoader message="Vérification des permissions…" />
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />
  }

  const isAllowed = roles.some((role) => userRoles.includes(role))
  if (!isAllowed) {
    return <Navigate to="/403" replace />
  }

  return children
}

RequireRole.propTypes = {
  children: PropTypes.node,
  roles: PropTypes.arrayOf(PropTypes.string),
}

RequireRole.defaultProps = {
  roles: [],
}
