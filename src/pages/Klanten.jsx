// Klanten.jsx — Klantenbeheer met fiche, intake-formulier, bewerken en verwijderen
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PageWrapper from '../components/PageWrapper'
import {
  Search, Plus, Pencil, Trash2, X, Building2, Mail, Phone,
  Tag, MapPin, FileText, FolderKanban, ChevronRight, ExternalLink,
  Hash, Calendar, Save, CheckCircle, ClipboardList, Copy, Check,
} from 'lucide-react'

// ── Constanten ───────────────────────────────────────────────────────────────
const LEEG_FORMULIER = {
  naam: '', bedrijfsnaam: '', btw_nummer: '', email: '',
  telefoon: '', adres: '', sector: '', notities: '',
}

const SECTOREN = [
  'Horeca', 'Retail', 'Bouw', 'IT', 'Zorg', 'Onderwijs',
  'Evenementen', 'Logistiek', 'Vrije beroepen', 'Andere',
]

const PROJECT_STATUSSEN = {
  intake:          { label: 'Intake',          kleur: '#94a3b8', bg: '#f1f5f9' },
  offerte:         { label: 'Offerte',          kleur: '#d97706', bg: '#fef3c7' },
  in_ontwikkeling: { label: 'In ontwikkeling',  kleur: '#2563eb', bg: '#dbeafe' },
  afgeleverd:      { label: 'Afgeleverd',       kleur: '#16a34a', bg: '#dcfce7' },
  onderhoud:       { label: 'Onderhoud',        kleur: '#7c3aed', bg: '#ede9fe' },
}

const FICHE_TABS = [
  { key: 'intake',    label: 'Intake' },
  { key: 'gegevens',  label: 'Gegevens' },
  { key: 'projecten', label: 'Projecten' },
]

// ── Hulpfuncties ─────────────────────────────────────────────────────────────
function formatDatum(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' })
}

function initials(naam) {
  return (naam ?? '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function parseArray(val) {
  if (!val) return []
  try { return JSON.parse(val) } catch { return [] }
}

// ── Stijlhulpers ─────────────────────────────────────────────────────────────
const inp = 'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 bg-white'
const lbl = 'block text-xs font-semibold text-gray-500 mb-1'

// ── KlantModal ────────────────────────────────────────────────────────────────
function KlantModal({ klant, onSluit, onOpgeslagen }) {
  const [formulier, setFormulier] = useState(klant?.id ? klant : LEEG_FORMULIER)
  const [loading, setLoading] = useState(false)
  const [fout, setFout] = useState('')
  const isBewerken = !!klant?.id

  function stelIn(veld, waarde) {
    setFormulier(v => ({ ...v, [veld]: waarde }))
  }

  async function handleOpslaan(e) {
    e.preventDefault()
    if (!formulier.naam.trim()) { setFout('Naam is verplicht.'); return }
    setLoading(true); setFout('')
    const payload = {
      naam: formulier.naam, bedrijfsnaam: formulier.bedrijfsnaam,
      btw_nummer: formulier.btw_nummer, email: formulier.email,
      telefoon: formulier.telefoon, adres: formulier.adres,
      sector: formulier.sector, notities: formulier.notities,
    }
    const { error } = isBewerken
      ? await supabase.from('klanten').update(payload).eq('id', klant.id)
      : await supabase.from('klanten').insert(payload)
    if (error) { setFout('Opslaan mislukt: ' + error.message); setLoading(false); return }
    onOpgeslagen()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="font-semibold text-gray-900">{isBewerken ? 'Klant bewerken' : 'Nieuwe klant'}</h3>
          <button onClick={onSluit} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleOpslaan} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={lbl}>Naam <span className="text-red-400">*</span></label>
              <input value={formulier.naam} onChange={e => stelIn('naam', e.target.value)} placeholder="Jan Janssen" className={inp} />
            </div>
            <div>
              <label className={lbl}>Bedrijfsnaam</label>
              <input value={formulier.bedrijfsnaam} onChange={e => stelIn('bedrijfsnaam', e.target.value)} placeholder="Bedrijf NV" className={inp} />
            </div>
            <div>
              <label className={lbl}>BTW-nummer</label>
              <input value={formulier.btw_nummer} onChange={e => stelIn('btw_nummer', e.target.value)} placeholder="BE0000000000" className={inp} />
            </div>
            <div>
              <label className={lbl}>E-mailadres</label>
              <input type="email" value={formulier.email} onChange={e => stelIn('email', e.target.value)} placeholder="jan@bedrijf.be" className={inp} />
            </div>
            <div>
              <label className={lbl}>Telefoon</label>
              <input value={formulier.telefoon} onChange={e => stelIn('telefoon', e.target.value)} placeholder="+32 470 00 00 00" className={inp} />
            </div>
            <div className="col-span-2">
              <label className={lbl}>Adres</label>
              <input value={formulier.adres} onChange={e => stelIn('adres', e.target.value)} placeholder="Straat 1, 9000 Gent" className={inp} />
            </div>
            <div className="col-span-2">
              <label className={lbl}>Sector</label>
              <select value={formulier.sector} onChange={e => stelIn('sector', e.target.value)} className={inp}>
                <option value="">— Kies sector —</option>
                {SECTOREN.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className={lbl}>Notities</label>
              <textarea value={formulier.notities} onChange={e => stelIn('notities', e.target.value)}
                rows={3} placeholder="Interne notities..." className={inp + ' resize-none'} />
            </div>
          </div>
          {fout && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{fout}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onSluit} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">Annuleren</button>
            <button type="submit" disabled={loading} className="px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: '#185FA5' }}>
              {loading ? 'Opslaan...' : isBewerken ? 'Wijzigingen opslaan' : 'Klant toevoegen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── BevestigVerwijder ─────────────────────────────────────────────────────────
function BevestigVerwijder({ naam, onBevestig, onAnnuleer, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-2">Klant verwijderen?</h3>
        <p className="text-sm text-gray-500 mb-6">Ben je zeker dat je <strong>{naam}</strong> wil verwijderen?</p>
        <div className="flex justify-end gap-3">
          <button onClick={onAnnuleer} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">Annuleren</button>
          <button onClick={onBevestig} disabled={loading} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-50">
            {loading ? 'Verwijderen...' : 'Ja, verwijderen'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── TabIntake ─────────────────────────────────────────────────────────────────
const LEEG_INTAKE = {
  sector: '', aantal_medewerkers: '', doelgroep: '', website: '',
  huidig_systeem: '', huidig_systeem_vrij: '', tijdverlies: '', grootste_probleem: '',
  must_have: '', nice_to_have: '', klanten_toegang: '', apparaten: [],
  budget: '', opleverdatum: '', onderhoud: '', externe_diensten: [],
  notities_gesprek: '', datum_eerste_contact: new Date().toISOString().split('T')[0],
}

function Sectie({ titel, children }) {
  return (
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 mt-1">{titel}</p>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function CheckboxGroep({ opties, geselecteerd, onChange }) {
  function toggle(optie) {
    const nieuw = geselecteerd.includes(optie)
      ? geselecteerd.filter(o => o !== optie)
      : [...geselecteerd, optie]
    onChange(nieuw)
  }
  return (
    <div className="flex flex-wrap gap-2">
      {opties.map(o => (
        <label key={o} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
          geselecteerd.includes(o) ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
        }`}>
          <input type="checkbox" className="sr-only" checked={geselecteerd.includes(o)} onChange={() => toggle(o)} />
          {geselecteerd.includes(o) && <Check size={10} className="text-blue-500 flex-shrink-0" />}
          {o}
        </label>
      ))}
    </div>
  )
}

function genereerSamenvatting(form, klantNaam) {
  const ja = v => v || '—'
  const arr = v => (v && v.length > 0 ? v.join(', ') : '—')
  return `INTAKE — ${klantNaam}
Datum eerste contact: ${ja(form.datum_eerste_contact)}
========================================

BEDRIJFSPROFIEL
Sector: ${ja(form.sector)}
Medewerkers: ${ja(form.aantal_medewerkers)}
Doelgroep: ${ja(form.doelgroep)}
Website: ${ja(form.website)}

HUIDIG PIJNPUNT
Huidige aanpak: ${ja(form.huidig_systeem)}${form.huidig_systeem_vrij ? ` → ${form.huidig_systeem_vrij}` : ''}
Tijdverlies per week: ${ja(form.tijdverlies)}
Grootste probleem: ${ja(form.grootste_probleem)}

GEWENSTE APP
Must-have functies: ${ja(form.must_have)}
Nice-to-have: ${ja(form.nice_to_have)}
Klantentoegang: ${ja(form.klanten_toegang)}
Apparaten: ${arr(form.apparaten)}

PRAKTISCH
Budget: ${ja(form.budget)}
Gewenste opleverdatum: ${ja(form.opleverdatum)}
Maandelijks onderhoud: ${ja(form.onderhoud)}
Externe diensten: ${arr(form.externe_diensten)}

NOTITIES GESPREK
${form.notities_gesprek || '—'}`
}

function TabIntake({ klantId, klantNaam }) {
  const [form, setForm] = useState(LEEG_INTAKE)
  const [bestaandId, setBestaandId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [opslaan, setOpslaan] = useState(false)
  const [ok, setOk] = useState('')
  const [fout, setFout] = useState('')
  const [samenvattingTekst, setSamenvattingTekst] = useState('')
  const [gekopieerd, setGekopieerd] = useState(false)

  useEffect(() => {
    setLoading(true)
    supabase.from('klant_intake').select('*').eq('klant_id', klantId).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setForm({
            ...LEEG_INTAKE,
            ...data,
            apparaten: parseArray(data.apparaten),
            externe_diensten: parseArray(data.externe_diensten),
            opleverdatum: data.opleverdatum ?? '',
            datum_eerste_contact: data.datum_eerste_contact ?? new Date().toISOString().split('T')[0],
          })
          setBestaandId(data.id)
        }
        setLoading(false)
      })
  }, [klantId])

  function stelIn(v, w) { setForm(f => ({ ...f, [v]: w })) }

  async function handleOpslaan() {
    setOpslaan(true); setFout(''); setOk('')
    const payload = {
      klant_id: klantId,
      sector: form.sector || null,
      aantal_medewerkers: form.aantal_medewerkers || null,
      doelgroep: form.doelgroep || null,
      website: form.website || null,
      huidig_systeem: form.huidig_systeem || null,
      huidig_systeem_vrij: form.huidig_systeem_vrij || null,
      tijdverlies: form.tijdverlies || null,
      grootste_probleem: form.grootste_probleem || null,
      must_have: form.must_have || null,
      nice_to_have: form.nice_to_have || null,
      klanten_toegang: form.klanten_toegang || null,
      apparaten: JSON.stringify(form.apparaten),
      budget: form.budget || null,
      opleverdatum: form.opleverdatum || null,
      onderhoud: form.onderhoud || null,
      externe_diensten: JSON.stringify(form.externe_diensten),
      notities_gesprek: form.notities_gesprek || null,
      datum_eerste_contact: form.datum_eerste_contact || null,
    }
    let error
    if (bestaandId) {
      ;({ error } = await supabase.from('klant_intake').update(payload).eq('id', bestaandId))
    } else {
      const res = await supabase.from('klant_intake').insert(payload).select('id').single()
      error = res.error
      if (res.data) setBestaandId(res.data.id)
    }
    setOpslaan(false)
    if (error) { setFout('Opslaan mislukt: ' + error.message); return }
    setOk('Intake opgeslagen.')
    setTimeout(() => setOk(''), 3000)
  }

  function handleSamenvatting() {
    setSamenvattingTekst(genereerSamenvatting(form, klantNaam))
  }

  async function kopieer() {
    await navigator.clipboard.writeText(samenvattingTekst)
    setGekopieerd(true)
    setTimeout(() => setGekopieerd(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#185FA5', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="space-y-5 py-2">

      {/* Sectie 1 — Bedrijfsprofiel */}
      <Sectie titel="Bedrijfsprofiel">
        <div>
          <label className={lbl}>Sector</label>
          <select value={form.sector} onChange={e => stelIn('sector', e.target.value)} className={inp}>
            <option value="">— Kies sector —</option>
            {['Horeca & catering','Sport & recreatie','Retail & handel','Dienstverlening','Gezondheidszorg','Bouw & techniek','Onderwijs','Events','Overig'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={lbl}>Aantal medewerkers</label>
          <select value={form.aantal_medewerkers} onChange={e => stelIn('aantal_medewerkers', e.target.value)} className={inp}>
            <option value="">— Kies —</option>
            {['1-5','6-20','21-50','50+'].map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Doelgroep van het bedrijf</label>
          <textarea value={form.doelgroep} onChange={e => stelIn('doelgroep', e.target.value)}
            rows={2} placeholder="Wie zijn hun klanten?" className={inp + ' resize-none'} />
        </div>
        <div>
          <label className={lbl}>Website</label>
          <input value={form.website} onChange={e => stelIn('website', e.target.value)} placeholder="https://..." className={inp} />
        </div>
      </Sectie>

      <hr className="border-gray-100" />

      {/* Sectie 2 — Huidig pijnpunt */}
      <Sectie titel="Huidig pijnpunt">
        <div>
          <label className={lbl}>Wat doen ze nu voor dit probleem?</label>
          <select value={form.huidig_systeem} onChange={e => stelIn('huidig_systeem', e.target.value)} className={inp}>
            <option value="">— Kies —</option>
            {['Excel','Papier','Geen systeem','Bestaande software','Combinatie'].map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        {form.huidig_systeem === 'Bestaande software' && (
          <div>
            <label className={lbl}>Welke software?</label>
            <input value={form.huidig_systeem_vrij} onChange={e => stelIn('huidig_systeem_vrij', e.target.value)}
              placeholder="Naam van de software..." className={inp} />
          </div>
        )}
        {form.huidig_systeem === 'Combinatie' && (
          <div>
            <label className={lbl}>Combinatie van?</label>
            <input value={form.huidig_systeem_vrij} onChange={e => stelIn('huidig_systeem_vrij', e.target.value)}
              placeholder="bv. Excel + papier..." className={inp} />
          </div>
        )}
        <div>
          <label className={lbl}>Tijdverlies per week</label>
          <select value={form.tijdverlies} onChange={e => stelIn('tijdverlies', e.target.value)} className={inp}>
            <option value="">— Kies —</option>
            {['< 2u','2-5u','5-10u','> 10u'].map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Grootste probleem met de huidige aanpak</label>
          <textarea value={form.grootste_probleem} onChange={e => stelIn('grootste_probleem', e.target.value)}
            rows={3} placeholder="Wat loopt fout of mis?" className={inp + ' resize-none'} />
        </div>
      </Sectie>

      <hr className="border-gray-100" />

      {/* Sectie 3 — Gewenste app */}
      <Sectie titel="Gewenste app">
        <div>
          <label className={lbl}>Absoluut noodzakelijke functionaliteiten</label>
          <textarea value={form.must_have} onChange={e => stelIn('must_have', e.target.value)}
            rows={3} placeholder="Wat moet de app absoluut kunnen?" className={inp + ' resize-none'} />
        </div>
        <div>
          <label className={lbl}>Nice-to-have functionaliteiten</label>
          <textarea value={form.nice_to_have} onChange={e => stelIn('nice_to_have', e.target.value)}
            rows={2} placeholder="Wat zou mooi zijn maar niet strikt nodig?" className={inp + ' resize-none'} />
        </div>
        <div>
          <label className={lbl}>Klantentoegang tot de app?</label>
          <div className="flex gap-2">
            {['Ja', 'Nee', 'Deels'].map(o => (
              <button key={o} type="button"
                onClick={() => stelIn('klanten_toegang', o)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  form.klanten_toegang === o ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}>
                {o}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={lbl}>Op welke apparaten?</label>
          <CheckboxGroep
            opties={['Desktop', 'Tablet', 'Smartphone']}
            geselecteerd={form.apparaten}
            onChange={v => stelIn('apparaten', v)}
          />
        </div>
      </Sectie>

      <hr className="border-gray-100" />

      {/* Sectie 4 — Praktisch */}
      <Sectie titel="Praktisch">
        <div>
          <label className={lbl}>Gewenst budget</label>
          <select value={form.budget} onChange={e => stelIn('budget', e.target.value)} className={inp}>
            <option value="">— Kies —</option>
            {['< €1.000','€1.000 - €2.500','€2.500 - €5.000','€5.000 - €10.000','Bespreekbaar'].map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={lbl}>Gewenste opleverdatum</label>
          <input type="date" value={form.opleverdatum} onChange={e => stelIn('opleverdatum', e.target.value)} className={inp} />
        </div>
        <div>
          <label className={lbl}>Maandelijks onderhoud gewenst?</label>
          <div className="flex gap-2">
            {['Ja', 'Nee', 'Later bespreken'].map(o => (
              <button key={o} type="button"
                onClick={() => stelIn('onderhoud', o)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  form.onderhoud === o ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}>
                {o}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={lbl}>Externe diensten al aanwezig?</label>
          <CheckboxGroep
            opties={['Eigen domein', 'Hosting', 'E-mailprovider', 'Geen']}
            geselecteerd={form.externe_diensten}
            onChange={v => stelIn('externe_diensten', v)}
          />
        </div>
      </Sectie>

      <hr className="border-gray-100" />

      {/* Sectie 5 — Notities gesprek */}
      <Sectie titel="Notities eerste gesprek">
        <div>
          <label className={lbl}>Datum eerste contact</label>
          <input type="date" value={form.datum_eerste_contact} onChange={e => stelIn('datum_eerste_contact', e.target.value)} className={inp} />
        </div>
        <div>
          <label className={lbl}>Aantekeningen gesprek</label>
          <textarea value={form.notities_gesprek} onChange={e => stelIn('notities_gesprek', e.target.value)}
            rows={5} placeholder="Vrije notities, sfeer gesprek, bijkomende vragen..." className={inp + ' resize-y'} />
        </div>
      </Sectie>

      {/* Feedback */}
      {fout && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{fout}</p>}
      {ok && (
        <p className="text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg flex items-center gap-1.5">
          <CheckCircle size={12} /> {ok}
        </p>
      )}

      {/* Acties */}
      <div className="flex flex-col gap-2 pt-1">
        <button
          onClick={handleOpslaan}
          disabled={opslaan}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: '#185FA5' }}
        >
          <Save size={14} /> {opslaan ? 'Opslaan...' : 'Intake opslaan'}
        </button>
        <button
          onClick={handleSamenvatting}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-gray-700 border border-gray-200 hover:bg-gray-50 transition"
        >
          <ClipboardList size={14} /> Genereer intake-samenvatting
        </button>
      </div>

      {/* Samenvatting output */}
      {samenvattingTekst && (
        <div className="relative">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-gray-500">Samenvatting</p>
            <button onClick={kopieer}
              className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 transition">
              {gekopieerd ? <><Check size={11} /> Gekopieerd!</> : <><Copy size={11} /> Kopieer</>}
            </button>
          </div>
          <pre className="text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-xl p-4 whitespace-pre-wrap font-mono leading-relaxed max-h-64 overflow-y-auto">
            {samenvattingTekst}
          </pre>
        </div>
      )}
    </div>
  )
}

// ── TabGegevens ───────────────────────────────────────────────────────────────
function TabGegevens({ klant }) {
  const DetailRij = ({ icon: Icon, label, waarde, href }) => {
    if (!waarde) return null
    return (
      <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
        <Icon size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-xs text-gray-400 mb-0.5">{label}</p>
          {href
            ? <a href={href} className="text-sm text-blue-600 hover:underline break-all">{waarde}</a>
            : <p className="text-sm text-gray-800 break-words">{waarde}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 py-2">
      <div className="bg-gray-50 rounded-xl px-4">
        <DetailRij icon={Mail}     label="E-mail"      waarde={klant.email}        href={klant.email ? `mailto:${klant.email}` : null} />
        <DetailRij icon={Phone}    label="Telefoon"    waarde={klant.telefoon} />
        <DetailRij icon={MapPin}   label="Adres"       waarde={klant.adres} />
        <DetailRij icon={Hash}     label="BTW-nummer"  waarde={klant.btw_nummer} />
        <DetailRij icon={Tag}      label="Sector"      waarde={klant.sector} />
        <DetailRij icon={Calendar} label="Klant sinds" waarde={formatDatum(klant.aangemaakt_op)} />
      </div>
      {klant.notities && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-amber-700 mb-1">Notities</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{klant.notities}</p>
        </div>
      )}
    </div>
  )
}

// ── TabProjecten ──────────────────────────────────────────────────────────────
function TabProjecten({ klantId }) {
  const [projecten, setProjecten] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('projecten').select('id, naam, status, aangemaakt_op, bijgewerkt_op, github_url, netlify_url')
      .eq('klant_id', klantId).order('aangemaakt_op', { ascending: false })
      .then(({ data }) => { setProjecten(data ?? []); setLoading(false) })
  }, [klantId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#185FA5', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (projecten.length === 0) {
    return (
      <div className="bg-gray-50 rounded-xl px-4 py-6 text-center mt-2">
        <FolderKanban size={22} className="mx-auto mb-1.5 text-gray-200" />
        <p className="text-xs text-gray-400">Nog geen projecten gekoppeld aan deze klant.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 py-2">
      {projecten.map(p => {
        const cfg = PROJECT_STATUSSEN[p.status] ?? PROJECT_STATUSSEN.intake
        return (
          <div key={p.id} className="bg-gray-50 rounded-xl px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{p.naam}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDatum(p.bijgewerkt_op)}</p>
              </div>
              <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: cfg.bg, color: cfg.kleur }}>{cfg.label}</span>
            </div>
            {(p.github_url || p.netlify_url) && (
              <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-100">
                {p.github_url && <a href={p.github_url} target="_blank" rel="noopener" className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition"><ExternalLink size={10} /> GitHub</a>}
                {p.netlify_url && <a href={p.netlify_url} target="_blank" rel="noopener" className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition"><ExternalLink size={10} /> Netlify</a>}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── KlantFiche (slide-in met tabs) ────────────────────────────────────────────
function KlantFiche({ klant, onSluit, onBewerken, onVerwijderen }) {
  const [actieveTab, setActieveTab] = useState('intake')

  if (!klant) return null

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.25)' }} onClick={onSluit} />
      <div className="fixed top-0 right-0 h-full z-50 bg-white shadow-2xl flex flex-col" style={{ width: '440px' }}>

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: '#185FA5' }}>
              {initials(klant.naam)}
            </div>
            <div>
              <p className="font-semibold text-gray-900 leading-tight">{klant.naam}</p>
              {klant.bedrijfsnaam && <p className="text-xs text-gray-400">{klant.bedrijfsnaam}</p>}
            </div>
          </div>
          <button onClick={onSluit} className="text-gray-400 hover:text-gray-600 transition p-1"><X size={18} /></button>
        </div>

        {/* Acties */}
        <div className="flex gap-2 px-6 py-2.5 border-b border-gray-50">
          <button onClick={onBewerken}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition">
            <Pencil size={12} /> Bewerken
          </button>
          <button onClick={onVerwijderen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 border border-red-100 hover:bg-red-50 transition">
            <Trash2 size={12} /> Verwijderen
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-2">
          {FICHE_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActieveTab(t.key)}
              className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
                actieveTab === t.key
                  ? 'border-blue-500 text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab inhoud */}
        <div className="flex-1 overflow-y-auto px-5 py-1">
          {actieveTab === 'intake'    && <TabIntake    klantId={klant.id} klantNaam={klant.naam} />}
          {actieveTab === 'gegevens'  && <TabGegevens  klant={klant} />}
          {actieveTab === 'projecten' && <TabProjecten klantId={klant.id} />}
        </div>
      </div>
    </>
  )
}

// ── Hoofdcomponent ────────────────────────────────────────────────────────────
export default function Klanten() {
  useEffect(() => { document.title = 'Klanten — BYT Studio' }, [])
  const [klanten, setKlanten] = useState([])
  const [loading, setLoading] = useState(true)
  const [zoekterm, setZoekterm] = useState('')
  const [modalKlant, setModalKlant] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [verwijderKlant, setVerwijderKlant] = useState(null)
  const [verwijderLoading, setVerwijderLoading] = useState(false)
  const [ficheKlant, setFicheKlant] = useState(null)

  async function laadKlanten() {
    setLoading(true)
    const { data } = await supabase.from('klanten').select('*').order('aangemaakt_op', { ascending: false })
    setKlanten(data ?? [])
    setLoading(false)
  }

  useEffect(() => { laadKlanten() }, [])

  async function handleVerwijder() {
    setVerwijderLoading(true)
    await supabase.from('klanten').delete().eq('id', verwijderKlant.id)
    setVerwijderKlant(null)
    setVerwijderLoading(false)
    if (ficheKlant?.id === verwijderKlant.id) setFicheKlant(null)
    laadKlanten()
  }

  const gefilterd = klanten.filter(k => {
    const q = zoekterm.toLowerCase()
    return (
      k.naam?.toLowerCase().includes(q) ||
      k.bedrijfsnaam?.toLowerCase().includes(q) ||
      k.email?.toLowerCase().includes(q) ||
      k.sector?.toLowerCase().includes(q)
    )
  })

  function openBewerken(klant) {
    setFicheKlant(null)
    setModalKlant(klant)
    setModalOpen(true)
  }

  async function opgeslagen() {
    setModalOpen(false)
    setModalKlant(null)
    await laadKlanten()
    if (ficheKlant) {
      const { data } = await supabase.from('klanten').select('*').eq('id', ficheKlant.id).single()
      if (data) setFicheKlant(data)
    }
  }

  return (
    <PageWrapper
      title="Klanten"
      description={`${klanten.length} klant${klanten.length !== 1 ? 'en' : ''} in totaal`}
      actions={
        <button onClick={() => { setModalKlant(null); setModalOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition"
          style={{ background: '#185FA5' }}>
          <Plus size={15} /> Klant toevoegen
        </button>
      }
    >
      {/* Zoekbalk */}
      <div className="relative max-w-sm mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={zoekterm} onChange={e => setZoekterm(e.target.value)}
          placeholder="Zoek op naam, bedrijf, e-mail..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 bg-white" />
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="px-6 py-12 text-center">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: '#185FA5', borderTopColor: 'transparent' }} />
          </div>
        ) : gefilterd.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-400 text-sm">
              {zoekterm ? `Geen resultaten voor "${zoekterm}"` : 'Nog geen klanten. Klik op "+ Klant toevoegen" om te starten.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Naam</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Bedrijf</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Contact</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Sector</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {gefilterd.map(k => (
                <tr key={k.id} onClick={() => setFicheKlant(k)}
                  className={`hover:bg-gray-50 transition-colors cursor-pointer ${ficheKlant?.id === k.id ? 'bg-blue-50' : ''}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: '#185FA5' }}>
                        {initials(k.naam)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{k.naam}</p>
                        {k.btw_nummer && <p className="text-xs text-gray-400">{k.btw_nummer}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    {k.bedrijfsnaam
                      ? <span className="flex items-center gap-1.5 text-gray-600"><Building2 size={13} className="text-gray-400 flex-shrink-0" />{k.bedrijfsnaam}</span>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    <div className="space-y-0.5">
                      {k.email && <span className="flex items-center gap-1.5 text-gray-600"><Mail size={12} className="flex-shrink-0" /> {k.email}</span>}
                      {k.telefoon && <span className="flex items-center gap-1.5 text-gray-500"><Phone size={12} className="flex-shrink-0" /> {k.telefoon}</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    {k.sector
                      ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600"><Tag size={10} />{k.sector}</span>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openBewerken(k)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-gray-100 transition" title="Bewerken"><Pencil size={14} /></button>
                      <button onClick={() => setVerwijderKlant(k)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition" title="Verwijderen"><Trash2 size={14} /></button>
                      <ChevronRight size={14} className="text-gray-300 ml-1" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Klantenfiche */}
      {ficheKlant && (
        <KlantFiche
          klant={ficheKlant}
          onSluit={() => setFicheKlant(null)}
          onBewerken={() => openBewerken(ficheKlant)}
          onVerwijderen={() => { setVerwijderKlant(ficheKlant); setFicheKlant(null) }}
        />
      )}

      {modalOpen && (
        <KlantModal
          klant={modalKlant}
          onSluit={() => { setModalOpen(false); setModalKlant(null) }}
          onOpgeslagen={opgeslagen}
        />
      )}
      {verwijderKlant && (
        <BevestigVerwijder
          naam={verwijderKlant.naam}
          onBevestig={handleVerwijder}
          onAnnuleer={() => setVerwijderKlant(null)}
          loading={verwijderLoading}
        />
      )}
    </PageWrapper>
  )
}
