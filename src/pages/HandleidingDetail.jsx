// HandleidingDetail.jsx — Weergave en bewerking van één handleiding
import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PageWrapper from '../components/PageWrapper'
import '../styles/print.css'
import {
  ArrowLeft, Edit3, FileDown, Trash2,
  Save, X, CheckCircle, ChevronRight,
  Heading1, Heading2, Bold, Italic,
  List, ListOrdered, Code, Minus,
  Info, FileText, Eye, AlertTriangle
} from 'lucide-react'

// ── Markdown renderer ─────────────────────────────────────────────────────────
function renderMarkdown(md, klasse = '') {
  if (!md) return `<p class="text-gray-400 italic">Nog geen inhoud.</p>`
  let h = md
  const codeBlocks = []
  h = h.replace(/```[\w]*\n?([\s\S]*?)```/g, (_, code) => {
    const i = codeBlocks.length
    codeBlocks.push(
      `<pre class="${klasse ? '' : 'bg-gray-900 text-emerald-400'} rounded-xl p-4 overflow-x-auto text-sm font-mono my-4 leading-relaxed">${
        code.replace(/</g, '&lt;').replace(/>/g, '&gt;').trimEnd()
      }</pre>`
    )
    return `%%CB${i}%%`
  })
  h = h.replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-rose-600 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
  h = h.replace(/^---$/gm, '<hr class="my-6 border-gray-200">')
  h = h.replace(/^#### (.+)$/gm, '<h4 class="text-base font-semibold text-gray-800 mt-4 mb-1.5">$1</h4>')
  h = h.replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold text-gray-800 mt-5 mb-2">$1</h3>')
  h = h.replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-gray-900 mt-7 mb-2 border-b border-gray-100 pb-2">$1</h2>')
  h = h.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-gray-900 mt-8 mb-3">$1</h1>')
  h = h.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  h = h.replace(/\*(.+?)\*/g, '<em>$1</em>')
  h = h.replace(/\[(.+?)\]\((https?:\/\/[^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener" class="text-blue-600 underline hover:text-blue-800">$1</a>')
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
    const cls = ordered
      ? 'list-decimal ml-6 my-3 space-y-1.5 text-gray-700'
      : 'list-disc ml-6 my-3 space-y-1.5 text-gray-700'
    return `<${tag} class="${cls}">${
      indices.map(i => `<li class="leading-relaxed">${listItems[i].item}</li>`).join('')
    }</${tag}>`
  })
  const blocks = h.split(/\n\n+/)
  h = blocks.map(b => {
    b = b.trim()
    if (!b) return ''
    if (/^<(h[1-6]|ul|ol|pre|hr|blockquote)/.test(b) || b.startsWith('%%CB')) return b
    return `<p class="text-gray-700 leading-relaxed mb-3">${b.replace(/\n/g, '<br>')}</p>`
  }).join('\n')
  codeBlocks.forEach((cb, i) => { h = h.replace(`%%CB${i}%%`, cb) })
  return h
}

// Zelfde renderer maar zonder Tailwind-klassen — voor print
function renderMarkdownPrint(md) {
  if (!md) return ''
  let h = md
  const codeBlocks = []
  h = h.replace(/```[\w]*\n?([\s\S]*?)```/g, (_, code) => {
    const i = codeBlocks.length
    codeBlocks.push(`<pre>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;').trimEnd()}</pre>`)
    return `%%CB${i}%%`
  })
  h = h.replace(/`([^`]+)`/g, '<code>$1</code>')
  h = h.replace(/^---$/gm, '<hr>')
  h = h.replace(/^#### (.+)$/gm, '<h4>$1</h4>')
  h = h.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  h = h.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  h = h.replace(/^# (.+)$/gm, '<h1>$1</h1>')
  h = h.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  h = h.replace(/\*(.+?)\*/g, '<em>$1</em>')
  h = h.replace(/\[(.+?)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2">$1</a>')
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
    return `<${tag}>${indices.map(i => `<li>${listItems[i].item}</li>`).join('')}</${tag}>`
  })
  const blocks = h.split(/\n\n+/)
  h = blocks.map(b => {
    b = b.trim()
    if (!b) return ''
    if (/^<(h[1-6]|ul|ol|pre|hr|blockquote)/.test(b) || b.startsWith('%%CB')) return b
    return `<p>${b.replace(/\n/g, '<br>')}</p>`
  }).join('\n')
  codeBlocks.forEach((cb, i) => { h = h.replace(`%%CB${i}%%`, cb) })
  return h
}

// Extraheer H2-koppen voor inhoudsopgave
function extractH2(md) {
  if (!md) return []
  return [...md.matchAll(/^## (.+)$/gm)].map(m => m[1].trim())
}

// Datum formattering
function formatDatum(ts, lang = false) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('nl-BE', {
    day: '2-digit',
    month: lang ? 'long' : 'short',
    year: 'numeric',
  })
}

const TYPE_BADGE = {
  gebruiker: { label: 'Gebruikershandleiding', short: 'Gebruiker', bg: 'bg-blue-100',   text: 'text-blue-700' },
  technisch:  { label: 'Technische handleiding', short: 'Technisch', bg: 'bg-orange-100', text: 'text-orange-700' },
}

// ── Toolbar knop ──────────────────────────────────────────────────────────────
function ToolbarKnop({ onClick, title, children }) {
  return (
    <button type="button" onClick={onClick} title={title}
      className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors">
      {children}
    </button>
  )
}

// ── Markdown hint tooltip ─────────────────────────────────────────────────────
function MarkdownHint() {
  const [open, setOpen] = useState(false)
  const tips = [
    ['# Titel', 'H1'], ['## Sectie', 'H2'], ['**vet**', 'Vet'],
    ['*cursief*', 'Cursief'], ['`code`', 'Code'], ['```', 'Blok'],
    ['- item', 'Lijst'], ['1. item', 'Genummerd'],
    ['---', 'Lijn'], ['[tekst](url)', 'Link'],
  ]
  return (
    <div className="relative">
      <button onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
        className="text-gray-300 hover:text-gray-500 transition-colors"><Info size={13} /></button>
      {open && (
        <div className="absolute left-0 top-6 z-50 bg-gray-900 text-white rounded-xl shadow-2xl p-3 w-52">
          <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Markdown</p>
          <div className="space-y-1">
            {tips.map(([s, u]) => (
              <div key={s} className="flex items-center justify-between gap-2">
                <code className="text-xs text-emerald-400 font-mono">{s}</code>
                <span className="text-xs text-gray-400">{u}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Hoofd component ───────────────────────────────────────────────────────────
export default function HandleidingDetail() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const [params]     = useSearchParams()
  const editorRef    = useRef(null)

  const [handleiding,      setHandleiding]      = useState(null)
  const [huisstijl,        setHuisstijl]        = useState(null)
  const [modus,            setModus]            = useState('weergave')
  const [inhoud,           setInhoud]           = useState('')
  const [opgeslagenInhoud, setOpgeslagenInhoud] = useState('')
  const [laden,            setLaden]            = useState(true)
  const [opslaan,          setOpslaan]          = useState(false)
  const [bewaard,          setBewaard]          = useState(false)
  const [verwijderOpen,    setVerwijderOpen]    = useState(false)
  const [verwijderen,      setVerwijderen]      = useState(false)

  const isGewijzigd = inhoud !== opgeslagenInhoud

  // ── Laad handleiding + huisstijl ──────────────────────────────────────────
  useEffect(() => {
    setLaden(true)
    supabase
      .from('handleidingen')
      .select('id, type, inhoud_markdown, aangemaakt_op, bijgewerkt_op, projecten(id, naam, klanten(naam, bedrijfsnaam))')
      .eq('id', id)
      .single()
      .then(async ({ data }) => {
        if (!data) { setLaden(false); return }
        setHandleiding(data)
        setInhoud(data.inhoud_markdown ?? '')
        setOpgeslagenInhoud(data.inhoud_markdown ?? '')
        // Laad huisstijl voor printkleur
        const { data: hs } = await supabase
          .from('huisstijlen')
          .select('primaire_kleur, font_titel')
          .eq('project_id', data.projecten?.id)
          .maybeSingle()
        setHuisstijl(hs ?? null)
        setLaden(false)
        // Auto-print als ?print=1 in URL
        if (params.get('print') === '1') {
          setTimeout(() => window.print(), 600)
        }
      })
  }, [id])

  // ── Markdown insert ───────────────────────────────────────────────────────
  function insert(voor, na = '', placeholder = 'tekst') {
    const ta = editorRef.current
    if (!ta) return
    const start    = ta.selectionStart
    const end      = ta.selectionEnd
    const selected = inhoud.slice(start, end) || placeholder
    const nieuw    = inhoud.slice(0, start) + `${voor}${selected}${na}` + inhoud.slice(end)
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
    const start = ta.selectionStart
    const voor  = inhoud.slice(0, start)
    const na    = inhoud.slice(start)
    const sep   = voor.endsWith('\n') || voor === '' ? '' : '\n'
    const nieuw = voor + sep + prefix + na
    setInhoud(nieuw)
    setTimeout(() => {
      ta.focus()
      const cursor = start + sep.length + prefix.length
      ta.setSelectionRange(cursor, cursor)
    }, 0)
  }

  // ── Opslaan ───────────────────────────────────────────────────────────────
  async function handleOpslaan() {
    setOpslaan(true)
    const { error } = await supabase
      .from('handleidingen')
      .update({ inhoud_markdown: inhoud })
      .eq('id', id)
    setOpslaan(false)
    if (!error) {
      setHandleiding(prev => ({ ...prev, inhoud_markdown: inhoud, bijgewerkt_op: new Date().toISOString() }))
      setOpgeslagenInhoud(inhoud)
      setBewaard(true)
      setTimeout(() => { setBewaard(false); setModus('weergave') }, 1500)
    }
  }

  // ── Verwijderen ───────────────────────────────────────────────────────────
  async function handleVerwijderen() {
    setVerwijderen(true)
    await supabase.from('handleidingen').delete().eq('id', id)
    navigate('/handleidingen')
  }

  // ── PDF export ────────────────────────────────────────────────────────────
  function exporteerPDF() {
    window.print()
  }

  // ── Afgeleide waarden ─────────────────────────────────────────────────────
  const badge       = TYPE_BADGE[handleiding?.type] ?? TYPE_BADGE.gebruiker
  const projectNaam = handleiding?.projecten?.naam ?? ''
  const klantNaam   = handleiding?.projecten?.klanten?.bedrijfsnaam || handleiding?.projecten?.klanten?.naam || ''
  const primairKleur = huisstijl?.primaire_kleur ?? '#185FA5'
  const tocItems    = extractH2(opgeslagenInhoud)
  const nu          = new Date().toLocaleDateString('nl-BE', { day: '2-digit', month: 'long', year: 'numeric' })

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <PageWrapper
        title={laden ? 'Laden…' : `${badge.label}${projectNaam ? ` — ${projectNaam}` : ''}`}
        description={klantNaam}
      >
        {laden ? (
          <div className="flex justify-center py-24">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: primairKleur, borderTopColor: 'transparent' }} />
          </div>
        ) : !handleiding ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <p className="text-gray-500">Handleiding niet gevonden.</p>
            <button onClick={() => navigate('/handleidingen')}
              className="mt-4 text-sm text-blue-500 hover:underline">
              Terug naar overzicht
            </button>
          </div>
        ) : (
          <div className="space-y-4 no-print">

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              {/* Breadcrumb */}
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                <button onClick={() => navigate('/handleidingen')}
                  className="hover:text-gray-700 transition-colors">Handleidingen</button>
                <ChevronRight size={12} />
                <span className="text-gray-600 font-medium">{projectNaam}</span>
                <ChevronRight size={12} />
                <span className="text-gray-600">{badge.short}</span>
              </div>

              <div className="flex flex-wrap items-start justify-between gap-4">
                {/* Links: titel + meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap mb-1">
                    <h1 className="text-xl font-bold text-gray-900 leading-tight">{projectNaam}</h1>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
                      {badge.short}
                    </span>
                  </div>
                  {klantNaam && <p className="text-sm text-gray-500 mb-2">{klantNaam}</p>}
                  <div className="flex gap-4 text-xs text-gray-400">
                    <span>Aangemaakt: {formatDatum(handleiding.aangemaakt_op)}</span>
                    <span>Gewijzigd: {formatDatum(handleiding.bijgewerkt_op ?? handleiding.aangemaakt_op)}</span>
                  </div>
                </div>

                {/* Rechts: actieknoppen */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => navigate('/handleidingen')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    <ArrowLeft size={13} /> Terug
                  </button>
                  {modus === 'weergave' && (
                    <button
                      onClick={() => setModus('bewerken')}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      <Edit3 size={13} /> Bewerken
                    </button>
                  )}
                  <button
                    onClick={exporteerPDF}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    <FileDown size={13} /> PDF exporteren
                  </button>
                  <button
                    onClick={() => setVerwijderOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={13} /> Verwijderen
                  </button>
                </div>
              </div>
            </div>

            {/* ── WEERGAVEMODUS ───────────────────────────────────────────── */}
            {modus === 'weergave' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                {/* Kleurband */}
                <div className="h-1 rounded-t-2xl" style={{ background: primairKleur }} />
                <div className="px-8 py-8 max-w-3xl mx-auto">
                  {opgeslagenInhoud ? (
                    <div dangerouslySetInnerHTML={{ __html: renderMarkdown(opgeslagenInhoud) }} />
                  ) : (
                    <div className="text-center py-16">
                      <p className="text-gray-400 text-sm mb-3">Deze handleiding heeft nog geen inhoud.</p>
                      <button
                        onClick={() => setModus('bewerken')}
                        className="flex items-center gap-2 mx-auto px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-semibold hover:bg-gray-700 transition-colors"
                      >
                        <Edit3 size={13} /> Begin met schrijven
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── BEWERKINGSMODUS ─────────────────────────────────────────── */}
            {modus === 'bewerken' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Editor header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500">Bewerkingsmodus</span>
                    <span className="text-xs text-gray-300">{inhoud.length} tekens</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isGewijzigd && (
                      <span className="text-xs text-amber-500 font-medium">● Niet opgeslagen</span>
                    )}
                    <button
                      onClick={() => { setInhoud(opgeslagenInhoud); setModus('weergave') }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <X size={12} /> Annuleren
                    </button>
                    <button
                      onClick={handleOpslaan}
                      disabled={opslaan || !isGewijzigd}
                      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all ${
                        bewaard ? 'bg-green-500' : 'bg-gray-900 hover:bg-gray-700'
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      {bewaard ? (
                        <><CheckCircle size={12} /> Bewaard</>
                      ) : opslaan ? (
                        <><div className="w-3 h-3 border border-t-transparent rounded-full animate-spin" /> Opslaan…</>
                      ) : (
                        <><Save size={12} /> Wijzigingen opslaan</>
                      )}
                    </button>
                  </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-0.5 px-4 py-2 border-b border-gray-100 flex-wrap">
                  <ToolbarKnop title="H1" onClick={() => insertRegel('# ')}><Heading1 size={15} /></ToolbarKnop>
                  <ToolbarKnop title="H2" onClick={() => insertRegel('## ')}><Heading2 size={15} /></ToolbarKnop>
                  <div className="w-px h-5 bg-gray-200 mx-1" />
                  <ToolbarKnop title="Vet" onClick={() => insert('**', '**', 'vetgedrukt')}><Bold size={15} /></ToolbarKnop>
                  <ToolbarKnop title="Cursief" onClick={() => insert('*', '*', 'cursief')}><Italic size={15} /></ToolbarKnop>
                  <div className="w-px h-5 bg-gray-200 mx-1" />
                  <ToolbarKnop title="Lijst" onClick={() => insertRegel('- ')}><List size={15} /></ToolbarKnop>
                  <ToolbarKnop title="Genummerde lijst" onClick={() => insertRegel('1. ')}><ListOrdered size={15} /></ToolbarKnop>
                  <div className="w-px h-5 bg-gray-200 mx-1" />
                  <ToolbarKnop title="Code blok" onClick={() => insert('```\n', '\n```', 'code')}><Code size={15} /></ToolbarKnop>
                  <ToolbarKnop title="Horizontale lijn" onClick={() => insertRegel('\n---\n')}><Minus size={15} /></ToolbarKnop>
                  <div className="ml-2"><MarkdownHint /></div>
                </div>

                {/* Editor + Preview */}
                <div className="grid grid-cols-2 divide-x divide-gray-100" style={{ minHeight: 560 }}>
                  {/* Editor */}
                  <div className="flex flex-col">
                    <div className="px-4 py-2 border-b border-gray-50">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                        <FileText size={11} /> Markdown
                      </span>
                    </div>
                    <textarea
                      ref={editorRef}
                      value={inhoud}
                      onChange={e => setInhoud(e.target.value)}
                      placeholder="Schrijf de handleiding in Markdown…"
                      className="flex-1 w-full px-5 py-4 text-sm font-mono text-gray-700 resize-none focus:outline-none leading-relaxed placeholder:text-gray-300"
                      style={{ minHeight: 560, fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace" }}
                      spellCheck={false}
                    />
                  </div>
                  {/* Preview */}
                  <div className="flex flex-col">
                    <div className="px-4 py-2 border-b border-gray-50">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                        <Eye size={11} /> Voorbeeld
                      </span>
                    </div>
                    <div
                      className="flex-1 px-7 py-5 overflow-y-auto"
                      style={{ minHeight: 560 }}
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(inhoud) }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </PageWrapper>

      {/* ── PRINT-ONLY INHOUD ─────────────────────────────────────────────────── */}
      {handleiding && (
        <div
          className="handleiding-print-content"
          style={{ '--hs-primair': primairKleur }}
        >
          {/* Kleurband */}
          <div className="hp-kleurband" />

          {/* Document header */}
          <div className="hp-header">
            <div className="hp-header-links">
              <div className="hp-project-naam">{projectNaam}</div>
              {klantNaam && <div className="hp-klant-naam">{klantNaam}</div>}
            </div>
            <div className="hp-header-rechts">
              <div className="hp-type-label">{badge.label}</div>
              <div className="hp-meta">
                Aangemaakt: {formatDatum(handleiding.aangemaakt_op, true)}<br />
                Gewijzigd: {formatDatum(handleiding.bijgewerkt_op ?? handleiding.aangemaakt_op, true)}
              </div>
            </div>
          </div>

          {/* Scheidingslijn */}
          <hr className="hp-divider" />

          {/* Inhoudsopgave */}
          {tocItems.length > 0 && (
            <div className="hp-toc">
              <div className="hp-toc-titel">Inhoudsopgave</div>
              <ul className="hp-toc-lijst">
                {tocItems.map((titel, i) => (
                  <li key={i} className="hp-toc-item">
                    <span className="hp-toc-nr">{i + 1}.</span>
                    <span>{titel}</span>
                    <span className="hp-toc-vulling" />
                  </li>
                ))}
              </ul>
              <hr className="hp-body-start" />
            </div>
          )}

          {/* Hoofdinhoud */}
          <div
            className="hp-body"
            dangerouslySetInnerHTML={{ __html: renderMarkdownPrint(opgeslagenInhoud) }}
          />

          {/* Paginavoettekst */}
          <div className="hp-voettekst">
            <span>{projectNaam} — {badge.short} handleiding</span>
            <span>Gegenereerd door Build Your Tools — {nu}</span>
          </div>
        </div>
      )}

      {/* ── VERWIJDER BEVESTIGING ──────────────────────────────────────────────── */}
      {verwijderOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} className="text-red-500" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 mb-1">Handleiding verwijderen</h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Ben je zeker dat je deze handleiding wilt verwijderen? Dit kan niet ongedaan worden.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 mb-5">
              <p className="text-xs font-semibold text-gray-700">{projectNaam}</p>
              <p className="text-xs text-gray-500 mt-0.5">{badge.label}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setVerwijderOpen(false)}
                disabled={verwijderen}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >Annuleren</button>
              <button
                onClick={handleVerwijderen}
                disabled={verwijderen}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {verwijderen ? 'Verwijderen…' : 'Ja, verwijderen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
