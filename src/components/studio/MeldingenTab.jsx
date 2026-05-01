// MeldingenTab.jsx — Meldingen tabblad voor Studio
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, X, AlertTriangle, Bug, ChevronDown, CheckCircle } from 'lucide-react'

const ERNST_CFG = {
  laag:   { label: 'Laag',   kleur: '#16a34a', bg: '#dcfce7' },
  medium: { label: 'Medium', kleur: '#d97706', bg: '#fef3c7' },
  hoog:   { label: 'Hoog',   kleur: '#dc2626', bg: '#fee2e2' },
}

const MELDING_STATUSSEN = [
  { key: 'nieuw',          label: 'Nieuw' },
  { key: 'in_behandeling', label: 'In behandeling' },
  { key: 'opgelost',       label: 'Opgelost' },
  { key: 'gesloten',       label: 'Gesloten' },
]

const MELDING_STATUS_KLEUREN = {
  nieuw:          { kleur: '#64748b', bg: '#f1f5f9' },
  in_behandeling: { kleur: '#d97706', bg: '#fef3c7' },
  opgelost:       { kleur: '#16a34a', bg: '#dcfce7' },
  gesloten:       { kleur: '#94a3b8', bg: '#f8fafc' },
}

const FILTER_TABS = [
  { key: 'alle',          label: 'Alle' },
  { key: 'nieuw',         label: 'Open' },
  { key: 'in_behandeling',label: 'In behandeling' },
  { key: 'opgelost',      label: 'Opgelost' },
]

function formatDatum(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#185FA5', borderTopColor: 'transparent' }} />
    </div>
  )
}

export default function MeldingenTab({ project }) {
  const [meldingen, setMeldingen]   = useState([])
  const [laden, setLaden]           = useState(true)
  const [filter, setFilter]         = useState('alle')
  const [detailOpen, setDetailOpen] = useState(null)   // melding object
  const [nieuwOpen, setNieuwOpen]   = useState(false)
  const [opslaan, setOpslaan]       = useState(false)

  // Detail modal state
  const [detailStatus,  setDetailStatus]  = useState('')
  const [detailErnst,   setDetailErnst]   = useState('')
  const [detailNotitie, setDetailNotitie] = useState('')
  const [detailOpslaan, setDetailOpslaan] = useState(false)
  const [detailBewaard, setDetailBewaard] = useState(false)

  // Nieuw formulier state
  const [nieuwOnderdeel,   setNieuwOnderdeel]   = useState('')
  const [nieuwBeschrijving,setNieuwBeschrijving] = useState('')
  const [nieuwErnst,       setNieuwErnst]        = useState('medium')
  const [nieuwKlantNaam,   setNieuwKlantNaam]    = useState('')

  useEffect(() => {
    if (!project?.id) return
    laad()
  }, [project?.id])

  async function laad() {
    setLaden(true)
    const { data } = await supabase
      .from('bug_meldingen')
      .select('*')
      .eq('project_id', project.id)
      .order('aangemaakt_op', { ascending: false })
    setMeldingen(data ?? [])
    setLaden(false)
  }

  function openDetail(m) {
    setDetailOpen(m)
    setDetailStatus(m.status ?? 'nieuw')
    setDetailErnst(m.ernst ?? 'medium')
    setDetailNotitie(m.notities_developer ?? '')
    setDetailBewaard(false)
  }

  async function slaDetailOp() {
    if (!detailOpen) return
    setDetailOpslaan(true)
    await supabase.from('bug_meldingen').update({
      status:              detailStatus,
      ernst:               detailErnst,
      notities_developer:  detailNotitie,
    }).eq('id', detailOpen.id)
    setMeldingen(m => m.map(x => x.id === detailOpen.id
      ? { ...x, status: detailStatus, ernst: detailErnst, notities_developer: detailNotitie }
      : x))
    setDetailOpen(prev => ({ ...prev, status: detailStatus, ernst: detailErnst, notities_developer: detailNotitie }))
    setDetailOpslaan(false)
    setDetailBewaard(true)
    setTimeout(() => setDetailBewaard(false), 2000)
  }

  async function markeerOpgelost() {
    if (!detailOpen) return
    await supabase.from('bug_meldingen').update({ status: 'opgelost' }).eq('id', detailOpen.id)
    setMeldingen(m => m.map(x => x.id === detailOpen.id ? { ...x, status: 'opgelost' } : x))
    setDetailStatus('opgelost')
    setDetailOpen(prev => ({ ...prev, status: 'opgelost' }))
  }

  function sluitNieuw() {
    setNieuwOpen(false)
    setNieuwOnderdeel('')
    setNieuwBeschrijving('')
    setNieuwErnst('medium')
    setNieuwKlantNaam('')
  }

  async function maakNieuwe() {
    if (!nieuwOnderdeel.trim()) return
    setOpslaan(true)
    const { data } = await supabase.from('bug_meldingen').insert({
      project_id:  project.id,
      onderdeel:   nieuwOnderdeel.trim(),
      beschrijving:nieuwBeschrijving.trim() || null,
      ernst:       nieuwErnst,
      klant_naam:  nieuwKlantNaam.trim() || null,
      status:      'nieuw',
    }).select().single()
    setOpslaan(false)
    if (data) setMeldingen(m => [data, ...m])
    sluitNieuw()
  }

  const gefilterd = filter === 'alle'
    ? meldingen
    : meldingen.filter(m => m.status === filter)

  const aantalNieuw         = meldingen.filter(m => m.status === 'nieuw').length
  const aantalInBehandeling = meldingen.filter(m => m.status === 'in_behandeling').length
  const aantalOpgelost      = meldingen.filter(m => m.status === 'opgelost').length

  if (laden) return <Spinner />

  return (
    <div className="p-6 space-y-5">

      {/* ── Statistieken ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Openstaand',      aantal: aantalNieuw,         kleur: '#d97706', bg: '#fef3c7' },
          { label: 'In behandeling',  aantal: aantalInBehandeling, kleur: '#2563eb', bg: '#dbeafe' },
          { label: 'Opgelost',        aantal: aantalOpgelost,      kleur: '#16a34a', bg: '#dcfce7' },
        ].map(({ label, aantal, kleur, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
            <p className="text-xs text-gray-500 font-medium">{label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: kleur }}>{aantal}</p>
          </div>
        ))}
      </div>

      {/* ── Filter + knop ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1">
          {FILTER_TABS.map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={filter === t.key
                ? { background: '#185FA5', color: '#fff' }
                : { background: '#f3f4f6', color: '#6b7280' }}>
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setNieuwOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-xs font-semibold transition-opacity hover:opacity-85"
          style={{ background: '#185FA5' }}
        >
          <Plus size={13} /> Nieuwe melding
        </button>
      </div>

      {/* ── Lijst ────────────────────────────────────────────────────────── */}
      {gefilterd.length === 0 ? (
        <div className="bg-gray-50 rounded-xl border border-dashed border-gray-200 py-10 flex flex-col items-center gap-3 text-gray-400">
          <Bug size={28} strokeWidth={1.25} />
          <p className="text-sm">
            {filter === 'alle' ? 'Geen meldingen voor dit project.' : `Geen meldingen met status "${FILTER_TABS.find(t => t.key === filter)?.label}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {gefilterd.map(m => {
            const sc = MELDING_STATUS_KLEUREN[m.status] ?? MELDING_STATUS_KLEUREN.nieuw
            const ec = ERNST_CFG[m.ernst] ?? ERNST_CFG.medium
            return (
              <div key={m.id}
                className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3 hover:border-gray-300 transition-colors cursor-pointer"
                onClick={() => openDetail(m)}
              >
                <AlertTriangle size={14} className="flex-shrink-0" style={{ color: ec.kleur }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {m.onderdeel || '(geen onderwerp)'}
                  </p>
                  {m.beschrijving && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{m.beschrijving}</p>
                  )}
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: ec.bg, color: ec.kleur }}>
                  {ec.label}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: sc.bg, color: sc.kleur }}>
                  {MELDING_STATUSSEN.find(s => s.key === m.status)?.label ?? m.status}
                </span>
                <span className="text-xs text-gray-400 flex-shrink-0">{formatDatum(m.aangemaakt_op)}</span>
                <span className="text-xs text-gray-400 border border-gray-200 rounded-lg px-2 py-1 flex-shrink-0 hover:bg-gray-50">
                  Bekijk
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Detail modal ─────────────────────────────────────────────────── */}
      {detailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={e => e.target === e.currentTarget && setDetailOpen(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col">

            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h4 className="text-sm font-bold text-gray-800 truncate pr-4">
                {detailOpen.onderdeel || '(geen onderwerp)'}
              </h4>
              <button onClick={() => setDetailOpen(null)}
                className="p-1 rounded hover:bg-gray-100 text-gray-400 flex-shrink-0">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Info */}
              {detailOpen.klant_naam && (
                <div className="text-xs text-gray-500">
                  Ingediend door: <span className="font-medium text-gray-700">{detailOpen.klant_naam}</span>
                  {detailOpen.klant_email && <span className="text-gray-400"> ({detailOpen.klant_email})</span>}
                </div>
              )}
              <p className="text-xs text-gray-400">Datum: {formatDatum(detailOpen.aangemaakt_op)}</p>

              {detailOpen.beschrijving && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Beschrijving</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed">
                    {detailOpen.beschrijving}
                  </p>
                </div>
              )}

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Status</label>
                <div className="relative inline-block">
                  <select
                    value={detailStatus}
                    onChange={e => setDetailStatus(e.target.value)}
                    className="appearance-none text-xs font-semibold pl-3 pr-7 py-2 rounded-lg border focus:outline-none cursor-pointer"
                    style={{
                      background: MELDING_STATUS_KLEUREN[detailStatus]?.bg ?? '#f1f5f9',
                      color:      MELDING_STATUS_KLEUREN[detailStatus]?.kleur ?? '#64748b',
                      borderColor: MELDING_STATUS_KLEUREN[detailStatus]?.bg ?? '#f1f5f9',
                    }}
                  >
                    {MELDING_STATUSSEN.map(s => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={10} className="absolute right-2 top-2.5 pointer-events-none text-gray-500" />
                </div>
              </div>

              {/* Prioriteit */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Prioriteit</label>
                <div className="flex gap-2">
                  {Object.entries(ERNST_CFG).map(([key, cfg]) => (
                    <button key={key} onClick={() => setDetailErnst(key)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all"
                      style={detailErnst === key
                        ? { background: cfg.bg, color: cfg.kleur, borderColor: cfg.kleur }
                        : { background: 'white', color: '#9ca3af', borderColor: '#e5e7eb' }}>
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notitie developer */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Notitie voor developer</label>
                <textarea
                  value={detailNotitie}
                  onChange={e => setDetailNotitie(e.target.value)}
                  rows={3}
                  placeholder="Interne notities, oplossing, referenties…"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 resize-none leading-relaxed"
                />
              </div>

              {/* Knoppen */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={slaDetailOp}
                  disabled={detailOpslaan}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-60 transition-all"
                  style={{ background: detailBewaard ? '#16a34a' : '#185FA5' }}
                >
                  {detailBewaard ? <><CheckCircle size={12} /> Opgeslagen</> : detailOpslaan ? 'Opslaan...' : 'Opslaan'}
                </button>
                {detailOpen.status !== 'opgelost' && (
                  <button
                    onClick={markeerOpgelost}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold border-2 transition-all"
                    style={{ borderColor: '#16a34a', color: '#16a34a' }}
                  >
                    <CheckCircle size={12} /> Markeer als opgelost
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Nieuw melding modal ───────────────────────────────────────────── */}
      {nieuwOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={e => e.target === e.currentTarget && sluitNieuw()}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h4 className="text-sm font-bold text-gray-800">Nieuwe melding</h4>
              <button onClick={sluitNieuw} className="p-1 rounded hover:bg-gray-100 text-gray-400">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Onderwerp / onderdeel <span className="text-red-400">*</span>
                </label>
                <input
                  value={nieuwOnderdeel}
                  onChange={e => setNieuwOnderdeel(e.target.value)}
                  placeholder="Bv. Login pagina, Dashboard, Formulier…"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Beschrijving</label>
                <textarea
                  value={nieuwBeschrijving}
                  onChange={e => setNieuwBeschrijving(e.target.value)}
                  rows={3}
                  placeholder="Wat is het probleem of de verbetering?"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Prioriteit</label>
                <div className="flex gap-2">
                  {Object.entries(ERNST_CFG).map(([key, cfg]) => (
                    <button key={key} onClick={() => setNieuwErnst(key)}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold border-2 transition-all"
                      style={nieuwErnst === key
                        ? { background: cfg.bg, color: cfg.kleur, borderColor: cfg.kleur }
                        : { background: 'white', color: '#9ca3af', borderColor: '#e5e7eb' }}>
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Klant naam (optioneel)</label>
                <input
                  value={nieuwKlantNaam}
                  onChange={e => setNieuwKlantNaam(e.target.value)}
                  placeholder="Naam van de klant die de melding maakt"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400"
                />
              </div>

              <button
                onClick={maakNieuwe}
                disabled={!nieuwOnderdeel.trim() || opslaan}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-opacity hover:opacity-90"
                style={{ background: '#185FA5' }}
              >
                {opslaan ? 'Opslaan...' : 'Melding opslaan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
