// AppHeader.jsx — Full-width merkbalk bovenaan de app
// Leest banner_zichtbaar, banner_titel, banner_subtitel en logo_url uit InstellingenContext
import { useInstellingen } from '../context/InstellingenContext'

const FALLBACK_LOGO = '/assets/logo/logo-reversed.svg'

export default function AppHeader() {
  const { instellingen, laden } = useInstellingen()

  // Verberg header als uitgeschakeld (wacht tot instellingen geladen zijn)
  if (!laden && instellingen?.banner_zichtbaar === false) return null

  const logoSrc = instellingen?.logo_url || FALLBACK_LOGO
  const titel = instellingen?.banner_titel || ''
  const subtitel = instellingen?.banner_subtitel || ''

  return (
    <header style={{
      flexShrink: 0,
      background: '#0B0F0E',
      borderBottom: '1px solid rgba(34,195,93,0.15)',
      padding: '16px 32px',
      display: 'flex',
      alignItems: 'center',
      gap: 28,
    }}>
      <img
        src={logoSrc}
        alt="Build Your Tools"
        style={{ height: 100, objectFit: 'contain', flexShrink: 0 }}
      />

      {(titel || subtitel) && (
        <>
          <div style={{ width: 1, height: 44, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
          <div>
            {titel && (
              <p style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                color: '#FFFFFF',
                fontFamily: "'Space Grotesk', system-ui, sans-serif",
                letterSpacing: '-0.01em',
              }}>
                {titel}
              </p>
            )}
            {subtitel && (
              <p style={{
                margin: '3px 0 0',
                fontSize: 13,
                color: '#7BDFA3',
                fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
              }}>
                {subtitel}
              </p>
            )}
          </div>
        </>
      )}
    </header>
  )
}
