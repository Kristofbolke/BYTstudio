// AppModules.jsx — Catalogus van herbruikbare app-modules
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Check, Copy, Zap, Clock, Euro } from 'lucide-react'

// ── Module-data ───────────────────────────────────────────────────────────────
const MODULES = [
  {
    key: 'login',
    naam: 'Login & rollen',
    categorie: 'Basis',
    tijd: 6,
    beschrijving: 'Inlogscherm, wachtwoord, rollen admin/medewerker, sessie via Supabase Auth.',
    prompt: `Bouw een loginmodule met:
- Inlogscherm met e-mail en wachtwoord
- Supabase Auth voor sessie- en gebruikersbeheer
- Rollen: admin en medewerker
- Beveiligde routes (redirect naar login als niet ingelogd)
- Uitlogknop in navigatie
- Wachtwoord vergeten: stuur reset-mail via Supabase`,
  },
  {
    key: 'factuur',
    naam: 'Factuurmodule',
    categorie: 'Financieel',
    tijd: 11,
    beschrijving: 'Facturen aanmaken, nummering, BTW, PDF-export, betaalstatus. Belgische standaard.',
    prompt: `Bouw een complete factuurmodule:
- Facturen aanmaken met automatische nummering (2025-001)
- Klantgegevens, regelitems, BTW (0/6/12/21%), eindtotaal
- Betaalstatus: Onbetaald / Betaald / Vervallen
- PDF-export via window.print() met A4-opmaak
- Opslag in Supabase tabel 'facturen'
- Overzichtspagina met filter op status en datum`,
  },
  {
    key: 'klanten',
    naam: 'Klantenbestand',
    categorie: 'Klanten',
    tijd: 9,
    beschrijving: 'CRM light: fiches, historiek, zoeken, filteren, exporteren naar CSV.',
    prompt: `Bouw een klantenbeheersmodule:
- Klantenfiche: naam, adres, BTW, e-mail, telefoon, notities
- Categorie: Particulier / Bedrijf / VIP / Prospect
- Overzicht met zoekbalk en filter op categorie
- Klantenhistoriek: notities met datum
- Archiveer/verwijder klant
- Export klantenlijst als CSV`,
  },
  {
    key: 'reservaties',
    naam: 'Reservatiekalender',
    categorie: 'Planning',
    tijd: 12,
    beschrijving: 'Dag/week/maand kalender, boekingen beheren, statussen, beschikbaarheid instellen.',
    prompt: `Bouw een reservatiemodule met kalender:
- Maand- en weekweergave met gekleurde blokken per status
- Status: Bevestigd (groen) / Optie (oranje) / Geannuleerd (rood)
- Boekingsformulier: klant, datum, tijdslot, type, prijs
- Bevestigingsmail via mailto
- Lijst met filter op datum/status/klant
- Capaciteitslimiet per dag instellen`,
  },
  {
    key: 'offerte',
    naam: 'Offertemodule',
    categorie: 'Financieel',
    tijd: 7,
    beschrijving: 'Offertes opmaken, PDF exporteren, omzetten naar factuur, statusopvolging.',
    prompt: `Bouw een offertemodule:
- Offertenummer automatisch (OFF-2025-001)
- Klantgegevens, itemlijst, BTW, eindtotaal
- Status: Concept / Verzonden / Geaccepteerd / Verlopen
- PDF-export via window.print()
- Knop "Zet om naar factuur"
- Overzicht met filter op status`,
  },
  {
    key: 'dashboard',
    naam: 'Dashboard & statistieken',
    categorie: 'Rapportage',
    tijd: 6,
    beschrijving: 'Samenvattende cijfers, grafieken via Chart.js, snelkoppelingen naar modules.',
    prompt: `Bouw een dashboard-startpagina:
- Statistische kaarten: omzet, openstaande facturen, klanten, boekingen
- Grafiek maandomzet (Chart.js, lijndiagram)
- Grafiek statussen (donut)
- Recente activiteit (laatste 5 facturen/boekingen)
- Snelkoppelingen naar alle modules`,
  },
  {
    key: 'calculator',
    naam: 'Prijscalculator',
    categorie: 'Financieel',
    tijd: 6,
    beschrijving: 'Kosten berekenen per event of dienst, waste factor, break-even grafiek, offerte genereren.',
    prompt: `Bouw een prijscalculator:
- Invoer: aantal personen, duur, materiaalkosten
- Waste factor instellen (bijv. 10%)
- Break-even berekening en grafiek
- Knop "Genereer offerte op basis van berekening"
- Opslaan als sjabloon voor hergebruik`,
  },
  {
    key: 'handleiding_gebruiker',
    naam: 'Gebruikershandleiding',
    categorie: 'Documentatie',
    tijd: 3,
    beschrijving: 'Automatisch gegenereerde handleiding op basis van aanwezige modules, exporteerbaar als PDF.',
    prompt: `Bouw een gebruikershandleiding:
- Inleiding: waarvoor dient de app
- Per module: stap-voor-stap uitleg in eenvoudig Nederlands
- Genummerde stappen, geen jargon
- FAQ sectie onderaan
- Knop "Afdrukken als PDF" via window.print()`,
  },
  {
    key: 'handleiding_tech',
    naam: 'Technische documentatie',
    categorie: 'Documentatie',
    tijd: 3,
    beschrijving: 'Installatie, deployment, ENV-variabelen, updateprocedure in Markdown formaat.',
    prompt: `Bouw een technische documentatiepagina:
- Installatie en lokale setup (npm install, .env)
- Environment variables overzicht
- Deployment workflow: GitHub → Netlify/Railway
- Databasestructuur en migraties
- Updateprocedure
- Veelvoorkomende fouten en oplossingen
- Formaat: Markdown, gerenderd in de app`,
  },
  {
    key: 'banner',
    naam: 'Reclamebanner',
    categorie: 'UX',
    tijd: 3,
    beschrijving: 'Aanpasbare banner met tekst, kleur, animatie. Aan/uit schakelaar voor beheerder.',
    prompt: `Bouw een reclamebanner module:
- Aanpasbare tekst, achtergrondkleur en tekstkleur
- Optionele animatie: sliding tekst (marquee-stijl)
- Aan/uit schakelaar voor beheerder via instellingen
- Hoogte instelbaar (40–100px)
- Positie: bovenaan de pagina
- Opslag banner-instellingen in Supabase`,
  },
  {
    key: 'mail',
    naam: 'Bevestigingsmail',
    categorie: 'Communicatie',
    tijd: 2,
    beschrijving: 'Automatische mail via mailto of Resend API bij boeking, registratie of aankoop.',
    prompt: `Bouw een bevestigingsmailsysteem:
- Trigger: na boeking, registratie of aankoop
- Optie 1: mailto-link met voorgevulde onderwerp en body
- Optie 2: Resend API met HTML e-mailtemplate
- Variabelen: klantnaam, datum, bedrag, referentienummer
- Configureerbaar: afzender, onderwerp, inhoud via instellingen`,
  },
  {
    key: 'export',
    naam: 'Export module',
    categorie: 'Rapportage',
    tijd: 3,
    beschrijving: 'Data exporteren naar CSV of Excel, maandrapport als PDF.',
    prompt: `Bouw een exportmodule:
- Export klantenlijst naar CSV
- Export facturen/boekingen naar CSV of Excel
- Maandrapport: samenvatting omzet, klanten, boekingen
- PDF-export maandrapport via window.print()
- Datumselectie voor exportperiode`,
  },
  {
    key: 'bugs',
    naam: 'Bug-meldingsformulier',
    categorie: 'Support',
    tijd: 3,
    beschrijving: 'Ingebouwd formulier voor klanten om problemen te melden. Opslag in Supabase, notificatie naar developer.',
    prompt: `Bouw een bug-meldingsformulier:
- Formulier: naam, e-mail, onderdeel, beschrijving, ernst (laag/medium/hoog)
- Opslag in Supabase tabel 'bug_meldingen'
- Overzicht voor developer: lijst, filter op ernst/status
- Status: Nieuw / In behandeling / Opgelost
- Notitieveld voor developer
- Optioneel: e-mailnotificatie naar developer via Resend`,
  },
]

// ── Categorie kleuren ─────────────────────────────────────────────────────────
const CAT_STIJL = {
  Basis:         { bg: '#f1f5f9', kleur: '#475569' },
  Financieel:    { bg: '#dbeafe', kleur: '#1d4ed8' },
  Klanten:       { bg: '#dcfce7', kleur: '#15803d' },
  Planning:      { bg: '#fef9c3', kleur: '#a16207' },
  Rapportage:    { bg: '#ede9fe', kleur: '#6d28d9' },
  UX:            { bg: '#fae8ff', kleur: '#a21caf' },
  Communicatie:  { bg: '#ffedd5', kleur: '#c2410c' },
  Documentatie:  { bg: '#f0fdf4', kleur: '#166534' },
  Support:       { bg: '#fef2f2', kleur: '#b91c1c' },
}

const FILTER_TABS = ['Alle', 'Basis', 'Financieel', 'Klanten', 'Planning', 'Rapportage', 'UX', 'Communicatie', 'Documentatie', 'Support']

function fmt(n) {
  return Number(n).toLocaleString('nl-BE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// ── Module kaart ──────────────────────────────────────────────────────────────
function ModuleKaart({ mod, geselecteerd, onToevoegen, onPrompt, accentKleur }) {
  const stijl = CAT_STIJL[mod.categorie] ?? CAT_STIJL.Basis

  return (
    <div className={`bg-white border rounded-2xl p-4 flex flex-col gap-3 transition-all ${
      geselecteerd ? 'border-blue-300 shadow-md' : 'border-gray-100 hover:shadow-sm'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold text-gray-800 leading-tight">{mod.naam}</p>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ background: stijl.bg, color: stijl.kleur }}>
          {mod.categorie}
        </span>
      </div>

      {/* Beschrijving */}
      <p className="text-xs text-gray-500 leading-relaxed flex-1">{mod.beschrijving}</p>

      {/* Bouwtijd */}
      <div className="flex items-center gap-1 text-xs text-gray-400">
        <Clock size={11} />
        <span>Geschatte bouwtijd: <strong className="text-gray-600">{mod.tijd}u</strong></span>
      </div>

      {/* Acties */}
      <div className="flex gap-2 pt-1 border-t border-gray-50">
        <button
          type="button"
          onClick={() => onToevoegen(mod.key)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition"
          style={geselecteerd
            ? { background: '#dcfce7', color: '#15803d' }
            : { background: accentKleur + '15', color: accentKleur }}
        >
          {geselecteerd
            ? <><Check size={11} /> Toegevoegd</>
            : <><Plus size={11} /> Voeg toe</>}
        </button>
        <button
          type="button"
          onClick={() => onPrompt(mod)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
          title="Genereer bouwprompt voor deze module"
        >
          <Zap size={11} /> Prompt
        </button>
      </div>
    </div>
  )
}

// ── Hoofd component ───────────────────────────────────────────────────────────
export default function AppModules({ project, huisstijl }) {
  const [actieveTab,    setActieveTab]    = useState('Alle')
  const [geselecteerd,  setGeselecteerd]  = useState(new Set())
  const [prompt,        setPrompt]        = useState('')
  const [promptTitel,   setPromptTitel]   = useState('')
  const [gekopieerd,    setGekopieerd]    = useState(false)
  const [opslaan,       setOpslaan]       = useState(false)
  const [opgeslagen,    setOpgeslagen]    = useState(false)
  const [uurtarief,     setUurtarief]     = useState(75)

  const accentKleur = huisstijl?.primaire_kleur ?? '#185FA5'

  // ── Laad bestaande selectie + uurtarief ──────────────────────────────────
  useEffect(() => {
    supabase.from('instellingen').select('uurtarief').limit(1).single()
      .then(({ data }) => { if (data?.uurtarief) setUurtarief(Number(data.uurtarief)) })

    if (!project?.id) return
    supabase.from('projecten').select('features_json').eq('id', project.id).single()
      .then(({ data }) => {
        const modules = data?.features_json?.modules
        if (Array.isArray(modules)) setGeselecteerd(new Set(modules))
      })
  }, [project?.id])

  // ── Toggle module ─────────────────────────────────────────────────────────
  function toggleModule(key) {
    setGeselecteerd(prev => {
      const nieuw = new Set(prev)
      nieuw.has(key) ? nieuw.delete(key) : nieuw.add(key)
      return nieuw
    })
    setOpgeslagen(false)
  }

  // ── Opslaan in Supabase ───────────────────────────────────────────────────
  async function handleOpslaan() {
    if (!project?.id) return
    setOpslaan(true)
    // Haal bestaande features_json op en merge
    const { data } = await supabase.from('projecten').select('features_json').eq('id', project.id).single()
    const huidig = data?.features_json ?? {}
    await supabase.from('projecten').update({
      features_json: { ...huidig, modules: [...geselecteerd] },
    }).eq('id', project.id)
    setOpslaan(false)
    setOpgeslagen(true)
    setTimeout(() => setOpgeslagen(false), 2500)
  }

  // ── Genereer module-prompt ────────────────────────────────────────────────
  function toonPrompt(mod) {
    const hs = huisstijl
    const huisstijlExtra = hs
      ? `\nHUISSSTIJL:\n- Primaire kleur: ${hs.primaire_kleur ?? '—'}\n- Font: ${hs.font_titel ?? '—'}`
      : ''
    setPrompt(`MODULE: ${mod.naam}\nPROJECT: ${project?.naam ?? '—'}${huisstijlExtra}\n\n${mod.prompt}`)
    setPromptTitel(mod.naam)
  }

  async function kopieer() {
    await navigator.clipboard.writeText(prompt)
    setGekopieerd(true)
    setTimeout(() => setGekopieerd(false), 2000)
  }

  // ── Berekeningen ─────────────────────────────────────────────────────────
  const geselecteerdeModules = MODULES.filter(m => geselecteerd.has(m.key))
  const totaalUren  = geselecteerdeModules.reduce((s, m) => s + m.tijd, 0)
  const totaalPrijs = totaalUren * uurtarief

  const gefilterd = MODULES.filter(m =>
    actieveTab === 'Alle' || m.categorie === actieveTab
  )

  return (
    <div className="p-6 space-y-5">

      {/* Samenvatting geselecteerde modules */}
      {geselecteerd.size > 0 && (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl border"
          style={{ background: accentKleur + '08', borderColor: accentKleur + '30' }}>
          <div className="flex items-center gap-4 text-xs flex-wrap">
            <span className="font-bold" style={{ color: accentKleur }}>
              {geselecteerd.size} module{geselecteerd.size !== 1 ? 's' : ''} geselecteerd
            </span>
            <span className="flex items-center gap-1 text-gray-500">
              <Clock size={11} /> Totale bouwtijd: <strong className="text-gray-700">{totaalUren}u</strong>
            </span>
            <span className="flex items-center gap-1 text-gray-500">
              <Euro size={11} /> Geschatte prijs: <strong className="text-gray-700">€ {fmt(totaalPrijs)}</strong>
              <span className="text-gray-400">(à €{uurtarief}/u)</span>
            </span>
          </div>
          <button
            type="button"
            onClick={handleOpslaan}
            disabled={opslaan || !project?.id}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition disabled:opacity-40 flex-shrink-0 ml-3"
          >
            {opgeslagen
              ? <><Check size={11} className="text-green-500" /> Opgeslagen</>
              : opslaan ? 'Opslaan...' : 'Bewaar selectie'}
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTER_TABS.map(tab => {
          const actief = actieveTab === tab
          const stijl  = CAT_STIJL[tab]
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActieveTab(tab)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition border"
              style={actief
                ? { background: stijl?.bg ?? accentKleur, color: stijl?.kleur ?? '#fff', borderColor: stijl?.bg ?? accentKleur }
                : { background: 'white', color: '#6b7280', borderColor: '#e5e7eb' }}
            >
              {tab}
            </button>
          )
        })}
      </div>

      {/* Module grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {gefilterd.map(mod => (
          <ModuleKaart
            key={mod.key}
            mod={mod}
            geselecteerd={geselecteerd.has(mod.key)}
            onToevoegen={toggleModule}
            onPrompt={toonPrompt}
            accentKleur={accentKleur}
          />
        ))}
      </div>

      {/* Gegenereerde prompt */}
      {prompt && (
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Module-prompt — {promptTitel}
            </p>
            <button type="button" onClick={kopieer}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-500 hover:text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition">
              {gekopieerd
                ? <><Check size={11} /> Gekopieerd</>
                : <><Copy size={11} /> Kopieer</>}
            </button>
          </div>
          <textarea
            readOnly
            value={prompt}
            rows={Math.min(18, prompt.split('\n').length + 2)}
            className="w-full font-mono text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 resize-none focus:outline-none leading-relaxed"
          />
        </div>
      )}
    </div>
  )
}
