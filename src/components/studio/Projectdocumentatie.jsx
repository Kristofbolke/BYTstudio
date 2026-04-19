// Projectdocumentatie.jsx — Alle documentatie van een project in één overzicht
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { MODULES_DATA } from './modulesData'
import {
  Copy, Check, ChevronDown, ChevronRight,
  ExternalLink, FileText, Zap, BookOpen, Edit3,
} from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n) {
  return Number(n).toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function KopieKnop({ tekst, label = 'Kopieer' }) {
  const [ok, setOk] = useState(false)
  async function kopieer() {
    await navigator.clipboard.writeText(tekst)
    setOk(true)
    setTimeout(() => setOk(false), 2000)
  }
  return (
    <button type="button" onClick={kopieer}
      className="flex items-center gap-1.5 text-xs font-semibold text-blue-500 hover:text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition">
      {ok ? <><Check size={11} /> Gekopieerd</> : <><Copy size={11} /> {label}</>}
    </button>
  )
}

function Sectie({ titel, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition text-left">
        <span className="text-sm font-bold text-gray-700">{titel}</span>
        {open ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
      </button>
      {open && <div className="px-5 py-5 space-y-4 bg-white">{children}</div>}
    </div>
  )
}

// ── Sectie 1: Mappenstructuur ─────────────────────────────────────────────────
function mappenStructuur(geselecteerdeModules) {
  const pages = ['Login.jsx', 'Dashboard.jsx']
  const components = []

  const map = {
    login:       { page: null,              comp: null },
    factuur:     { page: 'Facturen.jsx',    comp: 'factuur/' },
    klanten:     { page: 'Klanten.jsx',     comp: 'klanten/' },
    reservaties: { page: 'Reservaties.jsx', comp: 'kalender/' },
    offerte:     { page: 'Offertes.jsx',    comp: 'offerte/' },
    dashboard:   { page: null,              comp: 'charts/' },
    calculator:  { page: 'Calculator.jsx',  comp: null },
    banner:      { page: null,              comp: 'Banner.jsx' },
    mail:        { page: null,              comp: null },
    export:      { page: 'Export.jsx',      comp: null },
    bugs:        { page: 'Meldingen.jsx',   comp: null },
    handleiding_gebruiker: { page: 'Handleiding.jsx', comp: null },
    handleiding_tech:      { page: null,              comp: null },
  }

  geselecteerdeModules.forEach(key => {
    const m = map[key]
    if (!m) return
    if (m.page && !pages.includes(m.page)) pages.push(m.page)
    if (m.comp && !components.includes(m.comp)) components.push(m.comp)
  })

  const pagesRegels = pages.map((p, i) =>
    `│   │   ${i === pages.length - 1 ? '└──' : '├──'} ${p}`).join('\n')
  const compRegels = components.length
    ? components.map((c, i) =>
        `│   │   ${i === components.length - 1 ? '└──' : '├──'} ${c}`).join('\n')
    : '│   │   └── (gemeenschappelijke componenten)'

  return `mijn-app/
├── index.html
├── README.md
├── .env.example
├── package.json
├── vite.config.js
├── tailwind.config.js
├── src/
│   ├── pages/
${pagesRegels}
│   ├── components/
${compRegels}
│   ├── lib/
│   │   └── supabase.js
│   ├── hooks/
│   ├── utils/
│   └── styles/
│       └── index.css
├── docs/
│   ├── gebruikershandleiding.md
│   └── technische-handleiding.md
└── supabase/
    └── migrations/`
}

function mappenPrompt(structuur, projectNaam) {
  return `Maak de volgende mappenstructuur aan voor het project "${projectNaam ?? 'mijn-app'}":

\`\`\`
${structuur}
\`\`\`

Maak alle bestanden en mappen aan. Gebruik React + Vite + Tailwind CSS.
Voeg een minimale inhoud toe aan elk bestand zodat de app opstart zonder errors.`
}

// ── Sectie 2: Externe diensten ────────────────────────────────────────────────
const ALTIJD_DIENSTEN = [
  { key: 'github',   naam: 'GitHub',   categorie: 'Versiebeheer', prijs: 0,    url: 'https://github.com',      env: [] },
  { key: 'netlify',  naam: 'Netlify',  categorie: 'Hosting',      prijs: 0,    url: 'https://netlify.com',     env: [] },
  { key: 'supabase', naam: 'Supabase', categorie: 'Database',     prijs: 0,    url: 'https://supabase.com',    env: ['VITE_SUPABASE_URL=', 'VITE_SUPABASE_ANON_KEY='] },
]

const CONDITIONELE_DIENSTEN = [
  { key: 'resend',      naam: 'Resend',      categorie: 'E-mail',     prijs: 0,   url: 'https://resend.com',      env: ['RESEND_API_KEY='],        features: ['mail', 'bevestigingsmail', 'auto_mail'] },
  { key: 'railway',     naam: 'Railway',     categorie: 'Backend',    prijs: 5,   url: 'https://railway.app',    env: ['RAILWAY_URL='],            features: ['server'] },
  { key: 'cloudinary',  naam: 'Cloudinary',  categorie: 'Media',      prijs: 0,   url: 'https://cloudinary.com', env: ['CLOUDINARY_URL='],         features: ['media', 'afbeeldingen'] },
  { key: 'stripe',      naam: 'Stripe',      categorie: 'Betalingen', prijs: 0,   url: 'https://stripe.com',     env: ['STRIPE_PUBLIC_KEY=', 'STRIPE_SECRET_KEY='], features: ['betaling', 'betaalmodule'] },
]

function dienstenVoorFeatures(featuresJson) {
  const alleFeatures = [
    ...Object.keys(featuresJson ?? {}),
    ...(featuresJson?.modules ?? []),
  ]
  return CONDITIONELE_DIENSTEN.filter(d =>
    d.features.some(f => alleFeatures.includes(f))
  )
}

// ── Sectie 3: Prijsraming ─────────────────────────────────────────────────────
function ureninitState(geselecteerdeModuleKeys) {
  const staat = {}
  geselecteerdeModuleKeys.forEach(key => {
    const mod = MODULES_DATA.find(m => m.key === key)
    if (mod) staat[key] = mod.tijd
  })
  return staat
}

// ── Volgende stappen ──────────────────────────────────────────────────────────
const STAPPEN = {
  intake: [
    'Huisstijl invullen in het Huisstijl-tabblad',
    'Features selecteren in de Feature-configurator',
    'App-modules kiezen in App-modules tabblad',
    'Offerte genereren en versturen naar klant',
  ],
  offerte: [
    'Wachten op goedkeuring klant',
    'GitHub repository aanmaken',
    'Supabase project aanmaken en migraties uitvoeren',
    'Development starten in Claude Code',
  ],
  in_ontwikkeling: [
    'Module per module bouwen en testen',
    'Regelmatig deployen naar Netlify of Railway',
    'Klant tussentijds laten testen en feedback verwerken',
    'Bug-meldingen opvolgen in Meldingen-tabblad',
  ],
  afgeleverd: [
    'Gebruikershandleiding genereren voor de klant',
    'Technische handleiding schrijven voor onderhoud',
    'Klant trainen op de app',
    'Onderhoudscontract bespreken',
  ],
  onderhoud: [
    'Bug-meldingen opvolgen',
    'Updates en verbeteringen plannen',
    'Maandelijkse backup controleren',
    'Klant tevredenheid opvolgen',
  ],
}

const STATUS_LABEL = {
  intake: 'Intake',
  offerte: 'Offerte',
  in_ontwikkeling: 'In ontwikkeling',
  afgeleverd: 'Afgeleverd',
  onderhoud: 'Onderhoud',
}

// ── Hoofd component ───────────────────────────────────────────────────────────
export default function Projectdocumentatie({ project, huisstijl }) {
  const navigate = useNavigate()

  const [featuresJson,  setFeaturesJson]  = useState(null)
  const [uurtarief,     setUurtarief]     = useState(75)
  const [btw,           setBtw]           = useState(21)
  const [uren,          setUren]          = useState({})
  const [diensten,      setDiensten]      = useState({})   // { [key]: aangemaakt: bool }
  const [stappen,       setStappen]       = useState({})   // { [stap]: afgevinkt: bool }
  const [envGekopieerd,  setEnvGekopieerd]  = useState(false)
  const [handleidingen,  setHandleidingen]  = useState([])

  // ── Data laden ────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.from('instellingen').select('uurtarief').limit(1).single()
      .then(({ data }) => { if (data?.uurtarief) setUurtarief(Number(data.uurtarief)) })
  }, [])

  useEffect(() => {
    if (!project?.id) return
    supabase.from('projecten').select('features_json').eq('id', project.id).single()
      .then(({ data }) => {
        const fj = data?.features_json ?? {}
        setFeaturesJson(fj)
        const modules = Array.isArray(fj.modules) ? fj.modules : []
        setUren(ureninitState(modules))
      })
    supabase.from('handleidingen').select('id, type').eq('project_id', project.id)
      .then(({ data }) => setHandleidingen(data ?? []))
  }, [project?.id])

  // ── Berekeningen ──────────────────────────────────────────────────────────
  const geselecteerdeModuleKeys = Object.keys(uren)
  const geselecteerdeModules    = geselecteerdeModuleKeys
    .map(key => MODULES_DATA.find(m => m.key === key))
    .filter(Boolean)

  const subtotaalUren  = Object.values(uren).reduce((s, u) => s + Number(u), 0)
  const subtotaalExcl  = subtotaalUren * uurtarief
  const btwBedrag      = subtotaalExcl * (btw / 100)
  const totaalIncl     = subtotaalExcl + btwBedrag

  const structuur      = mappenStructuur(geselecteerdeModuleKeys)
  const conditioDiensten = featuresJson ? dienstenVoorFeatures(featuresJson) : []
  const alleDiensten   = [...ALTIJD_DIENSTEN, ...conditioDiensten]
  const totaalPrijs    = alleDiensten.reduce((s, d) => s + d.prijs, 0)

  // .env.example genereren
  const envLines = alleDiensten.flatMap(d => d.env)
  const envTekst = envLines.length
    ? `# Environment variables\n${envLines.join('\n')}`
    : '# Geen externe diensten geselecteerd'

  // Navigeer naar nieuwe offerte
  function naarOfferte() {
    const params = new URLSearchParams({ project_id: project.id })
    navigate(`/offertes/nieuw?${params.toString()}`)
  }

  // ── Handleidingen: status + prompt ────────────────────────────────────────
  const gebruikerH = handleidingen.find(h => h.type === 'gebruiker') ?? null
  const technischH = handleidingen.find(h => h.type === 'technisch') ?? null
  const bedrijfsnaam = project?.klanten?.bedrijfsnaam || project?.klanten?.naam || project?.naam || 'het bedrijf'
  const moduleLijst  = geselecteerdeModules.map(m => `- ${m.naam}`).join('\n') || '- (nog geen modules geselecteerd)'
  const dienstenLijst = alleDiensten.map(d => d.naam).join(', ') || 'GitHub, Netlify, Supabase'

  const promptGebruiker = `Schrijf een volledige gebruikershandleiding in eenvoudig Nederlands voor ${bedrijfsnaam}.

De app bevat deze modules:
${moduleLijst}

Externe diensten: ${dienstenLijst}

Structuur:
1. Inleiding
2. Inloggen en navigeren
${geselecteerdeModules.map((m, i) => `${i + 3}. ${m.naam}`).join('\n')}
${geselecteerdeModules.length + 3}. Veelgestelde vragen
${geselecteerdeModules.length + 4}. Problemen melden

Stijl: eenvoudig, geen jargon, genummerde stappen, A4 afdrukbaar.
Schrijf in Markdown. Gebruik ## voor elke sectie en maak de tekst leesbaar voor een niet-technische gebruiker.`

  const promptTechnisch = `Schrijf een volledige technische handleiding in het Nederlands voor het project ${project?.naam ?? 'mijn-app'} (klant: ${bedrijfsnaam}).

Tech stack: React 18 + Vite + Tailwind CSS + Supabase (PostgreSQL + Auth)

Actieve modules:
${moduleLijst}

Externe diensten: ${dienstenLijst}

Structuur:
1. Projectoverzicht en architectuur
2. Lokale installatie (git clone, npm install, .env)
3. Environment variables (tabel met alle variabelen)
4. Deployment (GitHub → Netlify/Railway workflow)
5. Databasestructuur en Supabase-migraties
6. Updates uitvoeren (stap-voor-stap procedure)
7. Veelvoorkomende fouten en oplossingen

Schrijf in Markdown. Gebruik code-blokken voor commando's en configuratie.
Doelgroep: developer die het project overneemt of onderhoudt.`

  return (
    <div className="p-6 space-y-4">

      {/* ── Sectie 1: Mappenstructuur ──────────────────────────────────── */}
      <Sectie titel="📁 Mappenstructuur">
        <p className="text-xs text-gray-500">
          Gegenereerd op basis van{' '}
          <strong>{geselecteerdeModuleKeys.length} geselecteerde modules</strong>.
          Selecteer modules in het App-modules tabblad om de structuur aan te passen.
        </p>
        <div className="relative">
          <pre className="text-xs font-mono text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 overflow-x-auto leading-relaxed whitespace-pre">
            {structuur}
          </pre>
        </div>
        <div className="flex gap-2 flex-wrap">
          <KopieKnop tekst={structuur} label="Kopieer mappenstructuur" />
          <KopieKnop
            tekst={mappenPrompt(structuur, project?.naam)}
            label="Genereer als prompt voor Claude"
          />
        </div>
      </Sectie>

      {/* ── Sectie 2: Externe diensten ─────────────────────────────────── */}
      <Sectie titel="🔗 Externe diensten">
        <div className="space-y-2">
          {alleDiensten.map(d => (
            <div key={d.key}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition">
              {/* Checkbox account aangemaakt */}
              <input
                type="checkbox"
                checked={!!diensten[d.key]}
                onChange={e => setDiensten(v => ({ ...v, [d.key]: e.target.checked }))}
                className="w-4 h-4 rounded flex-shrink-0"
                style={{ accentColor: huisstijl?.primaire_kleur ?? '#185FA5' }}
                title="Account aangemaakt"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-semibold ${diensten[d.key] ? 'text-green-700 line-through' : 'text-gray-800'}`}>
                    {d.naam}
                  </p>
                  <span className="text-xs text-gray-400">{d.categorie}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs font-medium text-gray-500">
                  {d.prijs === 0 ? 'Gratis starter' : `€ ${d.prijs}/mnd`}
                </span>
                <a href={d.url} target="_blank" rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-600 transition">
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Totale kost */}
        <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
          <span className="text-xs font-semibold text-gray-500">Totale maandkost</span>
          <span className="text-sm font-bold text-gray-800">
            {totaalPrijs === 0 ? 'Gratis' : `€ ${fmt(totaalPrijs)}/mnd`}
          </span>
        </div>

        {/* .env.example */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">.env.example</p>
            <KopieKnop tekst={envTekst} label="Kopieer .env.example" />
          </div>
          <pre className="text-xs font-mono text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 overflow-x-auto leading-relaxed whitespace-pre">
            {envTekst}
          </pre>
        </div>
      </Sectie>

      {/* ── Sectie 3: Prijsraming ──────────────────────────────────────── */}
      <Sectie titel="💶 Prijsraming">
        {/* Instellingen uurtarief + BTW */}
        <div className="flex gap-4 max-w-xs">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Uurtarief (€)</label>
            <input type="number" min="0" value={uurtarief}
              onChange={e => setUurtarief(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 mb-1">BTW (%)</label>
            <input type="number" min="0" max="100" value={btw}
              onChange={e => setBtw(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400" />
          </div>
        </div>

        {geselecteerdeModules.length === 0 ? (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 px-3 py-2.5 rounded-xl">
            Selecteer modules in het App-modules tabblad om een prijsraming te genereren.
          </p>
        ) : (
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Module</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-24">Uren</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-28">Prijs excl. BTW</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {geselecteerdeModules.map(mod => (
                  <tr key={mod.key} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-2.5 text-gray-700 font-medium">{mod.naam}</td>
                    <td className="px-4 py-2.5 text-right">
                      <input
                        type="number" min="0" step="0.5"
                        value={uren[mod.key] ?? mod.tijd}
                        onChange={e => setUren(u => ({ ...u, [mod.key]: Number(e.target.value) }))}
                        className="w-16 px-2 py-1 text-right rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400/30"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-600 font-mono text-xs">
                      € {fmt((uren[mod.key] ?? mod.tijd) * uurtarief)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-gray-200">
                <tr className="bg-gray-50">
                  <td className="px-4 py-2 text-xs text-gray-500 font-semibold">Subtotaal</td>
                  <td className="px-4 py-2 text-right text-xs font-bold text-gray-700">{subtotaalUren}u</td>
                  <td className="px-4 py-2 text-right text-xs font-bold text-gray-700 font-mono">€ {fmt(subtotaalExcl)}</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-1.5 text-xs text-gray-400" colSpan={2}>BTW ({btw}%)</td>
                  <td className="px-4 py-1.5 text-right text-xs text-gray-500 font-mono">€ {fmt(btwBedrag)}</td>
                </tr>
                <tr className="bg-gray-50 border-t border-gray-200">
                  <td className="px-4 py-2.5 text-sm font-bold text-gray-800" colSpan={2}>Totaal incl. BTW</td>
                  <td className="px-4 py-2.5 text-right text-sm font-bold text-gray-900 font-mono">€ {fmt(totaalIncl)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <button type="button" onClick={naarOfferte}
          disabled={!project?.id}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition"
          style={{ background: huisstijl?.primaire_kleur ?? '#185FA5' }}>
          <FileText size={14} /> Exporteer als offerte
        </button>
      </Sectie>

      {/* ── Sectie 5: Handleidingen ────────────────────────────────────── */}
      <Sectie titel="📘 Handleidingen voor dit project" defaultOpen={false}>

        {/* Twee blokken naast elkaar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { type: 'gebruiker', label: 'Gebruikershandleiding', kleur: '#2563eb', bg: '#dbeafe', h: gebruikerH },
            { type: 'technisch', label: 'Technische handleiding', kleur: '#d97706', bg: '#fef3c7', h: technischH },
          ].map(({ type, label, kleur, bg, h }) => (
            <div key={type} className="border border-gray-100 rounded-xl p-4 flex flex-col gap-3 bg-gray-50/50">
              {/* Header met status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen size={14} style={{ color: kleur }} />
                  <span className="text-sm font-bold text-gray-700">{label}</span>
                </div>
                {h ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                    <Check size={11} /> Aangemaakt
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                    Nog niet aangemaakt
                  </span>
                )}
              </div>

              {/* Actieknop */}
              {h ? (
                <button
                  onClick={() => navigate(`/handleidingen/${h.id}`)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white transition-colors"
                  style={{ background: kleur }}
                >
                  <Edit3 size={12} /> Bekijken en bewerken
                </button>
              ) : (
                <button
                  onClick={() => navigate(`/handleidingen/nieuw?project_id=${project?.id}&type=${type}`)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border-2 border-dashed border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
                >
                  + Nu aanmaken
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Prompt generator */}
        <div className="space-y-3 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-amber-500" />
            <p className="text-sm font-bold text-gray-700">Claude-prompts voor handleidingen</p>
          </div>

          {/* Gebruikersprompt */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                Gebruikershandleiding
              </label>
              <KopieKnop tekst={promptGebruiker} label="Kopieer prompt" />
            </div>
            <textarea
              readOnly
              value={promptGebruiker}
              rows={6}
              className="w-full text-xs font-mono text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 resize-none focus:outline-none leading-relaxed"
            />
          </div>

          {/* Technische prompt */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                Technische handleiding
              </label>
              <KopieKnop tekst={promptTechnisch} label="Kopieer prompt" />
            </div>
            <textarea
              readOnly
              value={promptTechnisch}
              rows={6}
              className="w-full text-xs font-mono text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 resize-none focus:outline-none leading-relaxed"
            />
          </div>
        </div>
      </Sectie>

      {/* ── Sectie 4: Volgende stappen ─────────────────────────────────── */}
      <Sectie titel="✅ Volgende stappen">
        {!project?.status ? (
          <p className="text-xs text-gray-400">Geen projectstatus beschikbaar.</p>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-gray-500">Status:</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                {STATUS_LABEL[project.status] ?? project.status}
              </span>
            </div>
            <div className="space-y-2">
              {(STAPPEN[project.status] ?? []).map((stap, idx) => {
                const key = `${project.status}_${idx}`
                return (
                  <label key={key}
                    className="flex items-start gap-3 cursor-pointer group px-3 py-2.5 rounded-xl border border-gray-100 hover:bg-gray-50 transition">
                    <input
                      type="checkbox"
                      checked={!!stappen[key]}
                      onChange={e => setStappen(s => ({ ...s, [key]: e.target.checked }))}
                      className="w-4 h-4 rounded mt-0.5 flex-shrink-0"
                      style={{ accentColor: huisstijl?.primaire_kleur ?? '#185FA5' }}
                    />
                    <span className={`text-sm transition-colors ${stappen[key] ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {stap}
                    </span>
                  </label>
                )
              })}
            </div>

            {/* Prompt genereren voor volgende stap */}
            <div className="pt-2">
              <KopieKnop
                tekst={`Project: ${project?.naam ?? '—'}\nStatus: ${STATUS_LABEL[project.status] ?? project.status}\n\nVolgende stappen:\n${
                  (STAPPEN[project.status] ?? []).map(s => `- ${s}`).join('\n')
                }`}
                label="Kopieer actielijst"
              />
            </div>
          </>
        )}
      </Sectie>

    </div>
  )
}
