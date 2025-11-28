import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PrimaryButton, Section } from '@darna/ui-kit'
import { registerUser } from '../../features/auth/api.js'

export default function RegisterPage() {
  const [form, setForm] = useState({
    accountType: 'individual',
    fullName: '',
    email: '',
    password: '',
  })
  const [status, setStatus] = useState({ state: 'idle', message: '' })
  const navigate = useNavigate()

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setStatus({ state: 'loading', message: '' })

    const [firstName = '', ...rest] = form.fullName.trim().split(' ')
    const lastName = rest.join(' ') || firstName

    try {
      await registerUser({
        email: form.email,
        password: form.password,
        confirmPassword: form.password,
        firstName,
        lastName,
        accountType: form.accountType,
      })
      setStatus({ state: 'success', message: 'Compte créé. Vérifiez vos emails pour valider le compte.' })
      setTimeout(() => {
        navigate('/auth/verify-email', { state: { email: form.email } })
      }, 1200)
    } catch (error) {
      const message = error.response?.data?.message || 'Impossible de créer le compte. Réessayez.'
      setStatus({ state: 'error', message })
    }
  }

  return (
    <Section title="Créer un compte" description="Profils visiteur, particulier, entreprise ou admin via invitation.">
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Type de compte
          <select name="accountType" value={form.accountType} onChange={handleChange}>
            <option value="visitor">Visiteur</option>
            <option value="individual">Particulier</option>
            <option value="company">Entreprise</option>
          </select>
        </label>
        <label>
          Nom complet
          <input name="fullName" value={form.fullName} onChange={handleChange} required />
        </label>
        <label>
          Email professionnel
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
        <PrimaryButton type="submit" tone="teal" disabled={status.state === 'loading'}>
          {status.state === 'loading' ? 'Création...' : 'Créer mon compte'}
        </PrimaryButton>
      </form>
      {status.message && (
        <p className={`auth-feedback auth-feedback--${status.state}`}>
          {status.message}
        </p>
      )}
    </Section>
  )
}
