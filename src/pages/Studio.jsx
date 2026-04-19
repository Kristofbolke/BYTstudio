// Studio.jsx — Hart van BYT Studio: configureer klant-apps per project
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import PageWrapper from '../components/PageWrapper'
import { ChevronDown, Layers } from 'lucide-react'

import FeatureConfigurator  from '../components/studio/FeatureConfigurator'
import PromptTemplates      from '../components/studio/PromptTemplates'
import AppModules           from '../components/studio/AppModules'
import BlokkensBuilder      from '../components/studio/BlokkensBuilder'
import Projectdocumentatie  from '../components/studio/Projectdocumentatie'

// ── Tabs definitie ────────────────────────────────────────────────────────────
const TABS = [
  { key: 'features',       label: 'Feature-configurator', emoji: '⚙️' },
  { key: 'prompts',        label: 'Prompt-templates',     emoji: '💬' },
  { key: 'modules',        label: 'App-modules',          emoji: '🧩' },
  { key: 'blokken',        label: 'Blokken-builder',      emoji: '🏗️' },
  { key: 'documentatie',   label: 'Projectdocumentatie',  emoji: '📄' },
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
  const [projecten,   setProjecten]   = useState([])
  const [projectId,   setProjectId]   = useState('')
  const [project,     setProject]     = useState(null)
  const [huisstijl,   setHuisstijl]   = useState(null)
  const [laden,       setLaden]       = useState(false)
  const [actieveTab,  setActieveTab]  = useState('features')

  // ── Laad alle projecten ───────────────────────────────────────────────────
  useEffect(() => {
    supabase
      .from('projecten')
      .select('id, naam, status, klanten(naam, bedrijfsnaam)')
      .order('naam')
      .then(({ data }) => setProjecten(data ?? []))
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
      {/* ── Project dropdown ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-end gap-4">
        <div className="flex-1 max-w-sm">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">
            Actief project
          </label>
          <div className="relative">
            <select
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              className="w-full px-3 py-2.5 pr-9 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 appearance-none"
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
        </div>

        {/* Huisstijl-indicator */}
        {huisstijl && (
          <div className="flex items-center gap-2 pb-0.5">
            {[huisstijl.primaire_kleur, huisstijl.secundaire_kleur, huisstijl.accent_kleur]
              .filter(Boolean)
              .map((k, i) => (
                <div key={i} className="w-5 h-5 rounded-md border border-gray-200 shadow-sm"
                  style={{ background: k }} />
              ))}
            <span className="text-xs text-gray-400 ml-1">{huisstijl.font_titel}</span>
          </div>
        )}
      </div>

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
                    <span>{t.emoji}</span>
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
                {actieveTab === 'features'     && <FeatureConfigurator project={project} huisstijl={huisstijl} />}
                {actieveTab === 'prompts'      && <PromptTemplates     project={project} huisstijl={huisstijl} />}
                {actieveTab === 'modules'      && <AppModules          project={project} huisstijl={huisstijl} />}
                {actieveTab === 'blokken'      && <BlokkensBuilder     project={project} huisstijl={huisstijl} />}
                {actieveTab === 'documentatie' && <Projectdocumentatie project={project} huisstijl={huisstijl} />}
              </>
            )}
          </div>
        </>
      )}
    </PageWrapper>
  )
}
