// src/components/Banner.jsx — Geanimeerde app-header met BYT-logo blokjes
import { useState, useEffect } from 'react'
import { useInstellingen } from '../context/InstellingenContext'

const BYT_GREEN = '#78C833'

// Kleuren uit het BYT-logo
const BLOKKEN = ['#7ed957', '#ff0000', '#ff751f']

export default function Banner() {
  const { instellingen, laden } = useInstellingen()
  const [actief, setActief] = useState(false)

  // Dubbel requestAnimationFrame: zorgt dat browser de begin-state heeft gepaint
  // vóór de animatie start — anders is er geen "from"-frame voor de CSS transition
  useEffect(() => {
    let raf1, raf2
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setActief(true)
      })
    })
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [])

  if (laden) return null
  if (!instellingen.banner_zichtbaar) return null

  const titel = instellingen.banner_titel || 'BYT Studio'
  const subtitel = instellingen.banner_subtitel || ''

  return (
    <div style={{
      width: '100%',
      height: '68px',
      background: '#0a0a0a',
      borderBottom: '1px solid rgba(126,217,87,0.18)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '20px',
      flexShrink: 0,
      overflow: 'hidden',
      userSelect: 'none',
    }}>

      {/* Geanimeerd logo: < blokjes > */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>

        {/* < links */}
        <span style={{
          fontFamily: "'Courier New', monospace",
          fontWeight: 700,
          fontSize: '22px',
          color: BYT_GREEN,
          transform: actief ? 'translateX(0)' : 'translateX(18px)',
          opacity: actief ? 1 : 0,
          transition: 'transform 0.6s cubic-bezier(0.34, 1.3, 0.64, 1), opacity 0.4s ease',
          lineHeight: 1,
          display: 'block',
        }}>
          {'<'}
        </span>

        {/* Gekleurde blokjes uit het logo */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {BLOKKEN.map((kleur, i) => (
            <div
              key={i}
              style={{
                width: '11px',
                height: '11px',
                borderRadius: '2px',
                background: kleur,
                transform: actief ? 'scale(1)' : 'scale(0)',
                opacity: actief ? 1 : 0,
                transition: [
                  `transform 0.45s cubic-bezier(0.34, 1.6, 0.64, 1) ${0.15 + i * 0.08}s`,
                  `opacity 0.3s ease ${0.15 + i * 0.08}s`,
                ].join(', '),
              }}
            />
          ))}
        </div>

        {/* > rechts */}
        <span style={{
          fontFamily: "'Courier New', monospace",
          fontWeight: 700,
          fontSize: '22px',
          color: BYT_GREEN,
          transform: actief ? 'translateX(0)' : 'translateX(-18px)',
          opacity: actief ? 1 : 0,
          transition: 'transform 0.6s cubic-bezier(0.34, 1.3, 0.64, 1), opacity 0.4s ease',
          lineHeight: 1,
          display: 'block',
        }}>
          {'>'}
        </span>
      </div>

      {/* Scheidingslijn */}
      <div style={{
        width: '1px',
        height: '28px',
        background: 'rgba(255,255,255,0.12)',
        flexShrink: 0,
        opacity: actief ? 1 : 0,
        transition: 'opacity 0.5s ease 0.4s',
      }} />

      {/* Tekst */}
      <div style={{
        opacity: actief ? 1 : 0,
        transform: actief ? 'translateY(0)' : 'translateY(6px)',
        transition: 'opacity 0.5s ease 0.35s, transform 0.5s ease 0.35s',
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
