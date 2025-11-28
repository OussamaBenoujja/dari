import PropTypes from 'prop-types'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import FullScreenLoader from '../feedback/FullScreenLoader.jsx'

export default function RequireAuth({ children }) {
  const location = useLocation()
  const { isAuthenticated, isHydrated, isLoading } = useAuth()

  if (!isHydrated || isLoading) {
    return <FullScreenLoader message="Chargement de l'espace sécurisé…" />
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }

  return children
}

RequireAuth.propTypes = {
  children: PropTypes.node,
}
