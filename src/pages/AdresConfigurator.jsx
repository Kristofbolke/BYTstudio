// src/pages/AdresConfigurator.jsx — Interne BYT Studio intake-tool voor adres & contact module
import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  ChevronLeft, ChevronRight, Edit3, Copy, Save, Printer,
  CheckCircle, Info, ExternalLink, X, AlertCircle,
} from 'lucide-react'

const BYT_GREEN = '#78C833'

// ── Badge configuratie ────────────────────────────────────────────────────────
const BADGE_CFG = {
  GRATIS:           { bg: '#dcfce7', tekst: '#15803d' },
  BETAALD:          { bg: '#ffedd5', tekst: '#c2410c' },
  'GRATIS/BETAALD': { bg: '#dbeafe', tekst: '#1d4ed8' },
}

// ── Chip data ─────────────────────────────────────────────────────────────────

const B2_CHIPS = [
  { id: 'voornaam',            label: 'Voornaam',                                         standaard: true },
  { id: 'tussenvoegsel',       label: 'Tussenvoegsel',                                    standaard: true },
  { id: 'familienaam',         label: 'Familienaam',                                      standaard: true },
  { id: 'aanspreking',         label: 'Aanspreking',                                      standaard: false },
  { id: 'geslacht',            label: 'Geslacht',                                         standaard: false },
  { id: 'geboortedatum',       label: 'Geboortedatum',                                    standaard: false },
  { id: 'leeftijd',            label: 'Leeftijd (auto)',                                  standaard: false },
  { id: 'geboorteplaats',      label: 'Geboorteplaats',                                   standaard: false },
  { id: 'nationaliteit',       label: 'Nationaliteit',                                    standaard: false },
  { id: 'rijksregister',       label: 'Rijksregisternummer (validatie XX.XX.XX-XXX.XX)',  standaard: false },
]

const B3_CHIPS = [
  { id: 'straat_nr',    label: 'Straat + huisnummer',  standaard: true },
  { id: 'bus',          label: 'Bus',                   standaard: true },
  { id: 'postcode',     label: 'Postcode',              standaard: true },
  { id: 'gemeente',     label: 'Gemeente/Stad',         standaard: true },
  { id: 'deelgemeente', label: 'Deelgemeente ✦',       standaard: true },
  { id: 'land',         label: 'Land',                  standaard: true },
  { id: 'provincie',    label: 'Provincie (auto)',       standaard: false },
]

const B4_CHIPS = [
  { id: 'telefoon',           label: 'Telefoon',                  standaard: true },
  { id: 'email',              label: 'E-mail',                    standaard: true },
  { id: 'mobiel',             label: 'Mobiel',                    standaard: false },
  { id: 'website',            label: 'Website URL',               standaard: false },
  { id: 'btw_nummer',         label: 'BTW-nummer',                standaard: false },
  { id: 'ondernemingsnummer', label: 'Ondernemingsnummer (KBO)',   standaard: false },
  { id: 'iban',               label: 'IBAN',                      standaard: false },
  { id: 'bic',                label: 'BIC/SWIFT',                 standaard: false },
]

const B5_CHIPS = [
  {
    id: 'postcode_gemeente', standaard: true, badge: 'GRATIS',
    label: 'Postcode→gemeente via Statbel',
    popup: { naam: 'Statbel Open Data', beschrijving: 'Belgische statistische dienst. Gratis dataset met alle Belgische postcodes en bijbehorende gemeentenamen.', kost: 'Gratis — geen API-sleutel vereist', url: 'https://statbel.fgov.be/nl/open-data' },
  },
  {
    id: 'straatnaam_google', standaard: true, badge: 'BETAALD',
    label: 'Straatnaam via Google Places',
    popup: { naam: 'Google Places API', beschrijving: 'Adresautocomplete via Google Maps Platform. Betaald per aanvraag na het gratis maandquotum.', kost: '±€2,83/1.000 requests', url: 'https://mapsplatform.google.com' },
  },
  {
    id: 'land_landcode', standaard: true, badge: 'GRATIS',
    label: 'Land→landcode (ingebouwde dataset)',
    popup: { naam: 'ISO 3166-1 dataset', beschrijving: 'Lokale dataset met alle ISO-landcodes. Geen externe dienst of netwerktoegang vereist.', kost: 'Gratis — lokale dataset', url: null },
  },
  {
    id: 'iban_bic', standaard: true, badge: 'GRATIS',
    label: 'IBAN→BIC via algoritme',
    popup: { naam: 'IBAN→BIC algoritme', beschrijving: 'Lokaal algoritme dat de BIC-code afleidt uit het IBAN-nummer via BIC-lookup tabellen.', kost: 'Gratis — lokale berekening', url: null },
  },
  {
    id: 'postcode_nl', standaard: false, badge: 'GRATIS/BETAALD',
    label: 'Postcode→gemeente NL via PostcodeAPI.nu',
    popup: { naam: 'PostcodeAPI.nu', beschrijving: 'Nederlandse postcode-API. Gratis tot 500 requests per maand, betaald daarboven.', kost: 'Gratis t/m 500 req/mnd — daarna ±€0,001/request', url: 'https://postcodeapi.nu' },
  },
  {
    id: 'kbo_bedrijf', standaard: false, badge: 'GRATIS',
    label: 'KBO→bedrijfsgegevens via Crossroads Bank',
    popup: { naam: 'KBO Publieke Zoekmotor', beschrijving: 'Opzoeken van Belgische bedrijfsgegevens via het ondernemingsnummer bij de Kruispuntbank van Ondernemingen.', kost: 'Gratis publieke toegang', url: 'https://kbopub.economie.fgov.be' },
  },
  {
    id: 'btw_vies', standaard: false, badge: 'GRATIS',
    label: 'BTW-validatie via VIES EU',
    popup: { naam: 'VIES (VAT Information Exchange System)', beschrijving: 'EU-systeem voor validatie van BTW-nummers uit alle EU-lidstaten.', kost: 'Gratis EU-dienst', url: 'https://ec.europa.eu/taxation_customs/vies' },
  },
  {
    id: 'telefoon_lib', standaard: false, badge: 'GRATIS',
    label: 'Telefoonnummer via libphonenumber',
    popup: { naam: 'libphonenumber (Google)', beschrijving: 'Open-source bibliotheek van Google voor parsen, formatteren en valideren van telefoonnummers wereldwijd.', kost: 'Gratis open-source', url: 'https://github.com/google/libphonenumber' },
  },
  {
    id: 'rijksregister_calc', standaard: false, badge: 'GRATIS',
    label: 'Rijksregisternummer→geboortedatum+geslacht',
    popup: { naam: 'Rijksregisternummer algoritme', beschrijving: 'Lokaal algoritme dat geboortedatum en geslacht afleidt uit het Belgische rijksregisternummer.', kost: 'Gratis — lokaal algoritme', url: null },
  },
  {
    id: 'website_favicon', standaard: false, badge: 'GRATIS',
    label: 'Website URL + favicon via Google',
    popup: { naam: 'Google Favicon Service', beschrijving: 'Haalt automatisch het favicon op van een website-URL via de gratis Google Favicon API.', kost: 'Gratis — geen API-sleutel nodig', url: null },
  },
]

const B6_CHIPS = [
  {
    id: 'eid_kaart', standaard: false, badge: 'BETAALD',
    label: 'eID kaartlezer',
    popup: { naam: 'eID middleware (Fedict)', beschrijving: 'Belgische eID-kaartlezer integratie via de officiële Fedict middleware.', kost: 'Zakelijk contract vereist', url: 'https://eid.belgium.be' },
  },
  {
    id: 'handtekening', standaard: false, badge: 'GRATIS',
    label: 'Digitale handtekening',
    popup: { naam: 'signature_pad + jsPDF', beschrijving: 'Canvas-gebaseerde handtekeninginvoer met export naar PDF via de jsPDF-bibliotheek.', kost: 'Gratis open-source', url: null },
  },
  {
    id: 'qr_scan', standaard: false, badge: 'GRATIS',
    label: 'QR-code scanner via camera',
    popup: { naam: 'jsQR', beschrijving: 'Open-source JavaScript QR-code scanner die werkt via de camerafeed van het apparaat.', kost: 'Gratis open-source', url: null },
  },
  {
    id: 'barcode_scan', standaard: false, badge: 'GRATIS',
    label: 'Barcode scanner EAN/UPC',
    popup: { naam: 'ZXing', beschrijving: 'Open-source barcodebibliotheek voor het scannen van EAN, UPC en andere formaten via camera of afbeelding.', kost: 'Gratis open-source', url: null },
  },
  {
    id: 'ocr_scan', standaard: false, badge: 'BETAALD',
    label: 'OCR documentscan',
    popup: { naam: 'Google Cloud Vision', beschrijving: 'AI-gedreven OCR voor het uitlezen van tekst uit documenten en afbeeldingen via de Google Cloud API.', kost: '±€1,50/1.000 afbeeldingen', url: null },
  },
  {
    id: 'mrz_scan', standaard: false, badge: 'GRATIS/BETAALD',
    label: 'Paspoort/ID scan MRZ',
    popup: { naam: 'BlinkID', beschrijving: 'SDK voor het scannen van paspoorten en identiteitskaarten via de MRZ-zone onderaan het document.', kost: 'Freemium — basis gratis, productie betaald', url: 'https://blinkid.com' },
  },
  {
    id: 'gps_adres', standaard: false, badge: 'GRATIS/BETAALD',
    label: 'GPS→adres',
    popup: { naam: 'Google Geocoding API', beschrijving: 'Converteert GPS-coördinaten naar een leesbaar adres via reverse geocoding.', kost: '±€5/1.000 requests (eerste $200/mnd gratis)', url: 'https://mapsplatform.google.com' },
  },
  {
    id: 'kaart', standaard: false, badge: 'BETAALD',
    label: 'Adres op kaart',
    popup: { naam: 'Google Maps JavaScript API', beschrijving: 'Interactieve kaart waarop het ingevoerde of geselecteerde adres gevisualiseerd wordt.', kost: '$200 gratis/mnd, daarna per gebruik', url: 'https://mapsplatform.google.com' },
  },
  {
    id: 'duplicaat', standaard: false, badge: 'GRATIS',
    label: 'Duplicaatdetectie (intern)',
    popup: { naam: 'Eigen databank controle', beschrijving: 'Detecteert dubbele records op basis van naam, adres of contactgegevens in de eigen databank.', kost: 'Gratis — geen externe dienst', url: null },
  },
  {
    id: 'itsme', standaard: false, badge: 'BETAALD',
    label: 'itsme® verificatie',
    popup: { naam: 'itsme® API', beschrijving: 'Digitale identiteitsverificatie via de Belgische itsme®-app. Zakelijk contract vereist bij itsme.', kost: 'Zakelijk contract + per-gebruik kost', url: null },
  },
]

const B7_CHIPS = [
  { id: 'klantenformulier', label: 'Klantenformulier',       standaard: true },
  { id: 'facturatie',       label: 'Facturatiesysteem',      standaard: false },
  { id: 'offerte',          label: 'Offertemodule',          standaard: false },
  { id: 'bestelflow',       label: 'Bestelflow',             standaard: false },
  { id: 'leverancier',      label: 'Leverancier',            standaard: false },
  { id: 'personeel',        label: 'Personeelsdossier',      standaard: false },
  { id: 'herbruikbaar',     label: 'Herbruikbaar component', standaard: false },
]

// ── Hulpfuncties ──────────────────────────────────────────────────────────────

function initChips(chips) {
  return Object.fromEntries(chips.map(c => [c.id, c.standaard ?? false]))
}

function actieveChipLabels(chips, state) {
  return chips.filter(c => state[c.id]).map(c => c.label)
}

function genereerPrompt({ project, huisstijl, framework, taal, extraOpm, b2, b3, b4, b5, b6, b7, n2, n3, n4, n5, n6, n7 }) {
  const klantnaam = project?.klanten?.bedrijfsnaam || project?.klanten?.naam || project?.naam || '[klantnaam]'
  const sector    = huisstijl?.sector || '[sector]'

  const rij = (chips, state) =>
    actieveChipLabels(chips, state).map(l => `- ${l}`).join('\n') || '(geen geselecteerd)'

  const autofillRijen = B5_CHIPS.filter(c => b5[c.id])
    .map(c => `- ${c.label} [${c.badge}]`).join('\n') || '(geen geselecteerd)'

  const geavanRijen = B6_CHIPS.filter(c => b6[c.id])
    .map(c => `- ${c.label} [${c.badge}]`).join('\n') || '(geen geselecteerd)'

  return `# Claude Code prompt
# Module: Adres & Contact Module
# Klant: ${klantnaam}
# Gegenereerd via BYT Studio Adres Configurator

## PROJECTGEGEVENS
Sector: ${sector}
Framework: ${framework || '[framework]'}
Interfacetaal: ${taal}${extraOpm ? `\nOpmerkingen: ${extraOpm}` : ''}

## PERSOONSGEGEVENS
${rij(B2_CHIPS, b2)}${n2 ? `\nExtra wensen: ${n2}` : ''}

## ADRESVELDEN
${rij(B3_CHIPS, b3)}
Nota: Het deelgemeenteveld verschijnt dynamisch — enkel als de postcode meerdere deelgemeenten omvat.${n3 ? `\nExtra wensen: ${n3}` : ''}

## CONTACT & FINANCIEEL
${rij(B4_CHIPS, b4)}${n4 ? `\nExtra wensen: ${n4}` : ''}

## AUTOFILL & SLIMME INVOER
${autofillRijen}${n5 ? `\nExtra wensen: ${n5}` : ''}

## GEAVANCEERDE MODULES
${geavanRijen}${n6 ? `\nExtra wensen: ${n6}` : ''}

## CONTEXT VAN GEBRUIK
${rij(B7_CHIPS, b7)}${n7 ? `\nExtra wensen: ${n7}` : ''}

## HUISSTIJL
De module wordt volledig gebouwd in de huisstijl van de klant. Gebruik de CSS-variabelen uit het centrale design token bestand. Voeg geen eigen kleuren of lettertypes toe buiten het design system.`
}

// ── Sub-componenten ───────────────────────────────────────────────────────────

function BadgePopupKaart({ chip, onSluit }) {
  const p = chip.popup
  return (
    <div
      className="absolute left-0 top-full mt-1.5 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-72"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-sm font-bold text-gray-800">{p.naam}</span>
        <button onClick={onSluit} className="text-gray-400 hover:text-gray-600 flex-shrink-0 mt-0.5">
          <X size={14} />
        </button>
      </div>
      <p className="text-xs text-gray-600 mb-2 leading-relaxed">{p.beschrijving}</p>
      <p className="text-xs font-semibold" style={{ color: '#374151' }}>{p.kost}</p>
      {p.url && (
        <a
          href={p.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-2 transition-colors"
          onClick={e => e.stopPropagation()}
        >
          <ExternalLink size={11} />
          {p.url.replace(/^https?:\/\//, '')}
        </a>
      )}
    </div>
  )
}

function ChipItem({ chip, actief, onToggle, popupId, setPopupId }) {
  const hasBadge = !!chip.badge
  const badgeCfg = hasBadge ? BADGE_CFG[chip.badge] : null
  const isPopupOpen = popupId === chip.id

  return (
    <div className="relative inline-flex items-center gap-1 flex-shrink-0">
      <button
        type="button"
        onClick={() => onToggle(chip.id)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all border"
        style={actief
          ? { background: BYT_GREEN, color: '#fff', borderColor: BYT_GREEN }
          : { background: '#f9fafb', color: '#6b7280', borderColor: '#e5e7eb' }
        }
      >
        {actief && <CheckCircle size={10} strokeWidth={2.5} />}
        {chip.label}
      </button>

      {hasBadge && (
        <button
          type="button"
          onClick={e => {
            e.stopPropagation()
            setPopupId(isPopupOpen ? null : chip.id)
          }}
          className="px-1.5 py-0.5 rounded-full text-xs font-bold cursor-pointer hover:opacity-80 transition-opacity"
          style={{ background: badgeCfg.bg, color: badgeCfg.tekst }}
          title="Klik voor meer info"
        >
          {chip.badge}
        </button>
      )}

      {isPopupOpen && chip.popup && (
        <BadgePopupKaart chip={chip} onSluit={() => setPopupId(null)} />
      )}
    </div>
  )
}

function ConfigBlok({ titel, uitleg, chips, actief, onToggle, notitie, setNotitie, placeholder, infoBanner, popupId, setPopupId }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h2 className="text-sm font-bold text-gray-800 mb-1">{titel}</h2>
      {uitleg && <p className="text-xs text-gray-500 mb-3 leading-relaxed">{uitleg}</p>}
      {infoBanner && (
        <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-3">
          <Info size={13} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <span className="text-xs text-blue-700 leading-relaxed">{infoBanner}</span>
        </div>
      )}
      <div className="flex flex-wrap gap-2 mb-4">
        {chips.map(chip => (
          <ChipItem
            key={chip.id}
            chip={chip}
            actief={actief[chip.id] ?? false}
            onToggle={onToggle}
            popupId={popupId}
            setPopupId={setPopupId}
          />
        ))}
      </div>
      <div className="flex items-start gap-2">
        <Edit3 size={13} className="text-gray-300 flex-shrink-0 mt-2.5" />
        <textarea
          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 bg-white resize-none text-gray-600 placeholder-gray-300 leading-relaxed"
          style={{ '--tw-ring-color': `${BYT_GREEN}30` }}
          rows={2}
          value={notitie}
          onChange={e => setNotitie(e.target.value)}
          placeholder={placeholder}
        />
      </div>
    </div>
  )
}

// ── Hoofdpagina ───────────────────────────────────────────────────────────────
export default function AdresConfigurator() {
  const { id: projectId } = useParams()

  // Project data
  const [project,             setProject]             = useState(null)
  const [huisstijl,           setHuisstijl]           = useState(null)
  const [laden,               setLaden]               = useState(true)
  const [boilerplateId,       setBoilerplateId]       = useState(null)
  const [bestaandKoppelingId, setBestaandKoppelingId] = useState(null)

  // Blok 1 — Projectgegevens
  const [framework, setFramework] = useState('')
  const [taal,      setTaal]      = useState('NL')
  const [extraOpm,  setExtraOpm]  = useState('')

  // Chip states per blok
  const [b2, setB2] = useState(() => initChips(B2_CHIPS))
  const [b3, setB3] = useState(() => initChips(B3_CHIPS))
  const [b4, setB4] = useState(() => initChips(B4_CHIPS))
  const [b5, setB5] = useState(() => initChips(B5_CHIPS))
  const [b6, setB6] = useState(() => initChips(B6_CHIPS))
  const [b7, setB7] = useState(() => initChips(B7_CHIPS))

  // Notities per blok
  const [n2, setN2] = useState('')
  const [n3, setN3] = useState('')
  const [n4, setN4] = useState('')
  const [n5, setN5] = useState('')
  const [n6, setN6] = useState('')
  const [n7, setN7] = useState('')

  // Popup
  const [popupId, setPopupId] = useState(null)

  // UI feedback
  const [gekopieerd, setGekopieerd] = useState(false)
  const [opgeslagen, setOpgeslagen] = useState(false)
  const [bezig,      setBezig]      = useState(false)

  useEffect(() => {
    document.title = 'Adres Configurator — BYT Studio'
    laad()
    const sluit = () => setPopupId(null)
    document.addEventListener('click', sluit)
    return () => document.removeEventListener('click', sluit)
  }, [projectId])

  async function laad() {
    setLaden(true)
    const [{ data: proj }, { data: hs }, { data: bib }] = await Promise.all([
      supabase.from('projecten').select('*, klanten(naam, bedrijfsnaam)').eq('id', projectId).single(),
      supabase.from('huisstijlen').select('*').eq('project_id', projectId).maybeSingle(),
      supabase.from('boilerplates').select('id').eq('naam', 'Adres & Contact Configurator').maybeSingle(),
    ])
    setProject(proj ?? null)
    setHuisstijl(hs ?? null)

    if (bib?.id) {
      setBoilerplateId(bib.id)
      const { data: koppeling } = await supabase
        .from('project_boilerplates')
        .select('id, aanpassingen_json')
        .eq('project_id', projectId)
        .eq('boilerplate_id', bib.id)
        .maybeSingle()

      if (koppeling?.id) {
        setBestaandKoppelingId(koppeling.id)
        const aj = koppeling.aanpassingen_json ?? {}
        if (aj.framework) setFramework(aj.framework)
        if (aj.taal)      setTaal(aj.taal)
        if (aj.extraOpm)  setExtraOpm(aj.extraOpm)
        if (aj.b2) setB2(prev => ({ ...prev, ...aj.b2 }))
        if (aj.b3) setB3(prev => ({ ...prev, ...aj.b3 }))
        if (aj.b4) setB4(prev => ({ ...prev, ...aj.b4 }))
        if (aj.b5) setB5(prev => ({ ...prev, ...aj.b5 }))
        if (aj.b6) setB6(prev => ({ ...prev, ...aj.b6 }))
        if (aj.b7) setB7(prev => ({ ...prev, ...aj.b7 }))
        if (aj.n2) setN2(aj.n2)
        if (aj.n3) setN3(aj.n3)
        if (aj.n4) setN4(aj.n4)
        if (aj.n5) setN5(aj.n5)
        if (aj.n6) setN6(aj.n6)
        if (aj.n7) setN7(aj.n7)
      }
    }
    setLaden(false)
  }

  // Live prompt
  const prompt = useMemo(() => genereerPrompt({
    project, huisstijl, framework, taal, extraOpm,
    b2, b3, b4, b5, b6, b7,
    n2, n3, n4, n5, n6, n7,
  }), [project, huisstijl, framework, taal, extraOpm, b2, b3, b4, b5, b6, b7, n2, n3, n4, n5, n6, n7])

  // Counters
  const aantalVelden     = [b2, b3, b4].flatMap(s => Object.values(s)).filter(Boolean).length
  const aantalAutofill   = Object.values(b5).filter(Boolean).length
  const aantalGeavanceerd = Object.values(b6).filter(Boolean).length

  function toggle(setter) {
    return id => setter(prev => ({ ...prev, [id]: !prev[id] }))
  }

  async function kopieer() {
    await navigator.clipboard.writeText(prompt)
    setGekopieerd(true)
    setTimeout(() => setGekopieerd(false), 2500)
  }

  async function slaOp() {
    setBezig(true)
    const aanpassingen = { framework, taal, extraOpm, b2, b3, b4, b5, b6, b7, n2, n3, n4, n5, n6, n7 }

    if (bestaandKoppelingId) {
      await supabase.from('project_boilerplates').update({
        aanpassingen_json: aanpassingen,
        gegenereerde_prompt: prompt,
        status: 'aangepast',
      }).eq('id', bestaandKoppelingId)
    } else if (boilerplateId) {
      const { data } = await supabase.from('project_boilerplates').insert({
        project_id: projectId,
        boilerplate_id: boilerplateId,
        aanpassingen_json: aanpassingen,
        gegenereerde_prompt: prompt,
        status: 'geselecteerd',
      }).select('id').single()
      if (data?.id) setBestaandKoppelingId(data.id)
    }
    setBezig(false)
    setOpgeslagen(true)
    setTimeout(() => setOpgeslagen(false), 3000)
  }

  const klantnaam   = project?.klanten?.bedrijfsnaam || project?.klanten?.naam || '—'
  const projectnaam = project?.naam || '...'
  const sector      = huisstijl?.sector || ''

  if (laden) return (
    <div className="flex justify-center py-24">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: BYT_GREEN, borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <>
      <style>{`
        @media print {
          .no-print  { display: none !important; }
          .print-full { flex-basis: 100% !important; width: 100% !important; max-width: 100% !important; }
          .print-break { page-break-inside: avoid; }
          body { background: white !important; }
        }
      `}</style>

      <div className="max-w-7xl mx-auto">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex items-start gap-3 mb-6 no-print">
          <Link to={`/projecten/${projectId}`}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 flex-shrink-0 mt-0.5">
            <ChevronLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
              <Link to="/projecten" className="hover:text-gray-600 transition-colors">Projecten</Link>
              <ChevronRight size={11} />
              <Link to={`/projecten/${projectId}`} className="hover:text-gray-600 transition-colors">{projectnaam}</Link>
              <ChevronRight size={11} />
              <span className="text-gray-600 font-medium">Adres Configurator</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Adres & Contact Configurator</h1>
            <p className="text-sm text-gray-500 mt-0.5">{projectnaam} — {klantnaam}</p>
          </div>
        </div>

        {/* Print header */}
        <div className="hidden print-break mb-6" style={{ display: 'none' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Adres & Contact Configurator</h1>
          <p style={{ fontSize: 13, color: '#6b7280' }}>{projectnaam} — {klantnaam}</p>
        </div>

        {/* ── Twee kolommen ─────────────────────────────────────────────── */}
        <div className="flex gap-6 items-start">

          {/* Linker kolom 65% */}
          <div className="flex-1 min-w-0 space-y-4 print-full">

            {/* Blok 1 — Projectgegevens */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 print-break">
              <h2 className="text-sm font-bold text-gray-800 mb-1">Blok 1 — Projectgegevens</h2>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">Projectcontext — automatisch geladen, aanpasbaar.</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Klantnaam</label>
                  <input readOnly value={klantnaam}
                    className="w-full px-3 py-2 rounded-lg border border-gray-100 text-sm bg-gray-50 text-gray-500 cursor-default focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Sector</label>
                  <input readOnly value={sector}
                    className="w-full px-3 py-2 rounded-lg border border-gray-100 text-sm bg-gray-50 text-gray-500 cursor-default focus:outline-none"
                    placeholder="—" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Framework</label>
                  <input
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': `${BYT_GREEN}30` }}
                    value={framework} onChange={e => setFramework(e.target.value)}
                    placeholder="Next.js, React, Vue…" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Interfacetaal</label>
                  <select
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': `${BYT_GREEN}30` }}
                    value={taal} onChange={e => setTaal(e.target.value)}
                  >
                    <option value="NL">Nederlands (NL)</option>
                    <option value="FR">Frans (FR)</option>
                    <option value="EN">Engels (EN)</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Extra opmerkingen</label>
                <textarea
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 resize-none"
                  style={{ '--tw-ring-color': `${BYT_GREEN}30` }}
                  rows={2} value={extraOpm} onChange={e => setExtraOpm(e.target.value)}
                  placeholder="Bijzonderheden, technische context, klantvoorkeur…" />
              </div>
            </div>

            {/* Blok 2 — Persoonsgegevens */}
            <div className="print-break">
              <ConfigBlok
                titel="Blok 2 — Persoonsgegevens"
                uitleg="Welke persoonsgegevens worden opgeslagen? Standaard AAN: voornaam, tussenvoegsel, familienaam."
                chips={B2_CHIPS}
                actief={b2} onToggle={toggle(setB2)}
                notitie={n2} setNotitie={setN2}
                placeholder="Bijkomende velden of speciale vereisten van de klant…"
                popupId={popupId} setPopupId={setPopupId}
              />
            </div>

            {/* Blok 3 — Adresvelden */}
            <div className="print-break">
              <ConfigBlok
                titel="Blok 3 — Adresvelden"
                uitleg="Welke adresvelden worden gebruikt? Standaard AAN: straat, bus, postcode, gemeente, deelgemeente, land."
                chips={B3_CHIPS}
                actief={b3} onToggle={toggle(setB3)}
                notitie={n3} setNotitie={setN3}
                placeholder="Meerdere adressen, leveringsadres vs facturatieadres, internationale adressen…"
                infoBanner="Het deelgemeenteveld verschijnt dynamisch — enkel als de postcode meerdere deelgemeenten omvat."
                popupId={popupId} setPopupId={setPopupId}
              />
            </div>

            {/* Blok 4 — Contact & financieel */}
            <div className="print-break">
              <ConfigBlok
                titel="Blok 4 — Contact & financieel"
                uitleg="Contactgegevens en financiële identifiers. Standaard AAN: telefoon, e-mail."
                chips={B4_CHIPS}
                actief={b4} onToggle={toggle(setB4)}
                notitie={n4} setNotitie={setN4}
                placeholder="Meerdere contactpersonen, specifieke validatieregels, betalingsinfo…"
                popupId={popupId} setPopupId={setPopupId}
              />
            </div>

            {/* Blok 5 — Autofill */}
            <div className="print-break">
              <ConfigBlok
                titel="Blok 5 — Autofill & slimme invoer"
                uitleg="Automatisch aanvullen via externe diensten of lokale algoritmes. Klik de gekleurde badge voor kosten en details."
                chips={B5_CHIPS}
                actief={b5} onToggle={toggle(setB5)}
                notitie={n5} setNotitie={setN5}
                placeholder="Specifieke API-sleutels aanwezig, bijkomende databronnen, offline werking vereist…"
                popupId={popupId} setPopupId={setPopupId}
              />
            </div>

            {/* Blok 6 — Geavanceerde modules */}
            <div className="print-break">
              <ConfigBlok
                titel="Blok 6 — Geavanceerde modules"
                uitleg="Aanvullende scan-, verificatie- en kaartfunctionaliteit. Klik de gekleurde badge voor kosten en details."
                chips={B6_CHIPS}
                actief={b6} onToggle={toggle(setB6)}
                notitie={n6} setNotitie={setN6}
                placeholder="Prioriteiten, later toe te voegen functies, bijkomende wensen…"
                popupId={popupId} setPopupId={setPopupId}
              />
            </div>

            {/* Blok 7 — Context */}
            <div className="print-break">
              <ConfigBlok
                titel="Blok 7 — Context van gebruik"
                uitleg="In welke context wordt deze module gebruikt? Standaard AAN: klantenformulier."
                chips={B7_CHIPS}
                actief={b7} onToggle={toggle(setB7)}
                notitie={n7} setNotitie={setN7}
                placeholder="Integratie met bestaand systeem, koppeling met andere modules, workflows…"
                popupId={popupId} setPopupId={setPopupId}
              />
            </div>

          </div>

          {/* ── Rechter kolom 35% (sticky) ───────────────────────────── */}
          <div className="no-print" style={{ flexBasis: '35%', flexShrink: 0, width: '35%' }}>
            <div style={{ position: 'sticky', top: '24px' }} className="space-y-4">

              {/* Live tellers */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Selectie</p>
                <div className="space-y-2">
                  {[
                    { label: 'Velden geselecteerd', waarde: aantalVelden, kleur: '#374151' },
                    { label: 'Autofill-opties', waarde: aantalAutofill, kleur: BYT_GREEN },
                    { label: 'Geavanceerde modules', waarde: aantalGeavanceerd, kleur: '#185FA5' },
                  ].map(({ label, waarde, kleur }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{label}</span>
                      <span className="text-sm font-bold" style={{ color: kleur }}>{waarde}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live prompt preview */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Gegenereerde prompt</p>
                <textarea
                  readOnly
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-100 text-xs bg-gray-50 font-mono resize-none text-gray-700 focus:outline-none leading-relaxed"
                  style={{ height: '320px' }}
                  value={prompt}
                  onClick={e => e.target.select()}
                />
              </div>

              {/* Feedback */}
              {opgeslagen && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs px-3 py-2 rounded-lg">
                  <CheckCircle size={13} /> Opgeslagen bij project!
                </div>
              )}
              {!boilerplateId && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-2 rounded-lg">
                  <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                  Boilerplate "Adres & Contact Configurator" niet gevonden in de bibliotheek. Opslaan is uitgeschakeld.
                </div>
              )}

              {/* Knoppen */}
              <div className="space-y-2">
                <button
                  onClick={kopieer}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold transition-all"
                  style={{ background: gekopieerd ? '#15803d' : BYT_GREEN }}
                >
                  {gekopieerd ? <CheckCircle size={15} /> : <Copy size={15} />}
                  {gekopieerd ? 'Gekopieerd!' : 'Kopieer prompt'}
                </button>

                <button
                  onClick={slaOp}
                  disabled={bezig || !boilerplateId}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-85 disabled:opacity-40"
                  style={{ background: '#185FA5' }}
                >
                  <Save size={15} />
                  {bezig ? 'Bezig…' : bestaandKoppelingId ? 'Bijwerken bij project' : 'Opslaan bij project'}
                </button>

                <button
                  onClick={() => window.print()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-gray-700 text-sm font-semibold bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <Printer size={15} />
                  Afdrukken
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </>
  )
}
