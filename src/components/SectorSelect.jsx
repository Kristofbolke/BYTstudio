// SectorSelect.jsx — Herbruikbare sector-dropdown, gevoed vanuit de 'sectoren'-tabel
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ChevronDown, CheckCircle } from 'lucide-react'

const NIEUW_WAARDE = '__nieuw__'

const inp = 'w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 bg-white'

export default function SectorSelect({ waarde, onChange, verplicht = false }) {
  const [sectoren, setSectoren] = useState([])
  const [laden, setLaden] = useState(true)
  const [toevoegenActief, setToevoegenActief] = useState(false)
  const [nieuweNaam, setNieuweNaam] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')
  const [toast, setToast] = useState('')

  async function laadSectoren() {
    setLaden(true)
    const { data } = await supabase.from('sectoren').select('*').eq('actief', true).order('naam', { ascending: true })
    setSectoren(data ?? [])
    setLaden(false)
  }

  useEffect(() => { laadSectoren() }, [])

  function toonToast(tekst) {
    setToast(tekst)
    setTimeout(() => setToast(''), 3000)
  }

  function handleSelect(e) {
    const val = e.target.value
    if (val === NIEUW_WAARDE) {
      setToevoegenActief(true)
      setFout('')
      return
    }
    onChange(val)
  }

  async function toevoegen() {
    const naam = nieuweNaam.trim()
    if (!naam) return
    setBezig(true)
    setFout('')
    const { data, error } = await supabase.from('sectoren').insert({ naam }).select().single()
    setBezig(false)
    if (error) { setFout('Toevoegen mislukt: ' + error.message); return }
    await laadSectoren()
    onChange(data.naam)
    setToevoegenActief(false)
    setNieuweNaam('')
    toonToast('Sector toegevoegd')
  }

  function annuleer() {
    setToevoegenActief(false)
    setNieuweNaam('')
    setFout('')
  }

  if (toevoegenActief) {
    return (
      <div>
        <div className="flex gap-2">
          <input
            autoFocus
            value={nieuweNaam}
            onChange={e => setNieuweNaam(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); toevoegen() } }}
            placeholder="Naam nieuwe sector"
            className={inp}
          />
          <button
            type="button"
            onClick={toevoegen}
            disabled={!nieuweNaam.trim() || bezig}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white whitespace-nowrap disabled:opacity-40 transition-opacity"
            style={{ background: '#185FA5' }}
          >
            {bezig ? 'Bezig...' : 'Toevoegen'}
          </button>
          <button
            type="button"
            onClick={annuleer}
            className="px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors whitespace-nowrap"
          >
            Annuleren
          </button>
        </div>
        {fout && <p className="text-xs text-red-600 mt-1">{fout}</p>}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-900 text-white text-sm font-medium shadow-lg">
            <CheckCircle size={15} className="text-green-400" />
            {toast}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="relative">
        <select
          value={waarde ?? ''}
          onChange={handleSelect}
          required={verplicht}
          disabled={laden}
          className={inp + ' appearance-none pr-8'}
        >
          <option value="">— Kies sector —</option>
          {sectoren.map(s => <option key={s.id} value={s.naam}>{s.naam}</option>)}
          <option value={NIEUW_WAARDE}>+ Nieuwe sector toevoegen</option>
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-900 text-white text-sm font-medium shadow-lg">
          <CheckCircle size={15} className="text-green-400" />
          {toast}
        </div>
      )}
    </div>
  )
}
