// KlantDetail.jsx — Volledige klantfiche: bedrijf, contactpersonen, adres, financieel, projecten
import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { StatusBadge } from './Projecten'
import AdresInvoer from '../components/AdresInvoer'
import {
  ChevronLeft, Plus, X, Pencil, Trash2, CheckCircle,
  Building2, Users, MapPin, Euro, FolderKanban, Star, ChevronRight,
} from 'lucide-react'

// ── Constanten ───────────────────────────────────────────────────────────────
const SECTOREN = [
  'Horeca', 'Retail', 'Bouw', 'IT', 'Zorg', 'Onderwijs',
  'Evenementen', 'Logistiek', 'Vrije beroepen', 'Andere',
]

const TALEN = [
  { key: 'NL', label: 'Nederlands' },
  { key: 'FR', label: 'Frans' },
  { key: 'EN', label: 'Engels' },
]

const KLANT_STATUSSEN = [
  { key: 'actief',    label: 'Actief',    kleur: '#16a34a', bg: '#f0fdf4', rand: '#bbf7d0' },
  { key: 'inactief',  label: 'Inactief',  kleur: '#6b7280', bg: '#f9fafb', rand: '#e5e7eb' },
  { key: 'prospect',  label: 'Prospect',  kleur: '#d97706', bg: '#fef9ee', rand: '#fde68a' },
]

const BETALINGSTERMIJNEN = [15, 30, 45, 60]

const BTW_REGIMES = [
  { key: 'normaal',         label: 'Normaal' },
  { key: 'vrijgesteld',     label: 'Vrijgesteld' },
  { key: 'medecontractant', label: 'Medecontractant' },
]

const TABS = [
  { key: 'bedrijf',          label: 'Bedrijf',          icon: Building2 },
  { key: 'contactpersonen',  label: 'Contactpersonen',  icon: Users },
  { key: 'adres',            label: 'Adres',            icon: MapPin },
  { key: 'financieel',       label: 'Financieel',       icon: Euro },
  { key: 'projecten',        label: 'Projecten',        icon: FolderKanban },
]

// ── Stijlhulpers ─────────────────────────────────────────────────────────────
const inp = 'w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 bg-white'
const lbl = 'block text-xs font-semibold text-gray-500 mb-1'

function klantStatusCfg(key) {
  return KLANT_STATUSSEN.find(s => s.key === key) ?? KLANT_STATUSSEN[0]
}

function KlantStatusBadge({ status }) {
  const cfg = klantStatusCfg(status)
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.kleur, border: `1px solid ${cfg.rand}` }}
    >
      {cfg.label}
    </span>
  )
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#185FA5', borderTopColor: 'transparent' }} />
    </div>
  )
}

function FoutMelding({ tekst }) {
  return tekst ? (
    <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mt-2">{tekst}</p>
  ) : null
}

function OpslaanBericht({ tekst }) {
  return tekst ? (
    <p className="text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg mt-2 flex items-center gap-1.5">
      <CheckCircle size={12} /> {tekst}
    </p>
  ) : null
}

function BevestigVerwijder({ titel, boodschap, onBevestig, onAnnuleer, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-2">{titel}</h3>
        <p className="text-sm text-gray-500 mb-6">{boodschap}</p>
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

// ── TabBedrijf ─────────────────────────────────────────────────────────────────
function TabBedrijf({ klant, onBijgewerkt }) {
  const [form, setForm] = useState({
    naam: klant.naam ?? '',
    bedrijfsnaam: klant.bedrijfsnaam ?? '',
    handelsnaam: klant.handelsnaam ?? '',
    ondernemingsnummer: klant.ondernemingsnummer ?? '',
    btw_nummer: klant.btw_nummer ?? '',
    website: klant.website ?? '',
    sector: klant.sector ?? '',
    taal_correspondentie: klant.taal_correspondentie ?? 'NL',
    status: klant.status ?? 'actief',
    klant_sinds: klant.aangemaakt_op ? klant.aangemaakt_op.split('T')[0] : '',
  })
  const [loading, setLoading] = useState(false)
  const [fout, setFout] = useState('')
  const [ok, setOk] = useState('')

  function stelIn(v, w) { setForm(f => ({ ...f, [v]: w })) }

  async function opslaan(e) {
    e.preventDefault()
    if (!form.naam.trim()) { setFout('Naam contactpersoon is verplicht.'); return }
    setLoading(true); setFout(''); setOk('')
    const klantData = {
      naam: form.naam,
      bedrijfsnaam: form.bedrijfsnaam || null,
      handelsnaam: form.handelsnaam || null,
      ondernemingsnummer: form.ondernemingsnummer || null,
      btw_nummer: form.btw_nummer || null,
      website: form.website || null,
      sector: form.sector || null,
      taal_correspondentie: form.taal_correspondentie,
      status: form.status,
      aangemaakt_op: form.klant_sinds || null,
    }
    const { error } = await supabase
      .from('klanten')
      .update(klantData)
      .eq('id', klant.id)
    setLoading(false)
    if (error) { setFout('Opslaan mislukt: ' + error.message); return }
    setOk('Wijzigingen opgeslagen.')
    setTimeout(() => setOk(''), 3000)
    onBijgewerkt()
  }

  return (
    <form onSubmit={opslaan} className="space-y-4 max-w-3xl py-2">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lbl}>Naam contactpersoon <span className="text-red-400">*</span></label>
          <input value={form.naam} onChange={e => stelIn('naam', e.target.value)} className={inp} />
        </div>
        <div>
          <label className={lbl}>Bedrijfsnaam</label>
          <input value={form.bedrijfsnaam} onChange={e => stelIn('bedrijfsnaam', e.target.value)} className={inp} />
        </div>
        <div>
          <label className={lbl}>Handelsnaam</label>
          <input value={form.handelsnaam} onChange={e => stelIn('handelsnaam', e.target.value)} className={inp} />
        </div>
        <div>
          <label className={lbl}>Ondernemingsnummer</label>
          <input value={form.ondernemingsnummer} onChange={e => stelIn('ondernemingsnummer', e.target.value)} placeholder="0000.000.000" className={inp} />
        </div>
        <div>
          <label className={lbl}>BTW-nummer</label>
          <input value={form.btw_nummer} onChange={e => stelIn('btw_nummer', e.target.value)} placeholder="BE0000000000" className={inp} />
        </div>
        <div>
          <label className={lbl}>Website</label>
          <input value={form.website} onChange={e => stelIn('website', e.target.value)} placeholder="https://..." className={inp} />
        </div>
        <div>
          <label className={lbl}>Sector</label>
          <select value={form.sector} onChange={e => stelIn('sector', e.target.value)} className={inp}>
            <option value="">— Kies sector —</option>
            {SECTOREN.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Klant sinds</label>
          <input type="date" value={form.klant_sinds} onChange={e => stelIn('klant_sinds', e.target.value)} className={inp} />
        </div>
        <div>
          <label className={lbl}>Taal correspondentie</label>
          <div className="flex gap-2">
            {TALEN.map(t => (
              <button key={t.key} type="button" onClick={() => stelIn('taal_correspondentie', t.key)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  form.taal_correspondentie === t.key ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}>
                {t.key}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={lbl}>Status</label>
          <select value={form.status} onChange={e => stelIn('status', e.target.value)} className={inp}>
            {KLANT_STATUSSEN.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
      </div>
      <FoutMelding tekst={fout} />
      <OpslaanBericht tekst={ok} />
      <div className="pt-2">
        <button type="submit" disabled={loading}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: '#185FA5' }}>
          {loading ? 'Opslaan...' : 'Wijzigingen opslaan'}
        </button>
      </div>
    </form>
  )
}

// ── ContactpersoonModal ─────────────────────────────────────────────────────────
const LEEG_CONTACT = {
  voornaam: '', achternaam: '', functie: '', email: '', gsm: '', telefoon: '',
  primair: false, notities: '',
}

function ContactpersoonModal({ klantId, contact, onSluit, onOpgeslagen }) {
  const [form, setForm] = useState(contact?.id ? contact : LEEG_CONTACT)
  const [loading, setLoading] = useState(false)
  const [fout, setFout] = useState('')
  const isBewerken = !!contact?.id

  function stelIn(v, w) { setForm(f => ({ ...f, [v]: w })) }

  async function opslaan(e) {
    e.preventDefault()
    if (!form.voornaam.trim()) { setFout('Voornaam is verplicht.'); return }
    setLoading(true); setFout('')
    const payload = {
      klant_id: klantId,
      voornaam: form.voornaam,
      achternaam: form.achternaam || '',
      functie: form.functie || null,
      email: form.email || null,
      gsm: form.gsm || null,
      telefoon: form.telefoon || null,
      primair: !!form.primair,
      notities: form.notities || null,
    }
    const { error } = isBewerken
      ? await supabase.from('contactpersonen').update(payload).eq('id', contact.id)
      : await supabase.from('contactpersonen').insert(payload)
    setLoading(false)
    if (error) { setFout('Opslaan mislukt: ' + error.message); return }
    onOpgeslagen()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="font-semibold text-gray-900">{isBewerken ? 'Contactpersoon bewerken' : 'Contactpersoon toevoegen'}</h3>
          <button onClick={onSluit} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <form onSubmit={opslaan} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Voornaam <span className="text-red-400">*</span></label>
              <input value={form.voornaam} onChange={e => stelIn('voornaam', e.target.value)} className={inp} />
            </div>
            <div>
              <label className={lbl}>Achternaam</label>
              <input value={form.achternaam} onChange={e => stelIn('achternaam', e.target.value)} className={inp} />
            </div>
            <div className="col-span-2">
              <label className={lbl}>Functie</label>
              <input value={form.functie} onChange={e => stelIn('functie', e.target.value)} placeholder="bv. Zaakvoerder" className={inp} />
            </div>
            <div>
              <label className={lbl}>E-mailadres</label>
              <input type="email" value={form.email} onChange={e => stelIn('email', e.target.value)} className={inp} />
            </div>
            <div>
              <label className={lbl}>GSM</label>
              <input value={form.gsm} onChange={e => stelIn('gsm', e.target.value)} className={inp} />
            </div>
            <div>
              <label className={lbl}>Telefoon</label>
              <input value={form.telefoon} onChange={e => stelIn('telefoon', e.target.value)} className={inp} />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer pb-2.5">
                <input type="checkbox" checked={!!form.primair} onChange={e => stelIn('primair', e.target.checked)} className="rounded border-gray-300" />
                Primair contact
              </label>
            </div>
            <div className="col-span-2">
              <label className={lbl}>Notities</label>
              <textarea value={form.notities} onChange={e => stelIn('notities', e.target.value)} rows={3} className={inp + ' resize-none'} />
            </div>
          </div>
          {fout && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{fout}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onSluit} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">Annuleren</button>
            <button type="submit" disabled={loading} className="px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: '#185FA5' }}>
              {loading ? 'Opslaan...' : isBewerken ? 'Wijzigingen opslaan' : 'Toevoegen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── TabContactpersonen ───────────────────────────────────────────────────────
function TabContactpersonen({ klantId }) {
  const [personen, setPersonen] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalContact, setModalContact] = useState(null)
  const [verwijderContact, setVerwijderContact] = useState(null)
  const [verwijderLoading, setVerwijderLoading] = useState(false)

  async function laad() {
    setLoading(true)
    const { data } = await supabase.from('contactpersonen').select('*')
      .eq('klant_id', klantId)
      .order('primair', { ascending: false })
      .order('aangemaakt_op', { ascending: true })
    setPersonen(data ?? [])
    setLoading(false)
  }

  useEffect(() => { laad() }, [klantId])

  function openBewerken(contact) { setModalContact(contact); setModalOpen(true) }
  function openNieuw() { setModalContact(null); setModalOpen(true) }

  async function opgeslagen() {
    setModalOpen(false); setModalContact(null)
    await laad()
  }

  async function handleVerwijder() {
    setVerwijderLoading(true)
    await supabase.from('contactpersonen').delete().eq('id', verwijderContact.id)
    setVerwijderContact(null)
    setVerwijderLoading(false)
    laad()
  }

  if (loading) return <Spinner />

  return (
    <div className="py-2 space-y-4">
      <div className="flex justify-end">
        <button onClick={openNieuw}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition"
          style={{ background: '#185FA5' }}>
          <Plus size={15} /> Contactpersoon toevoegen
        </button>
      </div>

      {personen.length === 0 ? (
        <div className="bg-gray-50 rounded-xl px-4 py-10 text-center">
          <Users size={22} className="mx-auto mb-1.5 text-gray-200" />
          <p className="text-xs text-gray-400">Nog geen contactpersonen toegevoegd.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {personen.map(p => (
            <div key={p.id} className="bg-gray-50 rounded-xl px-4 py-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-gray-900">{[p.voornaam, p.achternaam].filter(Boolean).join(' ')}</p>
                  {p.functie && <span className="text-xs text-gray-400">— {p.functie}</span>}
                  {p.primair && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                      <Star size={10} /> Primair
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                  {p.email && <span>{p.email}</span>}
                  {p.gsm && <span>{p.gsm}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => openBewerken(p)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-white transition" title="Bewerken"><Pencil size={14} /></button>
                <button onClick={() => setVerwijderContact(p)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-white transition" title="Verwijderen"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <ContactpersoonModal
          klantId={klantId}
          contact={modalContact}
          onSluit={() => { setModalOpen(false); setModalContact(null) }}
          onOpgeslagen={opgeslagen}
        />
      )}
      {verwijderContact && (
        <BevestigVerwijder
          titel="Contactpersoon verwijderen?"
          boodschap={`Ben je zeker dat je ${[verwijderContact.voornaam, verwijderContact.achternaam].filter(Boolean).join(' ')} wil verwijderen?`}
          onBevestig={handleVerwijder}
          onAnnuleer={() => setVerwijderContact(null)}
          loading={verwijderLoading}
        />
      )}
    </div>
  )
}

// ── TabAdres ───────────────────────────────────────────────────────────────────
function TabAdres({ klant, onBijgewerkt }) {
  const [form, setForm] = useState({
    straat: klant.straat ?? '',
    huisnummer: klant.huisnummer ?? '',
    postcode: klant.postcode ?? '',
    gemeente: klant.gemeente ?? '',
    provincie: klant.provincie ?? '',
    land: klant.land ?? 'België',
  })
  const [loading, setLoading] = useState(false)
  const [fout, setFout] = useState('')
  const [ok, setOk] = useState('')

  async function opslaan(e) {
    e.preventDefault()
    setLoading(true); setFout(''); setOk('')
    const { error } = await supabase.from('klanten').update({
      straat: form.straat || null,
      huisnummer: form.huisnummer || null,
      postcode: form.postcode || null,
      gemeente: form.gemeente || null,
      provincie: form.provincie || null,
      land: form.land || 'België',
    }).eq('id', klant.id)
    setLoading(false)
    if (error) { setFout('Opslaan mislukt: ' + error.message); return }
    setOk('Wijzigingen opgeslagen.')
    setTimeout(() => setOk(''), 3000)
    onBijgewerkt()
  }

  return (
    <form onSubmit={opslaan} className="space-y-4 max-w-2xl py-2">
      <AdresInvoer
        waarden={form}
        onChange={nieuwAdres => setForm(f => ({ ...f, ...nieuwAdres }))}
        disabled={loading}
      />
      <FoutMelding tekst={fout} />
      <OpslaanBericht tekst={ok} />
      <div className="pt-2">
        <button type="submit" disabled={loading}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: '#185FA5' }}>
          {loading ? 'Opslaan...' : 'Wijzigingen opslaan'}
        </button>
      </div>
    </form>
  )
}

// ── TabFinancieel ────────────────────────────────────────────────────────────
function TabFinancieel({ klant, onBijgewerkt }) {
  const [form, setForm] = useState({
    facturatie_email: klant.facturatie_email ?? '',
    iban: klant.iban ?? '',
    bic: klant.bic ?? '',
    betalingstermijn: klant.betalingstermijn ?? 30,
    btw_regime: klant.btw_regime ?? 'normaal',
  })
  const [loading, setLoading] = useState(false)
  const [fout, setFout] = useState('')
  const [ok, setOk] = useState('')

  function stelIn(v, w) { setForm(f => ({ ...f, [v]: w })) }

  async function opslaan(e) {
    e.preventDefault()
    if (form.iban.trim() && !/^[A-Za-z]{2}/.test(form.iban.trim())) {
      setFout('IBAN lijkt ongeldig — moet beginnen met een landcode van 2 letters (bv. BE...).')
      return
    }
    setLoading(true); setFout(''); setOk('')
    const { error } = await supabase.from('klanten').update({
      facturatie_email: form.facturatie_email || null,
      iban: form.iban || null,
      bic: form.bic || null,
      betalingstermijn: Number(form.betalingstermijn),
      btw_regime: form.btw_regime,
    }).eq('id', klant.id)
    setLoading(false)
    if (error) { setFout('Opslaan mislukt: ' + error.message); return }
    setOk('Wijzigingen opgeslagen.')
    setTimeout(() => setOk(''), 3000)
    onBijgewerkt()
  }

  return (
    <form onSubmit={opslaan} className="space-y-4 max-w-2xl py-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={lbl}>Facturatie e-mailadres</label>
          <input type="email" value={form.facturatie_email} onChange={e => stelIn('facturatie_email', e.target.value)} className={inp} />
        </div>
        <div>
          <label className={lbl}>IBAN</label>
          <input value={form.iban} onChange={e => stelIn('iban', e.target.value.toUpperCase())} placeholder="BE00 0000 0000 0000" className={inp} />
        </div>
        <div>
          <label className={lbl}>BIC/SWIFT</label>
          <input value={form.bic} onChange={e => stelIn('bic', e.target.value.toUpperCase())} className={inp} />
        </div>
        <div>
          <label className={lbl}>Betalingstermijn</label>
          <select value={form.betalingstermijn} onChange={e => stelIn('betalingstermijn', e.target.value)} className={inp}>
            {BETALINGSTERMIJNEN.map(d => <option key={d} value={d}>{d} dagen</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>BTW-regime</label>
          <select value={form.btw_regime} onChange={e => stelIn('btw_regime', e.target.value)} className={inp}>
            {BTW_REGIMES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
        </div>
      </div>
      <FoutMelding tekst={fout} />
      <OpslaanBericht tekst={ok} />
      <div className="pt-2">
        <button type="submit" disabled={loading}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: '#185FA5' }}>
          {loading ? 'Opslaan...' : 'Wijzigingen opslaan'}
        </button>
      </div>
    </form>
  )
}

// ── TabProjecten ──────────────────────────────────────────────────────────────
function TabProjecten({ klantId }) {
  const navigate = useNavigate()
  const [projecten, setProjecten] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('projecten').select('*')
      .eq('klant_id', klantId)
      .order('aangemaakt_op', { ascending: false })
      .then(({ data }) => { setProjecten(data ?? []); setLoading(false) })
  }, [klantId])

  if (loading) return <Spinner />

  if (projecten.length === 0) {
    return (
      <div className="bg-gray-50 rounded-xl px-4 py-10 text-center my-2">
        <FolderKanban size={22} className="mx-auto mb-1.5 text-gray-200" />
        <p className="text-xs text-gray-400">Nog geen projecten gekoppeld aan deze klant.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 py-2">
      {projecten.map(p => (
        <div key={p.id} onClick={() => navigate(`/projecten/${p.id}`)}
          className="bg-gray-50 hover:bg-gray-100 rounded-xl px-4 py-3.5 flex items-center justify-between gap-3 cursor-pointer transition-colors">
          <p className="text-sm font-medium text-gray-900">{p.naam}</p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusBadge status={p.status} />
            <ChevronRight size={14} className="text-gray-300" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Hoofdcomponent ────────────────────────────────────────────────────────────
export default function KlantDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [klant, setKlant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fout, setFout] = useState('')
  const [actieveTab, setActieveTab] = useState('bedrijf')

  async function laadKlant() {
    const { data, error } = await supabase.from('klanten').select('*').eq('id', id).single()
    if (error || !data) { setFout('Klant niet gevonden.'); setLoading(false); return }
    setKlant(data)
    document.title = `${data.bedrijfsnaam || data.naam} — BYT Studio`
    setLoading(false)
  }

  useEffect(() => { laadKlant() }, [id])

  if (loading) return <Spinner />

  if (fout || !klant) return (
    <div className="text-center py-24">
      <p className="text-gray-500">{fout || 'Klant niet gevonden.'}</p>
      <Link to="/klanten" className="text-sm text-blue-500 hover:underline mt-2 inline-block">← Terug naar klanten</Link>
    </div>
  )

  const titel = klant.bedrijfsnaam || klant.naam

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Link to="/klanten" className="hover:text-gray-600 transition flex items-center gap-1">
          <ChevronLeft size={14} /> Klanten
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">{titel}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{titel}</h1>
            <KlantStatusBadge status={klant.status} />
          </div>
          {klant.bedrijfsnaam && klant.naam && (
            <p className="text-sm text-gray-400 mt-1">{klant.naam}</p>
          )}
        </div>
        <button
          onClick={() => navigate(`/projecten?klant_id=${klant.id}`)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white whitespace-nowrap flex-shrink-0 transition-opacity hover:opacity-90"
          style={{ background: '#185FA5' }}
        >
          <Plus size={14} />
          Nieuw project
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map(t => {
            const Icon = t.icon
            const actief = actieveTab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setActieveTab(t.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  actief
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200'
                }`}
              >
                <Icon size={14} style={{ color: actief ? '#185FA5' : undefined }} />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab inhoud */}
      <div>
        {actieveTab === 'bedrijf'         && <TabBedrijf         klant={klant} onBijgewerkt={laadKlant} />}
        {actieveTab === 'contactpersonen' && <TabContactpersonen klantId={klant.id} />}
        {actieveTab === 'adres'           && <TabAdres           klant={klant} onBijgewerkt={laadKlant} />}
        {actieveTab === 'financieel'      && <TabFinancieel      klant={klant} onBijgewerkt={laadKlant} />}
        {actieveTab === 'projecten'       && <TabProjecten       klantId={klant.id} />}
      </div>
    </div>
  )
}
