// OfferteNieuw.jsx — Nieuwe offerte aanmaken (v2 builder)
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useInstellingen } from '../context/InstellingenContext'
import { ChevronLeft, ChevronDown, Save } from 'lucide-react'
import OfferteBuilder, {
  DEFAULT_BLOKKEN, berekenBlok, berekenAlles,
} from '../components/OfferteBuilder'

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUSSEN = [
  { key: 'concept',      label: 'Concept' },
  { key: 'verzonden',    label: 'Verzonden' },
  { key: 'goedgekeurd',  label: 'Goedgekeurd' },
  { key: 'gefactureerd', label: 'Gefactureerd' },
]

function fmt(n) {
  return Number(n ?? 0).toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function vandaagPlus(dagen) {
  const d = new Date(); d.setDate(d.getDate() + Number(dagen))
  return d.toISOString().split('T')[0]
}
function vandaag() { return new Date().toISOString().split('T')[0] }

async function genereerNummer() {
  const { count } = await supabase.from('offertes').select('*', { count: 'exact', head: true })
  return `OFF-${new Date().getFullYear()}-${String((count ?? 0) + 1).padStart(3, '0')}`
}

const inp = 'w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#78C833]/20 focus:border-[#78C833] bg-white'
const lbl = 'block text-xs font-semibold text-gray-500 mb-1'

function Sectie({ stap, titel, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-3 mb-1">
        <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
          {stap}
        </span>
        <p className="text-sm font-bold text-gray-700">{titel}</p>
      </div>
      {children}
    </div>
  )
}

// ── Totaaloverzicht (rechts, sticky) ─────────────────────────────────────────
function TotaalSamenvatting({ blokken, uurtarief }) {
  const actief = blokken.filter(b => b.actief)
  const { excl, btw, incl } = berekenAlles(blokken, uurtarief)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3"
      style={{ position: 'sticky', top: 24 }}>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Totaaloverzicht</p>

      {actief.map(blok => {
        const t = berekenBlok(blok, uurtarief)
        if (t.subtotaal === 0) return null
        return (
          <div key={blok.id} className="flex justify-between text-sm text-gray-500 gap-2">
            <span className="truncate">{blok.label}</span>
            <span className="flex-shrink-0 font-medium text-gray-700">€ {fmt(t.subtotaal)}</span>
          </div>
        )
      })}

      {actief.length > 1 && <div className="border-t border-gray-100" />}

      <div className="flex justify-between text-sm font-bold text-gray-900">
        <span>Excl. BTW</span>
        <span>€ {fmt(excl)}</span>
      </div>
      <div className="flex justify-between text-sm text-gray-500">
        <span>BTW</span>
        <span>€ {fmt(btw)}</span>
      </div>
      <div className="border-t border-gray-200 pt-3">
        <div className="flex justify-between text-base font-bold">
          <span className="text-gray-900">Totaal incl. BTW</span>
          <span style={{ color: '#78C833' }}>€ {fmt(incl)}</span>
        </div>
      </div>

      {/* Uren samenvatting */}
      {(() => {
        const devBlok = blokken.find(b => b.type === 'ontwikkeling' && b.actief)
        if (!devBlok) return null
        const totalUren = devBlok.items
          .filter(i => i.actief && i.modus === 'uren')
          .reduce((s, i) => s + (Number(i.waarde) || 0), 0)
        if (totalUren === 0) return null
        return (
          <div className="bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-400 flex justify-between">
            <span>Ontwikkelingsuren</span>
            <span className="font-semibold">{totalUren}u</span>
          </div>
        )
      })()}
    </div>
  )
}

// ── Hoofdcomponent ────────────────────────────────────────────────────────────
export default function OfferteNieuw() {
  useEffect(() => { document.title = 'Nieuwe offerte — BYT Studio' }, [])
  const navigate      = useNavigate()
  const [params]      = useSearchParams()
  const initKlantId   = params.get('klant_id') ?? ''
  const initProjectId = params.get('project_id') ?? ''

  const { instellingen, laden: instLaden } = useInstellingen()

  // Basisgegevens
  const [nummer,    setNummer]    = useState('')
  const [klantId,   setKlantId]   = useState(initKlantId)
  const [projectId, setProjectId] = useState(initProjectId)
  const [status,    setStatus]    = useState('concept')
  const [geldigTot, setGeldigTot] = useState(vandaagPlus(30))

  // Uurtarief
  const [uurtarief, setUurtarief] = useState(75)

  // Builder blokken — diepe kloon van defaults
  const [blokken, setBlokken] = useState(() =>
    JSON.parse(JSON.stringify(DEFAULT_BLOKKEN))
  )

  // Notities
  const [notities, setNotities] = useState('')

  // Stamdata
  const [klanten,   setKlanten]   = useState([])
  const [alleProj,  setAlleProj]  = useState([])

  // Huisstijl
  const [huisstijl,       setHuisstijl]       = useState(null)
  const [huisstijlStatus, setHuisstijlStatus] = useState(null)

  // UI
  const [opslaanBezig, setOpslaanBezig] = useState(false)
  const [fout,         setFout]         = useState('')

  // Instellingen toepassen
  useEffect(() => {
    if (!instLaden) {
      setUurtarief(instellingen.uurtarief ?? 75)
      setGeldigTot(vandaagPlus(instellingen.offerte_geldigheid ?? 30))
      // BTW per blok instellen
      const defaultBtw = instellingen.btw_percentage ?? 21
      setBlokken(prev => prev.map(b => ({ ...b, btw: defaultBtw })))
    }
  }, [instLaden])

  // Offertenummer + stamdata laden
  useEffect(() => {
    genereerNummer().then(setNummer)
    supabase.from('klanten').select('id, naam, bedrijfsnaam').order('naam')
      .then(({ data }) => setKlanten(data ?? []))
    supabase.from('projecten').select('id, naam, klant_id').order('naam')
      .then(({ data }) => setAlleProj(data ?? []))
  }, [])

  // Huisstijl laden bij projectwijziging
  useEffect(() => {
    if (!projectId) { setHuisstijl(null); setHuisstijlStatus(null); return }
    supabase.from('huisstijlen').select('*').eq('project_id', projectId).maybeSingle()
      .then(({ data }) => {
        setHuisstijl(data ?? null)
        setHuisstijlStatus(data ? 'gevonden' : 'niet_gevonden')
      })
  }, [projectId])

  // Reset projectId bij klantwissel
  useEffect(() => {
    if (klantId && projectId) {
      const hoortBij = alleProj.some(p => p.id === projectId && p.klant_id === klantId)
      if (!hoortBij) setProjectId('')
    }
  }, [klantId, alleProj])

  const gefilterdeProjecten = klantId ? alleProj.filter(p => p.klant_id === klantId) : alleProj

  async function handleOpslaan(e) {
    e.preventDefault()
    if (!klantId)       { setFout('Klant is verplicht.'); return }
    if (!projectId)     { setFout('Project is verplicht.'); return }
    if (!nummer.trim()) { setFout('Offertenummer is verplicht.'); return }

    setOpslaanBezig(true); setFout('')

    const { excl, btw, incl } = berekenAlles(blokken, uurtarief)

    const { data, error } = await supabase.from('offertes').insert({
      offerte_nummer:   nummer,
      klant_id:         klantId,
      project_id:       projectId,
      status,
      geldig_tot:       geldigTot || null,
      uurtarief:        Number(uurtarief),
      btw_percentage:   21,     // standaard; per blok opgeslagen in items_json
      marge_percentage: 0,
      notities:         notities || null,
      items_json:       { _v: 2, uurtarief: Number(uurtarief), blokken },
      aangemaakt_op:    vandaag(),
    }).select('id').single()

    setOpslaanBezig(false)
    if (error) { setFout('Opslaan mislukt: ' + error.message); return }
    navigate(`/offertes/${data.id}`)
  }

  return (
    <div className="max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-5">
        <Link to="/offertes" className="hover:text-gray-600 transition flex items-center gap-1">
          <ChevronLeft size={14} /> Offertes
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">Nieuwe offerte</span>
      </div>

      <form onSubmit={handleOpslaan}>
        <div className="flex gap-6 items-start">

          {/* ── Linker kolom ─────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* STAP 1 — Basisgegevens */}
            <Sectie stap="1" titel="Basisgegevens">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Offertenummer</label>
                  <input value={nummer} onChange={e => setNummer(e.target.value)}
                    placeholder="OFF-2025-001" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Status</label>
                  <div className="relative">
                    <select value={status} onChange={e => setStatus(e.target.value)}
                      className={inp + ' appearance-none pr-8'}>
                      {STATUSSEN.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className={lbl}>Klant <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <select value={klantId} onChange={e => setKlantId(e.target.value)}
                      className={inp + ' appearance-none pr-8'}>
                      <option value="">— Kies klant —</option>
                      {klanten.map(k => (
                        <option key={k.id} value={k.id}>
                          {k.naam}{k.bedrijfsnaam ? ` (${k.bedrijfsnaam})` : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className={lbl}>Project <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <select value={projectId} onChange={e => setProjectId(e.target.value)}
                      className={inp + ' appearance-none pr-8'} disabled={!klantId}>
                      <option value="">— {klantId ? 'Kies project' : 'Eerst klant kiezen'} —</option>
                      {gefilterdeProjecten.map(p => (
                        <option key={p.id} value={p.id}>{p.naam}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className={lbl}>Datum aangemaakt</label>
                  <input type="date" value={vandaag()} disabled
                    className={inp + ' text-gray-400 bg-gray-50'} />
                </div>
                <div>
                  <label className={lbl}>Geldig tot</label>
                  <input type="date" value={geldigTot}
                    onChange={e => setGeldigTot(e.target.value)} className={inp} />
                </div>
              </div>

              {/* Huisstijl status */}
              {huisstijlStatus === 'gevonden' && huisstijl && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
                  style={{ background: `${huisstijl.primaire_kleur}18`, border: `1px solid ${huisstijl.primaire_kleur}40` }}>
                  <div className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0"
                    style={{ background: huisstijl.primaire_kleur }} />
                  <div>
                    <p className="font-semibold" style={{ color: huisstijl.primaire_kleur }}>Huisstijl ingeladen</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Kleur: <span className="font-mono">{huisstijl.primaire_kleur?.toUpperCase()}</span>
                      {huisstijl.font_titel && <> · {huisstijl.font_titel}</>}
                    </p>
                  </div>
                </div>
              )}
              {huisstijlStatus === 'niet_gevonden' && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100 text-sm">
                  <span className="text-amber-400 mt-0.5 flex-shrink-0">⚠</span>
                  <p className="text-amber-700 text-xs">Nog geen huisstijl ingesteld voor dit project.</p>
                </div>
              )}
            </Sectie>

            {/* STAP 2 — Uurtarief */}
            <Sectie stap="2" titel="Uurtarief">
              <div className="flex items-end gap-4">
                <div>
                  <label className={lbl}>Uurtarief (€)</label>
                  <div className="relative w-36">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                    <input type="number" min="0" step="1" value={uurtarief}
                      onChange={e => setUurtarief(Number(e.target.value))}
                      className={inp + ' pl-7'} />
                  </div>
                </div>
                <p className="text-xs text-gray-400 pb-3">
                  Gebruikt als tarief voor "Uren"-items en als basis voor procentuele berekeningen.
                </p>
              </div>
            </Sectie>

            {/* STAP 3 — Offerteblokken */}
            <Sectie stap="3" titel="Offerteblokken">
              <p className="text-xs text-gray-400 -mt-2">
                Schakel blokken in of uit en activeer de categorieën die van toepassing zijn.
              </p>
              <OfferteBuilder
                blokken={blokken}
                uurtarief={uurtarief}
                onChange={setBlokken}
              />
            </Sectie>

            {/* STAP 4 — Notities */}
            <Sectie stap="4" titel="Notities & voorwaarden">
              <textarea value={notities} onChange={e => setNotities(e.target.value)}
                rows={5} placeholder="Extra toelichting, voorwaarden, betalingstermijnen..."
                className={inp + ' resize-y'} />
            </Sectie>

            {/* Fout + acties */}
            {fout && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl">
                {fout}
              </p>
            )}

            <div className="flex items-center gap-3 pb-8">
              <button type="submit" disabled={opslaanBezig}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 shadow-sm transition-opacity hover:opacity-90"
                style={{ background: '#78C833' }}>
                <Save size={15} />
                {opslaanBezig ? 'Opslaan...' : 'Offerte opslaan'}
              </button>
              <Link to="/offertes"
                className="px-5 py-3 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition">
                Annuleren
              </Link>
            </div>
          </div>

          {/* ── Rechter kolom — totaalpaneel sticky ──────────────────────────── */}
          <div style={{ width: 260, flexShrink: 0 }}>
            <TotaalSamenvatting blokken={blokken} uurtarief={uurtarief} />
          </div>

        </div>
      </form>
    </div>
  )
}
