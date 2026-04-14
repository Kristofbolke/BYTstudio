// Instellingen.jsx — Account- en app-instellingen
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import PageWrapper from '../components/PageWrapper'

export default function Instellingen() {
  const [email, setEmail] = useState('')
  const [huidigWachtwoord, setHuidigWachtwoord] = useState('')
  const [nieuwWachtwoord, setNieuwWachtwoord] = useState('')
  const [loading, setLoading] = useState(false)
  const [bericht, setBericht] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setEmail(user.email ?? '')
    })
  }, [])

  async function handleWachtwoord(e) {
    e.preventDefault()
    setLoading(true)
    setBericht('')
    const { error } = await supabase.auth.updateUser({ password: nieuwWachtwoord })
    if (error) setBericht('Fout: ' + error.message)
    else {
      setBericht('Wachtwoord succesvol bijgewerkt.')
      setHuidigWachtwoord('')
      setNieuwWachtwoord('')
    }
    setLoading(false)
  }

  return (
    <PageWrapper
      title="Instellingen"
      description="Beheer je account en app-voorkeuren."
    >
      <div className="max-w-lg space-y-5">
        {/* Profiel */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-sm font-semibold text-gray-700 mb-4">Profiel</p>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">E-mailadres</label>
            <p className="text-sm text-gray-800 bg-gray-50 px-3 py-2.5 rounded-lg border border-gray-100">
              {email || '—'}
            </p>
          </div>
        </div>

        {/* Wachtwoord wijzigen */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-sm font-semibold text-gray-700 mb-4">Wachtwoord wijzigen</p>
          <form onSubmit={handleWachtwoord} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nieuw wachtwoord</label>
              <input
                type="password"
                value={nieuwWachtwoord}
                onChange={e => setNieuwWachtwoord(e.target.value)}
                required
                minLength={6}
                placeholder="Minimaal 6 tekens"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#e94560]/30 focus:border-[#e94560]"
              />
            </div>
            {bericht && (
              <p className={`text-xs px-3 py-2 rounded-lg ${bericht.startsWith('Fout') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                {bericht}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-50"
              style={{ background: '#e94560' }}
            >
              {loading ? 'Opslaan...' : 'Wachtwoord opslaan'}
            </button>
          </form>
        </div>

        {/* App-info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-sm font-semibold text-gray-700 mb-3">Over BYT Studio</p>
          <div className="space-y-1.5 text-sm text-gray-500">
            <div className="flex justify-between">
              <span>Versie</span>
              <span className="font-medium text-gray-700">0.1.0</span>
            </div>
            <div className="flex justify-between">
              <span>Gebouwd door</span>
              <span className="font-medium text-gray-700">Build Your Tools</span>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
