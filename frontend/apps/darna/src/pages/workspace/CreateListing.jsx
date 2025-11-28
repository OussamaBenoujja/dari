import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PrimaryButton, Section } from '@darna/ui-kit'
import { createListing } from '../../features/listings/api.js'
import { LISTINGS_QUERY_KEY } from '../../hooks/useListings.js'

const initialForm = {
  title: '',
  description: '',
  transactionType: 'sale',
  price: '',
  currency: 'MAD',
  availability: true,
  availableFrom: '',
  location: {
    address: '',
    city: '',
    country: 'Maroc',
    latitude: '',
    longitude: '',
  },
  characteristics: {
    totalSurface: '',
    usableSurface: '',
    bedroomCount: 1,
    bathroomCount: 1,
  },
  equipment: {
    wifi: true,
    parking: false,
    airConditioning: false,
    heating: false,
    balcony: false,
  },
  internalRules: {
    animalsAllowed: false,
    smokingAllowed: false,
    partiesAllowed: false,
  },
}

export default function CreateListingPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState(initialForm)
  const [feedback, setFeedback] = useState(null)

  const mutation = useMutation({
    mutationFn: (payload) => createListing(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LISTINGS_QUERY_KEY })
      setFeedback({ type: 'success', message: 'Annonce créée avec succès.' })
      setTimeout(() => navigate('/workspace/my-listings'), 1200)
    },
    onError: (error) => {
      const message = error.response?.data?.message ?? 'Impossible de créer l’annonce'
      setFeedback({ type: 'error', message })
    },
  })

  function handleChange(event) {
    const { name, value, type, checked } = event.target
    const nextValue = type === 'checkbox' ? checked : value
    setForm((prev) => updateNestedField(prev, name, nextValue))
  }

  function handleSubmit(event) {
    event.preventDefault()
    const payload = buildPayload(form)
    if (!payload) {
      setFeedback({ type: 'error', message: 'Veuillez remplir tous les champs obligatoires.' })
      return
    }
    mutation.mutate(payload)
  }

  return (
    <div className="workspace-shell">
      <Section
        eyebrow="Nouvelle annonce"
        title="Publier une propriété"
        description="Renseignez les informations principales. Vous pourrez ajouter des médias et enrichir la fiche plus tard."
        align="start"
      >
        <form className="listing-form" onSubmit={handleSubmit}>
          <fieldset>
            <legend>Informations principales</legend>
            <label>
              Titre
              <input name="title" value={form.title} onChange={handleChange} required />
            </label>
            <label>
              Description
              <textarea name="description" value={form.description} onChange={handleChange} rows={4} required />
            </label>
            <label>
              Type de transaction
              <select name="transactionType" value={form.transactionType} onChange={handleChange}>
                <option value="sale">Vente</option>
                <option value="daily rental">Location journalière</option>
                <option value="monthly">Location mensuelle</option>
                <option value="seasonal">Saisonnier</option>
              </select>
            </label>
            <div className="listing-form__grid">
              <label>
                Prix (MAD)
                <input type="number" name="price" value={form.price} onChange={handleChange} min={0} required />
              </label>
              <label>
                Devise
                <input name="currency" value={form.currency} onChange={handleChange} />
              </label>
            </div>
            <label>
              Date de disponibilité
              <input type="date" name="availableFrom" value={form.availableFrom} onChange={handleChange} />
            </label>
            <label className="checkbox">
              <input type="checkbox" name="availability" checked={form.availability} onChange={handleChange} />
              Disponible immédiatement
            </label>
          </fieldset>

          <fieldset>
            <legend>Localisation</legend>
            <label>
              Adresse
              <input name="location.address" value={form.location.address} onChange={handleChange} required />
            </label>
            <div className="listing-form__grid">
              <label>
                Ville
                <input name="location.city" value={form.location.city} onChange={handleChange} required />
              </label>
              <label>
                Pays
                <input name="location.country" value={form.location.country} onChange={handleChange} required />
              </label>
            </div>
            <div className="listing-form__grid">
              <label>
                Latitude
                <input type="number" step="0.0001" name="location.latitude" value={form.location.latitude} onChange={handleChange} required />
              </label>
              <label>
                Longitude
                <input type="number" step="0.0001" name="location.longitude" value={form.location.longitude} onChange={handleChange} required />
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend>Caractéristiques</legend>
            <div className="listing-form__grid">
              <label>
                Surface totale (m²)
                <input type="number" name="characteristics.totalSurface" value={form.characteristics.totalSurface} onChange={handleChange} min={0} required />
              </label>
              <label>
                Surface utile (m²)
                <input type="number" name="characteristics.usableSurface" value={form.characteristics.usableSurface} onChange={handleChange} min={0} />
              </label>
            </div>
            <div className="listing-form__grid">
              <label>
                Chambres
                <input type="number" name="characteristics.bedroomCount" value={form.characteristics.bedroomCount} onChange={handleChange} min={0} required />
              </label>
              <label>
                Salles d’eau
                <input type="number" name="characteristics.bathroomCount" value={form.characteristics.bathroomCount} onChange={handleChange} min={0} required />
              </label>
            </div>

            <div className="listing-form__equipment">
              {Object.keys(form.equipment).map((key) => (
                <label key={key} className="checkbox">
                  <input type="checkbox" name={`equipment.${key}`} checked={form.equipment[key]} onChange={handleChange} />
                  {translateEquipment(key)}
                </label>
              ))}
            </div>

            <div className="listing-form__equipment">
              {Object.keys(form.internalRules).map((key) => (
                <label key={key} className="checkbox">
                  <input type="checkbox" name={`internalRules.${key}`} checked={form.internalRules[key]} onChange={handleChange} />
                  {translateRule(key)}
                </label>
              ))}
            </div>
          </fieldset>

          {feedback && <p className={`form-feedback form-feedback--${feedback.type}`}>{feedback.message}</p>}

          <PrimaryButton type="submit" tone="teal" disabled={mutation.isPending}>
            {mutation.isPending ? 'Publication…' : 'Publier l’annonce'}
          </PrimaryButton>
        </form>
      </Section>
    </div>
  )
}

function updateNestedField(state, path, value) {
  const segments = path.split('.')
  if (segments.length === 1) {
    const base = state && typeof state === 'object' ? { ...state } : {}
    return { ...base, [path]: value }
  }
  const [head, ...rest] = segments
  const current = state && typeof state === 'object' ? { ...state } : {}
  return {
    ...current,
    [head]: updateNestedField(current[head], rest.join('.'), value),
  }
}

function buildPayload(form) {
  const price = Number(form.price)
  const totalSurface = Number(form.characteristics.totalSurface)
  const bedroomCount = Number(form.characteristics.bedroomCount)
  const bathroomCount = Number(form.characteristics.bathroomCount)
  const latitude = Number(form.location.latitude)
  const longitude = Number(form.location.longitude)

  const stringFields = [form.title, form.description, form.location.address, form.location.city, form.location.country]
  if (stringFields.some((field) => !field || !field.trim())) {
    return null
  }

  const numericValues = [price, totalSurface, bedroomCount, bathroomCount, latitude, longitude]
  if (numericValues.some((value) => Number.isNaN(value))) {
    return null
  }

  const payload = {
    title: form.title,
    description: form.description,
    transactionType: form.transactionType,
    price,
    currency: form.currency || 'MAD',
    availability: Boolean(form.availability),
    availableFrom: form.availableFrom ? new Date(form.availableFrom).toISOString() : undefined,
    location: {
      address: form.location.address,
      city: form.location.city,
      country: form.location.country,
      coordinates: {
        latitude,
        longitude,
      },
    },
    characteristics: {
      totalSurface,
      bedroomCount,
      bathroomCount,
      equipment: form.equipment,
      internalRules: form.internalRules,
    },
  }

  if (form.characteristics.usableSurface) {
    payload.characteristics.usableSurface = Number(form.characteristics.usableSurface)
  }

  return payload
}

function translateEquipment(key) {
  const map = {
    wifi: 'Wi-Fi',
    parking: 'Parking',
    airConditioning: 'Climatisation',
    heating: 'Chauffage',
    balcony: 'Balcon',
  }
  return map[key] ?? key
}

function translateRule(key) {
  const map = {
    animalsAllowed: 'Animaux acceptés',
    smokingAllowed: 'Fumeurs acceptés',
    partiesAllowed: 'Événements autorisés',
  }
  return map[key] ?? key
}
