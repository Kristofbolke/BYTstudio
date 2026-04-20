// src/components/AICheck.jsx — AI-suggestiecheck met geschiedenis en export
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useInstellingen } from '../context/InstellingenContext'
import {
  Lightbulb, ChevronDown, ChevronUp, CheckCircle2, RefreshCw,
  FileText, Trash2, RotateCcw, Clock,
} from 'lucide-react'

// ── Categorie badge ────────────────────────────────────────────────────────────
const CATEGORIE_STIJL = {
  AI:             { kleur: '#7c3aed', bg: '#faf5ff' },
  UX:             { kleur: '#2563eb', bg: '#eff6ff' },
  Feature:        { kleur: '#16a34a', bg: '#f0fdf4' },
  Integratie:     { kleur: '#d97706', bg: '#fef9ee' },
  Schaalbaarheid: { kleur: '#64748b', bg: '#f1f5f9' },
}

function CategorieBadge({ cat }) {
  const s = CATEGORIE_STIJL[cat] ?? { kleur: '#64748b', bg: '#f1f5f9' }
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ color: s.kleur, background: s.bg }}
    >
      {cat}
    </span>
  )
}

// ── Helper: normaliseer toegepast_json (ondersteunt zowel strings als objecten) ─
function normaliseerToegewezen(arr) {
  if (!Array.isArray(arr)) return []
  return arr.map(item =>
    typeof item === 'string'
      ? { titel: item, datum_toegepast: new Date().toISOString() }
      : item
  )
}
function isToegewezen(lijst, titel) {
  return lijst.some(t => (typeof t === 'string' ? t : t.titel) === titel)
}

// ── Confetti (CSS-only) ────────────────────────────────────────────────────────
const CONFETTI_KLEUREN = [
  '#7c3aed', '#2563eb', '#16a34a', '#d97706', '#dc2626',
  '#ec4899', '#0891b2', '#65a30d', '#ea580c', '#8b5cf6',
]

function Confetti() {
  const deeltjes = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    kleur: CONFETTI_KLEUREN[i % CONFETTI_KLEUREN.length],
    links: Math.random() * 100,
    vertraging: Math.random() * 1.5,
    duur: 1.5 + Math.random() * 1,
    grootte: 6 + Math.random() * 8,
    rotatie: Math.random() * 360,
  }))

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <style>{`
        @keyframes confetti-val {
          0%   { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {deeltjes.map(d => (
        <div
          key={d.id}
          style={{
            position: 'absolute',
            left: `${d.links}%`,
            top: 0,
            width: d.grootte,
            height: d.grootte,
            background: d.kleur,
            borderRadius: d.id % 3 === 0 ? '50%' : d.id % 3 === 1 ? '2px' : '0',
            animation: `confetti-val ${d.duur}s ${d.vertraging}s ease-in forwards`,
          }}
        />
      ))}
    </div>
  )
}

// ── Suggestie kaart ────────────────────────────────────────────────────────────
function SuggestieKaart({ suggestie, index, toegepast, onToggleToegewezen, accentKleur, uurtarief }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const investering = (suggestie.bouwtijd ?? 0) * (uurtarief ?? 75)

  return (
    <div className={`rounded-xl border transition-colors ${
      toegepast ? 'border-green-200 bg-green-50/40' : 'border-gray-100 bg-white'
    }`}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left"
      >
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
          style={{ background: accentKleur }}
        >
          {index + 1}
        </span>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <CategorieBadge cat={suggestie.categorie} />
          <p className={`text-sm font-semibold truncate ${
            toegepast ? 'line-through text-gray-400' : 'text-gray-800'
          }`}>
            {suggestie.titel}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs text-gray-400 whitespace-nowrap">{suggestie.bouwtijd} uren</span>
          {toegepast && <CheckCircle2 size={15} className="text-green-500" />}
          {open ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-gray-50 pt-4 space-y-4">
          <p className="text-sm text-gray-700 leading-relaxed">{suggestie.beschrijving}</p>

          <div className="bg-green-50 border border-green-100 rounded-lg px-4 py-3">
            <p className="text-xs font-semibold text-green-700 mb-0.5">Meerwaarde</p>
            <p className="text-sm text-green-800 leading-relaxed">{suggestie.meerwaarde}</p>
          </div>

          <p className="text-xs text-gray-400">
            Geschatte investering: <span className="font-semibold text-gray-600">
              {suggestie.bouwtijd} uren × €{uurtarief ?? 75}/u = €{investering.toLocaleString('nl-BE')}
            </span>
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => navigate('/offertes/nieuw', {
                state: { voorgevuldRegel: {
                  omschrijving: suggestie.titel,
                  beschrijving: suggestie.beschrijving,
                  uren: suggestie.bouwtijd ?? 0,
                }},
              })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              Voeg toe aan offerte
            </button>
            <button
              onClick={() => onToggleToegewezen(suggestie.titel)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                toegepast
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <CheckCircle2 size={12} />
              {toegepast ? 'Markeer als niet toegepast' : 'Markeer als toegepast'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Laadanimatie ───────────────────────────────────────────────────────────────
const LAAD_TEKSTEN = [
  'Claude analyseert de app...',
  'Sector en features worden beoordeeld...',
  'Suggesties worden gegenereerd...',
  'Bijna klaar...',
]

function LaadIndicator() {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % LAAD_TEKSTEN.length), 2000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-purple-200 border-t-purple-600 animate-spin" />
      <p className="text-sm text-gray-500">{LAAD_TEKSTEN[idx]}</p>
    </div>
  )
}

// ── Export functie ─────────────────────────────────────────────────────────────
function genereerBriefingHtml({ projectNaam, klantnaam, suggesties, toegepastLijst, instellingen }) {
  const datum = new Date().toLocaleDateString('nl-BE', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  const uurtarief = instellingen?.uurtarief ?? 75
  const email    = instellingen?.email    ?? ''
  const website  = instellingen?.website  ?? ''
  const bedrijf  = instellingen?.bedrijfsnaam ?? 'Build Your Tools'
  const logo     = instellingen?.logo_url ?? ''

  const categorieKleur = (cat) => {
    const map = {
      AI: '#7c3aed', UX: '#2563eb', Feature: '#16a34a',
      Integratie: '#d97706', Schaalbaarheid: '#64748b',
    }
    return map[cat] ?? '#64748b'
  }

  const suggestiesHtml = suggesties.map((s, i) => {
    const investering = (s.bouwtijd ?? 0) * uurtarief
    const isToeg = isToegewezen(toegepastLijst, s.titel)
    return `
      <div class="suggestie${isToeg ? ' toegepast' : ''}">
        <div class="suggestie-header">
          <span class="nummer">${i + 1}</span>
          <div class="suggestie-meta">
            <span class="badge" style="color:${categorieKleur(s.categorie)};background:${categorieKleur(s.categorie)}18">${s.categorie}</span>
            <h3>${s.titel}${isToeg ? ' ✓' : ''}</h3>
          </div>
          <span class="bouwtijd">${s.bouwtijd} uren</span>
        </div>
        <p class="beschrijving">${s.beschrijving}</p>
        <div class="meerwaarde">
          <strong>Meerwaarde:</strong> ${s.meerwaarde}
        </div>
        <p class="investering">Geschatte investering: <strong>${s.bouwtijd} uren × €${uurtarief}/u = €${investering.toLocaleString('nl-BE')}</strong></p>
      </div>
    `
  }).join('')

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8" />
  <title>AI-analyse — ${projectNaam}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 13px; color: #1f2937; background: #fff;
      padding: 40px 48px; max-width: 860px; margin: 0 auto;
    }
    .header {
      display: flex; justify-content: space-between;
      align-items: flex-start; margin-bottom: 32px;
      padding-bottom: 20px; border-bottom: 2px solid #7c3aed;
    }
    .header-links { display: flex; align-items: center; gap: 12px; }
    .logo { height: 36px; object-fit: contain; }
    .bedrijfsnaam { font-size: 18px; font-weight: 700; color: #7c3aed; }
    .header-rechts { text-align: right; font-size: 12px; color: #6b7280; line-height: 1.6; }
    .header-rechts strong { font-size: 14px; color: #111827; }
    .intro { margin-bottom: 28px; }
    .intro h1 { font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 6px; }
    .intro p { color: #6b7280; line-height: 1.6; }
    .suggestie {
      margin-bottom: 24px; padding: 20px 24px;
      border: 1px solid #e5e7eb; border-radius: 10px;
      page-break-inside: avoid;
    }
    .suggestie.toegepast { border-color: #bbf7d0; background: #f0fdf4; }
    .suggestie-header {
      display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px;
    }
    .nummer {
      width: 24px; height: 24px; border-radius: 50%;
      background: #7c3aed; color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700; flex-shrink: 0; margin-top: 2px;
    }
    .suggestie-meta { flex: 1; }
    .badge {
      display: inline-block; padding: 2px 8px; border-radius: 20px;
      font-size: 11px; font-weight: 600; margin-bottom: 4px;
    }
    .suggestie-meta h3 { font-size: 14px; font-weight: 600; color: #111827; }
    .bouwtijd { font-size: 12px; color: #9ca3af; white-space: nowrap; margin-top: 4px; }
    .beschrijving { color: #374151; line-height: 1.7; margin-bottom: 12px; }
    .meerwaarde {
      background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;
      padding: 10px 14px; font-size: 12px; color: #166534;
      line-height: 1.6; margin-bottom: 10px;
    }
    .investering { font-size: 12px; color: #6b7280; }
    .voettekst {
      margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb;
      font-size: 11px; color: #9ca3af; text-align: center; line-height: 1.7;
    }
    @media print {
      body { padding: 20px 30px; }
      .suggestie { page-break-inside: avoid; }
      @page { size: A4; margin: 20mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-links">
      ${logo ? `<img src="${logo}" class="logo" alt="${bedrijf}" />` : ''}
      <span class="bedrijfsnaam">${bedrijf}</span>
    </div>
    <div class="header-rechts">
      <strong>AI-analyse rapport</strong><br/>
      Project: ${projectNaam}<br/>
      ${klantnaam ? `Klant: ${klantnaam}<br/>` : ''}
      Datum: ${datum}
    </div>
  </div>

  <div class="intro">
    <h1>Verbeteringsmogelijkheden voor ${projectNaam}</h1>
    <p>Op basis van analyse van uw app hebben wij de volgende verbeteringsmogelijkheden geïdentificeerd:</p>
  </div>

  ${suggestiesHtml}

  <div class="voettekst">
    ${bedrijf}${email ? ` — ${email}` : ''}${website ? ` — ${website}` : ''}<br/>
    Deze analyse is gegenereerd met behulp van Claude AI en dient als vrijblijvend advies.
  </div>

  <script>window.onload = () => window.print()</script>
</body>
</html>`
}

// ── Hoofd component ────────────────────────────────────────────────────────────
export default function AICheck({ projectId, projectNaam, klantnaam, sector, features, huisstijl }) {
  const { instellingen } = useInstellingen()
  const accentKleur = huisstijl?.primaire_kleur ?? '#7c3aed'

  const [laden,             setLaden]            = useState(false)
  const [fout,              setFout]             = useState('')
  const [suggesties,        setSuggesties]        = useState([])
  const [toegepast,         setToegewezen]        = useState([])  // array van { titel, datum_toegepast }
  const [checkId,           setCheckId]           = useState(null)
  const [checkDatum,        setCheckDatum]        = useState(null)
  const [toonConfetti,      setToonConfetti]      = useState(false)

  // Geschiedenis
  const [geschiedenis,      setGeschiedenis]      = useState([])
  const [geschiedenisOpen,  setGeschiedenisOpen]  = useState(false)
  const [ladenGesch,        setLadenGesch]        = useState(true)

  // Laad alle checks bij mount
  useEffect(() => {
    if (!projectId) return
    laadGeschiedenis()
  }, [projectId])

  async function laadGeschiedenis() {
    setLadenGesch(true)
    const { data } = await supabase
      .from('ai_checks')
      .select('*')
      .eq('project_id', projectId)
      .order('aangemaakt_op', { ascending: false })
    const lijst = data ?? []
    setGeschiedenis(lijst)
    // Toon automatisch de meest recente check
    if (lijst.length > 0 && suggesties.length === 0) {
      herstelCheck(lijst[0], false)
    }
    setLadenGesch(false)
  }

  function herstelCheck(check, scrollNaar = true) {
    const sg = check.suggesties_json?.suggesties ?? []
    const tp = normaliseerToegewezen(check.toegepast_json ?? [])
    setSuggesties(sg)
    setToegewezen(tp)
    setCheckId(check.id)
    setCheckDatum(check.aangemaakt_op)
    if (scrollNaar) window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function verwijderCheck(teVerwijderenId) {
    await supabase.from('ai_checks').delete().eq('id', teVerwijderenId)
    const nieuweLijst = geschiedenis.filter(c => c.id !== teVerwijderenId)
    setGeschiedenis(nieuweLijst)
    // Als de actieve check verwijderd werd, laad de volgende
    if (teVerwijderenId === checkId) {
      if (nieuweLijst.length > 0) {
        herstelCheck(nieuweLijst[0], false)
      } else {
        setSuggesties([])
        setToegewezen([])
        setCheckId(null)
        setCheckDatum(null)
      }
    }
  }

  async function voerCheckUit() {
    setLaden(true)
    setFout('')

    const context = `
Project: ${projectNaam}
Sector: ${sector ?? 'KMO, België'}
Geselecteerde features: ${(features ?? []).join(', ') || 'geen'}
Primaire kleur: ${huisstijl?.primaire_kleur ?? 'onbekend'}
Doelgroep: ${huisstijl?.stijlomschrijving ?? 'onbekend'}

Analyseer deze KMO-app en geef 5 concrete suggesties om de app slimmer, efficiënter en waardevoller te maken voor de klant. Focus op AI-mogelijkheden, automatisaties en sectorspecifieke verbeteringen.
    `.trim()

    const { data, error } = await supabase.functions.invoke('ai-check', {
      body: { projectContext: context },
    })

    if (error || data?.error) {
      setFout(error?.message ?? data?.error ?? 'Check mislukt. Probeer opnieuw.')
      setLaden(false)
      return
    }

    const { data: nieuw, error: dbErr } = await supabase
      .from('ai_checks')
      .insert({
        project_id: projectId,
        project_context: context,
        suggesties_json: data,
        gelezen: false,
        toegepast_json: [],
      })
      .select()
      .single()

    if (dbErr) {
      setFout(dbErr.message)
      setLaden(false)
      return
    }

    setSuggesties(data.suggesties ?? [])
    setToegewezen([])
    setCheckId(nieuw.id)
    setCheckDatum(nieuw.aangemaakt_op)
    setGeschiedenis(prev => [nieuw, ...prev])
    setLaden(false)
  }

  async function toggleToegewezen(titel) {
    const wasToegepast = isToegewezen(toegepast, titel)
    const nieuw = wasToegepast
      ? toegepast.filter(t => (typeof t === 'string' ? t : t.titel) !== titel)
      : [...toegepast, { titel, datum_toegepast: new Date().toISOString() }]

    setToegewezen(nieuw)

    if (checkId) {
      await supabase.from('ai_checks').update({ toegepast_json: nieuw }).eq('id', checkId)
    }

    // Confetti als alles toegepast
    if (!wasToegepast && nieuw.length === suggesties.length && suggesties.length > 0) {
      setToonConfetti(true)
      setTimeout(() => setToonConfetti(false), 3500)
    }
  }

  function exporteerBriefing() {
    const html = genereerBriefingHtml({
      projectNaam,
      klantnaam,
      suggesties,
      toegepastLijst: toegepast,
      instellingen,
    })
    const venster = window.open('', '_blank')
    if (venster) {
      venster.document.write(html)
      venster.document.close()
    }
  }

  // ── Berekeningen ─────────────────────────────────────────────────────────────
  const heeftResultaat     = suggesties.length > 0
  const aantalToegewezen   = toegepast.length
  const allesKlaar         = heeftResultaat && aantalToegewezen === suggesties.length
  const voortgangProcent   = suggesties.length
    ? Math.round((aantalToegewezen / suggesties.length) * 100)
    : 0
  const datumLabel = checkDatum
    ? new Date(checkDatum).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' })
    : null
  const voorigeChecks = geschiedenis.filter(c => c.id !== checkId)

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-5">
      {toonConfetti && <Confetti />}

      {/* TOESTAND 2: Laden */}
      {laden && <LaadIndicator />}

      {/* TOESTAND 1: Leeg */}
      {!laden && !heeftResultaat && (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: `${accentKleur}15` }}
          >
            <Lightbulb size={26} style={{ color: accentKleur }} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800 mb-1">AI-suggestiecheck uitvoeren</p>
            <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
              Claude analyseert jouw app en geeft 5 concrete verbeteringsuggesties
            </p>
          </div>
          <button
            onClick={voerCheckUit}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: accentKleur }}
          >
            <Lightbulb size={15} />
            Start analyse
          </button>
          {fout && <p className="text-xs text-red-500">{fout}</p>}
        </div>
      )}

      {/* TOESTAND 3: Resultaat */}
      {!laden && heeftResultaat && (
        <div className="space-y-4">

          {/* Voortgangsbalk */}
          <div className={`rounded-xl px-5 py-4 border ${
            allesKlaar ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <p className={`text-sm font-semibold ${allesKlaar ? 'text-green-700' : 'text-gray-800'}`}>
                {allesKlaar
                  ? 'Alle suggesties verwerkt!'
                  : `${aantalToegewezen} van ${suggesties.length} suggesties toegepast`}
              </p>
              <span className="text-xs font-bold" style={{ color: accentKleur }}>{voortgangProcent}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${voortgangProcent}%`, background: allesKlaar ? '#16a34a' : accentKleur }}
              />
            </div>
            {allesKlaar && (
              <p className="text-xs text-green-600 mt-2 leading-relaxed">
                Voer een nieuwe check uit voor verse ideeën.
              </p>
            )}
          </div>

          {/* Datum + acties header */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            {datumLabel && (
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Clock size={11} /> Analyse van {datumLabel}
              </p>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={exporteerBriefing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors"
              >
                <FileText size={12} />
                Exporteer als klantbriefing
              </button>
              <button
                onClick={voerCheckUit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <RefreshCw size={12} />
                Nieuwe check
              </button>
            </div>
          </div>

          {/* Suggestie kaarten */}
          {suggesties.map((s, i) => (
            <SuggestieKaart
              key={i}
              suggestie={s}
              index={i}
              toegepast={isToegewezen(toegepast, s.titel)}
              onToggleToegewezen={toggleToegewezen}
              accentKleur={accentKleur}
              uurtarief={instellingen?.uurtarief ?? 75}
            />
          ))}

          {fout && <p className="text-xs text-red-500">{fout}</p>}

          {/* ── Geschiedenis ──────────────────────────────────────────────── */}
          {voorigeChecks.length > 0 && (
            <div className="rounded-xl border border-gray-100 bg-gray-50/50 overflow-hidden">
              <button
                onClick={() => setGeschiedenisOpen(v => !v)}
                className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50 transition-colors"
              >
                <p className="text-xs font-semibold text-gray-600">
                  Vorige checks ({voorigeChecks.length})
                </p>
                {geschiedenisOpen
                  ? <ChevronUp size={14} className="text-gray-400" />
                  : <ChevronDown size={14} className="text-gray-400" />}
              </button>

              {geschiedenisOpen && (
                <div className="divide-y divide-gray-100 border-t border-gray-100">
                  {voorigeChecks.map(c => {
                    const sg = c.suggesties_json?.suggesties ?? []
                    const tp = c.toegepast_json ?? []
                    const preview = sg.slice(0, 3).map(s => s.titel)
                    const datum = new Date(c.aangemaakt_op).toLocaleDateString('nl-BE', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })
                    return (
                      <div key={c.id} className="px-5 py-4 bg-white hover:bg-gray-50/60 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-700 mb-1">{datum}</p>
                            <div className="space-y-0.5">
                              {preview.map((titel, i) => (
                                <p key={i} className="text-xs text-gray-400 truncate">· {titel}</p>
                              ))}
                              {sg.length > 3 && (
                                <p className="text-xs text-gray-300">+ {sg.length - 3} meer</p>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-1.5">
                              {normaliseerToegewezen(tp).length}/{sg.length} toegepast
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => herstelCheck(c)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 hover:border-gray-300 bg-white transition-colors"
                            >
                              <RotateCcw size={11} />
                              Herstel
                            </button>
                            <button
                              onClick={() => verwijderCheck(c.id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-500 border border-red-100 hover:bg-red-50 bg-white transition-colors"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  )
}
