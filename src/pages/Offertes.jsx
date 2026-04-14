// Offertes.jsx — Offertes aanmaken, beheren en opvolgen
import PageWrapper from '../components/PageWrapper'

const statussen = [
  { key: 'concept',      label: 'Concept',      kleur: '#94a3b8' },
  { key: 'verzonden',    label: 'Verzonden',     kleur: '#3b82f6' },
  { key: 'goedgekeurd',  label: 'Goedgekeurd',  kleur: '#10b981' },
  { key: 'gefactureerd', label: 'Gefactureerd',  kleur: '#8b5cf6' },
]

export default function Offertes() {
  return (
    <PageWrapper
      title="Offertes"
      description="Maak en beheer offertes voor al je projecten."
      actions={
        <button
          className="px-4 py-2 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: '#e94560' }}
        >
          + Nieuwe offerte
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
          <p className="text-gray-400 text-sm">Nog geen offertes aangemaakt.</p>
        </div>
      </div>
    </PageWrapper>
  )
}
