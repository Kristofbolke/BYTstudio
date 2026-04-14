// Klanten.jsx — Klantenbeheer: lijst, aanmaken en details
import PageWrapper from '../components/PageWrapper'

export default function Klanten() {
  return (
    <PageWrapper
      title="Klanten"
      description="Beheer al je klanten en hun contactgegevens."
      actions={
        <button
          className="px-4 py-2 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: '#e94560' }}
        >
          + Klant toevoegen
        </button>
      }
    >
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 py-10 text-center">
          <p className="text-gray-400 text-sm">
            Nog geen klanten. Klik op "+ Klant toevoegen" om te starten.
          </p>
        </div>
      </div>
    </PageWrapper>
  )
}
