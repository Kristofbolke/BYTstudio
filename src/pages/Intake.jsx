// Intake.jsx — Intakeformulier per project
import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ChevronLeft, Save, CheckCircle, ChevronDown } from 'lucide-react'

// ── Stijlen ───────────────────────────────────────────────────────────────────
const inp = 'w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 bg-white'
const lbl = 'block text-xs font-semibold text-gray-500 mb-1'
const textarea = inp + ' resize-none'

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  bezig:       { label: 'Bezig',       bg: '#fef9ee', kleur: '#d97706' },
  volledig:    { label: 'Volledig',    bg: '#eff6ff', kleur: '#2563eb' },
  goedgekeurd: { label: 'Goedgekeurd', bg: '#f0fdf4', kleur: '#16a34a' },
}

// ── Dropdown-opties ───────────────────────────────────────────────────────────
const SECTOR_OPTIES = [
  'Horeca', 'Retail', 'Sport & Fitness', 'Zorg & Welzijn',
  'Bouw & Renovatie', 'Transport & Logistiek', 'Professionele diensten',
  'Onderwijs', 'Evenementen', 'Andere',
]
const MEDEWERKERS_OPTIES = ['1-5', '6-15', '16-50', '51-200', '200+']
const OMZET_OPTIES = ['< €250K', '€250K – €1M', '€1M – €5M', '€5M+', 'Liever niet vermelden']

// ── Budget opties (sectie 3) ──────────────────────────────────────────────────
// ── Sectie 5 dropdown-opties ─────────────────────────────────────────────────
const APPARATEN_OPTIES = ['Desktop/laptop', 'Tablet', 'Smartphone', 'Kassa/POS systeem', 'Andere']
const BESTURINGSSYSTEEM_OPTIES = ['Windows', 'Mac', 'Gemengd', 'Weet niet']
const VERBINDING_OPTIES = [
  'Snel (glasvezel/kabel)', 'Normaal (ADSL)', 'Traag', 'Soms offline nodig',
]
const DATAHOEVEELHEID_OPTIES = [
  'Klein (< 1.000 records)', 'Medium (1.000 – 10.000)', 'Groot (> 10.000 records)',
]

// ── Sectie 6 dropdown-opties ─────────────────────────────────────────────────
const GEBRUIKERS_TYPE_OPTIES = [
  'Alleen interne medewerkers',
  'Alleen externe klanten',
  'Zowel medewerkers als klanten',
]
const AANTAL_GEBRUIKERS_OPTIES = ['1-5', '6-20', '21-100', '100+']
const IT_BEKWAAMHEID_OPTIES = [
  'Beginner (weinig computerervaring)',
  'Gemiddeld (werkt dagelijks met computer)',
  'Gevorderd (technisch onderlegd)',
]
const TALEN_OPTIES = ['Nederlands', 'Frans', 'Engels', 'Andere']

// ── Budget opties (sectie 3) ──────────────────────────────────────────────────
const BUDGET_OPTIES = [
  '< €1.500 (Starter app)',
  '€1.500 – €3.000 (Business app)',
  '€3.000 – €6.000 (Pro suite)',
  '> €6.000 (Enterprise)',
  'Nog niet bepaald',
]

// ── Feature groepen (sectie 4) ────────────────────────────────────────────────
const FEATURE_GROEPEN = [
  { naam: 'Basisfunctionaliteit', features: [
    'Login & gebruikersbeheer', 'Dashboard met statistieken', 'Zoeken en filteren',
  ]},
  { naam: 'Klanten & contacten', features: [
    'Klantenbeheer (CRM)', 'Contactpersonen beheer', 'Klanthistoriek',
  ]},
  { naam: 'Planning & reservaties', features: [
    'Reservatiekalender', 'Online boekingsformulier', 'Beschikbaarheidsbeheer',
  ]},
  { naam: 'Financieel', features: [
    'Offertes maken', 'Facturen maken en versturen', 'Betalingsopvolging', 'Prijscalculator',
  ]},
  { naam: 'Communicatie', features: [
    'E-mail notificaties', 'SMS notificaties', 'Chatbot voor klanten',
  ]},
  { naam: 'Rapportage', features: [
    'Grafieken en statistieken', 'Export naar Excel/PDF', 'Maandrapport',
  ]},
  { naam: 'Geavanceerd', features: [
    'AI-suggesties', 'Koppeling met boekhoudsoftware', 'Meertalige interface', 'Mobiele app (PWA)',
  ]},
]

const PRIORITEIT_OPTIES = [
  { value: 'must_have',    label: 'Must have' },
  { value: 'nice_to_have', label: 'Nice to have' },
  { value: 'later',        label: 'Later' },
]

// ── Sectiedefinitie ───────────────────────────────────────────────────────────
const SECTIES = [
  { id: 's1', nr: '01', naam: 'Het bedrijf',
    sleutel: ['bedrijfsnaam', 'sector'],
    alle:    ['bedrijfsnaam', 'sector', 'aantal_medewerkers', 'locaties', 'bestaande_software'] },
  { id: 's2', nr: '02', naam: 'De problematiek',
    sleutel: ['probleem_omschrijving'],
    alle:    ['probleem_omschrijving', 'tijdrovende_processen', 'manueel_werk', 'grootste_frustraties'] },
  { id: 's3', nr: '03', naam: 'De gewenste app',
    sleutel: ['app_doel'],
    alle:    ['app_doel', 'app_functionaliteiten', 'budget_range'] },
  { id: 's4', nr: '04', naam: 'Gewenste features',
    sleutel: ['features_json'],
    alle:    ['features_json'] },
  { id: 's5', nr: '05', naam: 'IT situatie',
    sleutel: ['besturingssysteem'],
    alle:    ['besturingssysteem', 'internetverbinding', 'app_beheerder'] },
  { id: 's6', nr: '06', naam: 'Doelgroep & gebruikers',
    sleutel: ['doelgroep'],
    alle:    ['doelgroep', 'gebruikers_type', 'aantal_gebruikers'] },
]

// ── Voortgangslogica ──────────────────────────────────────────────────────────
const VOORTGANG_VELDEN = [
  'bedrijfsnaam', 'sector', 'aantal_medewerkers', 'locaties', 'bestaande_software',
  'probleem_omschrijving', 'tijdrovende_processen', 'manueel_werk', 'grootste_frustraties',
  'app_doel', 'app_functionaliteiten', 'budget_range',
  'features_json',
  'besturingssysteem', 'internetverbinding', 'app_beheerder',
  'doelgroep', 'gebruikers_type', 'aantal_gebruikers',
]

function checkVeld(v, form) {
  if (v === 'features_json') return Array.isArray(form[v]) && form[v].length > 0
  return !!form[v]
}

function berekenVoortgang(form) {
  const ingevuld = VOORTGANG_VELDEN.filter(v => checkVeld(v, form)).length
  return Math.round((ingevuld / VOORTGANG_VELDEN.length) * 100)
}

// 'volledig' | 'gedeeltelijk' | 'leeg'
function sectieStatus(sectie, form) {
  if (sectie.sleutel.every(v => checkVeld(v, form))) return 'volledig'
  if (sectie.alle.some(v => checkVeld(v, form))) return 'gedeeltelijk'
  return 'leeg'
}

// ── Leeg formulier ────────────────────────────────────────────────────────────
const LEEG = {
  bedrijfsnaam: '', sector: '', aantal_medewerkers: '', omzetgrootte: '',
  locaties: '', bestaande_software: '', website: '', sociale_media: '',
  probleem_omschrijving: '', tijdrovende_processen: '', manueel_werk: '',
  grootste_frustraties: '', eerder_geprobeerd: '',
  app_doel: '', app_functionaliteiten: '', inspiratie_apps: '',
  gewenste_naam: '', gewenste_opleverdatum: '', budget_range: '',
  features_json: [],
  it_afdeling: false, it_afdeling_details: '', app_beheerder: '',
  apparaten_json: [], besturingssysteem: '', internetverbinding: '',
  integraties_nodig: '', datamigratie: false, datamigratie_details: '',
  datahoeveelheid: '',
  doelgroep: '', gebruikers_type: '', aantal_gebruikers: '',
  it_bekwaamheid: '', interface_taal: 'Nederlands', toegankelijkheid: '',
  rollen_nodig: false, rollen_details: '',
  ingevuld_door: '', notities: '',
  status: 'bezig',
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ tekst, onVerberg }) {
  useEffect(() => {
    const t = setTimeout(onVerberg, 3000)
    return () => clearTimeout(t)
  }, [])
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg">
      <CheckCircle size={15} className="text-green-400" />
      {tekst}
    </div>
  )
}

// ── Hoofd component ───────────────────────────────────────────────────────────
export default function Intake() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [project,   setProject]   = useState(null)
  const [form,      setForm]      = useState(LEEG)
  const [intakeId,  setIntakeId]  = useState(null)
  const [laden,     setLaden]     = useState(true)
  const [toast,     setToast]     = useState('')
  const [opslaan,   setOpslaan]   = useState(false)

  const sectieRefs = useRef({})

  useEffect(() => {
    document.title = 'Intakeformulier — BYT Studio'
    laad()
  }, [id])

  async function laad() {
    setLaden(true)
    const [{ data: proj }, { data: intake }] = await Promise.all([
      supabase.from('projecten').select('*, klanten(naam, bedrijfsnaam)').eq('id', id).single(),
      supabase.from('intake').select('*').eq('project_id', id).maybeSingle(),
    ])
    if (proj) setProject(proj)
    if (intake) {
      setIntakeId(intake.id)
      setForm({ ...LEEG, ...intake, features_json: intake.features_json ?? [], apparaten_json: intake.apparaten_json ?? [] })
    }
    setLaden(false)
  }

  // ── Auto-save on blur ──────────────────────────────────────────────────────
  async function slaOpVeld(updates) {
    const payload = { ...updates, project_id: id, bijgewerkt_op: new Date().toISOString() }
    if (intakeId) {
      await supabase.from('intake').update(payload).eq('id', intakeId)
    } else {
      const { data } = await supabase.from('intake').insert(payload).select().single()
      if (data) setIntakeId(data.id)
    }
  }

  function stelIn(veld, waarde) {
    setForm(f => ({ ...f, [veld]: waarde }))
  }

  function onBlur(veld, waarde) {
    slaOpVeld({ [veld]: waarde ?? form[veld] })
  }

  // ── Handmatig opslaan ──────────────────────────────────────────────────────
  async function handmatigOpslaan() {
    setOpslaan(true)
    await slaOpVeld(form)
    setOpslaan(false)
    setToast('Opgeslagen ✓')
  }

  // ── Status wijzigen ────────────────────────────────────────────────────────
  async function wijzigStatus(nieuweStatus) {
    stelIn('status', nieuweStatus)
    await slaOpVeld({ status: nieuweStatus })
  }

  // ── Feature toggle ─────────────────────────────────────────────────────────
  function toggleFeature(naam, groep) {
    const huidig = form.features_json ?? []
    const geselecteerd = huidig.some(f => f.naam === naam)
    const nieuw = geselecteerd
      ? huidig.filter(f => f.naam !== naam)
      : [...huidig, { naam, groep, prioriteit: 'must_have', geselecteerd: true }]
    stelIn('features_json', nieuw)
    slaOpVeld({ features_json: nieuw })
  }

  function setPrioriteit(naam, prioriteit) {
    const nieuw = (form.features_json ?? []).map(f =>
      f.naam === naam ? { ...f, prioriteit } : f
    )
    stelIn('features_json', nieuw)
    slaOpVeld({ features_json: nieuw })
  }

  function toggleApparaat(naam) {
    const huidig = form.apparaten_json ?? []
    const nieuw = huidig.includes(naam) ? huidig.filter(a => a !== naam) : [...huidig, naam]
    stelIn('apparaten_json', nieuw)
    slaOpVeld({ apparaten_json: nieuw })
  }

  function toggleTaal(taal) {
    const huidig = (form.interface_taal ?? '').split(',').map(t => t.trim()).filter(Boolean)
    const nieuw = huidig.includes(taal) ? huidig.filter(t => t !== taal) : [...huidig, taal]
    const value = nieuw.join(', ')
    stelIn('interface_taal', value)
    slaOpVeld({ interface_taal: value })
  }

  async function afrondenIntake() {
    const updates = { ...form, status: 'volledig' }
    stelIn('status', 'volledig')
    await slaOpVeld(updates)
    setToast('Intake volledig ingevuld ✓')
    setTimeout(() => navigate(`/projecten/${id}`), 2000)
  }

  // ── Scroll naar sectie ─────────────────────────────────────────────────────
  function scrollNaar(id) {
    sectieRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (laden) return (
    <div className="flex justify-center py-24">
      <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#185FA5', borderTopColor: 'transparent' }} />
    </div>
  )

  const klantNaam = project?.klanten?.bedrijfsnaam || project?.klanten?.naam || null
  const statusCfg = STATUS_CFG[form.status] ?? STATUS_CFG.bezig

  return (
    <div className="max-w-6xl">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <Link to={`/projecten/${id}`}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition mb-2">
            <ChevronLeft size={14} /> Terug naar project
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Intakeformulier</h1>
          {project && (
            <p className="text-sm text-gray-400 mt-0.5">
              {project.naam}{klantNaam ? ` — ${klantNaam}` : ''}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0 flex-wrap justify-end">
          {/* Status badge */}
          <span className="text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ background: statusCfg.bg, color: statusCfg.kleur }}>
            {statusCfg.label}
          </span>

          {/* Status dropdown */}
          <div className="relative">
            <select
              value={form.status}
              onChange={e => wijzigStatus(e.target.value)}
              className="pl-3 pr-8 py-2 rounded-xl border border-gray-200 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/30 appearance-none"
            >
              {Object.entries(STATUS_CFG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Opslaan knop */}
          <button
            onClick={handmatigOpslaan}
            disabled={opslaan}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-opacity hover:opacity-90"
            style={{ background: '#185FA5' }}
          >
            <Save size={14} />
            {opslaan ? 'Opslaan...' : 'Opslaan'}
          </button>
        </div>
      </div>

      {/* ── Voortgangsbalk ─────────────────────────────────────────────────── */}
      {(() => {
        const pct = berekenVoortgang(form)
        return (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500">Voortgang formulier</span>
              <span className="text-xs font-bold" style={{ color: pct === 100 ? '#16a34a' : '#185FA5' }}>
                {pct}% ingevuld
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background: pct === 100 ? '#16a34a' : '#185FA5',
                }}
              />
            </div>
            {pct === 100 && (
              <p className="text-xs text-green-600 mt-2">Alle velden zijn ingevuld. Klaar om af te ronden!</p>
            )}
          </div>
        )
      })()}

      {/* ── Twee kolommen ──────────────────────────────────────────────────── */}
      <div className="flex gap-6 items-start">

        {/* ── Sectienavigatie (25%) ─────────────────────────────────────── */}
        <div className="w-56 flex-shrink-0 sticky top-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 space-y-1">
            {SECTIES.map(s => {
              const status = sectieStatus(s, form)
              return (
                <button
                  key={s.id}
                  onClick={() => scrollNaar(s.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-xs font-bold text-gray-300 w-6 flex-shrink-0">{s.nr}</span>
                  <span className="text-sm text-gray-600 font-medium flex-1 leading-tight">{s.naam}</span>
                  {status === 'volledig'     && <CheckCircle size={14} className="text-green-500 flex-shrink-0" />}
                  {status === 'gedeeltelijk' && <span className="w-3.5 h-3.5 rounded-full bg-amber-400 flex-shrink-0" />}
                  {status === 'leeg'         && <span className="w-3.5 h-3.5 rounded-full border-2 border-gray-200 flex-shrink-0" />}
                </button>
              )
            })}
          </div>

          {/* Voortgang mini samenvatting */}
          <div className="mt-3 px-3">
            <p className="text-xs text-gray-400">
              {SECTIES.filter(s => sectieStatus(s, form) === 'volledig').length} van {SECTIES.length} secties volledig
            </p>
          </div>
        </div>

        {/* ── Formulier (75%) ──────────────────────────────────────────── */}
        <div className="flex-1 space-y-6">

          {/* ── Sectie 1: Het bedrijf ───────────────────────────────────── */}
          <Sectie id="s1" nr="01" titel="Het bedrijf" subtitel="Vertel ons over de organisatie" ref={el => sectieRefs.current['s1'] = el}>
            <div className="grid grid-cols-2 gap-4">
              <Veld label="Bedrijfsnaam" className="col-span-2">
                <input className={inp} value={form.bedrijfsnaam}
                  onChange={e => stelIn('bedrijfsnaam', e.target.value)}
                  onBlur={() => onBlur('bedrijfsnaam')} />
              </Veld>
              <Veld label="Sector">
                <div className="relative">
                  <select className={inp + ' appearance-none pr-8'} value={form.sector}
                    onChange={e => { stelIn('sector', e.target.value); onBlur('sector', e.target.value) }}>
                    <option value="">— Kies een sector —</option>
                    {SECTOR_OPTIES.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </Veld>
              <Veld label="Aantal medewerkers">
                <div className="relative">
                  <select className={inp + ' appearance-none pr-8'} value={form.aantal_medewerkers}
                    onChange={e => { stelIn('aantal_medewerkers', e.target.value); onBlur('aantal_medewerkers', e.target.value) }}>
                    <option value="">— Kies —</option>
                    {MEDEWERKERS_OPTIES.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </Veld>
              <Veld label="Omzetgrootte (optioneel)" className="col-span-2">
                <div className="relative">
                  <select className={inp + ' appearance-none pr-8'} value={form.omzetgrootte}
                    onChange={e => { stelIn('omzetgrootte', e.target.value); onBlur('omzetgrootte', e.target.value) }}>
                    <option value="">— Kies —</option>
                    {OMZET_OPTIES.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </Veld>
              <Veld label="Locatie(s)" className="col-span-2">
                <input className={inp} value={form.locaties}
                  onChange={e => stelIn('locaties', e.target.value)}
                  onBlur={() => onBlur('locaties')}
                  placeholder="Bv. Gent (hoofdkantoor), Antwerpen (filiaal)" />
              </Veld>
              <Veld label="Bestaande software & tools" className="col-span-2">
                <textarea className={textarea} rows={3} value={form.bestaande_software}
                  onChange={e => stelIn('bestaande_software', e.target.value)}
                  onBlur={() => onBlur('bestaande_software')}
                  placeholder={'Welke software gebruikt het bedrijf vandaag?\nBv. Excel, Exact Online, Lightspeed...'} />
              </Veld>
              <Veld label="Website">
                <input className={inp} value={form.website}
                  onChange={e => stelIn('website', e.target.value)}
                  onBlur={() => onBlur('website')} placeholder="https://..." />
              </Veld>
              <Veld label="Sociale media">
                <input className={inp} value={form.sociale_media}
                  onChange={e => stelIn('sociale_media', e.target.value)}
                  onBlur={() => onBlur('sociale_media')}
                  placeholder="Bv. LinkedIn, Instagram, Facebook" />
              </Veld>
            </div>
          </Sectie>

          {/* ── Sectie 2: De problematiek ───────────────────────────────── */}
          <Sectie id="s2" nr="02" titel="De problematiek" subtitel="Wat loopt er nu niet goed?" ref={el => sectieRefs.current['s2'] = el}>
            <div className="space-y-4">
              <Veld label="Wat is het hoofdprobleem dat de app moet oplossen?">
                <textarea className={textarea} value={form.probleem_omschrijving}
                  onChange={e => stelIn('probleem_omschrijving', e.target.value)}
                  onBlur={() => onBlur('probleem_omschrijving')}
                  placeholder="Beschrijf het probleem zo concreet mogelijk..."
                  style={{ minHeight: 120 }} />
              </Veld>
              <Veld label="Welke processen kosten te veel tijd?">
                <textarea className={textarea} rows={3} value={form.tijdrovende_processen}
                  onChange={e => stelIn('tijdrovende_processen', e.target.value)}
                  onBlur={() => onBlur('tijdrovende_processen')}
                  placeholder="Bv. manueel facturen opmaken, reservaties bijhouden in Excel..." />
              </Veld>
              <Veld label="Wat wordt nu manueel gedaan dat geautomatiseerd kan worden?">
                <textarea className={textarea} rows={3} value={form.manueel_werk}
                  onChange={e => stelIn('manueel_werk', e.target.value)}
                  onBlur={() => onBlur('manueel_werk')} />
              </Veld>
              <Veld label="Wat zijn de grootste frustraties met de huidige aanpak?">
                <textarea className={textarea} rows={3} value={form.grootste_frustraties}
                  onChange={e => stelIn('grootste_frustraties', e.target.value)}
                  onBlur={() => onBlur('grootste_frustraties')} />
              </Veld>
              <Veld label="Heeft u al eerder een oplossing geprobeerd?">
                <input className={inp} value={form.eerder_geprobeerd}
                  onChange={e => stelIn('eerder_geprobeerd', e.target.value)}
                  onBlur={() => onBlur('eerder_geprobeerd')}
                  placeholder="Bv. een andere app, een consultant, maatwerk..." />
              </Veld>
            </div>
          </Sectie>

          {/* ── Sectie 3: De gewenste app ───────────────────────────────── */}
          <Sectie id="s3" nr="03" titel="De gewenste app" subtitel="Wat moet de app kunnen doen?" ref={el => sectieRefs.current['s3'] = el}>
            <div className="space-y-4">
              <Veld label={<>Wat is het belangrijkste doel van de app? <span className="text-red-400">*</span></>}>
                <textarea className={textarea} value={form.app_doel}
                  onChange={e => stelIn('app_doel', e.target.value)}
                  onBlur={() => onBlur('app_doel')}
                  style={{ minHeight: 100 }} />
              </Veld>
              <Veld label="Wat moet de app allemaal kunnen doen?">
                <textarea className={textarea} rows={4} value={form.app_functionaliteiten}
                  onChange={e => stelIn('app_functionaliteiten', e.target.value)}
                  onBlur={() => onBlur('app_functionaliteiten')}
                  placeholder="Beschrijf alle gewenste functies..." />
              </Veld>
              <Veld label="Zijn er bestaande apps die u inspireren?">
                <input className={inp} value={form.inspiratie_apps}
                  onChange={e => stelIn('inspiratie_apps', e.target.value)}
                  onBlur={() => onBlur('inspiratie_apps')}
                  placeholder="Bv. Planity, Lightspeed, Teamleader..." />
              </Veld>
              <div className="grid grid-cols-2 gap-4">
                <Veld label="Heeft u al een naam in gedachten?">
                  <input className={inp} value={form.gewenste_naam}
                    onChange={e => stelIn('gewenste_naam', e.target.value)}
                    onBlur={() => onBlur('gewenste_naam')}
                    placeholder="Optioneel" />
                </Veld>
                <Veld label="Wanneer moet de app klaar zijn?">
                  <input type="date" className={inp} value={form.gewenste_opleverdatum ?? ''}
                    onChange={e => stelIn('gewenste_opleverdatum', e.target.value)}
                    onBlur={() => onBlur('gewenste_opleverdatum')} />
                </Veld>
                <Veld label="Wat is het beschikbare budget?" className="col-span-2">
                  <div className="relative">
                    <select className={inp + ' appearance-none pr-8'} value={form.budget_range}
                      onChange={e => { stelIn('budget_range', e.target.value); onBlur('budget_range', e.target.value) }}>
                      <option value="">— Kies een budget range —</option>
                      {BUDGET_OPTIES.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </Veld>
              </div>
            </div>
          </Sectie>

          {/* ── Sectie 4: Gewenste features ─────────────────────────────── */}
          <Sectie id="s4" nr="04" titel="Gewenste features" subtitel="Welke functies heeft de app nodig?" ref={el => sectieRefs.current['s4'] = el}>
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700 mb-5 leading-relaxed">
              Vink aan wat u nodig heeft. Maak onderscheid tussen wat nu noodzakelijk is en wat later kan.
            </div>

            <div className="space-y-6">
              {FEATURE_GROEPEN.map(groep => (
                <div key={groep.naam}>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{groep.naam}</p>
                  <div className="space-y-2">
                    {groep.features.map(naam => {
                      const entry = (form.features_json ?? []).find(f => f.naam === naam)
                      const geselecteerd = !!entry
                      return (
                        <div key={naam}
                          className={`rounded-xl border transition-colors ${
                            geselecteerd ? 'border-blue-200 bg-blue-50/60' : 'border-gray-100 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3 px-4 py-3">
                            {/* Checkbox */}
                            <button
                              type="button"
                              onClick={() => toggleFeature(naam, groep.naam)}
                              className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
                                geselecteerd ? 'bg-blue-500 border-blue-500' : 'border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              {geselecteerd && <CheckCircle size={10} className="text-white" />}
                            </button>

                            {/* Naam */}
                            <span
                              className={`text-sm flex-1 cursor-pointer select-none ${geselecteerd ? 'text-blue-800 font-medium' : 'text-gray-600'}`}
                              onClick={() => toggleFeature(naam, groep.naam)}
                            >
                              {naam}
                            </span>

                            {/* Prioriteit radio's — alleen zichtbaar als geselecteerd */}
                            {geselecteerd && (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {PRIORITEIT_OPTIES.map(p => (
                                  <button
                                    key={p.value}
                                    type="button"
                                    onClick={() => setPrioriteit(naam, p.value)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                                      entry.prioriteit === p.value
                                        ? p.value === 'must_have'
                                          ? 'bg-blue-500 text-white'
                                          : p.value === 'nice_to_have'
                                            ? 'bg-amber-400 text-white'
                                            : 'bg-gray-400 text-white'
                                        : 'bg-white border border-gray-200 text-gray-400 hover:border-gray-300'
                                    }`}
                                  >
                                    {p.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {(form.features_json ?? []).length > 0 && (
              <p className="text-xs text-gray-400 mt-4">
                {(form.features_json ?? []).length} feature(s) geselecteerd —{' '}
                {(form.features_json ?? []).filter(f => f.prioriteit === 'must_have').length} must have,{' '}
                {(form.features_json ?? []).filter(f => f.prioriteit === 'nice_to_have').length} nice to have,{' '}
                {(form.features_json ?? []).filter(f => f.prioriteit === 'later').length} later
              </p>
            )}
          </Sectie>

          {/* ── Sectie 5: IT situatie ────────────────────────────────────── */}
          <Sectie id="s5" nr="05" titel="IT situatie" subtitel="Technische context van het bedrijf" ref={el => sectieRefs.current['s5'] = el}>
            <div className="space-y-5">

              {/* IT afdeling toggle */}
              <div>
                <BoolVeld
                  label="IT-afdeling aanwezig"
                  waarde={form.it_afdeling}
                  onChange={v => { stelIn('it_afdeling', v); slaOpVeld({ it_afdeling: v }) }}
                />
                {form.it_afdeling && (
                  <div className="mt-3">
                    <Veld label="Beschrijf de IT afdeling">
                      <textarea className={textarea} rows={2} value={form.it_afdeling_details}
                        onChange={e => stelIn('it_afdeling_details', e.target.value)}
                        onBlur={() => onBlur('it_afdeling_details')} />
                    </Veld>
                  </div>
                )}
              </div>

              {/* Wie beheert de app */}
              <Veld label="Wie beheert de app na oplevering?">
                <input className={inp} value={form.app_beheerder}
                  onChange={e => stelIn('app_beheerder', e.target.value)}
                  onBlur={() => onBlur('app_beheerder')}
                  placeholder="Bv. zaakvoerder zelf, office manager, externe IT..." />
              </Veld>

              {/* Apparaten checkboxes */}
              <Veld label="Op welke apparaten wordt de app gebruikt?">
                <div className="flex flex-wrap gap-2 mt-1">
                  {APPARATEN_OPTIES.map(a => {
                    const actief = (form.apparaten_json ?? []).includes(a)
                    return (
                      <button key={a} type="button" onClick={() => toggleApparaat(a)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                          actief ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}>
                        <span className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center ${actief ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                          {actief && <CheckCircle size={9} className="text-white" />}
                        </span>
                        {a}
                      </button>
                    )
                  })}
                </div>
              </Veld>

              <div className="grid grid-cols-2 gap-4">
                {/* Besturingssysteem */}
                <Veld label="Besturingssysteem">
                  <div className="relative">
                    <select className={inp + ' appearance-none pr-8'} value={form.besturingssysteem}
                      onChange={e => { stelIn('besturingssysteem', e.target.value); onBlur('besturingssysteem', e.target.value) }}>
                      <option value="">— Kies —</option>
                      {BESTURINGSSYSTEEM_OPTIES.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </Veld>

                {/* Internetverbinding */}
                <Veld label="Internetverbinding">
                  <div className="relative">
                    <select className={inp + ' appearance-none pr-8'} value={form.internetverbinding}
                      onChange={e => { stelIn('internetverbinding', e.target.value); onBlur('internetverbinding', e.target.value) }}>
                      <option value="">— Kies —</option>
                      {VERBINDING_OPTIES.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </Veld>
              </div>

              {/* Integraties */}
              <Veld label="Met welke bestaande systemen moet de app koppelen?">
                <textarea className={textarea} rows={3} value={form.integraties_nodig}
                  onChange={e => stelIn('integraties_nodig', e.target.value)}
                  onBlur={() => onBlur('integraties_nodig')}
                  placeholder="Bv. Exact Online, WooCommerce, Outlook..." />
              </Veld>

              {/* Datamigratie toggle */}
              <div>
                <BoolVeld
                  label="Datamigratie nodig"
                  waarde={form.datamigratie}
                  onChange={v => { stelIn('datamigratie', v); slaOpVeld({ datamigratie: v }) }}
                />
                {form.datamigratie && (
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <Veld label="Welke data moet worden overgezet?">
                      <input className={inp} value={form.datamigratie_details}
                        onChange={e => stelIn('datamigratie_details', e.target.value)}
                        onBlur={() => onBlur('datamigratie_details')} />
                    </Veld>
                    <Veld label="Hoeveelheid data">
                      <div className="relative">
                        <select className={inp + ' appearance-none pr-8'} value={form.datahoeveelheid}
                          onChange={e => { stelIn('datahoeveelheid', e.target.value); onBlur('datahoeveelheid', e.target.value) }}>
                          <option value="">— Kies —</option>
                          {DATAHOEVEELHEID_OPTIES.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </Veld>
                  </div>
                )}
              </div>

            </div>
          </Sectie>

          {/* ── Sectie 6: Doelgroep & gebruikers ────────────────────────── */}
          <Sectie id="s6" nr="06" titel="Doelgroep & gebruikers" subtitel="Wie gaat met de app werken?" ref={el => sectieRefs.current['s6'] = el}>
            <div className="space-y-5">

              <Veld label="Wie zijn de eindgebruikers?">
                <textarea className={textarea} rows={2} value={form.doelgroep}
                  onChange={e => stelIn('doelgroep', e.target.value)}
                  onBlur={() => onBlur('doelgroep')}
                  placeholder="Bv. medewerkers van het bedrijf, klanten van het bedrijf, beide" />
              </Veld>

              {/* Type gebruikers — radio */}
              <Veld label="Type gebruikers">
                <div className="space-y-2 mt-1">
                  {GEBRUIKERS_TYPE_OPTIES.map(opt => (
                    <label key={opt} className="flex items-center gap-2.5 cursor-pointer">
                      <span
                        onClick={() => { stelIn('gebruikers_type', opt); slaOpVeld({ gebruikers_type: opt }) }}
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          form.gebruikers_type === opt ? 'border-blue-500' : 'border-gray-300'
                        }`}
                      >
                        {form.gebruikers_type === opt && <span className="w-2 h-2 rounded-full bg-blue-500 block" />}
                      </span>
                      <span className="text-sm text-gray-600">{opt}</span>
                    </label>
                  ))}
                </div>
              </Veld>

              <div className="grid grid-cols-2 gap-4">
                {/* Aantal gebruikers */}
                <Veld label="Aantal verwachte gebruikers">
                  <div className="relative">
                    <select className={inp + ' appearance-none pr-8'} value={form.aantal_gebruikers}
                      onChange={e => { stelIn('aantal_gebruikers', e.target.value); onBlur('aantal_gebruikers', e.target.value) }}>
                      <option value="">— Kies —</option>
                      {AANTAL_GEBRUIKERS_OPTIES.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </Veld>

                {/* IT-bekwaamheid */}
                <Veld label="IT-bekwaamheid gebruikers">
                  <div className="relative">
                    <select className={inp + ' appearance-none pr-8'} value={form.it_bekwaamheid}
                      onChange={e => { stelIn('it_bekwaamheid', e.target.value); onBlur('it_bekwaamheid', e.target.value) }}>
                      <option value="">— Kies —</option>
                      {IT_BEKWAAMHEID_OPTIES.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </Veld>
              </div>

              {/* Interface taal — checkboxes */}
              <Veld label="Interface taal">
                <div className="flex flex-wrap gap-2 mt-1">
                  {TALEN_OPTIES.map(taal => {
                    const actief = (form.interface_taal ?? '').split(',').map(t => t.trim()).includes(taal)
                    return (
                      <button key={taal} type="button" onClick={() => toggleTaal(taal)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                          actief ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}>
                        <span className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center ${actief ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                          {actief && <CheckCircle size={9} className="text-white" />}
                        </span>
                        {taal}
                      </button>
                    )
                  })}
                </div>
              </Veld>

              {/* Toegankelijkheid */}
              <Veld label="Zijn er speciale toegankelijkheidsvereisten?">
                <textarea className={textarea} rows={2} value={form.toegankelijkheid}
                  onChange={e => stelIn('toegankelijkheid', e.target.value)}
                  onBlur={() => onBlur('toegankelijkheid')}
                  placeholder="Bv. groot lettertype voor oudere gebruikers, kleurenblindheid..." />
              </Veld>

              {/* Rollen toggle */}
              <div>
                <BoolVeld
                  label="Rollen & rechtenbeheer nodig"
                  waarde={form.rollen_nodig}
                  onChange={v => { stelIn('rollen_nodig', v); slaOpVeld({ rollen_nodig: v }) }}
                />
                {form.rollen_nodig && (
                  <div className="mt-3">
                    <Veld label="Welke rollen en rechten zijn nodig?">
                      <textarea className={textarea} rows={3} value={form.rollen_details}
                        onChange={e => stelIn('rollen_details', e.target.value)}
                        onBlur={() => onBlur('rollen_details')}
                        placeholder={'Bv. admin kan alles, medewerker kan alleen eigen data zien,\nklant kan alleen boeken...'} />
                    </Veld>
                  </div>
                )}
              </div>

            </div>
          </Sectie>

          {/* ── Interne notities ─────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-gray-700">Interne notities (niet zichtbaar voor klant)</h3>
            <Veld label="Ingevuld door">
              <input className={inp} value={form.ingevuld_door}
                onChange={e => stelIn('ingevuld_door', e.target.value)}
                onBlur={() => onBlur('ingevuld_door')}
                placeholder="Naam van de invuller" />
            </Veld>
            <Veld label="">
              <textarea className={textarea} rows={5} value={form.notities}
                onChange={e => stelIn('notities', e.target.value)}
                onBlur={() => onBlur('notities')}
                placeholder="Notities, opmerkingen, aandachtspunten..." />
            </Veld>
          </div>

          {/* ── Intake afronden ──────────────────────────────────────────── */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-green-800">Intake afronden</p>
              <p className="text-xs text-green-600 mt-0.5">Markeer de intake als volledig ingevuld en keer terug naar het project.</p>
            </div>
            <button
              onClick={afrondenIntake}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 flex-shrink-0"
              style={{ background: '#16a34a' }}
            >
              <CheckCircle size={16} />
              Intake afronden
            </button>
          </div>

        </div>
      </div>

      {toast && <Toast tekst={toast} onVerberg={() => setToast('')} />}
    </div>
  )
}

// ── Hulpcomponenten ───────────────────────────────────────────────────────────
function Sectie({ id, nr, titel, subtitel, children, ...props }) {
  return (
    <div id={id} ref={props.ref} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 scroll-mt-4">
      <div className="mb-5">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-300">{nr}</span>
          <h2 className="text-base font-bold text-gray-800">{titel}</h2>
        </div>
        {subtitel && <p className="text-xs text-gray-400 mt-1 ml-9">{subtitel}</p>}
      </div>
      {children}
    </div>
  )
}

function Veld({ label, children, className = '' }) {
  return (
    <div className={className}>
      <label className={lbl}>{label}</label>
      {children}
    </div>
  )
}

function BoolVeld({ label, waarde, onChange }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer">
      <div
        onClick={() => onChange(!waarde)}
        className={`w-9 h-5 rounded-full relative transition-colors flex-shrink-0 ${waarde ? 'bg-blue-500' : 'bg-gray-200'}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${waarde ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </div>
      <span className="text-sm text-gray-600">{label}</span>
    </label>
  )
}
