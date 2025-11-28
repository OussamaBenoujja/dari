import PropTypes from 'prop-types'

const alignToClass = {
  center: 'ui-section--center',
  start: 'ui-section--start',
}

export function Section({
  eyebrow,
  title,
  description,
  children,
  align = 'center',
  kicker,
}) {
  return (
    <section className={['ui-section', alignToClass[align]].filter(Boolean).join(' ')}>
      <header className="ui-section__header">
        {eyebrow ? <p className="ui-section__eyebrow">{eyebrow}</p> : null}
        <div>
          <h2 className="ui-section__title">{title}</h2>
          {description ? <p className="ui-section__description">{description}</p> : null}
        </div>
      </header>
      {children}
      {kicker ? <p className="ui-section__kicker">{kicker}</p> : null}
    </section>
  )
}

Section.propTypes = {
  eyebrow: PropTypes.string,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  children: PropTypes.node,
  align: PropTypes.oneOf(['center', 'start']),
  kicker: PropTypes.string,
}

export default Section
