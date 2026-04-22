// src/components/Banner.jsx — Geanimeerde app-header met BYT-logo animatie
import { useState, useEffect } from 'react'
import { useInstellingen } from '../context/InstellingenContext'

const BYT_GREEN = '#78C833'
const BLOKKEN = [
  { kleur: '#78C833' }, // groen
  { kleur: '#185FA5' }, // blauw
  { kleur: '#f97316' }, // oranje
  { kleur: '#a855f7' }, // paars
]

export default function Banner() {
  const { instellingen, laden } = useInstellingen()
  const [actief, setActief] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setActief(true), 60)
    return () => clearTimeout(t)
  }, [])

  // Verberg tijdens laden of wanneer uitgeschakeld
  if (laden) return null
  if (!instellingen.banner_zichtbaar) return null

  const titel = instellingen.banner_titel || 'BYT Studio'
  const subtitel = instellingen.banner_subtitel || ''

  return (
    <div style={{
      width: '100%',
      height: '68px',
      background: '#0a0a0a',
      borderBottom: `1px solid rgba(120,200,51,0.18)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '20px',
      flexShrink: 0,
      overflow: 'hidden',
      userSelect: 'none',
    }}>

      {/* Geanimeerd logo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>

        {/* Links: </ */}
        <span style={{
          fontFamily: "'Courier New', 'Courier', monospace",
          fontWeight: 700,
          fontSize: '18px',
          color: BYT_GREEN,
          letterSpacing: '-1px',
          transform: actief ? 'translateX(0)' : 'translateX(14px)',
          opacity: actief ? 1 : 0,
          transition: 'transform 0.55s cubic-bezier(0.34, 1.4, 0.64, 1), opacity 0.35s ease',
          lineHeight: 1,
        }}>
          {'</'}
        </span>

        {/* Gekleurde blokjes */}
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          {BLOKKEN.map((b, i) => (
            <div
              key={i}
              style={{
                width: '9px',
                height: '9px',
                borderRadius: '2px',
                background: b.kleur,
                transform: actief ? 'scale(1) translateY(0)' : 'scale(0) translateY(4px)',
                opacity: actief ? 1 : 0,
                transition: [
                  `transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.18 + i * 0.07}s`,
                  `opacity 0.3s ease ${0.18 + i * 0.07}s`,
                ].join(', '),
              }}
            />
          ))}
        </div>

        {/* Rechts: /> */}
        <span style={{
          fontFamily: "'Courier New', 'Courier', monospace",
          fontWeight: 700,
          fontSize: '18px',
          color: BYT_GREEN,
          letterSpacing: '-1px',
          transform: actief ? 'translateX(0)' : 'translateX(-14px)',
          opacity: actief ? 1 : 0,
          transition: 'transform 0.55s cubic-bezier(0.34, 1.4, 0.64, 1), opacity 0.35s ease',
          lineHeight: 1,
        }}>
          {'/>'}
        </span>
      </div>

      {/* Scheidingslijn */}
      <div style={{
        width: '1px',
        height: '30px',
        background: 'rgba(255,255,255,0.1)',
        flexShrink: 0,
        opacity: actief ? 1 : 0,
        transition: 'opacity 0.4s ease 0.4s',
      }} />

      {/* Tekst */}
      <div style={{
        opacity: actief ? 1 : 0,
        transform: actief ? 'translateY(0)' : 'translateY(5px)',
        transition: 'opacity 0.5s ease 0.38s, transform 0.5s ease 0.38s',
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#ffffff',
          fontFamily: "'Inter', system-ui, sans-serif",
          letterSpacing: '-0.01em',
          lineHeight: 1.25,
        }}>
          {titel}
        </div>
        {subtitel && (
          <div style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.45)',
            fontFamily: "'Inter', system-ui, sans-serif",
            marginTop: '2px',
            lineHeight: 1.2,
          }}>
            {subtitel}
          </div>
        )}
      </div>

    </div>
  )
}
