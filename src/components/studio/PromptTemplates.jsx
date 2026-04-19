// PromptTemplates.jsx — Bibliotheek van kant-en-klare prompts voor Claude Code
import { useState } from 'react'
import { Copy, Check, ChevronDown, ChevronRight, Wand2, Search } from 'lucide-react'

// ── Template-data ─────────────────────────────────────────────────────────────
const TEMPLATES = [
  {
    key: 'factuur',
    titel: 'Professionele factuurmodule',
    badge: 'Financieel',
    inhoud: `Bouw een professionele factuurmodule voor [BEDRIJFSNAAM] met:

ONTWERP:
- Huisstijlkleur: [KLEUR]
- Logo bovenaan links, bedrijfsgegevens rechts
- Factuurnummer automatisch ophogend (2025-001)
- Datum factuur en vervaldatum (standaard +30 dagen)

FACTUURINHOUD:
- Klantgegevens (naam, adres, BTW-nummer)
- Tabel: omschrijving, aantal, eenheidsprijs, BTW%, totaal
- Subtotaal, BTW-bedrag, eindtotaal
- Betalingsinstructies / IBAN
- Optioneel notitieveld onderaan

PDF-EXPORT:
- Knop "Download als PDF" via window.print()
- A4-formaat, printklaar

EXTRA:
- Bewaar facturen in localStorage of Supabase
- Status: Onbetaald / Betaald / Vervallen
- BTW-percentages instelbaar: 0/6/12/21%`,
  },
  {
    key: 'offerte',
    titel: 'Offerte-generator met PDF',
    badge: 'Financieel',
    inhoud: `Bouw een offerte-generator voor [BEDRIJFSNAAM]:

OFFERTE-STRUCTUUR:
- Offertenummer automatisch (OFF-2025-001)
- Geldigheidsdatum (standaard 30 dagen)
- Klantgegevens invulbaar
- Itemlijst: toevoegen/verwijderen met prijs
- Subtotaal + BTW + eindtotaal

WORKFLOW:
- Bekijk offerte als live preview
- Download als PDF
- Status: Concept / Verzonden / Geaccepteerd

HUISSTIJL:
- Kleur: [KLEUR]
- Bedrijfsinfo: [ADRES, BTW, IBAN]
- Voettekst: vrijblijvende offerte-vermelding

CONVERSIE:
- Knop "Zet om naar factuur"`,
  },
  {
    key: 'crm',
    titel: 'Klantenbestand CRM light',
    badge: 'Klanten',
    inhoud: `Bouw een klantenbeheersmodule voor [BEDRIJFSNAAM]:

KLANTENFICHE:
- Naam, BTW-nummer, adres, e-mail, telefoon
- Contactpersoon (voor B2B)
- Categorie: Particulier / Bedrijf / VIP / Prospect
- Interne notities
- Datum eerste contact en laatste activiteit

OVERZICHT:
- Tabel gesorteerd op naam/datum/status
- Zoekbalk op naam, e-mail, gemeente
- Filter op categorie

ACTIES:
- Bewerk klantgegevens
- Bekijk historiek (facturen/boekingen)
- Voeg notitie toe met datum
- Archiveer klant

IMPORT/EXPORT:
- Export naar CSV
- Import van CSV`,
  },
  {
    key: 'reservaties',
    titel: 'Boekings- en reservatiesysteem',
    badge: 'Reservaties',
    inhoud: `Bouw een reservatiemodule voor [BEDRIJFSNAAM]:

KALENDER:
- Maand- en weekweergave met gekleurde blokken
- Status: Bevestigd (groen) / Optie (oranje) / Geannuleerd (rood)
- Klik op datum voor nieuwe boeking

BOEKINGSFORMULIER:
- Klantnaam en contactgegevens
- Datum en tijdslot
- Type evenement / dienst
- Aantal personen
- Prijs (handmatig of automatisch)
- Status en notities

BEVESTIGING:
- Bevestigingsmail via mailto
- PDF-bevestigingsdocument

BEHEER:
- Lijst met filter op datum/status/klant
- Capaciteitslimiet per dag of tijdslot`,
  },
  {
    key: 'basisstructuur',
    titel: 'Nieuwe app starten — basisstructuur',
    badge: 'Technisch',
    inhoud: `Je bent expert front-end developer gespecialiseerd in zakelijke tools voor KMOs.

KLANT: [BEDRIJFSNAAM]
SECTOR: [SECTOR]
DOELGROEP APP: [medewerkers/klanten/eigenaar]

HUISSTIJL:
- Primaire kleur: [KLEUR]
- Secundaire kleur: [SECUNDAIR]
- Accentkleur: [ACCENT]
- Font titels: [FONT_TITEL]
- Font tekst: [FONT_TEKST]
- Taal: Nederlands

MODULES:
[geselecteerde features uit configurator]

TECHNISCH:
- React + Vite + Tailwind CSS
- Supabase database + auth
- Netlify hosting
- Responsive voor desktop

START MET:
Volledige mappenstructuur, dan module per module.
Bouw grondig en gecontroleerd.`,
  },
  {
    key: 'handleiding_gebruiker',
    titel: 'Gebruikershandleiding genereren',
    badge: 'Handleidingen',
    inhoud: `Schrijf een volledige gebruikershandleiding in eenvoudig Nederlands voor een app met modules: [MODULES]

De handleiding is voor een niet-technische klant (KMO-eigenaar).

STRUCTUUR:
1. Inleiding — waarvoor dient de app
2. Inloggen en navigeren
3. Per module: stap-voor-stap uitleg
4. Veelgestelde vragen (FAQ)
5. Wat te doen bij problemen

STIJL:
- Eenvoudige taal, geen jargon
- Genummerde stappen
- Schermafbeelding-beschrijvingen (bv. "Klik op de blauwe knop rechts bovenaan")

FORMAAT:
Nette HTML-pagina, afdrukbaar als PDF.`,
  },
  {
    key: 'handleiding_technisch',
    titel: 'Technische handleiding',
    badge: 'Technisch',
    inhoud: `Schrijf een technische handleiding voor een developer die deze app overneemt of onderhoudt.

MODULES: [MODULES]
EXTERNE DIENSTEN: [DIENSTEN]

ONDERWERPEN:
1. Installatie en lokale setup
2. Environment variables (.env)
3. Deployment workflow (GitHub → Netlify)
4. Databasestructuur en migraties
5. Updateprocedure
6. Veelvoorkomende fouten en oplossingen

FORMAAT: Markdown`,
  },
]

// ── Badge kleuren ─────────────────────────────────────────────────────────────
const BADGE_STIJL = {
  Financieel:    { bg: '#dbeafe', kleur: '#1d4ed8' },
  Klanten:       { bg: '#dcfce7', kleur: '#15803d' },
  Reservaties:   { bg: '#fef9c3', kleur: '#a16207' },
  UX:            { bg: '#fae8ff', kleur: '#a21caf' },
  Technisch:     { bg: '#f1f5f9', kleur: '#475569' },
  Handleidingen: { bg: '#ffedd5', kleur: '#c2410c' },
}

const FILTER_TABS = ['Alle', 'Financieel', 'Klanten', 'Reservaties', 'UX', 'Technisch', 'Handleidingen']

// ── Vervang placeholders met huisstijlgegevens ────────────────────────────────
function vulHuisstijlIn(tekst, huisstijl, project) {
  if (!tekst) return tekst
  const extra = huisstijl?.extra_json ?? {}
  return tekst
    .replace(/\[BEDRIJFSNAAM\]/g, huisstijl?.bedrijfsslogan || project?.naam || '[BEDRIJFSNAAM]')
    .replace(/\[KLEUR\]/g,        huisstijl?.primaire_kleur   || '[KLEUR]')
    .replace(/\[SECUNDAIR\]/g,    huisstijl?.secundaire_kleur || '[SECUNDAIR]')
    .replace(/\[ACCENT\]/g,       huisstijl?.accent_kleur     || '[ACCENT]')
    .replace(/\[FONT_TITEL\]/g,   huisstijl?.font_titel       || '[FONT_TITEL]')
    .replace(/\[FONT_TEKST\]/g,   huisstijl?.font_tekst       || '[FONT_TEKST]')
    .replace(/\[SECTOR\]/g,       extra.sector                || '[SECTOR]')
    .replace(/\[ADRES, BTW, IBAN\]/g,
      [huisstijl?.adres, huisstijl?.btw, huisstijl?.iban].filter(Boolean).join(' — ') || '[ADRES, BTW, IBAN]')
}

// ── Template kaart ────────────────────────────────────────────────────────────
function TemplateKaart({ tmpl, huisstijl, project, accentKleur }) {
  const [open,       setOpen]       = useState(false)
  const [gekopieerd, setGekopieerd] = useState(false)
  const [aangepast,  setAangepast]  = useState(false)
  const [tekst,      setTekst]      = useState(tmpl.inhoud)

  const badge = BADGE_STIJL[tmpl.badge] ?? { bg: '#f1f5f9', kleur: '#475569' }

  async function kopieer() {
    await navigator.clipboard.writeText(tekst)
    setGekopieerd(true)
    setTimeout(() => setGekopieerd(false), 2000)
  }

  function pasAan() {
    const gevuld = vulHuisstijlIn(tmpl.inhoud, huisstijl, project)
    setTekst(gevuld)
    setAangepast(true)
    setOpen(true)
  }

  function reset() {
    setTekst(tmpl.inhoud)
    setAangepast(false)
  }

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${open ? 'border-gray-200 shadow-sm' : 'border-gray-100'}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition"
        onClick={() => setOpen(o => !o)}>
        {open
          ? <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
          : <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />}

        <span className="text-sm font-semibold text-gray-800 flex-1 min-w-0 truncate">
          {tmpl.titel}
        </span>

        <div className="flex items-center gap-2 flex-shrink-0">
          {aangepast && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100">
              Aangepast
            </span>
          )}
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
            style={{ background: badge.bg, color: badge.kleur }}>
            {tmpl.badge}
          </span>
        </div>
      </div>

      {/* Uitklapinhoud */}
      {open && (
        <div className="border-t border-gray-100 px-4 py-4 space-y-3">
          {/* Prompttekst */}
          <textarea
            value={tekst}
            onChange={e => setTekst(e.target.value)}
            rows={Math.min(20, tekst.split('\n').length + 1)}
            className="w-full font-mono text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400/20 leading-relaxed"
          />

          {/* Acties */}
          <div className="flex items-center gap-2 flex-wrap">
            <button type="button" onClick={kopieer}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition">
              {gekopieerd
                ? <><Check size={11} /> Gekopieerd</>
                : <><Copy size={11} /> Kopieer prompt</>}
            </button>

            {huisstijl && (
              <button type="button" onClick={pasAan}
                className="flex items-center gap-1.5 text-xs font-semibold border px-3 py-1.5 rounded-lg transition"
                style={{ borderColor: accentKleur + '60', color: accentKleur, background: accentKleur + '10' }}
                title="Vervangt [BEDRIJFSNAAM], [KLEUR], [FONT] met de gegevens van het actieve project">
                <Wand2 size={11} /> Aanpassen met actief project
              </button>
            )}

            {aangepast && (
              <button type="button" onClick={reset}
                className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition">
                Reset
              </button>
            )}
          </div>

          {/* Info bij aanpassen */}
          {!huisstijl && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 px-3 py-2 rounded-lg">
              Selecteer een project met huisstijl om automatisch aan te passen.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Hoofd component ───────────────────────────────────────────────────────────
export default function PromptTemplates({ project, huisstijl }) {
  const [zoek,        setZoek]        = useState('')
  const [actieveTab,  setActieveTab]  = useState('Alle')

  const accentKleur = huisstijl?.primaire_kleur ?? '#185FA5'

  const gefilterd = TEMPLATES.filter(t => {
    const matchTab  = actieveTab === 'Alle' || t.badge === actieveTab
    const zoekTerm  = zoek.toLowerCase()
    const matchZoek = !zoek
      || t.titel.toLowerCase().includes(zoekTerm)
      || t.badge.toLowerCase().includes(zoekTerm)
      || t.inhoud.toLowerCase().includes(zoekTerm)
    return matchTab && matchZoek
  })

  return (
    <div className="p-6 space-y-5">

      {/* Zoekbalk */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={zoek}
          onChange={e => setZoek(e.target.value)}
          placeholder="Zoek op titel of categorie..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 bg-white"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {FILTER_TABS.map(tab => {
          const actief = actieveTab === tab
          const badge  = BADGE_STIJL[tab]
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActieveTab(tab)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition border"
              style={actief
                ? { background: badge?.bg ?? accentKleur, color: badge?.kleur ?? '#fff', borderColor: badge?.bg ?? accentKleur }
                : { background: 'white', color: '#6b7280', borderColor: '#e5e7eb' }}
            >
              {tab}
            </button>
          )
        })}
      </div>

      {/* Teller */}
      <p className="text-xs text-gray-400">
        {gefilterd.length} template{gefilterd.length !== 1 ? 's' : ''}
        {zoek && <> voor "<span className="font-medium text-gray-600">{zoek}</span>"</>}
      </p>

      {/* Templates */}
      {gefilterd.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-sm text-gray-400">Geen templates gevonden.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {gefilterd.map(tmpl => (
            <TemplateKaart
              key={tmpl.key}
              tmpl={tmpl}
              huisstijl={huisstijl}
              project={project}
              accentKleur={accentKleur}
            />
          ))}
        </div>
      )}
    </div>
  )
}
