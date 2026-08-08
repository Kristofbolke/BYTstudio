// src/pages/Boilerplates.jsx — Boilerplate bibliotheek met twee-kolom layout
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  Search, ExternalLink, Tag, Package, Code2, Layers, Wrench,
  CheckCircle, Copy, Save, ChevronDown, X, Zap, Plus, Clock, Euro,
  ArrowUpCircle, Pencil, Check,
} from 'lucide-react'

const BYT_GREEN = '#22C35D'

const TYPE_CFG = {
  component:    { label: 'Component',    bg: '#dbeafe', tekst: '#1d4ed8' },
  configurator: { label: 'Configurator', bg: '#ede9fe', tekst: '#6d28d9' },
  scaffold:     { label: 'Scaffold',     bg: '#dcfce7', tekst: '#15803d' },
  service:      { label: 'Service',      bg: '#f3f4f6', tekst: '#374151' },
}

const STATUS_GEPLAND_KLEUR = { bg: '#fef3c7', tekst: '#92400e' }

const FILTER_TABS = [
  { key: 'alle', label: 'Alle' },
  { key: 'gepland',      label: 'Gepland' },
  { key: 'component',    label: 'Component' },
  { key: 'configurator', label: 'Configurator' },
  { key: 'scaffold',     label: 'Scaffold' },
  { key: 'service',      label: 'Service' },
]

function fmt(n) {
  return Number(n).toLocaleString('nl-BE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function TypeBadge({ b }) {
  if (b.status === 'gepland') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0"
        style={{ background: STATUS_GEPLAND_KLEUR.bg, color: STATUS_GEPLAND_KLEUR.tekst }}>
        Gepland
      </span>
    )
  }
  const cfg = TYPE_CFG[b.type] ?? { label: b.type ?? '?', bg: '#f3f4f6', tekst: '#374151' }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0"
      style={{ background: cfg.bg, color: cfg.tekst }}>
      {cfg.label}
    </span>
  )
}

function TypeIcoon({ type, size = 15 }) {
  const props = { size, style: { color: BYT_GREEN } }
  if (type === 'component')    return <Code2   {...props} />
  if (type === 'configurator') return <Layers  {...props} />
  if (type === 'scaffold')     return <Package {...props} />
  if (type === 'service')      return <Wrench  {...props} />
  return <Package {...props} />
}

// ── Linker kolom: boilerplate kaart ──────────────────────────────────────────
function BoilerplateKaart({ b, actief, uurtarief, onSelecteer }) {
  const tags = b.tags_json ?? []
  const gepland = b.status === 'gepland'
  return (
    <div
      className="bg-white rounded-xl border transition-all cursor-pointer"
      style={{
        borderColor: actief ? BYT_GREEN : '#e5e7eb',
        boxShadow: actief ? `0 0 0 2px ${BYT_GREEN}30` : '0 1px 3px rgba(0,0,0,0.06)',
      }}
      onClick={() => onSelecteer(b)}
    >
      <div className="p-4">
        {/* Naam + badges */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-sm font-semibold text-gray-800 leading-tight">{b.naam}</span>
            {!gepland && <span className="text-xs text-gray-300 flex-shrink-0">v{b.versie ?? '1.0'}</span>}
          </div>
          <TypeBadge b={b} />
        </div>

        {/* Beschrijving */}
        {b.beschrijving && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{b.beschrijving}</p>
        )}

        {/* Bouwtijd/prijs (enkel gepland) */}
        {gepland && b.geschatte_bouwtijd != null && (
          <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
            <span className="flex items-center gap-1">
              <Clock size={11} /> <strong className="text-gray-600">{b.geschatte_bouwtijd}u</strong>
            </span>
            <span className="flex items-center gap-1">
              <Euro size={11} /> <strong className="text-gray-600">€ {fmt(b.geschatte_bouwtijd * uurtarief)}</strong>
              <span className="text-gray-300">(à €{uurtarief}/u)</span>
            </span>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.slice(0, 5).map((t, i) => (
              <span key={i} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                {t}
              </span>
            ))}
            {tags.length > 5 && (
              <span className="text-xs text-gray-300">+{tags.length - 5}</span>
            )}
          </div>
        )}

        {/* Acties */}
        <div className="flex items-center gap-2">
          <button
            onClick={e => { e.stopPropagation(); onSelecteer(b) }}
            className="flex-1 text-xs font-semibold py-1.5 px-3 rounded-lg text-white transition-opacity hover:opacity-85"
            style={{ background: BYT_GREEN }}
          >
            {gepland ? 'Bekijk & genereer prompt' : 'Gebruik in project'}
          </button>
          {b.github_url && (
            <a
              href={b.github_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors px-2 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              <ExternalLink size={12} /> GitHub
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Rechter kolom: detail paneel ──────────────────────────────────────────────
function DetailPaneel({ boilerplate, projecten, uurtarief, onOpgeslagen, onStatusGewijzigd }) {
  const gepland = boilerplate.status === 'gepland'

  const [projectId, setProjectId] = useState('')
  const [aanpassingen, setAanpassingen] = useState('')
  const [gegenereerdePrompt, setGegenereerdePrompt] = useState('')
  const [huisstijl, setHuisstijl] = useState(null)
  const [opslaan, setOpslaan] = useState(false)
  const [toggleBezig, setToggleBezig] = useState(false)
  const [statusBezig, setStatusBezig] = useState(false)
  const [statusBevestig, setStatusBevestig] = useState(false)
  const [gekopieerd, setGekopieerd] = useState(false)
  const [ok, setOk] = useState('')
  const [fout, setFout] = useState('')

  // Reset bij nieuwe selectie
  useEffect(() => {
    setProjectId('')
    setAanpassingen('')
    setGegenereerdePrompt('')
    setHuisstijl(null)
    setStatusBevestig(false)
    setOk('')
    setFout('')
  }, [boilerplate.id])

  const geselecteerdProject = projecten.find(p => p.id === projectId)
  const modulesVanProject = geselecteerdProject?.features_json?.modules ?? []
  const alGekoppeld = gepland && boilerplate.sleutel && modulesVanProject.includes(boilerplate.sleutel)

  // Haal huisstijl op zodra een project gekozen wordt (enkel nodig voor gepland-prompt)
  useEffect(() => {
    if (!gepland || !projectId) { setHuisstijl(null); return }
    supabase.from('huisstijlen').select('*').eq('project_id', projectId).maybeSingle()
      .then(({ data }) => setHuisstijl(data ?? null))
  }, [projectId, gepland])

  function genereerPrompt() {
    if (!projectId) { setFout('Selecteer eerst een project.'); return }
    if (gepland) {
      const huisstijlExtra = huisstijl
        ? `\nHUISSTIJL:\n- Primaire kleur: ${huisstijl.primaire_kleur ?? '—'}\n- Font: ${huisstijl.font_titel ?? '—'}`
        : ''
      const prompt = `MODULE: ${boilerplate.naam}\nPROJECT: ${geselecteerdProject?.naam ?? '—'}${huisstijlExtra}\n\n${boilerplate.aanpassingsprompt_template ?? ''}`
      setGegenereerdePrompt(prompt)
      setFout('')
      return
    }
    const template = boilerplate.aanpassingsprompt_template ?? ''
    if (!template) { setFout('Deze boilerplate heeft geen prompt template.'); return }
    const klantNaam = geselecteerdProject
      ? geselecteerdProject.klanten?.bedrijfsnaam || geselecteerdProject.klanten?.naam || geselecteerdProject.naam
      : 'klant'
    const prompt = template
      .replace(/\[KLANT_NAAM\]/g, klantNaam)
      .replace(/\[AANPASSINGEN\]/g, aanpassingen.trim() || '(geen specifieke aanpassingen)')
    setGegenereerdePrompt(prompt)
    setFout('')
  }

  async function slaOp() {
    if (!projectId) { setFout('Selecteer eerst een project.'); return }
    if (!gegenereerdePrompt) { setFout('Genereer eerst de prompt.'); return }
    setOpslaan(true); setFout(''); setOk('')
    const { error } = await supabase.from('project_boilerplates').insert({
      project_id: projectId,
      boilerplate_id: boilerplate.id,
      aanpassingen_json: { tekst: aanpassingen },
      gegenereerde_prompt: gegenereerdePrompt,
      status: 'geselecteerd',
    })
    setOpslaan(false)
    if (error) { setFout('Opslaan mislukt: ' + error.message); return }
    setOk('Opgeslagen bij project!')
    onOpgeslagen?.()
    setTimeout(() => setOk(''), 4000)
  }

  // ── Gepland: module-key toggelen in projecten.features_json.modules ────────
  async function toggleInProject() {
    if (!projectId) { setFout('Selecteer eerst een project.'); return }
    if (!boilerplate.sleutel) { setFout('Deze rij heeft geen sleutel — kan niet gekoppeld worden.'); return }
    setToggleBezig(true); setFout(''); setOk('')
    const { data } = await supabase.from('projecten').select('features_json').eq('id', projectId).single()
    const huidig = data?.features_json ?? {}
    const modules = new Set(huidig.modules ?? [])
    if (modules.has(boilerplate.sleutel)) modules.delete(boilerplate.sleutel)
    else modules.add(boilerplate.sleutel)
    const { error } = await supabase.from('projecten')
      .update({ features_json: { ...huidig, modules: [...modules] } })
      .eq('id', projectId)
    setToggleBezig(false)
    if (error) { setFout('Opslaan mislukt: ' + error.message); return }
    setOk(modules.has(boilerplate.sleutel) ? 'Toegevoegd aan project!' : 'Verwijderd uit project.')
    await onOpgeslagen?.()
    setTimeout(() => setOk(''), 3000)
  }

  // ── Manuele status-overgang: gepland → boilerplate ──────────────────────────
  async function zetOmNaarBoilerplate() {
    setStatusBezig(true); setFout('')
    const { error } = await supabase.from('boilerplates')
      .update({ status: 'boilerplate', bijgewerkt_op: new Date().toISOString() })
      .eq('id', boilerplate.id)
    setStatusBezig(false)
    if (error) { setFout('Status wijzigen mislukt: ' + error.message); return }
    setStatusBevestig(false)
    onStatusGewijzigd?.(boilerplate.id)
  }

  async function kopieer() {
    await navigator.clipboard.writeText(gegenereerdePrompt)
    setGekopieerd(true)
    setTimeout(() => setGekopieerd(false), 2000)
  }

  const tags = boilerplate.tags_json ?? []
  const afh = boilerplate.afhankelijkheden_json ?? []

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-fit sticky top-6">

      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: `${BYT_GREEN}15` }}>
            <TypeIcoon type={boilerplate.type} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-gray-800">{boilerplate.naam}</h2>
              <TypeBadge b={boilerplate} />
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
              {!gepland && <span>v{boilerplate.versie ?? '1.0'}</span>}
              {boilerplate.categorie && <span>{!gepland && '· '}{boilerplate.categorie}</span>}
              {gepland && boilerplate.geschatte_bouwtijd != null && (
                <span>· {boilerplate.geschatte_bouwtijd}u · € {fmt(boilerplate.geschatte_bouwtijd * uurtarief)}</span>
              )}
            </div>
          </div>
          <Link
            to={`/boilerplates/${boilerplate.id}`}
            title="Bewerk details"
            className="p-1.5 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0"
          >
            <Pencil size={13} />
          </Link>
        </div>
        {boilerplate.beschrijving && (
          <p className="text-xs text-gray-500 mt-3 leading-relaxed">{boilerplate.beschrijving}</p>
        )}
      </div>

      <div className="px-5 py-4 space-y-5">

        {/* Tags */}
        {tags.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
              <Tag size={11} /> Tags
            </p>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t, i) => (
                <span key={i} className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* Afhankelijkheden */}
        {afh.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Afhankelijkheden</p>
            <div className="flex flex-wrap gap-1.5">
              {afh.map((a, i) => (
                <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-mono">{a}</span>
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        <div style={{ height: 1, background: '#f0f0f0' }} />

        {/* Project selector */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">
            {gepland ? 'Project' : 'Koppel aan project'}
          </label>
          <div className="relative">
            <select
              value={projectId}
              onChange={e => { setProjectId(e.target.value); setOk(''); setFout(''); setGegenereerdePrompt('') }}
              className="w-full appearance-none border border-gray-200 rounded-lg pl-3 pr-8 py-2.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': `${BYT_GREEN}30` }}
            >
              <option value="">— Selecteer een project —</option>
              {projecten.map(p => (
                <option key={p.id} value={p.id}>
                  {p.naam}
                  {p.klanten?.bedrijfsnaam ? ` — ${p.klanten.bedrijfsnaam}` : p.klanten?.naam ? ` — ${p.klanten.naam}` : ''}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Aanpassingen — enkel bewezen boilerplates */}
        {!gepland && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Aanpassingen voor dit project
            </label>
            <textarea
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 bg-white resize-none leading-relaxed"
              style={{ '--tw-ring-color': `${BYT_GREEN}30` }}
              rows={4}
              value={aanpassingen}
              onChange={e => setAanpassingen(e.target.value)}
              placeholder={'Bv. Verwijder IBAN-veld, voeg KBO-nummer toe, kleur #CC0000...'}
            />
          </div>
        )}

        {/* Gepland: toevoegen/verwijderen uit project-modules */}
        {gepland && (
          <button
            onClick={toggleInProject}
            disabled={toggleBezig || !projectId}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold border transition-all disabled:opacity-40"
            style={alGekoppeld
              ? { background: '#dcfce7', color: '#15803d', borderColor: '#bbf7d0' }
              : { background: 'white', color: '#374151', borderColor: '#e5e7eb' }}
          >
            {alGekoppeld ? <Check size={14} /> : <Plus size={14} />}
            {toggleBezig
              ? 'Bezig…'
              : alGekoppeld ? 'Toegevoegd aan project' : 'Voeg toe aan project'}
          </button>
        )}

        {/* Genereer knop */}
        <button
          onClick={genereerPrompt}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-white text-sm font-semibold transition-opacity hover:opacity-85"
          style={{ background: BYT_GREEN }}
        >
          <Zap size={14} /> {gepland ? 'Genereer bouwprompt' : 'Genereer aanpassingsprompt'}
        </button>

        {/* Gegenereerde prompt */}
        {gegenereerdePrompt && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-500">Gegenereerde prompt</label>
              <button
                onClick={kopieer}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-all font-medium"
                style={{
                  background: gekopieerd ? '#dcfce7' : '#f3f4f6',
                  color: gekopieerd ? '#15803d' : '#6b7280',
                }}
              >
                {gekopieerd ? <CheckCircle size={11} /> : <Copy size={11} />}
                {gekopieerd ? 'Gekopieerd!' : 'Kopieer prompt'}
              </button>
            </div>
            <textarea
              readOnly
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-xs bg-gray-50 font-mono resize-none leading-relaxed text-gray-700 focus:outline-none"
              rows={8}
              value={gegenereerdePrompt}
              onClick={e => e.target.select()}
            />
          </div>
        )}

        {/* Meldingen */}
        {fout && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{fout}</p>
        )}
        {ok && (
          <p className="text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-lg flex items-center gap-1.5">
            <CheckCircle size={12} /> {ok}
          </p>
        )}

        {/* Opslaan — enkel bewezen boilerplates */}
        {!gepland && (
          <button
            onClick={slaOp}
            disabled={opslaan || !gegenereerdePrompt || !projectId}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-white text-sm font-semibold transition-opacity hover:opacity-85 disabled:opacity-40"
            style={{ background: '#185FA5' }}
          >
            <Save size={14} /> {opslaan ? 'Bezig…' : 'Opslaan bij project'}
          </button>
        )}

        {/* Manuele status-overgang: gepland → boilerplate */}
        {gepland && (
          <div className="pt-3 border-t border-gray-100">
            {statusBevestig ? (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">
                  Markeer als bewezen, herbruikbare boilerplate? Vul daarna type, versie en bestandslocatie aan via het bewerk-icoon hierboven.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={zetOmNaarBoilerplate}
                    disabled={statusBezig}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-white text-xs font-semibold disabled:opacity-50"
                    style={{ background: '#185FA5' }}
                  >
                    {statusBezig ? 'Bezig…' : 'Ja, zet om naar boilerplate'}
                  </button>
                  <button
                    onClick={() => setStatusBevestig(false)}
                    className="px-3 py-2 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600"
                  >
                    Annuleren
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setStatusBevestig(true)}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
              >
                <ArrowUpCircle size={13} /> Zet om naar boilerplate…
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

// ── Hoofdpagina ───────────────────────────────────────────────────────────────
export default function Boilerplates() {
  const [boilerplates, setBoilerplates] = useState([])
  const [projecten, setProjecten] = useState([])
  const [uurtarief, setUurtarief] = useState(75)
  const [laden, setLaden] = useState(true)
  const [zoek, setZoek] = useState('')
  const [filterType, setFilterType] = useState('alle')
  const [geselecteerd, setGeselecteerd] = useState(null)

  async function laadProjecten() {
    const { data } = await supabase
      .from('projecten')
      .select('id, naam, features_json, klanten(naam, bedrijfsnaam)')
      .order('naam')
    setProjecten(data ?? [])
  }

  useEffect(() => {
    document.title = 'Boilerplates — BYT Studio'
    Promise.all([
      supabase.from('boilerplates').select('*').eq('actief', true).order('naam'),
      supabase.from('projecten').select('id, naam, features_json, klanten(naam, bedrijfsnaam)').order('naam'),
      supabase.from('instellingen').select('uurtarief').limit(1).single(),
    ]).then(([{ data: bib }, { data: proj }, { data: inst }]) => {
      setBoilerplates(bib ?? [])
      setProjecten(proj ?? [])
      if (inst?.uurtarief) setUurtarief(Number(inst.uurtarief))
      setLaden(false)
    })
  }, [])

  // Status lokaal bijwerken na "zet om naar boilerplate", zonder herlaad
  function statusGewijzigd(id) {
    setBoilerplates(prev => prev.map(b => b.id === id ? { ...b, status: 'boilerplate' } : b))
    setGeselecteerd(prev => prev && prev.id === id ? { ...prev, status: 'boilerplate' } : prev)
  }

  const zoekveld = zoek.toLowerCase()
  const gefilterd = boilerplates.filter(b => {
    const matchType = filterType === 'alle'
      ? true
      : filterType === 'gepland'
        ? b.status === 'gepland'
        : b.type === filterType
    const matchZoek = !zoek ||
      b.naam?.toLowerCase().includes(zoekveld) ||
      b.beschrijving?.toLowerCase().includes(zoekveld) ||
      (b.tags_json ?? []).some(t => t.toLowerCase().includes(zoekveld))
    return matchType && matchZoek
  })

  return (
    <div className="max-w-7xl mx-auto">

      {/* Paginatitel */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Boilerplates</h1>
          <p className="text-sm text-gray-500 mt-0.5">Selecteer een boilerplate en koppel die aan een project</p>
        </div>
        <Link
          to="/boilerplates/nieuw"
          className="flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-2.5 rounded-xl shadow-sm transition-opacity hover:opacity-90 flex-shrink-0"
          style={{ background: BYT_GREEN }}
        >
          <Plus size={15} /> Nieuwe boilerplate toevoegen
        </Link>
      </div>

      <div className="flex gap-6 items-start">

        {/* ── Linker kolom: bibliotheek (65%) ───────────────────────────── */}
        <div className="flex-1 min-w-0" style={{ flexBasis: '65%' }}>

          {/* Zoekbalk + filter tabs */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 mb-4 space-y-3">
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
              <Search size={14} className="text-gray-400 flex-shrink-0" />
              <input
                value={zoek}
                onChange={e => setZoek(e.target.value)}
                placeholder="Zoek op naam, beschrijving of tag…"
                className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400"
              />
              {zoek && (
                <button onClick={() => setZoek('')} className="text-gray-300 hover:text-gray-500">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1 flex-wrap">
              {FILTER_TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilterType(tab.key)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={filterType === tab.key
                    ? { background: BYT_GREEN, color: '#fff' }
                    : { background: '#f3f4f6', color: '#6b7280' }
                  }
                >
                  {tab.label}
                </button>
              ))}
              <span className="ml-auto text-xs text-gray-400 self-center">{gefilterd.length} resultaten</span>
            </div>
          </div>

          {/* Laadspinner */}
          {laden && (
            <div className="flex justify-center py-16">
              <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: BYT_GREEN, borderTopColor: 'transparent' }} />
            </div>
          )}

          {/* Lege staat */}
          {!laden && gefilterd.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-100 py-14 flex flex-col items-center gap-3 text-gray-400">
              <Package size={36} strokeWidth={1.25} />
              <p className="text-sm">
                {zoek || filterType !== 'alle'
                  ? 'Geen boilerplates gevonden voor deze filters.'
                  : 'Nog geen actieve boilerplates beschikbaar.'}
              </p>
            </div>
          )}

          {/* Kaarten grid */}
          {!laden && gefilterd.length > 0 && (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {gefilterd.map(b => (
                <BoilerplateKaart
                  key={b.id}
                  b={b}
                  uurtarief={uurtarief}
                  actief={geselecteerd?.id === b.id}
                  onSelecteer={setGeselecteerd}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Rechter kolom: detail paneel (35%) ────────────────────────── */}
        <div style={{ flexBasis: '35%', flexShrink: 0, width: '35%' }}>
          {geselecteerd ? (
            <DetailPaneel
              key={geselecteerd.id}
              boilerplate={geselecteerd}
              projecten={projecten}
              uurtarief={uurtarief}
              onOpgeslagen={laadProjecten}
              onStatusGewijzigd={statusGewijzigd}
            />
          ) : (
            <div className="bg-white rounded-xl border border-dashed border-gray-200 py-16 flex flex-col items-center gap-3 text-gray-300">
              <Package size={36} strokeWidth={1} />
              <p className="text-sm text-center px-6">
                Klik op een boilerplate om details te zien en te koppelen aan een project.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
