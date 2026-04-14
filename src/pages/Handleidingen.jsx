// Handleidingen.jsx — Gebruikers- en technische handleidingen per project
import PageWrapper from '../components/PageWrapper'
import { BookOpen } from 'lucide-react'

export default function Handleidingen() {
  return (
    <PageWrapper
      title="Handleidingen"
      description="Schrijf en beheer gebruikers- en technische documentatie per project."
      actions={
        <button
          className="px-4 py-2 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: '#e94560' }}
        >
          + Nieuwe handleiding
        </button>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        {['Gebruiker', 'Technisch'].map((type) => (
          <div
            key={type}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
          >
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={15} className="text-gray-400" />
              <p className="text-sm font-semibold text-gray-700">{type}</p>
            </div>
            <p className="text-xs text-gray-400">
              Nog geen {type.toLowerCase()} handleidingen.
            </p>
          </div>
        ))}
      </div>
    </PageWrapper>
  )
}
