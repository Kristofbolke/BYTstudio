// HandleidingNieuw.jsx — Handleiding aanmaken met auto-generatie en markdown editor
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PageWrapper from '../components/PageWrapper'
import { genereerGebruiker, genereerTechnisch, moduleNamenVanProject } from '../lib/handleidingGenerators'
import { useInstellingen } from '../context/InstellingenContext'
import {
  ArrowLeft, ChevronDown, Zap, PenLine,
  Heading1, Heading2, Bold, Italic, List, ListOrdered,
  Code, Minus, Save, X
} from 'lucide-react'

// ── Markdown renderer (zelfde als HandleidingDetail) ──────────────────────────
function renderMarkdown(md) {
  if (!md) return '<p style="color:#9ca3af;font-style:italic">Nog geen inhoud.</p>'
  let h = md
  const codeBlocks = []
  h = h.replace(/```[\w]*\n?([\s\S]*?)```/g, (_, code) => {
    const i = codeBlocks.length
    codeBlocks.push(
      `<pre style="background:#111827;color:#34d399;border-radius:12px;padding:16px;overflow-x:auto;font-size:13px;font-family:monospace;margin:16px 0;line-height:1.6">${
        code.replace(/</g, '&lt;').replace(/>/g, '&gt;').trimEnd()
      }</pre>`
    )
    return `%%CB${i}%%`
  })
  h = h.replace(/`([^`]+)`/g, '<code style="background:#f3f4f6;color:#e11d48;padding:2px 6px;border-radius:4px;font-size:0.875em;font-family:monospace">$1</code>')
  h = h.replace(/^---$/gm, '<hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb">')
  h = h.replace(/^#### (.+)$/gm, '<h4 style="font-size:1em;font-weight:600;color:#1f2937;margin:16px 0 6px">$1</h4>')
  h = h.replace(/^### (.+)$/gm, '<h3 style="font-size:1.125em;font-weight:700;color:#1f2937;margin:20px 0 8px">$1</h3>')
  h = h.replace(/^## (.+)$/gm, '<h2 style="font-size:1.25em;font-weight:700;color:#111827;margin:24px 0 8px;border-bottom:1px solid #f3f4f6;padding-bottom:4px">$1</h2>')
  h = h.replace(/^# (.+)$/gm, '<h1 style="font-size:1.5em;font-weight:700;color:#111827;margin:24px 0 12px">$1</h1>')
  h = h.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  h = h.replace(/\*(.+?)\*/g, '<em>$1</em>')
  h = h.replace(/\[(.+?)\]\((https?:\/\/[^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener" style="color:#2563eb;text-decoration:underline">$1</a>')
  const listItems = []
  h = h.replace(/^(?:[-*]|\d+\.) (.+)$/gm, (match, item) => {
    const ordered = /^\d+\./.test(match)
    const i = listItems.length
    listItems.push({ item, ordered })
    return `%%LI${i}%%`
  })
  h = h.replace(/(%%LI\d+%%\n?)+/g, (block) => {
    const indices = [...block.matchAll(/%%LI(\d+)%%/g)].map(m => parseInt(m[1]))
    const ordered = listItems[indices[0]].ordered
    const tag = ordered ? 'ol' : 'ul'
    const style = ordered
      ? 'list-style:decimal;margin-left:20px;margin:12px 0 12px 20px'
      : 'list-style:disc;margin-left:20px;margin:12px 0 12px 20px'
    return `<${tag} style="${style}">${
      indices.map(i => `<li style="margin:4px 0;color:#374151">${listItems[i].item}</li>`).join('')
    }</${tag}>`
  })
  const blocks = h.split(/\n\n+/)
  h = blocks.map(b => {
    b = b.trim()
    if (!b) return ''
    if (/^<(h[1-6]|ul|ol|pre|hr|blockquote)/.test(b) || b.startsWith('%%CB')) return b
    return `<p style="color:#374151;line-height:1.7;margin-bottom:12px">${b.replace(/\n/g, '<br>')}</p>`
  }).join('\n')
  codeBlocks.forEach((cb, i) => { h = h.replace(`%%CB${i}%%`, cb) })
  return h
}

// ── Toolbar knop ──────────────────────────────────────────────────────────────
function ToolbarKnop({ onClick, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors text-xs font-bold"
    >
      {children}
    </button>
  )
}

// ── Hoofd component ───────────────────────────────────────────────────────────
export default function HandleidingNieuw() {
  useEffect(() => { document.title = 'Nieuwe handleiding — BYT Studio' }, [])
  const navigate       = useNavigate()
  const [searchParams] = useSearchParams()
  const editorRef      = useRef(null)
  const { instellingen, laden: instLaden } = useInstellingen()

  // ── State ─────────────────────────────────────────────────────────────────
  const [projecten,    setProjecten]    = useState([])
  const [projectId,    setProjectId]    = useState(searchParams.get('project_id') ?? '')
  const [type,         setType]         = useState(searchParams.get('type') === 'technisch' ? 'technisch' : 'gebruiker')
  const [project,      setProject]      = useState(null)
  const [moduleNamen,  setModuleNamen]  = useState([])
  const [inhoud,       setInhoud]       = useState('')
  const [versie,       setVersie]       = useState('v1.0')
  const [auteur,       setAuteur]       = useState('Build Your Tools')
  const [opslaan,      setOpslaan]      = useState(false)
  const [gegenereerd,  setGegenereerd]  = useState(false)

  // Stel versie en auteur in vanuit instellingen zodra die geladen zijn
  useEffect(() => {
    if (!instLaden) {
      setVersie(instellingen.standaard_handleiding_versie || 'v1.0')
      setAuteur(instellingen.standaard_auteur_handleiding || instellingen.bedrijfsnaam || 'Build Your Tools')
    }
  }, [instLaden])

  // ── Laad projecten ────────────────────────────────────────────────────────
  useEffect(() => {
    supabase
      .from('projecten')
      .select('id, naam, klanten(naam, bedrijfsnaam)')
      .order('naam')
      .then(({ data }) => {
        const lijst = data ?? []
        setProjecten(lijst)
        if (projectId) {
          const gevonden = lijst.find(p => p.id === projectId) ?? null
          setProject(gevonden)
        }
      })
  }, [])

  // ── Laad modules bij projectwijziging ────────────────────────────────────
  useEffect(() => {
    if (!projectId) {
      setProject(null)
      setModuleNamen([])
      return
    }
    supabase
      .from('projecten')
      .select('naam, features_json, klanten(naam, bedrijfsnaam)')
      .eq('id', projectId)
      .single()
      .then(({ data }) => {
        if (!data) return
        setProject(data)
        setModuleNamen(moduleNamenVanProject(data.features_json))
      })
  }, [projectId])

  // ── Markdown insert hulpfunctie ───────────────────────────────────────────
  function insert(voor, na = '', placeholder = 'tekst') {
    const ta = editorRef.current
    if (!ta) return
    const start    = ta.selectionStart
    const end      = ta.selectionEnd
    const selected = inhoud.slice(start, end) || placeholder
    const vervanging = `${voor}${selected}${na}`
    const nieuw = inhoud.slice(0, start) + vervanging + inhoud.slice(end)
    setInhoud(nieuw)
    setTimeout(() => {
      ta.focus()
      const cursor = start + voor.length + selected.length + na.length
      ta.setSelectionRange(cursor, cursor)
    }, 0)
  }

  function insertRegel(prefix) {
    const ta = editorRef.current
    if (!ta) return
    const start  = ta.selectionStart
    const voor   = inhoud.slice(0, start)
    const na     = inhoud.slice(start)
    const nieuwRegel = voor.endsWith('\n') || voor === '' ? '' : '\n'
    const toevoegen = `${nieuwRegel}${prefix}`
    setInhoud(voor + toevoegen + na)
    setTimeout(() => {
      ta.focus()
      const cursor = start + toevoegen.length
      ta.setSelectionRange(cursor, cursor)
    }, 0)
  }

  // ── Content generatie ─────────────────────────────────────────────────────
  function genereer() {
    const naam = project?.naam ?? 'de applicatie'
    const tekst = type === 'technisch'
      ? genereerTechnisch(naam, moduleNamen)
      : genereerGebruiker(naam, moduleNamen)
    setInhoud(tekst)
    setGegenereerd(true)
    setTimeout(() => editorRef.current?.focus(), 100)
  }

  // ── Opslaan ───────────────────────────────────────────────────────────────
  async function handleOpslaan() {
    if (!projectId) return
    setOpslaan(true)
    const { data, error } = await supabase
      .from('handleidingen')
      .insert({ project_id: projectId, type, inhoud_markdown: inhoud })
      .select('id')
      .single()
    setOpslaan(false)
    if (!error && data) {
      navigate(`/handleidingen/${data.id}`)
    }
  }

  const klantNaam = project?.klanten?.bedrijfsnaam || project?.klanten?.naam || ''
  const kanOpslaan = !!projectId

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <PageWrapper
      title="Nieuwe handleiding"
      description="Kies een project, genereer inhoud en verfijn in de editor."
    >
      {/* ── Terug ──────────────────────────────────────────────────────────── */}
      <button
        onClick={() => navigate('/handleidingen')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6"
      >
        <ArrowLeft size={16} /> Terug naar overzicht
      </button>

      <div className="space-y-5">

        {/* ── STAP 1: Basisgegevens ──────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-bold">1</span>
            Basisgegevens
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Project */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Project <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <select
                  value={projectId}
                  onChange={e => setProjectId(e.target.value)}
                  className="w-full px-3 py-2.5 pr-9 rounded-xl border border-gray-200 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400"
                >
                  <option value="">— Kies een project —</option>
                  {projecten.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.naam}
                      {p.klanten?.bedrijfsnaam
                        ? ` — ${p.klanten.bedrijfsnaam}`
                        : p.klanten?.naam ? ` — ${p.klanten.naam}` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              {moduleNamen.length > 0 && (
                <p className="text-xs text-gray-400 mt-1.5">
                  {moduleNamen.length} module{moduleNamen.length !== 1 ? 's' : ''} gevonden: {moduleNamen.slice(0, 3).join(', ')}{moduleNamen.length > 3 ? ` +${moduleNamen.length - 3}` : ''}
                </p>
              )}
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Type <span className="text-red-400">*</span>
              </label>
              <div className="flex flex-col gap-2">
                {[
                  { key: 'gebruiker', label: 'Gebruikershandleiding', sub: 'Voor de klant' },
                  { key: 'technisch', label: 'Technische handleiding', sub: 'Voor de developer' },
                ].map(t => (
                  <label
                    key={t.key}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
                      type === t.key
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={t.key}
                      checked={type === t.key}
                      onChange={() => { setType(t.key); setGegenereerd(false) }}
                      className="accent-gray-900"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{t.label}</p>
                      <p className="text-xs text-gray-400">{t.sub}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── STAP 2: Inhoud genereren ───────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-bold">2</span>
            Inhoud
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Optie A: Automatisch */}
            <button
              type="button"
              onClick={genereer}
              disabled={!projectId}
              className="flex flex-col items-start gap-3 p-5 rounded-2xl border-2 border-dashed border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center">
                <Zap size={18} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">Genereer inhoud automatisch</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  Bouwt een basisstructuur op basis van het geselecteerde project
                  {moduleNamen.length > 0 ? ` met ${moduleNamen.length} module${moduleNamen.length !== 1 ? 's' : ''}` : ''}.
                </p>
              </div>
              {gegenereerd && (
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                  ✓ Gegenereerd
                </span>
              )}
            </button>

            {/* Optie B: Zelf schrijven */}
            <button
              type="button"
              onClick={() => { setInhoud(''); setGegenereerd(false); setTimeout(() => editorRef.current?.focus(), 100) }}
              className="flex flex-col items-start gap-3 p-5 rounded-2xl border-2 border-dashed border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <PenLine size={18} className="text-gray-700" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">Zelf schrijven</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  Start met een leeg document en schrijf de handleiding volledig zelf in Markdown.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* ── STAP 3: Editor ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-bold">3</span>
              Editor
            </h2>
            <span className="text-xs text-gray-400">{inhoud.length} tekens</span>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-0.5 px-4 py-2 border-b border-gray-100 bg-gray-50 flex-wrap">
            <ToolbarKnop title="Koptitel H1" onClick={() => insertRegel('# ')}>
              <Heading1 size={15} />
            </ToolbarKnop>
            <ToolbarKnop title="Koptitel H2" onClick={() => insertRegel('## ')}>
              <Heading2 size={15} />
            </ToolbarKnop>
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <ToolbarKnop title="Vetgedrukt" onClick={() => insert('**', '**', 'vetgedrukt')}>
              <Bold size={15} />
            </ToolbarKnop>
            <ToolbarKnop title="Cursief" onClick={() => insert('*', '*', 'cursief')}>
              <Italic size={15} />
            </ToolbarKnop>
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <ToolbarKnop title="Opsommingslijst" onClick={() => insertRegel('- ')}>
              <List size={15} />
            </ToolbarKnop>
            <ToolbarKnop title="Genummerde lijst" onClick={() => insertRegel('1. ')}>
              <ListOrdered size={15} />
            </ToolbarKnop>
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <ToolbarKnop title="Code blok" onClick={() => insert('```\n', '\n```', 'code hier')}>
              <Code size={15} />
            </ToolbarKnop>
            <ToolbarKnop title="Horizontale lijn" onClick={() => insertRegel('\n---\n')}>
              <Minus size={15} />
            </ToolbarKnop>
          </div>

          {/* Editor + Preview */}
          <div className="grid grid-cols-2 divide-x divide-gray-100" style={{ minHeight: 560 }}>
            {/* Markdown invoer */}
            <div className="flex flex-col">
              <div className="px-4 py-2 border-b border-gray-50">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Markdown</span>
              </div>
              <textarea
                ref={editorRef}
                value={inhoud}
                onChange={e => setInhoud(e.target.value)}
                placeholder={`Schrijf hier de handleiding in Markdown…\n\n# Titel\n## Sectie\n\n- punt 1\n- punt 2`}
                className="flex-1 w-full px-5 py-4 text-sm font-mono text-gray-700 resize-none focus:outline-none leading-relaxed placeholder:text-gray-300"
                style={{
                  minHeight: 560,
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                }}
                spellCheck={false}
              />
            </div>

            {/* Live preview */}
            <div className="flex flex-col">
              <div className="px-4 py-2 border-b border-gray-50">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Voorbeeld</span>
              </div>
              <div
                className="flex-1 px-7 py-5 overflow-y-auto"
                style={{ minHeight: 560 }}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(inhoud) }}
              />
            </div>
          </div>
        </div>

        {/* ── STAP 4: Instellingen ───────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-bold">4</span>
            Instellingen
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Context info */}
            {project && (
              <div className="sm:col-span-1 bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-400 mb-1">Project</p>
                <p className="text-sm font-bold text-gray-800">{project.naam}</p>
                {klantNaam && <p className="text-xs text-gray-500 mt-0.5">{klantNaam}</p>}
                <p className="text-xs text-gray-400 mt-2">
                  Type: <span className={`font-semibold ${type === 'technisch' ? 'text-orange-600' : 'text-blue-600'}`}>
                    {type === 'technisch' ? 'Technisch' : 'Gebruiker'}
                  </span>
                </p>
              </div>
            )}

            {/* Versienummer */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Versienummer <span className="text-gray-300">(optioneel)</span>
              </label>
              <input
                value={versie}
                onChange={e => setVersie(e.target.value)}
                placeholder="bv. v1.0"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400"
              />
            </div>

            {/* Auteursnaam */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Auteursnaam <span className="text-gray-300">(optioneel)</span>
              </label>
              <input
                value={auteur}
                onChange={e => setAuteur(e.target.value)}
                placeholder="bv. Build Your Tools"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400"
              />
            </div>
          </div>
        </div>

        {/* ── Actieknoppen ───────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 pb-4">
          <button
            onClick={() => navigate('/handleidingen')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <X size={15} /> Annuleren
          </button>
          <button
            onClick={handleOpslaan}
            disabled={!kanOpslaan || opslaan}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save size={15} />
            {opslaan ? 'Opslaan…' : 'Opslaan'}
          </button>
        </div>

      </div>
    </PageWrapper>
  )
}
