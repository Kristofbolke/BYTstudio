// IntakePubliek.jsx — Publieke intakepagina via tokenlink (/intake/:token)
// Geen login vereist — formulier wordt geladen en opgeslagen via Supabase anon key
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import IntakeFormWizard from '../components/IntakeFormWizard'

export default function IntakePubliek() {
  const { token } = useParams()
  const [intake, setIntake]     = useState(null)
  const [laden, setLaden]       = useState(true)
  const [gevonden, setGevonden] = useState(true)

  // Brand fonts laden
  useEffect(() => {
    const id = 'byt-brand-fonts'
    if (!document.getElementById(id)) {
      const link = document.createElement('link')
      link.id   = id
      link.rel  = 'stylesheet'
      link.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap'
      document.head.appendChild(link)
    }
    document.title = 'Intakeformulier — Build Your Tools'
  }, [])

  useEffect(() => { laad() }, [token])

  async function laad() {
    setLaden(true)
    const { data } = await supabase
      .from('intake_forms')
      .select('*')
      .eq('token', token)
      .maybeSingle()
    if (!data) {
      setGevonden(false)
    } else {
      setIntake(data)
    }
    setLaden(false)
  }

  async function onSave(velden) {
    const { error } = await supabase
      .from('intake_forms')
      .update(velden)
      .eq('token', token)
    return { error }
  }

  async function onSubmit(velden) {
    const { error } = await supabase
      .from('intake_forms')
      .update({
        ...velden,
        status:       'submitted',
        filled_by:    'klant',
        submitted_at: new Date().toISOString(),
      })
      .eq('token', token)
    return { error }
  }

  // ── Laden ─────────────────────────────────────────────────────────────────
  if (laden) {
    return (
      <div style={S.volledigScherm}>
        <div style={{ textAlign: 'center' }}>
          <div style={S.spinner} />
          <p style={{ color: '#929996', fontSize: 14, marginTop: 12 }}>Laden...</p>
        </div>
        <KSpin />
      </div>
    )
  }

  // ── Niet gevonden ─────────────────────────────────────────────────────────
  if (!gevonden) {
    return (
      <Wrapper>
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p style={{ fontSize: 48, marginBottom: 12, lineHeight: 1 }}>🔗</p>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0B0F0E', marginBottom: 8 }}>
            Deze link is niet geldig
          </h2>
          <p style={{ fontSize: 14, color: '#929996', lineHeight: 1.6, maxWidth: 340, margin: '0 auto' }}>
            Het intakeformulier dat je probeert te openen bestaat niet of is verlopen.
            Neem contact op met ons als je denkt dat dit een fout is.
          </p>
          <a
            href="mailto:info@buildyourtools.be"
            style={{ display: 'inline-block', marginTop: 24, fontSize: 13, color: '#17A84B', fontWeight: 600 }}
          >
            info@buildyourtools.be
          </a>
        </div>
      </Wrapper>
    )
  }

  // ── Formulier (of bedankscherm via wizard) ────────────────────────────────
  return (
    <Wrapper>
      <IntakeFormWizard
        intake={intake}
        onSave={onSave}
        onSubmit={onSubmit}
        isPublic
      />
    </Wrapper>
  )
}

// ── Layout wrapper ────────────────────────────────────────────────────────────
function Wrapper({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F4F6F5', fontFamily: "'IBM Plex Sans', sans-serif" }}>
      {/* Donkere header */}
      <div style={{
        background: '#0B0F0E', padding: '20px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <img
          src="/assets/logo/studio-byt-logo-negative.svg"
          alt="Build Your Tools"
          style={{ height: 32, objectFit: 'contain' }}
        />
        <span style={{ fontSize: 12, color: '#4D534F', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.05em' }}>
          INTAKEFORMULIER
        </span>
      </div>

      {/* Intro-balk */}
      <div style={{ background: '#fff', borderBottom: '1px solid #D5DAD8', padding: '16px 24px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: '#0B0F0E', margin: '0 0 4px' }}>
            Vertel ons over jouw project
          </h1>
          <p style={{ fontSize: 13, color: '#6B726F', margin: 0 }}>
            Vul het formulier in zodat we jouw noden goed begrijpen. Je kan het op elk moment onderbreken — je antwoorden worden automatisch bewaard.
          </p>
        </div>
      </div>

      {/* Formulierkaart */}
      <div style={{ maxWidth: 700, margin: '32px auto', padding: '0 16px 48px' }}>
        <div style={{
          background: '#fff', borderRadius: 14, border: '1px solid #D5DAD8',
          padding: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}>
          {children}
        </div>
        <p style={{ textAlign: 'center', fontSize: 12, color: '#B7BEBB', marginTop: 20 }}>
          Build Your Tools · buildyourtools.be
        </p>
      </div>

      <KSpin />
    </div>
  )
}

// ── Keyframe spin ─────────────────────────────────────────────────────────────
function KSpin() {
  return (
    <style>{`@keyframes byt-spin { to { transform: rotate(360deg); } } * { box-sizing: border-box; }`}</style>
  )
}

const S = {
  volledigScherm: {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: '#F4F6F5',
  },
  spinner: {
    width: 32, height: 32, borderRadius: '50%',
    border: '3px solid #22C35D', borderTopColor: 'transparent',
    animation: 'byt-spin 0.8s linear infinite', margin: '0 auto',
  },
}
