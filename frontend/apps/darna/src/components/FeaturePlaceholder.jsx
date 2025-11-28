import { PrimaryButton, Section } from '@darna/ui-kit'

const noop = () => {}

export function FeaturePlaceholder({
  eyebrow = 'Bientôt disponible',
  title,
  description,
  actions = [],
}) {
  return (
    <Section eyebrow={eyebrow} title={title} description={description} align="start">
      <div className="feature-placeholder__actions">
        {actions.map((action) => (
          <PrimaryButton
            key={action.label}
            tone={action.tone || 'teal'}
            variant={action.variant || 'solid'}
            onClick={action.onClick || noop}
          >
            {action.label}
          </PrimaryButton>
        ))}
      </div>
    </Section>
  )
}

export default FeaturePlaceholder
