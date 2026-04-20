// src/components/studio/AiCheck.jsx — AI-suggestiecheck via Edge Function
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Sparkles, Clock, CheckCircle2, ChevronDown, ChevronUp, RefreshCw, Zap } from 'lucide-react'

// ── Categorie kleuren ──────────────────────────────────────────────────────
const CATEGORIE_STIJL = {
  AI:              { kleur: '#7c3aed', bg: '#faf5ff' },
  UX:              { kleur: '#2563eb', bg: '#eff6ff' },
  Feature:         { kleur: '#16a34a', bg: '#f0fdf4' },
  Integratie:      { kleur: '#d97706', bg: '#fef9ee' },
  Schaalbaarheid:  { kleur: '#dc2626', bg: '#fef2f2' },
}

function CategorieBadge({ cat }) {
  const s = CATEGORIE_STIJL[cat] ?? { kleur: '#64748b', bg: '#f1f5f9' }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ color: s.kleur, background: s.bg }}>
      {cat}
    </span>
  )
}

function SuggestieKaart({ suggestie, toegepast, onToggle }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`rounded-xl border transition-colors ${toegepast ? 'border-green-200 bg-green-50/40' : 'border-gray-100 bg-white'}`}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-start justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <CategorieBadge cat={suggestie.categorie} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${toegepast ? 'line-through text-gray-400' : 'text-gray-800'}`}>
              {suggestie.titel}
            </p>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <Clock size={11} /> ≈ {suggestie.bouwtijd} uur
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {toegepast && <CheckCircle2 size={16} className="text-green-500" />}
          {open ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-4 border-t border-gray-50 pt-3 space-y-3">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Beschrijving</p>
            <p className="text-sm text-gray-700 leading-relaxed">{suggestie.beschrijving}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Meerwaarde</p>
            <p className="text-sm text-gray-600">{suggestie.meerwaarde}</p>
          </div>
          <button
            onClick={() => onToggle(suggestie.titel)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              toegepast
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <CheckCircle2 size={13} />
            {toegepast ? 'Markeer als niet toegepast' : 'Markeer als toegepast'}
          </button>
        </div>
      )}
    </div>
  )
}

function CheckGeschiedenisItem({ check, actief, onClick }) {
  const datum = new Date(check.aangemaakt_op).toLocaleDateString('nl-BE', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
  const aantalToegewezen = (check.toegepast_json ?? []).length
  const aantalTotaal = (check.suggesties_json?.suggesties ?? []).length
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-left transition-colors ${
        actief ? 'bg-purple-50 border border-purple-200' : 'hover:bg-gray-50 border border-transparent'
      }`}
    >
      <div>
        <p className="text-xs font-semibold text-gray-700">{datum}</p>
        <p className="text-xs text-gray-400 mt-0.5">{aantalToegewezen}/{aantalTotaal} toegepast</p>
      </div>
      {!check.gelezen && (
        <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
      )}
    </button>
  )
}

// ── Hoofd component ────────────────────────────────────────────────────────
export default function AiCheck({ project, huisstijl }) {
  const accentKleur = huisstijl?.primaire_kleur ?? '#7c3aed'

  const [checks,       setChecks]       = useState([])
  const [actiefCheck,  setActiefCheck]  = useState(null)
  const [laden,        setLaden]        = useState(true)
  const [analyseren,   setAnalyseren]   = useState(false)
  const [fout,         setFout]         = useState('')

  useEffect(() => {
    if (!project?.id) return
    laadChecks()
  }, [project?.id])

  async function laadChecks() {
    setLaden(true)
    const { data } = await supabase
      .from('ai_checks')
      .select('*')
      .eq('project_id', project.id)
      .order('aangemaakt_op', { ascending: false })
    const lijst = data ?? []
    setChecks(lijst)
    if (lijst.length > 0) setActiefCheck(lijst[0])
    setLaden(false)
  }

  function bouwContext() {
    const modules = Array.isArray(project.features_json?.modules)
      ? project.features_json.modules.join(', ')
      : 'geen modules geconfigureerd'
    const klantNaam = project.klanten?.bedrijfsnaam || project.klanten?.naam || 'onbekende klant'
    return [
      `Projectnaam: ${project.naam}`,
      `Klant: ${klantNaam}`,
      `Status: ${project.status ?? 'onbekend'}`,
      `Beschrijving: ${project.beschrijving ?? 'geen beschrijving'}`,
      `Geconfigureerde modules: ${modules}`,
      `Sector/context: KMO, België`,
    ].join('\n')
  }

  async function voerAnalyseUit() {
    setAnalyseren(true)
    setFout('')
    const context = bouwContext()

    try {
      const { data, error } = await supabase.functions.invoke('ai-check', {
        body: { projectContext: context },
      })
      if (error) throw new Error(error.message)
      if (data?.error) throw new Error(data.error)

      // Opslaan in ai_checks tabel
      const { data: nieuw, error: dbErr } = await supabase
        .from('ai_checks')
        .insert({
          project_id: project.id,
          project_context: context,
          suggesties_json: data,
          gelezen: false,
          toegepast_json: [],
        })
        .select()
        .single()

      if (dbErr) throw new Error(dbErr.message)
      setChecks(prev => [nieuw, ...prev])
      setActiefCheck(nieuw)
    } catch (e) {
      setFout(e.message ?? 'Onbekende fout')
    }
    setAnalyseren(false)
  }

  async function markeerGelezen(check) {
    if (check.gelezen) return
    await supabase.from('ai_checks').update({ gelezen: true }).eq('id', check.id)
    setChecks(prev => prev.map(c => c.id === check.id ? { ...c, gelezen: true } : c))
    setActiefCheck(prev => prev?.id === check.id ? { ...prev, gelezen: true } : prev)
  }

  async function toggleToegewezen(checkId, titel) {
    const check = checks.find(c => c.id === checkId)
    if (!check) return
    const huidig = check.toegepast_json ?? []
    const nieuw = huidig.includes(titel) ? huidig.filter(t => t !== titel) : [...huidig, titel]
    await supabase.from('ai_checks').update({ toegepast_json: nieuw }).eq('id', checkId)
    const bijgewerkt = { ...check, toegepast_json: nieuw }
    setChecks(prev => prev.map(c => c.id === checkId ? bijgewerkt : c))
    setActiefCheck(prev => prev?.id === checkId ? bijgewerkt : prev)
  }

  const suggesties = actiefCheck?.suggesties_json?.suggesties ?? []
  const toegepastLijst = actiefCheck?.toegepast_json ?? []

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} style={{ color: accentKleur }} />
            <h2 className="text-sm font-bold text-gray-800">AI-suggestiecheck</h2>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed max-w-lg">
            Claude analyseert dit project en geeft 5 concrete, prioritaire verbeteringsuggesties
            op maat van de sector en de geconfigureerde modules.
          </p>
        </div>
        <button
          onClick={voerAnalyseUit}
          disabled={analyseren}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 transition-opacity flex-shrink-0"
          style={{ background: accentKleur }}
        >
          {analyseren
            ? <><RefreshCw size={14} className="animate-spin" /> Analyseren...</>
            : <><Zap size={14} /> Analyseer dit project</>}
        </button>
      </div>

      {fout && (
        <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
          Fout: {fout}
        </div>
      )}

      {laden ? (
        <div className="flex items-center justify-center py-16 text-gray-300">
          <RefreshCw size={20} className="animate-spin" />
        </div>
      ) : checks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Sparkles size={32} className="text-gray-200 mb-3" />
          <p className="text-sm font-medium text-gray-400">Nog geen analyses uitgevoerd.</p>
          <p className="text-xs text-gray-300 mt-1">Klik op "Analyseer dit project" om te starten.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* Geschiede­nis sidebar */}
          <div className="lg:col-span-1 space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">Vorige analyses</p>
            {checks.map(c => (
              <CheckGeschiedenisItem
                key={c.id}
                check={c}
                actief={actiefCheck?.id === c.id}
                onClick={() => { setActiefCheck(c); markeerGelezen(c) }}
              />
            ))}
          </div>

          {/* Suggesties */}
          <div className="lg:col-span-3 space-y-3">
            {actiefCheck && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    {new Date(actiefCheck.aangemaakt_op).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {' · '}{toegepastLijst.length}/{suggesties.length} toegepast
                  </p>
                  <div className="h-1.5 w-32 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{
                      width: suggesties.length ? `${(toegepastLijst.length / suggesties.length) * 100}%` : '0%',
                      background: accentKleur,
                    }} />
                  </div>
                </div>

                {suggesties.length === 0 ? (
                  <p className="text-sm text-gray-400 py-8 text-center">Geen suggesties in deze analyse.</p>
                ) : (
                  suggesties.map((s, i) => (
                    <SuggestieKaart
                      key={i}
                      suggestie={s}
                      toegepast={toegepastLijst.includes(s.titel)}
                      onToggle={titel => toggleToegewezen(actiefCheck.id, titel)}
                    />
                  ))
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
