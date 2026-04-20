// src/components/Banner.jsx — Reclamebanner bovenaan de app, data via context
import { useInstellingen } from '../context/InstellingenContext'

export default function Banner() {
  const { instellingen, laden } = useInstellingen()

  if (laden || !instellingen.banner_zichtbaar) return null

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
        {instellingen.banner_titel}
      </div>
      <div style={{
        fontSize: '14px',
        color: 'rgba(255,255,255,0.88)',
        fontFamily: "'Inter', system-ui, sans-serif",
        fontWeight: 400,
      }}>
        {instellingen.banner_subtitel}
      </div>
    </div>
  )
}
