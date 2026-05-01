// BoilerplatesTab.jsx — Gedeelde component voor Boilerplates tabblad
// Gebruikt in: Studio.jsx en ProjectDetail.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import {
  Plus, Trash2, ChevronDown, ChevronRight, ChevronLeft,
  Zap, Save, X, Search, FileCode, Copy, CheckCircle,
  Package, Code2, Layers, Wrench, Settings2,
} from 'lucide-react'

const TYPE_ICOON = { component: Code2, configurator: Layers, scaffold: Package, service: Wrench }
const TYPE_KLEUR = {
  component:    { bg: '#dbeafe', tekst: '#1d4ed8' },
  configurator: { bg: '#ede9fe', tekst: '#6d28d9' },
  scaffold:     { bg: '#dcfce7', tekst: '#15803d' },
  service:      { bg: '#f3f4f6', tekst: '#374151' },
}
const STATUS_CFG_BP = {
  geselecteerd: { bg: '#f3f4f6', tekst: '#374151' },
  ingebouwd:    { bg: '#dbeafe', tekst: '#1d4ed8' },
  aangepast:    { bg: '#dcfce7', tekst: '#15803d' },
}
const STATUS_OPTIES = ['geselecteerd', 'ingebouwd', 'aangepast']
const MODAL_FILTER_TABS = [
  { key: 'alle',          label: 'Alle' },
  { key: 'component',     label: 'Component' },
  { key: 'configurator',  label: 'Configurator' },
  { key: 'scaffold',      label: 'Scaffold' },
  { key: 'service',       label: 'Service' },
]

function formatDatum(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function BoilerplatesTab({ project }) {
  const projectId   = project?.id
  const projectNaam = project?.naam

  const [gekoppeld,    setGekoppeld]    = useState([])
  const [bibliotheek,  setBibliotheek]  = useState([])
  const [laden,        setLaden]        = useState(true)
  const [opslaanId,    setOpslaanId]    = useState(null)
  const [uitgebreid,   setUitgebreid]   = useState({})
  const [gekopieerd,   setGekopieerd]   = useState({})

  const [modalOpen,           setModalOpen]           = useState(false)
  const [modalStap,           setModalStap]           = useState('selecteer')
  const [modalGeselecteerd,   setModalGeselecteerd]   = useState(null)
  const [modalAanpassingen,   setModalAanpassingen]   = useState('')
  const [modalPrompt,         setModalPrompt]         = useState('')
  const [modalOpslaan,        setModalOpslaan]        = useState(false)
  const [modalZoek,           setModalZoek]           = useState('')
  const [modalFilter,         setModalFilter]         = useState('alle')

  const [claudeMd,        setClaudeMd]        = useState('')
  const [claudeGekopieerd, setClaudeGekopieerd] = useState(false)

  useEffect(() => {
    if (!projectId) return
    laad()
  }, [projectId])

  async function laad() {
    setLaden(true)
    const [{ data: pb }, { data: bib }] = await Promise.all([
      supabase.from('project_boilerplates')
        .select('*, boilerplates(*)')
        .eq('project_id', projectId)
        .order('aangemaakt_op'),
      supabase.from('boilerplates')
        .select('*').eq('actief', true).order('naam'),
    ])
    setGekoppeld(pb ?? [])
    setBibliotheek(bib ?? [])
    setLaden(false)
  }

  function updateKoppeling(id, veld, waarde) {
    setGekoppeld(prev => prev.map(k => k.id === id ? { ...k, [veld]: waarde } : k))
  }

  async function slaOpKoppeling(koppeling) {
    setOpslaanId(koppeling.id)
    await supabase.from('project_boilerplates').update({
      aanpassingen_json:  koppeling.aanpassingen_json,
      gegenereerde_prompt: koppeling.gegenereerde_prompt,
      status:             koppeling.status,
      notities:           koppeling.notities,
    }).eq('id', koppeling.id)
    setOpslaanId(null)
  }

  async function verwijderKoppeling(id) {
    await supabase.from('project_boilerplates').delete().eq('id', id)
    setGekoppeld(prev => prev.filter(k => k.id !== id))
  }

  function genereerPromptVoorKoppeling(koppeling) {
    const template = koppeling.boilerplates?.aanpassingsprompt_template ?? ''
    const aanpassingen = koppeling.aanpassingen_json?.tekst ?? ''
    const prompt = template
      .replace(/\[KLANT_NAAM\]/g, projectNaam ?? 'klant')
      .replace(/\[AANPASSINGEN\]/g, aanpassingen || '(geen specifieke aanpassingen)')
    const bijgewerkt = { ...koppeling, gegenereerde_prompt: prompt }
    updateKoppeling(koppeling.id, 'gegenereerde_prompt', prompt)
    slaOpKoppeling(bijgewerkt)
    setUitgebreid(prev => ({ ...prev, [koppeling.id]: true }))
  }

  async function kopieerTekst(sleutel, tekst, setter) {
    await navigator.clipboard.writeText(tekst)
    setter(prev => ({ ...prev, [sleutel]: true }))
    setTimeout(() => setter(prev => ({ ...prev, [sleutel]: false })), 2000)
  }

  function openModal() {
    setModalStap('selecteer')
    setModalGeselecteerd(null)
    setModalAanpassingen('')
    setModalPrompt('')
    setModalZoek('')
    setModalFilter('alle')
    setModalOpen(true)
  }

  function selecteerInModal(b) {
    setModalGeselecteerd(b)
    setModalAanpassingen('')
    setModalPrompt('')
    setModalStap('aanpassen')
  }

  function genereerModalPrompt() {
    const template = modalGeselecteerd?.aanpassingsprompt_template ?? ''
    const prompt = template
      .replace(/\[KLANT_NAAM\]/g, projectNaam ?? 'klant')
      .replace(/\[AANPASSINGEN\]/g, modalAanpassingen.trim() || '(geen specifieke aanpassingen)')
    setModalPrompt(prompt)
  }

  async function slaModalOp() {
    if (!modalGeselecteerd) return
    setModalOpslaan(true)
    const { data } = await supabase.from('project_boilerplates')
      .insert({
        project_id:          projectId,
        boilerplate_id:      modalGeselecteerd.id,
        aanpassingen_json:   { tekst: modalAanpassingen },
        gegenereerde_prompt: modalPrompt,
        status:              'geselecteerd',
      })
      .select('*, boilerplates(*)')
      .single()
    setModalOpslaan(false)
    if (data) setGekoppeld(prev => [...prev, data])
    setModalOpen(false)
  }

  function genereerClaudeMd() {
    const ingebouwde = gekoppeld.filter(k => k.status === 'ingebouwd')
    if (ingebouwde.length === 0) {
      setClaudeMd('// Geen boilerplates met status "ingebouwd" gevonden voor dit project.')
      return
    }
    const secties = ingebouwde.map(k => {
      const b = k.boilerplates ?? {}
      const aanp = k.aanpassingen_json?.tekst?.trim() || 'Geen aanpassingen genoteerd'
      return [
        `### ${b.naam ?? 'Onbekend'} (v${b.versie ?? '1.0'})`,
        b.beschrijving ?? '',
        b.bestand_pad ? `Pad: \`${b.bestand_pad}\`` : '',
        `Status: ${k.status}`,
        `Aanpassingen: ${aanp}`,
        'NOOIT opnieuw genereren — gebruik patch-prompts.',
      ].filter(Boolean).join('\n')
    }).join('\n\n')
    setClaudeMd(`## Boilerplates aanwezig in dit project\n\n${secties}`)
  }

  const reeds = new Set(gekoppeld.map(k => k.boilerplate_id))
  const modalZoekveld = modalZoek.toLowerCase()
  const modalGefilterd = bibliotheek.filter(b => {
    const matchType = modalFilter === 'alle' || b.type === modalFilter
    const matchZoek = !modalZoek ||
      b.naam?.toLowerCase().includes(modalZoekveld) ||
      b.beschrijving?.toLowerCase().includes(modalZoekveld)
    return matchType && matchZoek
  })

  if (laden) return (
    <div className="flex justify-center py-12">
      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#78C833', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="p-6 space-y-6">

      {/* ── Sectie 1: Gekoppelde boilerplates ────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-gray-700">Gekoppelde boilerplates</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {gekoppeld.length} boilerplate{gekoppeld.length !== 1 ? 's' : ''} aan dit project gekoppeld
            </p>
          </div>
          <button
            onClick={openModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-xs font-semibold transition-opacity hover:opacity-85"
            style={{ background: '#78C833' }}
          >
            <Plus size={13} /> Boilerplate toevoegen
          </button>
        </div>

        {/* Adres Configurator snelkoppeling */}
        {gekoppeld.some(k => k.boilerplates?.naam === 'Adres & Contact Configurator') && (
          <Link
            to={`/projecten/${projectId}/adres-configurator`}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all hover:shadow-md mb-3"
            style={{ borderColor: '#78C833', background: '#f0fdf4' }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: '#78C83320' }}>
              <Settings2 size={15} style={{ color: '#78C833' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">Open Adres Configurator</p>
              <p className="text-xs text-gray-500">Configureer velden, autofill en modules — genereer de Claude Code prompt</p>
            </div>
            <ChevronRight size={15} className="text-gray-400 flex-shrink-0" />
          </Link>
        )}

        {/* Lege staat */}
        {gekoppeld.length === 0 && (
          <div className="bg-gray-50 rounded-xl border border-dashed border-gray-200 py-10 flex flex-col items-center gap-3 text-gray-400">
            <Package size={30} strokeWidth={1.25} />
            <p className="text-sm">Nog geen boilerplates gekoppeld aan dit project.</p>
          </div>
        )}

        {/* Kaarten */}
        <div className="space-y-3">
          {gekoppeld.map(k => {
            const b = k.boilerplates ?? {}
            const Icon = TYPE_ICOON[b.type] ?? Package
            const typeKleur = TYPE_KLEUR[b.type] ?? { bg: '#f3f4f6', tekst: '#374151' }
            const statusKleur = STATUS_CFG_BP[k.status] ?? STATUS_CFG_BP.geselecteerd
            const prompt = k.gegenereerde_prompt ?? ''
            const isUitgebreid = uitgebreid[k.id] ?? false

            return (
              <div key={k.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: '#78C83315' }}>
                    <Icon size={14} style={{ color: '#78C833' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-800">{b.naam}</span>
                      {b.type && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: typeKleur.bg, color: typeKleur.tekst }}>
                          {b.type}
                        </span>
                      )}
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: statusKleur.bg, color: statusKleur.tekst }}>
                        {k.status ?? 'geselecteerd'}
                      </span>
                      <span className="text-xs text-gray-300">v{b.versie}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Gekoppeld op {formatDatum(k.aangemaakt_op)}
                    </p>
                  </div>
                  <select
                    value={k.status ?? 'geselecteerd'}
                    onChange={e => {
                      const bijgewerkt = { ...k, status: e.target.value }
                      updateKoppeling(k.id, 'status', e.target.value)
                      slaOpKoppeling(bijgewerkt)
                    }}
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white text-gray-700 focus:outline-none flex-shrink-0"
                  >
                    {STATUS_OPTIES.map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => verwijderKoppeling(k.id)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                    title="Verwijder koppeling"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Notities voor developer</label>
                    <input
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 bg-white"
                      placeholder="Interne notities, referenties, beslissingen…"
                      value={k.notities ?? ''}
                      onChange={e => updateKoppeling(k.id, 'notities', e.target.value)}
                      onBlur={() => slaOpKoppeling(k)}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    {b.aanpassingsprompt_template && (
                      <button
                        onClick={() => genereerPromptVoorKoppeling(k)}
                        className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-semibold text-white"
                        style={{ background: '#78C833' }}
                      >
                        <Zap size={11} /> Genereer prompt
                      </button>
                    )}
                    {prompt && (
                      <button
                        onClick={() => setUitgebreid(prev => ({ ...prev, [k.id]: !isUitgebreid }))}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                      >
                        {isUitgebreid ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                        {isUitgebreid ? 'Verberg prompt' : 'Toon prompt'}
                      </button>
                    )}
                    {prompt && (
                      <button
                        onClick={() => kopieerTekst(k.id, prompt, setGekopieerd)}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-all"
                        style={{
                          background: gekopieerd[k.id] ? '#dcfce7' : '#f3f4f6',
                          color:      gekopieerd[k.id] ? '#15803d' : '#6b7280',
                        }}
                      >
                        {gekopieerd[k.id] ? <CheckCircle size={11} /> : <Copy size={11} />}
                        {gekopieerd[k.id] ? 'Gekopieerd' : 'Kopieer prompt'}
                      </button>
                    )}
                  </div>

                  {isUitgebreid && prompt && (
                    <textarea
                      readOnly
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-xs bg-gray-50 font-mono resize-none text-gray-700 focus:outline-none leading-relaxed"
                      rows={8}
                      value={prompt}
                      onClick={e => e.target.select()}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Sectie 2: CLAUDE.md generator ────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
              <FileCode size={14} className="text-gray-400" />
              CLAUDE.md boilerplate-sectie
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Genereert de tekst voor in <code className="bg-gray-100 px-1 rounded">CLAUDE.md</code> op basis van ingebouwde boilerplates.
            </p>
          </div>
          <button
            onClick={genereerClaudeMd}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-xs font-semibold transition-opacity hover:opacity-85"
            style={{ background: '#374151' }}
          >
            <FileCode size={13} /> Genereer CLAUDE.md sectie
          </button>
        </div>

        {claudeMd && (
          <div className="space-y-2">
            <textarea
              readOnly
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-xs bg-gray-50 font-mono resize-none text-gray-700 focus:outline-none leading-relaxed"
              rows={Math.min(20, claudeMd.split('\n').length + 2)}
              value={claudeMd}
              onClick={e => e.target.select()}
            />
            <div className="flex justify-end">
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(claudeMd)
                  setClaudeGekopieerd(true)
                  setTimeout(() => setClaudeGekopieerd(false), 2000)
                }}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all font-medium"
                style={{
                  background: claudeGekopieerd ? '#dcfce7' : '#f3f4f6',
                  color:      claudeGekopieerd ? '#15803d' : '#6b7280',
                }}
              >
                {claudeGekopieerd ? <CheckCircle size={12} /> : <Copy size={12} />}
                {claudeGekopieerd ? 'Gekopieerd!' : 'Kopieer naar klembord'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal: boilerplate toevoegen ──────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">

            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                {modalStap === 'aanpassen' && (
                  <button onClick={() => setModalStap('selecteer')}
                    className="p-1 rounded hover:bg-gray-100 text-gray-400 mr-1">
                    <ChevronLeft size={16} />
                  </button>
                )}
                <h4 className="text-sm font-bold text-gray-800">
                  {modalStap === 'selecteer' ? 'Boilerplate selecteren' : `Aanpassen: ${modalGeselecteerd?.naam}`}
                </h4>
              </div>
              <button onClick={() => setModalOpen(false)}
                className="p-1 rounded hover:bg-gray-100 text-gray-400">
                <X size={16} />
              </button>
            </div>

            {modalStap === 'selecteer' && (
              <>
                <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0 space-y-2">
                  <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
                    <Search size={13} className="text-gray-400 flex-shrink-0" />
                    <input
                      value={modalZoek}
                      onChange={e => setModalZoek(e.target.value)}
                      placeholder="Zoeken…"
                      className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400"
                    />
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {MODAL_FILTER_TABS.map(t => (
                      <button key={t.key} onClick={() => setModalFilter(t.key)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                        style={modalFilter === t.key
                          ? { background: '#78C833', color: '#fff' }
                          : { background: '#f3f4f6', color: '#6b7280' }}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="overflow-y-auto flex-1 p-3 space-y-2">
                  {modalGefilterd.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-8">Geen resultaten.</p>
                  )}
                  {modalGefilterd.map(b => {
                    const Icon = TYPE_ICOON[b.type] ?? Package
                    const typeKleur = TYPE_KLEUR[b.type] ?? { bg: '#f3f4f6', tekst: '#374151' }
                    const al = reeds.has(b.id)
                    const tags = b.tags_json ?? []
                    return (
                      <button
                        key={b.id}
                        onClick={() => !al && selecteerInModal(b)}
                        disabled={al}
                        className="w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all"
                        style={{
                          borderColor: '#e5e7eb',
                          opacity: al ? 0.45 : 1,
                          cursor: al ? 'not-allowed' : 'pointer',
                        }}
                        onMouseEnter={e => { if (!al) e.currentTarget.style.borderColor = '#78C833' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb' }}
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: '#78C83315' }}>
                          <Icon size={14} style={{ color: '#78C833' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-gray-800">{b.naam}</span>
                            <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                              style={{ background: typeKleur.bg, color: typeKleur.tekst }}>
                              {b.type}
                            </span>
                            <span className="text-xs text-gray-300">v{b.versie}</span>
                            {al && <span className="text-xs text-gray-400 italic">Al gekoppeld</span>}
                          </div>
                          {b.beschrijving && (
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{b.beschrijving}</p>
                          )}
                          {tags.length > 0 && (
                            <div className="flex gap-1 mt-1.5 flex-wrap">
                              {tags.slice(0, 4).map((t, i) => (
                                <span key={i} className="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            {modalStap === 'aanpassen' && modalGeselecteerd && (
              <div className="overflow-y-auto flex-1 p-5 space-y-4">
                <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 space-y-1">
                  {modalGeselecteerd.beschrijving && <p>{modalGeselecteerd.beschrijving}</p>}
                  {(modalGeselecteerd.afhankelijkheden_json ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {modalGeselecteerd.afhankelijkheden_json.map((a, i) => (
                        <span key={i} className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono">{a}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    Aanpassingen voor dit project
                  </label>
                  <textarea
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 bg-white resize-none leading-relaxed"
                    rows={4}
                    value={modalAanpassingen}
                    onChange={e => setModalAanpassingen(e.target.value)}
                    placeholder="Bv. Verwijder IBAN-veld, voeg KBO-nummer toe, kleur #CC0000…"
                  />
                </div>

                {modalGeselecteerd.aanpassingsprompt_template && (
                  <button
                    onClick={genereerModalPrompt}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-white text-sm font-semibold"
                    style={{ background: '#78C833' }}
                  >
                    <Zap size={14} /> Genereer aanpassingsprompt
                  </button>
                )}

                {modalPrompt && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Gegenereerde prompt</label>
                    <textarea
                      readOnly
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-xs bg-gray-50 font-mono resize-none text-gray-700 focus:outline-none leading-relaxed"
                      rows={7}
                      value={modalPrompt}
                      onClick={e => e.target.select()}
                    />
                  </div>
                )}

                <button
                  onClick={slaModalOp}
                  disabled={modalOpslaan}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-60"
                  style={{ background: '#185FA5' }}
                >
                  <Save size={14} />
                  {modalOpslaan ? 'Bezig…' : 'Opslaan bij project'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
