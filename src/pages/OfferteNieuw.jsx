// OfferteNieuw.jsx — Nieuw offerte aanmaken
import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ChevronLeft, ChevronDown, Plus, Save } from 'lucide-react'

// ── Constanten ───────────────────────────────────────────────────────────────
const STATUSSEN = [
  { key: 'concept',      label: 'Concept' },
  { key: 'verzonden',    label: 'Verzonden' },
  { key: 'goedgekeurd',  label: 'Goedgekeurd' },
  { key: 'gefactureerd', label: 'Gefactureerd' },
]

const DEFAULT_ITEMS = [
  { omschrijving: 'Projectopzet & mappenstructuur', hoeveelheid: 3, eenheidsprijs: 75 },
  { omschrijving: 'Navigatie & basislay-out',       hoeveelheid: 4, eenheidsprijs: 75 },
  { omschrijving: 'Huisstijl & responsive design',  hoeveelheid: 5, eenheidsprijs: 75 },
]

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n) {
  return Number(n).toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function vandaagPlus(dagen) {
  const d = new Date()
  d.setDate(d.getDate() + dagen)
  return d.toISOString().split('T')[0]
}

function vandaag() {
  return new Date().toISOString().split('T')[0]
}

async function genereerNummer() {
  const { count } = await supabase
    .from('offertes')
    .select('*', { count: 'exact', head: true })
  const volg = String((count ?? 0) + 1).padStart(3, '0')
  return `OFF-${new Date().getFullYear()}-${volg}`
}

// ── Stijlen ──────────────────────────────────────────────────────────────────
const inp = 'w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 bg-white'
const lbl = 'block text-xs font-semibold text-gray-500 mb-1'

// ── Sectie wrapper ───────────────────────────────────────────────────────────
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

// ── Totaaloverzicht (sticky rechts) ──────────────────────────────────────────
function TotaalPanel({ items, btw, marge }) {
  const subtotaalRuw = items.reduce((s, i) => s + (Number(i.hoeveelheid) || 0) * (Number(i.eenheidsprijs) || 0), 0)
  const margeB       = subtotaalRuw * (Number(marge) / 100)
  const excl         = subtotaalRuw + margeB
  const btwB         = excl * (Number(btw) / 100)
  const incl         = excl + btwB

  const rij = (label, waarde, vet = false, groot = false) => (
    <div className={`flex justify-between items-center ${vet ? 'font-bold' : ''} ${groot ? 'text-base' : 'text-sm'}`}>
      <span className={vet ? 'text-gray-900' : 'text-gray-500'}>{label}</span>
      <span className={vet ? 'text-gray-900' : 'text-gray-700'}>€ {fmt(waarde)}</span>
    </div>
  )

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3"
      style={{ position: 'sticky', top: '24px' }}>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Totaaloverzicht</p>
      {rij('Subtotaal (uren)', subtotaalRuw)}
      {Number(marge) > 0 && rij(`Buffer/marge (${marge}%)`, margeB)}
      <div className="border-t border-gray-100 pt-3">
        {rij('Excl. BTW', excl, true)}
      </div>
      {rij(`BTW (${btw}%)`, btwB)}
      <div className="border-t border-gray-200 pt-3">
        {rij('Totaal incl. BTW', incl, true, true)}
      </div>
      <div className="bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-400 space-y-1 mt-2">
        <div className="flex justify-between"><span>Uren totaal</span>
          <span>{items.reduce((s, i) => s + (Number(i.hoeveelheid) || 0), 0)}u</span>
        </div>
        <div className="flex justify-between"><span>Regels</span><span>{items.length}</span></div>
      </div>
    </div>
  )
}

// ── Itemrij ──────────────────────────────────────────────────────────────────
function ItemRij({ item, idx, uurtarief, onChange, onVerwijder }) {
  const totaal = (Number(item.hoeveelheid) || 0) * (Number(item.eenheidsprijs) || 0)

  function update(veld, waarde) { onChange(idx, veld, waarde) }

  // Sync eenheidsprijs als uurtarief wijzigt en gebruiker niet zelf aanpaste
  useEffect(() => {
    if (!item._prijsAangepast) {
      onChange(idx, 'eenheidsprijs', uurtarief)
    }
  }, [uurtarief])

  return (
    <div className="grid gap-2 items-center"
      style={{ gridTemplateColumns: '1fr 80px 110px 100px 32px' }}>
      <input
        value={item.omschrijving}
        onChange={e => update('omschrijving', e.target.value)}
        placeholder="Module / omschrijving..."
        className={inp}
      />
      <input
        type="number" min="0" step="0.5"
        value={item.hoeveelheid}
        onChange={e => update('hoeveelheid', e.target.value)}
        className={inp + ' text-right'}
        title="Geschatte uren"
      />
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">€</span>
        <input
          type="number" min="0" step="0.5"
          value={item.eenheidsprijs}
          onChange={e => update('eenheidsprijs', e.target.value, true)}
          className={inp + ' text-right pl-7'}
          title="Prijs per uur"
        />
      </div>
      <p className="text-sm font-semibold text-gray-700 text-right pr-1">
        € {fmt(totaal)}
      </p>
      <button type="button" onClick={() => onVerwijder(idx)}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition text-lg font-bold leading-none">
        ×
      </button>
    </div>
  )
}

// ── Hoofdcomponent ────────────────────────────────────────────────────────────
export default function OfferteNieuw() {
  const navigate      = useNavigate()
  const [params]      = useSearchParams()
  const initKlantId   = params.get('klant_id') ?? ''
  const initProjectId = params.get('project_id') ?? ''

  // Basisgegevens
  const [nummer,    setNummer]    = useState('')
  const [klantId,   setKlantId]   = useState(initKlantId)
  const [projectId, setProjectId] = useState(initProjectId)
  const [status,    setStatus]    = useState('concept')
  const [geldigTot, setGeldigTot] = useState(vandaagPlus(30))

  // Berekening
  const [uurtarief, setUurtarief] = useState(75)
  const [btw,       setBtw]       = useState(21)
  const [marge,     setMarge]     = useState(15)

  // Items
  const [items, setItems] = useState(
    DEFAULT_ITEMS.map(i => ({ ...i, _prijsAangepast: false }))
  )

  // Notities
  const [notities, setNotities] = useState('')

  // Data
  const [klanten,   setKlanten]   = useState([])
  const [projecten, setProjecten] = useState([])
  const [alleProj,  setAlleProj]  = useState([])

  // Huisstijl
  const [huisstijl,       setHuisstijl]       = useState(null)
  const [huisstijlStatus, setHuisstijlStatus] = useState(null) // 'gevonden' | 'niet_gevonden' | null

  // UI
  const [opslaan, setOpslaan] = useState(false)
  const [fout,    setFout]    = useState('')

  // Laad offertenummer + klanten + projecten
  useEffect(() => {
    genereerNummer().then(setNummer)
    supabase.from('klanten').select('id, naam, bedrijfsnaam').order('naam')
      .then(({ data }) => setKlanten(data ?? []))
    supabase.from('projecten').select('id, naam, klant_id').order('naam')
      .then(({ data }) => { setAlleProj(data ?? []) })
  }, [])

  // Filter projecten op klant
  useEffect(() => {
    if (klantId) {
      setProjecten(alleProj.filter(p => p.klant_id === klantId))
    } else {
      setProjecten(alleProj)
    }
    // Reset projectId als het niet meer bij de klant hoort
    if (klantId && projectId) {
      const hoortBij = alleProj.some(p => p.id === projectId && p.klant_id === klantId)
      if (!hoortBij) setProjectId('')
    }
  }, [klantId, alleProj])

  // Laad huisstijl bij projectwijziging
  useEffect(() => {
    if (!projectId) { setHuisstijl(null); setHuisstijlStatus(null); return }
    supabase
      .from('huisstijlen')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setHuisstijl(data)
          setHuisstijlStatus('gevonden')
        } else {
          setHuisstijl(null)
          setHuisstijlStatus('niet_gevonden')
        }
      })
  }, [projectId])

  // Sync uurtarief naar items die niet handmatig zijn aangepast
  function updateItem(idx, veld, waarde, handmatig = false) {
    setItems(prev => prev.map((it, i) => {
      if (i !== idx) return it
      const update = { ...it, [veld]: waarde }
      if (veld === 'eenheidsprijs' && handmatig) update._prijsAangepast = true
      return update
    }))
  }

  function voegItemToe() {
    setItems(prev => [...prev, {
      omschrijving: '', hoeveelheid: 1,
      eenheidsprijs: uurtarief, _prijsAangepast: false,
    }])
  }

  function verwijderItem(idx) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleOpslaan(e) {
    e.preventDefault()
    if (!klantId)   { setFout('Klant is verplicht.'); return }
    if (!projectId) { setFout('Project is verplicht.'); return }
    if (!nummer.trim()) { setFout('Offertenummer is verplicht.'); return }

    setOpslaan(true); setFout('')

    // Bereken totalen voor opslag
    const schoneItems = items.map(({ _prijsAangepast, ...rest }) => ({ ...rest, eenheid: 'uur' }))
    const subtotaal   = schoneItems.reduce((s, i) => s + (Number(i.hoeveelheid) || 0) * (Number(i.eenheidsprijs) || 0), 0)
    const margeB      = subtotaal * (Number(marge) / 100)
    const excl        = subtotaal + margeB
    const btwB        = excl * (Number(btw) / 100)
    const inclTotaal  = excl + btwB

    const { data, error } = await supabase.from('offertes').insert({
      offerte_nummer:   nummer,
      klant_id:         klantId,
      project_id:       projectId,
      status,
      geldig_tot:       geldigTot || null,
      uurtarief:        Number(uurtarief),
      btw_percentage:   Number(btw),
      marge_percentage: Number(marge),
      notities:         notities || null,
      items_json:       schoneItems,
      aangemaakt_op:    vandaag(),
    }).select('id').single()

    setOpslaan(false)

    if (error) { setFout('Opslaan mislukt: ' + error.message); return }
    navigate(`/offertes/${data.id}`)
  }

  const gefilterdeProjecten = klantId
    ? alleProj.filter(p => p.klant_id === klantId)
    : alleProj

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

          {/* Linker kolom — formulier */}
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
                      className={inp + ' appearance-none pr-8'}
                      disabled={!klantId}>
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
                    onChange={e => setGeldigTot(e.target.value)}
                    className={inp} />
                </div>
              </div>

              {/* Huisstijlstatus melding */}
              {huisstijlStatus === 'gevonden' && huisstijl && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
                  style={{ background: `${huisstijl.primaire_kleur}18`, border: `1px solid ${huisstijl.primaire_kleur}40` }}>
                  <div className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0"
                    style={{ background: huisstijl.primaire_kleur }} />
                  <div>
                    <p className="font-semibold text-gray-800" style={{ color: huisstijl.primaire_kleur }}>
                      Huisstijl ingeladen
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Primaire kleur: <span className="font-mono">{huisstijl.primaire_kleur?.toUpperCase()}</span>
                      {huisstijl.font_titel && <> · Titelfont: {huisstijl.font_titel}</>}
                      {huisstijl.bedrijfsslogan && <> · "{huisstijl.bedrijfsslogan}"</>}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      De PDF gebruikt deze huisstijl als accentkleur.
                    </p>
                  </div>
                </div>
              )}

              {huisstijlStatus === 'niet_gevonden' && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100 text-sm">
                  <span className="text-amber-400 mt-0.5 flex-shrink-0">⚠</span>
                  <div>
                    <p className="font-medium text-amber-800">Nog geen huisstijl ingesteld voor dit project.</p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      Klantgegevens worden geladen uit de klantenfiche.
                      Stel een huisstijl in via het Huisstijl-tabblad van het project.
                    </p>
                  </div>
                </div>
              )}
            </Sectie>

            {/* STAP 2 — Berekening */}
            <Sectie stap="2" titel="Instellingen berekening">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={lbl}>Uurtarief (€)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                    <input type="number" min="0" step="1" value={uurtarief}
                      onChange={e => {
                        const val = Number(e.target.value)
                        setUurtarief(val)
                        // Sync niet-aangepaste items
                        setItems(prev => prev.map(it =>
                          it._prijsAangepast ? it : { ...it, eenheidsprijs: val }
                        ))
                      }}
                      className={inp + ' pl-7'} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>BTW (%)</label>
                  <input type="number" min="0" max="100" step="1" value={btw}
                    onChange={e => setBtw(e.target.value)} className={inp} />
                </div>
                <div>
                  <label className={lbl}>Marge / buffer (%)</label>
                  <input type="number" min="0" max="100" step="1" value={marge}
                    onChange={e => setMarge(e.target.value)} className={inp} />
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Marge wordt bovenop de subtotaal berekend en verrekend vóór BTW.
              </p>
            </Sectie>

            {/* STAP 3 — Itemlijst */}
            <Sectie stap="3" titel="Regelitems">
              {/* Kolomhoofden */}
              <div className="grid gap-2 px-0.5"
                style={{ gridTemplateColumns: '1fr 80px 110px 100px 32px' }}>
                {['Module / omschrijving', 'Uren', 'Prijs/uur', 'Totaal', ''].map(h => (
                  <p key={h} className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</p>
                ))}
              </div>

              <div className="space-y-2">
                {items.map((item, idx) => (
                  <ItemRij
                    key={idx}
                    item={item}
                    idx={idx}
                    uurtarief={uurtarief}
                    onChange={updateItem}
                    onVerwijder={verwijderItem}
                  />
                ))}
              </div>

              <button type="button" onClick={voegItemToe}
                className="flex items-center gap-1.5 text-sm text-blue-500 hover:text-blue-700 font-semibold transition mt-1">
                <Plus size={14} /> Item toevoegen
              </button>
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
              <button type="submit" disabled={opslaan}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 shadow-sm"
                style={{ background: '#185FA5' }}>
                <Save size={15} />
                {opslaan ? 'Opslaan...' : 'Opslaan als concept'}
              </button>
              <Link to="/offertes"
                className="px-5 py-3 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition">
                Annuleren
              </Link>
            </div>
          </div>

          {/* Rechter kolom — totaaloverzicht sticky */}
          <div style={{ width: '260px', flexShrink: 0 }}>
            <TotaalPanel items={items} btw={btw} marge={marge} />
          </div>
        </div>
      </form>
    </div>
  )
}
