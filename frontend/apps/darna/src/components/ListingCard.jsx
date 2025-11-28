import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { PrimaryButton } from '@darna/ui-kit'

export default function ListingCard({ listing }) {
  return (
    <article className="listing-card">
      <div className="listing-card__media" aria-hidden="true">
        {listing.media?.[0]?.url ? (
          <img src={listing.media[0].url} alt={listing.title} loading="lazy" />
        ) : (
          <div className="listing-card__placeholder">📷</div>
        )}
      </div>
      <div className="listing-card__body">
        <h3>{listing.title}</h3>
        <p>{listing.location?.city ?? listing.location?.address}</p>
        <p className="listing-card__price">
          {listing.price?.toLocaleString?.('fr-FR')} {listing.currency ?? 'MAD'} · {listing.transactionType}
        </p>
        <ul className="listing-card__meta">
          <li>{listing.characteristics?.totalSurface} m²</li>
          <li>{listing.characteristics?.bedroomCount} chambres</li>
          <li>{listing.characteristics?.bathroomCount} salles d’eau</li>
        </ul>
        <Link to={`/listings/${listing.id || listing._id}`} className="listing-card__cta">
          <PrimaryButton tone="teal">Voir le détail</PrimaryButton>
        </Link>
      </div>
    </article>
  )
}
ListingCard.propTypes = {
  listing: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    price: PropTypes.number,
    currency: PropTypes.string,
    transactionType: PropTypes.string,
    location: PropTypes.shape({
      address: PropTypes.string,
      city: PropTypes.string,
    }),
    media: PropTypes.arrayOf(
      PropTypes.shape({
        url: PropTypes.string,
      }),
    ),
    characteristics: PropTypes.shape({
      totalSurface: PropTypes.number,
      bedroomCount: PropTypes.number,
      bathroomCount: PropTypes.number,
    }),
  }).isRequired,
}
