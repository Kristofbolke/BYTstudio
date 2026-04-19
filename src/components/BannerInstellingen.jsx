// src/components/BannerInstellingen.jsx
// Schakelaar + tekst aanpassen — zet dit in je Instellingen-pagina

import { useState, useEffect } from 'react'

export default function BannerInstellingen() {
  const [aan, setAan] = useState(true)
  const [titel, setTitel] = useState('Welkom bij Build Your Tools')
  const [subtitel, setSubtitel] = useState('Slimme apps voor slimme bedrijven')

  useEffect(() => {
    const opgeslagen = localStorage.getItem('byt_banner_zichtbaar')
    if (opgeslagen !== null) setAan(opgeslagen === 'true')
    const t = localStorage.getItem('byt_banner_titel')
    const s = localStorage.getItem('byt_banner_subtitel')
    if (t) setTitel(t)
    if (s) setSubtitel(s)
  }, [])

  const slaOp = () => {
    localStorage.setItem('byt_banner_zichtbaar', aan)
    localStorage.setItem('byt_banner_titel', titel)
    localStorage.setItem('byt_banner_subtitel', subtitel)
    alert('Banner-instellingen opgeslagen')
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 16 }}>
        Banner-instellingen
      </h3>
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 13 }}>Banner tonen</span>
        <input
          type="checkbox"
          checked={aan}
          onChange={e => setAan(e.target.checked)}
        />
      </label>
      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>
          Titel
        </label>
        <input
          value={titel}
          onChange={e => setTitel(e.target.value)}
          style={{
            width: '100%', padding: '7px 10px',
            border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13,
          }}
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>
          Ondertitel
        </label>
        <input
          value={subtitel}
          onChange={e => setSubtitel(e.target.value)}
          style={{
            width: '100%', padding: '7px 10px',
            border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13,
          }}
        />
      </div>
      <button
        onClick={slaOp}
        style={{
          padding: '8px 18px', background: '#185FA5', color: '#fff',
          border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer',
        }}
      >
        Opslaan
      </button>
    </div>
  )
}
