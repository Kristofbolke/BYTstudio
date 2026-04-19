// Offertes.jsx — Volledig offertebeheer met regelitems, berekeningen en statusopvolging
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PageWrapper from '../components/PageWrapper'
import {
  Plus, Pencil, Trash2, X, Search, FileText,
  ChevronDown, GripVertical, Check, Send, Euro
} from 'lucide-react'

// ── Configuratie ───────────────────────────────────────────────────────────

const STATUSSEN = [
  { key: 'concept',      label: 'Concept',      kleur: '#64748b', bg: '#f1f5f9' },
  { key: 'verzonden',    label: 'Verzonden',     kleur: '#2563eb', bg: '#dbeafe' },
  { key: 'goedgekeurd',  label: 'Goedgekeurd',  kleur: '#16a34a', bg: '#dcfce7' },
  { key: 'gefactureerd', label: 'Gefactureerd',  kleur: '#7c3aed', bg: '#ede9fe' },
]

const EENHEDEN = ['uur', 'dag', 'stuk', 'forfait', 'maand', 'km', '%']

const LEEG_ITEM = { omschrijving: '', hoeveelheid: 1, eenheid: 'uur', eenheidsprijs: 0 }

const LEEG_OFFERTE = {
  project_id: '', klant_id: '', offerte_nummer: '',
  status: 'concept', uurtarief: 75, btw_percentage: 21,
  marge_percentage: 0, geldig_tot: '', notities: '',
  items_json: [{ ...LEEG_ITEM }],
}

// ── Helpers ────────────────────────────────────────────────────────────────

function genereerNummer() {
  const jaar = new Date().getFullYear()
  const rnd = String(Math.floor(Math.random() * 900) + 100)
  return `OFF-${jaar}-${rnd}`
}

function berekenItem(item) {
  return (Number(item.hoeveelheid) || 0) * (Number(item.eenheidsprijs) || 0)
}

function berekenTotalen(items, btw, marge) {
  const subtotaal = items.reduce((s, i) => s + berekenItem(i), 0)
  const margeB = subtotaal * (Number(marge) / 100)
  const excl = subtotaal + margeB
  const btwB = excl * (Number(btw) / 100)
  const incl = excl + btwB
  return { subtotaal, margeB, excl, btwB, incl }
}

function fmt(n) { return Number(n).toFixed(2).replace('.', ',') }

// ── StatusBadge ────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = STATUSSEN.find(s => s.key === status) ?? STATUSSEN[0]
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.kleur }}>
      {cfg.label}
    </span>
  )
}

// ── Offerte formulier (grote modal) ────────────────────────────────────────

function OfferteModal({ offerte, klanten, projecten, onSluit, onOpgeslagen }) {
  const isBewerken = !!offerte?.id
  const [form, setForm] = useState(() => ({
    ...LEEG_OFFERTE,
    offerte_nummer: genereerNummer(),
    geldig_tot: new Date(Date.now() + 30 * 864e5).toISOString().split('T')[0],
    ...(offerte ?? {}),
    items_json: offerte?.items_json?.length ? offerte.items_json : [{ ...LEEG_ITEM }],
  }))
  const [loading, setLoading] = useState(false)
  const [fout, setFout] = useState('')

  function stelIn(veld, waarde) { setForm(v => ({ ...v, [veld]: waarde })) }

  function updateItem(idx, veld, waarde) {
    const items = [...form.items_json]
    items[idx] = { ...items[idx], [veld]: waarde }
    stelIn('items_json', items)
  }

  function voegItemToe() {
    stelIn('items_json', [...form.items_json, { ...LEEG_ITEM }])
  }

  function verwijderItem(idx) {
    if (form.items_json.length === 1) return
    stelIn('items_json', form.items_json.filter((_, i) => i !== idx))
  }

  const totalen = berekenTotalen(form.items_json, form.btw_percentage, form.marge_percentage)

  async function handleOpslaan(e) {
    e.preventDefault()
    if (!form.klant_id) { setFout('Selecteer een klant.'); return }
    if (!form.offerte_nummer.trim()) { setFout('Offertenummer is verplicht.'); return }
    setLoading(true)
    setFout('')
    const payload = {
      ...form,
      klant_id: form.klant_id || null,
      project_id: form.project_id || null,
      items_json: form.items_json,
    }
    const { error } = isBewerken
      ? await supabase.from('offertes').update(payload).eq('id', offerte.id)
      : await supabase.from('offertes').insert(payload)
    if (error) { setFout('Opslaan mislukt: ' + error.message); setLoading(false); return }
    onOpgeslagen()
  }

  const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#e94560]/30 focus:border-[#e94560]"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[94vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="font-semibold text-gray-900">{isBewerken ? 'Offerte bewerken' : 'Nieuwe offerte'}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{form.offerte_nummer}</p>
          </div>
          <button onClick={onSluit} className="text-gray-400 hover:text-gray-600 transition"><X size={18} /></button>
        </div>

        {/* Scrollbaar gedeelte */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

          {/* Klant, project, nummer, status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Klant <span className="text-[#e94560]">*</span></label>
              <select value={form.klant_id} onChange={e => stelIn('klant_id', e.target.value)} className={inputCls + ' bg-white'}>
                <option value="">— Kies klant —</option>
                {klanten.map(k => <option key={k.id} value={k.id}>{k.bedrijfsnaam || k.naam}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Project</label>
              <select value={form.project_id} onChange={e => stelIn('project_id', e.target.value)} className={inputCls + ' bg-white'}>
                <option value="">— Geen project —</option>
                {projecten.map(p => <option key={p.id} value={p.id}>{p.naam}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Offertenummer</label>
              <input value={form.offerte_nummer} onChange={e => stelIn('offerte_nummer', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
              <select value={form.status} onChange={e => stelIn('status', e.target.value)} className={inputCls + ' bg-white'}>
                {STATUSSEN.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Geldig tot</label>
              <input type="date" value={form.geldig_tot} onChange={e => stelIn('geldig_tot', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Standaard uurtarief (€)</label>
              <input type="number" value={form.uurtarief} onChange={e => stelIn('uurtarief', e.target.value)} className={inputCls} min="0" />
            </div>
          </div>

          {/* Regelitems */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-700">Regelitems</p>
              <button type="button" onClick={voegItemToe}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition"
                style={{ background: '#e94560' }}>
                <Plus size={12} /> Regel toevoegen
              </button>
            </div>

            {/* Tabel header */}
            <div className="grid gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide px-1 mb-1"
              style={{ gridTemplateColumns: '1fr 80px 90px 100px 90px 32px' }}>
              <span>Omschrijving</span>
              <span>Aantal</span>
              <span>Eenheid</span>
              <span>Prijs/eenheid</span>
              <span className="text-right">Totaal</span>
              <span />
            </div>

            {/* Regelitems */}
            <div className="space-y-2">
              {form.items_json.map((item, idx) => (
                <div key={idx} className="grid gap-2 items-center bg-gray-50 rounded-xl px-3 py-2.5"
                  style={{ gridTemplateColumns: '1fr 80px 90px 100px 90px 32px' }}>
                  <input
                    value={item.omschrijving}
                    onChange={e => updateItem(idx, 'omschrijving', e.target.value)}
                    placeholder="Omschrijving..."
                    className="px-2 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#e94560]/30 focus:border-[#e94560] bg-white"
                  />
                  <input
                    type="number" min="0" step="0.5"
                    value={item.hoeveelheid}
                    onChange={e => updateItem(idx, 'hoeveelheid', e.target.value)}
                    className="px-2 py-1.5 rounded-lg border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#e94560]/30 focus:border-[#e94560] bg-white"
                  />
                  <select
                    value={item.eenheid}
                    onChange={e => updateItem(idx, 'eenheid', e.target.value)}
                    className="px-2 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#e94560]/30 focus:border-[#e94560] bg-white"
                  >
                    {EENHEDEN.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">€</span>
                    <input
                      type="number" min="0" step="0.01"
                      value={item.eenheidsprijs}
                      onChange={e => updateItem(idx, 'eenheidsprijs', e.target.value)}
                      className="w-full pl-5 pr-2 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#e94560]/30 focus:border-[#e94560] bg-white"
                    />
                  </div>
                  <p className="text-sm font-semibold text-gray-800 text-right pr-1">
                    € {fmt(berekenItem(item))}
                  </p>
                  <button type="button" onClick={() => verwijderItem(idx)}
                    disabled={form.items_json.length === 1}
                    className="p-1 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition disabled:opacity-30">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Berekening */}
          <div className="grid grid-cols-2 gap-4 items-start">
            {/* BTW & marge */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">BTW (%)</label>
                <input type="number" value={form.btw_percentage} onChange={e => stelIn('btw_percentage', e.target.value)}
                  min="0" max="100" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Marge (%)</label>
                <input type="number" value={form.marge_percentage} onChange={e => stelIn('marge_percentage', e.target.value)}
                  min="0" max="100" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Notities</label>
                <textarea value={form.notities} onChange={e => stelIn('notities', e.target.value)}
                  rows={3} placeholder="Interne notities, betalingsvoorwaarden..."
                  className={inputCls + ' resize-none'} />
              </div>
            </div>

            {/* Totaaltabel */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotaal</span>
                <span>€ {fmt(totalen.subtotaal)}</span>
              </div>
              {totalen.margeB > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Marge ({form.marge_percentage}%)</span>
                  <span>€ {fmt(totalen.margeB)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600 border-t border-gray-200 pt-2">
                <span>Excl. BTW</span>
                <span className="font-medium">€ {fmt(totalen.excl)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>BTW ({form.btw_percentage}%)</span>
                <span>€ {fmt(totalen.btwB)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2 text-base">
                <span>Totaal incl. BTW</span>
                <span style={{ color: '#e94560' }}>€ {fmt(totalen.incl)}</span>
              </div>
            </div>
          </div>

          {fout && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{fout}</p>}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button type="button" onClick={onSluit}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">
            Annuleren
          </button>
          <button onClick={handleOpslaan} disabled={loading}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 transition"
            style={{ background: '#e94560' }}>
            {loading ? 'Opslaan...' : isBewerken ? 'Wijzigingen opslaan' : 'Offerte aanmaken'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Bevestig verwijderen ───────────────────────────────────────────────────

function BevestigVerwijder({ naam, onBevestig, onAnnuleer, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-2">Offerte verwijderen?</h3>
        <p className="text-sm text-gray-500 mb-6">Ben je zeker dat je <strong>{naam}</strong> wil verwijderen?</p>
        <div className="flex justify-end gap-3">
          <button onClick={onAnnuleer} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">Annuleren</button>
          <button onClick={onBevestig} disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-50">
            {loading ? 'Verwijderen...' : 'Ja, verwijderen'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Hoofdpagina ────────────────────────────────────────────────────────────

export default function Offertes() {
  const navigate = useNavigate()
  const [offertes, setOffertes] = useState([])
  const [klanten, setKlanten] = useState([])
  const [projecten, setProjecten] = useState([])
  const [loading, setLoading] = useState(true)
  const [zoekterm, setZoekterm] = useState('')
  const [statusFilter, setStatusFilter] = useState('alle')
  const [modalOfferte, setModalOfferte] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [verwijder, setVerwijder] = useState(null)
  const [verwijderLoading, setVerwijderLoading] = useState(false)

  async function laadData() {
    setLoading(true)
    const [{ data: o }, { data: k }, { data: p }] = await Promise.all([
      supabase.from('offertes')
        .select('*, klanten(naam, bedrijfsnaam), projecten(naam)')
        .order('aangemaakt_op', { ascending: false }),
      supabase.from('klanten').select('id, naam, bedrijfsnaam').order('naam'),
      supabase.from('projecten').select('id, naam').order('naam'),
    ])
    setOffertes(o ?? [])
    setKlanten(k ?? [])
    setProjecten(p ?? [])
    setLoading(false)
  }

  useEffect(() => { laadData() }, [])

  async function updateStatus(id, status) {
    await supabase.from('offertes').update({ status }).eq('id', id)
    setOffertes(prev => prev.map(o => o.id === id ? { ...o, status } : o))
  }

  async function handleVerwijder() {
    setVerwijderLoading(true)
    await supabase.from('offertes').delete().eq('id', verwijder.id)
    setVerwijder(null)
    setVerwijderLoading(false)
    laadData()
  }

  const gefilterd = offertes.filter(o => {
    const q = zoekterm.toLowerCase()
    const matchZoek =
      o.offerte_nummer?.toLowerCase().includes(q) ||
      o.klanten?.naam?.toLowerCase().includes(q) ||
      o.klanten?.bedrijfsnaam?.toLowerCase().includes(q) ||
      o.projecten?.naam?.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'alle' || o.status === statusFilter
    return matchZoek && matchStatus
  })

  const telPerStatus = STATUSSEN.reduce((acc, s) => {
    acc[s.key] = offertes.filter(o => o.status === s.key).length
    return acc
  }, {})

  const totaalIncl = gefilterd.reduce((s, o) => {
    if (!o.items_json) return s
    const t = berekenTotalen(o.items_json, o.btw_percentage, o.marge_percentage)
    return s + t.incl
  }, 0)

  return (
    <PageWrapper
      title="Offertes"
      description={`${offertes.length} offerte${offertes.length !== 1 ? 's' : ''} in totaal`}
      actions={
        <button
          onClick={() => { setModalOfferte({}); setModalOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition"
          style={{ background: '#e94560' }}
        >
          <Plus size={15} /> Nieuwe offerte
        </button>
      }
    >
      {/* Status-filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => setStatusFilter('alle')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${statusFilter === 'alle' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
          Alle ({offertes.length})
        </button>
        {STATUSSEN.map(s => (
          <button key={s.key} onClick={() => setStatusFilter(s.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${statusFilter === s.key ? 'text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            style={statusFilter === s.key ? { background: s.kleur } : {}}>
            {s.label} ({telPerStatus[s.key] ?? 0})
          </button>
        ))}
      </div>

      {/* Zoek + totaal */}
      <div className="flex items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={zoekterm} onChange={e => setZoekterm(e.target.value)}
            placeholder="Zoek op nummer, klant, project..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#e94560]/30 focus:border-[#e94560] bg-white" />
        </div>
        {gefilterd.length > 0 && (
          <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 px-4 py-2.5 rounded-xl">
            <Euro size={14} className="text-gray-400" />
            <span>€ {fmt(totaalIncl)}</span>
            <span className="text-xs font-normal text-gray-400">incl. BTW</span>
          </div>
        )}
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto"
              style={{ borderColor: '#e94560', borderTopColor: 'transparent' }} />
          </div>
        ) : gefilterd.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <FileText size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-400 text-sm">
              {zoekterm || statusFilter !== 'alle' ? 'Geen resultaten.' : 'Nog geen offertes. Klik op "+ Nieuwe offerte".'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nummer</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Klant</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Project</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Geldig tot</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Totaal</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {gefilterd.map(o => {
                const t = o.items_json ? berekenTotalen(o.items_json, o.btw_percentage, o.marge_percentage) : null
                const klantNaam = o.klanten?.bedrijfsnaam || o.klanten?.naam || '—'
                const verlopen = o.geldig_tot && new Date(o.geldig_tot) < new Date() && o.status !== 'goedgekeurd' && o.status !== 'gefactureerd'
                return (
                  <tr key={o.id} onClick={() => navigate(`/offertes/${o.id}`)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900">{o.offerte_nummer}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(o.aangemaakt_op).toLocaleDateString('nl-BE')}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell text-gray-700">{klantNaam}</td>
                    <td className="px-5 py-3.5 hidden lg:table-cell text-gray-500 text-xs">
                      {o.projecten?.naam || '—'}
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell" onClick={e => e.stopPropagation()}>
                      <select
                        value={o.status}
                        onChange={e => updateStatus(o.id, e.target.value)}
                        className="text-xs font-semibold rounded-full px-2.5 py-1 border-0 outline-none cursor-pointer"
                        style={{
                          background: STATUSSEN.find(s => s.key === o.status)?.bg ?? '#f1f5f9',
                          color: STATUSSEN.find(s => s.key === o.status)?.kleur ?? '#64748b',
                        }}
                      >
                        {STATUSSEN.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      {o.geldig_tot ? (
                        <span className={`text-xs ${verlopen ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                          {verlopen ? '⚠ ' : ''}{new Date(o.geldig_tot).toLocaleDateString('nl-BE')}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {t ? (
                        <div>
                          <p className="font-semibold text-gray-900">€ {fmt(t.incl)}</p>
                          <p className="text-xs text-gray-400">excl. € {fmt(t.excl)}</p>
                        </div>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => { setModalOfferte(o); setModalOpen(true) }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-[#e94560] hover:bg-gray-100 transition"
                          title="Bewerken"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setVerwijder(o)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                          title="Verwijderen"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {modalOpen && (
        <OfferteModal
          offerte={modalOfferte?.id ? modalOfferte : null}
          klanten={klanten}
          projecten={projecten}
          onSluit={() => { setModalOpen(false); setModalOfferte(null) }}
          onOpgeslagen={() => { setModalOpen(false); setModalOfferte(null); laadData() }}
        />
      )}
      {verwijder && (
        <BevestigVerwijder
          naam={verwijder.offerte_nummer}
          onBevestig={handleVerwijder}
          onAnnuleer={() => setVerwijder(null)}
          loading={verwijderLoading}
        />
      )}
    </PageWrapper>
  )
}
