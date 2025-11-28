import PropTypes from 'prop-types'
import { PrimaryButton } from '@darna/ui-kit'

export default function ListingTable({ listings, onView, onToggleAvailability, onDelete, busyId }) {
  if (!listings.length) {
    return <p>Aucune annonce pour le moment.</p>
  }

  return (
    <div className="listing-table">
      <table>
        <thead>
          <tr>
            <th>Titre</th>
            <th>Prix</th>
            <th>Disponibilité</th>
            <th>Mise à jour</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {listings.map((listing) => (
            <tr key={listing.id || listing._id}>
              <td>
                <strong>{listing.title}</strong>
                <p className="listing-table__sub">{listing.location?.city ?? listing.location?.address}</p>
              </td>
              <td>
                {listing.price?.toLocaleString?.('fr-FR')} {listing.currency}
                <p className="listing-table__sub">{listing.transactionType}</p>
              </td>
              <td>
                <span className={`badge ${listing.availability ? 'badge--success' : 'badge--warning'}`}>
                  {listing.availability ? 'Publiée' : 'Indisponible'}
                </span>
              </td>
              <td>{listing.updatedAt ? new Date(listing.updatedAt).toLocaleDateString('fr-MA') : 'N/A'}</td>
              <td>
                <div className="listing-table__actions">
                  <PrimaryButton tone="slate" variant="outline" onClick={() => onView(listing)}>
                    Ouvrir
                  </PrimaryButton>
                  <PrimaryButton
                    tone="orange"
                    variant="outline"
                    onClick={() => onToggleAvailability(listing)}
                    disabled={busyId === listing.id || busyId === listing._id}
                  >
                    {listing.availability ? 'Mettre en pause' : 'Publier'}
                  </PrimaryButton>
                  <PrimaryButton
                    tone="orange"
                    variant="ghost"
                    onClick={() => onDelete(listing)}
                    disabled={busyId === listing.id || busyId === listing._id}
                  >
                    Supprimer
                  </PrimaryButton>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

ListingTable.propTypes = {
  listings: PropTypes.arrayOf(PropTypes.object).isRequired,
  onView: PropTypes.func.isRequired,
  onToggleAvailability: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  busyId: PropTypes.string,
}

ListingTable.defaultProps = {
  busyId: null,
}
