// src/components/Banner.jsx
// Reclamebanner bovenaan BYT Studio — aan/uit via schakelaar

import { useState, useEffect } from 'react'

export default function Banner() {
  const [zichtbaar, setZichtbaar] = useState(true)
  const [titel, setTitel] = useState('Welkom bij Build Your Tools')
  const [subtitel, setSubtitel] = useState('Slimme apps voor slimme bedrijven')

  useEffect(() => {
    const opgeslagen = localStorage.getItem('byt_banner_zichtbaar')
    if (opgeslagen !== null) setZichtbaar(opgeslagen === 'true')
    const t = localStorage.getItem('byt_banner_titel')
    const s = localStorage.getItem('byt_banner_subtitel')
    if (t) setTitel(t)
    if (s) setSubtitel(s)
  }, [])

  if (!zichtbaar) return null

  return (
    <div style={{
      width: '100%',
      height: '100px',
      background: '#185FA5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '4px',
      flexShrink: 0,
    }}>
      <div style={{
        fontSize: '22px',
        fontWeight: 700,
        color: '#ffffff',
        fontFamily: "'Inter', system-ui, sans-serif",
        letterSpacing: '-0.01em',
        lineHeight: 1.2,
      }}>
        {titel}
      </div>
      <div style={{
        fontSize: '14px',
        color: 'rgba(255,255,255,0.88)',
        fontFamily: "'Inter', system-ui, sans-serif",
        fontWeight: 400,
      }}>
        {subtitel}
      </div>
    </div>
  )
}
