// src/components/Banner.jsx — Reclamebanner bovenaan de app, data uit Supabase
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const STANDAARD = {
  zichtbaar: true,
  titel: 'Welkom bij Build Your Tools',
  subtitel: 'Slimme apps voor slimme bedrijven',
}

export default function Banner() {
  const [data, setData] = useState(null) // null = nog aan het laden

  useEffect(() => {
    // Initiële load uit Supabase
    supabase
      .from('instellingen')
      .select('banner_zichtbaar, banner_titel, banner_subtitel')
      .limit(1)
      .single()
      .then(({ data: rij }) => {
        if (rij) {
          setData({
            zichtbaar: rij.banner_zichtbaar ?? STANDAARD.zichtbaar,
            titel: rij.banner_titel ?? STANDAARD.titel,
            subtitel: rij.banner_subtitel ?? STANDAARD.subtitel,
          })
        } else {
          setData(STANDAARD)
        }
      })

    // Luister naar live updates vanuit Instellingen-pagina
    function onUpdate(e) {
      setData({
        zichtbaar: e.detail.zichtbaar ?? STANDAARD.zichtbaar,
        titel: e.detail.titel ?? STANDAARD.titel,
        subtitel: e.detail.subtitel ?? STANDAARD.subtitel,
      })
    }
    window.addEventListener('byt-banner-update', onUpdate)
    return () => window.removeEventListener('byt-banner-update', onUpdate)
  }, [])

  // Nog aan het laden of bewust verborgen
  if (!data || !data.zichtbaar) return null

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
        {data.titel}
      </div>
      <div style={{
        fontSize: '14px',
        color: 'rgba(255,255,255,0.88)',
        fontFamily: "'Inter', system-ui, sans-serif",
        fontWeight: 400,
      }}>
        {data.subtitel}
      </div>
    </div>
  )
}
