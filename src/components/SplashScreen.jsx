// SplashScreen.jsx — Laadscherm bij opstarten van de app
// Props:
//   authReady  boolean  — wordt true zodra de auth-check klaar is
//   onDone     fn       — callback wanneer het splash-scherm klaar is met afspelen
//
// Timing:
//   - Minimum zichtbaarheidsduur: 900ms (zodat het scherm niet flitst)
//   - Fade-out: 280ms CSS-transitie
//   - Hard timeout: na 5s altijd doorgaan, ook als auth nog niet klaar is
import { useEffect, useRef, useState } from 'react'

export default function SplashScreen({ authReady, onDone }) {
  const [fading, setFading]   = useState(false)
  const [visible, setVisible] = useState(true)
  const doneRef               = useRef(false)

  function startFadeOut() {
    if (doneRef.current) return
    doneRef.current = true
    setFading(true)
    setTimeout(() => {
      setVisible(false)
      onDone()
    }, 280)
  }

  // Hard timeout: na 5s sowieso doorgaan
  useEffect(() => {
    const timeout = setTimeout(startFadeOut, 5000)
    return () => clearTimeout(timeout)
  }, [])

  // Wanneer auth klaar is: wacht minimum 900ms, start dan fade-out
  useEffect(() => {
    if (!authReady) return
    const t = setTimeout(startFadeOut, 900)
    return () => clearTimeout(t)
  }, [authReady])

  if (!visible) return null

  return (
    <>
      <style>{`
        @keyframes byt-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes byt-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{
        position: 'fixed',
        inset: 0,
        background: '#0B0F0E',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
        zIndex: 9999,
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.28s ease',
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
      }}>

        {/* Mark-tile als centraal beeldmerk */}
        <img
          src="/assets/mark/mark-tile.svg"
          alt=""
          style={{ width: 72, height: 72, objectFit: 'contain' }}
        />

        {/* Volledig logo */}
        <img
          src="/assets/logo/logo-reversed.svg"
          alt="Build Your Tools"
          style={{ height: 40, objectFit: 'contain' }}
        />

        {/* Welkomsttekst */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            margin: '0 0 6px',
            fontSize: 24,
            fontWeight: 700,
            color: '#FFFFFF',
            fontFamily: "'Space Grotesk', system-ui, sans-serif",
            letterSpacing: '-0.01em',
          }}>
            Welkom bij Build Your Tools
          </h1>
          <p style={{
            margin: 0,
            fontSize: 14,
            color: '#7BDFA3',
            fontWeight: 400,
            letterSpacing: '0.01em',
          }}>
            Slimme apps voor slimme bedrijven
          </p>
        </div>

        {/* Laadindicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
          <div style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            border: '2px solid #22C35D',
            borderTopColor: 'transparent',
            animation: 'byt-spin 0.8s linear infinite',
          }} />
          <span style={{
            color: '#4D534F',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            fontFamily: "'IBM Plex Mono', monospace",
          }}>
            Laden
          </span>
        </div>

      </div>
    </>
  )
}
