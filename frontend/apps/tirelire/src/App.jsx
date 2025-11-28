import './App.css'
import { PrimaryButton, Section, StatusCard } from '@darna/ui-kit'

const stats = [
  {
    label: 'Weekly deposits',
    value: '$128K',
    helper: '↑ 12% vs last cycle',
    tone: 'orange',
  },
  {
    label: 'Goals funded',
    value: '642',
    helper: 'Families hitting their targets',
    tone: 'teal',
  },
  {
    label: 'Messages delivered',
    value: '4,913',
    helper: 'Broadcast + 1:1 nudges',
    tone: 'slate',
  },
]

const journeys = [
  {
    title: 'Habit cues',
    body: 'Trigger nudges based on payroll dates, geo fences, or manual milestones.',
    icon: '⏱️',
    cta: 'Design cadence',
  },
  {
    title: 'Collective goals',
    body: 'Link households into cohorts and unlock multipliers when the group saves together.',
    icon: '🤝',
    cta: 'Open cohort',
  },
  {
    title: 'Storytelling feed',
    body: 'Celebrate wins with lightweight posts the community can react to instantly.',
    icon: '📣',
    cta: 'Schedule post',
  },
]

function App() {
  return (
    <main className="app-shell">
      <Section
        eyebrow="Savings companion"
        title="Tirelire keeps every household motivated"
        description="Blend behavioral science with delightful UI to nudge contributions right when it matters."
        kicker="Optimized for low bandwidth devices and offline-first sync."
      >
        <div className="action-row">
          <PrimaryButton tone="orange">Launch journey</PrimaryButton>
          <PrimaryButton variant="outline" tone="slate">
            Export engagement data
          </PrimaryButton>
        </div>
      </Section>

      <div className="stats-grid">
        {stats.map((stat) => (
          <StatusCard key={stat.label} {...stat} />
        ))}
      </div>

      <Section
        align="start"
        eyebrow="Journeys"
        title="Design rituals that stick"
        description="Pick a template, map the sockets events, and Tirelire handles timing plus content."
      >
        <div className="feature-grid">
          {journeys.map((journey) => (
            <article key={journey.title} className="feature-card">
              <div className="feature-card__icon" aria-hidden="true">
                {journey.icon}
              </div>
              <div>
                <h3 className="feature-card__title">{journey.title}</h3>
                <p className="feature-card__body">{journey.body}</p>
              </div>
              <PrimaryButton variant="ghost" tone="slate">
                {journey.cta}
              </PrimaryButton>
            </article>
          ))}
        </div>
      </Section>
    </main>
  )
}

export default App
