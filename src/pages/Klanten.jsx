// Klanten.jsx — Klantenoverzicht met snelle aanmaak; volledige fiche op /klanten/:id
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PageWrapper from '../components/PageWrapper'
import {
  Search, Plus, Pencil, Trash2, X, Building2, Mail, Phone,
  Tag, ChevronRight,
} from 'lucide-react'

// ── Constanten ───────────────────────────────────────────────────────────────
const LEEG_FORMULIER = { naam: '', bedrijfsnaam: '', email: '', telefoon: '' }

// ── Hulpfuncties ─────────────────────────────────────────────────────────────
function initials(naam) {
  return (naam ?? '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

// ── Stijlhulpers ─────────────────────────────────────────────────────────────
const inp = 'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 bg-white'
const lbl = 'block text-xs font-semibold text-gray-500 mb-1'

// ── KlantModal — snelle aanmaak/bewerking van basisgegevens ───────────────────
function KlantModal({ klant, onSluit, onOpgeslagen }) {
  const [formulier, setFormulier] = useState(klant?.id ? klant : LEEG_FORMULIER)
  const [loading, setLoading] = useState(false)
  const [fout, setFout] = useState('')
  const isBewerken = !!klant?.id

  function stelIn(veld, waarde) {
    setFormulier(v => ({ ...v, [veld]: waarde }))
  }

  async function handleOpslaan(e) {
    e.preventDefault()
    if (!formulier.naam.trim()) { setFout('Naam is verplicht.'); return }
    setLoading(true); setFout('')
    const payload = {
      naam: formulier.naam,
      bedrijfsnaam: formulier.bedrijfsnaam,
      email: formulier.email,
      telefoon: formulier.telefoon,
    }
    if (isBewerken) {
      const { error } = await supabase.from('klanten').update(payload).eq('id', klant.id)
      if (error) { setFout('Opslaan mislukt: ' + error.message); setLoading(false); return }
      onOpgeslagen()
    } else {
      const { data, error } = await supabase.from('klanten').insert(payload).select('id').single()
      if (error) { setFout('Opslaan mislukt: ' + error.message); setLoading(false); return }
      onOpgeslagen(data.id)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="font-semibold text-gray-900">{isBewerken ? 'Klant bewerken' : 'Nieuwe klant'}</h3>
          <button onClick={onSluit} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleOpslaan} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={lbl}>Naam <span className="text-red-400">*</span></label>
              <input value={formulier.naam} onChange={e => stelIn('naam', e.target.value)} placeholder="Jan Janssen" className={inp} />
            </div>
            <div className="col-span-2">
              <label className={lbl}>Bedrijfsnaam</label>
              <input value={formulier.bedrijfsnaam} onChange={e => stelIn('bedrijfsnaam', e.target.value)} placeholder="Bedrijf NV" className={inp} />
            </div>
            <div>
              <label className={lbl}>E-mailadres</label>
              <input type="email" value={formulier.email} onChange={e => stelIn('email', e.target.value)} placeholder="jan@bedrijf.be" className={inp} />
            </div>
            <div>
              <label className={lbl}>Telefoon</label>
              <input value={formulier.telefoon} onChange={e => stelIn('telefoon', e.target.value)} placeholder="+32 470 00 00 00" className={inp} />
            </div>
          </div>
          {!isBewerken && (
            <p className="text-xs text-gray-400">Na het opslaan kom je op de volledige klantfiche terecht om de rest van de gegevens aan te vullen.</p>
          )}
          {fout && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{fout}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onSluit} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">Annuleren</button>
            <button type="submit" disabled={loading} className="px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: '#185FA5' }}>
              {loading ? 'Opslaan...' : isBewerken ? 'Wijzigingen opslaan' : 'Klant toevoegen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── BevestigVerwijder ─────────────────────────────────────────────────────────
function BevestigVerwijder({ naam, onBevestig, onAnnuleer, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-2">Klant verwijderen?</h3>
        <p className="text-sm text-gray-500 mb-6">Ben je zeker dat je <strong>{naam}</strong> wil verwijderen?</p>
        <div className="flex justify-end gap-3">
          <button onClick={onAnnuleer} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">Annuleren</button>
          <button onClick={onBevestig} disabled={loading} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-50">
            {loading ? 'Verwijderen...' : 'Ja, verwijderen'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Hoofdcomponent ────────────────────────────────────────────────────────────
export default function Klanten() {
  useEffect(() => { document.title = 'Klanten — BYT Studio' }, [])
  const navigate = useNavigate()
  const [klanten, setKlanten] = useState([])
  const [loading, setLoading] = useState(true)
  const [zoekterm, setZoekterm] = useState('')
  const [modalKlant, setModalKlant] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [verwijderKlant, setVerwijderKlant] = useState(null)
  const [verwijderLoading, setVerwijderLoading] = useState(false)

  async function laadKlanten() {
    setLoading(true)
    const { data } = await supabase.from('klanten').select('*').order('aangemaakt_op', { ascending: false })
    setKlanten(data ?? [])
    setLoading(false)
  }

  useEffect(() => { laadKlanten() }, [])

  async function handleVerwijder() {
    setVerwijderLoading(true)
    await supabase.from('klanten').delete().eq('id', verwijderKlant.id)
    setVerwijderKlant(null)
    setVerwijderLoading(false)
    laadKlanten()
  }

  const gefilterd = klanten.filter(k => {
    const q = zoekterm.toLowerCase()
    return (
      k.naam?.toLowerCase().includes(q) ||
      k.bedrijfsnaam?.toLowerCase().includes(q) ||
      k.email?.toLowerCase().includes(q) ||
      k.sector?.toLowerCase().includes(q)
    )
  })

  function openBewerken(klant) {
    setModalKlant(klant)
    setModalOpen(true)
  }

  async function opgeslagen(nieuwId) {
    setModalOpen(false)
    setModalKlant(null)
    if (nieuwId) {
      navigate(`/klanten/${nieuwId}`)
      return
    }
    await laadKlanten()
  }

  return (
    <PageWrapper
      title="Klanten"
      description={`${klanten.length} klant${klanten.length !== 1 ? 'en' : ''} in totaal`}
      actions={
        <button onClick={() => { setModalKlant(null); setModalOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition"
          style={{ background: '#185FA5' }}>
          <Plus size={15} /> Klant toevoegen
        </button>
      }
    >
      {/* Zoekbalk */}
      <div className="relative max-w-sm mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={zoekterm} onChange={e => setZoekterm(e.target.value)}
          placeholder="Zoek op naam, bedrijf, e-mail..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 bg-white" />
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="px-6 py-12 text-center">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: '#185FA5', borderTopColor: 'transparent' }} />
          </div>
        ) : gefilterd.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-400 text-sm">
              {zoekterm ? `Geen resultaten voor "${zoekterm}"` : 'Nog geen klanten. Klik op "+ Klant toevoegen" om te starten.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Naam</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Bedrijf</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Contact</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Sector</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {gefilterd.map(k => (
                <tr key={k.id} onClick={() => navigate(`/klanten/${k.id}`)}
                  className="hover:bg-gray-50 transition-colors cursor-pointer">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: '#185FA5' }}>
                        {initials(k.naam)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{k.naam}</p>
                        {k.btw_nummer && <p className="text-xs text-gray-400">{k.btw_nummer}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    {k.bedrijfsnaam
                      ? <span className="flex items-center gap-1.5 text-gray-600"><Building2 size={13} className="text-gray-400 flex-shrink-0" />{k.bedrijfsnaam}</span>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    <div className="space-y-0.5">
                      {k.email && <span className="flex items-center gap-1.5 text-gray-600"><Mail size={12} className="flex-shrink-0" /> {k.email}</span>}
                      {k.telefoon && <span className="flex items-center gap-1.5 text-gray-500"><Phone size={12} className="flex-shrink-0" /> {k.telefoon}</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    {k.sector
                      ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600"><Tag size={10} />{k.sector}</span>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openBewerken(k)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-gray-100 transition" title="Bewerken"><Pencil size={14} /></button>
                      <button onClick={() => setVerwijderKlant(k)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition" title="Verwijderen"><Trash2 size={14} /></button>
                      <ChevronRight size={14} className="text-gray-300 ml-1" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <KlantModal
          klant={modalKlant}
          onSluit={() => { setModalOpen(false); setModalKlant(null) }}
          onOpgeslagen={opgeslagen}
        />
      )}
      {verwijderKlant && (
        <BevestigVerwijder
          naam={verwijderKlant.naam}
          onBevestig={handleVerwijder}
          onAnnuleer={() => setVerwijderKlant(null)}
          loading={verwijderLoading}
        />
      )}
    </PageWrapper>
  )
}
