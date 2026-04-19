// BlokkensBuilder.jsx — Visueel de structuur van een klant-app samenstellen
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Save, Check, Copy, Zap, Pencil, EyeOff, Eye, Trash2, X } from 'lucide-react'

// ── Type-configuratie ─────────────────────────────────────────────────────────
const TYPE_CFG = {
  blok:      { label: 'Blok',      bg: '#dbeafe', kleur: '#1d4ed8' },
  formulier: { label: 'Formulier', bg: '#dcfce7', kleur: '#15803d' },
  grafiek:   { label: 'Grafiek',   bg: '#ede9fe', kleur: '#6d28d9' },
  visueel:   { label: 'Visueel',   bg: '#fae8ff', kleur: '#a21caf' },
  tabel:     { label: 'Tabel',     bg: '#fef9c3', kleur: '#a16207' },
}

const STANDAARD_BLOKKEN = [
  { id: crypto.randomUUID(), naam: 'Dashboard / startoverzicht',   type: 'blok',    verborgen: false },
  { id: crypto.randomUUID(), naam: 'Klantenlijst met zoekbalk',    type: 'blok',    verborgen: false },
  { id: crypto.randomUUID(), naam: 'Factuuroverzicht en status',   type: 'blok',    verborgen: false },
  { id: crypto.randomUUID(), naam: 'Reclamebanner bovenaan',       type: 'visueel', verborgen: false },
]

const TOEVOEG_TYPES = [
  { type: 'blok',      label: '+ Blok toevoegen' },
  { type: 'formulier', label: '+ Formulier toevoegen' },
  { type: 'grafiek',   label: '+ Grafiek toevoegen' },
  { type: 'visueel',   label: '+ Visueel element toevoegen' },
  { type: 'tabel',     label: '+ Tabel toevoegen' },
]

// ── Drag-and-drop helpers ─────────────────────────────────────────────────────
function herorden(lijst, vanIdx, naarIdx) {
  const nieuw = [...lijst]
  const [item] = nieuw.splice(vanIdx, 1)
  nieuw.splice(naarIdx, 0, item)
  return nieuw
}

// ── Blok rij ──────────────────────────────────────────────────────────────────
function BlokRij({
  blok, idx, totaal,
  onBewerk, onVerberg, onVerwijder,
  onDragStart, onDragOver, onDrop, sleepIdx,
  accentKleur,
}) {
  const [bewerkModus, setBewerkModus] = useState(false)
  const [bewerkNaam,  setBewerkNaam]  = useState(blok.naam)
  const inputRef = useRef()

  function startBewerk() {
    setBewerkNaam(blok.naam)
    setBewerkModus(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function bewaarNaam() {
    if (bewerkNaam.trim()) onBewerk(blok.id, bewerkNaam.trim())
    setBewerkModus(false)
  }

  const typeCfg = TYPE_CFG[blok.type] ?? TYPE_CFG.blok
  const sleepOver = sleepIdx === idx

  return (
    <div
      draggable
      onDragStart={() => onDragStart(idx)}
      onDragOver={e => { e.preventDefault(); onDragOver(idx) }}
      onDrop={() => onDrop(idx)}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all select-none ${
        blok.verborgen ? 'opacity-40' : ''
      } ${sleepOver ? 'border-blue-300 bg-blue-50 shadow-md' : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'}`}
    >
      {/* Sleepicoon */}
      <span className="text-gray-300 cursor-grab active:cursor-grabbing text-base leading-none flex-shrink-0 select-none"
        title="Slepen om te herordenen">
        ⠿
      </span>

      {/* Naam / bewerkveld */}
      <div className="flex-1 min-w-0">
        {bewerkModus ? (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              value={bewerkNaam}
              onChange={e => setBewerkNaam(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') bewaarNaam(); if (e.key === 'Escape') setBewerkModus(false) }}
              className="flex-1 text-sm px-2 py-1 rounded-lg border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400/30 min-w-0"
            />
            <button type="button" onClick={bewaarNaam}
              className="text-xs text-white px-2 py-1 rounded-lg flex-shrink-0"
              style={{ background: accentKleur }}>
              <Check size={12} />
            </button>
            <button type="button" onClick={() => setBewerkModus(false)}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0">
              <X size={13} />
            </button>
          </div>
        ) : (
          <p className={`text-sm font-medium text-gray-800 truncate ${blok.verborgen ? 'line-through text-gray-400' : ''}`}>
            {blok.naam}
          </p>
        )}
      </div>

      {/* Type badge */}
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
        style={{ background: typeCfg.bg, color: typeCfg.kleur }}>
        {typeCfg.label}
      </span>

      {/* Acties */}
      {!bewerkModus && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button type="button" onClick={startBewerk}
            title="Bewerk naam"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
            <Pencil size={12} />
          </button>
          <button type="button" onClick={() => onVerberg(blok.id)}
            title={blok.verborgen ? 'Toon blok' : 'Verberg blok'}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
            {blok.verborgen ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>
          <button type="button" onClick={() => onVerwijder(blok.id)}
            title="Verwijder blok"
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition">
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  )
}

// ── Hoofd component ───────────────────────────────────────────────────────────
export default function BlokkensBuilder({ project, huisstijl }) {
  const [blokken,     setBlokken]     = useState(STANDAARD_BLOKKEN)
  const [nieuwType,   setNieuwType]   = useState(null)   // type dat wordt toegevoegd
  const [nieuwNaam,   setNieuwNaam]   = useState('')
  const [sleepVanIdx, setSleepVanIdx] = useState(null)
  const [sleepOverIdx,setSleepOverIdx]= useState(null)
  const [prompt,      setPrompt]      = useState('')
  const [gekopieerd,  setGekopieerd]  = useState(false)
  const [opslaan,     setOpslaan]     = useState(false)
  const [opgeslagen,  setOpgeslagen]  = useState(false)
  const nieuwInputRef = useRef()

  const accentKleur = huisstijl?.primaire_kleur ?? '#185FA5'

  // ── Laad bestaande blokken ────────────────────────────────────────────────
  useEffect(() => {
    if (!project?.id) return
    supabase.from('projecten').select('blokken_json').eq('id', project.id).single()
      .then(({ data }) => {
        if (Array.isArray(data?.blokken_json) && data.blokken_json.length > 0) {
          setBlokken(data.blokken_json)
        } else {
          setBlokken(STANDAARD_BLOKKEN.map(b => ({ ...b, id: crypto.randomUUID() })))
        }
      })
  }, [project?.id])

  // ── CRUD blokken ──────────────────────────────────────────────────────────
  function bewerkBlok(id, nieuwNaam) {
    setBlokken(b => b.map(x => x.id === id ? { ...x, naam: nieuwNaam } : x))
  }

  function verbergBlok(id) {
    setBlokken(b => b.map(x => x.id === id ? { ...x, verborgen: !x.verborgen } : x))
  }

  function verwijderBlok(id) {
    setBlokken(b => b.filter(x => x.id !== id))
  }

  function startToevoegen(type) {
    setNieuwType(type)
    setNieuwNaam('')
    setTimeout(() => nieuwInputRef.current?.focus(), 50)
  }

  function voegToe() {
    if (!nieuwNaam.trim()) { setNieuwType(null); return }
    setBlokken(b => [...b, {
      id: crypto.randomUUID(),
      naam: nieuwNaam.trim(),
      type: nieuwType,
      verborgen: false,
    }])
    setNieuwNaam('')
    setNieuwType(null)
    setPrompt('')
  }

  // ── Drag & drop ───────────────────────────────────────────────────────────
  function handleDragStart(idx) { setSleepVanIdx(idx) }
  function handleDragOver(idx)  { setSleepOverIdx(idx) }
  function handleDrop(idx) {
    if (sleepVanIdx !== null && sleepVanIdx !== idx) {
      setBlokken(b => herorden(b, sleepVanIdx, idx))
      setPrompt('')
    }
    setSleepVanIdx(null)
    setSleepOverIdx(null)
  }

  // ── Prompt genereren ──────────────────────────────────────────────────────
  function genereerPrompt() {
    const zichtbaar  = blokken.filter(b => !b.verborgen)
    const verborgen  = blokken.filter(b => b.verborgen)
    const regels = zichtbaar.map(b => `- ${b.naam} [${TYPE_CFG[b.type]?.label ?? b.type}]`)
    const verborgenRegels = verborgen.map(b => `- ${b.naam} [${TYPE_CFG[b.type]?.label ?? b.type}]`)

    setPrompt(
`Bouw een app met de volgende blokken in deze volgorde:
${regels.join('\n')}
${verborgen.length > 0
  ? `\nVerborgen blokken (bouw maar zet standaard uit):\n${verborgenRegels.join('\n')}`
  : ''}

Elk blok is een aparte sectie in de navigatie.
De gebruiker kan blokken tonen/verbergen via een instellingenmenu.
${huisstijl?.primaire_kleur ? `\nGebruik als accentkleur: ${huisstijl.primaire_kleur}` : ''}
${huisstijl?.font_titel ? `Font titels: ${huisstijl.font_titel}` : ''}`.trim()
    )
  }

  // ── Opslaan ───────────────────────────────────────────────────────────────
  async function handleOpslaan() {
    if (!project?.id) return
    setOpslaan(true)
    await supabase.from('projecten').update({ blokken_json: blokken }).eq('id', project.id)
    setOpslaan(false)
    setOpgeslagen(true)
    setTimeout(() => setOpgeslagen(false), 2500)
  }

  async function kopieer() {
    await navigator.clipboard.writeText(prompt)
    setGekopieerd(true)
    setTimeout(() => setGekopieerd(false), 2000)
  }

  const zichtbaarAantal = blokken.filter(b => !b.verborgen).length
  const verborgenAantal  = blokken.filter(b => b.verborgen).length

  return (
    <div className="p-6 space-y-5">

      {/* Header + acties */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-xs text-gray-500">
          <span className="font-semibold text-gray-700">{blokken.length} blokken</span>
          {verborgenAantal > 0 && <span className="ml-2 text-gray-400">({verborgenAantal} verborgen)</span>}
          <span className="mx-2 text-gray-300">·</span>
          <span className="text-gray-400">Sleep om te herordenen</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={genereerPrompt}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white transition"
            style={{ background: accentKleur }}>
            <Zap size={12} /> Genereer blokken-prompt
          </button>
          <button type="button" onClick={handleOpslaan}
            disabled={opslaan || !project?.id}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition disabled:opacity-40">
            {opgeslagen
              ? <><Check size={12} className="text-green-500" /> Opgeslagen</>
              : <><Save size={12} /> {opslaan ? 'Opslaan...' : 'Bewaar'}</>}
          </button>
        </div>
      </div>

      {/* Canvas — blokkenlijst */}
      <div
        className="space-y-2 min-h-[120px]"
        onDragOver={e => e.preventDefault()}
        onDrop={() => handleDrop(blokken.length - 1)}
      >
        {blokken.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 rounded-xl py-10 text-center">
            <p className="text-sm text-gray-400">Nog geen blokken. Voeg er een toe hieronder.</p>
          </div>
        ) : blokken.map((blok, idx) => (
          <BlokRij
            key={blok.id}
            blok={blok}
            idx={idx}
            totaal={blokken.length}
            onBewerk={bewerkBlok}
            onVerberg={verbergBlok}
            onVerwijder={verwijderBlok}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            sleepIdx={sleepOverIdx}
            accentKleur={accentKleur}
          />
        ))}
      </div>

      {/* Inline toevoegveld */}
      {nieuwType && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-blue-200 bg-blue-50">
          <span className="text-xs font-semibold flex-shrink-0"
            style={{ color: TYPE_CFG[nieuwType]?.kleur }}>
            {TYPE_CFG[nieuwType]?.label}:
          </span>
          <input
            ref={nieuwInputRef}
            value={nieuwNaam}
            onChange={e => setNieuwNaam(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') voegToe(); if (e.key === 'Escape') setNieuwType(null) }}
            placeholder={`Naam van het ${TYPE_CFG[nieuwType]?.label.toLowerCase()}...`}
            className="flex-1 text-sm px-2 py-1 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400/30 bg-white min-w-0"
          />
          <button type="button" onClick={voegToe}
            className="flex items-center gap-1 text-xs font-semibold text-white px-3 py-1.5 rounded-lg flex-shrink-0"
            style={{ background: accentKleur }}>
            <Check size={11} /> Voeg toe
          </button>
          <button type="button" onClick={() => setNieuwType(null)}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Toevoegknoppen */}
      <div className="flex gap-2 flex-wrap">
        {TOEVOEG_TYPES.map(({ type, label }) => {
          const cfg = TYPE_CFG[type]
          return (
            <button
              key={type}
              type="button"
              onClick={() => startToevoegen(type)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition hover:shadow-sm"
              style={{
                background: nieuwType === type ? cfg.bg : 'white',
                color: nieuwType === type ? cfg.kleur : '#6b7280',
                borderColor: nieuwType === type ? cfg.kleur + '40' : '#e5e7eb',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Legenda types */}
      <div className="flex gap-3 flex-wrap">
        {Object.entries(TYPE_CFG).map(([key, cfg]) => (
          <span key={key} className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: cfg.bg, border: `1px solid ${cfg.kleur}40` }} />
            {cfg.label}
          </span>
        ))}
      </div>

      {/* Gegenereerde prompt */}
      {prompt && (
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Blokken-prompt</p>
            <button type="button" onClick={kopieer}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-500 hover:text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition">
              {gekopieerd ? <><Check size={11} /> Gekopieerd</> : <><Copy size={11} /> Kopieer</>}
            </button>
          </div>
          <textarea
            readOnly
            value={prompt}
            rows={Math.min(16, prompt.split('\n').length + 2)}
            className="w-full font-mono text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 resize-none focus:outline-none leading-relaxed"
          />
        </div>
      )}
    </div>
  )
}
