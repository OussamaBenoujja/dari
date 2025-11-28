import PropTypes from 'prop-types'

export default function FullScreenLoader({ message = 'Chargement de votre session…' }) {
  return (
    <div className="fullscreen-loader" role="status" aria-live="polite">
      <span className="fullscreen-loader__spinner" aria-hidden="true" />
      <p>{message}</p>
    </div>
  )
}

FullScreenLoader.propTypes = {
  message: PropTypes.string,
}
