// Projecten.jsx — Projectenbeheer: kanban-stijl overzicht per status
import PageWrapper from '../components/PageWrapper'

const statussen = [
  { key: 'intake',          label: 'Intake',          kleur: '#94a3b8' },
  { key: 'offerte',         label: 'Offerte',          kleur: '#f59e0b' },
  { key: 'in_ontwikkeling', label: 'In ontwikkeling',  kleur: '#3b82f6' },
  { key: 'afgeleverd',      label: 'Afgeleverd',       kleur: '#10b981' },
  { key: 'onderhoud',       label: 'Onderhoud',        kleur: '#8b5cf6' },
]

export default function Projecten() {
  return (
    <PageWrapper
      title="Projecten"
      description="Overzicht van alle lopende en afgeronde projecten."
      actions={
        <button
          className="px-4 py-2 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: '#e94560' }}
        >
          + Project aanmaken
        </button>
      }
    >
      {/* Status-filters */}
      <div className="flex gap-2 flex-wrap">
        {statussen.map(({ key, label, kleur }) => (
          <span
            key={key}
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: kleur + '18', color: kleur }}
          >
            {label}
          </span>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 py-10 text-center">
          <p className="text-gray-400 text-sm">
            Nog geen projecten. Klik op "+ Project aanmaken" om te starten.
          </p>
        </div>
      </div>
    </PageWrapper>
  )
}
