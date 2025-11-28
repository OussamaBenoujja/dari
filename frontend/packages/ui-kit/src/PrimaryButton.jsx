import PropTypes from 'prop-types'

const toneToClass = {
  teal: 'ui-button--teal',
  orange: 'ui-button--orange',
  slate: 'ui-button--slate',
}

const variantToClass = {
  solid: 'ui-button--solid',
  outline: 'ui-button--outline',
  ghost: 'ui-button--ghost',
}

export function PrimaryButton({
  children,
  tone = 'teal',
  variant = 'solid',
  className,
  ...props
}) {
  const mergedClassName = [
    'ui-button',
    toneToClass[tone],
    variantToClass[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type="button" className={mergedClassName} {...props}>
      {children}
    </button>
  )
}

PrimaryButton.propTypes = {
  children: PropTypes.node.isRequired,
  tone: PropTypes.oneOf(['teal', 'orange', 'slate']),
  variant: PropTypes.oneOf(['solid', 'outline', 'ghost']),
  className: PropTypes.string,
}

export default PrimaryButton
