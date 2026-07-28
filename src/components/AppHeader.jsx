// AppHeader.jsx — Full-width merkbalk bovenaan de app
// Zichtbaarheid en tekst worden gelezen uit instellingen (banner_zichtbaar, banner_titel, banner_subtitel)
// Logo = geanimeerde versie via iframe
import { useLocation } from 'react-router-dom'
import { useInstellingen } from '../context/InstellingenContext'

// Geanimeerd logo als iframe (transparante achtergrond, geen border/scroll)
// Aspect ratio van het SVG: 1440:450 ≈ 3.2:1
function AnimatedLogo({ height = 80 }) {
  const width = Math.round(height * 3.2)
  return (
    <iframe
      src="/assets/logo/logo-animated.html"
      title="Build Your Tools"
      scrolling="no"
      frameBorder="0"
      style={{
        width,
        height,
        border: 'none',
        background: 'transparent',
        flexShrink: 0,
        display: 'block',
        overflow: 'hidden',
      }}
      allowTransparency="true"
    />
  )
}

export default function AppHeader() {
  const { pathname } = useLocation()
  const { instellingen } = useInstellingen()

  // Header verbergen als uitgeschakeld in instellingen
  if (instellingen?.banner_zichtbaar === false) return null

  const isWelcome = pathname === '/dashboard' || pathname === '/'
  const titel = instellingen?.banner_titel
  const subtitel = instellingen?.banner_subtitel

  return (
    <header style={{
      flexShrink: 0,
      background: '#0B0F0E',
      padding: '0 32px',
      height: 96,
      display: 'flex',
      alignItems: 'center',
      gap: 28,
      borderBottom: isWelcome
        ? '1px solid rgba(34,195,93,0.12)'
        : '1px solid rgba(255,255,255,0.06)',
    }}>
      <AnimatedLogo height={isWelcome ? 80 : 60} />

      {(titel || subtitel) && (
        <>
          <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
          <div>
            {titel && (
              <p style={{
                margin: 0,
                fontSize: 15,
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
                margin: '2px 0 0',
                fontSize: 12,
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
