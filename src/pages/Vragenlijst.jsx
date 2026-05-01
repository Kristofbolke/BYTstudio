// Vragenlijst.jsx — Publieke klantenvragenlijst (geen login vereist)
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react'

// ── Opties ────────────────────────────────────────────────────────────────────
const SECTOR_OPTIES = [
  'Horeca', 'Retail', 'Sport & Fitness', 'Zorg & Welzijn',
  'Bouw & Renovatie', 'Transport & Logistiek', 'Professionele diensten',
  'Onderwijs', 'Evenementen', 'Andere',
]
const MEDEWERKERS_OPTIES = ['1-5', '6-15', '16-50', '51-200', '200+']
const APPARATEN_OPTIES = [
  'Desktop / laptop', 'Tablet', 'Smartphone', 'Kassa / POS systeem', 'Andere',
]
const PROBLEMEN_OPTIES = [
  'Tijdrovende manuele processen',
  'Moeilijk overzicht houden op klanten',
  'Fouten door manueel ingeven van data',
  'Slechte communicatie binnen het team',
  'Geen inzicht in statistieken of cijfers',
  'Moeilijk plannen van afspraken of taken',
  'Klantopvolging verloopt niet goed',
  'Geen',
]
const FUNCTIES_OPTIES = [
  'Login en gebruikersbeheer',
  'Dashboard met statistieken',
  'Klantenbeheer',
  'Reservaties en planning',
  'Offertes en facturen',
  'Betalingsopvolging',
  'E-mail notificaties',
  'Rapporten en export',
  'Koppeling met andere software',
  'Toegang via smartphone',
]
const BUDGET_OPTIES = [
  '< €1.500 (Starter app)',
  '€1.500 – €3.000 (Business app)',
  '€3.000 – €6.000 (Pro suite)',
  '> €6.000 (Enterprise)',
  'Nog niet bepaald',
]

const STAPPEN = [
  { nr: 1, titel: 'Jouw bedrijf' },
  { nr: 2, titel: 'De uitdaging' },
  { nr: 3, titel: 'Gewenste functies' },
  { nr: 4, titel: 'Jouw gegevens' },
]

const LEEG = {
  sector: '',
  aantal_medewerkers: '',
  apparaten_json: [],
  problemen_json: [],
  probleem_andere: '',
  functies_json: [],
  functies_andere: '',
  budget_range: '',
  gewenste_datum: '',
  klant_naam: '',
  klant_email: '',
  klant_opmerkingen: '',
}

// ── Stijlen ───────────────────────────────────────────────────────────────────
const inp = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none',
  fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box',
}

export default function Vragenlijst() {
  const { token } = useParams()

  const [vragenlijst, setVragenlijst]   = useState(null)
  const [laden,       setLaden]         = useState(true)
  const [gevonden,    setGevonden]      = useState(true)
  const [verstuurd,   setVerstuurd]     = useState(false)
  const [stap,        setStap]          = useState(0)
  const [bezig,       setBezig]         = useState(false)
  const [fout,        setFout]          = useState('')
  const [form,        setForm]          = useState(LEEG)

  useEffect(() => {
    document.title = 'Vragenlijst — Build Your Tools'
    laad()
  }, [token])

  async function laad() {
    setLaden(true)
    const { data } = await supabase
      .from('klantenvragenlijst')
      .select('*')
      .eq('token', token)
      .maybeSingle()
    if (!data) {
      setGevonden(false)
    } else {
      setVragenlijst(data)
      if (data.status === 'ingevuld') setVerstuurd(true)
    }
    setLaden(false)
  }

  function stelIn(veld, waarde) {
    setForm(f => ({ ...f, [veld]: waarde }))
  }

  function toggleArray(veld, waarde) {
    setForm(f => {
      const huidig = f[veld] ?? []
      return {
        ...f,
        [veld]: huidig.includes(waarde)
          ? huidig.filter(v => v !== waarde)
          : [...huidig, waarde],
      }
    })
  }

  function volgende() {
    setFout('')
    setStap(s => Math.min(s + 1, STAPPEN.length - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function vorige() {
    setFout('')
    setStap(s => Math.max(s - 1, 0))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function verstuur() {
    if (!form.klant_naam.trim()) { setFout('Vul je naam in.'); return }
    if (!form.klant_email.trim()) { setFout('Vul je e-mailadres in.'); return }
    setBezig(true)
    const { error } = await supabase
      .from('klantenvragenlijst')
      .update({
        sector:            form.sector,
        aantal_medewerkers: form.aantal_medewerkers,
        apparaten_json:    form.apparaten_json,
        problemen_json:    form.problemen_json,
        probleem_andere:   form.probleem_andere,
        functies_json:     form.functies_json,
        functies_andere:   form.functies_andere,
        budget_range:      form.budget_range,
        gewenste_datum:    form.gewenste_datum || null,
        klant_naam:        form.klant_naam,
        klant_email:       form.klant_email,
        klant_opmerkingen: form.klant_opmerkingen,
        status:            'ingevuld',
        ingevuld_op:       new Date().toISOString(),
        bijgewerkt_op:     new Date().toISOString(),
      })
      .eq('token', token)
    setBezig(false)
    if (error) {
      setFout('Er ging iets mis. Probeer opnieuw.')
    } else {
      setVerstuurd(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // ── Laden ──────────────────────────────────────────────────────────────────
  if (laden) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #185FA5', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: '#6b7280', fontSize: 14 }}>Laden...</p>
        </div>
      </div>
    )
  }

  // ── Niet gevonden ──────────────────────────────────────────────────────────
  if (!gevonden) {
    return (
      <Wrapper>
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>404</p>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Vragenlijst niet gevonden</p>
          <p style={{ fontSize: 14, color: '#6b7280' }}>
            Deze link is ongeldig of verlopen. Neem contact op met ons.
          </p>
        </div>
      </Wrapper>
    )
  }

  // ── Bedankpagina ───────────────────────────────────────────────────────────
  if (verstuurd) {
    return (
      <Wrapper>
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle size={32} color="#16a34a" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 10 }}>
            Bedankt voor je antwoorden!
          </h2>
          <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.6, maxWidth: 380, margin: '0 auto' }}>
            We hebben je ingevulde vragenlijst goed ontvangen en nemen zo snel mogelijk contact met je op.
          </p>
          <div style={{ marginTop: 32, padding: '16px 24px', background: '#f8fafc', borderRadius: 12, display: 'inline-block' }}>
            <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>
              Vragen? Mail ons op{' '}
              <a href="mailto:info@buildyourtools.be" style={{ color: '#185FA5', fontWeight: 600 }}>
                info@buildyourtools.be
              </a>
            </p>
          </div>
        </div>
      </Wrapper>
    )
  }

  // ── Formulier ──────────────────────────────────────────────────────────────
  return (
    <Wrapper>
      {/* Voortgang */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          {STAPPEN.map((s, i) => (
            <div key={s.nr} style={{ display: 'flex', alignItems: 'center', gap: 6, flex: i < STAPPEN.length - 1 ? 1 : 'unset' }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
                background: i <= stap ? '#185FA5' : '#e5e7eb',
                color: i <= stap ? '#fff' : '#9ca3af',
              }}>
                {i < stap ? <CheckCircle size={13} /> : s.nr}
              </div>
              {i < STAPPEN.length - 1 && (
                <div style={{ flex: 1, height: 2, background: i < stap ? '#185FA5' : '#e5e7eb', margin: '0 4px' }} />
              )}
            </div>
          ))}
        </div>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>
          Stap {stap + 1} van {STAPPEN.length} — <strong style={{ color: '#111827' }}>{STAPPEN[stap].titel}</strong>
        </p>
      </div>

      {/* ── Stap 1: Jouw bedrijf ── */}
      {stap === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Veld label="In welke sector is jouw bedrijf actief?">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SECTOR_OPTIES.map(o => (
                <KeuzeChip
                  key={o} label={o}
                  actief={form.sector === o}
                  onClick={() => stelIn('sector', form.sector === o ? '' : o)}
                />
              ))}
            </div>
          </Veld>

          <Veld label="Hoeveel medewerkers telt jullie bedrijf?">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {MEDEWERKERS_OPTIES.map(o => (
                <KeuzeChip
                  key={o} label={o}
                  actief={form.aantal_medewerkers === o}
                  onClick={() => stelIn('aantal_medewerkers', form.aantal_medewerkers === o ? '' : o)}
                />
              ))}
            </div>
          </Veld>

          <Veld label="Welke apparaten gebruiken jullie medewerkers? (meerdere keuzes mogelijk)">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {APPARATEN_OPTIES.map(o => (
                <CheckChip
                  key={o} label={o}
                  actief={form.apparaten_json.includes(o)}
                  onClick={() => toggleArray('apparaten_json', o)}
                />
              ))}
            </div>
          </Veld>
        </div>
      )}

      {/* ── Stap 2: De uitdaging ── */}
      {stap === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Veld label="Wat zijn de grootste uitdagingen in jullie bedrijf? (meerdere keuzes mogelijk)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PROBLEMEN_OPTIES.map(o => (
                <CheckRij
                  key={o} label={o}
                  actief={form.problemen_json.includes(o)}
                  onClick={() => toggleArray('problemen_json', o)}
                />
              ))}
            </div>
          </Veld>

          <Veld label="Andere uitdaging (optioneel)">
            <textarea
              style={{ ...inp, resize: 'none', minHeight: 80 }}
              value={form.probleem_andere}
              onChange={e => stelIn('probleem_andere', e.target.value)}
              placeholder="Beschrijf eventueel een andere uitdaging..."
            />
          </Veld>
        </div>
      )}

      {/* ── Stap 3: Gewenste functies ── */}
      {stap === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Veld label="Welke functies zijn belangrijk voor jullie app? (meerdere keuzes mogelijk)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FUNCTIES_OPTIES.map(o => (
                <CheckRij
                  key={o} label={o}
                  actief={form.functies_json.includes(o)}
                  onClick={() => toggleArray('functies_json', o)}
                />
              ))}
            </div>
          </Veld>

          <Veld label="Andere gewenste functie (optioneel)">
            <textarea
              style={{ ...inp, resize: 'none', minHeight: 80 }}
              value={form.functies_andere}
              onChange={e => stelIn('functies_andere', e.target.value)}
              placeholder="Beschrijf eventueel een andere functie..."
            />
          </Veld>
        </div>
      )}

      {/* ── Stap 4: Jouw gegevens ── */}
      {stap === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Veld label="Naam *">
            <input
              style={inp}
              value={form.klant_naam}
              onChange={e => stelIn('klant_naam', e.target.value)}
              placeholder="Jouw volledige naam"
            />
          </Veld>

          <Veld label="E-mailadres *">
            <input
              style={inp}
              type="email"
              value={form.klant_email}
              onChange={e => stelIn('klant_email', e.target.value)}
              placeholder="jouw@email.be"
            />
          </Veld>

          <Veld label="Wat is jullie budgetvoorkeur?">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {BUDGET_OPTIES.map(o => (
                <CheckRij
                  key={o} label={o}
                  actief={form.budget_range === o}
                  onClick={() => stelIn('budget_range', form.budget_range === o ? '' : o)}
                />
              ))}
            </div>
          </Veld>

          <Veld label="Gewenste opleverdatum (optioneel)">
            <input
              style={inp}
              type="date"
              value={form.gewenste_datum}
              onChange={e => stelIn('gewenste_datum', e.target.value)}
            />
          </Veld>

          <Veld label="Opmerkingen of extra informatie (optioneel)">
            <textarea
              style={{ ...inp, resize: 'none', minHeight: 100 }}
              value={form.klant_opmerkingen}
              onChange={e => stelIn('klant_opmerkingen', e.target.value)}
              placeholder="Alles wat je kwijt wil..."
            />
          </Veld>

          {fout && (
            <p style={{ fontSize: 13, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px' }}>
              {fout}
            </p>
          )}
        </div>
      )}

      {/* Navigatieknoppen */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, gap: 12 }}>
        <button
          onClick={vorige}
          disabled={stap === 0}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e5e7eb',
            background: '#fff', fontSize: 14, fontWeight: 600, color: '#374151',
            cursor: stap === 0 ? 'not-allowed' : 'pointer',
            opacity: stap === 0 ? 0.4 : 1,
          }}
        >
          <ChevronLeft size={16} /> Vorige
        </button>

        {stap < STAPPEN.length - 1 ? (
          <button
            onClick={volgende}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 24px', borderRadius: 10, border: 'none',
              background: '#185FA5', color: '#fff', fontSize: 14, fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Volgende <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={verstuur}
            disabled={bezig}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 24px', borderRadius: 10, border: 'none',
              background: '#16a34a', color: '#fff', fontSize: 14, fontWeight: 700,
              cursor: bezig ? 'not-allowed' : 'pointer', opacity: bezig ? 0.7 : 1,
            }}
          >
            <CheckCircle size={16} />
            {bezig ? 'Versturen...' : 'Vragenlijst versturen'}
          </button>
        )}
      </div>
    </Wrapper>
  )
}

// ── Layout wrapper ────────────────────────────────────────────────────────────
function Wrapper({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '32px 16px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '10px 20px', display: 'inline-block', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <img src="/logo-byt.png" alt="Build Your Tools" style={{ height: 40, objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: '0 0 4px' }}>
            Vragenlijst
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
            Vul de vragenlijst in zodat we jouw project goed kunnen leren kennen.
          </p>
        </div>

        {/* Kaart */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          {children}
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 20 }}>
          Build Your Tools · buildyourtools.be
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  )
}

// ── Hulpcomponenten ───────────────────────────────────────────────────────────
function Veld({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function KeuzeChip({ label, actief, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500,
        border: `1.5px solid ${actief ? '#185FA5' : '#e5e7eb'}`,
        background: actief ? '#eff6ff' : '#fff',
        color: actief ? '#185FA5' : '#374151',
        cursor: 'pointer', transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  )
}

function CheckChip({ label, actief, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500,
        border: `1.5px solid ${actief ? '#185FA5' : '#e5e7eb'}`,
        background: actief ? '#eff6ff' : '#fff',
        color: actief ? '#185FA5' : '#374151',
        cursor: 'pointer', transition: 'all 0.15s',
      }}
    >
      <span style={{
        width: 15, height: 15, borderRadius: 4, flexShrink: 0,
        border: `1.5px solid ${actief ? '#185FA5' : '#d1d5db'}`,
        background: actief ? '#185FA5' : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {actief && <CheckCircle size={9} color="#fff" />}
      </span>
      {label}
    </button>
  )
}

function CheckRij({ label, actief, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, width: '100%',
        padding: '12px 14px', borderRadius: 10, fontSize: 14,
        border: `1.5px solid ${actief ? '#185FA5' : '#e5e7eb'}`,
        background: actief ? '#eff6ff' : '#fff',
        color: actief ? '#185FA5' : '#374151',
        cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
        fontWeight: actief ? 600 : 400,
      }}
    >
      <span style={{
        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
        border: `1.5px solid ${actief ? '#185FA5' : '#d1d5db'}`,
        background: actief ? '#185FA5' : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {actief && <CheckCircle size={10} color="#fff" />}
      </span>
      {label}
    </button>
  )
}
