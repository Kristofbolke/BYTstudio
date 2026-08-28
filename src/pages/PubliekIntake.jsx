// PubliekIntake.jsx — Publiek intakeformulier voor de BYT Studio-website (geen login vereist)
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { CheckCircle, ChevronLeft, ChevronRight, Upload } from 'lucide-react'

const STAPPEN = [
  'Uw bedrijf', 'Uw huisstijl', 'Uw uitdaging', 'De gewenste app',
  'Gewenste features', 'Technisch & gebruikers', 'Afronden',
]

const MEDEWERKERS_OPTIES = ['1-5', '6-15', '16-50', '50+']
const ONDERNEMINGSVORM_OPTIES = ['Eenmanszaak', 'BV', 'NV', 'VZW', 'Andere']
const TIJD_VERLOREN_OPTIES = ['Minder dan 1u/dag', '1-2u/dag', '2-4u/dag', 'Meer dan 4u/dag', 'Weet niet']
const TYPE_APP_OPTIES = [
  { key: 'web',       label: 'Web app (desktop + laptop)' },
  { key: 'mobiel',     label: 'Mobiele app (smartphone)' },
  { key: 'pwa',        label: 'PWA (werkt op alle toestellen)' },
  { key: 'intern',     label: 'Intern beheersysteem' },
  { key: 'klanten',    label: 'Klanten-portaal' },
  { key: 'geen_idee',  label: 'Nog geen idee' },
]
const PRIORITEIT_OPTIES = ['Zo snel mogelijk', 'Binnen 3 maanden', 'Binnen 6 maanden', 'Geen haast']
const BUDGET_OPTIES = [
  'Minder dan €1.500 (Starter)',
  '€1.500 - €3.000 (Business)',
  '€3.000 - €6.000 (Pro)',
  'Meer dan €6.000 (Enterprise)',
  'Nog niet bepaald',
]
const FEATURES_OPTIES = [
  'Login & gebruikersbeheer', 'Dashboard met statistieken', 'Klantenbeheer',
  'Reservatiesysteem', 'Online boekingsformulier', 'Facturen maken',
  'Offertes maken', 'Betalingsopvolging', 'Personeelsplanning',
  'Productbeheer', 'Bestellingsbeheer', 'E-mail notificaties',
  'Chatbot voor klanten', 'Koppeling boekhoudpakket', 'Export naar Excel/PDF',
  'Statistieken & grafieken', 'Meertalig', 'Mobiele app (PWA)',
]
const APPARATEN_OPTIES = ['Desktop/laptop', 'Smartphone', 'Tablet', 'Kassa/POS systeem']
const GEBRUIKERS_TYPE_OPTIES = ['Alleen onze medewerkers', 'Alleen onze klanten', 'Zowel medewerkers als klanten']
const AANTAL_GEBRUIKERS_OPTIES = ['1-5', '6-20', '21-100', '100+']
const IT_BEKWAAMHEID_OPTIES = ['Beginner', 'Gemiddeld', 'Gevorderd']
const TALEN_OPTIES = ['Nederlands', 'Frans', 'Engels']
const HOSTING_OPTIES = ['Netlify (aanbevolen)', 'Vercel', 'Bestaande hosting behouden', 'Geen voorkeur']
const TECHNISCHE_KENNIS_OPTIES = ['Geen IT', 'Basis IT kennis', 'Eigen IT afdeling', 'Externe IT partner']

const LEEG = {
  bedrijfsnaam: '', contactpersoon_naam: '', contactpersoon_functie: '',
  contactpersoon_email: '', contactpersoon_telefoon: '', website: '',
  sector: '', aantal_medewerkers: '', ondernemingsvorm: '', adres: '',
  heeft_huisstijl: null, huisstijl_beschrijving: '', logo_url: '', stijldocument_url: '',
  huidige_werkwijze: '', grootste_pijnpunt: '', tijd_verloren: '', eerder_geprobeerd: '',
  type_app: '', omschrijving_app: '', vergelijkbaar_voorbeeld: '', prioriteit: '',
  budget_indicatie: '', gewenste_opleverdatum: '',
  features: [],
  apparaten: [], gebruikers_type: '', aantal_gebruikers: '', it_bekwaamheid: '',
  interface_talen: [], integraties_nodig: '',
  hosting_voorkeur: '', technische_kennis_bedrijf: '', opmerkingen: '',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ── Kleine UI-bouwstenen ──────────────────────────────────────────────────────
function Kaart({ children }) {
  return <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 space-y-5">{children}</div>
}

function Veld({ label, verplicht, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label}{verplicht && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C35D]/30 focus:border-[#22C35D] bg-white"

function RadioKaarten({ opties, waarde, onChange, render }) {
  return (
    <div className="grid gap-2">
      {opties.map(o => {
        const key = typeof o === 'string' ? o : o.key
        const label = typeof o === 'string' ? o : o.label
        const actief = waarde === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm text-left transition-colors ${
              actief ? 'border-[#22C35D] bg-[#22C35D]/5 text-gray-900 font-semibold' : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${actief ? 'border-[#22C35D] bg-[#22C35D]' : 'border-gray-300'}`} />
            {render ? render(o) : label}
          </button>
        )
      })}
    </div>
  )
}

function Checkboxen({ opties, waarden, onToggle, kolommen = 1 }) {
  return (
    <div className={kolommen === 2 ? 'grid grid-cols-1 sm:grid-cols-2 gap-2' : 'grid gap-2'}>
      {opties.map(label => {
        const actief = waarden.includes(label)
        return (
          <button
            key={label}
            type="button"
            onClick={() => onToggle(label)}
            className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border text-sm text-left transition-colors ${
              actief ? 'border-[#22C35D] bg-[#22C35D]/5 text-gray-900 font-semibold' : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <span className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border-2 ${actief ? 'border-[#22C35D] bg-[#22C35D]' : 'border-gray-300'}`}>
              {actief && <CheckCircle size={11} className="text-white" strokeWidth={3} />}
            </span>
            {label}
          </button>
        )
      })}
    </div>
  )
}

// ── Hoofdcomponent ────────────────────────────────────────────────────────────
export default function PubliekIntake() {
  const [stap, setStap] = useState(1)
  const [form, setForm] = useState(LEEG)
  const [sectoren, setSectoren] = useState([])
  const [bezig, setBezig] = useState(false)
  const [uploadenLogo, setUploadenLogo] = useState(false)
  const [uploadenDoc, setUploadenDoc] = useState(false)
  const [fout, setFout] = useState('')
  const [verstuurd, setVerstuurd] = useState(false)

  useEffect(() => {
    document.title = 'Intakeformulier — Build Your Tools'
    supabase.from('sectoren').select('naam').eq('actief', true).order('naam')
      .then(({ data }) => setSectoren(data ?? []))
  }, [])

  function stel(veld, waarde) { setForm(f => ({ ...f, [veld]: waarde })) }
  function toggleArray(veld, waarde) {
    setForm(f => {
      const huidig = f[veld] ?? []
      return { ...f, [veld]: huidig.includes(waarde) ? huidig.filter(v => v !== waarde) : [...huidig, waarde] }
    })
  }

  async function uploadBestand(e, veld, setUploaden, maxMb, toegestaan) {
    const file = e.target.files?.[0]
    if (!file) return
    if (toegestaan && !toegestaan.some(t => file.type.includes(t) || file.name.toLowerCase().endsWith(t))) {
      setFout('Bestandstype niet toegestaan.'); e.target.value = ''; return
    }
    if (file.size > maxMb * 1024 * 1024) { setFout(`Bestand is te groot (max ${maxMb}MB).`); e.target.value = ''; return }
    setUploaden(true); setFout('')
    const ext = file.name.split('.').pop()
    const pad = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const { error } = await supabase.storage.from('lead-uploads').upload(pad, file)
    if (error) { setFout('Upload mislukt: ' + error.message); setUploaden(false); e.target.value = ''; return }
    const { data } = supabase.storage.from('lead-uploads').getPublicUrl(pad)
    stel(veld, data.publicUrl)
    setUploaden(false)
  }

  function volgende() { setFout(''); setStap(s => Math.min(7, s + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  function vorige() { setFout(''); setStap(s => Math.max(1, s - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  function valideer() {
    if (!form.bedrijfsnaam.trim())        return { stap: 1, msg: 'Bedrijfsnaam is verplicht.' }
    if (!form.contactpersoon_naam.trim()) return { stap: 1, msg: 'Naam contactpersoon is verplicht.' }
    if (!form.contactpersoon_email.trim() || !EMAIL_RE.test(form.contactpersoon_email))
      return { stap: 1, msg: 'Vul een geldig e-mailadres in.' }
    if (!form.grootste_pijnpunt.trim())   return { stap: 3, msg: 'Beschrijf uw grootste pijnpunt.' }
    if (!form.omschrijving_app.trim())    return { stap: 4, msg: 'Omschrijf wat de app moet doen.' }
    return null
  }

  async function versturen() {
    const probleem = valideer()
    if (probleem) { setStap(probleem.stap); setFout(probleem.msg); window.scrollTo({ top: 0, behavior: 'smooth' }); return }

    setBezig(true); setFout('')
    const payload = { ...form, status: 'nieuw', ingediend_op: new Date().toISOString() }
    const { error } = await supabase.from('leads').insert(payload)
    setBezig(false)
    if (error) { setFout('Versturen mislukt: ' + error.message); return }

    // Fallback e-mailnotificatie (geen Edge Function beschikbaar in dit project)
    const onderwerp = encodeURIComponent(`Nieuwe lead: ${form.bedrijfsnaam}`)
    const inhoud = encodeURIComponent(
      `Nieuwe aanvraag via het intakeformulier.\n\n` +
      `Bedrijf: ${form.bedrijfsnaam}\nContactpersoon: ${form.contactpersoon_naam}\n` +
      `E-mail: ${form.contactpersoon_email}\nTelefoon: ${form.contactpersoon_telefoon || '—'}\n\n` +
      `Grootste pijnpunt: ${form.grootste_pijnpunt}\n\nApp-omschrijving: ${form.omschrijving_app}`
    )
    window.location.href = `mailto:kristof@jogoo.be?subject=${onderwerp}&body=${inhoud}`

    setVerstuurd(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Bedankpagina ──────────────────────────────────────────────────────────
  if (verstuurd) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0f172a' }}>
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#22C35D]/10 flex items-center justify-center mx-auto">
            <CheckCircle size={32} className="text-[#22C35D]" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Bedankt {form.contactpersoon_naam.split(' ')[0] || ''}!</h1>
          <p className="text-sm text-gray-600">We nemen binnen 2 werkdagen contact met u op.</p>
          <p className="text-xs text-gray-400 pt-4 border-t border-gray-100">© BYT — Build Your Tools</p>
        </div>
      </div>
    )
  }

  const progressPct = (stap / STAPPEN.length) * 100

  return (
    <div className="min-h-screen pb-16" style={{ background: '#0f172a' }}>
      <div className="max-w-[720px] mx-auto px-4 pt-10">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/logo-byt.png" alt="Build Your Tools" className="h-10 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Vertel ons over uw project</h1>
          <p className="text-sm text-slate-400 mt-1">Wij nemen binnen 2 werkdagen contact met u op.</p>
        </div>

        {/* Voortgangsbalk */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">Stap {stap} van {STAPPEN.length}</span>
            <span className="text-xs text-slate-400">{STAPPEN[stap - 1]}</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progressPct}%`, background: '#22C35D' }} />
          </div>
        </div>

        {fout && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{fout}</div>
        )}

        {/* ── STAP 1 — Uw bedrijf ── */}
        {stap === 1 && (
          <Kaart>
            <h2 className="text-lg font-bold text-gray-900">Uw bedrijf</h2>
            <Veld label="Bedrijfsnaam" verplicht>
              <input className={inputCls} value={form.bedrijfsnaam} onChange={e => stel('bedrijfsnaam', e.target.value)} placeholder="Uw bedrijfsnaam" />
            </Veld>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Veld label="Contactpersoon naam" verplicht>
                <input className={inputCls} value={form.contactpersoon_naam} onChange={e => stel('contactpersoon_naam', e.target.value)} placeholder="Voornaam Achternaam" />
              </Veld>
              <Veld label="Functie/rol">
                <input className={inputCls} value={form.contactpersoon_functie} onChange={e => stel('contactpersoon_functie', e.target.value)} placeholder="Bv. Zaakvoerder" />
              </Veld>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Veld label="E-mailadres" verplicht>
                <input type="email" className={inputCls} value={form.contactpersoon_email} onChange={e => stel('contactpersoon_email', e.target.value)} placeholder="naam@bedrijf.be" />
              </Veld>
              <Veld label="Telefoon">
                <input className={inputCls} value={form.contactpersoon_telefoon} onChange={e => stel('contactpersoon_telefoon', e.target.value)} placeholder="+32 4XX XX XX XX" />
              </Veld>
            </div>
            <Veld label="Website">
              <input className={inputCls} value={form.website} onChange={e => stel('website', e.target.value)} placeholder="https://..." />
            </Veld>
            <Veld label="Sector">
              <select className={inputCls} value={form.sector} onChange={e => stel('sector', e.target.value)}>
                <option value="">— Kies sector —</option>
                {sectoren.map(s => <option key={s.naam} value={s.naam}>{s.naam}</option>)}
              </select>
            </Veld>
            <Veld label="Aantal medewerkers">
              <RadioKaarten opties={MEDEWERKERS_OPTIES} waarde={form.aantal_medewerkers} onChange={v => stel('aantal_medewerkers', v)} />
            </Veld>
            <Veld label="Ondernemingsvorm">
              <select className={inputCls} value={form.ondernemingsvorm} onChange={e => stel('ondernemingsvorm', e.target.value)}>
                <option value="">— Kies —</option>
                {ONDERNEMINGSVORM_OPTIES.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </Veld>
            <Veld label="Adres">
              <input className={inputCls} value={form.adres} onChange={e => stel('adres', e.target.value)} placeholder="Straat 1, 9000 Gent" />
            </Veld>
          </Kaart>
        )}

        {/* ── STAP 2 — Uw huisstijl ── */}
        {stap === 2 && (
          <Kaart>
            <h2 className="text-lg font-bold text-gray-900">Heeft u al een huisstijl?</h2>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => stel('heeft_huisstijl', true)}
                className={`py-3 rounded-xl border text-sm font-semibold transition-colors ${form.heeft_huisstijl === true ? 'border-[#22C35D] bg-[#22C35D]/5 text-gray-900' : 'border-gray-200 text-gray-500'}`}>
                Ja
              </button>
              <button type="button" onClick={() => stel('heeft_huisstijl', false)}
                className={`py-3 rounded-xl border text-sm font-semibold transition-colors ${form.heeft_huisstijl === false ? 'border-[#22C35D] bg-[#22C35D]/5 text-gray-900' : 'border-gray-200 text-gray-500'}`}>
                Nee
              </button>
            </div>

            {form.heeft_huisstijl === true && (
              <div className="space-y-4 pt-2">
                <Veld label="Beschrijf uw huisstijl">
                  <textarea rows={3} className={inputCls + ' resize-none'} value={form.huisstijl_beschrijving} onChange={e => stel('huisstijl_beschrijving', e.target.value)} placeholder="Kleuren, lettertype, sfeer..." />
                </Veld>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-gray-300 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
                      <Upload size={14} />
                      {uploadenLogo ? 'Uploaden...' : form.logo_url ? 'Logo geüpload ✓' : 'Upload logo'}
                      <input type="file" accept="image/*" className="hidden" disabled={uploadenLogo}
                        onChange={e => uploadBestand(e, 'logo_url', setUploadenLogo, 2, ['image'])} />
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-gray-300 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
                      <Upload size={14} />
                      {uploadenDoc ? 'Uploaden...' : form.stijldocument_url ? 'Document geüpload ✓' : 'Upload stijldocument'}
                      <input type="file" accept=".pdf,.doc,.docx" className="hidden" disabled={uploadenDoc}
                        onChange={e => uploadBestand(e, 'stijldocument_url', setUploadenDoc, 10, ['.pdf', '.doc', '.docx'])} />
                    </label>
                  </div>
                </div>
                <p className="text-xs text-gray-400">Logo: max 2MB. Stijldocument: PDF of Word, max 10MB.</p>
              </div>
            )}

            {form.heeft_huisstijl === false && (
              <div className="px-4 py-3 rounded-xl bg-blue-50 border border-blue-100 text-sm text-blue-800">
                Geen probleem — BYT Studio helpt u een huisstijl te ontwikkelen.
              </div>
            )}
          </Kaart>
        )}

        {/* ── STAP 3 — Uw uitdaging ── */}
        {stap === 3 && (
          <Kaart>
            <h2 className="text-lg font-bold text-gray-900">Uw uitdaging</h2>
            <Veld label="Hoe werkt u vandaag?">
              <textarea rows={3} className={inputCls + ' resize-none'} value={form.huidige_werkwijze} onChange={e => stel('huidige_werkwijze', e.target.value)} />
            </Veld>
            <Veld label="Wat loopt er niet goed?" verplicht>
              <textarea rows={3} className={inputCls + ' resize-none'} value={form.grootste_pijnpunt} onChange={e => stel('grootste_pijnpunt', e.target.value)} />
            </Veld>
            <Veld label="Hoeveel tijd verliest u hieraan?">
              <select className={inputCls} value={form.tijd_verloren} onChange={e => stel('tijd_verloren', e.target.value)}>
                <option value="">— Kies —</option>
                {TIJD_VERLOREN_OPTIES.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </Veld>
            <Veld label="Heeft u al een oplossing geprobeerd?">
              <textarea rows={3} className={inputCls + ' resize-none'} value={form.eerder_geprobeerd} onChange={e => stel('eerder_geprobeerd', e.target.value)} />
            </Veld>
          </Kaart>
        )}

        {/* ── STAP 4 — De gewenste app ── */}
        {stap === 4 && (
          <Kaart>
            <h2 className="text-lg font-bold text-gray-900">De gewenste app</h2>
            <Veld label="Type app">
              <RadioKaarten opties={TYPE_APP_OPTIES} waarde={form.type_app} onChange={v => stel('type_app', v)} />
            </Veld>
            <Veld label="Wat moet de app doen?" verplicht>
              <textarea rows={4} className={inputCls + ' resize-none'} value={form.omschrijving_app} onChange={e => stel('omschrijving_app', e.target.value)} />
            </Veld>
            <Veld label="Kent u een app die lijkt op wat u wil?">
              <input className={inputCls} value={form.vergelijkbaar_voorbeeld} onChange={e => stel('vergelijkbaar_voorbeeld', e.target.value)} />
            </Veld>
            <Veld label="Prioriteit">
              <select className={inputCls} value={form.prioriteit} onChange={e => stel('prioriteit', e.target.value)}>
                <option value="">— Kies —</option>
                {PRIORITEIT_OPTIES.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </Veld>
            <Veld label="Budget indicatie">
              <RadioKaarten opties={BUDGET_OPTIES} waarde={form.budget_indicatie} onChange={v => stel('budget_indicatie', v)} />
            </Veld>
            <Veld label="Gewenste opleverdatum">
              <input type="date" className={inputCls} value={form.gewenste_opleverdatum} onChange={e => stel('gewenste_opleverdatum', e.target.value)} />
            </Veld>
          </Kaart>
        )}

        {/* ── STAP 5 — Gewenste features ── */}
        {stap === 5 && (
          <Kaart>
            <h2 className="text-lg font-bold text-gray-900">Wat moet de app kunnen?</h2>
            <Checkboxen opties={FEATURES_OPTIES} waarden={form.features} onToggle={v => toggleArray('features', v)} kolommen={2} />
          </Kaart>
        )}

        {/* ── STAP 6 — Technisch & gebruikers ── */}
        {stap === 6 && (
          <Kaart>
            <h2 className="text-lg font-bold text-gray-900">Technisch &amp; gebruikers</h2>
            <Veld label="Apparaten">
              <Checkboxen opties={APPARATEN_OPTIES} waarden={form.apparaten} onToggle={v => toggleArray('apparaten', v)} kolommen={2} />
            </Veld>
            <Veld label="Wie gebruikt de app">
              <RadioKaarten opties={GEBRUIKERS_TYPE_OPTIES} waarde={form.gebruikers_type} onChange={v => stel('gebruikers_type', v)} />
            </Veld>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Veld label="Aantal gebruikers">
                <select className={inputCls} value={form.aantal_gebruikers} onChange={e => stel('aantal_gebruikers', e.target.value)}>
                  <option value="">— Kies —</option>
                  {AANTAL_GEBRUIKERS_OPTIES.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </Veld>
              <Veld label="IT-bekwaamheid gebruikers">
                <select className={inputCls} value={form.it_bekwaamheid} onChange={e => stel('it_bekwaamheid', e.target.value)}>
                  <option value="">— Kies —</option>
                  {IT_BEKWAAMHEID_OPTIES.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </Veld>
            </div>
            <Veld label="Interface taal">
              <Checkboxen opties={TALEN_OPTIES} waarden={form.interface_talen} onToggle={v => toggleArray('interface_talen', v)} kolommen={2} />
            </Veld>
            <Veld label="Met welke software moet de app koppelen? (bv. Exact, Woocommerce)">
              <textarea rows={2} className={inputCls + ' resize-none'} value={form.integraties_nodig} onChange={e => stel('integraties_nodig', e.target.value)} />
            </Veld>
          </Kaart>
        )}

        {/* ── STAP 7 — Afronden ── */}
        {stap === 7 && (
          <Kaart>
            <h2 className="text-lg font-bold text-gray-900">Afronden</h2>
            <Veld label="Hosting voorkeur">
              <RadioKaarten opties={HOSTING_OPTIES} waarde={form.hosting_voorkeur} onChange={v => stel('hosting_voorkeur', v)} />
            </Veld>
            <Veld label="Technische kennis bedrijf">
              <select className={inputCls} value={form.technische_kennis_bedrijf} onChange={e => stel('technische_kennis_bedrijf', e.target.value)}>
                <option value="">— Kies —</option>
                {TECHNISCHE_KENNIS_OPTIES.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </Veld>
            <Veld label="Opmerkingen of vragen">
              <textarea rows={3} className={inputCls + ' resize-none'} value={form.opmerkingen} onChange={e => stel('opmerkingen', e.target.value)} />
            </Veld>
          </Kaart>
        )}

        {/* ── Navigatie ── */}
        <div className="flex items-center gap-3 mt-5">
          {stap > 1 && (
            <button type="button" onClick={vorige}
              className="flex items-center gap-1.5 px-5 py-3 rounded-xl text-sm font-semibold text-slate-300 border border-slate-600 hover:bg-slate-800 transition-colors">
              <ChevronLeft size={15} /> Vorige
            </button>
          )}
          {stap < 7 ? (
            <button type="button" onClick={volgende}
              className="flex-1 flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: '#22C35D' }}>
              Volgende <ChevronRight size={15} />
            </button>
          ) : (
            <button type="button" onClick={versturen} disabled={bezig}
              className="flex-1 px-5 py-3.5 rounded-xl text-base font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: '#22C35D' }}>
              {bezig ? 'Versturen...' : 'Verstuur mijn aanvraag →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
