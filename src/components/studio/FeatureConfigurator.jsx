// FeatureConfigurator.jsx — Selecteer features per categorie voor een klant-app
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { ChevronDown, ChevronRight, Save, Copy, Check, Zap } from 'lucide-react'

// ── Feature-data ──────────────────────────────────────────────────────────────
const CATEGORIEEN = [
  {
    key: 'basis',
    label: 'Basisstructuur',
    features: [
      { key: 'login', label: 'Login & gebruikersbeheer', opties: [
        { key: 'single', label: 'Alleen voor mij (single user)' },
        { key: 'multi',  label: 'Meerdere gebruikers met rollen' },
      ]},
      { key: 'dashboard', label: 'Dashboard startpagina', opties: [
        { key: 'eenvoudig',  label: 'Eenvoudig (snelkoppelingen)' },
        { key: 'uitgebreid', label: 'Uitgebreid (statistieken + grafieken)' },
      ]},
      { key: 'huisstijl_resp', label: 'Huisstijl & responsive design', opties: [
        { key: 'desktop',     label: 'Desktop only' },
        { key: 'responsive',  label: 'Desktop + mobiel' },
      ]},
      { key: 'meertalig', label: 'Meertalig', opties: [
        { key: 'nl',    label: 'NL only' },
        { key: 'nl_fr', label: 'NL + FR of EN' },
      ]},
    ],
  },
  {
    key: 'klanten',
    label: 'Klantenbeheer',
    features: [
      { key: 'klantenfiche', label: 'Klantenfiche', opties: [
        { key: 'b2c',  label: 'Alleen particulieren (B2C)' },
        { key: 'b2b',  label: 'Alleen bedrijven (B2B)' },
        { key: 'beide',label: 'Beide (B2C + B2B)' },
      ]},
      { key: 'historiek', label: 'Klantenhistoriek', opties: [
        { key: 'notities', label: 'Alleen notities' },
        { key: 'volledig', label: 'Notities + facturen + boekingen' },
      ]},
      { key: 'zoeken', label: 'Zoeken & filteren', opties: [
        { key: 'eenvoudig',  label: 'Eenvoudig (op naam)' },
        { key: 'uitgebreid', label: 'Uitgebreid (naam, status, datum, regio)' },
      ]},
      { key: 'export_klanten', label: 'Export klantenlijst', opties: [
        { key: 'csv',   label: 'CSV' },
        { key: 'excel', label: 'Excel met opmaak' },
      ]},
    ],
  },
  {
    key: 'financieel',
    label: 'Financieel',
    features: [
      { key: 'factuur', label: 'Factuurmodule', opties: [
        { key: 'eenvoudig',  label: 'Eenvoudig (alleen 21% BTW)' },
        { key: 'uitgebreid', label: 'Uitgebreid (meerdere BTW-tarieven)' },
      ]},
      { key: 'pdf_factuur', label: 'PDF export facturen', opties: [
        { key: 'print', label: 'Via window.print()' },
        { key: 'jspdf', label: 'Via jsPDF library' },
      ]},
      { key: 'betaalstatus', label: 'Betaalstatus opvolging', opties: [
        { key: 'eenvoudig',  label: 'Betaald / Onbetaald' },
        { key: 'uitgebreid', label: 'Betaald / Onbetaald / Vervallen / Deelbetaling' },
      ]},
      { key: 'offerte', label: 'Offertemodule', opties: [
        { key: 'standalone', label: 'Standalone offerte' },
        { key: 'conversie',  label: 'Offerte met conversie naar factuur' },
      ]},
      { key: 'deposito', label: 'Deposito & voorschot', opties: [
        { key: 'vast',  label: 'Vast percentage (30%)' },
        { key: 'vrij',  label: 'Vrij bedrag invoerbaar' },
      ]},
      { key: 'calculator', label: 'Prijscalculator', opties: [
        { key: 'eenvoudig',  label: 'Eenvoudig (prijs × aantal)' },
        { key: 'geavanceerd',label: 'Geavanceerd (waste factor + break-even)' },
      ]},
    ],
  },
  {
    key: 'planning',
    label: 'Reservaties & planning',
    features: [
      { key: 'kalender', label: 'Kalenderweergave', opties: [
        { key: 'maand',   label: 'Maandoverzicht' },
        { key: 'volledig',label: 'Dag + week + maand' },
      ]},
      { key: 'boeking', label: 'Boekingsformulier', opties: [
        { key: 'intern', label: 'Intern (alleen medewerkers)' },
        { key: 'publiek',label: 'Publiek (klant boekt zelf)' },
      ]},
      { key: 'beschikbaarheid', label: 'Beschikbaarheidsbeheer', opties: [
        { key: 'handmatig',  label: 'Handmatig blokkeren' },
        { key: 'automatisch',label: 'Automatisch op basis van capaciteit' },
      ]},
      { key: 'bevestigingsmail', label: 'Bevestigingsmail', opties: [
        { key: 'mailto', label: 'Via mailto link' },
        { key: 'resend', label: 'Via e-mailservice (Resend)' },
      ]},
    ],
  },
  {
    key: 'communicatie',
    label: 'Communicatie',
    features: [
      { key: 'auto_mail', label: 'Automatische e-mails', opties: [
        { key: 'bevestiging', label: 'Bevestiging bij boeking' },
        { key: 'volledig',    label: 'Bevestiging + herinnering + bedanking' },
      ]},
      { key: 'notities_dossier', label: 'Interne notities per dossier', opties: [] },
      { key: 'taken',            label: 'Taken & herinneringen',         opties: [] },
    ],
  },
  {
    key: 'rapportage',
    label: 'Rapportage',
    features: [
      { key: 'statistieken', label: 'Statistieken & grafieken', opties: [
        { key: 'tabel',  label: 'Alleen cijfers (tabel)' },
        { key: 'charts', label: 'Grafieken via Chart.js' },
      ]},
      { key: 'export_excel', label: 'Export naar Excel/CSV',  opties: [] },
      { key: 'maandrapport', label: 'Maandrapport PDF',       opties: [] },
      { key: 'activiteitenlog', label: 'Activiteitenlog',     opties: [] },
    ],
  },
  {
    key: 'ux',
    label: 'UX & visueel',
    features: [
      { key: 'banner', label: 'Reclamebanner', opties: [
        { key: 'statisch',  label: 'Statisch (tekst + kleur)' },
        { key: 'animerend', label: 'Animerend (sliding tekst)' },
      ]},
      { key: 'blokken_ux', label: 'Modulaire blokken aan/uit', opties: [
        { key: 'eenvoudig', label: 'Beheerder kan blokken tonen/verbergen' },
        { key: 'drag',      label: 'Drag & drop volgorde + tekst bewerken' },
      ]},
      { key: 'inline_edit', label: 'Tekst inline bewerken', opties: [
        { key: 'contenteditable', label: 'Via contenteditable' },
        { key: 'paneel',          label: 'Via instellingenpaneel' },
      ]},
    ],
  },
]

// ── Hulpfuncties ──────────────────────────────────────────────────────────────
function aantalGeselecteerd(selectie) {
  return Object.values(selectie).filter(v => v.aangevinkt).length
}

function genereerPromptTekst(selectie, huisstijl, projectNaam) {
  const regels = []

  CATEGORIEEN.forEach(cat => {
    const actief = cat.features.filter(f => selectie[f.key]?.aangevinkt)
    if (!actief.length) return
    regels.push(`=== ${cat.label.toUpperCase()} ===`)
    actief.forEach(f => {
      const optieKey = selectie[f.key]?.optie
      const optie = f.opties.find(o => o.key === optieKey)
      regels.push(`- ${f.label}${optie ? `: ${optie.label}` : ''}`)
    })
    regels.push('')
  })

  if (!regels.length) return ''

  // Huisstijl-blok
  const hs = huisstijl
  const huisstijlBlok = hs
    ? [
        'HUISSTIJL:',
        hs.primaire_kleur   ? `- Primaire kleur: ${hs.primaire_kleur}`   : null,
        hs.secundaire_kleur ? `- Secundaire kleur: ${hs.secundaire_kleur}` : null,
        hs.accent_kleur     ? `- Accentkleur: ${hs.accent_kleur}`         : null,
        hs.font_titel       ? `- Titelfont: ${hs.font_titel}`             : null,
        hs.font_tekst       ? `- Broodtekstfont: ${hs.font_tekst}`        : null,
        '',
      ].filter(r => r !== null).join('\n')
    : ''

  return [
    `APP-PROMPT voor ${projectNaam ?? 'dit project'}`,
    '═'.repeat(50),
    '',
    ...regels,
    huisstijlBlok,
    'INSTRUCTIE:',
    'Bouw een professionele web-app met bovenstaande features.',
    huisstijl ? 'Laad ook de huisstijl van het actieve project zoals hierboven opgegeven.' : '',
    'Bouw grondig, module per module.',
  ].filter(r => r !== null).join('\n').trim()
}

// ── Categorie component ───────────────────────────────────────────────────────
function Categorie({ cat, selectie, onWijzig, accentKleur }) {
  const [open, setOpen] = useState(true)
  const actief = cat.features.filter(f => selectie[f.key]?.aangevinkt).length

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition text-left"
      >
        <div className="flex items-center gap-2">
          {open
            ? <ChevronDown size={14} className="text-gray-400" />
            : <ChevronRight size={14} className="text-gray-400" />}
          <span className="text-sm font-semibold text-gray-700">{cat.label}</span>
        </div>
        {actief > 0 && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
            style={{ background: accentKleur }}>
            {actief}
          </span>
        )}
      </button>

      {/* Features */}
      {open && (
        <div className="divide-y divide-gray-50">
          {cat.features.map(feature => {
            const staat = selectie[feature.key] ?? { aangevinkt: false, optie: null }
            return (
              <div key={feature.key} className="px-4 py-3 space-y-2">
                {/* Checkbox */}
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={staat.aangevinkt}
                    onChange={e => onWijzig(feature.key, 'aangevinkt', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                    style={{ accentColor: accentKleur }}
                  />
                  <span className={`text-sm transition-colors ${staat.aangevinkt ? 'text-gray-900 font-medium' : 'text-gray-500 group-hover:text-gray-700'}`}>
                    {feature.label}
                  </span>
                </label>

                {/* Subopties (alleen als aangevinkt en er opties zijn) */}
                {staat.aangevinkt && feature.opties.length > 0 && (
                  <div className="ml-7 space-y-1.5 border-l-2 border-gray-100 pl-3">
                    {feature.opties.map(optie => (
                      <label key={optie.key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`optie_${feature.key}`}
                          checked={staat.optie === optie.key}
                          onChange={() => onWijzig(feature.key, 'optie', optie.key)}
                          className="w-3.5 h-3.5 cursor-pointer"
                          style={{ accentColor: accentKleur }}
                        />
                        <span className={`text-xs ${staat.optie === optie.key ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                          {optie.label}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Hoofd component ───────────────────────────────────────────────────────────
export default function FeatureConfigurator({ project, huisstijl }) {
  const [selectie,    setSelectie]    = useState({})
  const [prompt,      setPrompt]      = useState('')
  const [gekopieerd,  setGekopieerd]  = useState(false)
  const [opslaan,     setOpslaan]     = useState(false)
  const [opgeslagen,  setOpgeslagen]  = useState(false)

  const accentKleur = huisstijl?.primaire_kleur ?? '#185FA5'

  // ── Laad bestaande selectie uit Supabase ──────────────────────────────────
  useEffect(() => {
    if (!project?.id) return
    supabase
      .from('projecten')
      .select('features_json')
      .eq('id', project.id)
      .single()
      .then(({ data }) => {
        if (data?.features_json) setSelectie(data.features_json)
        else setSelectie({})
      })
  }, [project?.id])

  // ── Wijzig een feature-staat ──────────────────────────────────────────────
  function onWijzig(featureKey, veld, waarde) {
    setSelectie(prev => {
      const huidig = prev[featureKey] ?? { aangevinkt: false, optie: null }
      const nieuw  = { ...huidig, [veld]: waarde }
      // Als optie niet gezet bij aanvinken, kies standaard de eerste
      if (veld === 'aangevinkt' && waarde && !huidig.optie) {
        const feature = CATEGORIEEN.flatMap(c => c.features).find(f => f.key === featureKey)
        if (feature?.opties.length > 0) nieuw.optie = feature.opties[0].key
      }
      return { ...prev, [featureKey]: nieuw }
    })
    setPrompt('') // reset prompt bij wijziging
  }

  // ── Genereer prompt ───────────────────────────────────────────────────────
  function handleGenereerPrompt() {
    const tekst = genereerPromptTekst(selectie, huisstijl, project?.naam)
    setPrompt(tekst)
  }

  // ── Kopieer prompt ────────────────────────────────────────────────────────
  async function kopieer() {
    await navigator.clipboard.writeText(prompt)
    setGekopieerd(true)
    setTimeout(() => setGekopieerd(false), 2000)
  }

  // ── Sla selectie op ───────────────────────────────────────────────────────
  async function handleOpslaan() {
    if (!project?.id) return
    setOpslaan(true)
    await supabase
      .from('projecten')
      .update({ features_json: selectie })
      .eq('id', project.id)
    setOpslaan(false)
    setOpgeslagen(true)
    setTimeout(() => setOpgeslagen(false), 2500)
  }

  const totaal = aantalGeselecteerd(selectie)

  return (
    <div className="p-6 space-y-5">

      {/* Teller + acties */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={15} style={{ color: accentKleur }} />
          <span className="text-sm font-semibold text-gray-700">
            {totaal === 0
              ? 'Selecteer features voor deze app'
              : `${totaal} feature${totaal !== 1 ? 's' : ''} geselecteerd`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpslaan}
            disabled={opslaan || !project?.id}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition disabled:opacity-40"
          >
            {opgeslagen
              ? <><Check size={12} className="text-green-500" /> Opgeslagen</>
              : <><Save size={12} /> {opslaan ? 'Opslaan...' : 'Bewaar selectie'}</>}
          </button>
          <button
            type="button"
            onClick={handleGenereerPrompt}
            disabled={totaal === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-40 transition"
            style={{ background: accentKleur }}
          >
            <Zap size={12} /> Genereer app-prompt
          </button>
        </div>
      </div>

      {/* Categorieën */}
      <div className="space-y-3">
        {CATEGORIEEN.map(cat => (
          <Categorie
            key={cat.key}
            cat={cat}
            selectie={selectie}
            onWijzig={onWijzig}
            accentKleur={accentKleur}
          />
        ))}
      </div>

      {/* Gegenereerde prompt */}
      {prompt && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Gegenereerde app-prompt
            </p>
            <button
              type="button"
              onClick={kopieer}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-500 hover:text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition"
            >
              {gekopieerd
                ? <><Check size={11} /> Gekopieerd</>
                : <><Copy size={11} /> Kopieer</>}
            </button>
          </div>
          <textarea
            readOnly
            value={prompt}
            rows={Math.min(30, prompt.split('\n').length + 2)}
            className="w-full font-mono text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 resize-none focus:outline-none leading-relaxed"
          />
        </div>
      )}
    </div>
  )
}
