import PropTypes from 'prop-types'

const toneToClass = {
  teal: 'ui-status-card--teal',
  orange: 'ui-status-card--orange',
  slate: 'ui-status-card--slate',
}

export function StatusCard({ label, value, helper, tone = 'teal' }) {
  return (
    <article className={['ui-status-card', toneToClass[tone]].filter(Boolean).join(' ')}>
      <p className="ui-status-card__label">{label}</p>
      <p className="ui-status-card__value">{value}</p>
      {helper ? <p className="ui-status-card__helper">{helper}</p> : null}
    </article>
  )
}

StatusCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  helper: PropTypes.string,
  tone: PropTypes.oneOf(['teal', 'orange', 'slate']),
}

export default StatusCard
