// Studio.jsx — Hart van BYT Studio: configureer klant-apps per project
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PageWrapper from '../components/PageWrapper'
import { ChevronDown, Layers, ExternalLink, Hammer } from 'lucide-react'
import { StatusBadge } from './Projecten'
import BouwprocesTab        from '../components/studio/BouwprocesTab'
import FeatureConfigurator  from '../components/studio/FeatureConfigurator'

const LS_KEY = 'byt_actief_project_id'
import PromptTemplates      from '../components/studio/PromptTemplates'
import AppModules           from '../components/studio/AppModules'
import BlokkensBuilder      from '../components/studio/BlokkensBuilder'
import Projectdocumentatie  from '../components/studio/Projectdocumentatie'
import AiCheck             from '../components/studio/AiCheck'

// ── Tabs definitie ────────────────────────────────────────────────────────────
const TABS = [
  { key: 'bouwproces',     label: 'Bouwproces',           icon: Hammer },
  { key: 'features',       label: 'Feature-configurator', emoji: '⚙️' },
  { key: 'prompts',        label: 'Prompt-templates',     emoji: '💬' },
  { key: 'modules',        label: 'App-modules',          emoji: '🧩' },
  { key: 'blokken',        label: 'Blokken-builder',      emoji: '🏗️' },
  { key: 'documentatie',   label: 'Projectdocumentatie',  emoji: '📄' },
  { key: 'aicheck',        label: 'AI-suggestiecheck',    emoji: '✨' },
]

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner({ kleur = '#185FA5' }) {
  return (
    <div className="flex justify-center py-16">
      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: kleur, borderTopColor: 'transparent' }} />
    </div>
  )
}

// ── Hoofd component ───────────────────────────────────────────────────────────
export default function Studio() {
  useEffect(() => { document.title = 'Studio — BYT Studio' }, [])
  const navigate = useNavigate()
  const [projecten,   setProjecten]   = useState([])
  const [projectId,   setProjectId]   = useState('')
  const [project,     setProject]     = useState(null)
  const [huisstijl,   setHuisstijl]   = useState(null)
  const [laden,       setLaden]       = useState(false)
  const [actieveTab,  setActieveTab]  = useState('bouwproces')

  // ── Laad alle projecten + herstel localStorage ────────────────────────────
  useEffect(() => {
    supabase
      .from('projecten')
      .select('id, naam, status, klant_id, features_json, klanten(naam, bedrijfsnaam)')
      .order('bijgewerkt_op', { ascending: false })
      .then(({ data }) => {
        const lijst = data ?? []
        setProjecten(lijst)
        if (lijst.length === 0) return
        const opgeslagen = localStorage.getItem(LS_KEY)
        const gevonden = opgeslagen && lijst.find(p => p.id === opgeslagen)
        setProjectId(gevonden ? opgeslagen : lijst[0].id)
      })
  }, [])

  // ── Laad project + huisstijl bij selectie ─────────────────────────────────
  useEffect(() => {
    if (!projectId) { setProject(null); setHuisstijl(null); return }
    setLaden(true)
    const gevonden = projecten.find(p => p.id === projectId) ?? null
    setProject(gevonden)
    supabase
      .from('huisstijlen')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle()
      .then(({ data }) => {
        setHuisstijl(data ?? null)
        setLaden(false)
      })
  }, [projectId, projecten])

  // ── Helpers ───────────────────────────────────────────────────────────────
  const accentKleur = huisstijl?.primaire_kleur ?? '#185FA5'

  function wisselProject(id) {
    setProjectId(id)
    if (id) localStorage.setItem(LS_KEY, id)
    else localStorage.removeItem(LS_KEY)
  }

  function klantNaam(p) {
    if (!p?.klanten) return ''
    return p.klanten.bedrijfsnaam || p.klanten.naam || ''
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <PageWrapper
      title="Studio"
      description="Configureer klant-apps: features, prompts, modules en documentatie."
    >
      {/* ── Projectselector balk ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4 flex-wrap">
        <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">Actief project:</span>

        <div className="relative flex-1 min-w-48">
          <select
            value={projectId}
            onChange={e => wisselProject(e.target.value)}
            className="w-full px-3 py-2 pr-9 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 appearance-none"
          >
            <option value="">— Kies een project —</option>
            {projecten.map(p => (
              <option key={p.id} value={p.id}>
                {p.naam}{klantNaam(p) ? ` — ${klantNaam(p)}` : ''}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        {project && <StatusBadge status={project.status} />}

        {project && (
          <button
            onClick={() => navigate(`/projecten/${project.id}`)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white whitespace-nowrap transition-opacity hover:opacity-90"
            style={{ background: '#185FA5' }}
          >
            Bekijk project
            <ExternalLink size={12} />
          </button>
        )}
      </div>

      {/* ── Projectcontext blok ──────────────────────────────────────────────── */}
      {project && (
        <div className="bg-gray-50 rounded-xl border border-gray-100 px-5 py-3 flex items-center gap-4 text-sm text-gray-600 flex-wrap">
          <span className="font-medium">{klantNaam(project) || '—'}</span>
          <span className="text-gray-300">|</span>
          <span className="text-gray-500">{huisstijl?.sector || project.sector || '—'}</span>
          <span className="text-gray-300">|</span>
          {huisstijl?.primaire_kleur ? (
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full border border-gray-200 flex-shrink-0"
                style={{ background: huisstijl.primaire_kleur }}
              />
              <span className="text-xs text-gray-400 font-mono">{huisstijl.primaire_kleur}</span>
            </div>
          ) : (
            <span className="text-gray-400 text-xs">Geen huisstijl</span>
          )}
        </div>
      )}

      {/* ── Geen project geselecteerd ─────────────────────────────────────── */}
      {!projectId && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-16 text-center">
          <Layers size={32} className="mx-auto mb-3 text-gray-200" />
          <p className="text-sm font-medium text-gray-400">Selecteer eerst een project bovenaan om de Studio te gebruiken.</p>
          <p className="text-xs text-gray-300 mt-2">↑ Kies een project in de dropdown hierboven</p>
        </div>
      )}

      {/* ── Project geselecteerd ─────────────────────────────────────────── */}
      {projectId && (
        <>
          {/* Kleurband */}
          <div className="rounded-full overflow-hidden" style={{ height: 4, background: accentKleur }} />

          {/* Tabs */}
          <div className="border-b border-gray-200 overflow-x-auto">
            <div className="flex gap-1 min-w-max">
              {TABS.map(t => {
                const actief = actieveTab === t.key
                return (
                  <button
                    key={t.key}
                    onClick={() => setActieveTab(t.key)}
                    style={actief ? { borderColor: accentKleur } : {}}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      actief
                        ? 'text-gray-900'
                        : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200'
                    }`}
                  >
                    {t.icon ? <t.icon size={14} /> : <span>{t.emoji}</span>}
                    {t.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tab inhoud */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm min-h-64">
            {laden ? (
              <Spinner kleur={accentKleur} />
            ) : (
              <>
                {actieveTab === 'bouwproces'   && <BouwprocesTab       project={project} />}
                {actieveTab === 'features'     && <FeatureConfigurator project={project} huisstijl={huisstijl} />}
                {actieveTab === 'prompts'      && <PromptTemplates     project={project} huisstijl={huisstijl} />}
                {actieveTab === 'modules'      && <AppModules          project={project} huisstijl={huisstijl} />}
                {actieveTab === 'blokken'      && <BlokkensBuilder     project={project} huisstijl={huisstijl} />}
                {actieveTab === 'documentatie' && <Projectdocumentatie project={project} huisstijl={huisstijl} />}
                {actieveTab === 'aicheck'     && <AiCheck            project={project} huisstijl={huisstijl} />}
              </>
            )}
          </div>
        </>
      )}
    </PageWrapper>
  )
}
