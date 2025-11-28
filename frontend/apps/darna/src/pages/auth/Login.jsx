import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { PrimaryButton, Section } from '@darna/ui-kit'
import { useAuth } from '../../hooks/useAuth.js'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const { login, isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) return
    const redirectTo = location.state?.from?.pathname ?? '/workspace'
    navigate(redirectTo, { replace: true })
  }, [isAuthenticated, location.state, navigate])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setErrorMessage('')
    try {
      await login({ email: form.email, password: form.password })
    } catch (error) {
      const apiMessage = error.response?.data?.message
      setErrorMessage(apiMessage || 'Identifiants invalides. Réessayez ou réinitialisez votre mot de passe.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Section title="Connexion" description="Email + mot de passe ou redirection SSO.">
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Mot de passe
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </label>
        <PrimaryButton type="submit" disabled={submitting || isLoading}>
          {submitting || isLoading ? 'Connexion...' : 'Se connecter'}
        </PrimaryButton>
      </form>
      {errorMessage && <p className="auth-feedback auth-feedback--error">{errorMessage}</p>}
      <p className="auth-hint">
        Pas encore de compte ? <NavLink to="/auth/register">Créer un compte</NavLink>
      </p>
    </Section>
  )
}
